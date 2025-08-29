import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

export interface SecurityConfig {
  validation: {
    enabled: boolean;
    maxKeyLength: number;
    maxDataSize: number;
    allowedStores: string[];
  };
  errorReporting: {
    enabled: boolean;
    maxErrorsPerSession: number;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
  };
  contentSecurity: {
    enableSanitization: boolean;
    allowUnsafeEval: boolean;
    allowUnsafeInline: boolean;
    trustedHosts: string[];
  };
  extensions: {
    enableSandboxing: boolean;
    allowUnsafeContent: boolean;
    requireSignatures: boolean;
  };
  monitoring: {
    enabled: boolean;
    endpoint: string | null;
    sampleRate: number;
  };
  features: {
    enableDevTools: boolean;
    enableDebugMode: boolean;
    enablePerformanceMonitoring: boolean;
  };
}

@Injectable({ providedIn: 'root' })
export class SecurityConfigService {

  private config: SecurityConfig;

  constructor() {
    this.initializeConfig();
  }

  /**
   * Initialize security configuration from environment
   */
  private initializeConfig(): void {
    this.config = {
      validation: {
        enabled: environment.security?.enableValidation ?? true,
        maxKeyLength: environment.security?.database?.maxKeyLength ?? 100,
        maxDataSize: environment.security?.database?.maxDataSize ?? 10485760,
        allowedStores: environment.security?.database?.allowedStores ?? ['characters', 'saves', 'extensions', 'settings', 'avatars']
      },
      errorReporting: {
        enabled: environment.security?.enableErrorReporting ?? true,
        maxErrorsPerSession: environment.security?.maxErrorsPerSession ?? 100,
        logLevel: environment.security?.logLevel ?? 'error'
      },
      contentSecurity: {
        enableSanitization: environment.security?.enableContentSanitization ?? true,
        allowUnsafeEval: environment.security?.allowUnsafeEval ?? false,
        allowUnsafeInline: environment.security?.allowUnsafeInline ?? false,
        trustedHosts: environment.security?.trustedHosts ?? []
      },
      extensions: {
        enableSandboxing: environment.security?.extension?.enableSandboxing ?? true,
        allowUnsafeContent: environment.security?.extension?.allowUnsafeContent ?? false,
        requireSignatures: environment.security?.extension?.requireSignatures ?? true
      },
      monitoring: {
        enabled: environment.monitoring?.enabled ?? false,
        endpoint: environment.monitoring?.endpoint ?? null,
        sampleRate: environment.monitoring?.sampleRate ?? 0.1
      },
      features: {
        enableDevTools: environment.features?.enableDevTools ?? false,
        enableDebugMode: environment.features?.enableDebugMode ?? false,
        enablePerformanceMonitoring: environment.features?.enablePerformanceMonitoring ?? false
      }
    };
  }

  /**
   * Get complete security configuration
   */
  getConfig(): SecurityConfig {
    return { ...this.config };
  }

  /**
   * Check if validation is enabled
   */
  isValidationEnabled(): boolean {
    return this.config.validation.enabled;
  }

  /**
   * Check if error reporting is enabled
   */
  isErrorReportingEnabled(): boolean {
    return this.config.errorReporting.enabled;
  }

  /**
   * Check if content sanitization is enabled
   */
  isContentSanitizationEnabled(): boolean {
    return this.config.contentSecurity.enableSanitization;
  }

  /**
   * Check if extension sandboxing is enabled
   */
  isExtensionSandboxingEnabled(): boolean {
    return this.config.extensions.enableSandboxing;
  }

  /**
   * Check if monitoring is enabled
   */
  isMonitoringEnabled(): boolean {
    return this.config.monitoring.enabled;
  }

  /**
   * Get maximum allowed key length
   */
  getMaxKeyLength(): number {
    return this.config.validation.maxKeyLength;
  }

  /**
   * Get maximum allowed data size
   */
  getMaxDataSize(): number {
    return this.config.validation.maxDataSize;
  }

  /**
   * Get allowed database stores
   */
  getAllowedStores(): string[] {
    return [...this.config.validation.allowedStores];
  }

  /**
   * Check if store name is allowed
   */
  isStoreAllowed(storeName: string): boolean {
    return this.config.validation.allowedStores.includes(storeName);
  }

  /**
   * Get maximum errors per session
   */
  getMaxErrorsPerSession(): number {
    return this.config.errorReporting.maxErrorsPerSession;
  }

  /**
   * Get log level
   */
  getLogLevel(): string {
    return this.config.errorReporting.logLevel;
  }

  /**
   * Check if unsafe eval is allowed
   */
  isUnsafeEvalAllowed(): boolean {
    return this.config.contentSecurity.allowUnsafeEval;
  }

  /**
   * Check if unsafe inline is allowed
   */
  isUnsafeInlineAllowed(): boolean {
    return this.config.contentSecurity.allowUnsafeInline;
  }

  /**
   * Get trusted hosts
   */
  getTrustedHosts(): string[] {
    return [...this.config.contentSecurity.trustedHosts];
  }

  /**
   * Check if host is trusted
   */
  isHostTrusted(host: string): boolean {
    return this.config.contentSecurity.trustedHosts.includes(host);
  }

  /**
   * Check if unsafe content is allowed in extensions
   */
  isUnsafeContentAllowed(): boolean {
    return this.config.extensions.allowUnsafeContent;
  }

  /**
   * Check if extension signatures are required
   */
  areSignaturesRequired(): boolean {
    return this.config.extensions.requireSignatures;
  }

  /**
   * Get monitoring endpoint
   */
  getMonitoringEndpoint(): string | null {
    return this.config.monitoring.endpoint;
  }

  /**
   * Get monitoring sample rate
   */
  getMonitoringSampleRate(): number {
    return this.config.monitoring.sampleRate;
  }

  /**
   * Check if dev tools are enabled
   */
  areDevToolsEnabled(): boolean {
    return this.config.features.enableDevTools;
  }

  /**
   * Check if debug mode is enabled
   */
  isDebugModeEnabled(): boolean {
    return this.config.features.enableDebugMode;
  }

  /**
   * Check if performance monitoring is enabled
   */
  isPerformanceMonitoringEnabled(): boolean {
    return this.config.features.enablePerformanceMonitoring;
  }

  /**
   * Validate security configuration
   */
  validateConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate validation config
    if (this.config.validation.maxKeyLength < 1) {
      errors.push('Maximum key length must be at least 1');
    }
    if (this.config.validation.maxDataSize < 1024) {
      errors.push('Maximum data size must be at least 1024 bytes');
    }
    if (this.config.validation.allowedStores.length === 0) {
      errors.push('At least one store must be allowed');
    }

    // Validate error reporting config
    if (this.config.errorReporting.maxErrorsPerSession < 1) {
      errors.push('Maximum errors per session must be at least 1');
    }
    if (!['debug', 'info', 'warn', 'error'].includes(this.config.errorReporting.logLevel)) {
      errors.push('Log level must be debug, info, warn, or error');
    }

    // Validate monitoring config
    if (this.config.monitoring.enabled && !this.config.monitoring.endpoint) {
      errors.push('Monitoring endpoint is required when monitoring is enabled');
    }
    if (this.config.monitoring.sampleRate < 0 || this.config.monitoring.sampleRate > 1) {
      errors.push('Monitoring sample rate must be between 0 and 1');
    }

    // Validate security settings for production
    if (environment.production) {
      if (this.config.contentSecurity.allowUnsafeEval) {
        errors.push('Unsafe eval should not be allowed in production');
      }
      if (this.config.contentSecurity.allowUnsafeInline) {
        errors.push('Unsafe inline should not be allowed in production');
      }
      if (!this.config.extensions.enableSandboxing) {
        errors.push('Extension sandboxing should be enabled in production');
      }
      if (this.config.extensions.allowUnsafeContent) {
        errors.push('Unsafe extension content should not be allowed in production');
      }
      if (this.config.features.enableDevTools) {
        errors.push('Dev tools should be disabled in production');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Log security configuration status
   */
  logConfigStatus(): void {
    const validation = this.validateConfig();
    
    if (validation.isValid) {
      console.log('✅ Security configuration is valid');
    } else {
      console.error('❌ Security configuration has issues:', validation.errors);
    }

    if (this.isDebugModeEnabled()) {
      console.log('🔧 Security Configuration:', {
        validation: this.config.validation,
        errorReporting: this.config.errorReporting,
        contentSecurity: this.config.contentSecurity,
        extensions: this.config.extensions,
        monitoring: { 
          enabled: this.config.monitoring.enabled, 
          hasEndpoint: !!this.config.monitoring.endpoint,
          sampleRate: this.config.monitoring.sampleRate
        },
        features: this.config.features
      });
    }
  }
}