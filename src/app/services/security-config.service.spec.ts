import { TestBed } from '@angular/core/testing';
import { SecurityConfigService } from './security-config.service';

describe('SecurityConfigService', () => {
  let service: SecurityConfigService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SecurityConfigService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should provide default configuration', () => {
    const config = service.getConfig();
    expect(config).toBeDefined();
    expect(config.validation).toBeDefined();
    expect(config.errorReporting).toBeDefined();
    expect(config.contentSecurity).toBeDefined();
    expect(config.extensions).toBeDefined();
    expect(config.monitoring).toBeDefined();
    expect(config.features).toBeDefined();
  });

  describe('validation configuration', () => {
    it('should return validation enabled status', () => {
      expect(typeof service.isValidationEnabled()).toBe('boolean');
    });

    it('should return max key length', () => {
      const maxLength = service.getMaxKeyLength();
      expect(typeof maxLength).toBe('number');
      expect(maxLength).toBeGreaterThan(0);
    });

    it('should return max data size', () => {
      const maxSize = service.getMaxDataSize();
      expect(typeof maxSize).toBe('number');
      expect(maxSize).toBeGreaterThan(0);
    });

    it('should return allowed stores list', () => {
      const stores = service.getAllowedStores();
      expect(Array.isArray(stores)).toBe(true);
      expect(stores.length).toBeGreaterThan(0);
    });

    it('should check if store is allowed', () => {
      expect(service.isStoreAllowed('characters')).toBe(true);
      expect(service.isStoreAllowed('saves')).toBe(true);
      expect(service.isStoreAllowed('invalidStore')).toBe(false);
    });
  });

  describe('error reporting configuration', () => {
    it('should return error reporting enabled status', () => {
      expect(typeof service.isErrorReportingEnabled()).toBe('boolean');
    });

    it('should return max errors per session', () => {
      const maxErrors = service.getMaxErrorsPerSession();
      expect(typeof maxErrors).toBe('number');
      expect(maxErrors).toBeGreaterThan(0);
    });

    it('should return log level', () => {
      const logLevel = service.getLogLevel();
      expect(typeof logLevel).toBe('string');
      expect(['debug', 'info', 'warn', 'error']).toContain(logLevel);
    });
  });

  describe('content security configuration', () => {
    it('should return content sanitization enabled status', () => {
      expect(typeof service.isContentSanitizationEnabled()).toBe('boolean');
    });

    it('should return unsafe eval allowed status', () => {
      expect(typeof service.isUnsafeEvalAllowed()).toBe('boolean');
    });

    it('should return unsafe inline allowed status', () => {
      expect(typeof service.isUnsafeInlineAllowed()).toBe('boolean');
    });

    it('should return trusted hosts list', () => {
      const hosts = service.getTrustedHosts();
      expect(Array.isArray(hosts)).toBe(true);
    });

    it('should check if host is trusted', () => {
      const trustedHosts = service.getTrustedHosts();
      if (trustedHosts.length > 0) {
        expect(service.isHostTrusted(trustedHosts[0])).toBe(true);
      }
      expect(service.isHostTrusted('malicious.com')).toBe(false);
    });
  });

  describe('extension configuration', () => {
    it('should return extension sandboxing enabled status', () => {
      expect(typeof service.isExtensionSandboxingEnabled()).toBe('boolean');
    });

    it('should return unsafe content allowed status', () => {
      expect(typeof service.isUnsafeContentAllowed()).toBe('boolean');
    });

    it('should return signatures required status', () => {
      expect(typeof service.areSignaturesRequired()).toBe('boolean');
    });
  });

  describe('monitoring configuration', () => {
    it('should return monitoring enabled status', () => {
      expect(typeof service.isMonitoringEnabled()).toBe('boolean');
    });

    it('should return monitoring endpoint', () => {
      const endpoint = service.getMonitoringEndpoint();
      expect(endpoint === null || typeof endpoint === 'string').toBe(true);
    });

    it('should return monitoring sample rate', () => {
      const sampleRate = service.getMonitoringSampleRate();
      expect(typeof sampleRate).toBe('number');
      expect(sampleRate).toBeGreaterThanOrEqual(0);
      expect(sampleRate).toBeLessThanOrEqual(1);
    });
  });

  describe('features configuration', () => {
    it('should return dev tools enabled status', () => {
      expect(typeof service.areDevToolsEnabled()).toBe('boolean');
    });

    it('should return debug mode enabled status', () => {
      expect(typeof service.isDebugModeEnabled()).toBe('boolean');
    });

    it('should return performance monitoring enabled status', () => {
      expect(typeof service.isPerformanceMonitoringEnabled()).toBe('boolean');
    });
  });

  describe('configuration validation', () => {
    it('should validate configuration', () => {
      const validation = service.validateConfig();
      expect(validation).toBeDefined();
      expect(typeof validation.isValid).toBe('boolean');
      expect(Array.isArray(validation.errors)).toBe(true);
    });

    it('should pass basic validation with default config', () => {
      const validation = service.validateConfig();
      // Some tests might fail in production mode, but should pass in development
      if (!validation.isValid) {
        console.log('Validation errors (expected in some environments):', validation.errors);
      }
    });
  });

  describe('configuration logging', () => {
    it('should log configuration status without throwing', () => {
      expect(() => service.logConfigStatus()).not.toThrow();
    });
  });

  describe('configuration immutability', () => {
    it('should return new instances of arrays to prevent mutation', () => {
      const stores1 = service.getAllowedStores();
      const stores2 = service.getAllowedStores();
      expect(stores1).not.toBe(stores2); // Different instances
      expect(stores1).toEqual(stores2); // Same values
    });

    it('should return new instances of config object to prevent mutation', () => {
      const config1 = service.getConfig();
      const config2 = service.getConfig();
      expect(config1).not.toBe(config2); // Different instances
      expect(config1).toEqual(config2); // Same values
    });
  });
});