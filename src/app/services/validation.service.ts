import { Injectable } from '@angular/core';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface CharacterValidationData {
  givenName?: string;
  surname?: string;
  preferredName?: string;
  gender?: string;
  pronouns?: string;
}

@Injectable({ providedIn: 'root' })
export class ValidationService {

  constructor() { }

  /**
   * Validates character creation data
   */
  validateCharacter(character: CharacterValidationData): ValidationResult {
    const errors: string[] = [];

    if (!character.givenName || !this.isValidName(character.givenName)) {
      errors.push('Given name must be between 1-50 characters and contain only letters, spaces, hyphens, and apostrophes');
    }

    if (!character.surname || !this.isValidName(character.surname)) {
      errors.push('Surname must be between 1-50 characters and contain only letters, spaces, hyphens, and apostrophes');
    }

    if (!character.preferredName || !this.isValidName(character.preferredName)) {
      errors.push('Preferred name must be between 1-50 characters and contain only letters, spaces, hyphens, and apostrophes');
    }

    if (!character.gender || !this.isValidGender(character.gender)) {
      errors.push('Gender must be one of: male, female, non-binary');
    }

    if (!character.pronouns || !this.isValidPronouns(character.pronouns)) {
      errors.push('Pronouns must be one of: he/him, she/her, they/them');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validates database keys to prevent injection attacks
   */
  validateDatabaseKey(key: IDBValidKey): IDBValidKey {
    if (key === null || key === undefined) {
      throw new Error('Database key cannot be null or undefined');
    }
    
    if (typeof key === 'string') {
      // Check length limit
      if (key.length > 100) {
        throw new Error('Database key too long - potential DoS attack');
      }
      
      // Check for potentially malicious characters
      if (/[<>\"'&;]/.test(key)) {
        throw new Error('Invalid characters detected in database key');
      }
      
      // Check for script tags or other HTML/JS patterns
      if (/<script|javascript:|data:|vbscript:/i.test(key)) {
        throw new Error('Potentially malicious content detected in database key');
      }
    }
    
    if (typeof key === 'object') {
      const serialized = JSON.stringify(key);
      if (serialized.length > 1000) {
        throw new Error('Database key object too large - potential DoS attack');
      }
      
      // Check for potentially malicious content in object values
      if (/<script|javascript:|data:|vbscript:/i.test(serialized)) {
        throw new Error('Potentially malicious content detected in database key object');
      }
    }
    
    return key;
  }

  /**
   * Validates store names against whitelist
   */
  validateStoreName(storeName: string): string {
    const allowedStores = ['characters', 'saves', 'extensions', 'settings', 'avatars'];
    
    if (!storeName || typeof storeName !== 'string') {
      throw new Error('Store name must be a non-empty string');
    }
    
    if (!allowedStores.includes(storeName)) {
      throw new Error(`Invalid store name: ${storeName}. Allowed stores: ${allowedStores.join(', ')}`);
    }
    
    return storeName;
  }

  /**
   * Validates user input to prevent XSS attacks
   */
  validateUserInput(input: string, maxLength = 1000): string {
    if (!input || typeof input !== 'string') {
      return '';
    }
    
    // Trim whitespace
    input = input.trim();
    
    // Check length
    if (input.length > maxLength) {
      throw new Error(`Input too long. Maximum allowed: ${maxLength} characters`);
    }
    
    // Check for potentially malicious patterns
    if (/<script|javascript:|data:|vbscript:|on\w+\s*=|<iframe|<object|<embed/i.test(input)) {
      throw new Error('Potentially malicious content detected in user input');
    }
    
    return input;
  }

  /**
   * Sanitizes HTML content by removing dangerous elements and attributes
   */
  sanitizeHtml(html: string): string {
    if (!html || typeof html !== 'string') {
      return '';
    }
    
    // Remove script tags and their content
    html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    // Remove potentially dangerous event handlers
    html = html.replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '');
    html = html.replace(/\son\w+\s*=\s*[^"'\s>]+/gi, '');
    
    // Remove javascript: and data: URLs
    html = html.replace(/javascript:[^"']*/gi, '');
    html = html.replace(/data:[^"']*/gi, '');
    
    // Remove dangerous tags
    const dangerousTags = ['iframe', 'object', 'embed', 'link', 'meta', 'style'];
    dangerousTags.forEach(tag => {
      const regex = new RegExp(`<${tag}\\b[^>]*>.*?<\\/${tag}>`, 'gi');
      html = html.replace(regex, '');
      const selfClosingRegex = new RegExp(`<${tag}\\b[^>]*/>`, 'gi');
      html = html.replace(selfClosingRegex, '');
    });
    
    return html;
  }

  private isValidName(name: string): boolean {
    if (!name || typeof name !== 'string') {
      return false;
    }
    
    // Check length (1-50 characters)
    if (name.length < 1 || name.length > 50) {
      return false;
    }
    
    // Check for valid characters (letters, spaces, hyphens, apostrophes)
    return /^[a-zA-Z\s\-']+$/.test(name);
  }

  private isValidGender(gender: string): boolean {
    const validGenders = ['male', 'female', 'non-binary'];
    return validGenders.includes(gender?.toLowerCase());
  }

  private isValidPronouns(pronouns: string): boolean {
    const validPronouns = ['he/him', 'she/her', 'they/them'];
    return validPronouns.includes(pronouns?.toLowerCase());
  }
}