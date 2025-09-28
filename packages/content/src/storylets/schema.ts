// Narrative storylets system - Schema and types

import { z } from 'zod';

// Condition types for storylet triggers
export const ConditionSchema = z.object({
  type: z.enum([
    'player_form',      // Player form/morale conditions
    'team_performance', // Team results/position
    'financial',        // Budget/wage constraints
    'calendar',         // Time-based conditions
    'random',           // Pure RNG events
    'rivalry',          // Club relationships
    'injury',           // Player health status
    'contract',         // Contract negotiations
    'board_pressure',   // Board expectations
    'media',            // Press/fan reactions
  ]),
  target: z.string().optional(), // Player ID, club ID, etc.
  operator: z.enum(['>', '<', '>=', '<=', '==', '!=', 'contains', 'between']),
  value: z.union([z.string(), z.number(), z.array(z.union([z.string(), z.number()]))]),
  weight: z.number().min(0).max(1).default(1), // Probability multiplier
});

// Storylet outcome effects
export const EffectSchema = z.object({
  type: z.enum([
    'morale_change',    // Player/team morale
    'reputation',       // Club reputation
    'finance',          // Budget changes
    'injury',           // Player injuries
    'form_change',      // Player form
    'board_confidence', // Board relationship
    'media_attention',  // Press coverage
    'fan_loyalty',      // Supporter happiness
    'player_development', // Attribute changes
    'staff_loyalty',    // Staff relationships
  ]),
  target: z.string().optional(), // Who/what is affected
  value: z.number(), // Effect magnitude
  duration: z.number().optional(), // Effect duration in days
  description: z.string(), // Human-readable effect
});

// Player choice in storylets
export const ChoiceSchema = z.object({
  id: z.string(),
  text: z.string(), // Choice text shown to player
  effects: z.array(EffectSchema), // What happens if chosen
  requirements: z.array(ConditionSchema).optional(), // Prerequisites for this choice
  weight: z.number().min(0).max(1).default(1), // AI recommendation weight
});

// Main storylet definition
export const StoryletSchema = z.object({
  id: z.string().regex(/^ST-\d{4}$/), // ST-0001 format
  title: z.string().min(1).max(100),
  category: z.enum([
    'player_news',     // Player-related events
    'club_news',       // Club-related events
    'transfer_news',   // Transfer market
    'match_events',    // Match-related storylets
    'season_events',   // Season milestones
    'random_events',   // Random occurrences
    'crisis_events',   // Crisis management
    'success_events',  // Success celebrations
  ]),
  content: z.string().min(10).max(1000), // Main storylet text
  conditions: z.array(ConditionSchema), // When this can trigger
  choices: z.array(ChoiceSchema).min(1).max(5), // Player options
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  cooldown: z.number().min(0).default(0), // Days before can trigger again
  maxOccurrences: z.number().min(1).default(1), // Max times per save
  tags: z.array(z.string()).default([]), // For filtering/organization
});

// Storylet instance (when triggered)
export const StoryletInstanceSchema = z.object({
  id: z.string(),
  storyletId: z.string(),
  triggeredAt: z.string(), // ISO date
  gameDate: z.string(), // In-game date
  seed: z.number(), // For reproducibility
  context: z.record(z.any()), // Game state when triggered
  resolved: z.boolean().default(false),
  choiceSelected: z.string().optional(),
  effects: z.array(EffectSchema).optional(),
});

// Narrative state tracking
export const NarrativeStateSchema = z.object({
  activeStorylets: z.array(StoryletInstanceSchema),
  completedStorylets: z.array(z.string()), // IDs of completed storylets
  lastTriggered: z.record(z.string()), // storyletId -> last trigger date
  occurrenceCount: z.record(z.number()), // storyletId -> count
  playerChoiceHistory: z.array(z.object({
    storyletId: z.string(),
    choiceId: z.string(),
    timestamp: z.string(),
  })),
  narrativeSeed: z.number(), // Master seed for narrative RNG
});

// Export types
export type Condition = z.infer<typeof ConditionSchema>;
export type Effect = z.infer<typeof EffectSchema>;
export type Choice = z.infer<typeof ChoiceSchema>;
export type Storylet = z.infer<typeof StoryletSchema>;
export type StoryletInstance = z.infer<typeof StoryletInstanceSchema>;
export type NarrativeState = z.infer<typeof NarrativeStateSchema>;

// Validation utilities
export class NarrativeError extends Error {
  constructor(message: string, public storyletId?: string) {
    super(message);
    this.name = 'NarrativeError';
  }
}

export function validateStorylet(data: unknown): Storylet {
  const result = StoryletSchema.safeParse(data);
  if (!result.success) {
    throw new NarrativeError('Storylet validation failed', result.error.issues[0]?.path?.[0] as string);
  }
  return result.data;
}

export function validateNarrativeState(data: unknown): NarrativeState {
  const result = NarrativeStateSchema.safeParse(data);
  if (!result.success) {
    throw new NarrativeError('Narrative state validation failed');
  }
  return result.data;
}
