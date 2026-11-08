/**
 * Vocabulary and Editorial Review Type Definitions
 * 
 * Supports editorial certifications for AI-generated vocabulary and etymology data,
 * verifying accurate SAT/ACT definitions, morpheme decompositions, and contextual exemplars.
 */

export interface EditorialReview {
  verified: boolean;
  verifiedAt?: string; // ISO date string (e.g. "2026-11-02T14:28:16.000Z")
  verifiedBy?: string; // e.g. "Admin" or editor username/email
  notes?: string;       // Internal editorial notes (e.g. "Checked against Merriam-Webster / Latin etymology confirmed")
}

export type Connotation = 'positive' | 'negative' | 'neutral';

export interface VocabularyWord {
  id?: number;
  word: string;
  prefix?: string;
  suffix?: string;
  definition: string;
  sat_sentence: string;
  connotation?: Connotation | string;
  pronunciation?: string;
  part_of_speech?: string;
  root?: number;
  root_details?: RootSummary;
  review?: EditorialReview;
}

export type LearningPathway = 'thematic' | 'yield';

export type ThematicCluster =
  | 'Movement'
  | 'Communication'
  | 'Cognition'
  | 'Emotion'
  | 'Power & Conflict'
  | 'Law & Morality'
  | 'Form & Nature'
  | 'Quantity & Relation'
  | string;

export type SATTier =
  | 'Tier 1 High-Yield'
  | 'Tier 2 Multipliers'
  | 'Tier 3 Advanced'
  | string;

export interface RootSummary {
  id?: number;
  morpheme: string;
  language: 'Latin' | 'Greek' | string;
  core_meaning: string;
  mnemonic?: string;
  thematic_cluster?: ThematicCluster;
  sat_tier?: SATTier;
}

export interface Root extends RootSummary {
  words?: VocabularyWord[];
  total_words?: number;
}

export interface LexiconSeedEntry {
  root: {
    morpheme: string;
    language: string;
    core_meaning: string;
    mnemonic?: string;
    thematic_cluster?: ThematicCluster;
    sat_tier?: SATTier;
  };
  words: Array<{
    word: string;
    prefix?: string;
    suffix?: string;
    definition: string;
    sat_sentence: string;
    connotation?: string;
    review?: EditorialReview;
  }>;
}
