import { BraveSearchService } from '../../services/brave-search.service.js';
import { MCPLogger } from '../../utils/mcp-helpers.js';

export class SearchResultsResource {
  private braveService: BraveSearchService;
  private cache: Map<string, any>;

  constructor() {
    this.braveService = new BraveSearchService();
    this.cache = new Map();
  }

  async read(uri: string) {
    try {
      MCPLogger.logRequest('resource/read', { uri });

      const url = new URL(uri);
      const query = url.searchParams.get('query');
      const type = url.searchParams.get('type') || 'web';
      const count = parseInt(url.searchParams.get('count') || '10');
      
      if (!query) {
        throw new Error('Query parameter required');
      }

      // Check cache first
      const cacheKey = `${type}:${query}:${count}`;
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < 300000) { // 5 minutes cache
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify({
                  ...cached.data,
                  cached: true,
                  cache_age_seconds: Math.floor((Date.now() - cached.timestamp) / 1000),
                }, null, 2),
              },
            ],
          };
        }
      }

      // Fetch fresh results
      const results = await this.getSearchResults(query, type, count);
      
      // Cache results
      this.cache.set(cacheKey, {
        data: results,
        timestamp: Date.now(),
      });

      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(results, null, 2),
          },
        ],
      };

    } catch (error) {
      MCPLogger.logError('Resource read failed', error);
      throw new Error(`Failed to read resource: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async getSearchResults(query: string, type: string, count: number) {
    const timestamp = new Date().toISOString();
    
    try {
      switch (type) {
        case 'web':
          const webResults = await this.braveService.webSearch({ q: query, count });
          return {
            resource_type: 'search_results',
            search_type: 'web',
            query,
            timestamp,
            total_results: webResults.web.totalResults,
            results: webResults.web.results.map((result, index) => ({
              rank: index + 1,
              title: result.title,
              url: result.url,
              description: result.description,
              metadata: {
                age: result.age,
                language: result.language,
                family_friendly: result.familyFriendly,
              },
            })),
          };

        case 'news':
          const newsResults = await this.braveService.newsSearch({ q: query, count });
          return {
            resource_type: 'search_results',
            search_type: 'news',
            query,
            timestamp,
            total_results: newsResults.results.length,
            results: newsResults.results.map((result: any, index: number) => ({
              rank: index + 1,
              title: result.title,
              url: result.url,
              description: result.description,
              source: result.source,
              published_time: result.publishedTime,
              image: result.image,
            })),
          };

        case 'images':
          const imageResults = await this.braveService.imageSearch({ q: query, count });
          return {
            resource_type: 'search_results',
            search_type: 'images',
            query,
            timestamp,
            total_results: imageResults.results.length,
            results: imageResults.results.map((result: any, index: number) => ({
              rank: index + 1,
              title: result.title,
              image_url: result.imageUrl,
              page_url: result.url,
              source: result.source,
              dimensions: {
                width: result.width,
                height: result.height,
              },
            })),
          };

        case 'videos':
          const videoResults = await this.braveService.videoSearch({ q: query, count });
          return {
            resource_type: 'search_results',
            search_type: 'videos',
            query,
            timestamp,
            total_results: videoResults.results.length,
            results: videoResults.results.map((result: any, index: number) => ({
              rank: index + 1,
              title: result.title,
              video_url: result.videoUrl,
              page_url: result.url,
              source: result.source,
              duration: result.duration,
              published_time: result.publishedTime,
              thumbnail: result.thumbnail,
            })),
          };

        default:
          throw new Error(`Unsupported search type: ${type}`);
      }
    } catch (error) {
      // Return error information as part of the resource
      return {
        resource_type: 'search_results',
        search_type: type,
        query,
        timestamp,
        error: true,
        error_message: error instanceof Error ? error.message : 'Unknown error',
        results: [],
      };
    }
  }
}
