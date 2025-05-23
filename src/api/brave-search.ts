import axios, { AxiosInstance } from 'axios';
import config from '../config.js';
import {
  BraveSearchParams,
  BraveWebSearchResponse,
  BraveNewsSearchResponse,
  BraveImageSearchResponse,
  BraveVideoSearchResponse,
} from './types.js';

class BraveSearchClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.braveApiUrl,
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': config.braveApiKey,
      },
    });
    
    // Debug log
    console.log('Brave Search API URL:', config.braveApiUrl);
    console.log('API Key configured:', config.braveApiKey ? 'Yes (value not shown for security)' : 'No');
  }

  async webSearch(params: BraveSearchParams): Promise<BraveWebSearchResponse> {
    // Try to use the API even if the key seems to be the default value
    try {
      console.log('Trying to connect to Brave Search API...');
      console.log('Request parameters:', JSON.stringify(params));
      
      // Show the headers being sent (without showing the complete key)
      const headers = this.client.defaults.headers;
      const token = headers['X-Subscription-Token'];
      console.log('Request headers:', {
        ...headers,
        'X-Subscription-Token': token ? 
          `${typeof token === 'string' ? token.substring(0, 4) : '****'}...` : 'not defined'
      });
      
      const response = await this.client.get('/web/search', { params });
      console.log('Connection to Brave Search API successful!');
      return response.data;
    } catch (error) {
      this.handleError(error);
      console.log('Returning example data after API error');
      return this.getMockWebSearchResponse(params.q);
    }
  }

  async newsSearch(params: BraveSearchParams): Promise<BraveNewsSearchResponse> {
    // If no API key, return example data
    if (!config.braveApiKey) {
      console.log('Using example data for newsSearch (API key not provided)');
      return this.getMockNewsSearchResponse(params.q);
    }
    
    try {
      const response = await this.client.get('/news/search', { params });
      return response.data;
    } catch (error) {
      this.handleError(error);
      console.log('Returning example data after API error');
      return this.getMockNewsSearchResponse(params.q);
    }
  }
  
  // Method to generate example data for news search
  public getMockNewsSearchResponse(query: string): BraveNewsSearchResponse {
    return {
      news: {
        results: [
          {
            title: `Example news about "${query}"`,
            url: 'https://example.com/news/1',
            description: `This is an example news item related to "${query}".`,
            source: 'Example Source',
            publishedTime: new Date().toISOString()
          },
          {
            title: `Another news about "${query}"`,
            url: 'https://example.com/news/2',
            description: 'This is a second example news item.',
            source: 'Example Newspaper',
            publishedTime: new Date().toISOString(),
            image: {
              url: 'https://example.com/images/news.jpg',
              height: 300,
              width: 400
            }
          }
        ],
        totalResults: 2
      }
    };
  }

  async imageSearch(params: BraveSearchParams): Promise<BraveImageSearchResponse> {
    // If no API key, return example data
    if (!config.braveApiKey) {
      console.log('Using example data for imageSearch (API key not provided)');
      return this.getMockImageSearchResponse(params.q);
    }
    
    try {
      const response = await this.client.get('/images/search', { params });
      return response.data;
    } catch (error) {
      this.handleError(error);
      console.log('Returning example data after API error');
      return this.getMockImageSearchResponse(params.q);
    }
  }
  
  // Method to generate example data for image search
  public getMockImageSearchResponse(query: string): BraveImageSearchResponse {
    return {
      images: {
        results: [
          {
            title: `Example image for "${query}"`,
            url: 'https://example.com/page1',
            imageUrl: 'https://example.com/images/1.jpg',
            source: 'Example Source',
            height: 600,
            width: 800
          },
          {
            title: `Another image related to "${query}"`,
            url: 'https://example.com/page2',
            imageUrl: 'https://example.com/images/2.jpg',
            source: 'Example Gallery',
            height: 400,
            width: 600
          }
        ],
        totalResults: 2
      }
    };
  }

  async videoSearch(params: BraveSearchParams): Promise<BraveVideoSearchResponse> {
    // If no API key, return example data
    if (!config.braveApiKey) {
      console.log('Using example data for videoSearch (API key not provided)');
      return this.getMockVideoSearchResponse(params.q);
    }
    
    try {
      const response = await this.client.get('/videos/search', { params });
      return response.data;
    } catch (error) {
      this.handleError(error);
      console.log('Returning example data after API error');
      return this.getMockVideoSearchResponse(params.q);
    }
  }
  
  // Method to generate example data for video search
  public getMockVideoSearchResponse(query: string): BraveVideoSearchResponse {
    return {
      videos: {
        results: [
          {
            title: `Example video about "${query}"`,
            url: 'https://example.com/videos/1',
            videoUrl: 'https://example.com/videos/1.mp4',
            source: 'Example Platform',
            duration: '3:45',
            publishedTime: new Date().toISOString(),
            thumbnail: {
              url: 'https://example.com/thumbnails/1.jpg',
              height: 180,
              width: 320
            }
          },
          {
            title: `Tutorial about "${query}"`,
            url: 'https://example.com/videos/2',
            videoUrl: 'https://example.com/videos/2.mp4',
            source: 'Example Channel',
            duration: '5:20',
            publishedTime: new Date().toISOString()
          }
        ],
        totalResults: 2
      }
    };
  }

  private handleError(error: any): void {
    if (axios.isAxiosError(error)) {
      console.error('Brave Search API Error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });
      
      // More specific error messages
      if (error.response?.status === 401 || error.response?.status === 422) {
        console.error('Authentication error: Verify that your Brave Search API key is valid in the .env file');
      } else if (error.response?.status === 429) {
        console.error('Rate limit exceeded: You have reached the API request limit');
      }
    } else {
      console.error('Unexpected error:', error);
    }
  }
  
  // Method to generate example data for web search
  public getMockWebSearchResponse(query: string): BraveWebSearchResponse {
    console.log(`Generating example results for query: "${query}"`);
    
    return {
      web: {
        results: [
          {
            title: `Example result 1 for "${query}"`,
            url: 'https://example.com/1',
            description: `This is an example description for the query "${query}". This result is generated locally because it was not possible to connect to the Brave Search API.`
          },
          {
            title: `Example result 2 for "${query}"`,
            url: 'https://example.com/2',
            description: 'Example results are shown when the API key is not configured or is invalid.'
          },
          {
            title: 'How to get a Brave Search API key',
            url: 'https://brave.com/search/api/',
            description: 'Visit the Brave Search website to get a valid API key and configure it in the project\'s .env file.'
          }
        ],
        totalResults: 3
      }
    };
  }
}

export default new BraveSearchClient();
