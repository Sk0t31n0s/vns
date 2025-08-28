import { createSelector } from "@ngrx/store";
import { AppState } from "../app-state";
import { CharactersState, CharacterState } from "./characters-state";

export const selectCharacters = (state: AppState) => state.characters;

export const selectCurrentCharacter = createSelector(
  selectCharacters,
  (state: CharactersState) => state[state.current]
);

export const selectCharacterStat = createSelector(
  selectCurrentCharacter,
  (state: CharacterState, { statKey }: { statKey: string }) => state.stats[statKey]
);
