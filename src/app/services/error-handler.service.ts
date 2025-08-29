import { Injectable, ErrorHandler } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface ErrorContext {
  operation?: string;
  component?: string;
  userId?: string;
  sessionId?: string;
  timestamp?: Date;
  userAgent?: string;
  url?: string;
}

export interface LoggedError {
  id: string;
  message: string;
  stack?: string;
  context: ErrorContext;
  sanitizedContext: any;
}

@Injectable({ providedIn: 'root' })
export class ErrorHandlerService implements ErrorHandler {

  private errorCount = 0;
  private maxErrorsPerSession = 100; // Prevent error spam

  constructor() { }

  /**
   * Global error handler for uncaught errors
   */
  handleError(error: Error | any): void {
    this.errorCount++;
    
    // Prevent error spam
    if (this.errorCount > this.maxErrorsPerSession) {
      console.warn('Maximum errors per session reached. Suppressing further error logging.');
      return;
    }

    const errorId = this.generateErrorId();
    const context: ErrorContext = {
      timestamp: new Date(),
      userAgent: this.getSanitizedUserAgent(),
      url: this.getSanitizedUrl()
    };

    const loggedError = this.createLoggedError(errorId, error, context);
    
    // Log to console (development)
    console.error(`[${errorId}] Unhandled Error:`, {
      message: loggedError.message,
      context: loggedError.sanitizedContext
    });

    // In production, this could send to external monitoring service
    // this.sendToMonitoringService(loggedError);
  }

  /**
   * Handle service operation errors with context
   */
  handleServiceError<T>(
    operation: string = 'operation',
    fallbackResult?: T,
    showToUser: boolean = true
  ) {
    return (error: any): Observable<T> => {
      const errorId = this.generateErrorId();
      const context: ErrorContext = {
        operation,
        timestamp: new Date(),
        userAgent: this.getSanitizedUserAgent(),
        url: this.getSanitizedUrl()
      };

      const loggedError = this.createLoggedError(errorId, error, context);
      
      // Log sanitized error details
      console.error(`[${errorId}] Service Error in ${operation}:`, {
        message: loggedError.message,
        context: loggedError.sanitizedContext
      });

      // Show user-friendly message if requested
      if (showToUser) {
        this.showUserFriendlyMessage(operation, errorId);
      }

      // Return fallback result or empty observable
      return of(fallbackResult as T);
    };
  }

  /**
   * Handle component errors with context
   */
  handleComponentError(
    componentName: string,
    methodName: string,
    error: any,
    showToUser: boolean = true
  ): string {
    const errorId = this.generateErrorId();
    const context: ErrorContext = {
      operation: `${componentName}.${methodName}`,
      component: componentName,
      timestamp: new Date(),
      userAgent: this.getSanitizedUserAgent(),
      url: this.getSanitizedUrl()
    };

    const loggedError = this.createLoggedError(errorId, error, context);
    
    // Log sanitized error details
    console.error(`[${errorId}] Component Error in ${componentName}.${methodName}:`, {
      message: loggedError.message,
      context: loggedError.sanitizedContext
    });

    if (showToUser) {
      this.showUserFriendlyMessage(`${componentName} operation`, errorId);
    }

    return errorId;
  }

  /**
   * Validate and sanitize error data before logging
   */
  private createLoggedError(errorId: string, error: any, context: ErrorContext): LoggedError {
    const sanitizedMessage = this.sanitizeErrorMessage((error && error.message) || 'Unknown error');
    const sanitizedStack = this.sanitizeStackTrace(error && error.stack);
    const sanitizedContext = this.sanitizeContext(context);

    return {
      id: errorId,
      message: sanitizedMessage,
      stack: sanitizedStack,
      context,
      sanitizedContext
    };
  }

  /**
   * Sanitize error message to prevent information leakage
   */
  private sanitizeErrorMessage(message: string): string {
    if (!message || typeof message !== 'string') {
      return 'Invalid error message';
    }

    // Remove potentially sensitive patterns
    let sanitized = message
      .replace(/password[=:]\s*\S+/gi, 'password=***')
      .replace(/token[=:]\s*\S+/gi, 'token=***')
      .replace(/key[=:]\s*\S+/gi, 'key=***')
      .replace(/secret[=:]\s*\S+/gi, 'secret=***')
      .replace(/auth[=:]\s*\S+/gi, 'auth=***')
      .replace(/api[_-]?key[=:]\s*\S+/gi, 'api_key=***')
      .replace(/access[_-]?token[=:]\s*\S+/gi, 'access_token=***');

    // Remove file paths that might contain sensitive info
    sanitized = sanitized.replace(/\/[^\/\s]*\/[^\/\s]*\/[^\s]*/g, '/***/***/***');
    
    // Limit length to prevent log spam
    if (sanitized.length > 500) {
      sanitized = sanitized.substring(0, 497) + '...';
    }

    return sanitized;
  }

  /**
   * Sanitize stack trace to remove sensitive information
   */
  private sanitizeStackTrace(stack?: string): string | undefined {
    if (!stack || typeof stack !== 'string') {
      return undefined;
    }

    // Remove file paths and keep only function names and line numbers
    let sanitized = stack
      .replace(/\/[^\/\s]*\/[^\/\s]*\/[^\s]*/g, '/***/***/***')
      .replace(/at\s+[^(]+\([^)]*\)/g, 'at [sanitized]')
      .replace(/https?:\/\/[^\s)]+/g, '[url-sanitized]');

    // Limit length
    if (sanitized.length > 1000) {
      sanitized = sanitized.substring(0, 997) + '...';
    }

    return sanitized;
  }

  /**
   * Sanitize context to remove sensitive information
   */
  private sanitizeContext(context: ErrorContext): any {
    return {
      operation: context.operation,
      component: context.component,
      timestamp: context.timestamp?.toISOString(),
      userAgent: this.getSanitizedUserAgent(),
      url: this.getSanitizedUrl(),
      // Exclude potentially sensitive fields like userId, sessionId
    };
  }

  /**
   * Get sanitized user agent (remove specific version details)
   */
  private getSanitizedUserAgent(): string {
    try {
      const ua = navigator.userAgent;
      if (!ua) return 'unknown';
      
      // Extract basic browser info without detailed version numbers
      const browserMatch = ua.match(/(Chrome|Firefox|Safari|Edge|Opera)\/[\d.]+/);
      const browser = browserMatch ? browserMatch[0] : 'unknown-browser';
      
      const osMatch = ua.match(/(Windows|Mac|Linux|Android|iOS)/);
      const os = osMatch ? osMatch[0] : 'unknown-os';
      
      return `${browser} on ${os}`;
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Get sanitized URL (remove query parameters and hash)
   */
  private getSanitizedUrl(): string {
    try {
      const url = window.location.href;
      if (!url) return 'unknown';
      
      // Remove query parameters and hash
      const baseUrl = url.split('?')[0].split('#')[0];
      
      // Only keep the path part, remove domain
      const pathMatch = baseUrl.match(/https?:\/\/[^\/]+(\/.*)?$/);
      return pathMatch && pathMatch[1] ? pathMatch[1] : '/';
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Generate unique error ID for tracking
   */
  private generateErrorId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return `err_${timestamp}_${random}`;
  }

  /**
   * Show user-friendly error message
   */
  private showUserFriendlyMessage(operation: string, errorId: string): void {
    const messages: { [key: string]: string } = {
      'save': 'Unable to save your progress. Please try again.',
      'load': 'Unable to load your saved data. The file may be corrupted.',
      'character_create': 'Unable to create character. Please check your input.',
      'character_save': 'Unable to save character. Please try again.',
      'database': 'Database operation failed. Please try again.',
      'validation': 'Input validation failed. Please check your data.',
    };

    const friendlyMessage = messages[operation] || 'An unexpected error occurred. Please try again.';
    
    // In a real application, this would show a toast notification or modal
    // For now, we'll use console.warn to indicate user-facing message
    console.warn(`USER MESSAGE: ${friendlyMessage} (Error ID: ${errorId})`);
  }

  /**
   * Check if error is a network error
   */
  isNetworkError(error: any): boolean {
    return error?.name === 'NetworkError' || 
           error?.message?.includes('network') ||
           error?.message?.includes('fetch') ||
           error?.status === 0;
  }

  /**
   * Check if error is a validation error
   */
  isValidationError(error: any): boolean {
    return error?.name === 'ValidationError' ||
           error?.message?.includes('validation') ||
           error?.message?.includes('invalid');
  }

  /**
   * Get error statistics for monitoring
   */
  getErrorStats(): { count: number; maxReached: boolean } {
    return {
      count: this.errorCount,
      maxReached: this.errorCount >= this.maxErrorsPerSession
    };
  }

  /**
   * Reset error counter (useful for testing or session management)
   */
  resetErrorCount(): void {
    this.errorCount = 0;
  }
}