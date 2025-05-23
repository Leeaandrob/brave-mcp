import express, { Response } from 'express';
import cors from 'cors';
import config from './config.js';
import braveSearchClient from './api/brave-search.js';

/**
 * Implementation of a JSON-RPC server for Brave Search with SSE support and MCP compatibility
 */
export async function startDirectServer(): Promise<express.Express> {
  const app = express();
  
  // Enable CORS to allow requests from different origins
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Accept'],
    exposedHeaders: ['Content-Type']
  }));
  
  // Middleware to process JSON
  app.use(express.json());
  
  // MCP Tools definitions
  const mcpTools = {
    search_web: {
      name: 'search_web',
      description: 'Search the web using Brave Search API',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The search query'
          },
          count: {
            type: 'number',
            description: 'Number of results to return (default: 10)',
            default: 10
          },
          country: {
            type: 'string',
            description: 'Country code for localized results (optional)'
          }
        },
        required: ['query']
      }
    },
    search_news: {
      name: 'search_news',
      description: 'Search for news articles using Brave Search API',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The news search query'
          },
          count: {
            type: 'number',
            description: 'Number of results to return (default: 10)',
            default: 10
          },
          freshness: {
            type: 'string',
            description: 'Freshness of news (e.g., "pd" for past day)',
            enum: ['pd', 'pw', 'pm', 'py']
          }
        },
        required: ['query']
      }
    },
    search_images: {
      name: 'search_images',
      description: 'Search for images using Brave Search API',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The image search query'
          },
          count: {
            type: 'number',
            description: 'Number of results to return (default: 10)',
            default: 10
          },
          size: {
            type: 'string',
            description: 'Image size filter',
            enum: ['small', 'medium', 'large', 'wallpaper']
          }
        },
        required: ['query']
      }
    },
    search_videos: {
      name: 'search_videos',
      description: 'Search for videos using Brave Search API',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The video search query'
          },
          count: {
            type: 'number',
            description: 'Number of results to return (default: 10)',
            default: 10
          },
          duration: {
            type: 'string',
            description: 'Video duration filter',
            enum: ['short', 'medium', 'long']
          }
        },
        required: ['query']
      }
    }
  };
  
  // Main JSON-RPC endpoint with SSE support and MCP compatibility
  app.post('/mcp', async (req, res) => {
    // Configure headers for SSE if the client accepts this format
    const acceptHeader = req.headers.accept || '';
    const wantsSSE = acceptHeader.includes('text/event-stream');
    
    if (wantsSSE) {
      // Configure headers for SSE
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      // Send an initial event to confirm the connection
      res.write('event: message\n');
      res.write(`data: {"jsonrpc":"2.0","id":null,"result":"SSE connection established"}\n\n`);
    }
    
    try {
      console.log('Request received:', JSON.stringify(req.body, null, 2));
      
      const { jsonrpc, method, id, params } = req.body;
      
      // Check if it's a valid JSON-RPC request
      if (jsonrpc !== '2.0') {
        const errorResponse = {
          jsonrpc: '2.0',
          error: { code: -32600, message: 'Invalid Request' },
          id: id || null
        };
        
        return sendResponse(res, errorResponse, wantsSSE);
      }
      
      // Handle MCP protocol methods
      if (method === 'initialize') {
        const successResponse = {
          jsonrpc: '2.0',
          result: {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {}
            },
            serverInfo: {
              name: 'brave-search-mcp',
              version: '1.0.0'
            }
          },
          id
        };
        
        return sendResponse(res, successResponse, wantsSSE);
      }
      
      if (method === 'tools/list') {
        const successResponse = {
          jsonrpc: '2.0',
          result: {
            tools: Object.values(mcpTools)
          },
          id
        };
        
        return sendResponse(res, successResponse, wantsSSE);
      }
      
      if (method === 'tools/call') {
        const toolName = params.name;
        const toolArguments = params.arguments || {};
        
        if (!(toolName in mcpTools)) {
          const errorResponse = {
            jsonrpc: '2.0',
            error: { code: -32602, message: `Tool '${toolName}' not found` },
            id
          };
          
          return sendResponse(res, errorResponse, wantsSSE);
        }
        
        // Execute the tool based on its name
        try {
          let result;
          
          switch (toolName) {
            case 'search_web':
              result = await executeWebSearch(toolArguments, wantsSSE, res, id);
              break;
            case 'search_news':
              result = await executeNewsSearch(toolArguments, wantsSSE, res, id);
              break;
            case 'search_images':
              result = await executeImageSearch(toolArguments, wantsSSE, res, id);
              break;
            case 'search_videos':
              result = await executeVideoSearch(toolArguments, wantsSSE, res, id);
              break;
            default:
              throw new Error(`Tool '${toolName}' not implemented`);
          }
          
          const successResponse = {
            jsonrpc: '2.0',
            result: {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2)
                }
              ]
            },
            id
          };
          
          return sendResponse(res, successResponse, wantsSSE);
        } catch (error) {
          console.error(`Error executing tool '${toolName}':`, error);
          
          const errorResponse = {
            jsonrpc: '2.0',
            error: { 
              code: -32603, 
              message: error instanceof Error ? error.message : 'Unknown error' 
            },
            id
          };
          
          return sendResponse(res, errorResponse, wantsSSE);
        }
      }
      
      // Legacy methods for backward compatibility
      if (method === 'search_web') {
        console.log('Processing search_web method with parameters:', params);
        
        const query = params.query;
        const count = params.count || 10;
        const country = params.country;
        
        if (!query) {
          const errorResponse = {
            jsonrpc: '2.0',
            error: { code: -32602, message: 'Invalid params: query is required' },
            id
          };
          
          return sendResponse(res, errorResponse, wantsSSE);
        }
        
        try {
          const result = await executeWebSearch({ query, count, country }, wantsSSE, res, id);
          
          const successResponse = {
            jsonrpc: '2.0',
            result: {
              content: [{
                type: 'text',
                text: JSON.stringify(result, null, 2)
              }],
              structuredContent: {
                results: result
              }
            },
            id
          };
          
          return sendResponse(res, successResponse, wantsSSE);
        } catch (error) {
          console.error('Error in web search:', error);
          
          const errorResponse = {
            jsonrpc: '2.0',
            error: { 
              code: -32603, 
              message: error instanceof Error ? error.message : 'Internal error during search' 
            },
            id
          };
          
          return sendResponse(res, errorResponse, wantsSSE);
        }
      } else if (method === 'search_news') {
        console.log('Processing search_news method with parameters:', params);

        const query = params.query;
        const count = params.count || 10;
        const freshness = params.freshness;

        if (!query) {
          const errorResponse = {
            jsonrpc: '2.0',
            error: { code: -32602, message: 'Invalid params: query is required' },
            id
          };
          return sendResponse(res, errorResponse, wantsSSE);
        }

        try {
          const result = await executeNewsSearch({ query, count, freshness }, wantsSSE, res, id);
          
          const successResponse = {
            jsonrpc: '2.0',
            result: {
              content: [{
                type: 'text',
                text: JSON.stringify(result, null, 2)
              }],
              structuredContent: {
                results: result
              }
            },
            id
          };
          
          return sendResponse(res, successResponse, wantsSSE);
        } catch (error) {
          console.error('Error in news search:', error);
          const errorResponse = {
            jsonrpc: '2.0',
            error: { 
              code: -32603, 
              message: error instanceof Error ? error.message : 'Internal error during news search' 
            },
            id
          };
          return sendResponse(res, errorResponse, wantsSSE);
        }
      } else if (method === 'search_images') {
        console.log('Processing search_images method with parameters:', params);

        const query = params.query;
        const count = params.count || 10;
        const size = params.size;

        if (!query) {
          const errorResponse = {
            jsonrpc: '2.0',
            error: { code: -32602, message: 'Invalid params: query is required' },
            id
          };
          return sendResponse(res, errorResponse, wantsSSE);
        }

        try {
          const result = await executeImageSearch({ query, count, size }, wantsSSE, res, id);
          
          const successResponse = {
            jsonrpc: '2.0',
            result: {
              content: [{
                type: 'text',
                text: JSON.stringify(result, null, 2)
              }],
              structuredContent: {
                results: result
              }
            },
            id
          };
          
          return sendResponse(res, successResponse, wantsSSE);
        } catch (error) {
          console.error('Error in image search:', error);
          const errorResponse = {
            jsonrpc: '2.0',
            error: { 
              code: -32603, 
              message: error instanceof Error ? error.message : 'Internal error during image search' 
            },
            id
          };
          return sendResponse(res, errorResponse, wantsSSE);
        }
      } else if (method === 'search_videos') {
        console.log('Processing search_videos method with parameters:', params);

        const query = params.query;
        const count = params.count || 10;
        const duration = params.duration;

        if (!query) {
          const errorResponse = {
            jsonrpc: '2.0',
            error: { code: -32602, message: 'Invalid params: query is required' },
            id
          };
          return sendResponse(res, errorResponse, wantsSSE);
        }

        try {
          const result = await executeVideoSearch({ query, count, duration }, wantsSSE, res, id);
          
          const successResponse = {
            jsonrpc: '2.0',
            result: {
              content: [{
                type: 'text',
                text: JSON.stringify(result, null, 2)
              }],
              structuredContent: {
                results: result
              }
            },
            id
          };
          
          return sendResponse(res, successResponse, wantsSSE);
        } catch (error) {
          console.error('Error in video search:', error);
          const errorResponse = {
            jsonrpc: '2.0',
            error: { 
              code: -32603, 
              message: error instanceof Error ? error.message : 'Internal error during video search' 
            },
            id
          };
          return sendResponse(res, errorResponse, wantsSSE);
        }
      }
      else {
        // Method not found
        const errorResponse = {
          jsonrpc: '2.0',
          error: { code: -32601, message: 'Method not found' },
          id
        };
        
        return sendResponse(res, errorResponse, wantsSSE);
      }
    } catch (error) {
      console.error('Error processing request:', error);
      
      const errorResponse = {
        jsonrpc: '2.0',
        error: { 
          code: -32603, 
          message: error instanceof Error ? error.message : 'Internal server error' 
        },
        id: req.body?.id || null
      };
      
      return sendResponse(res, errorResponse, wantsSSE);
    }
  });
  
  // Tool execution functions
  async function executeWebSearch(params: any, wantsSSE: boolean, res: Response, id: any) {
    const { query, count = 10, country } = params;
    
    if (wantsSSE) {
      res.write('event: message\n');
      res.write(`data: {"jsonrpc":"2.0","id":"${id}","progress":{"status":"searching","message":"Searching results for '${query}'..."}}\n\n`);
    }
    
    if (!config.braveApiKey) {
      console.log('Using example data (API key not provided)');
      const mockResults = braveSearchClient.getMockWebSearchResponse(query);
      return mockResults.web.results;
    }
    
    const response = await braveSearchClient.webSearch({ q: query, count, country });
    return response.web.results;
  }
  
  async function executeNewsSearch(params: any, wantsSSE: boolean, res: Response, id: any) {
    const { query, count = 10, freshness } = params;
    
    if (wantsSSE) {
      res.write('event: message\n');
      res.write(`data: {"jsonrpc":"2.0","id":"${id}","progress":{"status":"searching","message":"Searching news for '${query}'..."}}\n\n`);
    }
    
    if (!config.braveApiKey) {
      const mockResults = braveSearchClient.getMockNewsSearchResponse(query);
      return mockResults.news.results;
    }
    
    const searchParams: any = { q: query, count };
    if (freshness) {
      searchParams.freshness = freshness;
    }
    
    const response = await braveSearchClient.newsSearch(searchParams);
    return response.news.results;
  }
  
  async function executeImageSearch(params: any, wantsSSE: boolean, res: Response, id: any) {
    const { query, count = 10, size } = params;
    
    if (wantsSSE) {
      res.write('event: message\n');
      res.write(`data: {"jsonrpc":"2.0","id":"${id}","progress":{"status":"searching","message":"Searching images for '${query}'..."}}\n\n`);
    }
    
    if (!config.braveApiKey) {
      const mockResults = braveSearchClient.getMockImageSearchResponse(query);
      return mockResults.images.results;
    }
    
    const searchParams: any = { q: query, count };
    if (size) {
      searchParams.size = size;
    }
    
    const response = await braveSearchClient.imageSearch(searchParams);
    return response.images.results;
  }
  
  async function executeVideoSearch(params: any, wantsSSE: boolean, res: Response, id: any) {
    const { query, count = 10, duration } = params;
    
    if (wantsSSE) {
      res.write('event: message\n');
      res.write(`data: {"jsonrpc":"2.0","id":"${id}","progress":{"status":"searching","message":"Searching videos for '${query}'..."}}\n\n`);
    }
    
    if (!config.braveApiKey) {
      const mockResults = braveSearchClient.getMockVideoSearchResponse(query);
      return mockResults.videos.results;
    }
    
    const searchParams: any = { q: query, count };
    if (duration) {
      searchParams.duration = duration;
    }
    
    const response = await braveSearchClient.videoSearch(searchParams);
    return response.videos.results;
  }
  
  // Helper function to send responses
  function sendResponse(res: Response, data: any, isSSE: boolean) {
    if (isSSE) {
      res.write('event: message\n');
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    } else {
      res.json(data);
    }
  }
  
  // Legacy endpoint to list available tools
  app.get('/tools', (_, res) => {
    res.json(Object.keys(mcpTools));
  });
  
  const port = 3001; // Use a different port than the MCP HTTP server
  app.listen(port, () => {
    console.log(`Direct JSON-RPC Server listening on port ${port}`);
  });
  
  return app;
}
