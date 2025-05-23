import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { BraveSearchMCPServer } from '../mcp/server.js';
import { logger } from '../utils/logger.js';
import { mcpConfig } from '../config/mcp-config.js';

export class HTTPMCPServer {
  private app: express.Application;
  private mcpServer: BraveSearchMCPServer;

  constructor() {
    this.app = express();
    this.mcpServer = new BraveSearchMCPServer();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware() {
    this.app.use(helmet());
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 1000
    }));
  }

  private setupRoutes() {
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({ status: 'healthy' });
    });

    this.app.get('/tools', (req: Request, res: Response) => {
      try {
        const toolsList = Array.from(this.mcpServer.tools.values()).map(tool => ({
          name: tool.definition.name,
          description: tool.definition.description,
          inputSchema: tool.definition.inputSchema,
        }));
        res.json(toolsList);
      } catch (error) {
        logger.error('Error listing tools', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });

    this.app.post('/tools/:toolName', async (req: Request, res: Response) => {
      try {
        const toolName = req.params.toolName;
        const args = req.body;
        const tool = this.mcpServer.tools.get(toolName);
        if (!tool) {
          res.status(404).json({ error: `Tool '${toolName}' not found` });
          return;
        }
        
        const result = await tool.execute(args);
        res.json(result);
      } catch (error) {
        logger.error('Tool execution failed', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });

    this.app.post('/mcp', async (req: Request, res: Response) => {
      try {
        const { method, params, id } = req.body;
        switch (method) {
          case 'tools/list':
            res.json({
              tools: Array.from(this.mcpServer.tools.values()).map(tool => ({
                name: tool.definition.name,
                description: tool.definition.description,
                inputSchema: tool.definition.inputSchema,
              })),
            });
            break;
          case 'initialize':
            res.json({
              protocolVersion: '2024-11-05',
              capabilities: {
                tools: {},
                resources: {},
                prompts: {},
              },
              serverInfo: {
                name: mcpConfig.server.name,
                version: mcpConfig.server.version,
              },
            });
            break;
          case 'tools/call':
            const tool = this.mcpServer.tools.get(params.name);
            if (!tool) {
              res.status(404).json({ error: `Tool '${params.name}' not found`, id });
              return;
            }
            const toolResult = await tool.execute(params.arguments);
            res.json({ result: toolResult, id });
            break;
          // Add other MCP method handlers as needed
          default:
            res.status(404).json({ error: `Method '${method}' not found`, id });
        }
      } catch (error) {
        logger.error('MCP request failed', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });

    this.app.get('/stream/search', (req: Request, res: Response) => {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      });

      // Implement streaming search results
    });
  }

  async start(port: number = 3000) {
    await this.mcpServer.start();
    this.app.listen(port, () => {
      logger.info(`HTTP Server listening on port ${port}`);
    });
  }
}