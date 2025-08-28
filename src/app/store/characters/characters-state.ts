/**
 * State management for characters in Visual Novel Studio
 * 
 * Manages the collection of characters and their progression
 * through educational and story-driven activities.
 */
export interface CharactersState {
  /** Key of the currently selected/active character */
  current: string;
  
  /** Dictionary of all characters indexed by their unique key */
  characters: { [key: string]: CharacterState };
}

/**
 * Individual character's state and progression data
 * 
 * Tracks a character's development through story activities
 * and relationship building in an educational context.
 */
export interface CharacterState {
  /** Unique identifier for this character */
  key: string;
  
  /** Story day when character was first introduced */
  introductionDay: number;
  
  /** Whether character is currently engaged in an activity */
  inActivity: boolean;
  
  /** Character's current stat levels (intelligence, creativity, etc.) */
  stats: { [key: string]: number };
  
  /** Level of friendship/mentorship relationship with player (0-100) */
  relationshipLevel?: number;
  
  /** Progress through character's personal story arc (0-100) */
  storyProgress?: number;
}
