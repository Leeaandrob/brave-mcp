# Contributing to Brave Search MCP Server

Thank you for your interest in contributing to the Brave Search MCP Server! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites

- Node.js 18.0.0 or higher
- pnpm (recommended) or npm
- A Brave Search API key (get one at https://api.search.brave.com/app/keys)

### Development Setup

1. Fork and clone the repository:
   ```bash
   git clone https://github.com/yourusername/brave-search-mcp-server.git
   cd brave-search-mcp-server
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Copy the environment file and configure it:
   ```bash
   cp .env.example .env
   # Edit .env with your Brave Search API key
   ```

4. Build and run the project:
   ```bash
   pnpm run build
   pnpm run start
   ```

5. For development with hot reload:
   ```bash
   pnpm run dev
   ```

## 🛠️ Development Workflow

### Project Structure

```
src/
├── api/                    # Brave Search API client
├── config/                 # Configuration management
├── http/                   # HTTP server implementation
├── mcp/                    # MCP protocol implementation
│   ├── tools/             # Search tool implementations
│   ├── resources/         # MCP resources
│   └── prompts/           # MCP prompts
├── services/              # Business logic services
├── types/                 # TypeScript type definitions
└── utils/                 # Utility functions
```

### Available Scripts

- `pnpm run build` - Build the TypeScript project
- `pnpm run start` - Start the production server
- `pnpm run dev` - Start development server with hot reload
- `pnpm run test` - Run tests
- `pnpm run lint` - Lint TypeScript code
- `make help` - Show all available Makefile commands

### Code Style

- Use TypeScript for all new code
- Follow the existing code style and patterns
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Ensure all code passes linting (`pnpm run lint`)

### Testing

- Write tests for new features and bug fixes
- Ensure all tests pass before submitting a PR
- Include both unit tests and integration tests where appropriate
- Test with and without a Brave Search API key (mock mode)

## 📝 Contribution Guidelines

### Reporting Issues

Before creating an issue, please:

1. Check if the issue already exists
2. Use the issue templates when available
3. Provide clear reproduction steps
4. Include relevant environment information
5. Add appropriate labels

### Submitting Pull Requests

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes following the code style guidelines

3. Add or update tests as needed

4. Update documentation if you're changing APIs or adding features

5. Ensure all tests pass and code is properly linted:
   ```bash
   pnpm run test
   pnpm run lint
   ```

6. Commit your changes with a clear commit message:
   ```bash
   git commit -m "feat: add new search filtering options"
   ```

7. Push to your fork and submit a pull request

### Commit Message Format

We follow the [Conventional Commits](https://conventionalcommits.org/) specification:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

### Pull Request Guidelines

- Keep PRs focused and atomic
- Write clear PR descriptions explaining the changes
- Link to related issues
- Ensure CI passes
- Request review from maintainers
- Be responsive to feedback

## 🔧 Adding New Features

### Adding New Search Tools

1. Create a new tool class extending `BaseSearchTool`
2. Implement the required abstract methods
3. Add comprehensive input validation using Zod schemas
4. Include proper error handling and logging
5. Add tests for the new tool
6. Update documentation

Example structure:
```typescript
export class CustomSearchTool extends BaseSearchTool {
  get searchType(): string {
    return 'custom';
  }

  get definition(): MCPToolDefinition {
    // Tool definition with input schema
  }

  async execute(args: unknown): Promise<MCPToolResult> {
    // Implementation
  }
}
```

### Adding New MCP Resources

1. Create resource classes in `src/mcp/resources/`
2. Implement proper URI handling
3. Add caching where appropriate
4. Include comprehensive error handling
5. Add tests and documentation

### Adding New Configuration Options

1. Add environment variables to `.env.example`
2. Update configuration types in `src/types/`
3. Add validation in configuration loading
4. Document the new options in README.md

## 🧪 Testing

### Running Tests

```bash
# Run all tests
pnpm run test

# Run tests in watch mode
pnpm run test:watch

# Run tests with coverage
pnpm run test:coverage
```

### Test Categories

- **Unit Tests**: Test individual functions and classes
- **Integration Tests**: Test API endpoints and MCP protocol
- **E2E Tests**: Test complete workflows

### Mock Data

The project includes mock data for development without API keys. When adding new features:

1. Add corresponding mock responses
2. Ensure tests work in both mock and real API modes
3. Update mock data when API responses change

## 📚 Documentation

### Updating Documentation

- Update README.md for user-facing changes
- Update JSDoc comments for API changes
- Add examples for new features
- Update the Vercel AI integration guide if needed

### Documentation Standards

- Use clear, concise language
- Include code examples
- Provide both basic and advanced usage examples
- Keep documentation up to date with code changes

## 🐛 Debugging

### Common Issues

1. **API Key Issues**: Ensure your Brave Search API key is valid and has sufficient quota
2. **Port Conflicts**: Change the PORT in your .env file if 3000 is in use
3. **Cache Issues**: Clear Redis cache or disable caching for debugging

### Debug Mode

Enable debug logging:
```bash
LOG_LEVEL=debug pnpm run dev
```

## 🤝 Community

### Getting Help

- Open an issue for bugs or feature requests
- Check existing issues and discussions
- Follow the code of conduct

### Code of Conduct

Please be respectful and inclusive in all interactions. We want this to be a welcoming community for everyone.

## 📄 License

By contributing to this project, you agree that your contributions will be licensed under the MIT License.

## 🙏 Recognition

Contributors will be recognized in the project's README.md and release notes.

Thank you for contributing to the Brave Search MCP Server!