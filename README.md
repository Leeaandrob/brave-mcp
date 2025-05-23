# Brave Search MCP Server

A production-ready Model Context Protocol (MCP) server for Brave Search API integration with comprehensive search capabilities, caching, and HTTP/SSE endpoints.

## Features

- 🔍 **Multiple Search Types**: Web, News, Images, and Videos
- 🚀 **High Performance**: Built-in caching with Redis support
- 🔧 **Multiple Interfaces**: MCP Protocol, HTTP REST API, and Server-Sent Events
- 📊 **Query Enhancement**: Intelligent query optimization
- 🛡️ **Production Ready**: Rate limiting, error handling, and monitoring
- 🎯 **Vercel AI SDK Compatible**: Seamless integration with AI applications

## Quick Start

### 1. Installation

#### Option A: Using Docker (Recommended)

```bash
git clone https://github.com/yourusername/brave-search-mcp-server.git
cd brave-search-mcp-server
cp .env.example .env
# Edit .env with your Brave Search API key
docker-compose up -d
```

#### Option B: Local Development

```bash
git clone https://github.com/yourusername/brave-search-mcp-server.git
cd brave-search-mcp-server
pnpm install
```

### 2. Configuration

Copy and configure the environment file:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Required: Get your API key from https://api.search.brave.com/app/keys
BRAVE_API_KEY=your_brave_api_key_here

# Optional: Server configuration
PORT=3000
NODE_ENV=production
CACHE_ENABLED=true
LOG_LEVEL=info

# Optional: Redis for caching (recommended for production)
REDIS_URL=redis://localhost:6379
```

### 3. Running the Server

#### Using Docker Compose (Production)

```bash
docker-compose up -d
```

#### Using Docker Compose (Development)

```bash
docker-compose -f docker-compose.dev.yml up
```

#### Using Local Node.js

```bash
# Build and run
pnpm run build
pnpm run start

# Or run in development mode
pnpm run dev
```

#### Using Makefile

```bash
make build
make run
```

### 4. Test the Server

```bash
# Health check
curl http://localhost:3000/health

# Web search
curl -X POST -H "Content-Type: application/json" \
  -d '{"query": "latest AI news"}' \
  http://localhost:3000/tools/brave_web_search
```

## Available Tools

### Web Search (`brave_web_search`)
Search the web for general information.

**Parameters:**
- `query` (string, required): Search query
- `count` (number, optional): Number of results (1-20, default: 10)
- `offset` (number, optional): Pagination offset (0-9, default: 0)
- `country` (string, optional): Country code for localized results
- `safe_search` (boolean, optional): Enable safe search (default: true)

### News Search (`brave_news_search`)
Search for recent news articles.

**Parameters:**
- `query` (string, required): News search query
- `count` (number, optional): Number of results (1-20, default: 10)
- `freshness` (string, optional): Time filter - `pd` (past day), `pw` (past week), `pm` (past month), `py` (past year)
- `country` (string, optional): Country code for localized results

### Image Search (`brave_image_search`)
Search for images.

**Parameters:**
- `query` (string, required): Image search query
- `count` (number, optional): Number of results (1-20, default: 10)
- `size` (string, optional): Image size - `small`, `medium`, `large`, `wallpaper`
- `color` (string, optional): Color filter
- `type` (string, optional): Image type - `photo`, `clipart`, `gif`, `transparent`, `line`
- `layout` (string, optional): Layout - `square`, `wide`, `tall`

### Video Search (`brave_video_search`)
Search for videos.

**Parameters:**
- `query` (string, required): Video search query
- `count` (number, optional): Number of results (1-20, default: 10)
- `duration` (string, optional): Duration filter - `short`, `medium`, `long`
- `resolution` (string, optional): Resolution - `high`, `standard`

## Integration with Vercel AI SDK

For detailed integration instructions with the Vercel AI SDK, see [Vercel AI Integration Guide](docs/vercel-ai-integration.md).

### Quick Example

```typescript
import { openai } from '@ai-sdk/openai';
import { generateText, tool } from 'ai';
import { z } from 'zod';

const searchTool = tool({
  description: 'Search the web for information',
  parameters: z.object({
    query: z.string().describe('The search query'),
  }),
  execute: async ({ query }) => {
    const response = await fetch('http://localhost:3000/tools/brave_web_search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    return response.json();
  },
});

const result = await generateText({
  model: openai('gpt-4-turbo'),
  prompt: 'Search for the latest AI developments and summarize them.',
  tools: { searchWeb: searchTool },
});
```

## API Endpoints

### HTTP REST API

- `GET /health` - Health check
- `POST /tools/{toolName}` - Execute a search tool
- `GET /stream/search` - Server-Sent Events for streaming results

### MCP Protocol

The server implements the full MCP specification:

- `tools/list` - List available tools
- `tools/call` - Execute a tool
- `resources/list` - List available resources
- `resources/read` - Read a resource
- `prompts/list` - List available prompts
- `prompts/get` - Get a prompt

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   AI Client     │    │   MCP Server    │    │  Brave Search   │
│  (Vercel AI)    │◄──►│                 │◄──►│      API        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │  Cache Layer    │
                       │   (Redis)       │
                       └─────────────────┘
```

### Key Components

- **MCP Server**: Core protocol implementation
- **HTTP Server**: REST API and SSE endpoints
- **Search Tools**: Concrete implementations for each search type
- **Cache Service**: Redis-based caching with fallback to memory
- **Query Enhancer**: Intelligent query optimization
- **Base Search Tool**: Abstract base class with common functionality

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `BRAVE_API_KEY` | Brave Search API key | Required |
| `BRAVE_API_URL` | Brave Search API URL | `https://api.search.brave.com/res/v1` |
| `REDIS_URL` | Redis connection URL | Optional |
| `CACHE_ENABLED` | Enable caching | `true` |
| `CACHE_TTL` | Cache TTL in seconds | `300` |
| `LOG_LEVEL` | Logging level | `info` |
| `MAX_QUERY_LENGTH` | Maximum query length | `500` |
| `MAX_RESULTS` | Maximum results per request | `50` |
| `RATE_LIMIT_PER_MINUTE` | Rate limit per minute | `100` |

## Development

### Project Structure

```
brave-mcp/
├── src/
│   ├── app.ts                 # Main application entry point
│   ├── config/
│   │   └── mcp-config.ts      # MCP server configuration
│   ├── http/
│   │   └── server.ts          # HTTP server implementation
│   ├── mcp/
│   │   ├── server.ts          # MCP server implementation
│   │   ├── tools/             # Search tool implementations
│   │   ├── resources/         # MCP resources
│   │   └── prompts/           # MCP prompts
│   ├── services/
│   │   └── brave-search.service.ts  # Brave Search API client
│   ├── types/                 # TypeScript type definitions
│   └── utils/                 # Utility functions
├── docs/
│   └── vercel-ai-integration.md  # Vercel AI SDK integration guide
├── Makefile                   # Project management commands
└── package.json
```

### Available Make Commands

```bash
make help     # Show available commands
make build    # Build the project
make run      # Run the built application
make dev      # Run in development mode
make test     # Run tests
make lint     # Lint the code
make clean    # Clean build artifacts
```

### Adding New Search Types

1. Create a new tool class extending `BaseSearchTool`
2. Implement the required abstract methods
3. Add the tool to the server's tool registry
4. Update documentation

Example:

```typescript
export class CustomSearchTool extends BaseSearchTool {
  get searchType(): string {
    return 'custom';
  }

  get definition(): any {
    return {
      name: 'brave_custom_search',
      description: 'Custom search implementation',
      inputSchema: CustomSearchArgsSchema,
    };
  }

  async execute(args: unknown): Promise<MCPToolResult> {
    // Implementation here
  }
}
```

## Deployment

### Docker Deployment (Recommended)

The project includes production-ready Docker configuration:

#### Quick Production Deployment

```bash
# Clone the repository
git clone https://github.com/yourusername/brave-search-mcp-server.git
cd brave-search-mcp-server

# Configure environment
cp .env.example .env
# Edit .env with your Brave Search API key

# Deploy with Docker Compose
docker-compose up -d
```

#### Custom Docker Build

```bash
# Build the image
docker build -t brave-search-mcp-server .

# Run with custom configuration
docker run -d \
  --name brave-mcp \
  -p 3000:3000 \
  -e BRAVE_API_KEY=your_api_key_here \
  -e REDIS_URL=redis://your-redis-host:6379 \
  brave-search-mcp-server
```

### Cloud Deployment

#### Vercel/Netlify Functions
The server can be deployed as serverless functions. See the `examples/vercel-ai-chat` directory for a complete integration example.

#### AWS/GCP/Azure
Use the provided Dockerfile for container-based deployment on any cloud platform that supports Docker containers.

#### Kubernetes
The Docker image can be deployed to Kubernetes clusters. Example manifests:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: brave-mcp-server
spec:
  replicas: 3
  selector:
    matchLabels:
      app: brave-mcp-server
  template:
    metadata:
      labels:
        app: brave-mcp-server
    spec:
      containers:
      - name: brave-mcp-server
        image: brave-search-mcp-server:latest
        ports:
        - containerPort: 3000
        env:
        - name: BRAVE_API_KEY
          valueFrom:
            secretKeyRef:
              name: brave-secrets
              key: api-key
        - name: REDIS_URL
          value: "redis://redis-service:6379"
```

### Environment Setup

For production deployment, ensure you have:

1. **Redis Instance**: For optimal caching performance
2. **Environment Variables**: Properly configured (see `.env.example`)
3. **Monitoring**: Health checks and logging configured
4. **Security**: Rate limiting and CORS properly set
5. **SSL/TLS**: Terminate SSL at load balancer or reverse proxy
6. **Scaling**: Multiple instances behind a load balancer for high availability

### Performance Considerations

- **Caching**: Enable Redis for production workloads
- **Rate Limiting**: Configure appropriate limits for your use case
- **Memory**: Allocate sufficient memory for caching and processing
- **CPU**: Scale horizontally for high-throughput scenarios

## Monitoring

The server includes built-in monitoring capabilities:

- Health check endpoint (`/health`)
- Structured logging with Winston
- Performance metrics
- Error tracking
- Cache hit/miss statistics

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for detailed information on:

- Setting up the development environment
- Code style guidelines
- Testing requirements
- Pull request process
- Adding new features

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For issues and questions:

1. 📖 Check the [examples](examples/) directory for integration examples
2. 📋 Review the [Contributing Guide](CONTRIBUTING.md) for development help
3. 🐛 Open an issue on GitHub for bugs or feature requests
4. 💬 Start a discussion for general questions

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a detailed history of changes.

## Acknowledgments

- [Brave Search API](https://api.search.brave.com/) for providing the search capabilities
- [Model Context Protocol](https://modelcontextprotocol.io/) for the protocol specification
- [Vercel AI SDK](https://sdk.vercel.ai/) for AI integration patterns
