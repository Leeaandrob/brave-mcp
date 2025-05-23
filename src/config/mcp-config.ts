import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export interface MCPConfig {
  server: {
    name: string;
    version: string;
    description: string;
  };
  brave: {
    apiKey: string;
    apiUrl: string;
    timeout: number;
  };
  redis?: {
    url: string;
  };
  cache: {
    enabled: boolean;
    ttl: number;
  };
  limits: {
    maxQueryLength: number;
    maxResults: number;
    rateLimitPerMinute: number;
  };
  logging: {
    level: string;
    enableAPILogs: boolean;
    enablePerformanceLogs: boolean;
  };
}

export const mcpConfig: MCPConfig = {
  server: {
    name: 'brave-search-mcp',
    version: '1.0.0',
    description: 'Production-ready MCP server for Brave Search API integration with comprehensive search capabilities',
  },
  brave: {
    apiKey: process.env.BRAVE_API_KEY || '',
    apiUrl: process.env.BRAVE_API_URL || 'https://api.search.brave.com/res/v1',
    timeout: parseInt(process.env.BRAVE_TIMEOUT || '30000'),
  },
  cache: {
    enabled: false, // Disable caching
    ttl: parseInt(process.env.CACHE_TTL || '300'), // 5 minutes default
  },
  limits: {
    maxQueryLength: parseInt(process.env.MAX_QUERY_LENGTH || '500'),
    maxResults: parseInt(process.env.MAX_RESULTS || '50'),
    rateLimitPerMinute: parseInt(process.env.RATE_LIMIT_PER_MINUTE || '100'),
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableAPILogs: process.env.ENABLE_API_LOGS === 'true',
    enablePerformanceLogs: process.env.ENABLE_PERFORMANCE_LOGS === 'true',
  },
};

// ... (rest of the code remains the same)
