import { reducer, initialState } from './characters.reducers';
import { 
  addCharacter, 
  removeCharacter, 
  setCurrentCharacter, 
  adjustStat, 
  improveRelationship, 
  updateStoryProgress, 
  completeStoryMilestone 
} from './characters.actions';
import { CharactersState } from './characters-state';

describe('Characters Reducer', () => {
  describe('unknown action', () => {
    it('should return the previous state', () => {
      const action = {} as any;
      const result = reducer(initialState, action);

      expect(result).toBe(initialState);
    });
  });

  describe('addCharacter', () => {
    it('should add a character to the state', () => {
      const character = {
        key: 'char1',
        firstName: 'John',
        lastName: 'Doe',
        stats: { intelligence: 50, charisma: 30 },
        relationshipLevel: 0
      };

      const action = addCharacter({ character });
      const result = reducer(initialState, action);

      expect(result.characters).toEqual({
        char1: character
      });
      expect(result.current).toBe(initialState.current);
    });

    it('should not mutate the original state', () => {
      const character = {
        key: 'char1',
        firstName: 'John',
        lastName: 'Doe'
      };

      const action = addCharacter({ character });
      const result = reducer(initialState, action);

      expect(result).not.toBe(initialState);
      expect(result.characters).not.toBe(initialState.characters);
    });

    it('should add multiple characters', () => {
      const char1 = { key: 'char1', firstName: 'John' };
      const char2 = { key: 'char2', firstName: 'Jane' };

      const state1 = reducer(initialState, addCharacter({ character: char1 }));
      const state2 = reducer(state1, addCharacter({ character: char2 }));

      expect(Object.keys(state2.characters)).toHaveLength(2);
      expect(state2.characters['char1']).toEqual(char1);
      expect(state2.characters['char2']).toEqual(char2);
    });

    it('should overwrite character if key already exists', () => {
      const char1 = { key: 'char1', firstName: 'John' };
      const char1Updated = { key: 'char1', firstName: 'Johnny' };

      const state1 = reducer(initialState, addCharacter({ character: char1 }));
      const state2 = reducer(state1, addCharacter({ character: char1Updated }));

      expect(Object.keys(state2.characters)).toHaveLength(1);
      expect(state2.characters['char1'].firstName).toBe('Johnny');
    });
  });

  describe('removeCharacter', () => {
    let stateWithCharacters: CharactersState;

    beforeEach(() => {
      const char1 = { key: 'char1', firstName: 'John' };
      const char2 = { key: 'char2', firstName: 'Jane' };
      
      let state = reducer(initialState, addCharacter({ character: char1 }));
      state = reducer(state, addCharacter({ character: char2 }));
      stateWithCharacters = state;
    });

    it('should remove a character from the state', () => {
      const action = removeCharacter({ characterKey: 'char1' });
      const result = reducer(stateWithCharacters, action);

      expect(Object.keys(result.characters)).toHaveLength(1);
      expect(result.characters['char1']).toBeUndefined();
      expect(result.characters['char2']).toBeDefined();
    });

    it('should not mutate the original state', () => {
      const action = removeCharacter({ characterKey: 'char1' });
      const result = reducer(stateWithCharacters, action);

      expect(result).not.toBe(stateWithCharacters);
      expect(result.characters).not.toBe(stateWithCharacters.characters);
    });

    it('should handle removing non-existent character gracefully', () => {
      const action = removeCharacter({ characterKey: 'nonexistent' });
      const result = reducer(stateWithCharacters, action);

      expect(Object.keys(result.characters)).toHaveLength(2);
      expect(result.characters).toEqual(stateWithCharacters.characters);
    });
  });

  describe('setCurrentCharacter', () => {
    it('should set the current character', () => {
      const action = setCurrentCharacter({ characterKey: 'char1' });
      const result = reducer(initialState, action);

      expect(result.current).toBe('char1');
      expect(result.characters).toBe(initialState.characters);
    });

    it('should update current character even if character doesn\'t exist', () => {
      const action = setCurrentCharacter({ characterKey: 'nonexistent' });
      const result = reducer(initialState, action);

      expect(result.current).toBe('nonexistent');
    });
  });

  describe('adjustStat', () => {
    let stateWithCharacter: CharactersState;

    beforeEach(() => {
      const character = {
        key: 'char1',
        firstName: 'John',
        stats: { intelligence: 50, charisma: 30 }
      };
      stateWithCharacter = reducer(initialState, addCharacter({ character }));
    });

    it('should adjust character stat by positive amount', () => {
      const action = adjustStat({ characterKey: 'char1', statKey: 'intelligence', amount: 10 });
      const result = reducer(stateWithCharacter, action);

      expect(result.characters['char1'].stats.intelligence).toBe(60);
      expect(result.characters['char1'].stats.charisma).toBe(30); // unchanged
    });

    it('should adjust character stat by negative amount', () => {
      const action = adjustStat({ characterKey: 'char1', statKey: 'intelligence', amount: -20 });
      const result = reducer(stateWithCharacter, action);

      expect(result.characters['char1'].stats.intelligence).toBe(30);
    });

    it('should handle adjusting non-existent stat', () => {
      const action = adjustStat({ characterKey: 'char1', statKey: 'newStat', amount: 25 });
      
      expect(() => {
        reducer(stateWithCharacter, action);
      }).toThrowError(); // This will fail as current implementation doesn't handle this gracefully
    });

    it('should not affect other characters', () => {
      const char2 = { key: 'char2', stats: { intelligence: 40 } };
      const state = reducer(stateWithCharacter, addCharacter({ character: char2 }));
      
      const action = adjustStat({ characterKey: 'char1', statKey: 'intelligence', amount: 10 });
      const result = reducer(state, action);

      expect(result.characters['char1'].stats.intelligence).toBe(60);
      expect(result.characters['char2'].stats.intelligence).toBe(40); // unchanged
    });
  });

  describe('improveRelationship', () => {
    let stateWithCharacter: CharactersState;

    beforeEach(() => {
      const character = {
        key: 'char1',
        firstName: 'John',
        relationshipLevel: 20
      };
      stateWithCharacter = reducer(initialState, addCharacter({ character }));
    });

    it('should improve relationship level', () => {
      const action = improveRelationship({ characterKey: 'char1', amount: 5 });
      const result = reducer(stateWithCharacter, action);

      expect(result.characters['char1'].relationshipLevel).toBe(25);
    });

    it('should handle character with no initial relationship level', () => {
      const character = { key: 'char2', firstName: 'Jane' };
      const state = reducer(stateWithCharacter, addCharacter({ character }));
      
      const action = improveRelationship({ characterKey: 'char2', amount: 10 });
      const result = reducer(state, action);

      expect(result.characters['char2'].relationshipLevel).toBe(10);
    });

    it('should not mutate original character object', () => {
      const action = improveRelationship({ characterKey: 'char1', amount: 5 });
      const result = reducer(stateWithCharacter, action);

      expect(result.characters['char1']).not.toBe(stateWithCharacter.characters['char1']);
    });
  });

  describe('updateStoryProgress', () => {
    let stateWithCharacter: CharactersState;

    beforeEach(() => {
      const character = {
        key: 'char1',
        firstName: 'John',
        storyProgress: 10
      };
      stateWithCharacter = reducer(initialState, addCharacter({ character }));
    });

    it('should update story progress', () => {
      const action = updateStoryProgress({ characterKey: 'char1', progress: 25 });
      const result = reducer(stateWithCharacter, action);

      expect(result.characters['char1'].storyProgress).toBe(25);
    });

    it('should set story progress even if not initially present', () => {
      const character = { key: 'char2', firstName: 'Jane' };
      const state = reducer(stateWithCharacter, addCharacter({ character }));
      
      const action = updateStoryProgress({ characterKey: 'char2', progress: 50 });
      const result = reducer(state, action);

      expect(result.characters['char2'].storyProgress).toBe(50);
    });
  });

  describe('completeStoryMilestone', () => {
    let stateWithCharacter: CharactersState;

    beforeEach(() => {
      const character = {
        key: 'char1',
        firstName: 'John',
        relationshipLevel: 20
      };
      stateWithCharacter = reducer(initialState, addCharacter({ character }));
    });

    it('should improve relationship by 10 when completing milestone', () => {
      const action = completeStoryMilestone({ characterKey: 'char1', milestone: 'first_meeting' });
      const result = reducer(stateWithCharacter, action);

      expect(result.characters['char1'].relationshipLevel).toBe(30); // 20 + 10 bonus
    });

    it('should handle character with no initial relationship level', () => {
      const character = { key: 'char2', firstName: 'Jane' };
      const state = reducer(stateWithCharacter, addCharacter({ character }));
      
      const action = completeStoryMilestone({ characterKey: 'char2', milestone: 'first_meeting' });
      const result = reducer(state, action);

      expect(result.characters['char2'].relationshipLevel).toBe(10); // 0 + 10 bonus
    });

    it('should not store the milestone in current implementation', () => {
      const action = completeStoryMilestone({ characterKey: 'char1', milestone: 'first_meeting' });
      const result = reducer(stateWithCharacter, action);

      // Current implementation doesn't store milestones, only gives bonus
      expect(result.characters['char1'].completedMilestones).toBeUndefined();
    });
  });

  describe('Edge Cases and Security', () => {
    it('should handle empty character key', () => {
      const action = adjustStat({ characterKey: '', statKey: 'intelligence', amount: 10 });
      
      expect(() => {
        reducer(initialState, action);
      }).toThrowError();
    });

    it('should handle null/undefined character key', () => {
      const action = adjustStat({ characterKey: null as any, statKey: 'intelligence', amount: 10 });
      
      expect(() => {
        reducer(initialState, action);
      }).toThrowError();
    });

    it('should handle malicious stat keys', () => {
      const character = { key: 'char1', stats: {} };
      const state = reducer(initialState, addCharacter({ character }));
      
      const maliciousKeys = ['__proto__', 'constructor', 'prototype'];
      
      maliciousKeys.forEach(key => {
        const action = adjustStat({ characterKey: 'char1', statKey: key, amount: 10 });
        
        expect(() => {
          reducer(state, action);
        }).toThrowError();
      });
    });

    it('should handle extremely large stat values', () => {
      const character = { key: 'char1', stats: { intelligence: Number.MAX_SAFE_INTEGER - 1 } };
      const state = reducer(initialState, addCharacter({ character }));
      
      const action = adjustStat({ characterKey: 'char1', statKey: 'intelligence', amount: 10 });
      const result = reducer(state, action);
      
      // Should handle overflow gracefully
      expect(result.characters['char1'].stats.intelligence).toBeGreaterThan(Number.MAX_SAFE_INTEGER - 1);
    });
  });

  describe('Performance Tests', () => {
    it('should handle state with many characters efficiently', () => {
      let state = initialState;
      
      // Add 1000 characters
      const startTime = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        const character = {
          key: `char${i}`,
          firstName: `Character${i}`,
          stats: { intelligence: i % 100 }
        };
        state = reducer(state, addCharacter({ character }));
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(Object.keys(state.characters)).toHaveLength(1000);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle frequent stat adjustments efficiently', () => {
      const character = { key: 'char1', stats: { intelligence: 50 } };
      let state = reducer(initialState, addCharacter({ character }));
      
      const startTime = performance.now();
      
      // Perform 10000 stat adjustments
      for (let i = 0; i < 10000; i++) {
        const action = adjustStat({ characterKey: 'char1', statKey: 'intelligence', amount: 1 });
        state = reducer(state, action);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(state.characters['char1'].stats.intelligence).toBe(10050);
      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
    });
  });
});