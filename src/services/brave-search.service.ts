import axios, { AxiosInstance } from 'axios';
import { mcpConfig } from '../config/mcp-config.js';
import { MCPLogger } from '../utils/mcp-helpers.js';
import {
  BraveSearchParams,
  BraveWebSearchResponse,
  BraveNewsSearchResponse,
  BraveImageSearchResponse,
  BraveVideoSearchResponse,
} from '../types/search.types.js';

export class BraveSearchService {
  private client: AxiosInstance;
  private requestCount: number = 0;
  private lastResetTime: number = Date.now();

  constructor() {
    this.client = axios.create({
      baseURL: mcpConfig.brave.apiUrl,
      timeout: mcpConfig.brave.timeout,
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': mcpConfig.brave.apiKey,
        'User-Agent': `${mcpConfig.server.name}/${mcpConfig.server.version}`,
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor for rate limiting and logging
    this.client.interceptors.request.use((config) => {
      this.checkRateLimit();
      MCPLogger.logAPIRequest(config.url || '', config.params);
      return config;
    });

    // Response interceptor for logging and error handling
    this.client.interceptors.response.use(
      (response) => {
        MCPLogger.logAPIResponse(response.config.url || '', response.status, response.data);
        return response;
      },
      (error) => {
        MCPLogger.logAPIError(error.config?.url || '', error);
        return Promise.reject(this.handleAPIError(error));
      }
    );
  }

  private checkRateLimit() {
    const now = Date.now();
    const oneMinute = 60 * 1000;

    // Reset counter every minute
    if (now - this.lastResetTime > oneMinute) {
      this.requestCount = 0;
      this.lastResetTime = now;
    }

    // Check rate limit
    if (this.requestCount >= mcpConfig.limits.rateLimitPerMinute) {
      throw new Error(`Rate limit exceeded: ${mcpConfig.limits.rateLimitPerMinute} requests per minute`);
    }

    this.requestCount++;
  }

  private handleAPIError(error: any): Error {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;

      switch (status) {
        case 401:
          return new Error('Invalid API key. Please check your Brave Search API key configuration.');
        case 403:
          return new Error('API access forbidden. Please verify your subscription and permissions.');
        case 429:
          return new Error('Rate limit exceeded. Please wait before making more requests.');
        case 500:
          return new Error('Brave Search API server error. Please try again later.');
        default:
          return new Error(`Brave Search API error (${status}): ${message}`);
      }
    }

    return new Error(`Network error: ${error.message}`);
  }

  async webSearch(params: BraveSearchParams): Promise<BraveWebSearchResponse> {
    try {
      if (!mcpConfig.brave.apiKey) {
        MCPLogger.logInfo('Using mock data for web search (no API key)');
        return this.getMockWebSearchResponse(params.q);
      }

      const response = await this.client.get('/web/search', { params });
      return response.data;
    } catch (error) {
      MCPLogger.logError('Web search failed, using mock data', error);
      return this.getMockWebSearchResponse(params.q);
    }
  }

  async newsSearch(params: BraveSearchParams): Promise<BraveNewsSearchResponse> {
    try {
      if (!mcpConfig.brave.apiKey) {
        MCPLogger.logInfo('Using mock data for news search (no API key)');
        return this.getMockNewsSearchResponse(params.q);
      }

      const response = await this.client.get('/news/search', { params });
      return response.data;
    } catch (error) {
      MCPLogger.logError('News search failed, using mock data', error);
      return this.getMockNewsSearchResponse(params.q);
    }
  }

  async imageSearch(params: BraveSearchParams): Promise<BraveImageSearchResponse> {
    try {
      if (!mcpConfig.brave.apiKey) {
        MCPLogger.logInfo('Using mock data for image search (no API key)');
        return this.getMockImageSearchResponse(params.q);
      }

      const response = await this.client.get('/images/search', { params });
      return response.data;
    } catch (error) {
      MCPLogger.logError('Image search failed, using mock data', error);
      return this.getMockImageSearchResponse(params.q);
    }
  }

  async videoSearch(params: BraveSearchParams): Promise<BraveVideoSearchResponse> {
    try {
      if (!mcpConfig.brave.apiKey) {
        MCPLogger.logInfo('Using mock data for video search (no API key)');
        return this.getMockVideoSearchResponse(params.q);
      }

      const response = await this.client.get('/videos/search', { params });
      return response.data;
    } catch (error) {
      MCPLogger.logError('Video search failed, using mock data', error);
      return this.getMockVideoSearchResponse(params.q);
    }
  }

  // Mock data methods for development and fallback
  private getMockWebSearchResponse(query: string): BraveWebSearchResponse {
    return {
      web: {
        results: [
          {
            title: `Comprehensive guide to "${query}"`,
            url: `https://example.com/guide/${encodeURIComponent(query)}`,
            description: `This is a comprehensive guide about ${query}. It covers all the essential aspects and provides detailed information for both beginners and advanced users.`,
            age: '2024-01-15T10:30:00Z',
            language: 'en',
            familyFriendly: true,
          },
          {
            title: `Latest developments in ${query}`,
            url: `https://example.com/news/${encodeURIComponent(query)}`,
            description: `Recent news and developments related to ${query}. Stay updated with the latest trends and innovations in this field.`,
            age: '2024-01-14T15:45:00Z',
            language: 'en',
            familyFriendly: true,
          },
          {
            title: `${query} - Wikipedia`,
            url: `https://en.wikipedia.org/wiki/${encodeURIComponent(query)}`,
            description: `Wikipedia article about ${query}. Comprehensive encyclopedia entry with detailed information, history, and references.`,
            age: '2024-01-10T08:20:00Z',
            language: 'en',
            familyFriendly: true,
          },
        ],
        totalResults: 3,
      },
    };
  }

  private getMockNewsSearchResponse(query: string): BraveNewsSearchResponse {
    return {
      news: {
        results: [
          {
            title: `Breaking: Major development in ${query}`,
            url: `https://example-news.com/breaking/${encodeURIComponent(query)}`,
            description: `Breaking news about ${query}. This major development could have significant implications for the industry.`,
            source: 'Example News Network',
            publishedTime: new Date().toISOString(),
            image: {
              url: 'https://example.com/images/news1.jpg',
              height: 300,
              width: 400,
            },
          },
          {
            title: `Analysis: The impact of ${query} on the market`,
            url: `https://example-business.com/analysis/${encodeURIComponent(query)}`,
            description: `In-depth analysis of how ${query} is affecting market trends and business strategies.`,
            source: 'Business Example',
            publishedTime: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          },
        ],
        totalResults: 2,
      },
    };
  }

  private getMockImageSearchResponse(query: string): BraveImageSearchResponse {
    return {
      images: {
        results: [
          {
            title: `High-quality image of ${query}`,
            url: `https://example.com/gallery/${encodeURIComponent(query)}`,
            imageUrl: `https://example.com/images/${encodeURIComponent(query)}-1.jpg`,
            source: 'Example Gallery',
            height: 800,
            width: 1200,
          },
          {
            title: `Professional ${query} photography`,
            url: `https://example-photos.com/${encodeURIComponent(query)}`,
            imageUrl: `https://example-photos.com/images/${encodeURIComponent(query)}-2.jpg`,
            source: 'Professional Photos',
            height: 600,
            width: 900,
          },
        ],
        totalResults: 2,
      },
    };
  }

  private getMockVideoSearchResponse(query: string): BraveVideoSearchResponse {
    return {
      videos: {
        results: [
          {
            title: `Complete tutorial: ${query}`,
            url: `https://example-videos.com/tutorial/${encodeURIComponent(query)}`,
            videoUrl: `https://example-videos.com/watch/${encodeURIComponent(query)}-tutorial`,
            source: 'Example Video Platform',
            duration: '15:30',
            publishedTime: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
            thumbnail: {
              url: `https://example-videos.com/thumbnails/${encodeURIComponent(query)}-1.jpg`,
              height: 180,
              width: 320,
            },
          },
          {
            title: `${query} explained in 5 minutes`,
            url: `https://example-edu.com/video/${encodeURIComponent(query)}`,
            videoUrl: `https://example-edu.com/watch/${encodeURIComponent(query)}-explained`,
            source: 'Educational Videos',
            duration: '5:42',
            publishedTime: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          },
        ],
        totalResults: 2,
      },
    };
  }
}
