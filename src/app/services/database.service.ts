import { Injectable, Inject } from "@angular/core";
import { INDEXED_DATABASE_FACTORY_TOKEN } from "app/app.config";

// Security interfaces for validation
interface ValidatedStoreDefinition {
  name: string;
  options?: IDBObjectStoreParameters;
  indexes?: ValidatedIndexDefinition[];
}

interface ValidatedIndexDefinition {
  name: string;
  keyPath: string | string[];
  options?: IDBIndexParameters;
}

// Security constants
const MAX_DB_NAME_LENGTH = 64;
const MAX_STORE_NAME_LENGTH = 64;
const MAX_INDEX_NAME_LENGTH = 64;
const ALLOWED_DB_NAME_PATTERN = /^[a-zA-Z0-9_-]+$/;
const ALLOWED_STORE_NAME_PATTERN = /^[a-zA-Z0-9_-]+$/;
const RESERVED_NAMES = ['__proto__', 'constructor', 'prototype', 'toString', 'valueOf'];

@Injectable({
  providedIn: "root"
})
export class DatabaseService {
  constructor(@Inject(INDEXED_DATABASE_FACTORY_TOKEN) private indexedDb: IDBFactory) { }

  /**
   * Validates database name to prevent injection attacks
   */
  private validateDatabaseName(name: string): void {
    if (!name || typeof name !== 'string') {
      throw new Error('Database name must be a non-empty string');
    }
    
    if (name.length > MAX_DB_NAME_LENGTH) {
      throw new Error(`Database name exceeds maximum length of ${MAX_DB_NAME_LENGTH} characters`);
    }
    
    if (!ALLOWED_DB_NAME_PATTERN.test(name)) {
      throw new Error('Database name contains invalid characters. Only alphanumeric, underscore, and hyphen are allowed');
    }
    
    if (RESERVED_NAMES.includes(name.toLowerCase())) {
      throw new Error('Database name is reserved and cannot be used');
    }
  }

  /**
   * Validates store name to prevent injection attacks
   */
  private validateStoreName(name: string): void {
    if (!name || typeof name !== 'string') {
      throw new Error('Store name must be a non-empty string');
    }
    
    if (name.length > MAX_STORE_NAME_LENGTH) {
      throw new Error(`Store name exceeds maximum length of ${MAX_STORE_NAME_LENGTH} characters`);
    }
    
    if (!ALLOWED_STORE_NAME_PATTERN.test(name)) {
      throw new Error('Store name contains invalid characters. Only alphanumeric, underscore, and hyphen are allowed');
    }
    
    if (RESERVED_NAMES.includes(name.toLowerCase())) {
      throw new Error('Store name is reserved and cannot be used');
    }
  }

  /**
   * Validates store definitions to prevent injection attacks
   */
  private validateStoreDefinitions(stores: any[]): ValidatedStoreDefinition[] {
    if (!Array.isArray(stores) || stores.length === 0) {
      throw new Error('Store definitions must be a non-empty array');
    }

    return stores.map((storeDef, index) => {
      if (!storeDef || typeof storeDef !== 'object') {
        throw new Error(`Store definition at index ${index} must be an object`);
      }

      this.validateStoreName(storeDef.name);

      const validatedStore: ValidatedStoreDefinition = {
        name: storeDef.name,
        options: storeDef.options
      };

      if (storeDef.indexes) {
        if (!Array.isArray(storeDef.indexes)) {
          throw new Error(`Indexes for store '${storeDef.name}' must be an array`);
        }

        validatedStore.indexes = storeDef.indexes.map((indexDef: any, indexIndex: number) => {
          if (!indexDef || typeof indexDef !== 'object') {
            throw new Error(`Index definition at index ${indexIndex} for store '${storeDef.name}' must be an object`);
          }

          if (!indexDef.name || typeof indexDef.name !== 'string') {
            throw new Error(`Index name at index ${indexIndex} for store '${storeDef.name}' must be a non-empty string`);
          }

          if (indexDef.name.length > MAX_INDEX_NAME_LENGTH) {
            throw new Error(`Index name '${indexDef.name}' exceeds maximum length of ${MAX_INDEX_NAME_LENGTH} characters`);
          }

          if (RESERVED_NAMES.includes(indexDef.name.toLowerCase())) {
            throw new Error(`Index name '${indexDef.name}' is reserved and cannot be used`);
          }

          return {
            name: indexDef.name,
            keyPath: indexDef.keyPath,
            options: indexDef.options
          };
        });
      }

      return validatedStore;
    });
  }

  /**
   * Validates IDBValidKey to prevent injection
   */
  private validateKey(key: IDBValidKey): void {
    if (key === null || key === undefined) {
      throw new Error('Key cannot be null or undefined');
    }

    // Check for prototype pollution attempts
    if (typeof key === 'string' && RESERVED_NAMES.includes(key.toLowerCase())) {
      throw new Error('Key name is reserved and cannot be used');
    }

    // Additional validation for array keys
    if (Array.isArray(key)) {
      key.forEach((subKey, index) => {
        if (typeof subKey === 'string' && RESERVED_NAMES.includes(subKey.toLowerCase())) {
          throw new Error(`Array key at index ${index} is reserved and cannot be used`);
        }
      });
    }
  }

  /**
   * Sanitizes data before storage to prevent injection
   */
  private sanitizeData<T>(data: T): T {
    if (data === null || data === undefined) {
      return data;
    }

    // Deep clone to prevent reference modification
    const clonedData = JSON.parse(JSON.stringify(data));
    
    // Remove potentially dangerous properties
    if (typeof clonedData === 'object' && clonedData !== null) {
      RESERVED_NAMES.forEach(reservedName => {
        if (reservedName in clonedData) {
          delete clonedData[reservedName];
        }
      });
    }

    return clonedData;
  }

  getDatabase(
    name: string,
    stores: {
      name: string,
      options?: IDBObjectStoreParameters,
      indexes?: { name: string, keyPath: string | string[], options?: IDBIndexParameters }[],
    }[],
    version?: number): Promise<IDBDatabase> {
    
    // Validate inputs
    this.validateDatabaseName(name);
    const validatedStores = this.validateStoreDefinitions(stores);
    
    if (version !== undefined && (!Number.isInteger(version) || version < 1)) {
      throw new Error('Database version must be a positive integer');
    }

    const request = this.indexedDb.open(name, version);
    
    request.onupgradeneeded = (event: any) => {
      try {
        const db: IDBDatabase = event.target.result;
        for (const storeDef of validatedStores) {
          const store = db.createObjectStore(storeDef.name, storeDef.options);
          if (storeDef.indexes) {
            for (const index of storeDef.indexes) {
              store.createIndex(index.name, index.keyPath, index.options);
            }
          }
        }
      } catch (error) {
        console.error('Database upgrade failed:', error);
        throw error;
      }
    };
    
    return this.toResult<IDBDatabase>(request);
  }

  get<T>(database: Promise<IDBDatabase>, storeName: string, key: IDBValidKey): Promise<T> {
    this.validateStoreName(storeName);
    this.validateKey(key);
    
    return database
      .then((db) => {
        const transaction = db.transaction(storeName, "readonly");
        const table = transaction.objectStore(storeName);
        return table.get(key);
      })
      .then<T>(this.toResult)
      .catch(error => {
        console.error('Database get operation failed:', { storeName, error: error.message });
        throw new Error('Failed to retrieve data from database');
      });
  }

  getAllKeys(database: Promise<IDBDatabase>, storeName: string): Promise<string[]> {
    this.validateStoreName(storeName);
    
    return database
      .then((db) => {
        const transaction = db.transaction(storeName, "readonly");
        const store = transaction.objectStore(storeName);
        return store.getAllKeys();
      })
      .then<string[]>(this.toResult)
      .catch(error => {
        console.error('Database getAllKeys operation failed:', { storeName, error: error.message });
        throw new Error('Failed to retrieve keys from database');
      });
  }

  getAll<T>(database: Promise<IDBDatabase>, storeName: string): Promise<T[]> {
    this.validateStoreName(storeName);
    
    return database
      .then((db) => {
        const transaction = db.transaction(storeName, "readonly");
        const store = transaction.objectStore(storeName);
        return store.getAll();
      })
      .then<T[]>(this.toResult)
      .catch(error => {
        console.error('Database getAll operation failed:', { storeName, error: error.message });
        throw new Error('Failed to retrieve all data from database');
      });
  }

  put<T>(database: Promise<IDBDatabase>, storeName: string, blob: T, key?: IDBValidKey): Promise<void> {
    this.validateStoreName(storeName);
    if (key !== undefined) {
      this.validateKey(key);
    }
    
    // Sanitize data before storage
    const sanitizedBlob = this.sanitizeData(blob);
    
    return database
      .then((db) => {
        const transaction = db.transaction(storeName, "readwrite");
        const table = transaction.objectStore(storeName);
        return table.put(sanitizedBlob, key);
      })
      .then<void>(this.toResult)
      .catch(error => {
        console.error('Database put operation failed:', { storeName, error: error.message });
        throw new Error('Failed to store data in database');
      });
  }

  delete(database: Promise<IDBDatabase>, storeName: string, key: IDBValidKey): Promise<void> {
    this.validateStoreName(storeName);
    this.validateKey(key);
    
    return database
      .then((db) => {
        const transaction = db.transaction(storeName, "readwrite");
        const table = transaction.objectStore(storeName);
        return table.delete(key);
      })
      .then<void>(this.toResult)
      .catch(error => {
        console.error('Database delete operation failed:', { storeName, error: error.message });
        throw new Error('Failed to delete data from database');
      });
  }

  clear(database: Promise<IDBDatabase>, storeName: string): Promise<void> {
    this.validateStoreName(storeName);
    
    return database
      .then((db) => {
        const transaction = db.transaction(storeName, "readwrite");
        const table = transaction.objectStore(storeName);
        return this.toResult<void>(table.clear());
      })
      .catch(error => {
        console.error('Database clear operation failed:', { storeName, error: error.message });
        throw new Error('Failed to clear data from database');
      });
  }

  clearIndex(database: Promise<IDBDatabase>, storeName: string, indexName: string, indexQuery: string) {
    this.validateStoreName(storeName);
    
    if (!indexName || typeof indexName !== 'string') {
      throw new Error('Index name must be a non-empty string');
    }
    
    if (RESERVED_NAMES.includes(indexName.toLowerCase())) {
      throw new Error('Index name is reserved and cannot be used');
    }
    
    if (!indexQuery || typeof indexQuery !== 'string') {
      throw new Error('Index query must be a non-empty string');
    }
    
    return database
      .then((db) => {
        const transaction = db.transaction(storeName, "readwrite");
        const store = transaction.objectStore(storeName);
        const index = store.index(indexName);
        return this.toResult<string[]>(index.getAllKeys(indexQuery))
          .then((keys) => {
            // Validate each key before deletion
            const validKeys = keys.filter(key => {
              try {
                this.validateKey(key);
                return true;
              } catch (error) {
                console.warn('Skipping invalid key during clearIndex:', key, error.message);
                return false;
              }
            });
            return Promise.all(validKeys.map((key) => this.toResult<void>(store.delete(key))));
          });
      })
      .catch(error => {
        console.error('Database clearIndex operation failed:', { storeName, indexName, error: error.message });
        throw new Error('Failed to clear index from database');
      });
  }

  private toResult = <T>(request: IDBRequest): Promise<T> =>
    new Promise((resolve, reject) => {
      request.onsuccess = (event: any) => {
        resolve(event.target.result);
      };
      request.onerror = (event) => {
        reject(event);
      };
    })
}
