# Visual Novel Studio - Comprehensive Capabilities Analysis

## Table of Contents
1. [Core Application Architecture](#core-application-architecture)
2. [Character Management System](#character-management-system)
3. [State Management (NgRx)](#state-management-ngrx)
4. [Extension System](#extension-system)
5. [Data Persistence & Storage](#data-persistence--storage)
6. [Progressive Web App Features](#progressive-web-app-features)
7. [User Interface & Theming](#user-interface--theming)
8. [Game Logic & Mechanics](#game-logic--mechanics)
9. [Performance & Security](#performance--security)
10. [Development & Build System](#development--build-system)

---

## Core Application Architecture

### Framework & Technology Stack
- **Framework**: Angular 8.2.14 with TypeScript 3.5.3
- **State Management**: NgRx Store 8.6.0 for predictable state management
- **UI Components**: Angular Material 8.2.3 for consistent design
- **Build System**: Angular CLI with Webpack bundling
- **Testing**: Jasmine & Karma for unit testing

### Routing System
**File**: `src/app/route.ts`
```typescript
export type Route = "new-game" | "game" | "extensions" | "save" | "load";
```

The application uses a custom routing system that manages navigation through NgRx store:

**Navigation Management** (`src/app/app.component.ts`):
```typescript
public route$ = this.store.pipe(select(selectRoute));

// Route-based component rendering in template
<sm4-new-game *ngIf="route === 'new-game'"></sm4-new-game>
<sm4-game *ngIf="route === 'game'"></sm4-game>
<sm4-extensions *ngIf="route === 'extensions'"></sm4-extensions>
```

**Capabilities**:
- Centralized route management through NgRx
- Component-based route rendering
- State-driven navigation without Angular Router
- Memory-efficient route switching

---

## Character Management System

### Character Data Model
**File**: `src/app/models/character.ts`
```typescript
export interface Character extends Person {
  title?: string;
  personalityTraits?: string[];
  backstory?: string;
  stats?: { [key: string]: number };
  relationshipLevel?: number;
  storyProgress?: number;
  completedMilestones?: string[];
}
```

### Character Creation Flow
**File**: `src/app/modules/new-game/new-game.component.ts`

**Avatar Selection Process**:
```typescript
openImageSetDialog() {
  const dialogRef = this.dialog.open<AvatarSelectComponent>(AvatarSelectComponent);
  this.imageSetDialogClosed$Subject.next(dialogRef.afterClosed());
}

create(avatar, { imageSet: { abstract } }) {
  this.store.dispatch(newGame({ 
    avatar: { 
      ...avatar, 
      pronouns: this.getPronouns(avatar.gender), 
      key: abstract.key 
    } 
  }));
  this.store.dispatch(setRoute({ route: "game" }));
}
```

**Capabilities**:
- Interactive avatar selection with visual preview
- Gender-based pronoun assignment
- Custom character attribute definition
- Seamless integration with game state

### Character State Management
**File**: `src/app/store/characters/characters.actions.ts`

**Available Actions**:
```typescript
export const addCharacter = createAction("[characters] Add character", props<{ character: any }>());
export const removeCharacter = createAction("[characters] Remove character", props<{ characterKey: string }>());
export const setCurrentCharacter = createAction("[characters] Set Current character", props<{ characterKey: string }>());
export const adjustStat = createAction("[characters] Adjust Stat", props<{ characterKey: string, statKey: string, amount: number }>());
export const improveRelationship = createAction("[characters] Improve Relationship", props<{ characterKey: string, amount: number }>());
export const updateStoryProgress = createAction("[characters] Update Story Progress", props<{ characterKey: string, progress: number }>());
export const completeStoryMilestone = createAction("[characters] Complete Story Milestone", props<{ characterKey: string, milestone: string }>());
```

**Character Reducer Logic** (`src/app/store/characters/characters.reducers.ts`):
```typescript
on(adjustStat, (state, { characterKey, statKey, amount }) => {
  const character = state.characters[characterKey];
  character.stats[statKey] += amount;
  return { ...state, [characterKey]: character };
}),
on(completeStoryMilestone, (state, { characterKey, milestone }) => {
  const character = { ...state.characters[characterKey] };
  character.relationshipLevel = (character.relationshipLevel || 0) + 10; // Milestone bonus
  return { ...state, characters: { ...state.characters, [characterKey]: character } };
})
```

**Capabilities**:
- Multi-character management system
- Dynamic stat modification
- Relationship progression tracking
- Story milestone completion rewards
- Immutable state updates for predictable behavior

---

## State Management (NgRx)

### Store Architecture
**File**: `src/app/store/app-state.ts`
```typescript
export interface AppState {
  route: Route;
  game: GameState;
  characters: CharactersState;
}
```

### Game State Management
**File**: `src/app/store/game/game.selectors.ts`
```typescript
export const selectStage = createSelector(selectGame, (state: GameState) => state.stage);
export const selectFullName = createSelector(selectGame, (state: GameState) => `${state.avatar.firstName} ${state.avatar.lastName}`);
export const selectDay = createSelector(selectGame, (state: GameState) => state.day);
export const selectCurrency = createSelector(selectGame, (state: GameState) => state.currency);
```

**Game Component Integration** (`src/app/modules/game/game.component.ts`):
```typescript
public gameState$ = this.store.pipe(select(selectGame));
public stage$ = this.store.pipe(select(selectStage));
public avatarName$ = this.store.pipe(select(selectFullName));
public day$ = this.store.pipe(select(selectDay));
public currency$ = this.store.pipe(select(selectCurrency));
```

### Character Selectors
**File**: `src/app/store/characters/characters.selectors.ts`
```typescript
export const selectCurrentCharacter = createSelector(
  selectCharacters,
  (state: CharactersState) => state[state.current]
);

export const selectCharacterStat = createSelector(
  selectCurrentCharacter,
  (state: CharacterState, { statKey }) => state.stats[statKey]
);
```

**Capabilities**:
- Centralized application state management
- Reactive data flow with RxJS observables
- Memoized selectors for performance optimization
- Time-travel debugging support
- Predictable state mutations through pure functions

---

## Extension System

### Avatar Extension Architecture
**File**: `src/app/services/avatars.service.ts`

**Extension Loading**:
```typescript
download(url: string): Observable<void> {
  return this.http.get<AvatarManifest>(url)
    .pipe(
      mergeMap((def) => this.loadExtension(def, { source: url }))
    );
}

import(files: FileList, imageFiles: FileList): Observable<void> {
  return from(files)
    .pipe(
      mergeMap((file) => new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve((ev.target as FileReader).result as string);
        reader.readAsText(file);
      })),
      map((json) => JSON.parse(json)),
      mergeMap((def) => this.loadExtension(def, { imageFiles: Array.from(imageFiles || []) }))
    );
}
```

**Extension Processing**:
```typescript
private loadExtension(def: AvatarManifest, parameters: { source?: string, imageFiles?: File[] }) {
  const urlImageSources = def.images
    .filter((image) => image.type === "url") as UrlImageManifest<AvatarImageKey>[];
  const urlImagePuts$ = from(urlImageSources)
    .pipe(
      mergeMap(({ key: imageKey, source: imageSource }) =>
        this.http.get(imageSource, { responseType: "blob" })
          .pipe(
            switchMap((blob) =>
              this.databaseService.put<AvatarImage>(this.database, this.IMAGES_STORE, 
                { key: imageKey, avatarKey: def.key, source: imageSource, blob })
            )
        )
      );
}
```

### Extension Manifest Structure
**File**: `src/app/models/avatar-manifest.ts`
```typescript
export interface AvatarManifest {
  key: string;
  description: string;
  images: (UrlImageManifest<AvatarImageKey> | LocalImageManifest<AvatarImageKey>)[];
}
```

**Capabilities**:
- URL-based extension downloading
- Local file import support
- Multi-format image handling (URL and local)
- Automated asset processing and storage
- Extension manifest validation
- Community content distribution support

---

## Data Persistence & Storage

### IndexedDB Service
**File**: `src/app/services/database.service.ts`

**Database Creation**:
```typescript
getDatabase(
  name: string,
  stores: {
    name: string,
    options?: IDBObjectStoreParameters,
    indexes?: { name: string, keyPath: string | string[], options?: IDBIndexParameters }[],
  }[],
  version?: number
): Promise<IDBDatabase> {
  const request = this.indexedDb.open(name, version);
  request.onupgradeneeded = (event: any) => {
    const db: IDBDatabase = event.target.result;
    for (const storeDef of stores) {
      const store = db.createObjectStore(storeDef.name, storeDef.options);
      if (storeDef.indexes) {
        for (const index of storeDef.indexes) {
          store.createIndex(index.name, index.keyPath, index.options);
        }
      }
    }
  };
  return this.toResult<IDBDatabase>(request);
}
```

**CRUD Operations**:
```typescript
get<T>(database: Promise<IDBDatabase>, storeName: string, key: IDBValidKey): Promise<T>
put<T>(database: Promise<IDBDatabase>, storeName: string, blob: T, key?: IDBValidKey): Promise<void>
delete(database: Promise<IDBDatabase>, storeName: string, key: IDBValidKey): Promise<void>
getAll<T>(database: Promise<IDBDatabase>, storeName: string): Promise<T[]>
```

### Avatar Storage Implementation
**File**: `src/app/services/avatars.service.ts`
```typescript
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
```

**Capabilities**:
- Offline-first data storage
- Complex indexing for efficient queries
- Blob storage for images and assets
- Transaction-based operations
- Promise-based async API
- Multi-store database architecture

---

## Progressive Web App Features

### Service Worker Configuration
**File**: `src/app/app.module.ts`
```typescript
ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production })
```

### Offline Capabilities
The application supports:
- **Offline Asset Caching**: Static assets cached by service worker
- **IndexedDB Storage**: All user data persisted locally
- **Offline Extension Support**: Downloaded extensions work offline
- **Progressive Enhancement**: Core functionality available without network

### PWA Manifest
**File**: `src/manifest.json`
```json
{
  "name": "Visual Novel Studio",
  "short_name": "VNStudio",
  "theme_color": "#1976d2",
  "background_color": "#fafafa",
  "display": "standalone",
  "scope": "./",
  "start_url": "./"
}
```

**Capabilities**:
- Installable web application
- Offline functionality
- Native app-like experience
- Background synchronization support
- Push notification capability (infrastructure ready)

---

## User Interface & Theming

### Angular Material Integration
**File**: `src/app/modules/game/game.component.ts`
```typescript
@Component({
  selector: "sm4-game",
  styleUrls: ["./game.component.scss"],
  templateUrl: "./game.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush
})
```

### Responsive Design
The application uses Angular Material's responsive breakpoint system:
- **Mobile-first design approach**
- **Flexible grid layouts**
- **Touch-friendly interfaces**
- **Adaptive component sizing**

### Theme System
**File**: `src/styles.scss`
- Custom Angular Material theme
- CSS custom properties for dynamic theming
- Dark/light mode support infrastructure
- Consistent color palette across components

**Capabilities**:
- Material Design compliance
- Responsive layouts for all screen sizes
- Accessible color schemes
- Consistent typography system
- Animation and transition support

---

## Game Logic & Mechanics

### Educational Statistics System
**File**: `src/assets/base/stats.json`
```json
{
  "intelligence": {
    "name": "Intelligence",
    "description": "Measure of knowledge, learning ability, and problem-solving skills.",
    "category": "mental"
  },
  "creativity": {
    "name": "Creativity",
    "description": "Ability to think outside the box and come up with innovative solutions.",
    "category": "mental"
  },
  "charisma": {
    "name": "Charisma",
    "description": "Personal appeal and ability to influence and inspire others.",
    "category": "social"
  }
}
```

### Task System Architecture
**File**: `src/assets/base/tasks.json`
```json
{
  "daily": {
    "education": {
      "name": "Education",
      "tasks": {
        "study": {
          "name": "Study",
          "description": "[Name] will study academic subjects to improve knowledge."
        }
      }
    }
  }
}
```

### Character Progression
**Stat Modification System**:
```typescript
on(adjustStat, (state, { characterKey, statKey, amount }) => {
  const character = state.characters[characterKey];
  character.stats[statKey] += amount;
  return { ...state, [characterKey]: character };
})
```

**Relationship System**:
```typescript
on(improveRelationship, (state, { characterKey, amount }) => {
  const character = { ...state.characters[characterKey] };
  character.relationshipLevel = (character.relationshipLevel || 0) + amount;
  return { ...state, characters: { ...state.characters, [characterKey]: character } };
})
```

**Capabilities**:
- Educational stat progression system
- Relationship development mechanics
- Story milestone tracking
- Character growth through activities
- Balanced progression curves

---

## Performance & Security

### Performance Optimizations
**Change Detection Strategy** (`src/app/modules/game/game.component.ts`):
```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})
```

**RxJS Optimization**:
```typescript
public dialogSelections$ = this.imageSet$
  .pipe(
    map((imageSet) => ({ imageSet })),
    startWith({ imageSet: null })
  );
```

### Security Measures
**DOM Sanitization** (`src/app/modules/new-game/new-game.component.ts`):
```typescript
this.avatarsService.getImage(imageSet.abstract.key, "standard")
  .then((standardImage) => standardImage && 
    this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(standardImage.blob)))
```

**Input Validation**:
- JSON parsing with error handling
- File type validation for imports
- Sanitized URL handling for external resources

**Capabilities**:
- OnPush change detection for performance
- Lazy loading architecture ready
- XSS protection through Angular sanitization
- Content Security Policy compliance
- Secure file handling for extensions

---

## Development & Build System

### TypeScript Configuration
**File**: `tsconfig.json`
- Strict type checking enabled
- ES2015+ target compilation
- Path mapping for clean imports
- Experimental decorator support

### Build Optimizations
**File**: `angular.json`
- Production build optimizations
- Bundle splitting and lazy loading
- Service worker integration
- Asset optimization pipeline

### Testing Infrastructure
**Framework**: Jasmine with Karma
- Component unit testing
- Service integration testing
- E2E testing setup with Protractor
- Code coverage reporting

**Capabilities**:
- Modern TypeScript development experience
- Comprehensive testing framework
- Production-ready build pipeline
- Developer-friendly debugging tools
- Hot reload development server

---

## Architecture Summary

### Key Strengths
1. **Modular Design**: Well-separated concerns with Angular modules
2. **Reactive Architecture**: RxJS and NgRx for predictable state flow
3. **Offline-First**: IndexedDB and service worker for full offline support
4. **Extensible**: Plugin system for community content
5. **Educational Focus**: Age-appropriate content and learning mechanics
6. **Cross-Platform**: PWA capabilities for multiple device support

### Technical Capabilities
- **Character Management**: Full CRUD operations with relationship tracking
- **Extension System**: Import/export with local and remote asset support
- **Data Persistence**: Robust offline storage with complex queries
- **State Management**: Predictable state mutations with time-travel debugging
- **Performance**: Optimized change detection and lazy loading ready
- **Security**: Input sanitization and content security measures

### Future Enhancement Areas
1. **Modernization**: Upgrade to Angular 17+ with standalone components
2. **Testing**: Expand test coverage and implement E2E testing
3. **Accessibility**: WCAG 2.1 compliance improvements
4. **Internationalization**: Multi-language support system
5. **Advanced Features**: Real-time collaboration and cloud sync
6. **Analytics**: Educational progress tracking and insights

This Visual Novel Studio represents a solid foundation for educational interactive storytelling with room for continued growth and enhancement.