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
  source: string;
  publishedTime: string;
  image?: {
    url: string;
    height: number;
    width: number;
  };
}

export interface BraveImageResult {
  title: string;
  url: string;
  imageUrl: string;
  source: string;
  height: number;
  width: number;
}

export interface BraveVideoResult {
  title: string;
  url: string;
  videoUrl: string;
  source: string;
  duration?: string;
  publishedTime?: string;
  thumbnail?: {
    url: string;
    height: number;
    width: number;
  };
}

export interface BraveWebSearchResponse {
  web: {
    results: BraveWebResult[];
    totalResults: number;
  };
}

export interface BraveNewsSearchResponse {
  news: {
    results: BraveNewsResult[];
    totalResults: number;
  };
}

export interface BraveImageSearchResponse {
  images: {
    results: BraveImageResult[];
    totalResults: number;
  };
}

export interface BraveVideoSearchResponse {
  videos: {
    results: BraveVideoResult[];
    totalResults: number;
  };
}