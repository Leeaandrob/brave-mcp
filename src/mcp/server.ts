import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

import { WebSearchTool } from './tools/web-search.tool.js';
import { NewsSearchTool } from './tools/news-search.tool.js';
import { ImageSearchTool } from './tools/image-search.tool.js';
import { VideoSearchTool } from './tools/video-search.tool.js';
import { SearchResultsResource } from './resources/search-results.resource.js';
import { SearchAnalysisPrompt } from './prompts/search-prompt.js';
import { logger } from '../utils/logger.js';
import { mcpConfig } from '../config/mcp-config.js';

export class BraveSearchMCPServer {
  public server: Server;
  public tools: Map<string, any>;
  public resources: Map<string, any>;
  public prompts: Map<string, any>;

  constructor() {
    this.server = new Server(
      {
        name: mcpConfig.server.name,
        version: mcpConfig.server.version,
        description: mcpConfig.server.description,
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
      }
    );

    // Initialize tools
    this.tools = new Map([
      ['brave_web_search', new WebSearchTool()],
      ['brave_news_search', new NewsSearchTool()],
      ['brave_image_search', new ImageSearchTool()],
      ['brave_video_search', new VideoSearchTool()],
    ]);

    // Initialize resources
    this.resources = new Map([
      ['search-results', new SearchResultsResource()],
    ]);

    // Initialize prompts
    this.prompts = new Map([
      ['search_and_analyze', new SearchAnalysisPrompt()],
    ]);

    this.setupHandlers();
    this.setupErrorHandling();
  }

  private setupHandlers() {
    // Tool handlers
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      logger.info('Tools list requested');
      return {
        tools: Array.from(this.tools.values()).map(tool => ({
          name: tool.definition.name,
          description: tool.definition.description,
          inputSchema: tool.definition.inputSchema,
        })),
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      logger.info(`Tool called: ${name}`, { args });

      return await this.executeTool(name, args);
    });

    // Resource handlers
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      logger.info('Resources list requested');
      return {
        resources: [
          {
            uri: 'brave://search-results',
            name: 'Search Results',
            description: 'Access to search results and history',
            mimeType: 'application/json',
          },
        ],
      };
    });

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;
      logger.info('Resource read requested', { uri });

      if (uri.startsWith('brave://search-results')) {
        const resource = this.resources.get('search-results');
        return await resource.read(uri);
      }

      throw new McpError(
        ErrorCode.InvalidRequest,
        `Resource not found: ${uri}`
      );
    });

    // Prompt handlers
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      logger.info('Prompts list requested');
      return {
        prompts: Array.from(this.prompts.values()).map(prompt => prompt.definition),
      };
    });

    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      logger.info('Prompt requested', { name, args });

      const prompt = this.prompts.get(name);
      if (!prompt) {
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Prompt '${name}' not found`
        );
      }

      return await prompt.generate(args);
    });
  }

  private setupErrorHandling() {
    this.server.onerror = (error) => {
      logger.error('MCP Server Error', error);
    };

    process.on('SIGINT', async () => {
      console.error('\nShutting down Brave Search MCP server...');
      await this.server.close();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.error('Shutting down Brave Search MCP server...');
      await this.server.close();
      process.exit(0);
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection', { reason, promise });
      process.exit(1);
    });
  }

  async start() {
    try {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);

      console.error(`Brave Search MCP Server v${mcpConfig.server.version} started`);
      console.error(`Tools available: ${Array.from(this.tools.keys()).join(', ')}`);
      console.error(`Resources available: ${Array.from(this.resources.keys()).join(', ')}`);
      console.error(`Prompts available: ${Array.from(this.prompts.keys()).join(', ')}`);
    } catch (error) {
      logger.error('Failed to start MCP server', error);
      throw error;
    }
  }

  async executeTool(name: string, args: any) {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new McpError(
        ErrorCode.MethodNotFound,
        `Tool '${name}' not found`
      );
    }

    try {
      return await tool.execute(args);
    } catch (error) {
      logger.error(`Tool ${name} execution failed`, error);
      throw new McpError(
        ErrorCode.InternalError,
        `Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
