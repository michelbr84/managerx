#!/usr/bin/env tsx

import fs from 'fs/promises';
import path from 'path';
import { 
  validateDataset, 
  validateUniqueIds, 
  validateUniqueNamesPerLeague,
  validateAttributeRanges,
  validateSquadSizes,
  ValidationError,
  type Dataset,
  type Player,
  type Staff,
  type Club,
  type Fixture
} from '../schema.js';

interface ValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    leagues: number;
    clubs: number;
    players: number;
    staff: number;
    fixtures: number;
  };
}

async function loadDataset(): Promise<Dataset> {
  const dataDir = path.join(process.cwd(), 'packages/content/src/data');
  
  try {
    const datasetPath = path.join(dataDir, 'dataset.json');
    const datasetContent = await fs.readFile(datasetPath, 'utf-8');
    const dataset = JSON.parse(datasetContent);
    
    return validateDataset(dataset);
  } catch (error) {
    throw new Error(`Failed to load dataset: ${error}`);
  }
}

function validateBusinessRules(dataset: Dataset): ValidationResult {
  const result: ValidationResult = {
    passed: true,
    errors: [],
    warnings: [],
    stats: {
      leagues: dataset.leagues.length,
      clubs: dataset.clubs.length,
      players: dataset.players.length,
      staff: dataset.staff.length,
      fixtures: dataset.fixtures.length,
    }
  };

  try {
    // 1. Validate unique IDs
    console.log('🔍 Checking unique IDs...');
    validateUniqueIds(dataset.players, 'player');
    validateUniqueIds(dataset.staff, 'staff');
    validateUniqueIds(dataset.clubs, 'club');
    validateUniqueIds(dataset.fixtures, 'fixture');
    console.log('✅ All IDs are unique');

    // 2. Validate unique names per league
    console.log('🔍 Checking unique player names per league...');
    validateUniqueNamesPerLeague(dataset.players, dataset.clubs);
    console.log('✅ All player names are unique within each league');

    // 3. Validate attribute ranges and consistency
    console.log('🔍 Validating attribute ranges...');
    validateAttributeRanges(dataset.players);
    console.log('✅ All attribute ranges are valid');

    // 4. Validate squad sizes
    console.log('🔍 Validating squad sizes...');
    validateSquadSizes(dataset.players, dataset.clubs);
    console.log('✅ All squad sizes are within acceptable ranges');

    // 5. Additional business rule validations
    console.log('🔍 Checking additional business rules...');
    
    // Check league structure
    for (const league of dataset.leagues) {
      if (league.divisions.length !== 2) {
        result.errors.push(`League ${league.id} should have exactly 2 divisions, found ${league.divisions.length}`);
      }
      
      const d1 = league.divisions.find(d => d.level === 1);
      const d2 = league.divisions.find(d => d.level === 2);
      
      if (!d1 || !d2) {
        result.errors.push(`League ${league.id} missing D1 or D2 division`);
      } else {
        if (d1.teams !== 18) {
          result.warnings.push(`League ${league.id} D1 has ${d1.teams} teams, expected 18`);
        }
        if (d2.teams !== 16) {
          result.warnings.push(`League ${league.id} D2 has ${d2.teams} teams, expected 16`);
        }
      }
    }

    // Check club distribution
    const clubsByDivision = new Map<string, number>();
    for (const club of dataset.clubs) {
      const current = clubsByDivision.get(club.division) || 0;
      clubsByDivision.set(club.division, current + 1);
    }

    for (const league of dataset.leagues) {
      for (const division of league.divisions) {
        const actualTeams = clubsByDivision.get(division.name) || 0;
        if (actualTeams !== division.teams) {
          result.errors.push(`Division ${division.name} should have ${division.teams} teams, found ${actualTeams}`);
        }
      }
    }

    // Check player distribution by position
    const playersByPosition = new Map<string, number>();
    for (const player of dataset.players) {
      const current = playersByPosition.get(player.position) || 0;
      playersByPosition.set(player.position, current + 1);
    }

    const totalPlayers = dataset.players.length;
    const gkPercent = ((playersByPosition.get('GK') || 0) / totalPlayers) * 100;
    
    if (gkPercent < 10 || gkPercent > 15) {
      result.warnings.push(`Goalkeeper percentage is ${gkPercent.toFixed(1)}%, expected 10-15%`);
    }

    // Check contract expiry dates
    const contractIssues = dataset.players.filter(p => {
      const expiryYear = parseInt(p.contract.expires.split('-')[0]);
      return expiryYear < 2025 || expiryYear > 2028;
    });

    if (contractIssues.length > 0) {
      result.warnings.push(`${contractIssues.length} players have contract expiry dates outside 2025-2028 range`);
    }

    // Check age distributions
    const playerAges = dataset.players.map(p => p.age);
    const avgAge = playerAges.reduce((sum, age) => sum + age, 0) / playerAges.length;
    
    if (avgAge < 23 || avgAge > 28) {
      result.warnings.push(`Average player age is ${avgAge.toFixed(1)}, expected 23-28`);
    }

    // Check CA/PA distributions
    const caValues = dataset.players.map(p => p.ca);
    const avgCA = caValues.reduce((sum, ca) => sum + ca, 0) / caValues.length;
    
    if (avgCA < 80 || avgCA > 120) {
      result.warnings.push(`Average CA is ${avgCA.toFixed(1)}, expected 80-120`);
    }

    // Check fixture generation
    const fixturesByCompetition = new Map<string, number>();
    for (const fixture of dataset.fixtures) {
      const current = fixturesByCompetition.get(fixture.competition) || 0;
      fixturesByCompetition.set(fixture.competition, current + 1);
    }

    for (const league of dataset.leagues) {
      for (const division of league.divisions) {
        const expectedFixtures = division.teams * (division.teams - 1); // Double round-robin
        const actualFixtures = fixturesByCompetition.get(division.name) || 0;
        
        if (actualFixtures !== expectedFixtures) {
          result.errors.push(`Division ${division.name} should have ${expectedFixtures} fixtures, found ${actualFixtures}`);
        }
      }
    }

    console.log('✅ Business rules validation completed');

  } catch (error) {
    if (error instanceof ValidationError) {
      result.errors.push(error.message);
    } else {
      result.errors.push(`Validation error: ${error}`);
    }
  }

  result.passed = result.errors.length === 0;
  return result;
}

function printValidationSummary(result: ValidationResult): void {
  console.log('\n📊 Validation Summary:');
  console.log('='.repeat(50));
  
  console.log('\n📈 Dataset Statistics:');
  console.log(`- Leagues: ${result.stats.leagues}`);
  console.log(`- Clubs: ${result.stats.clubs}`);
  console.log(`- Players: ${result.stats.players}`);
  console.log(`- Staff: ${result.stats.staff}`);
  console.log(`- Fixtures: ${result.stats.fixtures}`);
  
  if (result.errors.length > 0) {
    console.log('\n❌ Validation Errors:');
    for (const error of result.errors) {
      console.log(`  • ${error}`);
    }
  }
  
  if (result.warnings.length > 0) {
    console.log('\n⚠️  Validation Warnings:');
    for (const warning of result.warnings) {
      console.log(`  • ${warning}`);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  
  if (result.passed) {
    console.log('🎉 Dataset validation PASSED!');
  } else {
    console.log('💥 Dataset validation FAILED!');
    console.log(`Found ${result.errors.length} error(s) and ${result.warnings.length} warning(s)`);
  }
}

async function validateContent(): Promise<void> {
  try {
    console.log('🚀 Starting ManagerX content validation...\n');
    
    // Load and validate dataset structure
    console.log('📁 Loading dataset...');
    const dataset = await loadDataset();
    console.log('✅ Dataset loaded and schema validation passed');
    
    // Run business rule validations
    const result = validateBusinessRules(dataset);
    
    // Print summary
    printValidationSummary(result);
    
    // Exit with appropriate code
    process.exit(result.passed ? 0 : 1);
    
  } catch (error) {
    console.error('\n💥 Fatal error during validation:');
    console.error(error);
    process.exit(1);
  }
}

// Additional utility functions for specific validations
export function validatePlayerAttributeAverages(players: Player[]): { [key: string]: number } {
  const attributeStats: { [key: string]: { sum: number; count: number } } = {};
  
  for (const player of players) {
    const attrs = player.attributes;
    for (const [key, value] of Object.entries(attrs)) {
      if (typeof value === 'number') {
        if (!attributeStats[key]) {
          attributeStats[key] = { sum: 0, count: 0 };
        }
        attributeStats[key].sum += value;
        attributeStats[key].count += 1;
      }
    }
  }
  
  const averages: { [key: string]: number } = {};
  for (const [key, stats] of Object.entries(attributeStats)) {
    averages[key] = stats.sum / stats.count;
  }
  
  return averages;
}

export function validateClubBudgetDistribution(clubs: Club[]): { [division: string]: { min: number; max: number; avg: number } } {
  const budgetsByDivision: { [division: string]: number[] } = {};
  
  for (const club of clubs) {
    if (!budgetsByDivision[club.division]) {
      budgetsByDivision[club.division] = [];
    }
    budgetsByDivision[club.division].push(club.budget);
  }
  
  const distribution: { [division: string]: { min: number; max: number; avg: number } } = {};
  
  for (const [division, budgets] of Object.entries(budgetsByDivision)) {
    distribution[division] = {
      min: Math.min(...budgets),
      max: Math.max(...budgets),
      avg: budgets.reduce((sum, b) => sum + b, 0) / budgets.length,
    };
  }
  
  return distribution;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  validateContent().catch(console.error);
}
