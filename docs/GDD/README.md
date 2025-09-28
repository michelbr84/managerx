# ManagerX — GDD v0.1

> PT-BR primário; termos EN incluídos quando necessário. Escopo inicial inspirado no CM 01/02 com IA moderna.

## Sumário

- [Visão](#visão)
- [Pilares](#pilares)
- [Loop de Jogo](#loop-de-jogo)
- [Sistemas](#sistemas)
  - [Simulação](#simulação)
  - [Táticas](#táticas)
  - [Scouting](#scouting)
  - [Narrativa](#narrativa)
  - [Assistente (AI Assistant)](#assistente-ai-assistant)
- [Economia/Finanças](#economiafinanças)
- [Calendário & Regras de Ligas](#calendário--regras-de-ligas)
- [UX/Fluxos](#uxfluxos)
- [Dados Fictícios (estrutura)](#dados-fictícios-estrutura)
- [Telemetria & KPIs](#telemetria--kpis)
- [Testes (golden matches)](#testes-golden-matches)
- [Roadmap (12 semanas)](#roadmap-12-semanas)
- [Tabela de Atributos (Jogadores & Staff)](#tabela-de-atributos-jogadores--staff)

---

## Visão

ManagerX combina a nostalgia de Championship Manager 01/02 (texto, profundidade, 1-20 atributos) com uma camada de IA moderna para assistência de análise, recomendações e narrativa dinâmica. Foco em: decisões significativas, loop rápido, dados legíveis, táticas expressivas, carreira de 10 temporadas, offline-first.

Restrições de lançamento: 6 ligas (cada uma com 2 divisões), ~200 clubes, 10 temporadas simuláveis, totalmente offline-first (sem dependência de rede após instalação) e dados fictícios.

"Spec-as-Truth": Cada requisito possui ID único MX-REQ-### e critérios de aceite mensuráveis.

## Pilares

- Nostalgia CM 01/02: 1-20, texto rico, interface enxuta, ritmo rápido.
- IA útil, não intrusiva: recomendações, scouting inteligente, explicabilidade.
- Profundidade sistêmica coesa: tática, economia, desenvolvimento de elenco e narrativa integrados.
- Performance offline: carregar/salvar rápido, simular temporadas em minutos.
- Clareza: dados e feedback sempre acionáveis.

## Loop de Jogo

1) Pré-jogo: ajustar tática, escalação e instruções; 2) Partida simulada; 3) Pós-jogo: relatório, treinos, transferências; 4) Progressão semanal: scouting, finanças, calendário; 5) Janelas: contratar/vender, renovar, metas do board.

Principais ciclos: Semanal (jogos + scouting), Mensal (finanças + reviews), Sazonal (contratos + metas).

## Sistemas

### Simulação

- Motor de partida baseado em eventos (event engine), granularidade de jogadas relevantes (highlights) com log textual.
- Modelo de capacidade atual/potencial (CA/PA) estilo CM, atributos 1-20 e moral/condição/dinâmica.
- Interações tática × atributos × forma × condições climáticas.

Requisitos:

- MX-REQ-001: O motor deve simular 10 temporadas completas offline em ≤ 10 min em máquina alvo.
  - Aceite: benchmark interno com save padrão executa 10 temporadas em ≤ 10 min (média 3 runs).
- MX-REQ-002: Partida deve gerar log textual com ≥ 50 eventos por jogo em média.
  - Aceite: 100 jogos simulados produzem média ≥ 50 eventos com desvio padrão ≤ 15.
- MX-REQ-003: Condição física decai entre 0-100 com impacto em desempenho ≥ 5% quando < 60.
  - Aceite: testes A/B mostram queda média ≥ 5% em rating quando condição < 60.
- MX-REQ-004: Persistência determinística com seed salva por partida.
  - Aceite: mesma seed + mesmas entradas → mesmos resultados por 3 execuções.

### Táticas

- Formações clássicas (4-4-2, 4-3-3, 3-5-2) + funções (Poacher, Ball Winning Midfielder, Libero, Wing Back, etc.).
- Instruções de equipe (pressing, linha defensiva, ritmo) e individuais (papel, liberdade, marcação).

Requisitos:

- MX-REQ-010: Editor tático deve permitir salvar ≥ 20 presets por save.
  - Aceite: criar e carregar 20 presets sem perda de dados.
- MX-REQ-011: Mudanças táticas no intervalo afetam a simulação no 2º tempo.
  - Aceite: alteração de pressing no HT altera contagem de recuperações em ≥ 10% (média 20 jogos).
- MX-REQ-012: Posicionamento médio por função registrado por jogo.
  - Aceite: relatório pós-jogo contém heatmap agregado por função.

### Scouting

- Rede de olheiros, focos (Idade, PA, atributos-chave), relatórios com notas 1-100 e incerteza.
- IA recomenda alvos com explicações (feature attribution simples).

Requisitos:

- MX-REQ-020: Geração de shortlist sugerida (top 10) por posição.
  - Aceite: para cada posição, sistema preenche lista ≥ 10 jogadores com justificativa.
- MX-REQ-021: Incerteza diminui com observação (curva exponencial).
  - Aceite: após 3 observações, intervalo de confiança reduzido em ≥ 40% em média.
- MX-REQ-022: Filtros por atributos, idade, contrato, valor, liga.
  - Aceite: consulta retorna ≤ 300 ms em dataset padrão.

### Narrativa

- Eventos dinâmicos: lesões, forma, promessas, conflitos, marcos de carreira.
- Caixa de entrada (Inbox) estilo CM com decisões rápidas.

Requisitos:

- MX-REQ-030: Sistema de eventos semanais com probabilidade condicionada a forma/moral.
  - Aceite: 1000 semanas simuladas geram incidência dentro de ±15% do esperado.
- MX-REQ-031: Notícias com consequências (moral, reputação, finanças).
  - Aceite: cada notícia aplica deltas persistidos e auditáveis no save.

### Assistente (AI Assistant)

- Recomendações de escalação, substituições, treino e mercado com justificativa textual curta.
- Modo "auto" opcional para microdecisões repetitivas.

Requisitos:

- MX-REQ-040: Sugestão de XI inicial baseada em forma + adequação tática.
  - Aceite: diferença média de rating do XI sugerido ≤ 2% do ótimo por busca gulosa.
- MX-REQ-041: Sugestão de 3 substituições até 70', 80', 88'.
  - Aceite: simulações mostram aumento ≥ 0.05 no xG diferencial médio vs. sem assistência.
- MX-REQ-042: Explicabilidade curta (≤ 140 chars) para cada sugestão.
  - Aceite: cada sugestão traz razão textual contendo atributo-chave + contexto.

## Economia/Finanças

- Receitas: bilheteria, TV, prêmios, merchandising. Despesas: salários, bônus, taxas, manutenção.
- Fair Play Financeiro simplificado por divisão.

Requisitos:

- MX-REQ-050: Orçamentos anuais por clube com projeção mensal.
  - Aceite: relatório mensal reconcilia diferença ≤ 1% com livro razão.
- MX-REQ-051: Negociação de contratos com 5 componentes: salário, bônus por gol, bônus por jogo, luvas, cláusula de venda.
  - Aceite: UI permite editar e simular custo total em 3 passos.
- MX-REQ-052: Valuation de jogador deriva de CA/PA, idade, contrato, forma.
  - Aceite: R² ≥ 0.6 vs. preço de transferência simulado em mercado fechado.

## Calendário & Regras de Ligas

Ligas fictícias (2 divisões cada), total ≈ 204 clubes.

- Países: AlbionX, LusitaniaX, CaledoniaX, IberiaX, ItalicaX, GermanicaX.
- Divisões: D1 (18 clubes), D2 (16 clubes). Pontos: 3-1-0. Rodadas duplas.
- Promoção/rebaixamento: 3 diretos entre D1/D2; playoffs em D2 (4 clubes) por 1 vaga.
- Copas nacionais simples (knockout) por país, 64 clubes.

Requisitos:

- MX-REQ-060: Calendário gera rodadas sem conflitos entre liga e copa.
  - Aceite: 10 temporadas geradas com ≤ 0 conflitos agendados.
- MX-REQ-061: Classificação calcula desempates: saldo, gols pró, confronto direto.
  - Aceite: testes de mesa confirmam ordenação correta em 20 cenários.
- MX-REQ-062: Registro de estrangeiros: máx. 5 em campo na D1 ItalicaX.
  - Aceite: verificação impede escalar >5; mensagem de erro clara.

## UX/Fluxos

Foco em texto, tabelas, atalhos, e wireframes em `docs/UX/wireframes`.

- Dashboard do Clube: visão geral, próximo jogo, finanças, alertas do assistente.
- Elenco & Atributos: filtros 1-20, condição, moral, papéis.
- Editor Tático: formação, funções, bolas paradas, instruções.
- Dia de Jogo: escalação, substituições assistidas, log/relato, estatísticas.
- Scouting & Transferências: busca, shortlist, propostas, orçamento.
- Calendário & Inbox: eventos, notícias, decisões rápidas.

Requisitos:

- MX-REQ-070: Todas as telas navegáveis via teclado (Tab/Setas/Enter) com foco visível.
  - Aceite: 90% de ações primárias completas sem mouse em testes.
- MX-REQ-071: Cada fluxo crítico ≤ 3 cliques/ações (salvar tática, fazer proposta, escalar XI).
  - Aceite: testes de usabilidade registram média ≤ 3 ações.

## Dados Fictícios (estrutura)

Representação simplificada (JSON-like):

```json
{
  "club": {"id":"CLB-0001","name":"AlbionX FC","division":"AlbionX-D1","budget": 12000000},
  "player": {
    "id":"PLY-000001","clubId":"CLB-0001","name":"João Silva","age":21,
    "nationality":"ALX","position":"ST","foot":"R",
    "attributes": {"finishing":16,"pace":14,"technique":13,"stamina":15,"decisions":14},
    "ca":125,"pa":165,"morale":72,"condition":94,
    "contract": {"wage": 8500, "expires": "2028-06-30", "releaseClause": 20000000}
  },
  "staff": {"id":"STF-0001","role":"Assistant Manager","tacticalKnowledge":16,"manManagement":15},
  "fixture": {"id":"FX-000001","home":"CLB-0001","away":"CLB-0015","date":"2025-08-12"}
}
```

Requisitos:

- MX-REQ-080: IDs únicos com prefixos PLY/CLB/STF/FX.
  - Aceite: validação rejeita duplicatas em import.
- MX-REQ-081: Savegames ≤ 10 MB por temporada média.
  - Aceite: 10 temporadas produzem arquivo total ≤ 120 MB.

## Telemetria & KPIs

Offline analytics (buffer local) com opt-in. KPIs:

- Retenção D1/D7/D30, tempo médio por sessão, partidas simuladas/sessão.
- Conversão de onboarding (completar 1ª partida), uso do assistente, taxa de sugestões aceitas.
- Desempenho: tempo por simulação, FPS de UI (se aplicável), IO de save.

Requisitos:

- MX-REQ-090: Buffer local de eventos com flush manual/export.
  - Aceite: usuário exporta JSON ND com ≤ 1 clique em Configurações.
- MX-REQ-091: Rastreamento de 15 eventos principais (listados acima) com versão de esquema.
  - Aceite: arquivo contém schemaVersion e eventos validados.

## Testes (golden matches)

Conjunto de partidas e cenários determinísticos para regressão:

- GM-001: AlbionX FC (4-4-2) vs LusitaniaX United (4-3-3) — seed 42.
- GM-002: Jogo sob chuva, linha alta vs. bolas longas — seed 99.
- GM-003: Substituição aos 70' altera xG em ≥ 0.1 — seed 7.

Requisitos:

- MX-REQ-100: Reexecutar golden matches em CI local (offline) com tolerância ±5% nas métricas.
  - Aceite: relatório mostra variações dentro de limites.

## Roadmap (12 semanas)

S1-S2: Fundações de dados, simulação básica, editor tático MVP, UI tabelas.

S3-S4: Scouting MVP, transferências básicas, economia mínima, calendário e geração de fixtures.

S5-S6: Assistente IA (escalação/subs), narrativa/inbox, relatórios pós-jogo, golden matches v1.

S7-S8: Balance de atributos/mercado, copas nacionais, regras especiais (estrangeiros), UX teclado.

S9-S10: Otimização de performance, telemetria offline, polimento de usabilidade, acessibilidade.

S11-S12: Conteúdo (≈200 clubes), QA intensivo, estabilização, release candidate.

Marcos de aceite por semana atrelados a MX-REQs correspondentes.

## Tabela de Atributos (Jogadores & Staff)

Atributos em escala 1–20 (CM-like). Agrupamentos principais:

| Categoria | Atributos (Jogador) |
|---|---|
| Técnicos | finishing, firstTouch, dribbling, technique, crossing, passing, heading, tackling |
| Físicos | pace, acceleration, agility, balance, strength, stamina, jumpingReach |
| Mentais | decisions, anticipation, positioning, offTheBall, vision, workRate, bravery, composure, determination |
| Goleiros | handling, reflexes, aerialReach, oneOnOnes, kicking |

| Categoria | Atributos (Staff) |
|---|---|
| Técnico-Tático | tacticalKnowledge, trainingAttack, trainingDefense, setPieces |
| Gestão | manManagement, motivation, discipline, adaptability |
| Scouting | judgingAbility, judgingPotential, negotiating |

Requisitos:

- MX-REQ-110: Distribuições iniciais calibradas por posição (médias e desvios).
  - Aceite: validação estatística por posição cai dentro de bandas pré-definidas.
- MX-REQ-111: Potencial (PA) estático, CA evolui com treino/minutos.
  - Aceite: simulação de 3 anos mostra crescimento coerente por idade/treino.

---

Licença de dados: totalmente fictícios; qualquer semelhança é coincidência.


