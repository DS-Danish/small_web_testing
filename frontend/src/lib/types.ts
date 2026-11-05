export interface Person {
  _id: string;
  name: string;
}

export interface Site {
  _id: string;
  address: string;
  title: string;
  html: string;
  textContent: string;
  authorId: string;
  authorName: string;
}

export type NavigationMethod =
  | 'typed'
  | 'link'
  | 'back'
  | 'forward'
  | 'history'
  | 'search'
  | 'publish';

export interface Visit {
  _id: string;
  personId: string;
  personName: string;
  address: string;
  title?: string;
  method: NavigationMethod;
  found: boolean;
  visitedAt: string;
}

export interface NavigationEntry {
  address: string;
  title: string;
  html: string | null;
  found: boolean;
  scrollY: number;
}