/**
 * Error logging utility for the application
 */

export interface ErrorLog {
  timestamp: string;
  level: 'error' | 'warn' | 'info';
  message: string;
  context?: string;
  error?: any;
  userId?: string;
  shop?: string;
}

class Logger {
  private logs: ErrorLog[] = [];
  private maxLogs = 100;

  log(level: ErrorLog['level'], message: string, context?: string, error?: any, metadata?: { userId?: string; shop?: string }) {
    const logEntry: ErrorLog = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error: error ? this.serializeError(error) : undefined,
      userId: metadata?.userId,
      shop: metadata?.shop,
    };

    this.logs.push(logEntry);
    
    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output with colors
    const prefix = `[${logEntry.timestamp}] [${level.toUpperCase()}]${context ? ` [${context}]` : ''}`;
    
    switch (level) {
      case 'error':
        console.error(prefix, message, error || '');
        break;
      case 'warn':
        console.warn(prefix, message);
        break;
      case 'info':
        console.info(prefix, message);
        break;
    }

    return logEntry;
  }

  error(message: string, error?: any, context?: string, metadata?: { userId?: string; shop?: string }) {
    return this.log('error', message, context, error, metadata);
  }

  warn(message: string, context?: string, metadata?: { userId?: string; shop?: string }) {
    return this.log('warn', message, context, undefined, metadata);
  }

  info(message: string, context?: string, metadata?: { userId?: string; shop?: string }) {
    return this.log('info', message, context, undefined, metadata);
  }

  getLogs(level?: ErrorLog['level']): ErrorLog[] {
    if (level) {
      return this.logs.filter(log => log.level === level);
    }
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }

  private serializeError(error: any): any {
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }
    return error;
  }
}

// Singleton instance
export const logger = new Logger();

// Helper function for API error responses
export function createErrorResponse(
  message: string,
  error?: any,
  status: number = 500,
  context?: string
) {
  logger.error(message, error, context);
  
  return {
    error: message,
    details: process.env.NODE_ENV === 'development' 
      ? (error?.message || String(error))
      : undefined,
    timestamp: new Date().toISOString(),
  };
}
