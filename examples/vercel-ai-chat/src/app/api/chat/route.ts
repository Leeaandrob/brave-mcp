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
    system: `You are a helpful assistant with access to comprehensive search capabilities through the Brave Search API at ${MCP_SERVER_URL}.

    **Available Search Tools:**
    
    🌐 **brave_web_search** - General web search for websites, articles, and general information
    - Returns: Web pages with titles, URLs, descriptions, and metadata
    - Best for: General queries, research, finding websites and articles
    
    📰 **brave_news_search** - Focused news article search
    - Returns: Recent news articles with publication dates, sources, and thumbnails
    - Best for: Current events, breaking news, recent developments
    - Parameters: query, count, freshness (pd=past day, pw=past week, pm=past month, py=past year)
    
    🖼️ **brave_image_search** - Image search with detailed metadata
    - Returns: Images with titles, URLs, sources, and dimensions
    - Best for: Finding photos, graphics, visual content
    - Parameters: query, count, size (small, medium, large, wallpaper)
    
    🎥 **brave_video_search** - Video content search
    - Returns: Videos with titles, URLs, thumbnails, duration, and sources
    - Best for: Tutorials, entertainment, educational videos
    - Parameters: query, count, duration (short, medium, long)

    **Instructions:**
    1. Choose the most appropriate search tool based on the user's query intent
    2. Use descriptive, specific queries for better results
    3. Always provide proper attribution with source URLs
    4. Format results in a clear, user-friendly manner
    5. If one search type fails, try an alternative approach
    6. For ambiguous queries, you may use multiple search types to provide comprehensive results

    **Response Format:**
    - Summarize key findings at the top
    - Present results with clear headings and bullet points
    - Include clickable source links
    - Mention the search type used for transparency`,
    messages,
    tools: {
      brave_web_search: {
        description: 'Search the web using Brave Search API. Returns comprehensive web results including titles, URLs, descriptions, and metadata. Best for general information, research, and finding websites.',
        parameters: z.object({
          query: z.string().min(1).max(400).describe('The search query (1-400 characters)'),
          count: z.number().int().min(1).max(20).optional().default(5).describe('Number of results to return (1-20, default: 5)'),
          offset: z.number().int().min(0).max(9).optional().default(0).describe('Pagination offset (0-9, default: 0)'),
        }),
        execute: async ({ query, count = 5, offset = 0 }: { query: string; count?: number; offset?: number }) => {
          console.log('Executing brave_web_search with:', { query, count, offset });
          
          try {
            const response = await fetch(`${MCP_SERVER_URL}/mcp`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'tools/call',
                params: {
                  name: 'brave_web_search',
                  arguments: { query, count, offset },
                },
                id: Date.now(),
              }),
            });

            if (!response.ok) {
              return {
                error: `HTTP error! status: ${response.status}`,
                results: [],
                search_type: 'web'
              };
            }

            const data = await response.json();
            
            if (data.error) {
              return {
                error: `MCP Error: ${data.error.message}`,
                results: [],
                search_type: 'web'
              };
            }
            
            if (data.result.isError || !data.result.content || data.result.content.length === 0) {
              return {
                error: 'Web search failed - no results or error occurred',
                results: [],
                search_type: 'web'
              };
            }
            
            const result = JSON.parse(data.result.content[0].text);
            return {
              ...result,
              search_type: 'web',
              query_info: { query, count, offset }
            };
          } catch (error) {
            console.error('Web search error:', error);
            return {
              error: `Web search failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
              results: [],
              search_type: 'web'
            };
          }
        },
      },
      brave_news_search: {
        description: 'Search for recent news articles using Brave Search API. Returns news articles with publication dates, sources, and thumbnails. Best for current events and breaking news.',
        parameters: z.object({
          query: z.string().min(1).max(400).describe('The news search query (1-400 characters)'),
          count: z.number().int().min(1).max(20).optional().default(5).describe('Number of news articles to return (1-20, default: 5)'),
          freshness: z.enum(['pd', 'pw', 'pm', 'py']).optional().default('pw').describe('Time filter: pd=past day, pw=past week, pm=past month, py=past year (default: pw)'),
        }),
        execute: async ({ query, count = 5, freshness = 'pw' }: { query: string; count?: number; freshness?: 'pd' | 'pw' | 'pm' | 'py' }) => {
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
              return {
                error: `HTTP error! status: ${response.status}`,
                results: [],
                search_type: 'news',
                fallback_suggestion: 'web_search'
              };
            }

            const data = await response.json();
            
            if (data.error) {
              return {
                error: `MCP Error: ${data.error.message}`,
                results: [],
                search_type: 'news',
                fallback_suggestion: 'web_search'
              };
            }
            
            if (data.result.isError || !data.result.content || data.result.content.length === 0) {
              return {
                error: 'News search returned no results. Try a web search for broader coverage.',
                results: [],
                search_type: 'news',
                fallback_suggestion: 'web_search'
              };
            }
            
            const result = JSON.parse(data.result.content[0].text);
            return {
              ...result,
              search_type: 'news',
              query_info: { query, count, freshness }
            };
          } catch (error) {
            console.error('News search error:', error);
            return {
              error: `News search failed: ${error instanceof Error ? error.message : 'Unknown error'}. Try a web search instead.`,
              results: [],
              search_type: 'news',
              fallback_suggestion: 'web_search'
            };
          }
        },
      },
      brave_image_search: {
        description: 'Search for images using Brave Search API. Returns images with titles, URLs, sources, and dimensions. Best for finding photos, graphics, and visual content.',
        parameters: z.object({
          query: z.string().min(1).max(400).describe('The image search query (1-400 characters)'),
          count: z.number().int().min(1).max(20).optional().default(5).describe('Number of images to return (1-20, default: 5)'),
          size: z.enum(['small', 'medium', 'large', 'wallpaper']).optional().describe('Image size filter: small, medium, large, or wallpaper'),
        }),
        execute: async ({ query, count = 5, size }: { query: string; count?: number; size?: 'small' | 'medium' | 'large' | 'wallpaper' }) => {
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
              return {
                error: `HTTP error! status: ${response.status}`,
                results: [],
                search_type: 'images'
              };
            }

            const data = await response.json();
            
            if (data.error) {
              return {
                error: `MCP Error: ${data.error.message}`,
                results: [],
                search_type: 'images'
              };
            }
            
            if (data.result.isError || !data.result.content || data.result.content.length === 0) {
              return {
                error: 'Image search returned no results. Try a different query or search term.',
                results: [],
                search_type: 'images'
              };
            }
            
            const result = JSON.parse(data.result.content[0].text);
            return {
              ...result,
              search_type: 'images',
              query_info: { query, count, size }
            };
          } catch (error) {
            console.error('Image search error:', error);
            return {
              error: `Image search failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
              results: [],
              search_type: 'images'
            };
          }
        },
      },
      brave_video_search: {
        description: 'Search for videos using Brave Search API. Returns videos with titles, URLs, thumbnails, duration, and sources. Best for tutorials, entertainment, and educational content.',
        parameters: z.object({
          query: z.string().min(1).max(400).describe('The video search query (1-400 characters)'),
          count: z.number().int().min(1).max(20).optional().default(5).describe('Number of videos to return (1-20, default: 5)'),
          duration: z.enum(['short', 'medium', 'long']).optional().describe('Video duration filter: short, medium, or long'),
        }),
        execute: async ({ query, count = 5, duration }: { query: string; count?: number; duration?: 'short' | 'medium' | 'long' }) => {
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
              return {
                error: `HTTP error! status: ${response.status}`,
                results: [],
                search_type: 'videos'
              };
            }

            const data = await response.json();
            
            if (data.error) {
              return {
                error: `MCP Error: ${data.error.message}`,
                results: [],
                search_type: 'videos'
              };
            }
            
            if (data.result.isError || !data.result.content || data.result.content.length === 0) {
              return {
                error: 'Video search returned no results. Try a different query or search term.',
                results: [],
                search_type: 'videos'
              };
            }
            
            const result = JSON.parse(data.result.content[0].text);
            return {
              ...result,
              search_type: 'videos',
              query_info: { query, count, duration }
            };
          } catch (error) {
            console.error('Video search error:', error);
            return {
              error: `Video search failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
              results: [],
              search_type: 'videos'
            };
          }
        },
      },
    },
  });

  return result.toDataStreamResponse();
}