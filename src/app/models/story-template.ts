export interface StoryTemplate {
  id: string;
  name: string;
  genre: string;
  description: string;
  targetAudience: string[];
  estimatedDuration: string; // "short", "medium", "long"
  themes: string[];
  milestones: StoryMilestone[];
  conflictTypes: ConflictScenario[];
}

export interface StoryMilestone {
  id: string;
  name: string;
  description: string;
  requiredStats?: { [statKey: string]: number };
  requiredRelationshipLevel?: number;
  rewards: {
    relationshipBonus?: number;
    statBonuses?: { [statKey: string]: number };
    unlockedActivities?: string[];
  };
}

export interface ConflictScenario {
  id: string;
  name: string;
  description: string;
  type: "personal-growth" | "friendship-challenge" | "academic" | "creative" | "adventure";
  resolutionOptions: ResolutionOption[];
}

export interface ResolutionOption {
  name: string;
  description: string;
  requiredStats?: { [statKey: string]: number };
  outcomes: {
    relationshipChange: number;
    statChanges?: { [statKey: string]: number };
    storyImpact: string;
  };
}