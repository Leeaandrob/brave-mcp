// MCP protocol types and interfaces

export interface MCPServerInfo {
  name: string;
  version: string;
  description?: string;
}

export interface MCPCapabilities {
  tools?: Record<string, any>;
  resources?: Record<string, any>;
  prompts?: Record<string, any>;
}

export interface MCPToolCall {
  name: string;
  arguments: Record<string, any>;
}

export interface MCPToolResult {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
}

export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface MCPResourceContent {
  uri: string;
  mimeType: string;
  text?: string;
  blob?: string;
}

export interface MCPPrompt {
  name: string;
  description?: string;
  arguments?: Array<{
    name: string;
    description?: string;
    required?: boolean;
  }>;
}

export interface MCPPromptMessage {
  role: 'user' | 'assistant' | 'system';
  content: {
    type: 'text';
    text: string;
  };
}

export interface MCPPromptResult {
  description?: string;
  messages: MCPPromptMessage[];
}

export interface MCPError {
  code: number;
  message: string;
  data?: any;
}

// Request/Response types
export interface MCPRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: any;
}

export interface MCPResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: any;
  error?: MCPError;
}

// Tool-specific types
export interface MCPListToolsResponse {
  tools: Array<{
    name: string;
    description: string;
    inputSchema: {
      type: 'object';
      properties: Record<string, any>;
      required?: string[];
    };
  }>;
}

export interface MCPCallToolRequest {
  name: string;
  arguments: Record<string, any>;
}

// Resource-specific types
export interface MCPListResourcesResponse {
  resources: MCPResource[];
}

export interface MCPReadResourceRequest {
  uri: string;
}

export interface MCPReadResourceResponse {
  contents: MCPResourceContent[];
}

// Prompt-specific types
export interface MCPListPromptsResponse {
  prompts: MCPPrompt[];
}

export interface MCPGetPromptRequest {
  name: string;
  arguments?: Record<string, any>;
}

export interface MCPGetPromptResponse extends MCPPromptResult {}
