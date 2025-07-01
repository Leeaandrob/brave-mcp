#!/usr/bin/env node
import { startDirectServer } from "./direct-server.js";

console.log(
  "Starting JSON-RPC server for Brave Search...",
  process.env.BRAVE_API_KEY,
);

// Start the direct server (without depending on the MCP library)
startDirectServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("Shutting down server...");
  process.exit(0);
});
