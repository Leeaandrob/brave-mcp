import { NextRequest } from 'next/server';
import { CoreMessage, streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

export const maxDuration = 30;

const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:3000';

export async function POST(req: NextRequest) {
  const { messages }: { messages: CoreMessage[] } = await req.json();

  const result = await streamText({
    model: openai('gpt-4o'),
    system: `You are a helpful assistant that can search the web using the Brave Search MCP server at ${MCP_SERVER_URL}. 
    When you need information, call the appropriate search tool (web, news, images, or videos) with a well-formatted query.
    Always provide proper attribution for search results and format them in a user-friendly way.
    
    Available tools:
    - brave_web_search: General web search
    - brave_news_search: News articles search (currently experiencing issues, use web search as fallback)
    - brave_image_search: Image search
    - brave_video_search: Video search
    
    If a search fails, acknowledge the issue and try an alternative approach or suggest the user try a different query.`,
    messages,
    tools: {
      brave_web_search: {
        description: 'Search the web using Brave Search',
        parameters: z.object({
          query: z.string(),
          count: z.number().optional(),
        }),
        execute: async ({ query, count = 5 }) => {
          console.log('Executing brave_web_search with:', { query, count });
          
          try {
            const response = await fetch(`${MCP_SERVER_URL}/mcp`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'tools/call',
                params: {
                  name: 'brave_web_search',
                  arguments: { query, count },
                },
                id: Date.now(),
              }),
            });

            if (!response.ok) {
              return { error: `HTTP error! status: ${response.status}`, results: [] };
            }

            const data = await response.json();
            
            if (data.error) {
              return { error: `MCP Error: ${data.error.message}`, results: [] };
            }
            
            if (data.result.isError || !data.result.content || data.result.content.length === 0) {
              return { error: 'Web search failed - no results or error occurred', results: [] };
            }
            
            return JSON.parse(data.result.content[0].text);
          } catch (error) {
            console.error('Web search error:', error);
            return { error: `Web search failed: ${error instanceof Error ? error.message : 'Unknown error'}`, results: [] };
          }
        },
      },
      brave_news_search: {
        description: 'Search for news articles using Brave Search',
        parameters: z.object({
          query: z.string(),
          count: z.number().optional(),
          freshness: z.enum(['pd', 'pw', 'pm', 'py']).optional(),
        }),
        execute: async ({ query, count = 5, freshness }) => {
          console.log('Executing brave_news_search with:', { query, count, freshness });
          
          try {
            const response = await fetch(`${MCP_SERVER_URL}/mcp`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'tools/call',
                params: {
                  name: 'brave_news_search',
                  arguments: { query, count, freshness },
                },
                id: Date.now(),
              }),
            });

            if (!response.ok) {
              return { error: `HTTP error! status: ${response.status}`, results: [] };
            }

            const data = await response.json();
            
            if (data.error) {
              return { error: `MCP Error: ${data.error.message}`, results: [] };
            }
            
            if (data.result.isError || !data.result.content || data.result.content.length === 0) {
              return { 
                error: 'News search is currently experiencing issues. I\'ll try a web search instead.', 
                results: [],
                fallback_suggestion: 'web_search'
              };
            }
            
            return JSON.parse(data.result.content[0].text);
          } catch (error) {
            console.error('News search error:', error);
            return { 
              error: `News search failed: ${error instanceof Error ? error.message : 'Unknown error'}. I\'ll try a web search instead.`, 
              results: [],
              fallback_suggestion: 'web_search'
            };
          }
        },
      },
      brave_image_search: {
        description: 'Search for images using Brave Search',
        parameters: z.object({
          query: z.string(),
          count: z.number().optional(),
          size: z.enum(['small', 'medium', 'large', 'wallpaper']).optional(),
        }),
        execute: async ({ query, count = 5, size }) => {
          console.log('Executing brave_image_search with:', { query, count, size });
          
          try {
            const response = await fetch(`${MCP_SERVER_URL}/mcp`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'tools/call',
                params: {
                  name: 'brave_image_search',
                  arguments: { query, count, size },
                },
                id: Date.now(),
              }),
            });

            if (!response.ok) {
              return { error: `HTTP error! status: ${response.status}`, results: [] };
            }

            const data = await response.json();
            
            if (data.error) {
              return { error: `MCP Error: ${data.error.message}`, results: [] };
            }
            
            if (data.result.isError || !data.result.content || data.result.content.length === 0) {
              return { error: 'Image search failed - no results or error occurred', results: [] };
            }
            
            return JSON.parse(data.result.content[0].text);
          } catch (error) {
            console.error('Image search error:', error);
            return { error: `Image search failed: ${error instanceof Error ? error.message : 'Unknown error'}`, results: [] };
          }
        },
      },
      brave_video_search: {
        description: 'Search for videos using Brave Search',
        parameters: z.object({
          query: z.string(),
          count: z.number().optional(),
          duration: z.enum(['short', 'medium', 'long']).optional(),
        }),
        execute: async ({ query, count = 5, duration }) => {
          console.log('Executing brave_video_search with:', { query, count, duration });
          
          try {
            const response = await fetch(`${MCP_SERVER_URL}/mcp`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'tools/call',
                params: {
                  name: 'brave_video_search',
                  arguments: { query, count, duration },
                },
                id: Date.now(),
              }),
            });

            if (!response.ok) {
              return { error: `HTTP error! status: ${response.status}`, results: [] };
            }

            const data = await response.json();
            
            if (data.error) {
              return { error: `MCP Error: ${data.error.message}`, results: [] };
            }
            
            if (data.result.isError || !data.result.content || data.result.content.length === 0) {
              return { error: 'Video search failed - no results or error occurred', results: [] };
            }
            
            return JSON.parse(data.result.content[0].text);
          } catch (error) {
            console.error('Video search error:', error);
            return { error: `Video search failed: ${error instanceof Error ? error.message : 'Unknown error'}`, results: [] };
          }
        },
      },
    },
  });

  return result.toDataStreamResponse();
}