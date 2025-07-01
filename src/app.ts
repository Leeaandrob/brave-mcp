import { BraveSearchMCPServer } from "./mcp/server.js";
import { HTTPMCPServer } from "./http/server.js";
import { logger } from "./utils/logger.js";
import { mcpConfig } from "./config/mcp-config.js";

async function main() {
  try {
    // Validate configuration
    if (!mcpConfig.brave.apiKey) {
      logger.warn(
        "BRAVE_API_KEY not configured. Using mock data for all searches.",
      );
    }

    // Create and start MCP server
    const mcpServer = new BraveSearchMCPServer();
    await mcpServer.start();

    // Create and start HTTP server
    const httpServer = new HTTPMCPServer();
    await httpServer.start(3000);

    logger.info(
      `Brave Search MCP Server started successfully with apiKey: ${process.env.BRAVE_API_KEY}`,
    );
  } catch (error) {
    logger.error("Failed to start servers", error);
    process.exit(1);
  }
}

main().catch((error) => {
  logger.error("Fatal error", error);
  process.exit(1);
});
