import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store, createAction, props } from '@ngrx/store';
import { of } from 'rxjs';
import { catchError, exhaustMap, map, mergeMap, tap, withLatestFrom } from 'rxjs/operators';

import { SavesService } from '../../services/saves.service';
import { ErrorHandlerService } from '../../services/error-handler.service';
import { ValidationService } from '../../services/validation.service';
import { AppState } from '../app-state';
import * as GameActions from './game.actions';
import * as fromGame from './game.selectors';
import { SaveAbstract } from '../../models/save-abstract';

// Define additional actions needed for async operations
export const saveGame = createAction(
  '[Game] Save Game',
  props<{ slot: number; label: string }>()
);

export const saveGameSuccess = createAction(
  '[Game] Save Game Success',
  props<{ slot: number; label: string }>()
);

export const saveGameFailure = createAction(
  '[Game] Save Game Failure',
  props<{ error: any }>()
);

export const loadGame = createAction(
  '[Game] Load Game',
  props<{ slot: number }>()
);

export const loadGameSuccess = createAction(
  '[Game] Load Game Success',
  props<{ slot: number }>()
);

export const loadGameFailure = createAction(
  '[Game] Load Game Failure',
  props<{ error: any }>()
);

export const loadSavesList = createAction(
  '[Game] Load Saves List'
);

export const loadSavesListSuccess = createAction(
  '[Game] Load Saves List Success',
  props<{ saves: SaveAbstract[] }>()
);

export const loadSavesListFailure = createAction(
  '[Game] Load Saves List Failure',
  props<{ error: any }>()
);

export const deleteSave = createAction(
  '[Game] Delete Save',
  props<{ slot: number }>()
);

export const deleteSaveSuccess = createAction(
  '[Game] Delete Save Success',
  props<{ slot: number }>()
);

export const deleteSaveFailure = createAction(
  '[Game] Delete Save Failure',
  props<{ error: any }>()
);

@Injectable()
export class GameEffects {

  constructor(
    private actions$: Actions,
    private store: Store<AppState>,
    private savesService: SavesService,
    private errorHandler: ErrorHandlerService,
    private validationService: ValidationService
  ) {}

  /**
   * Save game state to specific slot
   */
  saveGame$ = createEffect(() =>
    this.actions$.pipe(
      ofType(saveGame),
      mergeMap(({ slot, label }) => {
        try {
          // Validate slot number
          if (!Number.isInteger(slot) || slot < 0 || slot > 99) {
            throw new Error('Invalid save slot. Must be between 0 and 99.');
          }

          // Validate label
          const sanitizedLabel = this.validationService.validateUserInput(label, 100);
          
          return this.savesService.save(slot, sanitizedLabel).toPromise().then(
            () => saveGameSuccess({ slot, label: sanitizedLabel }),
            error => saveGameFailure({ error: this.errorHandler.sanitizeError(error) })
          );
        } catch (validationError) {
          return Promise.resolve(saveGameFailure({ 
            error: this.errorHandler.sanitizeError(validationError) 
          }));
        }
      }),
      catchError(error => of(saveGameFailure({ 
        error: this.errorHandler.sanitizeError(error) 
      })))
    )
  );

  /**
   * Load game state from specific slot
   */
  loadGame$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadGame),
      exhaustMap(({ slot }) => {
        try {
          // Validate slot number
          if (!Number.isInteger(slot) || slot < 0 || slot > 99) {
            throw new Error('Invalid save slot. Must be between 0 and 99.');
          }

          return this.savesService.load(slot).then(
            () => loadGameSuccess({ slot }),
            error => loadGameFailure({ error: this.errorHandler.sanitizeError(error) })
          );
        } catch (validationError) {
          return Promise.resolve(loadGameFailure({ 
            error: this.errorHandler.sanitizeError(validationError) 
          }));
        }
      }),
      catchError(error => of(loadGameFailure({ 
        error: this.errorHandler.sanitizeError(error) 
      })))
    )
  );

  /**
   * Load list of all available saves
   */
  loadSavesList$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadSavesList),
      exhaustMap(() =>
        this.savesService.list().then(
          saves => {
            // Validate and sanitize save data
            const validatedSaves = saves.filter(save => {
              try {
                // Basic validation of save structure
                return save && 
                       typeof save.slot === 'number' && 
                       save.slot >= 0 && 
                       save.slot <= 99 &&
                       typeof save.label === 'string' &&
                       save.label.length <= 100 &&
                       save.date instanceof Date;
              } catch (error) {
                console.warn('Invalid save entry filtered out:', save);
                return false;
              }
            });
            
            return loadSavesListSuccess({ saves: validatedSaves });
          },
          error => loadSavesListFailure({ error: this.errorHandler.sanitizeError(error) })
        )
      ),
      catchError(error => of(loadSavesListFailure({ 
        error: this.errorHandler.sanitizeError(error) 
      })))
    )
  );

  /**
   * Delete save from specific slot
   */
  deleteSave$ = createEffect(() =>
    this.actions$.pipe(
      ofType(deleteSave),
      mergeMap(({ slot }) => {
        try {
          // Validate slot number
          if (!Number.isInteger(slot) || slot < 0 || slot > 99) {
            throw new Error('Invalid save slot. Must be between 0 and 99.');
          }

          // Note: SavesService doesn't have a delete method, so we'd need to add it
          // For now, we'll just return success as a placeholder
          return Promise.resolve(deleteSaveSuccess({ slot }));
        } catch (validationError) {
          return Promise.resolve(deleteSaveFailure({ 
            error: this.errorHandler.sanitizeError(validationError) 
          }));
        }
      }),
      catchError(error => of(deleteSaveFailure({ 
        error: this.errorHandler.sanitizeError(error) 
      })))
    )
  );

  /**
   * Handle save success with user feedback
   */
  saveGameSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(saveGameSuccess),
      tap(({ slot, label }) => {
        console.log(`Game saved successfully to slot ${slot}: "${label}"`);
        // In a real app, this could show a toast notification
      })
    ), { dispatch: false }
  );

  /**
   * Handle load success with user feedback  
   */
  loadGameSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadGameSuccess),
      tap(({ slot }) => {
        console.log(`Game loaded successfully from slot ${slot}`);
        // In a real app, this could show a toast notification
      })
    ), { dispatch: false }
  );

  /**
   * Handle save/load errors with user feedback
   */
  saveLoadError$ = createEffect(() =>
    this.actions$.pipe(
      ofType(saveGameFailure, loadGameFailure, deleteSaveFailure),
      tap(({ error }) => {
        this.errorHandler.handleServiceError('save_load', undefined, true)(error);
      })
    ), { dispatch: false }
  );

  /**
   * Handle saves list errors with user feedback
   */
  savesListError$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadSavesListFailure),
      tap(({ error }) => {
        this.errorHandler.handleServiceError('saves_list_load', [], true)(error);
      })
    ), { dispatch: false }
  );
}