# ManagerX Core Simulation Engine

> **Technical Documentation v0.1**  
> Sistema de simulação determinístico para ManagerX com IA moderna e nostalgia CM 01/02

## Visão Geral

O core de simulação do ManagerX é um motor determinístico baseado em eventos que simula partidas de futebol com alta fidelidade tática e estatística. Inspirado no Championship Manager 01/02, mas com sistemas modernos de xG, fadiga e IA.

### Características Principais

- **Determinismo Total**: Mesma seed → mesmos resultados
- **Performance**: ≤2ms/tick (90 min em fast-forward)
- **Profundidade Tática**: 3 formações, 5 dimensões táticas
- **Realismo Estatístico**: xG, posse, eventos balanceados
- **Golden Tests**: 10 partidas fixas para regressão

## Arquitetura

```
packages/core-sim/
├── src/
│   ├── index.ts          # API principal
│   ├── prng.ts           # PRNG determinístico (mulberry32)
│   ├── types.ts          # Tipos e interfaces
│   ├── tactics.ts        # Sistema tático
│   ├── weather.ts        # Efeitos climáticos
│   ├── engine.ts         # Motor de simulação
│   ├── sim.ts           # API de alto nível
│   └── golden-matches.ts # Testes golden
└── tests/
    └── sim.test.ts       # Suite de testes
```

## API Principal

### `simulateMatch(seed, homeTeamId, awayTeamId, tactics?, weather?)`

```typescript
const result = simulateMatch(
  42,                    // Seed determinística
  'home-team-id',        // ID do time da casa
  'away-team-id',        // ID do time visitante
  {                      // Táticas opcionais
    home: { formation: '4-3-3', mentality: 'attacking' },
    away: { formation: '4-4-2', mentality: 'defensive' }
  },
  'rain'                 // Condições climáticas
);

// Resultado
{
  homeScore: 2,
  awayScore: 1,
  stats: {
    possession: { home: 58, away: 42 },
    xG: { home: 1.8, away: 0.9 },
    shots: { home: 12, away: 7 },
    // ... mais estatísticas
  },
  events: [
    {
      minute: 23,
      type: 'goal',
      team: 'home',
      player: 'João Silva',
      description: 'GOAL! João Silva scores for Home FC',
      xG: 0.24
    }
    // ... mais eventos
  ],
  duration: 94  // Minutos totais incluindo acréscimos
}
```

## Sistema PRNG Determinístico

### Implementação

Utiliza **mulberry32** com seed via **xmur3** para garantir:

- Reprodutibilidade total com mesma seed
- Distribuição uniforme de qualidade
- Performance otimizada

```typescript
const prng = createPrng(42);
console.log(prng.next()); // Sempre 0.7233012201078236
console.log(prng.int(1, 20)); // Sempre 15
```

### Seeds Compostas

Seeds são combinadas para evitar colisões:

```typescript
const matchSeed = `match:${seed}:${homeTeamId}:${awayTeamId}`;
```

## Sistema Tático

### Formações Suportadas

| Formação | Ataque | Defesa | Meio | Largura | Pressing |
|----------|--------|--------|------|---------|----------|
| 4-4-2    | 0.0    | +0.1   | -0.05| 0.0     | 0.0      |
| 4-3-3    | +0.15  | -0.1   | +0.05| +0.1    | +0.1     |
| 3-5-2    | +0.05  | -0.05  | +0.15| -0.1    | +0.05    |

### Dimensões Táticas

1. **Mentalidade**: `defensive` | `balanced` | `attacking`
2. **Pressing**: `low` | `medium` | `high`
3. **Tempo**: `slow` | `medium` | `fast`
4. **Largura**: `narrow` | `normal` | `wide`
5. **Formação**: `4-4-2` | `4-3-3` | `3-5-2`

### Matchups Táticos

Sistema de counter-tactics baseado em vantagens:

- **4-3-3 vs 4-4-2**: +10% ataque (largura)
- **3-5-2 vs 4-4-2**: +8% meio-campo
- **High Press vs Slow Tempo**: +8% recuperação

## Motor de Eventos

### Tick System

- **90 minutos** = 360 ticks (4 ticks/minuto)
- **Cada tick** = 15 segundos de jogo
- **Probabilidade base** = 15% evento/tick

### Tipos de Eventos

```typescript
type EventType = 
  | 'goal'          // Gol marcado
  | 'shot'          // Finalização
  | 'chance'        // Oportunidade criada
  | 'yellow_card'   // Cartão amarelo
  | 'red_card'      // Cartão vermelho
  | 'injury'        // Lesão
  | 'substitution'  // Substituição
```

### Probabilidades Dinâmicas

Probabilidades ajustadas por:

- **Intensidade do jogo** (0-100)
- **Momentum** (-100 a +100)
- **Diferença de qualidade** entre times
- **Condições climáticas**
- **Minuto da partida**

## Sistema xG (Expected Goals)

### Cálculo Base

```typescript
let baseXG = 0.1; // 10% base

// Diferença de qualidade
const qualityDiff = (attackRating - defenseRating) / 100;
baseXG += qualityDiff * 0.05;

// Modificador tático
baseXG *= getTacticalXGModifier(team, shotType);

// Posição da finalização
baseXG *= positionMultiplier; // 0.8 a 1.2

// Momentum
baseXG += momentum * 0.001;

// Clima
baseXG *= weatherEffects.shotAccuracy;

// Vantagem de casa
if (home) baseXG *= 1.1;
```

### Distribuição Realística

- **xG médio**: 0.8-2.5 por time
- **Conversão**: ~12% finalizações → gol
- **No alvo**: ~40% das finalizações

## Stamina e Fadiga

### Sistema de Desgaste

```typescript
function calculateStaminaDrain(team, minute, intensity) {
  let drain = 1.0;
  
  // Formação (3-5-2 = +10% por wing-backs)
  drain *= formationMultiplier;
  
  // Pressing (high = +40%)
  drain *= pressingMultiplier;
  
  // Tempo (fast = +20%)
  drain *= tempoMultiplier;
  
  // Intensidade do jogo
  drain *= (0.5 + intensity/100 * 0.8);
  
  // Momento da partida
  if (minute > 75) drain *= 1.3;
  
  return drain;
}
```

### Efeitos da Fadiga

- **Stamina < 60**: -5% performance
- **Stamina < 30**: -15% performance
- **Stamina < 10**: Alto risco de lesão

## Condições Climáticas

### Efeitos por Clima

| Clima | Passe | Finalização | Stamina | Long Ball |
|-------|-------|-------------|---------|-----------|
| Clear | 100%  | 100%        | 100%    | 0%        |
| Rain  | 90%   | 85%         | 110%    | -10%      |
| Snow  | 80%   | 75%         | 125%    | -20%      |
| Wind  | 95%   | 90%         | 105%    | +15%      |

### Aplicação Dinâmica

Efeitos aplicados baseados em:
- Tipo de evento (passe, finalização, cruzamento)
- Intensidade da condição
- RNG para variabilidade

## Golden Match Tests

### Propósito

10 partidas determinísticas para validação de regressão:

1. **GM-001**: Times equilibrados (4-4-2 vs 4-4-2)
2. **GM-002**: Casa forte vs visitante fraco (chuva)
3. **GM-003**: Defensivo vs ofensivo (neve)
4. **GM-004**: Alta intensidade (vento)
5. **GM-005**: Batalha tática low-scoring
6. **GM-006**: Jogo amplo vs estreito
7. **GM-007**: Teste de stamina
8. **GM-008**: Diferença de qualidade extrema
9. **GM-009**: Counter-formação 3-5-2 vs 4-3-3
10. **GM-010**: Potencial drama tardio

### Ranges Esperados

Cada golden match define ranges aceitos:

```typescript
expectedRanges: {
  homeScore: [1, 4],      // Gols casa
  awayScore: [0, 2],      // Gols visitante  
  homeXG: [1.2, 3.5],     // xG casa
  awayXG: [0.3, 1.5],     // xG visitante
  homePossession: [55, 75], // Posse casa
  events: [10, 30]        // Total eventos
}
```

### Validação

```bash
pnpm test # Executa todos os golden tests
```

## Performance

### Benchmarks Alvo

- **≤2ms/tick**: Cada tick de 15 segundos
- **≤720ms/partida**: 90 minutos completos
- **≤100ms/partida**: Simulação otimizada

### Otimizações

1. **PRNG otimizado**: mulberry32 (mais rápido que Math.random)
2. **Event pooling**: Reutilização de objetos
3. **Lazy evaluation**: Cálculos sob demanda
4. **Bitwise operations**: Operações inteiras otimizadas

### Profiling

```typescript
const startTime = performance.now();
const result = simulateMatch(42, 'home', 'away');
const endTime = performance.now();
console.log(`Simulation time: ${endTime - startTime}ms`);
```

## Testes

### Cobertura

- **Determinismo**: Mesma seed → mesmos resultados
- **Performance**: Benchmarks de velocidade
- **Estatísticas**: Distribuições realísticas
- **Golden matches**: Regressão comportamental
- **Edge cases**: Condições extremas

### Executar Testes

```bash
# Todos os testes
pnpm -w test

# Apenas core-sim
pnpm -C packages/core-sim test

# Com coverage
pnpm -C packages/core-sim test --coverage
```

## Integração

### Com Content Package

```typescript
import { loadPlayers, loadClubs } from '@managerx/content';
import { simulateMatchWithTeams } from '@managerx/core-sim';

const homeTeam = await buildTeamFromContent('CLB-0001');
const awayTeam = await buildTeamFromContent('CLB-0002');

const result = simulateMatchWithTeams(42, homeTeam, awayTeam);
```

### Com UI Package

```typescript
import { MatchViewer } from '@managerx/ui';
import { simulateMatch } from '@managerx/core-sim';

const result = simulateMatch(42, 'home', 'away');
return <MatchViewer result={result} />;
```

## Extensibilidade

### Novos Tipos de Evento

```typescript
// Em engine.ts
case 'penalty':
  handlePenaltyEvent(state, context, prng);
  break;
```

### Novas Formações

```typescript
// Em tactics.ts
export const FORMATION_MODIFIERS = {
  // ... existentes
  '5-3-2': {
    attack: -0.1,
    defense: 0.2,
    midfield: -0.1,
    width: -0.15,
    pressing: -0.05,
  }
};
```

### Novos Modificadores Climáticos

```typescript
// Em weather.ts
export const WEATHER_EFFECTS = {
  // ... existentes
  'fog': {
    passingAccuracy: 0.85,
    shotAccuracy: 0.8,
    staminaDrain: 1.0,
    longBallBonus: -0.25,
  }
};
```

## Roadmap

### v0.2 (Próximas 4 semanas)
- [ ] Substituições automáticas baseadas em stamina
- [ ] Lesões com duração variável
- [ ] Bolas paradas (escanteios, faltas)
- [ ] Cartões vermelhos afetando formação

### v0.3 (8 semanas)
- [ ] Moral de equipe dinâmica
- [ ] Efeito multidão (home advantage variável)
- [ ] Rivalidades especiais
- [ ] Condições de campo (gramado ruim, etc.)

### v1.0 (12 semanas)
- [ ] AI tática reativa (mudanças automáticas)
- [ ] Histórico de confrontos
- [ ] Análise pós-jogo detalhada
- [ ] Integração completa com content package

## Contribuindo

### Adicionando Golden Matches

1. Criar cenário em `golden-matches.ts`
2. Definir ranges esperados baseados em simulações
3. Adicionar ao array `GOLDEN_MATCHES`
4. Validar com `pnpm test`

### Debugging

```typescript
// Ativar logs detalhados
process.env.SIM_DEBUG = 'true';

// Log de eventos específicos
const result = simulateMatch(42, 'home', 'away');
console.log('Events:', result.events.filter(e => e.type === 'goal'));
```

### Performance Profiling

```typescript
// Usar performance.mark para profiling detalhado
performance.mark('sim-start');
simulateMatch(42, 'home', 'away');
performance.mark('sim-end');
performance.measure('simulation', 'sim-start', 'sim-end');
```

---

**Documentação mantida por**: ManagerX AI Team  
**Última atualização**: 28/09/2024  
**Versão do engine**: 0.1.0
