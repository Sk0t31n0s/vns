import { TestBed } from '@angular/core/testing';
import { SecurityService, ValidationResult } from './security.service';

describe('SecurityService', () => {
  let service: SecurityService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SecurityService]
    });
    service = TestBed.inject(SecurityService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('sanitizeHtml', () => {
    it('should remove script tags', () => {
      const maliciousHtml = '<script>alert("xss")</script>Hello';
      const result = service.sanitizeHtml(maliciousHtml);
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
      expect(result).toContain('Hello');
    });

    it('should remove event handlers', () => {
      const maliciousHtml = '<div onclick="alert(\'xss\')">Click me</div>';
      const result = service.sanitizeHtml(maliciousHtml);
      expect(result).not.toContain('onclick');
      expect(result).not.toContain('alert');
    });

    it('should encode HTML entities', () => {
      const html = '<p>Test & "quotes" \'single\'</p>';
      const result = service.sanitizeHtml(html);
      expect(result).toContain('&lt;p&gt;');
      expect(result).toContain('&amp;');
      expect(result).toContain('&quot;');
      expect(result).toContain('&#x27;');
    });

    it('should handle empty or null input', () => {
      expect(service.sanitizeHtml('')).toBe('');
      expect(service.sanitizeHtml(null as any)).toBe('');
      expect(service.sanitizeHtml(undefined as any)).toBe('');
    });

    it('should remove iframe tags', () => {
      const maliciousHtml = '<iframe src="javascript:alert(\'xss\')"></iframe>';
      const result = service.sanitizeHtml(maliciousHtml);
      expect(result).not.toContain('<iframe>');
      expect(result).not.toContain('javascript:');
    });
  });

  describe('validateString', () => {
    it('should validate normal strings', () => {
      const result = service.validateString('Hello World');
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.sanitizedValue).toBe('Hello World');
    });

    it('should reject null or undefined', () => {
      const nullResult = service.validateString(null);
      expect(nullResult.isValid).toBe(false);
      expect(nullResult.errors).toContain('Value cannot be null or undefined');

      const undefinedResult = service.validateString(undefined);
      expect(undefinedResult.isValid).toBe(false);
      expect(undefinedResult.errors).toContain('Value cannot be null or undefined');
    });

    it('should reject non-string values', () => {
      const result = service.validateString(123);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Value must be a string');
    });

    it('should reject strings that are too long', () => {
      const longString = 'a'.repeat(20000);
      const result = service.validateString(longString);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('exceeds maximum length'))).toBe(true);
    });

    it('should allow custom max length', () => {
      const result = service.validateString('Hello', 3);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('exceeds maximum length of 3'))).toBe(true);
    });

    it('should detect SQL injection patterns', () => {
      const injections = [
        "'; DROP TABLE users; --",
        "1' OR '1'='1",
        "UNION SELECT * FROM passwords",
        "INSERT INTO users VALUES"
      ];

      injections.forEach(injection => {
        const result = service.validateString(injection);
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.includes('malicious content'))).toBe(true);
      });
    });
  });

  describe('validateObjectKeys', () => {
    it('should validate safe object keys', () => {
      const obj = { name: 'John', age: 30, isActive: true };
      const result = service.validateObjectKeys(obj);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should reject dangerous keys', () => {
      const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
      
      dangerousKeys.forEach(key => {
        const obj = { [key]: 'malicious' };
        const result = service.validateObjectKeys(obj);
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.includes(`Dangerous key '${key}'`))).toBe(true);
      });
    });

    it('should reject non-objects', () => {
      const results = [
        service.validateObjectKeys(null),
        service.validateObjectKeys(undefined),
        service.validateObjectKeys('string'),
        service.validateObjectKeys(123)
      ];

      results.forEach(result => {
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Value must be a valid object');
      });
    });
  });

  describe('sanitizeObject', () => {
    it('should sanitize safe objects', () => {
      const obj = { name: 'John', age: 30, active: true };
      const result = service.sanitizeObject(obj);
      expect(result).toEqual(obj);
    });

    it('should remove dangerous keys', () => {
      const obj = { 
        name: 'John', 
        __proto__: 'malicious', 
        constructor: 'bad',
        age: 30 
      };
      const result = service.sanitizeObject(obj);
      expect(result).toEqual({ name: 'John', age: 30 });
      expect(result.__proto__).toBeUndefined();
      expect(result.constructor).toBeUndefined();
    });

    it('should handle nested objects', () => {
      const obj = {
        user: {
          name: 'John',
          __proto__: 'malicious',
          profile: {
            bio: 'Hello World',
            constructor: 'bad'
          }
        }
      };
      const result = service.sanitizeObject(obj);
      expect(result.user.name).toBe('John');
      expect(result.user.__proto__).toBeUndefined();
      expect(result.user.profile.bio).toBe('Hello World');
      expect(result.user.profile.constructor).toBeUndefined();
    });

    it('should handle arrays', () => {
      const obj = ['safe', { __proto__: 'malicious', name: 'John' }, 'also safe'];
      const result = service.sanitizeObject(obj);
      expect(result).toEqual(['safe', { name: 'John' }, 'also safe']);
    });

    it('should reject objects that are too deep', () => {
      let deepObj: any = {};
      let current = deepObj;
      
      // Create object with depth > 10
      for (let i = 0; i < 15; i++) {
        current.nested = {};
        current = current.nested;
      }

      expect(() => service.sanitizeObject(deepObj)).toThrowError('Object depth exceeds maximum');
    });

    it('should reject arrays that are too long', () => {
      const longArray = new Array(2000).fill('item');
      expect(() => service.sanitizeObject(longArray)).toThrowError('Array length exceeds maximum');
    });

    it('should sanitize strings within objects', () => {
      const obj = {
        name: 'John',
        bio: '<script>alert("xss")</script>Nice person'
      };
      const result = service.sanitizeObject(obj);
      expect(result.name).toBe('John');
      expect(result.bio).not.toContain('<script>');
    });
  });

  describe('validateFile', () => {
    it('should validate safe files', () => {
      const file = new File(['content'], 'test.json', { type: 'application/json' });
      const result = service.validateFile(file);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should reject invalid file objects', () => {
      const results = [
        service.validateFile(null as any),
        service.validateFile(undefined as any),
        service.validateFile('not a file' as any)
      ];

      results.forEach(result => {
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Invalid file object');
      });
    });

    it('should reject files that are too large', () => {
      const largeContent = new Array(11 * 1024 * 1024).fill('a').join(''); // 11MB
      const file = new File([largeContent], 'large.txt', { type: 'text/plain' });
      const result = service.validateFile(file);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('exceeds maximum allowed size'))).toBe(true);
    });

    it('should reject files with dangerous extensions', () => {
      const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.vbs'];
      
      dangerousExtensions.forEach(ext => {
        const file = new File(['content'], `test${ext}`, { type: 'application/octet-stream' });
        const result = service.validateFile(file);
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.includes('is not allowed'))).toBe(true);
      });
    });

    it('should reject files with dangerous names', () => {
      const dangerousNames = ['__proto__.json', 'constructor.txt', 'prototype.png'];
      
      dangerousNames.forEach(name => {
        const file = new File(['content'], name, { type: 'application/json' });
        const result = service.validateFile(file);
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.includes('dangerous keywords'))).toBe(true);
      });
    });

    it('should validate MIME type matches extension', () => {
      // Correct MIME type
      const validFile = new File(['{}'], 'test.json', { type: 'application/json' });
      const validResult = service.validateFile(validFile);
      expect(validResult.isValid).toBe(true);

      // Incorrect MIME type
      const invalidFile = new File(['{}'], 'test.json', { type: 'image/png' });
      const invalidResult = service.validateFile(invalidFile);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors.some(e => e.includes('MIME type does not match'))).toBe(true);
    });
  });

  describe('validateUrl', () => {
    it('should validate safe URLs', () => {
      const safeUrls = [
        'https://example.com',
        'http://test.example.com/path',
        'https://api.example.com/data.json'
      ];

      safeUrls.forEach(url => {
        const result = service.validateUrl(url);
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
      });
    });

    it('should reject dangerous protocols', () => {
      const dangerousUrls = [
        'javascript:alert("xss")',
        'data:text/html,<script>alert("xss")</script>',
        'vbscript:msgbox("xss")',
        'file:///etc/passwd',
        'ftp://example.com/file.txt'
      ];

      dangerousUrls.forEach(url => {
        const result = service.validateUrl(url);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    it('should reject local/private IPs', () => {
      const localUrls = [
        'http://localhost:8080',
        'http://127.0.0.1:3000',
        'http://192.168.1.1',
        'http://10.0.0.1',
        'http://172.16.0.1'
      ];

      localUrls.forEach(url => {
        const result = service.validateUrl(url);
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.includes('Local/private IP'))).toBe(true);
      });
    });

    it('should reject malformed URLs', () => {
      const malformedUrls = [
        'not-a-url',
        'http://',
        'https:///no-domain',
        ''
      ];

      malformedUrls.forEach(url => {
        const result = service.validateUrl(url);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });
  });

  describe('checkRateLimit', () => {
    beforeEach(() => {
      // Clear rate limit map before each test
      (service as any).rateLimitMap.clear();
    });

    it('should allow requests within limit', () => {
      for (let i = 0; i < 5; i++) {
        expect(service.checkRateLimit('test-key', 10)).toBe(true);
      }
    });

    it('should block requests exceeding limit', () => {
      // Fill up the limit
      for (let i = 0; i < 10; i++) {
        expect(service.checkRateLimit('test-key', 10)).toBe(true);
      }
      
      // Next request should be blocked
      expect(service.checkRateLimit('test-key', 10)).toBe(false);
    });

    it('should reset after time window', (done) => {
      // Fill up the limit
      for (let i = 0; i < 10; i++) {
        service.checkRateLimit('test-key', 10, 100); // 100ms window
      }
      
      expect(service.checkRateLimit('test-key', 10, 100)).toBe(false);
      
      // Wait for window to reset
      setTimeout(() => {
        expect(service.checkRateLimit('test-key', 10, 100)).toBe(true);
        done();
      }, 150);
    });

    it('should handle different keys separately', () => {
      for (let i = 0; i < 10; i++) {
        expect(service.checkRateLimit('key1', 10)).toBe(true);
        expect(service.checkRateLimit('key2', 10)).toBe(true);
      }
      
      expect(service.checkRateLimit('key1', 10)).toBe(false);
      expect(service.checkRateLimit('key2', 10)).toBe(false);
      expect(service.checkRateLimit('key3', 10)).toBe(true); // New key should work
    });
  });

  describe('generateNonce', () => {
    it('should generate unique nonces', () => {
      const nonces = new Set();
      for (let i = 0; i < 100; i++) {
        const nonce = service.generateNonce();
        expect(nonce).toMatch(/^[0-9a-f]{32}$/); // 16 bytes = 32 hex chars
        expect(nonces.has(nonce)).toBe(false);
        nonces.add(nonce);
      }
    });
  });

  describe('validateAvatarManifest', () => {
    it('should validate correct manifest', () => {
      const manifest = {
        key: 'test-avatar',
        description: 'A test avatar',
        images: [
          {
            key: 'standard',
            type: 'url',
            source: 'https://example.com/image.png'
          }
        ]
      };

      const result = service.validateAvatarManifest(manifest);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.sanitizedValue).toBeDefined();
    });

    it('should reject manifest with missing required fields', () => {
      const manifest = { description: 'Missing key' };
      const result = service.validateAvatarManifest(manifest);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Required field \'key\''))).toBe(true);
    });

    it('should validate image URLs', () => {
      const manifest = {
        key: 'test-avatar',
        description: 'Test',
        images: [
          {
            key: 'standard',
            type: 'url',
            source: 'javascript:alert("xss")'
          }
        ]
      };

      const result = service.validateAvatarManifest(manifest);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('invalid URL'))).toBe(true);
    });

    it('should reject manifests with too many images', () => {
      const images = [];
      for (let i = 0; i < 60; i++) {
        images.push({
          key: `image${i}`,
          type: 'url',
          source: 'https://example.com/image.png'
        });
      }

      const manifest = {
        key: 'test-avatar',
        description: 'Test',
        images
      };

      const result = service.validateAvatarManifest(manifest);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Too many images'))).toBe(true);
    });

    it('should validate local image manifests', () => {
      const manifest = {
        key: 'test-avatar',
        description: 'Test',
        images: [
          {
            key: 'standard',
            type: 'local',
            name: 'avatar.png'
          },
          {
            key: 'invalid',
            type: 'local'
            // Missing name
          }
        ]
      };

      const result = service.validateAvatarManifest(manifest);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('must have a valid name'))).toBe(true);
    });

    it('should sanitize manifest content', () => {
      const manifest = {
        key: 'test-avatar',
        description: '<script>alert("xss")</script>A test avatar',
        __proto__: 'malicious',
        images: []
      };

      const result = service.validateAvatarManifest(manifest);
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue.__proto__).toBeUndefined();
      expect(result.sanitizedValue.description).not.toContain('<script>');
    });
  });

  describe('Edge Cases and Performance', () => {
    it('should handle extremely large inputs gracefully', () => {
      const largeString = 'a'.repeat(50000);
      const result = service.validateString(largeString);
      expect(result.isValid).toBe(false);
    });

    it('should handle circular references in objects', () => {
      const obj: any = { name: 'test' };
      obj.self = obj; // Circular reference

      // Should not crash due to JSON.parse(JSON.stringify()) in sanitizeObject
      expect(() => service.sanitizeObject(obj)).toThrowError();
    });

    it('should handle unicode and special characters safely', () => {
      const unicodeString = '🚀 Unicode test 中文 العربية';
      const result = service.validateString(unicodeString);
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toContain('🚀');
    });
  });
});