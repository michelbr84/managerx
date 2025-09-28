# ManagerX Marketing Package

> **Marketing Assets & Landing Page v1.0**  
> Materiais de marketing completos para o ManagerX

## Estrutura

```
marketing/
├── landing/
│   └── index.html              # Landing page PT-BR/EN
├── assets/
│   ├── logo.svg                # Logo principal
│   ├── icon-16.svg             # Favicon
│   ├── icon-32.svg             # Ícone pequeno
│   └── icon-64.svg             # Ícone médio
├── store-assets/
│   ├── steam-capsule-main.svg  # Steam main capsule (616x353)
│   ├── steam-header.svg        # Steam header (460x215)
│   ├── steam-library-hero.svg  # Steam library (1920x620)
│   └── gog-logo.svg            # GOG logo (200x200)
├── copy/
│   └── marketing-copy.md       # Copy completo PT-BR/EN
├── scripts/
│   └── export-assets.js        # Script de export
└── exports/                    # Assets exportados (gerado)
```

## Landing Page

### Características
- ✅ **Retro CRT Aesthetic**: Inspirado nos anos 2000
- ✅ **Bilíngue**: PT-BR/EN com toggle
- ✅ **Responsive**: Mobile-friendly
- ✅ **Interactive**: FAQ expansível, smooth scroll
- ✅ **SEO Ready**: Meta tags, Open Graph, Twitter Cards

### Seções
1. **Hero**: Título com efeito typing, CTAs principais
2. **Visão**: ASCII art, comparação CM 01/02 vs IA moderna
3. **Features**: Grid de 6 features principais
4. **Roadmap**: Timeline de desenvolvimento
5. **FAQ**: 5 perguntas principais por idioma
6. **Download**: Links e requisitos do sistema

### Tecnologias
- **HTML5**: Semântico e acessível
- **CSS3**: Animations, grid, flexbox
- **Vanilla JS**: Toggle de idioma, FAQ, smooth scroll
- **Sem dependências**: Carrega instantaneamente

## Visual Identity

### Paleta de Cores
- **Primary Green**: `#00ff00` (CRT green)
- **Dark Green**: `#009900` (darker variant)
- **Background**: `#000000` (pure black)
- **Accent**: `rgba(0,255,0,0.3)` (transparent green)

### Typography
- **Primary**: `'Courier New', monospace`
- **Fallback**: `Monaco, 'Lucida Console', monospace`
- **Style**: Retro terminal aesthetic

### Design Principles
- **Nostalgia**: Anos 2000, CRT monitors, ASCII art
- **Simplicidade**: Foco no conteúdo, não distrações
- **Funcionalidade**: Toda animação tem propósito
- **Acessibilidade**: Contraste alto, navegação clara

## Store Assets

### Steam Assets
- **Main Capsule** (616x353): Destaque na store
- **Header** (460x215): Página do produto
- **Library Hero** (1920x620): Biblioteca do usuário
- **Small Capsule** (231x87): Listas e busca
- **Icon** (184x184): Ícone do app

### GOG Assets
- **Logo** (200x200): Loja principal
- **Banner** (1200x400): Página do produto
- **Thumbnail** (300x300): Listas e categorias

### Características dos Assets
- ✅ **Vetoriais**: SVG para qualidade perfeita
- ✅ **Retro Style**: Consistente com identidade
- ✅ **Readable**: Legível em todos os tamanhos
- ✅ **Store-Ready**: Formatos corretos para cada plataforma

## Marketing Copy

### Mensagens Principais
- **Nostalgia**: "Reviva a magia do CM 01/02"
- **IA**: "Assistente inteligente que explica cada decisão"
- **Profundidade**: "Táticas que realmente importam"
- **Liberdade**: "100% offline, seus dados são seus"

### Públicos-Alvo
1. **Veteranos CM 01/02**: Nostalgia + modernização
2. **Gamers Modernos**: Profundidade sem complexidade
3. **Estrategistas**: Decisões significativas
4. **Entusiastas Offline**: Privacidade e controle

### Diferenciação
- **vs Football Manager**: Menos complexo, mais estratégico
- **vs Championship Manager**: Nostalgia + IA moderna
- **vs Mobile Managers**: Profundidade real, sem F2P

## Uso dos Assets

### Para Desenvolvedores
```bash
# Exportar todos os assets
node marketing/scripts/export-assets.js

# Servir landing page localmente
cd marketing/landing && python -m http.server 8080
```

### Para Press/Media
- **Press Kit**: `marketing/exports/press-kit/`
- **Logos**: Disponíveis em múltiplos formatos
- **Copy**: `marketing/copy/marketing-copy.md`
- **Screenshots**: TBD (quando app estiver pronto)

### Para Stores
- **Steam**: `marketing/exports/steam/`
- **GOG**: `marketing/exports/gog/`
- **Itch.io**: Usar assets GOG como base
- **Direct Download**: Usar logo principal

## Guidelines de Uso

### Permitido ✅
- Usar assets para promover ManagerX
- Redimensionar mantendo proporções
- Usar em press releases e reviews
- Incorporar em conteúdo editorial

### Não Permitido ❌
- Modificar elementos centrais do logo
- Alterar paleta de cores principal
- Usar fora do contexto ManagerX
- Remover créditos quando aplicável

## SEO e Metadata

### Keywords Principais
- **PT-BR**: "gerenciador futebol", "championship manager", "cm 01/02", "táticas futebol", "simulação esporte"
- **EN**: "football manager", "championship manager", "cm 01/02", "football tactics", "sports simulation"

### Meta Descriptions
- **PT-BR**: "Reviva a nostalgia do Championship Manager 01/02 com IA moderna. Gerencie seu clube, domine táticas e construa uma dinastia no futebol."
- **EN**: "Relive Championship Manager 01/02 nostalgia with modern AI. Manage your club, master tactics, and build a football dynasty."

## Performance

### Landing Page
- **Load Time**: <2 segundos
- **First Paint**: <1 segundo
- **Interactive**: <1.5 segundos
- **Lighthouse Score**: 95+ (target)

### Assets
- **SVG**: Escaláveis e leves
- **Optimized**: Sem elementos desnecessários
- **Compressed**: Gzip-friendly
- **Fast**: Carregamento instantâneo

## Deployment

### GitHub Pages
- **URL**: `https://michelbr84.github.io/managerx/`
- **Auto-deploy**: Push to main branch
- **Custom domain**: TBD

### CDN Assets
- **Assets URL**: `https://cdn.managerx.dev/` (futuro)
- **Cache**: Long-term caching for assets
- **Global**: CloudFlare ou similar

---

**Marketing package criado por**: ManagerX AI Team  
**Alinhado com**: GDD v0.1  
**Última atualização**: 28/09/2024
