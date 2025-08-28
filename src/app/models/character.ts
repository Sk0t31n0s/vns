import { Person } from "./person";

/**
 * Character interface for Visual Novel Studio
 * 
 * Represents a character in an interactive story with attributes
 * focused on personal development and storytelling.
 */
export interface Character extends Person {
  /** Character's title or role in the story (e.g., "Student", "Artist", "Explorer") */
  title?: string;
  
  /** List of personality characteristics that define the character */
  personalityTraits?: string[];
  
  /** Character's background story and personal history */
  backstory?: string;
}
