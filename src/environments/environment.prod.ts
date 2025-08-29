export const environment = {
  production: true,
  security: {
    enableValidation: true,
    enableErrorReporting: true,
    enableSecurityHeaders: true,
    enableContentSanitization: true,
    maxErrorsPerSession: 50, // Stricter in production
    logLevel: 'error', // Only log errors in production
    allowUnsafeEval: false, // Security: Disabled in production
    allowUnsafeInline: false, // Security: Disabled in production
    trustedHosts: [], // Configure with actual production hosts
    database: {
      enableValidation: true,
      maxKeyLength: 100,
      maxDataSize: 5242880, // 5MB - stricter in production
      allowedStores: ['characters', 'saves', 'extensions', 'settings', 'avatars']
    },
    extension: {
      enableSandboxing: true, // Security: Enabled in production
      allowUnsafeContent: false, // Security: Disabled in production
      requireSignatures: true // Security: Enabled in production
    }
  },
  monitoring: {
    enabled: true, // Enable monitoring in production
    endpoint: 'https://your-monitoring-service.com/api/errors',
    sampleRate: 0.1 // 10% sampling rate
  },
  features: {
    enableDevTools: false, // Security: Disabled in production
    enableDebugMode: false, // Security: Disabled in production
    enablePerformanceMonitoring: true
  }
};
