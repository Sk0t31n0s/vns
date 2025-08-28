import { createAction, props } from "@ngrx/store";

export const addCharacter = createAction(
  "[characters] Add character",
  props<{ character: any }>()
);

export const removeCharacter = createAction(
  "[characters] Remove character",
  props<{ characterKey: string }>()
);

export const setCurrentCharacter = createAction(
  "[characters] Set Current character",
  props<{ characterKey: string }>()
);

export const adjustStat = createAction(
  "[characters] Adjust Stat",
  props<{ characterKey: string, statKey: string, amount: number }>()
);

export const improveRelationship = createAction(
  "[characters] Improve Relationship",
  props<{ characterKey: string, amount: number }>()
);

export const updateStoryProgress = createAction(
  "[characters] Update Story Progress",
  props<{ characterKey: string, progress: number }>()
);

export const completeStoryMilestone = createAction(
  "[characters] Complete Story Milestone",
  props<{ characterKey: string, milestone: string }>()
);

export type CharacterActions =
  | typeof addCharacter
  | typeof removeCharacter
  | typeof setCurrentCharacter
  | typeof adjustStat
  | typeof improveRelationship
  | typeof updateStoryProgress
  | typeof completeStoryMilestone;
