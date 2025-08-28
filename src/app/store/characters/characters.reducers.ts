import { createReducer, on } from "@ngrx/store";
import { CharactersState } from "./characters-state";
import { addCharacter, removeCharacter, setCurrentCharacter, adjustStat, improveRelationship, updateStoryProgress, completeStoryMilestone, CharacterActions } from "./characters.actions";

export const initialState: CharactersState = {
  current: null,
  characters: { }
 };

const charactersReducer = createReducer(
  initialState,
  on(addCharacter, (state, { character }) => ({ ...state, characters: { ...state.characters, [character.key]: character }})),
  on(removeCharacter, (state, { characterKey }) => {
    const characters = Object.keys(state.characters)
      .filter((key) => key !== characterKey)
      .reduce((acc, key) => ({ ...acc, [key]: state.characters[key] }), { });
    return { ...state, characters };
  }),
  on(setCurrentCharacter, (state, { characterKey }) => ({ ...state, current: characterKey })),
  on(adjustStat, (state, { characterKey, statKey, amount }) => {
    const character = state.characters[characterKey];
    character.stats[statKey] += amount;
    return { ...state, [characterKey]: character };
  }),
  on(improveRelationship, (state, { characterKey, amount }) => {
    const character = { ...state.characters[characterKey] };
    character.relationshipLevel = (character.relationshipLevel || 0) + amount;
    return { ...state, characters: { ...state.characters, [characterKey]: character } };
  }),
  on(updateStoryProgress, (state, { characterKey, progress }) => {
    const character = { ...state.characters[characterKey] };
    character.storyProgress = progress;
    return { ...state, characters: { ...state.characters, [characterKey]: character } };
  }),
  on(completeStoryMilestone, (state, { characterKey, milestone }) => {
    const character = { ...state.characters[characterKey] };
    character.relationshipLevel = (character.relationshipLevel || 0) + 10; // Milestone bonus
    return { ...state, characters: { ...state.characters, [characterKey]: character } };
  })
);

export function reducer(state: CharactersState | undefined, action: CharacterActions) {
  return charactersReducer(state, action);
}
