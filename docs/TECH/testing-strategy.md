# ManagerX Testing Strategy

> **QA Documentation v1.0**  
> Estratégia abrangente de testes para garantir qualidade e estabilidade

## Visão Geral

O ManagerX implementa uma estratégia de testes em múltiplas camadas para garantir qualidade, performance e estabilidade em todos os componentes do sistema.

### Objetivos de Cobertura

- **≥80% cobertura geral** em todos os packages
- **≥85% cobertura** em `packages/core-sim` (crítico)
- **≥80% cobertura** em `packages/content` (validadores)
- **E2E coverage** dos fluxos principais
- **Performance benchmarks** automatizados

## Arquitetura de Testes

```
├── packages/*/tests/           # Unit tests por package
├── tests/e2e/                  # E2E tests com Playwright
├── vitest.config.ts           # Configuração global de testes
├── playwright.config.ts       # Configuração E2E
└── .github/workflows/         # CI/CD pipelines
```

## Unit Testing (Vitest)

### Core Simulation (`packages/core-sim`)

**Cobertura Atual: ≥85%**

#### Arquivos de Teste:
- `sim.test.ts` - API principal e golden matches
- `tactics.test.ts` - Sistema tático completo
- `weather.test.ts` - Efeitos climáticos
- `engine.test.ts` - Motor de simulação
- `prng.test.ts` - Gerador de números pseudo-aleatórios

#### Cenários Cobertos:
- ✅ **Determinismo**: Mesma seed → mesmos resultados
- ✅ **Performance**: ≤2ms/tick, ≤100ms/partida
- ✅ **Golden Matches**: 10 partidas de regressão
- ✅ **Formações**: 4-4-2, 4-3-3, 3-5-2
- ✅ **Condições Climáticas**: Clear, rain, snow, wind
- ✅ **Distribuições Estatísticas**: xG, posse, eventos
- ✅ **Edge Cases**: Times extremos, listas vazias

### Content Validation (`packages/content`)

**Cobertura Atual: ≥80%**

#### Arquivos de Teste:
- `content.test.ts` - Validação de esquemas
- `schema-validation.test.ts` - Validadores Zod
- `data-generation.test.ts` - Qualidade dos dados

#### Cenários Cobertos:
- ✅ **Schema Validation**: Zod schemas completos
- ✅ **Business Rules**: IDs únicos, nomes por liga
- ✅ **Attribute Ranges**: 1-20, CA/PA consistency
- ✅ **Squad Sizes**: 20-35 jogadores, 2-4 goleiros
- ✅ **Data Quality**: Distribuições realísticas
- ✅ **Golden Seed**: Reprodutibilidade (seed 42)

### UI Components (`packages/ui`)

#### Cenários Cobertos:
- ✅ **Component Rendering**: Storybook stories
- ✅ **Props Validation**: TypeScript + runtime
- ✅ **Accessibility**: Keyboard navigation
- ✅ **Responsive Design**: Multiple viewports

## E2E Testing (Playwright)

### Configuração

```typescript
// playwright.config.ts
{
  testDir: './tests/e2e',
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  use: {
    baseURL: 'http://localhost:1420', // Tauri dev server
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'pnpm -C apps/desktop dev',
    url: 'http://localhost:1420',
    reuseExistingServer: !process.env.CI,
  },
}
```

### Fluxos Principais Testados

#### 1. New Game Flow (`new-game-flow.spec.ts`)
- ✅ **Wizard Completo**: Manager → Liga → Clube
- ✅ **Validação de Campos**: Campos obrigatórios
- ✅ **Busca e Filtros**: Filtro de clubes
- ✅ **Reputação Visual**: Stars de reputação

#### 2. Simulation Flow (`simulation-flow.spec.ts`)
- ✅ **Primeira Partida**: Simulação completa
- ✅ **Controles de Velocidade**: 1x, 2x, 4x, 8x
- ✅ **Eventos em Tempo Real**: Log de eventos
- ✅ **Estatísticas Realísticas**: Posse, xG, finalizações

#### 3. Save/Load Flow (`save-load-flow.spec.ts`)
- ✅ **Criação de Save**: Persistência de estado
- ✅ **Carregamento**: Restauração de estado
- ✅ **Auto-save**: Save automático a cada 5min
- ✅ **Preservação de Estado**: Táticas, configurações

#### 4. Navigation Flow (`navigation-flow.spec.ts`)
- ✅ **Navegação por Sidebar**: Todos os screens
- ✅ **Keyboard Shortcuts**: C, E, T, I, S, Esc, Ctrl+S
- ✅ **Assistant Toggle**: Abrir/fechar sidebar
- ✅ **Tooltips**: Hover states
- ✅ **Estado Durante Simulação**: Navegação não-bloqueante

#### 5. UI Responsiveness (`ui-responsiveness.spec.ts`)
- ✅ **Load Performance**: <2s por screen
- ✅ **Large Data Handling**: Listas grandes
- ✅ **Tactical Field**: Rendering suave
- ✅ **Non-blocking Simulation**: UI responsiva
- ✅ **Window Resizing**: Responsive design
- ✅ **Rapid Interactions**: Stress testing

### Test Utilities (`test-utils.ts`)

Helpers para E2E tests:
- `createNewGame()` - Setup rápido de jogo
- `navigateToScreen()` - Navegação consistente
- `saveGame()` - Save com verificação
- `waitForMatchCompletion()` - Aguardar simulação
- `verifyScreenResponsiveness()` - Teste de responsividade
- `measurePageLoadPerformance()` - Métricas de performance

## CI/CD Pipeline

### GitHub Actions (`test-coverage.yml`)

#### Job 1: Unit Tests
```yaml
- Run type checking
- Run linting  
- Run unit tests with coverage
- Upload coverage to Codecov
- Generate coverage report
- Check coverage thresholds (≥80%)
```

#### Job 2: E2E Tests
```yaml
- Build packages
- Install Playwright browsers
- Run E2E tests
- Upload test artifacts
- Generate E2E report
```

#### Job 3: Flake Detection
```yaml
- Run tests 3 times
- Detect inconsistent results
- Report flaky tests
- Block merge if flakes detected
```

#### Job 4: Performance Benchmarks
```yaml
- Run performance tests
- Extract timing metrics
- Report performance regressions
```

### Coverage Thresholds

```typescript
// vitest.config.ts
coverage: {
  thresholds: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    'packages/core-sim/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    'packages/content/': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
}
```

## Retry e Flake Detection

### Estratégias Implementadas

1. **Vitest Retries**: 3x em CI, 1x local
2. **Playwright Retries**: 2x em CI, 0x local
3. **Custom Retry Logic**: Para operações flaky
4. **Flake Detection Job**: 3 execuções completas
5. **Timeout Management**: Timeouts apropriados

### Flake Detection

```bash
# Executar detecção de flakes
pnpm test:flake-detection

# Executar testes múltiplas vezes
for i in {1..5}; do pnpm test; done
```

## Performance Testing

### Benchmarks Automatizados

#### Core Simulation:
- **≤2ms/tick**: Cada tick de simulação
- **≤100ms/partida**: Simulação completa
- **≤1ms/PRNG call**: Geração de números

#### UI Performance:
- **≤2s/screen**: Load de telas
- **≤100ms/interaction**: Resposta a clicks
- **≤5s/E2E flow**: Fluxos completos

### Métricas Coletadas

```typescript
// Performance tracking em testes
const startTime = performance.now();
// ... operação
const endTime = performance.now();
console.log(`Operation took ${endTime - startTime}ms`);
```

## Executar Testes

### Comandos Principais

```bash
# Todos os testes
pnpm -w test

# Com cobertura
pnpm test:coverage

# E2E tests
pnpm test:e2e

# E2E com UI
pnpm test:e2e:ui

# Por package
pnpm -C packages/core-sim test
pnpm -C packages/content test
```

### Debugging

```bash
# Vitest UI
pnpm -C packages/core-sim test --ui

# Playwright debug
pnpm test:e2e --debug

# Coverage report
open coverage/index.html
```

## Quality Gates

### Merge Requirements

1. **✅ Unit Tests**: 100% pass rate
2. **✅ E2E Tests**: 100% pass rate  
3. **✅ Coverage**: ≥80% global, ≥85% core-sim
4. **✅ No Flakes**: 3 consecutive runs pass
5. **✅ Performance**: Benchmarks within limits
6. **✅ Linting**: Zero warnings
7. **✅ Type Checking**: Zero errors

### CI Status Checks

- `test-coverage / unit-tests`
- `test-coverage / e2e-tests`
- `test-coverage / flake-detection`
- `test-coverage / performance-tests`

## Monitoring e Relatórios

### Coverage Reports

- **HTML Report**: `coverage/index.html`
- **LCOV**: Para integração com IDEs
- **JSON**: Para automação
- **Codecov**: Dashboard online

### E2E Reports

- **HTML Report**: `test-results/playwright-report/`
- **JSON Results**: `test-results/playwright-results.json`
- **JUnit XML**: Para CI integration
- **Videos/Screenshots**: Em caso de falha

### Performance Tracking

- **Benchmark History**: Trends ao longo do tempo
- **Regression Detection**: Alertas de degradação
- **CI Metrics**: Tempos de build e teste

## Manutenção

### Atualizações Regulares

1. **Golden Matches**: Revisar ranges esperados
2. **E2E Selectors**: Manter data-testid atualizados
3. **Performance Baselines**: Ajustar conforme hardware
4. **Flake Analysis**: Investigar testes instáveis

### Debugging de Testes

```bash
# Investigar falhas
cat test-results/playwright-report/index.html

# Logs detalhados
DEBUG=pw:api pnpm test:e2e

# Coverage detalhada
pnpm test:coverage --reporter=verbose
```

---

**Documentação mantida por**: ManagerX QA Team  
**Última atualização**: 28/09/2024  
**Versão da estratégia**: 1.0
