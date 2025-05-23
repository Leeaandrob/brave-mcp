// Re-export existing types and add MCP-specific types
export * from '../api/types.js';

// MCP-specific search types
export interface MCPSearchResult {
  rank: number;
  title: string;
  url: string;
  description: string;
  metadata?: Record<string, any>;
}

export interface MCPWebSearchResult extends MCPSearchResult {
  metadata: {
    age?: string;
    language?: string;
    family_friendly?: boolean;
  };
}

export interface MCPNewsSearchResult extends MCPSearchResult {
  source: string;
  published_time: string;
  image?: {
    url: string;
    dimensions: string;
  };
}

export interface MCPImageSearchResult {
  rank: number;
  title: string;
  image_url: string;
  page_url: string;
  source: string;
  dimensions: {
    width: number;
    height: number;
    aspect_ratio: string;
  };
  file_size?: string;
}

export interface MCPVideoSearchResult {
  rank: number;
  title: string;
  video_url: string;
  page_url: string;
  source: string;
  duration: string;
  duration_seconds?: number | null;
  published_time?: string;
  thumbnail?: {
    url: string;
    dimensions: string;
  };
}

export interface MCPSearchResponse {
  query: string;
  search_type: 'web' | 'news' | 'images' | 'videos';
  total_results: number;
  results_count: number;
  results: MCPSearchResult[];
  search_metadata: {
    timestamp: string;
    [key: string]: any;
  };
}

export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
}

export interface MCPResourceDefinition {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

export interface MCPPromptDefinition {
  name: string;
  description: string;
  arguments: Array<{
    name: string;
    description: string;
    required: boolean;
  }>;
}
