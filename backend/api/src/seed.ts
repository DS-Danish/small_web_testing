import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';

import { Model } from 'mongoose';

import { AppModule } from './app.module';

import {
  Person,
  PersonDocument,
  Site,
  SiteDocument,
  Visit,
  VisitDocument,
} from './models';

interface SeedSite {
  address: string;
  title: string;
  author: string;
  html: string;
}

function extractText(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function seed(): Promise<void> {
  const app =
    await NestFactory.createApplicationContext(AppModule);

  const people =
    app.get<Model<PersonDocument>>(
      getModelToken(Person.name),
    );

  const sites =
    app.get<Model<SiteDocument>>(
      getModelToken(Site.name),
    );

  const visits =
    app.get<Model<VisitDocument>>(
      getModelToken(Visit.name),
    );

  await visits.deleteMany({});
  await sites.deleteMany({});
  await people.deleteMany({});

  const peopleNames: string[] = [
    'Ada',
    'Mina',
    'Noah',
    'Sam',
    'Theo',
  ];

  const peopleDocs: PersonDocument[] =
    await people.insertMany(
      peopleNames.map((name: string) => ({
        name,
      })),
    );

  const personByName = new Map<string, PersonDocument>();

  for (const person of peopleDocs) {
    personByName.set(person.name, person);
  }

  const seedSites: SeedSite[] = [
    {
      address: 'tidepool.zz',
      title: 'Notes From the Tide Pool',
      author: 'Ada',
      html: `
        <main>
          <h1>Notes From the Tide Pool</h1>
          <p>
            At low tide the rocks become a temporary city.
            Crabs hide beneath stones while tiny fish wait
            in pools for the ocean to return.
          </p>
          <p>
            I started keeping these notes after reading
            <a href="moonlight.zz">Moonlight Observatory</a>.
          </p>
          <p>
            You may also enjoy
            <a href="moss.zz">The Moss Journal</a>.
          </p>
        </main>
      `,
    },

    {
      address: 'moonlight.zz',
      title: 'Moonlight Observatory',
      author: 'Mina',
      html: `
        <main>
          <h1>Moonlight Observatory</h1>
          <p>
            The best observations do not require expensive
            telescopes. A dark roof and patience are enough.
          </p>
          <p>
            Tonight I watched Jupiter rise above the houses.
          </p>
          <a href="stars.zz">Read the star log</a>
          <br />
          <a href="tidepool.zz">Return to the coast</a>
        </main>
      `,
    },

    {
      address: 'moss.zz',
      title: 'The Moss Journal',
      author: 'Ada',
      html: `
        <main>
          <h1>The Moss Journal</h1>
          <p>
            Moss rewards people who walk slowly.
            Entire forests can exist on a fallen brick.
          </p>
          <p>
            A walk through the rain led me to
            <a href="rain.zz">Rain Notes</a>.
          </p>
        </main>
      `,
    },

    {
      address: 'stars.zz',
      title: 'Star Log',
      author: 'Mina',
      html: `
        <main>
          <h1>Star Log</h1>
          <p>
            Vega was visible shortly after sunset.
            The northern sky remained unusually clear.
          </p>
          <a href="maps.zz">See the map room</a>
        </main>
      `,
    },

    {
      address: 'maps.zz',
      title: 'The Map Room',
      author: 'Noah',
      html: `
        <main>
          <h1>The Map Room</h1>
          <p>
            Maps are arguments about what deserves attention.
            Every map leaves something outside its border.
          </p>
          <a href="library.zz">Visit the library</a>
          <br />
          <a href="lost-road.zz">Follow an uncertain road</a>
        </main>
      `,
    },

    {
      address: 'library.zz',
      title: 'Small Library',
      author: 'Noah',
      html: `
        <main>
          <h1>Small Library</h1>
          <p>
            This library contains notes on exploration,
            weather, gardens, architecture and forgotten
            books.
          </p>
          <a href="garden.zz">Garden notebook</a>
        </main>
      `,
    },

    {
      address: 'garden.zz',
      title: 'Back Garden',
      author: 'Sam',
      html: `
        <main>
          <h1>Back Garden</h1>
          <p>
            Tomatoes have taken over the south wall.
            Bees arrive every afternoon around three.
          </p>
          <a href="kitchen.zz">Kitchen experiments</a>
        </main>
      `,
    },

    {
      address: 'kitchen.zz',
      title: 'Kitchen Experiments',
      author: 'Sam',
      html: `
        <main>
          <h1>Kitchen Experiments</h1>
          <p>
            Bread improves when the dough is given enough
            time. Most rushed recipes hide this fact.
          </p>
          <a href="rain.zz">Something to read while waiting</a>
        </main>
      `,
    },

    {
      address: 'rain.zz',
      title: 'Rain Notes',
      author: 'Theo',
      html: `
        <main>
          <h1>Rain Notes</h1>
          <p>
            Heavy rain arrived shortly before dawn.
            By breakfast the streets reflected the entire sky.
          </p>
          <a href="station.zz">Walk to the station</a>
        </main>
      `,
    },

    {
      address: 'station.zz',
      title: 'Last Station',
      author: 'Theo',
      html: `
        <main>
          <h1>Last Station</h1>
          <p>
            The last train leaves after midnight.
            The platform is quiet except for a vending machine.
          </p>
          <a href="moonlight.zz">Look at the night sky</a>
          <br />
          <a href="ghost.zz">A link that goes nowhere</a>
        </main>
      `,
    },
  ];

  for (const item of seedSites) {
    const author: PersonDocument | undefined =
      personByName.get(item.author);

    if (!author) {
      throw new Error(
        `Missing author: ${item.author}`,
      );
    }

    await sites.create({
      address: item.address,
      title: item.title,
      html: item.html,
      textContent: extractText(item.html),
      authorId: author.id,
      authorName: author.name,
    });
  }

  const savedSites: SiteDocument[] =
    await sites.find().exec();

  const siteMap = new Map<string, SiteDocument>();

  for (const site of savedSites) {
    siteMap.set(site.address, site);
  }

  const startTime = new Date(
    '2026-11-01T12:00:00.000Z',
  );

  let offsetMinutes = 0;

  for (const person of peopleDocs) {
    const trail: string[] = [
      'tidepool.zz',
      'moonlight.zz',
      'stars.zz',
      'maps.zz',
      'library.zz',
      'garden.zz',
      'kitchen.zz',
      'rain.zz',
      'station.zz',
    ];

    const count: number =
      person.name === 'Ada'
        ? trail.length
        : 5;

    for (let index = 0; index < count; index += 1) {
      const address: string =
        trail[
          (index + peopleDocs.indexOf(person)) %
            trail.length
        ];

      const site: SiteDocument | undefined =
        siteMap.get(address);

      await visits.create({
        personId: person.id,
        personName: person.name,
        address,
        title: site?.title,
        method:
          index === 0
            ? 'typed'
            : 'link',
        found: Boolean(site),
        visitedAt: new Date(
          startTime.getTime() +
            offsetMinutes * 60_000,
        ),
      });

      offsetMinutes += 2;
    }
  }

  console.log('Seed complete.');
  console.log(
    `${peopleDocs.length} people created.`,
  );
  console.log(
    `${savedSites.length} sites created.`,
  );

  await app.close();
}

void seed();