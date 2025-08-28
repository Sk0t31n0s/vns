import { Injectable } from "@angular/core";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Observable, from, merge, throwError, EMPTY } from "rxjs";
import { map, mergeMap, reduce, switchMap, catchError, tap } from "rxjs/operators";
import { DatabaseService } from "./database.service";
import { SecurityService } from "./security.service";
import { AvatarImage } from "models/avatar-image";
import { AvatarAbstract } from "models/avatar-abstract";
import { AvatarManifest } from "models/avatar-manifest";
import { AvatarImageKey } from "models/avatar-image-key";
import { UrlImageManifest, LocalImageManifest } from "models/image-manifest";

@Injectable({
  providedIn: "root"
})
export class AvatarsService {
  private readonly DATABASE_NAME = "avatars";
  private readonly ABSTRACTS_STORE = "abstracts";
  private readonly IMAGES_STORE = "images";
  private readonly database = this.databaseService.getDatabase(this.DATABASE_NAME, [{
    name: this.ABSTRACTS_STORE,
    options: { keyPath: "key" }
  }, {
    name: this.IMAGES_STORE,
    options: { keyPath: ["key", "avatarKey"] },
    indexes: [{
      name: "avatarKey",
      keyPath: "avatarKey"
    }, {
      name: "type",
      keyPath: ["avatarKey", "type"]
    }]
  }]);

  constructor(
    private http: HttpClient,
    private databaseService: DatabaseService,
    private securityService: SecurityService
  ) { }

  download(url: string): Observable<void> {
    // Validate URL for security
    const urlValidation = this.securityService.validateUrl(url);
    if (!urlValidation.isValid) {
      return throwError(new Error(`Invalid URL: ${urlValidation.errors.join(', ')}`));
    }

    // Check rate limiting
    if (!this.securityService.checkRateLimit(`download:${url}`, 10)) {
      return throwError(new Error('Rate limit exceeded for download requests'));
    }

    return this.http.get<AvatarManifest>(url)
      .pipe(
        tap((def) => console.log('Downloaded manifest:', { key: def?.key, imageCount: def?.images?.length })),
        mergeMap((def) => {
          // Validate manifest structure
          const manifestValidation = this.securityService.validateAvatarManifest(def);
          if (!manifestValidation.isValid) {
            throw new Error(`Invalid manifest: ${manifestValidation.errors.join(', ')}`);
          }
          return this.loadExtension(manifestValidation.sanitizedValue, { source: url });
        }),
        catchError(this.handleError('download'))
      );
  }

  import(files: FileList, imageFiles: FileList): Observable<void> {
    if (!files || files.length === 0) {
      return throwError(new Error('No files provided for import'));
    }

    return from(files)
      .pipe(
        mergeMap((file) => {
          // Validate file security
          const fileValidation = this.securityService.validateFile(file);
          if (!fileValidation.isValid) {
            throw new Error(`Invalid file '${file.name}': ${fileValidation.errors.join(', ')}`);
          }

          return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (ev) => {
              const result = (ev.target as FileReader).result as string;
              if (!result || result.trim().length === 0) {
                reject(new Error('File is empty or contains no readable content'));
                return;
              }
              resolve(result);
            };
            reader.onerror = (ev) => {
              reject(new Error(`Failed to read file '${file.name}': ${ev}`));
            };
            reader.readAsText(file);
          });
        }),
        map((json) => {
          try {
            const parsed = JSON.parse(json);
            // Additional validation for parsed JSON
            if (!parsed || typeof parsed !== 'object') {
              throw new Error('Invalid JSON structure');
            }
            return parsed;
          } catch (error) {
            throw new Error(`Invalid JSON format: ${error.message}`);
          }
        }),
        mergeMap((def) => {
          // Validate manifest structure
          const manifestValidation = this.securityService.validateAvatarManifest(def);
          if (!manifestValidation.isValid) {
            throw new Error(`Invalid manifest: ${manifestValidation.errors.join(', ')}`);
          }

          // Validate image files if provided
          const validatedImageFiles: File[] = [];
          if (imageFiles) {
            for (let i = 0; i < imageFiles.length; i++) {
              const imageFile = imageFiles[i];
              const imageValidation = this.securityService.validateFile(imageFile);
              if (imageValidation.isValid) {
                validatedImageFiles.push(imageFile);
              } else {
                console.warn(`Skipping invalid image file '${imageFile.name}':`, imageValidation.errors);
              }
            }
          }

          return this.loadExtension(manifestValidation.sanitizedValue, { imageFiles: validatedImageFiles });
        }),
        catchError(this.handleError('import'))
      );
  }

  private loadExtension(def: AvatarManifest, parameters: { source?: string, imageFiles?: File[] }): Observable<void> {
    const source = parameters.source;
    const imageFiles = parameters.imageFiles || [];
    
    try {
      const clearImages$ = from(this.databaseService.clearIndex(this.database, this.IMAGES_STORE, "avatarKey", def.key));

      // Sanitize abstract data before storage
      const sanitizedAbstract = this.securityService.sanitizeObject({
        key: def.key,
        description: def.description,
        source
      });

      const abstractPut$ = from(this.databaseService.put<AvatarAbstract>(this.database, this.ABSTRACTS_STORE, sanitizedAbstract));

      const urlImageSources = def.images
        .filter((image) => image.type === "url") as UrlImageManifest<AvatarImageKey>[];
      
      const urlImagePuts$ = from(urlImageSources)
        .pipe(
          mergeMap(({ key: imageKey, source: imageSource }) => {
            // Validate image URL
            const urlValidation = this.securityService.validateUrl(imageSource);
            if (!urlValidation.isValid) {
              console.warn(`Skipping invalid image URL '${imageSource}':`, urlValidation.errors);
              return EMPTY;
            }

            // Check rate limiting for image downloads
            if (!this.securityService.checkRateLimit(`image:${imageSource}`, 50)) {
              console.warn(`Rate limit exceeded for image: ${imageSource}`);
              return EMPTY;
            }

            return this.http.get(imageSource, { responseType: "blob" })
              .pipe(
                tap((blob) => {
                  // Validate blob size
                  if (blob.size > 10 * 1024 * 1024) { // 10MB limit
                    throw new Error(`Image '${imageSource}' is too large (${blob.size} bytes)`);
                  }
                }),
                switchMap((blob) => {
                  const sanitizedImageData = this.securityService.sanitizeObject({
                    key: imageKey,
                    avatarKey: def.key,
                    source: imageSource,
                    blob
                  });
                  return this.databaseService.put<AvatarImage>(this.database, this.IMAGES_STORE, sanitizedImageData);
                }),
                catchError((error) => {
                  console.error(`Failed to download image '${imageSource}':`, error.message);
                  return EMPTY; // Continue with other images
                })
              );
          })
        );

      const localImageSources = def.images
        .filter((imageSource) => imageSource.type === "local") as LocalImageManifest<AvatarImageKey>[];
      
      const localImagePuts$ = from(localImageSources)
        .pipe(
          mergeMap(({ key: imageKey, name }) => {
            const imageFile = imageFiles.find((file) => file.name === name);
            if (!imageFile) {
              console.warn(`Could not find image ${name}`);
              return EMPTY;
            }

            // Re-validate the file (in case it wasn't validated earlier)
            const fileValidation = this.securityService.validateFile(imageFile);
            if (!fileValidation.isValid) {
              console.warn(`Invalid local image file '${name}':`, fileValidation.errors);
              return EMPTY;
            }

            const sanitizedImageData = this.securityService.sanitizeObject({
              key: imageKey,
              avatarKey: def.key,
              source: null,
              blob: imageFile
            });

            return this.databaseService.put<AvatarImage>(this.database, this.IMAGES_STORE, sanitizedImageData)
              .catch((error) => {
                console.error(`Failed to store local image '${name}':`, error.message);
                return Promise.resolve(); // Continue with other images
              });
          })
        );

      return clearImages$
        .pipe(
          mergeMap(() => merge(abstractPut$, urlImagePuts$, localImagePuts$)),
          reduce(((acc, val) => acc)),
          catchError(this.handleError('loadExtension'))
        );
        
    } catch (error) {
      return throwError(new Error(`Extension loading failed: ${error.message}`));
    }
  }

  getAbstracts() {
    return this.databaseService.getAll<AvatarAbstract>(this.database, this.ABSTRACTS_STORE);
  }

  getImage(avatarKey: string, imageKey: AvatarImageKey): Promise<AvatarImage> {
    // Validate inputs
    const avatarKeyValidation = this.securityService.validateString(avatarKey, 64);
    if (!avatarKeyValidation.isValid) {
      return Promise.reject(new Error(`Invalid avatar key: ${avatarKeyValidation.errors.join(', ')}`));
    }

    const imageKeyValidation = this.securityService.validateString(imageKey, 64);
    if (!imageKeyValidation.isValid) {
      return Promise.reject(new Error(`Invalid image key: ${imageKeyValidation.errors.join(', ')}`));
    }

    return this.databaseService.get<AvatarImage>(this.database, this.IMAGES_STORE, [imageKey, avatarKey])
      .catch(error => {
        console.error('Get image operation failed:', { avatarKey, imageKey, error: error.message });
        throw new Error('Failed to retrieve image');
      });
  }

  delete(key: string): Promise<void> {
    // Validate key for security
    const keyValidation = this.securityService.validateString(key, 64);
    if (!keyValidation.isValid) {
      return Promise.reject(new Error(`Invalid key: ${keyValidation.errors.join(', ')}`));
    }

    return this.databaseService.clearIndex(this.database, this.IMAGES_STORE, "avatarKey", key)
      .then(() => this.databaseService.delete(this.database, this.ABSTRACTS_STORE, key))
      .catch(error => {
        console.error('Avatar deletion failed:', { key, error: error.message });
        throw new Error('Failed to delete avatar');
      });
  }

  /**
   * Centralized error handling for avatar operations
   */
  private handleError(operation: string) {
    return (error: any) => {
      console.error(`Avatar ${operation} operation failed:`, error);
      
      // Don't expose internal error details to prevent information leakage
      let userMessage = `Avatar ${operation} failed. Please try again.`;
      
      if (error instanceof HttpErrorResponse) {
        if (error.status === 404) {
          userMessage = 'Avatar resource not found.';
        } else if (error.status >= 500) {
          userMessage = 'Server error occurred. Please try again later.';
        } else if (error.status === 0) {
          userMessage = 'Network error. Please check your connection.';
        }
      }
      
      return throwError(new Error(userMessage));
    };
  }
}
