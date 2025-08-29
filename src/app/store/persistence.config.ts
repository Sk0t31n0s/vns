import { ActionReducer, MetaReducer } from '@ngrx/store';
import { localStorageSync } from 'ngrx-store-localstorage';
import { environment } from '../../environments/environment';
import { AppState } from './app-state';

/**
 * State keys to persist in localStorage
 */
const PERSISTED_STATE_KEYS: (keyof AppState)[] = [
  'characters', // Persist character data
  'game'        // Persist current game state
  // Note: We don't persist 'route' as it should be managed by the router
];

/**
 * State sanitization function to prevent storing sensitive data
 */
function stateSanitizer(state: any): any {
  if (!state || typeof state !== 'object') {
    return state;
  }

  // Create a deep copy to avoid mutating original state
  const sanitizedState = JSON.parse(JSON.stringify(state));

  // Remove any potentially sensitive fields
  if (sanitizedState.game && sanitizedState.game.debugInfo) {
    delete sanitizedState.game.debugInfo;
  }

  // Validate character data before persisting
  if (sanitizedState.characters && sanitizedState.characters.characters) {
    Object.keys(sanitizedState.characters.characters).forEach(key => {
      const character = sanitizedState.characters.characters[key];
      
      // Remove any fields that shouldn't be persisted
      if (character.temporaryData) {
        delete character.temporaryData;
      }
      
      // Validate character structure
      if (!character.key || typeof character.key !== 'string') {
        console.warn(`Invalid character data for key ${key}, removing from persistence`);
        delete sanitizedState.characters.characters[key];
      }
    });
  }

  return sanitizedState;
}

/**
 * State rehydration function to validate loaded data
 */
function stateRehydrator(state: any): any {
  if (!state || typeof state !== 'object') {
    return state;
  }

  try {
    // Validate the rehydrated state structure
    const rehydratedState = { ...state };

    // Validate characters state
    if (rehydratedState.characters) {
      if (!rehydratedState.characters.characters || typeof rehydratedState.characters.characters !== 'object') {
        console.warn('Invalid characters state in localStorage, resetting characters');
        rehydratedState.characters = {
          current: null,
          characters: {}
        };
      } else {
        // Validate individual character entries
        Object.keys(rehydratedState.characters.characters).forEach(key => {
          const character = rehydratedState.characters.characters[key];
          
          if (!character || typeof character !== 'object' || !character.key) {
            console.warn(`Invalid character data for key ${key}, removing`);
            delete rehydratedState.characters.characters[key];
            
            // Reset current character if it was the invalid one
            if (rehydratedState.characters.current === key) {
              rehydratedState.characters.current = null;
            }
          }
        });
      }
    }

    // Validate game state
    if (rehydratedState.game) {
      // Ensure game state has required properties
      if (typeof rehydratedState.game !== 'object') {
        console.warn('Invalid game state in localStorage, resetting game state');
        rehydratedState.game = {
          day: 1,
          timeOfDay: 'morning',
          playerStats: {},
          isLoaded: false
        };
      }
    }

    return rehydratedState;
  } catch (error) {
    console.error('Error during state rehydration:', error);
    // Return an empty state if rehydration fails
    return {};
  }
}

/**
 * Create the localStorage sync reducer
 */
export function localStorageSyncReducer(reducer: ActionReducer<AppState>): ActionReducer<AppState> {
  return localStorageSync({
    keys: PERSISTED_STATE_KEYS,
    rehydrate: true,
    storage: window.localStorage,
    removeOnUndefined: true,
    restoreDates: false, // Disable automatic date restoration to prevent issues
    syncCondition: (state: AppState) => {
      // Only sync if we're not in a loading state
      return !state.game?.isLoading;
    },
    checkStorageAvailability: true,
    storageKeySerializer: (key: string) => `vns_${key}`, // Prefix to avoid conflicts
    stateSanitizer,
    stateRehydrator
  })(reducer);
}

/**
 * Meta reducers for the application
 */
export const metaReducers: MetaReducer<AppState>[] = !environment.production
  ? [localStorageSyncReducer] // Include localStorage sync in development
  : [localStorageSyncReducer]; // Also include in production for this app

/**
 * Clear all persisted state (useful for logout or reset)
 */
export function clearPersistedState(): void {
  try {
    PERSISTED_STATE_KEYS.forEach(key => {
      const storageKey = `vns_${key}`;
      localStorage.removeItem(storageKey);
    });
    console.log('Persisted state cleared successfully');
  } catch (error) {
    console.error('Error clearing persisted state:', error);
  }
}

/**
 * Get the size of persisted state in localStorage
 */
export function getPersistedStateSize(): { key: string; size: number }[] {
  const sizes: { key: string; size: number }[] = [];
  
  try {
    PERSISTED_STATE_KEYS.forEach(key => {
      const storageKey = `vns_${key}`;
      const item = localStorage.getItem(storageKey);
      const size = item ? new Blob([item]).size : 0;
      sizes.push({ key, size });
    });
  } catch (error) {
    console.error('Error calculating persisted state size:', error);
  }
  
  return sizes;
}

/**
 * Check if localStorage is available and has enough space
 */
export function checkStorageHealth(): { available: boolean; quota?: number; usage?: number } {
  try {
    // Check if localStorage is available
    const testKey = 'vns_storage_test';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);

    // Try to get storage quota information
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      return navigator.storage.estimate().then(estimate => ({
        available: true,
        quota: estimate.quota,
        usage: estimate.usage
      }));
    }

    return { available: true };
  } catch (error) {
    console.warn('localStorage not available:', error);
    return { available: false };
  }
}