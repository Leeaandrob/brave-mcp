// Common types for Brave Search API responses

export interface BraveSearchParams {
  q: string;
  count?: number;
  offset?: number;
  country?: string;
  [key: string]: any;
}

export interface BraveWebResult {
  title: string;
  url: string;
  description: string;
  age?: string;
  language?: string;
  familyFriendly?: boolean;
}

export interface BraveNewsResult {
  title: string;
  url: string;
  description: string;
  age: string;
  page_age: string;
  thumbnail?: {
    src: string;
  };
  meta_url?: any;
  type: string;
}

export interface BraveImageResult {
  title: string;
  url: string;
  source: string;
  thumbnail: {
    src: string;
    width: number;
    height: number;
  };
  properties: {
    url: string;
    width: number;
    height: number;
  };
  meta_url?: any;
  type: string;
}

export interface BraveVideoResult {
  title: string;
  url: string;
  description: string;
  age: string;
  page_age: string;
  video: {
    duration: string;
    views?: number;
    creator?: string;
    publisher?: string;
  };
  thumbnail?: {
    src: string;
    original?: string;
  };
  meta_url?: any;
  type: string;
}

export interface BraveWebSearchResponse {
  web: {
    results: BraveWebResult[];
    totalResults: number;
  };
}

export interface BraveNewsSearchResponse {
  results: BraveNewsResult[];
  type: string;
  query?: any;
}

export interface BraveImageSearchResponse {
  results: BraveImageResult[];
  type: string;
  query?: any;
  extra?: any;
}

export interface BraveVideoSearchResponse {
  results: BraveVideoResult[];
  type: string;
  query?: any;
  extra?: any;
}