import { Injectable } from '@angular/core';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedValue?: any;
}

@Injectable({
  providedIn: 'root'
})
export class SecurityService {
  // XSS prevention patterns
  private readonly XSS_PATTERNS = [
    /<script[^>]*>.*?<\/script>/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /<object[^>]*>.*?<\/object>/gi,
    /<embed[^>]*>/gi,
    /<link[^>]*>/gi,
    /<meta[^>]*>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /data:text\/html/gi,
    /on\w+\s*=/gi  // Event handlers like onclick, onload, etc.
  ];

  // SQL injection patterns (for general security awareness)
  private readonly INJECTION_PATTERNS = [
    /('|(\\')|(;)|(\\);)|(\|)|(\*)|(%27)|(%3B)|(\+)/gi,
    /exec(\s|\+)+(s|x)p\w+/gi,
    /union.*select/gi,
    /insert.*into/gi,
    /delete.*from/gi,
    /update.*set/gi,
    /drop.*table/gi
  ];

  // Prototype pollution prevention
  private readonly DANGEROUS_KEYS = [
    '__proto__',
    'constructor',
    'prototype',
    '__defineGetter__',
    '__defineSetter__',
    '__lookupGetter__',
    '__lookupSetter__',
    'toString',
    'valueOf',
    'hasOwnProperty'
  ];

  // File upload security
  private readonly ALLOWED_FILE_EXTENSIONS = [
    '.json',
    '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg',
    '.mp3', '.wav', '.ogg',
    '.txt', '.md'
  ];

  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly MAX_STRING_LENGTH = 10000;
  private readonly MAX_ARRAY_LENGTH = 1000;
  private readonly MAX_OBJECT_DEPTH = 10;

  /**
   * Sanitizes HTML content to prevent XSS attacks
   */
  sanitizeHtml(html: string): string {
    if (!html || typeof html !== 'string') {
      return '';
    }

    let sanitized = html;
    
    // Remove dangerous patterns
    this.XSS_PATTERNS.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });

    // Remove dangerous attributes
    sanitized = sanitized.replace(/\s*(on\w+|href|src)\s*=\s*["'][^"']*["']/gi, '');
    
    // Encode remaining HTML entities
    sanitized = sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');

    return sanitized;
  }

  /**
   * Validates and sanitizes string input
   */
  validateString(value: any, maxLength: number = this.MAX_STRING_LENGTH): ValidationResult {
    const errors: string[] = [];

    if (value === null || value === undefined) {
      return { isValid: false, errors: ['Value cannot be null or undefined'] };
    }

    if (typeof value !== 'string') {
      errors.push('Value must be a string');
      return { isValid: false, errors };
    }

    if (value.length > maxLength) {
      errors.push(`String exceeds maximum length of ${maxLength} characters`);
      return { isValid: false, errors };
    }

    // Check for injection patterns
    const hasInjectionPattern = this.INJECTION_PATTERNS.some(pattern => pattern.test(value));
    if (hasInjectionPattern) {
      errors.push('String contains potentially malicious content');
      return { isValid: false, errors };
    }

    // Sanitize the string
    const sanitizedValue = this.sanitizeHtml(value);

    return { isValid: true, errors: [], sanitizedValue };
  }

  /**
   * Validates object keys to prevent prototype pollution
   */
  validateObjectKeys(obj: any): ValidationResult {
    const errors: string[] = [];

    if (obj === null || obj === undefined || typeof obj !== 'object') {
      return { isValid: false, errors: ['Value must be a valid object'] };
    }

    const keys = Object.keys(obj);
    
    for (const key of keys) {
      if (this.DANGEROUS_KEYS.includes(key.toLowerCase())) {
        errors.push(`Dangerous key '${key}' is not allowed`);
      }
    }

    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    return { isValid: true, errors: [] };
  }

  /**
   * Deep sanitizes an object, removing dangerous properties and validating values
   */
  sanitizeObject(obj: any, depth: number = 0): any {
    if (depth > this.MAX_OBJECT_DEPTH) {
      throw new Error(`Object depth exceeds maximum allowed depth of ${this.MAX_OBJECT_DEPTH}`);
    }

    if (obj === null || obj === undefined) {
      return obj;
    }

    if (Array.isArray(obj)) {
      if (obj.length > this.MAX_ARRAY_LENGTH) {
        throw new Error(`Array length exceeds maximum allowed length of ${this.MAX_ARRAY_LENGTH}`);
      }
      return obj.map(item => this.sanitizeObject(item, depth + 1));
    }

    if (typeof obj === 'string') {
      const result = this.validateString(obj);
      if (!result.isValid) {
        throw new Error(`Invalid string: ${result.errors.join(', ')}`);
      }
      return result.sanitizedValue;
    }

    if (typeof obj === 'object') {
      const keyValidation = this.validateObjectKeys(obj);
      if (!keyValidation.isValid) {
        throw new Error(`Invalid object keys: ${keyValidation.errors.join(', ')}`);
      }

      const sanitizedObj: any = {};
      
      for (const [key, value] of Object.entries(obj)) {
        // Skip dangerous keys
        if (this.DANGEROUS_KEYS.includes(key.toLowerCase())) {
          continue;
        }

        // Recursively sanitize the value
        try {
          sanitizedObj[key] = this.sanitizeObject(value, depth + 1);
        } catch (error) {
          console.warn(`Skipping property '${key}' due to sanitization error:`, error);
        }
      }

      return sanitizedObj;
    }

    // For primitive types (number, boolean), return as-is
    return obj;
  }

  /**
   * Validates file upload security
   */
  validateFile(file: File): ValidationResult {
    const errors: string[] = [];

    if (!file || !(file instanceof File)) {
      return { isValid: false, errors: ['Invalid file object'] };
    }

    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      errors.push(`File size (${file.size} bytes) exceeds maximum allowed size (${this.MAX_FILE_SIZE} bytes)`);
    }

    // Check file extension
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!this.ALLOWED_FILE_EXTENSIONS.includes(extension)) {
      errors.push(`File extension '${extension}' is not allowed`);
    }

    // Check for dangerous file names
    if (this.DANGEROUS_KEYS.some(key => file.name.toLowerCase().includes(key))) {
      errors.push('File name contains dangerous keywords');
    }

    // Check MIME type matches extension
    const mimeTypeValid = this.validateMimeType(file.type, extension);
    if (!mimeTypeValid) {
      errors.push('File MIME type does not match extension');
    }

    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    return { isValid: true, errors: [] };
  }

  /**
   * Validates MIME type against file extension
   */
  private validateMimeType(mimeType: string, extension: string): boolean {
    const mimeExtensionMap: { [key: string]: string[] } = {
      '.json': ['application/json', 'text/json'],
      '.png': ['image/png'],
      '.jpg': ['image/jpeg'],
      '.jpeg': ['image/jpeg'],
      '.gif': ['image/gif'],
      '.webp': ['image/webp'],
      '.svg': ['image/svg+xml'],
      '.mp3': ['audio/mpeg'],
      '.wav': ['audio/wav'],
      '.ogg': ['audio/ogg'],
      '.txt': ['text/plain'],
      '.md': ['text/markdown', 'text/plain']
    };

    const allowedMimeTypes = mimeExtensionMap[extension];
    if (!allowedMimeTypes) {
      return false;
    }

    return allowedMimeTypes.includes(mimeType);
  }

  /**
   * Validates URL to prevent dangerous schemes
   */
  validateUrl(url: string): ValidationResult {
    const errors: string[] = [];

    if (!url || typeof url !== 'string') {
      return { isValid: false, errors: ['URL must be a non-empty string'] };
    }

    try {
      const urlObj = new URL(url);
      
      // Only allow safe protocols
      const allowedProtocols = ['http:', 'https:'];
      if (!allowedProtocols.includes(urlObj.protocol)) {
        errors.push(`Protocol '${urlObj.protocol}' is not allowed`);
      }

      // Block dangerous patterns in URL
      const dangerousPatterns = [
        /javascript:/i,
        /data:/i,
        /vbscript:/i,
        /file:/i,
        /ftp:/i
      ];

      if (dangerousPatterns.some(pattern => pattern.test(url))) {
        errors.push('URL contains dangerous patterns');
      }

      // Check for potential SSRF attempts
      if (urlObj.hostname === 'localhost' || 
          urlObj.hostname === '127.0.0.1' || 
          urlObj.hostname.startsWith('192.168.') ||
          urlObj.hostname.startsWith('10.') ||
          urlObj.hostname.startsWith('172.')) {
        errors.push('Local/private IP addresses are not allowed');
      }

    } catch (error) {
      errors.push('Invalid URL format');
    }

    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    return { isValid: true, errors: [] };
  }

  /**
   * Rate limiting helper (basic implementation)
   */
  private rateLimitMap = new Map<string, { count: number; resetTime: number }>();

  checkRateLimit(key: string, maxRequests: number = 100, windowMs: number = 60000): boolean {
    const now = Date.now();
    const entry = this.rateLimitMap.get(key);

    if (!entry || now > entry.resetTime) {
      this.rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (entry.count >= maxRequests) {
      return false;
    }

    entry.count++;
    return true;
  }

  /**
   * Generates a content security nonce
   */
  generateNonce(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Validates Avatar Manifest structure for security
   */
  validateAvatarManifest(manifest: any): ValidationResult {
    const errors: string[] = [];

    if (!manifest || typeof manifest !== 'object') {
      return { isValid: false, errors: ['Manifest must be a valid object'] };
    }

    // Required fields
    const requiredFields = ['key', 'description'];
    for (const field of requiredFields) {
      if (!manifest[field] || typeof manifest[field] !== 'string') {
        errors.push(`Required field '${field}' is missing or invalid`);
      }
    }

    // Validate key
    if (manifest.key) {
      const keyValidation = this.validateString(manifest.key, 64);
      if (!keyValidation.isValid) {
        errors.push(`Manifest key validation failed: ${keyValidation.errors.join(', ')}`);
      }
    }

    // Validate description
    if (manifest.description) {
      const descValidation = this.validateString(manifest.description, 500);
      if (!descValidation.isValid) {
        errors.push(`Manifest description validation failed: ${descValidation.errors.join(', ')}`);
      }
    }

    // Validate images array
    if (manifest.images) {
      if (!Array.isArray(manifest.images)) {
        errors.push('Images must be an array');
      } else if (manifest.images.length > 50) {
        errors.push('Too many images in manifest (maximum 50 allowed)');
      } else {
        manifest.images.forEach((image: any, index: number) => {
          if (!image || typeof image !== 'object') {
            errors.push(`Image at index ${index} must be an object`);
            return;
          }

          if (!image.key || typeof image.key !== 'string') {
            errors.push(`Image at index ${index} missing valid key`);
          }

          if (!image.type || !['url', 'local'].includes(image.type)) {
            errors.push(`Image at index ${index} must have type 'url' or 'local'`);
          }

          if (image.type === 'url' && image.source) {
            const urlValidation = this.validateUrl(image.source);
            if (!urlValidation.isValid) {
              errors.push(`Image at index ${index} has invalid URL: ${urlValidation.errors.join(', ')}`);
            }
          }

          if (image.type === 'local' && (!image.name || typeof image.name !== 'string')) {
            errors.push(`Local image at index ${index} must have a valid name`);
          }
        });
      }
    }

    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    // Return sanitized manifest
    try {
      const sanitizedManifest = this.sanitizeObject(manifest);
      return { isValid: true, errors: [], sanitizedValue: sanitizedManifest };
    } catch (error) {
      return { isValid: false, errors: [`Manifest sanitization failed: ${error.message}`] };
    }
  }
}