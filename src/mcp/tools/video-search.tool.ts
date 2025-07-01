import { z } from 'zod';
import { BaseSearchTool } from './base-search.tool.js';
import { MCPToolResult, MCPResourceContent } from '../../types/mcp.types.js';

const VideoSearchArgsSchema = z.object({
  query: z.string()
    .min(1, 'Query cannot be empty')
    .max(400, 'Query too long (max 400 characters)'),
  count: z.number()
    .int()
    .min(1, 'Count must be at least 1')
    .max(20, 'Count cannot exceed 20')
    .default(10),
  duration: z.enum(['short', 'medium', 'long'])
    .optional(),
  resolution: z.enum(['high', 'standard'])
    .optional(),
  country: z.string()
    .length(2, 'Country code must be 2 characters')
    .regex(/^[A-Z]{2}$/, 'Country code must be uppercase')
    .optional()
});

export class VideoSearchTool extends BaseSearchTool {
  get searchType(): string {
    return 'videos';
  }

  get definition(): any {
    return {
      name: 'brave_video_search',
      description: 'Performs a video search using Brave Search API',
      inputSchema: VideoSearchArgsSchema,
    };
  }

  async execute(args: unknown): Promise<MCPToolResult> {
    try {
      const validatedArgs = this.validateArgs(VideoSearchArgsSchema, args);
      const enhancedQuery = this.enhanceQuery(validatedArgs.query);
      
      const results = await this.executeWithCache(validatedArgs, async () => {
        const response = await this.braveService.videoSearch({
          q: enhancedQuery,
          count: validatedArgs.count,
          duration: validatedArgs.duration,
          resolution: validatedArgs.resolution,
          country: validatedArgs.country
        });
        
        return response.results.map((result, index) => ({
          rank: index + 1,
          title: result.title,
          video_url: result.url,
          page_url: result.url,
          source: result.meta_url?.hostname || 'Unknown',
          duration: result.video.duration,
          duration_seconds: this.parseDurationToSeconds(result.video.duration),
          published_time: result.page_age,
          thumbnail: result.thumbnail ? {
            url: result.thumbnail.src,
            dimensions: 'unknown'
          } : null,
          relevance_score: this.calculateRelevanceScore(result, enhancedQuery)
        }));
      });

      const aiResults = this.transformForAI(results, validatedArgs.query, {
        enhanced_query: enhancedQuery,
        search_params: validatedArgs
      });

      const content = aiResults.map(result => ({
        type: 'text' as const,
        text: result.text,
        mimeType: result.mimeType
      }));

      return { content };
    } catch (error) {
      return this.generateError('brave_video_search', error);
    }
  }

  private parseDurationToSeconds(duration?: string): number | null {
    if (!duration) return null;
    
    try {
      const parts = duration.split(':').map(Number);
      if (parts.length === 3) { // HH:MM:SS format
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
      } else if (parts.length === 2) { // MM:SS format
        return parts[0] * 60 + parts[1];
      }
    } catch {
      return null;
    }
    
    return null;
  }
}
