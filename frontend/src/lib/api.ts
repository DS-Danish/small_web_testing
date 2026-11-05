import {
  NavigationMethod,
  Person,
  Site,
  Visit,
} from './types';

const API_URL: string =
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:4000/api';

async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const response: Response = await fetch(
    `${API_URL}${path}`,
    {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers ?? {}),
      },
    },
  );

  if (!response.ok) {
    const text: string =
      await response.text();

    throw new Error(
      text || `Request failed: ${response.status}`,
    );
  }

  return response.json() as Promise<T>;
}

export function getPeople(): Promise<Person[]> {
  return request<Person[]>('/people');
}

export function getSite(
  address: string,
): Promise<Site | null> {
  return request<Site | null>(
    `/sites/${encodeURIComponent(address)}`,
  );
}

export function searchSites(
  query: string,
): Promise<Site[]> {
  return request<Site[]>(
    `/sites/search?q=${encodeURIComponent(query)}`,
  );
}

export function getHistory(
  personId: string,
): Promise<Visit[]> {
  return request<Visit[]>(
    `/history/${personId}`,
  );
}

export function recordVisit(input: {
  personId: string;
  address: string;
  title?: string;
  method: NavigationMethod;
  found: boolean;
}): Promise<Visit> {
  return request<Visit>('/visits', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function publishSite(input: {
  address: string;
  title: string;
  html: string;
  authorId: string;
}): Promise<Site> {
  return request<Site>('/sites', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}