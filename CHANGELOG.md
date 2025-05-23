# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-01-15

### Added
- Initial release of Brave Search MCP Server
- Full MCP protocol support (2024-11-05 specification)
- Four search types: web, news, images, and videos
- HTTP REST API endpoints for broader compatibility
- Server-Sent Events (SSE) support for streaming results
- Redis-based caching with memory fallback
- Comprehensive error handling and logging
- Rate limiting and security middleware
- Vercel AI SDK integration examples
- Production-ready configuration management
- Docker support for containerized deployment
- Comprehensive documentation and examples

### Features
- **Web Search**: General web search with pagination and filtering
- **News Search**: Recent news articles with freshness controls
- **Image Search**: Image search with size, color, and type filters
- **Video Search**: Video search with duration and quality filters
- **Caching**: Multi-tier caching strategy with Redis support
- **Monitoring**: Health checks, metrics, and structured logging
- **Security**: CORS, helmet, rate limiting, and input validation
- **AI Integration**: Optimized responses for LLM consumption

### Technical Details
- Built with TypeScript for type safety
- Uses Express.js for HTTP server
- Implements MCP protocol with @modelcontextprotocol/sdk
- Zod schemas for input validation
- Winston for structured logging
- Jest for testing framework
- ESLint for code quality

### Documentation
- Comprehensive README with setup instructions
- API documentation with examples
- Vercel AI SDK integration guide
- Contributing guidelines
- Docker deployment instructions

## [Unreleased]

### Planned
- Local search capabilities
- Enhanced query optimization
- Additional search filters
- Performance improvements
- Extended monitoring capabilities