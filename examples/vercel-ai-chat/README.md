# Brave Search AI Chat Interface

A minimal chat interface built with Vercel AI SDK that connects to your Brave MCP server, allowing users to ask natural language questions that automatically trigger appropriate Brave searches.

## Features

- 🤖 **AI-Powered Chat**: Natural language interface powered by OpenAI GPT-4
- 🔍 **Brave Search Integration**: Automatic web, news, image, and video searches
- 🚀 **Real-time Streaming**: Live responses with streaming support
- 🎨 **Modern UI**: Clean, responsive design with Tailwind CSS
- 🛠️ **MCP Protocol**: Connects to your Brave MCP server via JSON-RPC

## Prerequisites

1. **Brave MCP Server**: Make sure your Brave MCP server is running on `http://localhost:3000`
2. **OpenAI API Key**: Required for the AI chat functionality

## Setup

1. **Install Dependencies**:
   ```bash
   pnpm install
   ```

2. **Environment Variables**:
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add your OpenAI API key:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   MCP_SERVER_URL=http://localhost:3000
   ```

3. **Start Development Server**:
   ```bash
   pnpm dev
   ```

4. **Open Browser**:
   Navigate to `http://localhost:3000` (or the port shown in terminal)

## Usage Examples

Try these example queries in the chat interface:

- **Web Search**: "What's the latest news about artificial intelligence?"
- **News Search**: "Find recent news about Tesla stock"
- **Image Search**: "Show me images of the new iPhone"
- **Video Search**: "Find cooking videos for pasta recipes"

## How It Works

1. **User Input**: User types a natural language question
2. **AI Processing**: OpenAI GPT-4 analyzes the query and determines the appropriate search tool
3. **MCP Integration**: The system calls your Brave MCP server with the right search parameters
4. **Results Display**: Search results are formatted and displayed in the chat interface

## Architecture

```
User Input → Vercel AI SDK → OpenAI GPT-4 → Tool Selection → Brave MCP Server → Brave Search API
                                                                ↓
User Interface ← Formatted Response ← AI Processing ← Search Results ← JSON-RPC Response
```

## Available Search Tools

- `brave_web_search`: General web search
- `brave_news_search`: News articles with freshness options
- `brave_image_search`: Image search with size filters
- `brave_video_search`: Video search with duration filters

## Troubleshooting

### Common Issues

1. **"Module not found" errors**: Make sure all files are in the `src/` directory structure
2. **MCP server connection failed**: Ensure your Brave MCP server is running on port 3000
3. **OpenAI API errors**: Check that your API key is valid and has sufficient credits

### Debug Mode

To see detailed logs, check the browser console and terminal output when running the development server.

## Development

The project structure follows Next.js 14+ App Router conventions:

```
src/
├── app/
│   ├── api/chat/route.ts    # Chat API endpoint with tool calling
│   ├── page.tsx             # Main page component
│   └── layout.tsx           # Root layout
├── components/
│   └── chat-interface.tsx   # Main chat UI component
└── globals.css              # Global styles
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with your Brave MCP server
5. Submit a pull request

## License

This project is part of the Brave MCP Server examples and follows the same license terms.
