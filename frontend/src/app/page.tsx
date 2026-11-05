'use client';

import {
  FormEvent,
  MouseEvent as ReactMouseEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  getHistory,
  getPeople,
  getSite,
  publishSite,
  recordVisit,
  searchSites,
} from '@/lib/api';

import {
  NavigationEntry,
  NavigationMethod,
  Person,
  Site,
  Visit,
} from '@/lib/types';

function normalizeAddress(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/+$/, '');
}

export default function HomePage() {
  const [people, setPeople] =
    useState<Person[]>([]);

  const [personId, setPersonId] =
    useState<string>('');

  const [addressInput, setAddressInput] =
    useState<string>('tidepool.zz');

  const [stack, setStack] =
    useState<NavigationEntry[]>([]);

  const [currentIndex, setCurrentIndex] =
    useState<number>(-1);

  const [loading, setLoading] =
    useState<boolean>(false);

  const [message, setMessage] =
    useState<string>('');

  const [panel, setPanel] = useState<
    'none' | 'history' | 'search' | 'publish'
  >('none');

  const [history, setHistory] =
    useState<Visit[]>([]);

  const [searchQuery, setSearchQuery] =
    useState<string>('');

  const [searchResults, setSearchResults] =
    useState<Site[]>([]);

  const [publishAddress, setPublishAddress] =
    useState<string>('');

  const [publishTitle, setPublishTitle] =
    useState<string>('');

  const [publishHtml, setPublishHtml] =
    useState<string>(
      `<main>
  <h1>My Small Website</h1>
  <p>Hello from the small web.</p>
  <a href="tidepool.zz">Visit the tide pool</a>
</main>`,
    );

  const iframeRef =
    useRef<HTMLIFrameElement | null>(null);

  const current: NavigationEntry | undefined =
    stack[currentIndex];

  useEffect(() => {
    async function loadPeople(): Promise<void> {
      try {
        const result: Person[] =
          await getPeople();

        setPeople(result);

        if (result.length > 0) {
          setPersonId(result[0]._id);
        }
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : 'Failed to load people.',
        );
      }
    }

    void loadPeople();
  }, []);

  const saveCurrentScroll = useCallback((): void => {
    if (
      currentIndex < 0 ||
      !iframeRef.current
    ) {
      return;
    }

    try {
      const scrollY: number =
        iframeRef.current.contentWindow
          ?.scrollY ?? 0;

      setStack(
        (previous: NavigationEntry[]) =>
          previous.map(
            (
              entry: NavigationEntry,
              index: number,
            ) =>
              index === currentIndex
                ? {
                    ...entry,
                    scrollY,
                  }
                : entry,
          ),
      );
    } catch {
      // Ignore inaccessible iframe state.
    }
  }, [currentIndex]);

  const record = useCallback(
    async (
      entry: NavigationEntry,
      method: NavigationMethod,
    ): Promise<void> => {
      if (!personId) {
        return;
      }

      try {
        await recordVisit({
          personId,
          address: entry.address,
          title: entry.title,
          method,
          found: entry.found,
        });
      } catch {
        // Browsing should still work if
        // history recording fails.
      }
    },
    [personId],
  );

  const navigate = useCallback(
    async (
      rawAddress: string,
      method: NavigationMethod,
    ): Promise<void> => {
      const address: string =
        normalizeAddress(rawAddress);

      if (!address || !personId) {
        return;
      }

      saveCurrentScroll();

      setLoading(true);
      setMessage('');

      try {
        const site: Site | null =
          await getSite(address);

        const entry: NavigationEntry =
          site
            ? {
                address: site.address,
                title: site.title,
                html: site.html,
                found: true,
                scrollY: 0,
              }
            : {
                address,
                title: 'Address not found',
                html: null,
                found: false,
                scrollY: 0,
              };

        setStack(
          (previous: NavigationEntry[]) => {
            const retained: NavigationEntry[] =
              previous.slice(
                0,
                currentIndex + 1,
              );

            return [...retained, entry];
          },
        );

        setCurrentIndex(
          (previousIndex: number) =>
            previousIndex + 1,
        );

        setAddressInput(address);
        setPanel('none');

        await record(entry, method);
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : 'Navigation failed.',
        );
      } finally {
        setLoading(false);
      }
    },
    [
      currentIndex,
      personId,
      record,
      saveCurrentScroll,
    ],
  );

  function handleAddressSubmit(
    event: FormEvent<HTMLFormElement>,
  ): void {
    event.preventDefault();

    void navigate(
      addressInput,
      'typed',
    );
  }

  async function goBack(): Promise<void> {
    if (currentIndex <= 0) {
      return;
    }

    saveCurrentScroll();

    const nextIndex: number =
      currentIndex - 1;

    const entry: NavigationEntry =
      stack[nextIndex];

    setCurrentIndex(nextIndex);
    setAddressInput(entry.address);

    await record(entry, 'back');
  }

  async function goForward(): Promise<void> {
    if (
      currentIndex < 0 ||
      currentIndex >= stack.length - 1
    ) {
      return;
    }

    saveCurrentScroll();

    const nextIndex: number =
      currentIndex + 1;

    const entry: NavigationEntry =
      stack[nextIndex];

    setCurrentIndex(nextIndex);
    setAddressInput(entry.address);

    await record(entry, 'forward');
  }

  async function openHistory(): Promise<void> {
    if (!personId) {
      return;
    }

    try {
      const result: Visit[] =
        await getHistory(personId);

      setHistory(result);
      setPanel('history');
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Failed to load history.',
      );
    }
  }

  async function handleSearch(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    try {
      const results: Site[] =
        await searchSites(searchQuery);

      setSearchResults(results);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Search failed.',
      );
    }
  }

  async function handlePublish(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (!personId) {
      return;
    }

    try {
      const site: Site =
        await publishSite({
          address: publishAddress,
          title: publishTitle,
          html: publishHtml,
          authorId: personId,
        });

      setMessage(
        `${site.address} was published.`,
      );

      setPublishAddress('');
      setPublishTitle('');

      await navigate(
        site.address,
        'publish',
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Publishing failed.',
      );
    }
  }

  function handleIframeLoad(): void {
    const iframe: HTMLIFrameElement | null =
      iframeRef.current;

    if (!iframe || !current) {
      return;
    }

    try {
      const document: Document | undefined =
        iframe.contentDocument ?? undefined;

      if (!document) {
        return;
      }

      const links: NodeListOf<HTMLAnchorElement> =
        document.querySelectorAll('a[href]');

      links.forEach(
        (link: HTMLAnchorElement) => {
          link.addEventListener(
            'click',
            (
              event: globalThis.MouseEvent,
            ): void => {
              event.preventDefault();

              const href: string | null =
                link.getAttribute('href');

              if (href) {
                void navigate(
                  href,
                  'link',
                );
              }
            },
          );
        },
      );

      iframe.contentWindow?.scrollTo(
        0,
        current.scrollY,
      );
    } catch {
      setMessage(
        'Could not inspect published page links.',
      );
    }
  }

  useEffect(() => {
    if (
      personId &&
      currentIndex === -1
    ) {
      void navigate(
        'tidepool.zz',
        'typed',
      );
    }
  }, [
    personId,
    currentIndex,
    navigate,
  ]);

  return (
    <main className="app">
      <header className="browser-toolbar">
        <div className="toolbar-row">
          <button
            type="button"
            className="icon-button"
            disabled={currentIndex <= 0}
            onClick={() => void goBack()}
            aria-label="Back"
          >
            ←
          </button>

          <button
            type="button"
            className="icon-button"
            disabled={
              currentIndex < 0 ||
              currentIndex >=
                stack.length - 1
            }
            onClick={() =>
              void goForward()
            }
            aria-label="Forward"
          >
            →
          </button>

          <form
            className="address-form"
            onSubmit={handleAddressSubmit}
          >
            <input
              value={addressInput}
              onChange={(event) =>
                setAddressInput(
                  event.target.value,
                )
              }
              placeholder="Enter an address"
              aria-label="Address"
            />

            <button type="submit">
              Go
            </button>
          </form>
        </div>

        <div className="secondary-toolbar">
          <label>
            Browsing as

            <select
              value={personId}
              onChange={(event) => {
                setPersonId(
                  event.target.value,
                );

                setStack([]);
                setCurrentIndex(-1);
              }}
            >
              {people.map(
                (person: Person) => (
                  <option
                    key={person._id}
                    value={person._id}
                  >
                    {person.name}
                  </option>
                ),
              )}
            </select>
          </label>

          <div className="toolbar-actions">
            <button
              type="button"
              onClick={() =>
                setPanel('search')
              }
            >
              Search
            </button>

            <button
              type="button"
              onClick={() =>
                void openHistory()
              }
            >
              History
            </button>

            <button
              type="button"
              onClick={() =>
                setPanel('publish')
              }
            >
              Publish
            </button>
          </div>
        </div>
      </header>

      {message && (
        <div className="message">
          {message}
        </div>
      )}

      <section className="page-meta">
        <div>
          <strong>
            {current?.title ??
              'The Small Web'}
          </strong>

          {current?.found && (
            <span>
              {current.address}
            </span>
          )}
        </div>

        {loading && (
          <span>Loading…</span>
        )}
      </section>

      <section className="viewport">
        {!current && (
          <div className="empty-state">
            Enter an address to begin.
          </div>
        )}

        {current?.found &&
          current.html && (
            <iframe
              key={`${currentIndex}-${current.address}`}
              ref={iframeRef}
              className="site-frame"
              title={current.title}
              srcDoc={current.html}
              sandbox="allow-same-origin"
              onLoad={handleIframeLoad}
            />
          )}

        {current &&
          !current.found && (
            <div className="not-found">
              <div className="error-code">
                404
              </div>

              <h1>
                This address goes nowhere.
              </h1>

              <p>
                No site has been published at{' '}
                <strong>
                  {current.address}
                </strong>
                .
              </p>

              <button
                type="button"
                onClick={() =>
                  void goBack()
                }
                disabled={currentIndex <= 0}
              >
                Go back
              </button>
            </div>
          )}
      </section>

      {panel !== 'none' && (
        <aside className="panel">
          <div className="panel-header">
            <h2>
              {panel === 'search' &&
                'Search the web'}

              {panel === 'history' &&
                'Browsing history'}

              {panel === 'publish' &&
                'Publish a site'}
            </h2>

            <button
              type="button"
              onClick={() =>
                setPanel('none')
              }
            >
              ×
            </button>
          </div>

          {panel === 'search' && (
            <>
              <form
                className="search-form"
                onSubmit={(event) =>
                  void handleSearch(event)
                }
              >
                <input
                  value={searchQuery}
                  onChange={(event) =>
                    setSearchQuery(
                      event.target.value,
                    )
                  }
                  placeholder="Search page contents"
                />

                <button type="submit">
                  Search
                </button>
              </form>

              <div className="result-list">
                {searchResults.map(
                  (site: Site) => (
                    <button
                      type="button"
                      className="result"
                      key={site._id}
                      onClick={() =>
                        void navigate(
                          site.address,
                          'search',
                        )
                      }
                    >
                      <strong>
                        {site.title}
                      </strong>

                      <span>
                        {site.address}
                      </span>

                      <p>
                        {site.textContent.slice(
                          0,
                          160,
                        )}
                        …
                      </p>
                    </button>
                  ),
                )}
              </div>
            </>
          )}

          {panel === 'history' && (
            <div className="result-list">
              {history.map(
                (visit: Visit) => (
                  <button
                    type="button"
                    className="result"
                    key={visit._id}
                    onClick={() =>
                      void navigate(
                        visit.address,
                        'history',
                      )
                    }
                  >
                    <strong>
                      {visit.title ??
                        visit.address}
                    </strong>

                    <span>
                      {visit.address}
                    </span>

                    <small>
                      {visit.method} ·{' '}
                      {new Date(
                        visit.visitedAt,
                      ).toLocaleString()}
                    </small>
                  </button>
                ),
              )}
            </div>
          )}

          {panel === 'publish' && (
            <form
              className="publish-form"
              onSubmit={(event) =>
                void handlePublish(event)
              }
            >
              <label>
                Address
                <input
                  value={publishAddress}
                  onChange={(event) =>
                    setPublishAddress(
                      event.target.value,
                    )
                  }
                  placeholder="my-site.zz"
                  required
                />
              </label>

              <label>
                Title
                <input
                  value={publishTitle}
                  onChange={(event) =>
                    setPublishTitle(
                      event.target.value,
                    )
                  }
                  placeholder="My website"
                  required
                />
              </label>

              <label>
                HTML
                <textarea
                  value={publishHtml}
                  onChange={(event) =>
                    setPublishHtml(
                      event.target.value,
                    )
                  }
                  required
                  rows={16}
                />
              </label>

              <button
                className="primary-button"
                type="submit"
              >
                Publish
              </button>
            </form>
          )}
        </aside>
      )}
    </main>
  );
}