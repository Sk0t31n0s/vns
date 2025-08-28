import { Gender } from "./gender";
import { Pronouns } from "./pronouns";

/**
 * Base Person interface for Visual Novel Studio
 * 
 * Defines the core attributes that all characters share,
 * focusing on inclusive representation and storytelling.
 */
export interface Person {
  /** Character's first/given name */
  givenName: string;
  
  /** Character's family/surname */
  surname: string;
  
  /** Name the character prefers to be called (may be different from given name) */
  preferredName: string;
  
  /** Optional honorific title (e.g. Mr., Ms., Dr., etc.) */
  // honorific?: string;
  
  /** Character's gender identity (male, female, non-binary) */
  gender: Gender;
  
  /** Pronouns the character uses (he, she, they) */
  pronouns: Pronouns;
  
  /** Character's cultural background or origin story */
  background?: string;
}
