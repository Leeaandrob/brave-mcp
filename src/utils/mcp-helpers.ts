import { mcpConfig } from '../config/mcp-config.js';

export class MCPErrorHandler {
  static handle(toolName: string, error: unknown): never {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const timestamp = new Date().toISOString();
    
    // Log detailed error information
    console.error(`[${timestamp}] MCP Tool Error:`, {
      tool: toolName,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    // Return user-friendly error
    throw new Error(`${toolName} failed: ${errorMessage}`);
  }

  static handleValidation(toolName: string, validationError: any): never {
    const issues = validationError.issues || [{ message: validationError.message }];
    const errorMessage = `Invalid parameters: ${issues.map((issue: any) => issue.message).join(', ')}`;
    
    MCPLogger.logError(`Validation error in ${toolName}`, validationError);
    throw new Error(errorMessage);
  }
}

export class MCPLogger {
  private static shouldLog(level: string): boolean {
    const levels = ['error', 'warn', 'info', 'debug'];
    const currentLevel = mcpConfig.logging.level;
    const currentIndex = levels.indexOf(currentLevel);
    const messageIndex = levels.indexOf(level);
    
    return messageIndex <= currentIndex;
  }

  private static formatMessage(level: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const dataStr = data ? ` ${JSON.stringify(data)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${dataStr}`;
  }

  static logError(message: string, error?: any): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      }));
    }
  }

  static logWarn(message: string, data?: any): void {
    if (this.shouldLog('warn')) {
      console.error(this.formatMessage('warn', message, data));
    }
  }

  static logInfo(message: string, data?: any): void {
    if (this.shouldLog('info')) {
      console.error(this.formatMessage('info', message, data));
    }
  }

  static logDebug(message: string, data?: any): void {
    if (this.shouldLog('debug')) {
      console.error(this.formatMessage('debug', message, data));
    }
  }

  static logRequest(method: string, params?: any): void {
    if (this.shouldLog('info')) {
      console.error(this.formatMessage('info', `MCP Request: ${method}`, params));
    }
  }

  static logToolCall(toolName: string, args: any): void {
    if (this.shouldLog('info')) {
      console.error(this.formatMessage('info', `Tool called: ${toolName}`, {
        args: this.sanitizeArgs(args),
        timestamp: new Date().toISOString(),
      }));
    }
  }

  static logToolResult(toolName: string, resultSize: number): void {
    if (this.shouldLog('info')) {
      console.error(this.formatMessage('info', `Tool completed: ${toolName}`, {
        resultSize,
        timestamp: new Date().toISOString(),
      }));
    }
  }

  static logToolExecution(toolName: string, args: any): void {
    if (this.shouldLog('debug')) {
      console.error(this.formatMessage('debug', `Executing tool: ${toolName}`, {
        args: this.sanitizeArgs(args),
      }));
    }
  }

  static logAPIRequest(url: string, params: any): void {
    if (mcpConfig.logging.enableAPILogs && this.shouldLog('debug')) {
      console.error(this.formatMessage('debug', `API Request: ${url}`, {
        params: this.sanitizeArgs(params),
      }));
    }
  }

  static logAPIResponse(url: string, status: number, data: any): void {
    if (mcpConfig.logging.enableAPILogs && this.shouldLog('debug')) {
      console.error(this.formatMessage('debug', `API Response: ${url}`, {
        status,
        dataSize: JSON.stringify(data).length,
      }));
    }
  }

  static logAPIError(url: string, error: any): void {
    if (mcpConfig.logging.enableAPILogs && this.shouldLog('error')) {
      console.error(this.formatMessage('error', `API Error: ${url}`, {
        status: error.response?.status,
        message: error.message,
      }));
    }
  }

  static logPerformance(operation: string, duration: number, metadata?: any): void {
    if (mcpConfig.logging.enablePerformanceLogs && this.shouldLog('info')) {
      console.error(this.formatMessage('info', `Performance: ${operation}`, {
        duration_ms: duration,
        ...metadata,
      }));
    }
  }

  private static sanitizeArgs(args: any): any {
    if (!args) return args;
    
    // Remove or mask sensitive information
    const sanitized = { ...args };
    
    // List of potentially sensitive field names
    const sensitiveFields = ['api_key', 'token', 'password', 'secret'];
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '***masked***';
      }
    }
    
    return sanitized;
  }
}

export class MCPPerformanceMonitor {
  private static timers: Map<string, number> = new Map();

  static startTimer(operation: string): void {
    this.timers.set(operation, Date.now());
  }

  static endTimer(operation: string, metadata?: any): number {
    const startTime = this.timers.get(operation);
    if (!startTime) {
      MCPLogger.logWarn(`Timer not found for operation: ${operation}`);
      return 0;
    }

    const duration = Date.now() - startTime;
    this.timers.delete(operation);
    
    MCPLogger.logPerformance(operation, duration, metadata);
    return duration;
  }

  static async measureAsync<T>(operation: string, fn: () => Promise<T>, metadata?: any): Promise<T> {
    this.startTimer(operation);
    try {
      const result = await fn();
      this.endTimer(operation, metadata);
      return result;
    } catch (error) {
      this.endTimer(operation, { ...metadata, error: true });
      throw error;
    }
  }
}

export class MCPHealthCheck {
  static async checkBraveAPI(): Promise<boolean> {
    try {
      if (!mcpConfig.brave.apiKey) {
        return false; // No API key configured
      }

      const response = await fetch(`${mcpConfig.brave.apiUrl}/web/search?q=test&count=1`, {
        headers: {
          'X-Subscription-Token': mcpConfig.brave.apiKey,
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(5000),
      });
      
      return response.ok;
    } catch {
      return false;
    }
  }

  static async getHealthStatus() {
    const startTime = Date.now();
    const braveAPIHealthy = await this.checkBraveAPI();
    const healthCheckDuration = Date.now() - startTime;

    return {
      server: 'healthy',
      timestamp: new Date().toISOString(),
      version: mcpConfig.server.version,
      uptime_seconds: Math.floor(process.uptime()),
      memory_usage: {
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024), // MB
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024), // MB
      },
      brave_api: {
        configured: !!mcpConfig.brave.apiKey,
        healthy: braveAPIHealthy,
        check_duration_ms: healthCheckDuration,
      },
      configuration: {
        cache_enabled: mcpConfig.cache.enabled,
        rate_limit_per_minute: mcpConfig.limits.rateLimitPerMinute,
        max_query_length: mcpConfig.limits.maxQueryLength,
        max_results: mcpConfig.limits.maxResults,
      },
    };
  }
}
