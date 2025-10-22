# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Language Preference

**IMPORTANT: All responses should be in Chinese (Simplified Chinese) by default**, unless:

- The user explicitly requests a response in English
- You are writing code, code comments, or commit messages (which should remain in English)
- You are referencing technical terms, API names, or function names (which should remain in their original English form)

When communicating with the user:

- Use Chinese for explanations, summaries, and general communication
- Use English for code snippets, variable names, function names, and technical identifiers
- You may use a mix of Chinese and English when discussing code (Chinese for explanations, English for code references)

## Project Overview

Windy10v10AI is a PVE Dota 2 custom game featuring 10v10 matches with AI opponents and a unique ability lottery system. The codebase uses TypeScript compiled to Lua for game logic (VScripts) and React + TypeScript for the UI (Panorama).

## Development Commands

### Setup & Installation

```bash
# Install dependencies and link game/content directories to Dota 2 addon folder
npm install

# Note: Code must be on the same hard drive partition as Dota 2
```

### Development Workflow

```bash
# Start Dota 2 Tools and watch mode (most common command)
npm run start

# Build everything (panorama + vscripts)
npm run build

# Watch mode only (without launching Dota 2)
npm run dev

# Build individual components
npm run build:panorama  # Webpack build for UI
npm run build:vscripts  # TSTL compilation to Lua
```

### Testing & Quality

```bash
# Run Jest tests
npm test

# Lint TypeScript files
npm run lint
npm run lint:fix

# Check code formatting
npm run prettier-check
```

### Dota 2 VConsole Commands

These commands are run inside the Dota 2 console during development:

```bash
# Launch/relaunch the custom game
dota_launch_custom_game windy10v10ai dota
dota_launch_custom_game windy10v10ai custom

# Reload Lua scripts (hot reload)
script_reload

# Speed up game for testing
host_timescale 2.0

# Show game end panel
dota_custom_ui_debug_panel 7
```

## Code Architecture

### Technology Stack

- **VScripts (Backend)**: TypeScript → Lua via TypeScript-to-Lua (TSTL)
- **Panorama UI (Frontend)**: React 16.14 + TypeScript → JavaScript via Webpack
- **Communication**: Custom Net Tables (bidirectional sync) and Custom Game Events (client→server)
- **Shared Types**: TypeScript interfaces in `src/common/` define contracts between layers

### Directory Structure

```
src/
├── vscripts/              # Game logic (TypeScript → Lua)
│   ├── addon_game_mode.ts # Entry point - exports Activate() function
│   ├── ai/                # Bot AI system (30+ files)
│   │   ├── hero/          # Hero-specific AI modifiers (Lion, Viper, Luna, etc.)
│   │   ├── mode/          # FSA modes: Laning, Attack, Retreat, Push
│   │   ├── action/        # Actions: Attack, Move, Cast, Item usage
│   │   └── build-item/    # Item build logic
│   ├── modules/           # Core game systems (registered as GameRules.* singletons)
│   │   ├── lottery/       # Ability lottery system (random ability generation/selection)
│   │   ├── event/         # Event dispatcher (NPC spawn, kills, level up)
│   │   ├── filter/        # Game rule filters (gold/XP modification)
│   │   ├── property/      # Player property/attribute system
│   │   ├── helper/        # Utility helpers (PlayerHelper, UnitHelper, etc.)
│   │   └── ...            # AI, Analytics, GameConfig, Option, Debug
│   ├── modifiers/         # Custom modifiers (PropertyBaseModifier, etc.)
│   ├── api/               # External API client (windy10v10ai.com backend)
│   └── utils/             # TSTL adapters (@registerModifier decorator), dota_ts_adapter
│
├── panorama/              # UI (React + TypeScript → JavaScript)
│   ├── react/
│   │   ├── hud_lottery/   # Ability lottery UI
│   │   │   ├── Lottery.tsx        # Main container with state management
│   │   │   ├── LotteryContainer.tsx
│   │   │   ├── LotteryRow.tsx
│   │   │   ├── LotteryAbilityItem.tsx  # Individual ability cards
│   │   │   └── KeyBind.tsx        # Hotkey binding UI
│   │   └── utils/         # Net table helpers, color definitions
│   ├── tsconfig.json
│   └── webpack.*.js       # Build configurations
│
├── common/                # Shared TypeScript types
│   ├── net_tables.d.ts    # CustomNetTableDeclarations interface
│   ├── events.d.ts        # CustomGameEventDeclarations interface
│   └── dto/               # Data transfer objects (lottery, game state)
│
└── scripts/               # Build automation (Node.js)
    ├── install.js         # Symlinks game/content to Dota 2 addons directory
    ├── launch.js          # Launches Dota 2 Tools if not running
    └── utils.js           # Helper functions (getDotaPath, getAddonName)
```

### Key Architectural Patterns

#### 1. Module System (VScripts)

Core systems are implemented as singleton classes registered on `GameRules`:

```typescript
// In modules/index.ts
export function ActivateModules() {
  if (GameRules.AI == null) GameRules.AI = new AI();
  if (GameRules.Lottery == null) GameRules.Lottery = new Lottery();
  // ... other modules
}
```

Access modules via:

- `GameRules.Lottery` - Ability lottery system
- `GameRules.AI` - Bot AI management
- `GameRules.Event` - Event dispatcher
- `GameRules.GoldXPFilter` - Gold/XP modification

#### 2. Decorator-Based Registration

Use decorators from `utils/dota_ts_adapter.ts` to register modifiers and abilities:

```typescript
@registerModifier()
export class MyCustomModifier extends BaseModifier {
  // Modifier implementation
}

@registerAbility()
export class MyAbility extends BaseAbility {
  // Ability implementation
}
```

#### 3. AI State Machine (FSA)

Bot AI uses a Finite State Automaton with desire-based mode switching:

- **Modes**: Laning, Attack, Retreat, Push (each in `ai/mode/`)
- **Threshold**: 0.5 desire triggers mode switch
- **Think interval**: 0.3 seconds for game logic execution
- **Actions**: Attack, Move, Cast, Item usage (in `ai/action/`)

#### 4. Data Flow

**Server → Client (Net Tables)**:

```typescript
// VScripts (server)
CustomNetTables.SetTableValue("lottery_status", playerId.toString(), data);

// Panorama (client)
CustomNetTables.SubscribeNetTableListener("lottery_status", callback);
const data = CustomNetTables.GetTableValue("lottery_status", playerId);
```

**Client → Server (Custom Events)**:

```typescript
// Panorama (client)
GameEvents.SendCustomGameEventToServer("lottery_pick_ability", { name, type, level });

// VScripts (server)
CustomGameEventManager.RegisterListener("lottery_pick_ability", (userId, event) => {
  // Handle ability pick
});
```

### Lottery System

The ability lottery is a core feature where players randomly select abilities:

1. **Generation** (`modules/lottery/`):

   - During PRE_GAME, generates 4 base + 2 extra random abilities per player
   - Tiers 1-5 with different ability pools (defined in `lottery-abilities.ts`)
   - Excludes duplicate hero abilities and previously picked abilities on refresh
   - Published to Net Tables: `lottery_active_abilities`, `lottery_passive_abilities`, `lottery_status`

2. **UI** (`panorama/react/hud_lottery/`):

   - Subscribes to Net Tables for reactive updates
   - Displays ability cards with tier-based coloring
   - Handles pick events via `lottery_pick_ability` custom event
   - Supports collapse/expand and hotkey binding

3. **Application**:
   - Server receives pick event, applies modifier to player
   - Updates `lottery_status` Net Table
   - UI automatically updates to show picked state

### Testing

- **Framework**: Jest with ts-jest preset
- **Test files**: `*.test.ts` files colocated with source (e.g., `gold-xp-filter.test.ts`)
- **Mocking**: Mock Dota globals via `global.GameRules = { ... }` in tests
- **Run**: `npm test` executes all tests with coverage

### Build System

- **VScripts**: TSTL compiler (`tsconfig.json` with `luaTarget: "JIT"`)

  - Output: `game/scripts/vscripts/`
  - Plugins: `@moddota/dota-lua-types/transformer` for type support
  - Source maps enabled for debugging

- **Panorama**: Webpack with custom plugins
  - Output: `content/panorama/scripts/custom_game/`
  - Loaders: ts-loader, babel-loader, less-loader
  - `PanoramaTargetPlugin` for Valve format conversion
  - Tree-shaking and filesystem caching enabled

### Symlink Setup

The `npm install` postinstall script (`src/scripts/install.js`) creates junction symlinks:

- `game/` ↔ `{dota_path}/game/dota_addons/windy10v10ai/`
- `content/` ↔ `{dota_path}/content/dota_addons/windy10v10ai/`

This allows the project to sync with Dota 2's addon directory automatically.

## Development Guidelines

### When modifying VScripts (game logic):

1. All TypeScript files in `src/vscripts/` compile to Lua
2. Use `@registerModifier()` and `@registerAbility()` decorators for auto-registration
3. Extend `BaseModifier`, `BaseAbility`, or `BaseItem` from `utils/dota_ts_adapter.ts`
4. Access modules via `GameRules.*` singletons (e.g., `GameRules.Lottery.refresh()`)
5. Use `script_reload` in VConsole for hot reload during development
6. Write tests in `*.test.ts` files using Jest (mock Dota globals as needed)

### When modifying Panorama UI:

1. React components in `src/panorama/react/`
2. Use Net Table helpers from `panorama/react/utils/net-table.ts`
3. Subscribe to Net Tables for reactive data updates
4. Send events via `GameEvents.SendCustomGameEventToServer()`
5. Path alias `@utils/*` maps to `panorama/react/utils/*`
6. Panorama UI uses React 16.14 with functional components and hooks

### When adding new shared types:

1. Add to `src/common/` for types shared between VScripts and Panorama
2. Update `net_tables.d.ts` for new Net Table keys
3. Update `events.d.ts` for new custom events
4. Create DTOs in `common/dto/` for complex data structures

### When modifying AI:

1. Hero-specific AI: Add/modify modifiers in `src/vscripts/ai/hero/`
2. All hero AI extends `BotBaseAIModifier` with `OnIntervalThink()` (0.3s interval)
3. Modes: Implement `GetDesire()` in `ai/mode/` (return 0-1 float)
4. Actions: Add to `ai/action/` for reusable behaviors (attack, move, cast)
5. Item builds: Define in `ai/build-item/`

### Common Pitfalls:

- **Symlinks on wrong partition**: Code MUST be on same hard drive as Dota 2
- **Missing Lua reload**: Use `script_reload` in VConsole after VScript changes
- **Net Table type mismatches**: Booleans are transmitted as 0/1, use helper conversions
- **Webpack caching**: Delete `node_modules/.cache` if build output seems stale
- **Line endings**: Use LF (Unix) not CRLF (Windows) for TypeScript files

## Localization

Language files are located in `game/resource/` and use Valve's KeyValues format:

### Language File Maintenance Policy

- **Chinese (`addon_schinese.txt`)**: MUST be maintained - add all new keys
- **English (`addon_english.txt`)**: MUST be maintained - add all new keys
- **Russian (`addon_russian.txt`)**: ONLY maintain existing keys - do NOT add new keys

### Adding New Localization Keys

When adding new UI elements or text that needs translation:

1. **Add to Chinese file** (`addon_schinese.txt`):

   ```
   "my_new_key"    "我的新文本"
   ```

2. **Add to English file** (`addon_english.txt`):

   ```
   "my_new_key"    "My New Text"
   ```

3. **Do NOT add to Russian file** (`addon_russian.txt`) - only update if the key already exists

### Finding Official Dota 2 Ability Names

When editing abilities from Dota 2 that don't exist in the project's language files, find the official translations from the reference files:

1. **Search in reference files** located in `docs/reference/7.39/`:

   - English: `abilities_english.txt`
   - Chinese: `abilities_schinese.txt`

2. **Search pattern**: Use the ability internal name (e.g., `medusa_split_shot`) to find entries like:

   ```
   English: "DOTA_Tooltip_ability_medusa_split_shot"    "Split Shot"
   Chinese: "DOTA_Tooltip_ability_medusa_split_shot"    "分裂箭"
   ```

3. **Example workflow**:

   ```bash
   # Search for the ability name in reference files
   grep "luna_moon_glaive" docs/reference/7.39/abilities_english.txt
   grep "luna_moon_glaive" docs/reference/7.39/abilities_schinese.txt

   # Results will show:
   # English: "DOTA_Tooltip_ability_luna_moon_glaive"    "Moon Glaives"
   # Chinese: "DOTA_Tooltip_ability_luna_moon_glaive"    "月刃"
   ```

**Note**: The reference files are from Dota 2 version 7.39 and contain official Valve translations for all standard abilities.

### Usage in Code

Reference localization keys in XML/Panorama:

```xml
<Label text="#my_new_key" />
```

Or in JavaScript/TypeScript:

```javascript
$.Localize("#my_new_key");
```

### File Format

- Format: Valve KeyValues (`.txt` files with specific structure)
- Encoding: UTF-8 with BOM
- **Indentation**: Use tabs between key and value, with alignment based on key length:
  - Short keys (e.g., `"max_level"`): Use tabs to align values at a consistent column
  - Long keys (e.g., `"DOTA_Tooltip_ability_attribute_bonus"`): Use tabs to maintain readability
  - Example:
    ```
    "short_key"                    "短文本"
    "DOTA_Tooltip_very_long_key"                                "长键名的文本"
    ```
- Structure:
  ```
  "lang"
  {
      "Language"  "schinese"  // or "english", "russian"
      "Tokens"
      {
          "key_name"    "translated text"
      }
  }
  ```

## Git Workflow

### Branch Naming

- Feature branches: `feature/{issue-number}-{branch-name}`
- Example: `feature/123-add-new-hero-ai`

### Pull Requests

- Create PRs from feature branches to `develop` branch (not `main`)
- CI runs on PR: linting → tests → build (see `.github/workflows/test.yml`)
- Auto-approve workflows exist for owner PRs

### Commits

- Follow existing commit style (see `git log` for examples)
- PRs are squash-merged, so individual commit messages matter less than PR description
