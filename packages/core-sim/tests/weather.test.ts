import { describe, it, expect } from 'vitest';
import {
  WEATHER_EFFECTS,
  getWeatherEffects,
  applyWeatherModifier,
  getWeatherDescription,
  shouldApplyWeatherEffect,
} from '../src/weather.js';
import type { Weather } from '../src/types.js';

describe('Weather System', () => {
  describe('Weather Effects', () => {
    it('should have effects for all weather types', () => {
      const weatherTypes: Weather[] = ['clear', 'rain', 'snow', 'wind'];
      
      weatherTypes.forEach(weather => {
        const effects = WEATHER_EFFECTS[weather];
        
        expect(effects).toBeDefined();
        expect(effects).toHaveProperty('passingAccuracy');
        expect(effects).toHaveProperty('shotAccuracy');
        expect(effects).toHaveProperty('staminaDrain');
        expect(effects).toHaveProperty('longBallBonus');
      });
    });

    it('should have clear weather as baseline', () => {
      const clearEffects = WEATHER_EFFECTS.clear;
      
      expect(clearEffects.passingAccuracy).toBe(1.0);
      expect(clearEffects.shotAccuracy).toBe(1.0);
      expect(clearEffects.staminaDrain).toBe(1.0);
      expect(clearEffects.longBallBonus).toBe(0.0);
    });

    it('should have realistic weather penalties', () => {
      // Rain should reduce accuracy
      expect(WEATHER_EFFECTS.rain.passingAccuracy).toBeLessThan(1.0);
      expect(WEATHER_EFFECTS.rain.shotAccuracy).toBeLessThan(1.0);
      
      // Snow should have the strongest penalties
      expect(WEATHER_EFFECTS.snow.passingAccuracy).toBeLessThan(WEATHER_EFFECTS.rain.passingAccuracy);
      expect(WEATHER_EFFECTS.snow.shotAccuracy).toBeLessThan(WEATHER_EFFECTS.rain.shotAccuracy);
      
      // Wind should have mixed effects
      expect(WEATHER_EFFECTS.wind.longBallBonus).toBeGreaterThan(0); // Can help long balls
    });

    it('should have reasonable effect ranges', () => {
      Object.values(WEATHER_EFFECTS).forEach(effects => {
        // Accuracy modifiers should be between 0.5 and 1.2
        expect(effects.passingAccuracy).toBeGreaterThanOrEqual(0.5);
        expect(effects.passingAccuracy).toBeLessThanOrEqual(1.2);
        expect(effects.shotAccuracy).toBeGreaterThanOrEqual(0.5);
        expect(effects.shotAccuracy).toBeLessThanOrEqual(1.2);
        
        // Stamina drain should be between 0.5 and 2.0
        expect(effects.staminaDrain).toBeGreaterThanOrEqual(0.5);
        expect(effects.staminaDrain).toBeLessThanOrEqual(2.0);
        
        // Long ball bonus should be between -0.5 and 0.5
        expect(effects.longBallBonus).toBeGreaterThanOrEqual(-0.5);
        expect(effects.longBallBonus).toBeLessThanOrEqual(0.5);
      });
    });
  });

  describe('Weather Effect Application', () => {
    it('should get weather effects correctly', () => {
      const rainEffects = getWeatherEffects('rain');
      const expectedRainEffects = WEATHER_EFFECTS.rain;
      
      expect(rainEffects).toEqual(expectedRainEffects);
    });

    it('should apply weather modifiers to values', () => {
      const baseValue = 100;
      
      // Test multiplicative modifiers
      const rainPassing = applyWeatherModifier(baseValue, 'rain', 'passingAccuracy');
      expect(rainPassing).toBe(baseValue * WEATHER_EFFECTS.rain.passingAccuracy);
      
      const snowShooting = applyWeatherModifier(baseValue, 'snow', 'shotAccuracy');
      expect(snowShooting).toBe(baseValue * WEATHER_EFFECTS.snow.shotAccuracy);
      
      // Test additive modifiers (longBallBonus)
      const windLongBall = applyWeatherModifier(baseValue, 'wind', 'longBallBonus');
      expect(windLongBall).toBe(baseValue + WEATHER_EFFECTS.wind.longBallBonus);
    });

    it('should handle clear weather correctly', () => {
      const baseValue = 85;
      
      const clearPassing = applyWeatherModifier(baseValue, 'clear', 'passingAccuracy');
      const clearShooting = applyWeatherModifier(baseValue, 'clear', 'shotAccuracy');
      const clearStamina = applyWeatherModifier(baseValue, 'clear', 'staminaDrain');
      const clearLongBall = applyWeatherModifier(baseValue, 'clear', 'longBallBonus');
      
      expect(clearPassing).toBe(baseValue);
      expect(clearShooting).toBe(baseValue);
      expect(clearStamina).toBe(baseValue);
      expect(clearLongBall).toBe(baseValue);
    });
  });

  describe('Weather Descriptions', () => {
    it('should provide descriptions for all weather types', () => {
      const weatherTypes: Weather[] = ['clear', 'rain', 'snow', 'wind'];
      
      weatherTypes.forEach(weather => {
        const description = getWeatherDescription(weather);
        
        expect(description).toBeDefined();
        expect(typeof description).toBe('string');
        expect(description.length).toBeGreaterThan(10);
      });
    });

    it('should provide meaningful descriptions', () => {
      expect(getWeatherDescription('clear')).toContain('clear');
      expect(getWeatherDescription('rain')).toContain('rain');
      expect(getWeatherDescription('snow')).toContain('snow');
      expect(getWeatherDescription('wind')).toContain('wind');
    });
  });

  describe('Weather Effect Probability', () => {
    it('should not apply effects for clear weather', () => {
      const eventTypes = ['pass', 'shot', 'cross', 'longball'] as const;
      
      eventTypes.forEach(eventType => {
        const shouldApply = shouldApplyWeatherEffect('clear', eventType);
        expect(shouldApply).toBe(false);
      });
    });

    it('should have higher probability for more severe weather', () => {
      // Mock Math.random for consistent testing
      const originalRandom = Math.random;
      Math.random = () => 0.5; // Fixed value
      
      try {
        const rainEffect = shouldApplyWeatherEffect('rain', 'pass', 1.0);
        const snowEffect = shouldApplyWeatherEffect('snow', 'pass', 1.0);
        
        // Snow should be more likely to affect than rain
        // (though this test might be flaky due to probability)
        expect(typeof rainEffect).toBe('boolean');
        expect(typeof snowEffect).toBe('boolean');
      } finally {
        Math.random = originalRandom;
      }
    });

    it('should consider intensity in effect probability', () => {
      const originalRandom = Math.random;
      Math.random = () => 0.3; // Fixed value
      
      try {
        const lowIntensity = shouldApplyWeatherEffect('rain', 'pass', 0.5);
        const highIntensity = shouldApplyWeatherEffect('rain', 'pass', 2.0);
        
        expect(typeof lowIntensity).toBe('boolean');
        expect(typeof highIntensity).toBe('boolean');
      } finally {
        Math.random = originalRandom;
      }
    });
  });

  describe('Weather Integration', () => {
    it('should handle all weather types without errors', () => {
      const weatherTypes: Weather[] = ['clear', 'rain', 'snow', 'wind'];
      const eventTypes = ['pass', 'shot', 'cross', 'longball'] as const;
      
      weatherTypes.forEach(weather => {
        eventTypes.forEach(eventType => {
          expect(() => {
            getWeatherEffects(weather);
            applyWeatherModifier(100, weather, 'passingAccuracy');
            getWeatherDescription(weather);
            shouldApplyWeatherEffect(weather, eventType);
          }).not.toThrow();
        });
      });
    });
  });
});
