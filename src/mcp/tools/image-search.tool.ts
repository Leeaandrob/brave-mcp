import { z } from 'zod';
import { BaseSearchTool } from './base-search.tool.js';
import { MCPToolResult, MCPResourceContent } from '../../types/mcp.types.js';

const ImageSearchArgsSchema = z.object({
  query: z.string()
    .min(1, 'Query cannot be empty')
    .max(400, 'Query too long (max 400 characters)'),
  count: z.number()
    .int()
    .min(1, 'Count must be at least 1')
    .max(20, 'Count cannot exceed 20')
    .default(10),
  size: z.enum(['small', 'medium', 'large', 'wallpaper'])
    .optional(),
  color: z.string()
    .optional(),
  type: z.enum(['photo', 'clipart', 'gif', 'transparent', 'line'])
    .optional(),
  layout: z.enum(['square', 'wide', 'tall'])
    .optional(),
  country: z.string()
    .length(2, 'Country code must be 2 characters')
    .regex(/^[A-Z]{2}$/, 'Country code must be uppercase')
    .optional()
});

export class ImageSearchTool extends BaseSearchTool {
  get searchType(): string {
    return 'images';
  }

  get definition(): any {
    return {
      name: 'brave_image_search',
      description: 'Performs an image search using Brave Search API',
      inputSchema: ImageSearchArgsSchema,
    };
  }

  async execute(args: unknown): Promise<MCPToolResult> {
    try {
      const validatedArgs = this.validateArgs(ImageSearchArgsSchema, args);
      const enhancedQuery = this.enhanceQuery(validatedArgs.query);
      
      const results = await this.executeWithCache(validatedArgs, async () => {
        const response = await this.braveService.imageSearch({
          q: enhancedQuery,
          count: validatedArgs.count,
          size: validatedArgs.size,
          color: validatedArgs.color,
          type: validatedArgs.type,
          layout: validatedArgs.layout,
          country: validatedArgs.country
        });
        
        return response.results.map((result, index) => ({
          rank: index + 1,
          title: result.title,
          image_url: result.properties.url,
          page_url: result.url,
          source: result.source,
          dimensions: {
            width: result.properties.width,
            height: result.properties.height,
            aspect_ratio: `${result.properties.width/result.properties.height}`
          },
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
      return this.generateError('brave_image_search', error);
    }
  }
}
