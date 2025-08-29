// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  security: {
    enableValidation: true,
    enableErrorReporting: true,
    enableSecurityHeaders: true,
    enableContentSanitization: true,
    maxErrorsPerSession: 100,
    logLevel: 'debug',
    allowUnsafeEval: true, // Development only
    allowUnsafeInline: true, // Development only
    trustedHosts: ['localhost', '127.0.0.1'],
    database: {
      enableValidation: true,
      maxKeyLength: 100,
      maxDataSize: 10485760, // 10MB
      allowedStores: ['characters', 'saves', 'extensions', 'settings', 'avatars']
    },
    extension: {
      enableSandboxing: false, // Development only
      allowUnsafeContent: true, // Development only
      requireSignatures: false // Development only
    }
  },
  monitoring: {
    enabled: false,
    endpoint: null,
    sampleRate: 1.0
  },
  features: {
    enableDevTools: true,
    enableDebugMode: true,
    enablePerformanceMonitoring: false
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import "zone.js/dist/zone-error";  // Included with Angular CLI.

/*
 * Security Configuration Notes:
 * - enableValidation: Enables input validation across the application
 * - enableErrorReporting: Enables centralized error handling and reporting
 * - enableSecurityHeaders: Ensures security headers are properly configured
 * - enableContentSanitization: Sanitizes user-generated content
 * - database.enableValidation: Validates all database operations
 * - extension.enableSandboxing: Sandboxes extension execution (disabled in dev)
 * - allowUnsafeEval/allowUnsafeInline: Required for Angular dev builds
 */
