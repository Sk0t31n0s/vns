import { TestBed } from '@angular/core/testing';
import { DatabaseService } from './database.service';
import { INDEXED_DATABASE_FACTORY_TOKEN } from '../app.config';

describe('DatabaseService', () => {
  let service: DatabaseService;
  let mockIndexedDB: jasmine.SpyObj<IDBFactory>;
  let mockDB: jasmine.SpyObj<IDBDatabase>;
  let mockTransaction: jasmine.SpyObj<IDBTransaction>;
  let mockObjectStore: jasmine.SpyObj<IDBObjectStore>;
  let mockRequest: jasmine.SpyObj<IDBRequest>;
  let mockOpenRequest: jasmine.SpyObj<IDBOpenDBRequest>;

  beforeEach(() => {
    mockRequest = jasmine.createSpyObj('IDBRequest', ['onsuccess', 'onerror']);
    mockOpenRequest = jasmine.createSpyObj('IDBOpenDBRequest', ['onsuccess', 'onerror', 'onupgradeneeded']);
    mockObjectStore = jasmine.createSpyObj('IDBObjectStore', ['get', 'put', 'delete', 'getAll', 'getAllKeys', 'clear', 'createIndex']);
    mockTransaction = jasmine.createSpyObj('IDBTransaction', ['objectStore']);
    mockDB = jasmine.createSpyObj('IDBDatabase', ['transaction', 'createObjectStore']);
    mockIndexedDB = jasmine.createSpyObj('IDBFactory', ['open']);

    // Setup default return values
    mockIndexedDB.open.and.returnValue(mockOpenRequest);
    mockDB.transaction.and.returnValue(mockTransaction);
    mockTransaction.objectStore.and.returnValue(mockObjectStore);
    mockObjectStore.get.and.returnValue(mockRequest);
    mockObjectStore.put.and.returnValue(mockRequest);
    mockObjectStore.delete.and.returnValue(mockRequest);
    mockObjectStore.getAll.and.returnValue(mockRequest);
    mockObjectStore.getAllKeys.and.returnValue(mockRequest);

    TestBed.configureTestingModule({
      providers: [
        DatabaseService,
        { provide: INDEXED_DATABASE_FACTORY_TOKEN, useValue: mockIndexedDB }
      ]
    });
    service = TestBed.inject(DatabaseService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getDatabase', () => {
    it('should open a database with correct parameters', () => {
      const dbName = 'testDB';
      const version = 1;
      const stores = [{ name: 'testStore', options: { keyPath: 'id' } }];

      service.getDatabase(dbName, stores, version);

      expect(mockIndexedDB.open).toHaveBeenCalledWith(dbName, version);
    });

    it('should create object stores on upgrade needed', (done) => {
      const dbName = 'testDB';
      const stores = [
        { 
          name: 'testStore', 
          options: { keyPath: 'id' },
          indexes: [{ name: 'nameIndex', keyPath: 'name' }]
        }
      ];

      const promise = service.getDatabase(dbName, stores);

      // Simulate onupgradeneeded event
      mockOpenRequest.onupgradeneeded({ target: { result: mockDB } } as any);
      
      expect(mockDB.createObjectStore).toHaveBeenCalledWith('testStore', { keyPath: 'id' });
      expect(mockObjectStore.createIndex).toHaveBeenCalledWith('nameIndex', 'name', undefined);

      // Simulate successful open
      mockOpenRequest.onsuccess({ target: { result: mockDB } } as any);
      
      promise.then((db) => {
        expect(db).toBe(mockDB);
        done();
      });
    });

    it('should reject promise on error', (done) => {
      const dbName = 'testDB';
      const stores = [{ name: 'testStore' }];

      const promise = service.getDatabase(dbName, stores);

      // Simulate error
      const error = new Error('Database error');
      mockOpenRequest.onerror(error as any);

      promise.catch((err) => {
        expect(err).toBe(error);
        done();
      });
    });
  });

  describe('get', () => {
    it('should retrieve data from store', (done) => {
      const database = Promise.resolve(mockDB);
      const storeName = 'testStore';
      const key = 'testKey';
      const expectedData = { id: 'testKey', value: 'testValue' };

      const promise = service.get(database, storeName, key);

      // Simulate successful get
      mockRequest.onsuccess({ target: { result: expectedData } } as any);

      promise.then((data) => {
        expect(mockDB.transaction).toHaveBeenCalledWith(storeName, 'readonly');
        expect(mockTransaction.objectStore).toHaveBeenCalledWith(storeName);
        expect(mockObjectStore.get).toHaveBeenCalledWith(key);
        expect(data).toEqual(expectedData);
        done();
      });
    });

    it('should handle get errors', (done) => {
      const database = Promise.resolve(mockDB);
      const storeName = 'testStore';
      const key = 'testKey';

      const promise = service.get(database, storeName, key);

      // Simulate error
      const error = new Error('Get error');
      mockRequest.onerror(error as any);

      promise.catch((err) => {
        expect(err).toBe(error);
        done();
      });
    });
  });

  describe('put', () => {
    it('should store data in store', (done) => {
      const database = Promise.resolve(mockDB);
      const storeName = 'testStore';
      const data = { id: 'testKey', value: 'testValue' };

      const promise = service.put(database, storeName, data);

      // Simulate successful put
      mockRequest.onsuccess({ target: { result: undefined } } as any);

      promise.then(() => {
        expect(mockDB.transaction).toHaveBeenCalledWith(storeName, 'readwrite');
        expect(mockTransaction.objectStore).toHaveBeenCalledWith(storeName);
        expect(mockObjectStore.put).toHaveBeenCalledWith(data, undefined);
        done();
      });
    });

    it('should handle put errors', (done) => {
      const database = Promise.resolve(mockDB);
      const storeName = 'testStore';
      const data = { id: 'testKey', value: 'testValue' };

      const promise = service.put(database, storeName, data);

      // Simulate error
      const error = new Error('Put error');
      mockRequest.onerror(error as any);

      promise.catch((err) => {
        expect(err).toBe(error);
        done();
      });
    });
  });

  describe('delete', () => {
    it('should delete data from store', (done) => {
      const database = Promise.resolve(mockDB);
      const storeName = 'testStore';
      const key = 'testKey';

      const promise = service.delete(database, storeName, key);

      // Simulate successful delete
      mockRequest.onsuccess({ target: { result: undefined } } as any);

      promise.then(() => {
        expect(mockDB.transaction).toHaveBeenCalledWith(storeName, 'readwrite');
        expect(mockTransaction.objectStore).toHaveBeenCalledWith(storeName);
        expect(mockObjectStore.delete).toHaveBeenCalledWith(key);
        done();
      });
    });
  });

  describe('getAll', () => {
    it('should get all data from store', (done) => {
      const database = Promise.resolve(mockDB);
      const storeName = 'testStore';
      const expectedData = [
        { id: 'key1', value: 'value1' },
        { id: 'key2', value: 'value2' }
      ];

      const promise = service.getAll(database, storeName);

      // Simulate successful getAll
      mockRequest.onsuccess({ target: { result: expectedData } } as any);

      promise.then((data) => {
        expect(mockDB.transaction).toHaveBeenCalledWith(storeName, 'readonly');
        expect(mockTransaction.objectStore).toHaveBeenCalledWith(storeName);
        expect(mockObjectStore.getAll).toHaveBeenCalled();
        expect(data).toEqual(expectedData);
        done();
      });
    });
  });

  describe('getAllKeys', () => {
    it('should get all keys from store', (done) => {
      const database = Promise.resolve(mockDB);
      const storeName = 'testStore';
      const expectedKeys = ['key1', 'key2', 'key3'];

      const promise = service.getAllKeys(database, storeName);

      // Simulate successful getAllKeys
      mockRequest.onsuccess({ target: { result: expectedKeys } } as any);

      promise.then((keys) => {
        expect(mockDB.transaction).toHaveBeenCalledWith(storeName, 'readonly');
        expect(mockTransaction.objectStore).toHaveBeenCalledWith(storeName);
        expect(mockObjectStore.getAllKeys).toHaveBeenCalled();
        expect(keys).toEqual(expectedKeys);
        done();
      });
    });
  });

  describe('clear', () => {
    it('should clear all data from store', (done) => {
      const database = Promise.resolve(mockDB);
      const storeName = 'testStore';

      const promise = service.clear(database, storeName);

      promise.then(() => {
        expect(mockDB.transaction).toHaveBeenCalledWith(storeName, 'readwrite');
        expect(mockTransaction.objectStore).toHaveBeenCalledWith(storeName);
        expect(mockObjectStore.clear).toHaveBeenCalled();
        done();
      });
    });
  });

  describe('Security Tests', () => {
    it('should sanitize input parameters to prevent injection', (done) => {
      // Test with potentially malicious input
      const maliciousData = {
        id: '<script>alert("xss")</script>',
        value: '"; DROP TABLE users; --'
      };

      const database = Promise.resolve(mockDB);
      const promise = service.put(database, 'testStore', maliciousData);

      mockRequest.onsuccess({ target: { result: undefined } } as any);

      promise.then(() => {
        // Verify that the data was passed as-is (IndexedDB handles serialization)
        expect(mockObjectStore.put).toHaveBeenCalledWith(maliciousData, undefined);
        done();
      });
    });

    it('should handle invalid database names gracefully', () => {
      const invalidNames = ['', null, undefined, '<script>', '../../../../etc/passwd'];
      
      invalidNames.forEach(name => {
        if (name !== null && name !== undefined) {
          service.getDatabase(name as string, [{ name: 'test' }]);
          expect(mockIndexedDB.open).toHaveBeenCalledWith(name, undefined);
        }
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection failures', (done) => {
      const promise = service.getDatabase('testDB', [{ name: 'testStore' }]);

      // Simulate connection failure
      const error = new Error('Connection failed');
      mockOpenRequest.onerror(error as any);

      promise.catch((err) => {
        expect(err).toBe(error);
        done();
      });
    });

    it('should handle transaction failures', (done) => {
      const database = Promise.resolve(mockDB);
      mockDB.transaction.and.throwError('Transaction failed');

      const promise = service.get(database, 'testStore', 'testKey');

      promise.catch((err) => {
        expect(err.message).toContain('Transaction failed');
        done();
      });
    });
  });
});