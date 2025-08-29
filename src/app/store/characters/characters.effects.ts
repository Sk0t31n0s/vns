import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store, createAction, props } from '@ngrx/store';
import { of } from 'rxjs';
import { catchError, exhaustMap, map, mergeMap, tap, withLatestFrom } from 'rxjs/operators';

import { DatabaseService } from '../../services/database.service';
import { ErrorHandlerService } from '../../services/error-handler.service';
import { ValidationService } from '../../services/validation.service';
import { AppState } from '../app-state';
import * as CharacterActions from './characters.actions';
import * as fromCharacters from './characters.selectors';

// Define additional actions needed for async operations
export const loadCharacters = createAction(
  '[Characters] Load Characters'
);

export const loadCharactersSuccess = createAction(
  '[Characters] Load Characters Success',
  props<{ characters: any[] }>()
);

export const loadCharactersFailure = createAction(
  '[Characters] Load Characters Failure',
  props<{ error: any }>()
);

export const saveCharacter = createAction(
  '[Characters] Save Character',
  props<{ character: any }>()
);

export const saveCharacterSuccess = createAction(
  '[Characters] Save Character Success',
  props<{ character: any }>()
);

export const saveCharacterFailure = createAction(
  '[Characters] Save Character Failure',
  props<{ error: any }>()
);

export const deleteCharacter = createAction(
  '[Characters] Delete Character',
  props<{ characterKey: string }>()
);

export const deleteCharacterSuccess = createAction(
  '[Characters] Delete Character Success',
  props<{ characterKey: string }>()
);

export const deleteCharacterFailure = createAction(
  '[Characters] Delete Character Failure',
  props<{ error: any }>()
);

@Injectable()
export class CharacterEffects {

  private readonly DATABASE_NAME = 'characters';
  private readonly STORE_NAME = 'characters';
  
  private readonly database = this.databaseService.getDatabase(this.DATABASE_NAME, [{
    name: this.STORE_NAME,
    options: { keyPath: 'key' }
  }]);

  constructor(
    private actions$: Actions,
    private store: Store<AppState>,
    private databaseService: DatabaseService,
    private errorHandler: ErrorHandlerService,
    private validationService: ValidationService
  ) {}

  /**
   * Load all characters from database
   */
  loadCharacters$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadCharacters),
      exhaustMap(() =>
        this.databaseService.getAll<any>(this.database, this.STORE_NAME).then(
          characters => loadCharactersSuccess({ characters }),
          error => loadCharactersFailure({ error: this.errorHandler.sanitizeError(error) })
        )
      ),
      catchError(error => of(loadCharactersFailure({ 
        error: this.errorHandler.sanitizeError(error) 
      })))
    )
  );

  /**
   * Save character to database
   */
  saveCharacter$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CharacterActions.addCharacter, saveCharacter),
      mergeMap(action => {
        try {
          // Validate character data before saving
          const validationResult = this.validationService.validateCharacter(action.character);
          if (!validationResult.isValid) {
            throw new Error(`Character validation failed: ${validationResult.errors.join(', ')}`);
          }

          return this.databaseService.put<any>(this.database, this.STORE_NAME, action.character, action.character.key).then(
            () => saveCharacterSuccess({ character: action.character }),
            error => saveCharacterFailure({ error: this.errorHandler.sanitizeError(error) })
          );
        } catch (validationError) {
          return Promise.resolve(saveCharacterFailure({ 
            error: this.errorHandler.sanitizeError(validationError) 
          }));
        }
      }),
      catchError(error => of(saveCharacterFailure({ 
        error: this.errorHandler.sanitizeError(error) 
      })))
    )
  );

  /**
   * Delete character from database
   */
  deleteCharacter$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CharacterActions.removeCharacter, deleteCharacter),
      mergeMap(action => {
        const characterKey = action.characterKey;
        
        try {
          // Validate the key before deletion
          this.validationService.validateDatabaseKey(characterKey);

          return this.databaseService.delete(this.database, this.STORE_NAME, characterKey).then(
            () => deleteCharacterSuccess({ characterKey }),
            error => deleteCharacterFailure({ error: this.errorHandler.sanitizeError(error) })
          );
        } catch (validationError) {
          return Promise.resolve(deleteCharacterFailure({ 
            error: this.errorHandler.sanitizeError(validationError) 
          }));
        }
      }),
      catchError(error => of(deleteCharacterFailure({ 
        error: this.errorHandler.sanitizeError(error) 
      })))
    )
  );

  /**
   * Update character stats with persistence
   */
  updateCharacterStats$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CharacterActions.adjustStat, CharacterActions.improveRelationship, CharacterActions.updateStoryProgress),
      withLatestFrom(this.store.select(fromCharacters.selectCurrentCharacter)),
      mergeMap(([action, currentCharacter]) => {
        if (!currentCharacter) {
          return of(saveCharacterFailure({ 
            error: { message: 'No current character selected for stat update' }
          }));
        }

        // Create updated character based on action type
        let updatedCharacter = { ...currentCharacter };
        
        if (action.type === '[characters] Adjust Stat') {
          const adjustAction = action as ReturnType<typeof CharacterActions.adjustStat>;
          updatedCharacter.stats = {
            ...updatedCharacter.stats,
            [adjustAction.statKey]: Math.max(0, Math.min(100, 
              (updatedCharacter.stats[adjustAction.statKey] || 0) + adjustAction.amount
            ))
          };
        } else if (action.type === '[characters] Improve Relationship') {
          const relationAction = action as ReturnType<typeof CharacterActions.improveRelationship>;
          updatedCharacter.relationshipLevel = Math.max(0, Math.min(100, 
            (updatedCharacter.relationshipLevel || 0) + relationAction.amount
          ));
        } else if (action.type === '[characters] Update Story Progress') {
          const storyAction = action as ReturnType<typeof CharacterActions.updateStoryProgress>;
          updatedCharacter.storyProgress = Math.max(0, Math.min(100, storyAction.progress));
        }

        // Save the updated character
        return this.databaseService.put<any>(this.database, this.STORE_NAME, updatedCharacter, updatedCharacter.key).then(
          () => saveCharacterSuccess({ character: updatedCharacter }),
          error => saveCharacterFailure({ error: this.errorHandler.sanitizeError(error) })
        );
      }),
      catchError(error => of(saveCharacterFailure({ 
        error: this.errorHandler.sanitizeError(error) 
      })))
    )
  );

  /**
   * Handle save success with user feedback
   */
  saveCharacterSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(saveCharacterSuccess),
      tap(({ character }) => {
        if (console && console.log) {
          console.log(`Character "${character.preferredName || character.key}" saved successfully`);
        }
      })
    ), { dispatch: false }
  );

  /**
   * Handle save errors with user feedback
   */
  saveCharacterFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType(saveCharacterFailure, deleteCharacterFailure),
      tap(({ error }) => {
        this.errorHandler.handleServiceError('character_save', undefined, true)(error);
      })
    ), { dispatch: false }
  );

  /**
   * Handle load errors with user feedback
   */
  loadCharactersFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadCharactersFailure),
      tap(({ error }) => {
        this.errorHandler.handleServiceError('character_load', [], true)(error);
      })
    ), { dispatch: false }
  );
}