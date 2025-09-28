#!/usr/bin/env tsx

import fs from 'fs/promises';
import path from 'path';
import { 
  type Dataset, 
  type League, 
  type Club, 
  type Player, 
  type Staff, 
  type Fixture,
  type Season,
  type PlayerPosition,
  type Nationality,
  validateDataset 
} from '../schema.js';

// Seeded random number generator for reproducibility
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  choice<T>(array: T[]): T {
    return array[this.int(0, array.length - 1)];
  }

  shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.int(0, i);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  weighted<T>(items: Array<{ item: T; weight: number }>): T {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    let random = this.next() * totalWeight;
    
    for (const { item, weight } of items) {
      random -= weight;
      if (random <= 0) {
        return item;
      }
    }
    
    return items[items.length - 1].item;
  }
}

// Name generators with nationality-specific names
const FIRST_NAMES = {
  ALX: ['James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Thomas', 'Christopher', 'Daniel', 'Matthew', 'Anthony', 'Mark', 'Donald', 'Steven', 'Paul', 'Andrew', 'Joshua', 'Kenneth', 'Kevin'],
  LUX: ['João', 'José', 'António', 'Manuel', 'Carlos', 'Luís', 'Francisco', 'Miguel', 'Pedro', 'Paulo', 'Rui', 'Nuno', 'Bruno', 'Ricardo', 'Tiago', 'Hugo', 'André', 'Marco', 'Sérgio', 'Vítor'],
  CAL: ['Liam', 'Noah', 'Oliver', 'William', 'Elijah', 'James', 'Benjamin', 'Lucas', 'Mason', 'Ethan', 'Alexander', 'Henry', 'Jacob', 'Michael', 'Daniel', 'Logan', 'Jackson', 'Sebastian', 'Jack', 'Aiden'],
  IBE: ['Alejandro', 'Pablo', 'Manuel', 'Álvaro', 'Adrián', 'David', 'Daniel', 'Javier', 'Sergio', 'Carlos', 'Miguel', 'Rafael', 'Marcos', 'Jorge', 'Iván', 'Ángel', 'Diego', 'Luis', 'Rubén', 'Antonio'],
  ITA: ['Francesco', 'Alessandro', 'Lorenzo', 'Leonardo', 'Andrea', 'Mattia', 'Gabriele', 'Tommaso', 'Riccardo', 'Edoardo', 'Matteo matteo', 'Giuseppe', 'Antonio', 'Federico', 'Giovanni', 'Marco', 'Luca', 'Davide', 'Simone', 'Niccolò'],
  GER: ['Maximilian', 'Alexander', 'Paul', 'Elias', 'Ben', 'Noah', 'Louis', 'Leon', 'Felix', 'Jonas', 'Lucas', 'David', 'Tim', 'Moritz', 'Finn', 'Luca', 'Tobias', 'Julian', 'Niklas', 'Fabian']
};

const LAST_NAMES = {
  ALX: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'],
  LUX: ['Silva', 'Santos', 'Ferreira', 'Pereira', 'Oliveira', 'Costa', 'Rodrigues', 'Martins', 'Jesus', 'Sousa', 'Fernandes', 'Gonçalves', 'Gomes', 'Lopes', 'Marques', 'Alves', 'Almeida', 'Ribeiro', 'Guerreiro', 'Nunes'],
  CAL: ['MacDonald', 'Smith', 'Brown', 'Wilson', 'Campbell', 'Stewart', 'Thomson', 'Robertson', 'Anderson', 'MacLeod', 'Johnston', 'Murray', 'Clarke', 'Ross', 'Young', 'Mitchell', 'Watson', 'Morrison', 'Miller', 'Fraser'],
  IBE: ['García', 'Rodríguez', 'González', 'Fernández', 'López', 'Martínez', 'Sánchez', 'Pérez', 'Gómez', 'Martín', 'Jiménez', 'Ruiz', 'Hernández', 'Díaz', 'Moreno', 'Muñoz', 'Álvarez', 'Romero', 'Alonso', 'Gutiérrez'],
  ITA: ['Rossi', 'Russo', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco', 'Bruno', 'Gallo', 'Conti', 'De Luca', 'Costa', 'Giordano', 'Mancini', 'Rizzo', 'Lombardi', 'Moretti'],
  GER: ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Schulz', 'Hoffmann', 'Schäfer', 'Koch', 'Bauer', 'Richter', 'Klein', 'Wolf', 'Schröder', 'Neumann', 'Schwarz', 'Zimmermann']
};

// Club name components
const CLUB_PREFIXES = {
  ALX: ['', 'FC', 'AFC', 'United'],
  LUX: ['', 'FC', 'SC', 'CD'],
  CAL: ['', 'FC', 'AFC', 'Celtic'],
  IBE: ['', 'CF', 'CD', 'Real'],
  ITA: ['', 'FC', 'AC', 'AS'],
  GER: ['', 'FC', 'SC', 'SV']
};

const CLUB_SUFFIXES = {
  ALX: ['City', 'Town', 'United', 'Rovers', 'Athletic', 'Wanderers'],
  LUX: ['Porto', 'Lisboa', 'Braga', 'Coimbra', 'Setúbal', 'Guimarães'],
  CAL: ['City', 'United', 'Rangers', 'Thistle', 'Athletic', 'Rovers'],
  IBE: ['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Bilbao', 'Zaragoza'],
  ITA: ['Milano', 'Roma', 'Napoli', 'Torino', 'Genova', 'Bologna'],
  GER: ['München', 'Berlin', 'Hamburg', 'Köln', 'Frankfurt', 'Stuttgart']
};

// Position distributions by role
const POSITION_DISTRIBUTIONS: Record<string, { position: PlayerPosition; weight: number }[]> = {
  GK: [{ position: 'GK', weight: 100 }],
  Defence: [
    { position: 'DC', weight: 40 },
    { position: 'DL', weight: 15 },
    { position: 'DR', weight: 15 },
    { position: 'WBL', weight: 15 },
    { position: 'WBR', weight: 15 }
  ],
  Midfield: [
    { position: 'MC', weight: 30 },
    { position: 'ML', weight: 15 },
    { position: 'MR', weight: 15 },
    { position: 'AMC', weight: 20 },
    { position: 'AML', weight: 10 },
    { position: 'AMR', weight: 10 }
  ],
  Attack: [
    { position: 'ST', weight: 100 }
  ]
};

// Generate leagues
function generateLeagues(rng: SeededRandom): League[] {
  const nationalities: Nationality[] = ['ALX', 'LUX', 'CAL', 'IBE', 'ITA', 'GER'];
  const leagueNames = {
    ALX: 'AlbionX Premier League',
    LUX: 'LusitaniaX Liga',
    CAL: 'CaledoniaX Championship',
    IBE: 'IberiaX Primera',
    ITA: 'ItalicaX Serie A',
    GER: 'GermanicaX Bundesliga'
  };

  return nationalities.map((nat, index) => ({
    id: `LEA-${String.fromCharCode(65 + index)}` as `LEA-${string}`,
    name: leagueNames[nat],
    nationality: nat,
    divisions: [
      {
        name: `${nat}-D1`,
        level: 1,
        teams: 18,
        promotion: 0,
        relegation: 3,
        playoffs: 0,
      },
      {
        name: `${nat}-D2`,
        level: 2,
        teams: 16,
        promotion: 3,
        relegation: 0,
        playoffs: 4, // 4 teams compete for 1 promotion spot
      }
    ],
    cupName: `${nat} Cup`,
    foreignerRule: nat === 'ITA' ? {
      maxOnPitch: 5,
      division: 'D1' as const
    } : undefined,
  }));
}

// Generate clubs
function generateClubs(leagues: League[], rng: SeededRandom): Club[] {
  const clubs: Club[] = [];
  let clubIdCounter = 1;

  for (const league of leagues) {
    for (const division of league.divisions) {
      for (let i = 0; i < division.teams; i++) {
        const nationality = league.nationality;
        const prefix = rng.choice(CLUB_PREFIXES[nationality]);
        const suffix = rng.choice(CLUB_SUFFIXES[nationality]);
        const baseName = suffix;
        
        const fullName = prefix ? `${prefix} ${baseName}` : baseName;
        const shortName = prefix && prefix.length <= 3 ? `${prefix} ${baseName.substring(0, 3)}` : baseName.substring(0, 6);

        // Budget based on division (D1 clubs get more money)
        const baseBudget = division.level === 1 ? rng.int(8000000, 25000000) : rng.int(2000000, 8000000);
        
        clubs.push({
          id: `CLB-${clubIdCounter.toString().padStart(4, '0')}`,
          name: fullName,
          shortName,
          nationality,
          division: division.name,
          budget: baseBudget,
          reputation: division.level === 1 ? rng.int(60, 95) : rng.int(30, 75),
          stadium: {
            name: `${baseName} Stadium`,
            capacity: division.level === 1 ? rng.int(15000, 60000) : rng.int(5000, 25000),
          },
        });

        clubIdCounter++;
      }
    }
  }

  return clubs;
}

// Generate player attributes based on position and quality
function generatePlayerAttributes(position: PlayerPosition, ca: number, rng: SeededRandom) {
  // Base attributes for different positions
  const positionProfiles = {
    GK: {
      technical: ['handling', 'reflexes', 'aerialReach', 'oneOnOnes', 'kicking'],
      physical: ['agility', 'jumpingReach'],
      mental: ['decisions', 'anticipation', 'positioning', 'composure', 'determination']
    },
    DC: {
      technical: ['heading', 'tackling', 'passing'],
      physical: ['strength', 'jumpingReach', 'pace'],
      mental: ['decisions', 'anticipation', 'positioning', 'bravery', 'determination']
    },
    ST: {
      technical: ['finishing', 'firstTouch', 'technique'],
      physical: ['pace', 'acceleration', 'strength'],
      mental: ['decisions', 'anticipation', 'offTheBall', 'composure', 'determination']
    }
    // Add more position profiles as needed
  };

  // Start with base attributes around CA level
  const baseLevel = Math.floor(ca / 10); // CA 100 = ~level 10 attributes
  const variance = 3;

  const attributes: any = {};
  
  // Generate all technical attributes
  const technicalAttrs = ['finishing', 'firstTouch', 'dribbling', 'technique', 'crossing', 'passing', 'heading', 'tackling'];
  for (const attr of technicalAttrs) {
    attributes[attr] = Math.max(1, Math.min(20, baseLevel + rng.int(-variance, variance)));
  }

  // Generate all physical attributes  
  const physicalAttrs = ['pace', 'acceleration', 'agility', 'balance', 'strength', 'stamina', 'jumpingReach'];
  for (const attr of physicalAttrs) {
    attributes[attr] = Math.max(1, Math.min(20, baseLevel + rng.int(-variance, variance)));
  }

  // Generate all mental attributes
  const mentalAttrs = ['decisions', 'anticipation', 'positioning', 'offTheBall', 'vision', 'workRate', 'bravery', 'composure', 'determination'];
  for (const attr of mentalAttrs) {
    attributes[attr] = Math.max(1, Math.min(20, baseLevel + rng.int(-variance, variance)));
  }

  // Add goalkeeper-specific attributes if needed
  if (position === 'GK') {
    const gkAttrs = ['handling', 'reflexes', 'aerialReach', 'oneOnOnes', 'kicking'];
    for (const attr of gkAttrs) {
      attributes[attr] = Math.max(1, Math.min(20, baseLevel + rng.int(-variance, variance)));
    }
  }

  return attributes;
}

// Generate players
function generatePlayers(clubs: Club[], rng: SeededRandom): Player[] {
  const players: Player[] = [];
  let playerIdCounter = 1;

  for (const club of clubs) {
    const squadSize = rng.int(22, 30);
    const isD1 = club.division.includes('D1');
    
    // Squad composition
    const goalkeepers = 3;
    const defenders = Math.floor(squadSize * 0.35);
    const midfielders = Math.floor(squadSize * 0.4);
    const attackers = squadSize - goalkeepers - defenders - midfielders;

    let playersGenerated = 0;

    // Generate goalkeepers
    for (let i = 0; i < goalkeepers; i++) {
      const age = rng.int(18, 35);
      const ca = isD1 ? rng.int(80, 160) : rng.int(60, 120);
      const pa = Math.max(ca, ca + rng.int(-10, 40));
      
      const firstName = rng.choice(FIRST_NAMES[club.nationality]);
      const lastName = rng.choice(LAST_NAMES[club.nationality]);
      
      players.push({
        id: `PLY-${playerIdCounter.toString().padStart(6, '0')}`,
        clubId: club.id,
        name: `${firstName} ${lastName}`,
        age,
        nationality: club.nationality,
        position: 'GK',
        foot: rng.choice(['L', 'R', 'Both'] as const),
        attributes: generatePlayerAttributes('GK', ca, rng),
        ca,
        pa,
        morale: rng.int(60, 85),
        condition: rng.int(85, 100),
        contract: {
          wage: Math.floor((ca * 50) + rng.int(-500, 500)),
          expires: `202${rng.int(5, 8)}-06-30`,
          releaseClause: ca > 120 ? ca * 150000 : undefined,
        },
      });
      
      playerIdCounter++;
      playersGenerated++;
    }

    // Generate defenders
    for (let i = 0; i < defenders; i++) {
      const position = rng.weighted(POSITION_DISTRIBUTIONS.Defence);
      const age = rng.int(18, 34);
      const ca = isD1 ? rng.int(70, 150) : rng.int(50, 110);
      const pa = Math.max(ca, ca + rng.int(-10, 40));
      
      const firstName = rng.choice(FIRST_NAMES[club.nationality]);
      const lastName = rng.choice(LAST_NAMES[club.nationality]);
      
      players.push({
        id: `PLY-${playerIdCounter.toString().padStart(6, '0')}`,
        clubId: club.id,
        name: `${firstName} ${lastName}`,
        age,
        nationality: club.nationality,
        position,
        foot: rng.choice(['L', 'R', 'Both'] as const),
        attributes: generatePlayerAttributes(position, ca, rng),
        ca,
        pa,
        morale: rng.int(60, 85),
        condition: rng.int(85, 100),
        contract: {
          wage: Math.floor((ca * 50) + rng.int(-500, 500)),
          expires: `202${rng.int(5, 8)}-06-30`,
          releaseClause: ca > 120 ? ca * 150000 : undefined,
        },
      });
      
      playerIdCounter++;
      playersGenerated++;
    }

    // Generate midfielders
    for (let i = 0; i < midfielders; i++) {
      const position = rng.weighted(POSITION_DISTRIBUTIONS.Midfield);
      const age = rng.int(18, 33);
      const ca = isD1 ? rng.int(75, 155) : rng.int(55, 115);
      const pa = Math.max(ca, ca + rng.int(-10, 40));
      
      const firstName = rng.choice(FIRST_NAMES[club.nationality]);
      const lastName = rng.choice(LAST_NAMES[club.nationality]);
      
      players.push({
        id: `PLY-${playerIdCounter.toString().padStart(6, '0')}`,
        clubId: club.id,
        name: `${firstName} ${lastName}`,
        age,
        nationality: club.nationality,
        position,
        foot: rng.choice(['L', 'R', 'Both'] as const),
        attributes: generatePlayerAttributes(position, ca, rng),
        ca,
        pa,
        morale: rng.int(60, 85),
        condition: rng.int(85, 100),
        contract: {
          wage: Math.floor((ca * 50) + rng.int(-500, 500)),
          expires: `202${rng.int(5, 8)}-06-30`,
          releaseClause: ca > 120 ? ca * 150000 : undefined,
        },
      });
      
      playerIdCounter++;
      playersGenerated++;
    }

    // Generate attackers
    for (let i = 0; i < attackers; i++) {
      const position = rng.weighted(POSITION_DISTRIBUTIONS.Attack);
      const age = rng.int(18, 32);
      const ca = isD1 ? rng.int(80, 160) : rng.int(60, 120);
      const pa = Math.max(ca, ca + rng.int(-10, 40));
      
      const firstName = rng.choice(FIRST_NAMES[club.nationality]);
      const lastName = rng.choice(LAST_NAMES[club.nationality]);
      
      players.push({
        id: `PLY-${playerIdCounter.toString().padStart(6, '0')}`,
        clubId: club.id,
        name: `${firstName} ${lastName}`,
        age,
        nationality: club.nationality,
        position,
        foot: rng.choice(['L', 'R', 'Both'] as const),
        attributes: generatePlayerAttributes(position, ca, rng),
        ca,
        pa,
        morale: rng.int(60, 85),
        condition: rng.int(85, 100),
        contract: {
          wage: Math.floor((ca * 50) + rng.int(-500, 500)),
          expires: `202${rng.int(5, 8)}-06-30`,
          releaseClause: ca > 120 ? ca * 150000 : undefined,
        },
      });
      
      playerIdCounter++;
      playersGenerated++;
    }
  }

  return players;
}

// Generate staff
function generateStaff(clubs: Club[], rng: SeededRandom): Staff[] {
  const staff: Staff[] = [];
  let staffIdCounter = 1;

  const roles = [
    'Manager',
    'Assistant Manager', 
    'First Team Coach',
    'Goalkeeping Coach',
    'Fitness Coach',
    'Chief Scout',
    'Scout'
  ];

  for (const club of clubs) {
    const staffCount = rng.int(5, 8);
    
    for (let i = 0; i < staffCount; i++) {
      const role = rng.choice(roles);
      const age = rng.int(30, 65);
      const isD1 = club.division.includes('D1');
      
      // Staff quality based on division
      const baseQuality = isD1 ? rng.int(10, 18) : rng.int(8, 15);
      
      const firstName = rng.choice(FIRST_NAMES[club.nationality]);
      const lastName = rng.choice(LAST_NAMES[club.nationality]);
      
      staff.push({
        id: `STF-${staffIdCounter.toString().padStart(4, '0')}`,
        clubId: club.id,
        name: `${firstName} ${lastName}`,
        age,
        nationality: club.nationality,
        role: role as any,
        attributes: {
          tacticalKnowledge: Math.max(1, Math.min(20, baseQuality + rng.int(-2, 2))),
          trainingAttack: Math.max(1, Math.min(20, baseQuality + rng.int(-2, 2))),
          trainingDefense: Math.max(1, Math.min(20, baseQuality + rng.int(-2, 2))),
          setPieces: Math.max(1, Math.min(20, baseQuality + rng.int(-2, 2))),
          manManagement: Math.max(1, Math.min(20, baseQuality + rng.int(-2, 2))),
          motivation: Math.max(1, Math.min(20, baseQuality + rng.int(-2, 2))),
          discipline: Math.max(1, Math.min(20, baseQuality + rng.int(-2, 2))),
          adaptability: Math.max(1, Math.min(20, baseQuality + rng.int(-2, 2))),
          judgingAbility: Math.max(1, Math.min(20, baseQuality + rng.int(-2, 2))),
          judgingPotential: Math.max(1, Math.min(20, baseQuality + rng.int(-2, 2))),
          negotiating: Math.max(1, Math.min(20, baseQuality + rng.int(-2, 2))),
        },
        contract: {
          wage: rng.int(3000, 15000),
          expires: `202${rng.int(5, 7)}-06-30`,
        },
      });
      
      staffIdCounter++;
    }
  }

  return staff;
}

// Generate fixtures for a season
function generateFixtures(leagues: League[], clubs: Club[], rng: SeededRandom): Fixture[] {
  const fixtures: Fixture[] = [];
  let fixtureIdCounter = 1;
  
  const season = 2025;
  const seasonStart = new Date(2024, 7, 1); // August 1st, 2024
  
  for (const league of leagues) {
    for (const division of league.divisions) {
      const divisionClubs = clubs.filter(c => c.division === division.name);
      
      // Generate league fixtures (double round-robin)
      for (let round = 0; round < 2; round++) { // Home and away
        const shuffledClubs = round === 0 ? divisionClubs : rng.shuffle([...divisionClubs]);
        
        for (let week = 0; week < divisionClubs.length - 1; week++) {
          const weekDate = new Date(seasonStart);
          weekDate.setDate(weekDate.getDate() + (week * 7) + (round * divisionClubs.length * 7));
          
          for (let match = 0; match < divisionClubs.length / 2; match++) {
            const homeIndex = match;
            const awayIndex = divisionClubs.length - 1 - match;
            
            const homeClub = shuffledClubs[homeIndex];
            const awayClub = shuffledClubs[awayIndex];
            
            if (homeClub && awayClub) {
              fixtures.push({
                id: `FX-${fixtureIdCounter.toString().padStart(6, '0')}`,
                season,
                competition: division.name,
                round: (round * (divisionClubs.length - 1)) + week + 1,
                date: weekDate.toISOString().split('T')[0],
                homeClubId: homeClub.id,
                awayClubId: awayClub.id,
                played: false,
              });
              
              fixtureIdCounter++;
            }
          }
          
          // Rotate clubs for next week
          if (week < divisionClubs.length - 2) {
            const last = shuffledClubs.pop()!;
            shuffledClubs.splice(1, 0, last);
          }
        }
      }
    }
  }
  
  return fixtures;
}

// Main generation function
async function generateDataset(): Promise<void> {
  const GOLDEN_SEED = 42; // Fixed seed for reproducibility
  const rng = new SeededRandom(GOLDEN_SEED);
  
  console.log('🎲 Generating ManagerX dataset with seed:', GOLDEN_SEED);
  
  // Generate data
  const leagues = generateLeagues(rng);
  console.log('✅ Generated', leagues.length, 'leagues');
  
  const clubs = generateClubs(leagues, rng);
  console.log('✅ Generated', clubs.length, 'clubs');
  
  const players = generatePlayers(clubs, rng);
  console.log('✅ Generated', players.length, 'players');
  
  const staff = generateStaff(clubs, rng);
  console.log('✅ Generated', staff.length, 'staff members');
  
  const fixtures = generateFixtures(leagues, clubs, rng);
  console.log('✅ Generated', fixtures.length, 'fixtures');
  
  const season: Season = {
    year: 2025,
    startDate: '2024-08-01',
    endDate: '2025-05-31',
    transferWindows: [
      {
        name: 'Summer',
        startDate: '2024-06-01',
        endDate: '2024-08-31',
      },
      {
        name: 'Winter',
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      }
    ],
  };
  
  // Create dataset
  const dataset: Dataset = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    seed: GOLDEN_SEED,
    leagues,
    clubs,
    players,
    staff,
    fixtures,
    season,
  };
  
  // Validate dataset
  console.log('🔍 Validating dataset...');
  try {
    validateDataset(dataset);
    console.log('✅ Dataset validation passed');
  } catch (error) {
    console.error('❌ Dataset validation failed:', error);
    process.exit(1);
  }
  
  // Save individual data files
  const dataDir = path.join(process.cwd(), 'packages/content/src/data');
  
  await fs.writeFile(
    path.join(dataDir, 'leagues.json'),
    JSON.stringify(leagues, null, 2)
  );
  
  await fs.writeFile(
    path.join(dataDir, 'clubs.json'),
    JSON.stringify(clubs, null, 2)
  );
  
  await fs.writeFile(
    path.join(dataDir, 'players.json'),
    JSON.stringify(players, null, 2)
  );
  
  await fs.writeFile(
    path.join(dataDir, 'staff.json'),
    JSON.stringify(staff, null, 2)
  );
  
  await fs.writeFile(
    path.join(dataDir, 'fixtures.json'),
    JSON.stringify(fixtures, null, 2)
  );
  
  await fs.writeFile(
    path.join(dataDir, 'season.json'),
    JSON.stringify(season, null, 2)
  );
  
  // Save complete dataset
  await fs.writeFile(
    path.join(dataDir, 'dataset.json'),
    JSON.stringify(dataset, null, 2)
  );
  
  console.log('💾 Saved data files to packages/content/src/data/');
  
  // Print summary statistics
  console.log('\n📊 Dataset Summary:');
  console.log(`- ${leagues.length} leagues`);
  console.log(`- ${clubs.length} clubs (${clubs.filter(c => c.division.includes('D1')).length} D1, ${clubs.filter(c => c.division.includes('D2')).length} D2)`);
  console.log(`- ${players.length} players`);
  console.log(`- ${staff.length} staff members`);
  console.log(`- ${fixtures.length} fixtures`);
  
  // Validate unique names per league
  const playersByNationality = new Map<string, Player[]>();
  for (const player of players) {
    if (!playersByNationality.has(player.nationality)) {
      playersByNationality.set(player.nationality, []);
    }
    playersByNationality.get(player.nationality)!.push(player);
  }
  
  for (const [nationality, playersInLeague] of playersByNationality) {
    const uniqueNames = new Set(playersInLeague.map(p => p.name));
    console.log(`- ${nationality}: ${playersInLeague.length} players, ${uniqueNames.size} unique names`);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateDataset().catch(console.error);
}
