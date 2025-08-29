import { TestBed } from '@angular/core/testing';
import { ValidationService, CharacterValidationData, ValidationResult } from './validation.service';

describe('ValidationService', () => {
  let service: ValidationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ValidationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('validateCharacter', () => {
    it('should validate valid character data', () => {
      const character: CharacterValidationData = {
        givenName: 'Alice',
        surname: 'Johnson',
        preferredName: 'Alice',
        gender: 'female',
        pronouns: 'she/her'
      };

      const result: ValidationResult = service.validateCharacter(character);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should reject character with missing required fields', () => {
      const character: CharacterValidationData = {
        givenName: '',
        surname: 'Johnson',
        preferredName: 'Alice',
        gender: 'female',
        pronouns: 'she/her'
      };

      const result: ValidationResult = service.validateCharacter(character);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(error => error.includes('Given name'))).toBe(true);
    });

    it('should reject character with invalid gender', () => {
      const character: CharacterValidationData = {
        givenName: 'Alice',
        surname: 'Johnson',
        preferredName: 'Alice',
        gender: 'invalid',
        pronouns: 'she/her'
      };

      const result: ValidationResult = service.validateCharacter(character);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Gender'))).toBe(true);
    });

    it('should reject character with invalid pronouns', () => {
      const character: CharacterValidationData = {
        givenName: 'Alice',
        surname: 'Johnson',
        preferredName: 'Alice',
        gender: 'female',
        pronouns: 'invalid'
      };

      const result: ValidationResult = service.validateCharacter(character);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Pronouns'))).toBe(true);
    });

    it('should reject names that are too long', () => {
      const longName = 'a'.repeat(51);
      const character: CharacterValidationData = {
        givenName: longName,
        surname: 'Johnson',
        preferredName: 'Alice',
        gender: 'female',
        pronouns: 'she/her'
      };

      const result: ValidationResult = service.validateCharacter(character);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Given name'))).toBe(true);
    });

    it('should reject names with invalid characters', () => {
      const character: CharacterValidationData = {
        givenName: 'Alice123',
        surname: 'Johnson',
        preferredName: 'Alice',
        gender: 'female',
        pronouns: 'she/her'
      };

      const result: ValidationResult = service.validateCharacter(character);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Given name'))).toBe(true);
    });
  });

  describe('validateDatabaseKey', () => {
    it('should accept valid string keys', () => {
      expect(() => service.validateDatabaseKey('validKey')).not.toThrow();
      expect(() => service.validateDatabaseKey('valid_key')).not.toThrow();
      expect(() => service.validateDatabaseKey('valid-key')).not.toThrow();
    });

    it('should accept valid number keys', () => {
      expect(() => service.validateDatabaseKey(123)).not.toThrow();
      expect(() => service.validateDatabaseKey(0)).not.toThrow();
    });

    it('should reject null or undefined keys', () => {
      expect(() => service.validateDatabaseKey(null)).toThrow();
      expect(() => service.validateDatabaseKey(undefined)).toThrow();
    });

    it('should reject keys that are too long', () => {
      const longKey = 'a'.repeat(101);
      expect(() => service.validateDatabaseKey(longKey)).toThrow();
    });

    it('should reject keys with malicious characters', () => {
      expect(() => service.validateDatabaseKey('<script>')).toThrow();
      expect(() => service.validateDatabaseKey('key"with"quotes')).toThrow();
      expect(() => service.validateDatabaseKey("key'with'apostrophes")).toThrow();
      expect(() => service.validateDatabaseKey('key&with&ampersand')).toThrow();
    });

    it('should reject keys with potential script injection', () => {
      expect(() => service.validateDatabaseKey('javascript:alert(1)')).toThrow();
      expect(() => service.validateDatabaseKey('data:text/html,<script>alert(1)</script>')).toThrow();
      expect(() => service.validateDatabaseKey('vbscript:msgbox(1)')).toThrow();
    });

    it('should reject object keys that are too large', () => {
      const largeObject = { data: 'a'.repeat(1001) };
      expect(() => service.validateDatabaseKey(largeObject)).toThrow();
    });
  });

  describe('validateStoreName', () => {
    it('should accept allowed store names', () => {
      expect(() => service.validateStoreName('characters')).not.toThrow();
      expect(() => service.validateStoreName('saves')).not.toThrow();
      expect(() => service.validateStoreName('extensions')).not.toThrow();
      expect(() => service.validateStoreName('settings')).not.toThrow();
      expect(() => service.validateStoreName('avatars')).not.toThrow();
    });

    it('should reject disallowed store names', () => {
      expect(() => service.validateStoreName('invalidStore')).toThrow();
      expect(() => service.validateStoreName('malicious')).toThrow();
      expect(() => service.validateStoreName('')).toThrow();
    });

    it('should reject non-string store names', () => {
      expect(() => service.validateStoreName(null as any)).toThrow();
      expect(() => service.validateStoreName(undefined as any)).toThrow();
      expect(() => service.validateStoreName(123 as any)).toThrow();
    });
  });

  describe('validateUserInput', () => {
    it('should accept clean user input', () => {
      expect(() => service.validateUserInput('Hello world')).not.toThrow();
      expect(service.validateUserInput('  trimmed  ')).toBe('trimmed');
    });

    it('should reject input that is too long', () => {
      const longInput = 'a'.repeat(1001);
      expect(() => service.validateUserInput(longInput)).toThrow();
    });

    it('should reject potentially malicious input', () => {
      expect(() => service.validateUserInput('<script>alert(1)</script>')).toThrow();
      expect(() => service.validateUserInput('javascript:alert(1)')).toThrow();
      expect(() => service.validateUserInput('<iframe src="evil.com"></iframe>')).toThrow();
      expect(() => service.validateUserInput('<object data="evil.swf"></object>')).toThrow();
      expect(() => service.validateUserInput('onclick="malicious()"')).toThrow();
    });

    it('should return empty string for null or undefined input', () => {
      expect(service.validateUserInput(null as any)).toBe('');
      expect(service.validateUserInput(undefined as any)).toBe('');
      expect(service.validateUserInput('')).toBe('');
    });

    it('should respect custom max length', () => {
      expect(() => service.validateUserInput('hello', 3)).toThrow();
      expect(service.validateUserInput('hi', 3)).toBe('hi');
    });
  });

  describe('sanitizeHtml', () => {
    it('should remove script tags', () => {
      const input = '<div>Safe content</div><script>alert(1)</script>';
      const result = service.sanitizeHtml(input);
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert(1)');
      expect(result).toContain('Safe content');
    });

    it('should remove event handlers', () => {
      const input = '<div onclick="malicious()">Content</div>';
      const result = service.sanitizeHtml(input);
      expect(result).not.toContain('onclick');
      expect(result).not.toContain('malicious()');
      expect(result).toContain('Content');
    });

    it('should remove dangerous URLs', () => {
      const input = '<a href="javascript:alert(1)">Link</a>';
      const result = service.sanitizeHtml(input);
      expect(result).not.toContain('javascript:');
      expect(result).toContain('Link');
    });

    it('should remove dangerous tags', () => {
      const input = '<div>Safe</div><iframe src="evil.com"></iframe><object data="evil.swf"></object>';
      const result = service.sanitizeHtml(input);
      expect(result).not.toContain('<iframe');
      expect(result).not.toContain('<object');
      expect(result).toContain('Safe');
    });

    it('should return empty string for null or undefined input', () => {
      expect(service.sanitizeHtml(null as any)).toBe('');
      expect(service.sanitizeHtml(undefined as any)).toBe('');
      expect(service.sanitizeHtml('')).toBe('');
    });
  });
});