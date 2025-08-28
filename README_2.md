# Visual Novel Framework - Project Analysis & Sanitization Guide

## Project Overview

This project is an **Angular 8 Progressive Web Application (PWA)** framework designed for creating and running community-based visual novel content. Originally created as an adult-themed "trainer" game platform, this codebase provides a solid technical foundation that can be transformed into a general-purpose visual novel framework suitable for all audiences.

### Current Project Name
- **Current**: "trainee trainer 4" (sm4)
- **Suggested**: "Visual Novel Studio" or "Interactive Story Platform"

## Technical Architecture

### Core Technologies
- **Framework**: Angular 8.2.14
- **UI Library**: Angular Material 8.2.3 with Material Design principles
- **State Management**: NgRx Store 8.6.0 for predictable state management
- **Database**: IndexedDB via custom database service for offline storage
- **PWA**: Service Worker implementation for offline functionality
- **Build System**: Angular CLI 8.3.21
- **Testing**: Karma + Jasmine test framework

### Project Structure

```
src/
├── app/
│   ├── components/           # UI components (home, save/load, etc.)
│   ├── models/              # TypeScript interfaces and data models
│   ├── modules/             # Feature modules (game, extensions, new-game)
│   ├── services/            # Business logic services
│   ├── store/               # NgRx state management
│   └── route.ts            # Application routing definitions
├── assets/
│   ├── base/               # Base game configuration (stats, tasks)
│   ├── icons/              # PWA and UI icons
│   └── images/             # Background images
└── environments/           # Environment configurations
```

## Key Features & Components

### 1. Modular Extension System
- **Location**: `src/app/modules/extensions/`
- **Purpose**: Load community-created content via manifest files
- **Storage**: IndexedDB for offline content management
- **Types**: Character sets, stories, images, and additional content

### 2. Character Management System
- **Models**: `src/app/models/person.ts`, `src/app/models/avatar.ts`
- **Features**: Character creation, avatar selection, stats tracking
- **Customization**: Gender-neutral pronouns system, extensible attributes

### 3. Game State Management
- **Store**: NgRx-based state management in `src/app/store/`
- **Persistence**: Save/load functionality with local storage
- **Components**: Route management, game progression, character states

### 4. Task & Activity System
- **Configuration**: `src/assets/base/tasks.json`
- **Structure**: Hierarchical task categories with difficulty ratings
- **Extensibility**: Community-definable tasks and activities

### 5. Progressive Web App Features
- **Offline Support**: Full offline functionality once loaded
- **Installation**: Can be installed as desktop/mobile app
- **Performance**: Service worker for caching and performance

## Current Content Analysis

### Problematic Elements Requiring Sanitization

#### 1. **Terminology & Naming Conventions**
- References to adult themes in variable names and file names
- Inappropriate content in task descriptions and UI text
- Adult-themed character attributes and statistics

#### 2. **Content Files**
- `src/assets/base/stats.json` - Contains adult-themed character statistics
- `src/assets/base/tasks.json` - Contains inappropriate task descriptions
- Various model files with adult-themed terminology

#### 3. **UI Components & Text**
- Component templates with inappropriate content references
- Navigation and menu items with adult themes
- Character creation flows with inappropriate options

## TODO: Complete Content Sanitization

### Phase 1: Core Terminology & File Renaming

#### 1.1 Model Files Sanitization
- [ ] **Rename**: `src/app/models/slave.ts` → `src/app/models/character.ts`
- [ ] **Update Interface**: Change `trainee` interface to `Character`
- [ ] **Rename**: `src/app/models/slave-manifest.ts` → `src/app/models/character-manifest.ts`
- [ ] **Update References**: Replace all `trainee`/`slave` references with `character`

#### 1.2 Store/State Management Cleanup
- [ ] **Rename Directory**: `src/app/store/slaves/` → `src/app/store/characters/`
- [ ] **Rename Files**:
  - `slaves-state.ts` → `characters-state.ts`
  - `slaves.actions.ts` → `characters.actions.ts`
  - `slaves.reducers.ts` → `characters.reducers.ts`
  - `slaves.selectors.ts` → `characters.selectors.ts`
- [ ] **Update AppState**: Change `trainees` property to `characters` in `src/app/store/app-state.ts`

#### 1.3 Component Renaming
- [ ] **Rename**: `slave-stats/` → `character-stats/`
- [ ] **Rename**: `slave-extensions/` → `character-extensions/`
- [ ] **Update Selectors**: All component references and imports

#### 1.4 Service Updates
- [ ] **Update**: All service files to use character-based terminology
- [ ] **Database Schema**: Update IndexedDB store names and keys
- [ ] **API Interfaces**: Update all service method signatures

### Phase 2: Content Sanitization

#### 2.1 Statistics System Overhaul
**File**: `src/assets/base/stats.json`

Current problematic stats to replace:
```json
{
  "lust": "Excitement/Energy Level",
  "libido": "Enthusiasm/Motivation", 
  "oral": "Communication/Speaking Skills",
  "cuddleing": "Relationship/Social Skills"
}
```

**Replacement Stats for General Visual Novel**:
- [ ] **Intelligence**: Problem-solving and learning ability
- [ ] **Creativity**: Artistic and innovative thinking
- [ ] **Charisma**: Social influence and leadership
- [ ] **Empathy**: Understanding and relating to others
- [ ] **Courage**: Facing challenges and taking risks
- [ ] **Patience**: Handling difficult situations calmly
- [ ] **Focus**: Concentration and attention to detail
- [ ] **Energy**: Physical and mental stamina

#### 2.2 Task System Redesign
**File**: `src/assets/base/tasks.json`

**Current Categories to Replace**:
- [ ] **"foreplay"** → **"social"** (Social activities and interactions)
- [ ] **"sex"** → **"adventure"** (Adventure and exploration activities)

**New Task Categories**:
```json
{
  "daily": {
    "education": {
      "name": "Education",
      "tasks": {
        "study": "Character studies academic subjects",
        "research": "Character conducts research activities",
        "practice": "Character practices skills"
      }
    },
    "work": {
      "name": "Work & Career", 
      "tasks": {
        "apprentice": "Character works as an apprentice",
        "volunteer": "Character volunteers in the community"
      }
    }
  },
  "social": {
    "friendship": {
      "name": "Friendship Building",
      "tasks": {
        "conversation": "Character has meaningful conversations",
        "teamwork": "Character works with others on projects"
      }
    }
  },
  "adventure": {
    "exploration": {
      "name": "Exploration",
      "tasks": {
        "travel": "Character explores new locations",
        "discovery": "Character investigates mysteries"
      }
    }
  }
}
```

#### 2.3 UI Text Sanitization
- [ ] **Home Component**: `src/app/components/home/home.component.html`
- [ ] **Game Components**: All templates in `src/app/modules/game/components/`
- [ ] **Character Creation**: `src/app/modules/new-game/` templates
- [ ] **Settings & Menus**: All navigation and menu text

### Phase 3: Visual & Asset Updates

#### 3.1 Icon & Image Replacement
- [ ] **Remove**: `src/assets/icons/collar.png` and `whip.png`
- [ ] **Add**: Appropriate icons for general visual novel (book, pen, adventure themes)
- [ ] **Update**: `src/manifest.webmanifest` with new app metadata

#### 3.2 Background Images
- [ ] **Verify**: Current backgrounds in `src/assets/images/backgrounds/` are appropriate
- [ ] **Add**: Additional neutral backgrounds (library, town, nature, etc.)

#### 3.3 PWA Manifest Updates
**File**: `src/manifest.webmanifest`
- [ ] **App Name**: Change to "Visual Novel Studio"
- [ ] **Description**: Update to reflect general visual novel purpose
- [ ] **Theme Colors**: Consider more neutral color scheme

### Phase 4: Code Logic & Functionality Updates

#### 4.1 Character Creation Flow
- [ ] **Gender System**: Ensure inclusive and appropriate options
- [ ] **Pronouns**: Verify pronoun system supports all users appropriately
- [ ] **Character Attributes**: Replace inappropriate attributes with story-relevant ones

#### 4.2 Game Progression System
- [ ] **Relationship System**: Convert to friendship/mentorship mechanics
- [ ] **Story Arcs**: Design template story arcs for different genres
- [ ] **Conflict Resolution**: Create age-appropriate conflict scenarios

#### 4.3 Extension System Enhancement
- [ ] **Content Validation**: Add content filtering for community extensions
- [ ] **Age Rating System**: Implement content rating system
- [ ] **Moderation Tools**: Create tools for content review

### Phase 5: Documentation & Guidelines Update

#### 5.1 Developer Documentation
- [ ] **Update**: `GUIDELINES.md` with appropriate content creation guidelines
- [ ] **Create**: Content standards document
- [ ] **Update**: All inline code documentation

#### 5.2 User Documentation
- [ ] **Create**: User manual for the visual novel platform
- [ ] **Create**: Content creator guide for extensions
- [ ] **Update**: Installation and setup instructions

#### 5.3 Community Guidelines
- [ ] **Create**: Community standards and moderation policies
- [ ] **Create**: Content submission guidelines
- [ ] **Create**: Age-appropriate content creation guide

### Phase 6: Testing & Quality Assurance

#### 6.1 Content Audit
- [ ] **Full Text Search**: Search codebase for any remaining inappropriate terms
- [ ] **Asset Review**: Verify all images and assets are appropriate
- [ ] **Translation Keys**: Update all i18n keys if implemented

#### 6.2 Functionality Testing
- [ ] **Unit Tests**: Update all unit tests with new terminology
- [ ] **E2E Tests**: Update end-to-end tests for new user flows
- [ ] **PWA Testing**: Verify offline functionality still works

#### 6.3 Accessibility & Usability
- [ ] **Screen Reader Testing**: Ensure new content is accessible
- [ ] **Content Clarity**: Verify new text is clear and appropriate
- [ ] **User Experience**: Test entire user flow with new content

### Phase 7: Deployment & Migration

#### 7.1 Database Migration
- [ ] **Migration Script**: Create script to migrate existing saves/data
- [ ] **Backward Compatibility**: Ensure migration doesn't break existing data
- [ ] **Data Validation**: Verify migrated data integrity

#### 7.2 Production Deployment
- [ ] **Build Testing**: Verify production builds work correctly
- [ ] **Performance Testing**: Ensure changes don't impact performance
- [ ] **SEO Updates**: Update meta tags and descriptions

## Recommended New Project Structure

After sanitization, the project could be repositioned as:

### "Interactive Story Platform" Features:
1. **Story Builder**: Visual interface for creating branching narratives
2. **Character Designer**: Tools for creating diverse, inclusive characters
3. **Community Hub**: Platform for sharing and discovering stories
4. **Education Mode**: Templates for educational interactive stories
5. **Accessibility Tools**: Support for various accessibility needs

### Target Audiences:
- **Educators**: Interactive educational content
- **Writers**: Digital storytelling platform
- **Game Developers**: Visual novel creation tool
- **Students**: Interactive learning experiences

## Development Commands

After sanitization, these commands remain the same:
```bash
# Development server
ng serve

# Build for production
ng build --prod

# Run tests
ng test

# Run linting
ng lint

# PWA testing
npm run pwa
```

## Technical Debt & Improvements

### Immediate Technical Improvements Needed:
1. **Angular Update**: Migrate from Angular 8 to latest LTS version
2. **Security Audit**: Update all dependencies for security vulnerabilities
3. **Type Safety**: Improve TypeScript strict mode compliance
4. **Performance**: Implement lazy loading for better performance
5. **Testing**: Increase test coverage above 80%

### Long-term Enhancements:
1. **Real-time Collaboration**: Multi-user story creation
2. **Cloud Sync**: Cross-device save synchronization
3. **Advanced Analytics**: Story engagement metrics
4. **Mobile Optimization**: Better mobile experience
5. **Internationalization**: Multi-language support

## Conclusion

This codebase provides a solid technical foundation for a general-purpose visual novel platform. The modular architecture, PWA capabilities, and extension system are well-designed. With comprehensive content sanitization and the suggested improvements, this could become a valuable tool for educators, writers, and creative professionals.

The key to successful transformation is systematic execution of the sanitization plan while preserving the technical architecture that makes this platform valuable.

---

**Estimated Time for Complete Sanitization**: 40-60 developer hours
**Priority**: High - Content sanitization should be completed before any feature enhancements
**Risk Level**: Low - Well-structured codebase makes refactoring straightforward