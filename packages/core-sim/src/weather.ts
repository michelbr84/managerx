// Weather system implementation

import type { Weather, WeatherEffects } from './types.js';

/**
 * Weather effects on match simulation
 */
export const WEATHER_EFFECTS: Record<Weather, WeatherEffects> = {
  clear: {
    passingAccuracy: 1.0,
    shotAccuracy: 1.0,
    staminaDrain: 1.0,
    longBallBonus: 0.0,
  },
  rain: {
    passingAccuracy: 0.9, // Slippery ball affects short passing
    shotAccuracy: 0.85, // Harder to control shots
    staminaDrain: 1.1, // Slightly more tiring
    longBallBonus: -0.1, // Long balls less effective
  },
  snow: {
    passingAccuracy: 0.8, // Significant impact on ball control
    shotAccuracy: 0.75, // Major impact on shooting
    staminaDrain: 1.25, // Much more tiring
    longBallBonus: -0.2, // Long balls very difficult
  },
  wind: {
    passingAccuracy: 0.95, // Slight impact on passing
    shotAccuracy: 0.9, // Affects shot trajectory
    staminaDrain: 1.05, // Slightly more tiring
    longBallBonus: 0.15, // Can help with long balls if used correctly
  },
};

/**
 * Get weather effects for simulation
 */
export function getWeatherEffects(weather: Weather): WeatherEffects {
  return WEATHER_EFFECTS[weather];
}

/**
 * Apply weather modifier to a base value
 */
export function applyWeatherModifier(
  baseValue: number,
  weather: Weather,
  effectType: keyof WeatherEffects
): number {
  const effects = getWeatherEffects(weather);
  const modifier = effects[effectType];
  
  if (effectType === 'longBallBonus') {
    return baseValue + modifier;
  } else {
    return baseValue * modifier;
  }
}

/**
 * Get weather description for match reports
 */
export function getWeatherDescription(weather: Weather): string {
  const descriptions = {
    clear: 'Perfect playing conditions with clear skies',
    rain: 'Light rain making the pitch slippery',
    snow: 'Heavy snow affecting visibility and ball control',
    wind: 'Strong winds affecting long passes and shots',
  };
  
  return descriptions[weather];
}

/**
 * Determine if weather should affect a specific event type
 */
export function shouldApplyWeatherEffect(
  weather: Weather,
  eventType: 'pass' | 'shot' | 'cross' | 'longball',
  intensity: number = 1.0
): boolean {
  if (weather === 'clear') return false;
  
  const thresholds = {
    rain: { pass: 0.3, shot: 0.4, cross: 0.2, longball: 0.5 },
    snow: { pass: 0.6, shot: 0.7, cross: 0.5, longball: 0.8 },
    wind: { pass: 0.2, shot: 0.3, cross: 0.1, longball: 0.1 }, // Wind can help longballs
  };
  
  const threshold = thresholds[weather]?.[eventType] || 0;
  return Math.random() * intensity < threshold;
}
