---
name: dota-faq
description: "Maintain loading-screen FAQ questions and answers in the loading UI and Chinese, English, and Russian localization. Use when adding FAQ entries or changing loading-screen wording or tips."
---

# Loading-screen FAQ

Owners:

- `content/panorama/layout/custom_game/custom_loading_screen.xml`
- `content/panorama/styles/custom_game/custom_loading_screen.css`
- `content/panorama/scripts/custom_game/game_mode.js`
- The three addon localization files.

Keep separate `LoadingFaqQuestion` / `LoadingFaqAnswer` labels beneath
`LoadingFaqPanel`, with no FAQ heading, border, background, or floating card.
Preserve the upper center-right placement, clear of lobby/team controls and logo.
Questions use larger warm bold text; answers use smaller lighter text.

`LOADING_FAQ_GROUPS` selects a weighted group, then a uniform entry.
Keep common/rare weights 8/2.
Entries store `loading_dota-faq_<topic>`; labels read its
`_question` and `_answer` keys.

User-supplied wording authorizes implementation; clarify only unresolved
mechanics or classification that would change its intent.
Verify reward/lottery/stacking/drop behavior in code before writing an answer.
Reuse existing terminology and merge overlapping entries.
Common groups cover global/new-player questions; specialized hero or advanced
cases belong in the rare group.
Use short player-facing text, normally 1–2 answer sentences.
Instructional tips may have declarative titles; avoid forcing a "why" question
or implying a single-player alternative to the fixed 10v10 game.
Let each label wrap naturally; do not join them with HTML or explicit breaks.

Add corresponding keys under `// FAQ` in all three languages.
Use $dota-localization-format-guide.
Run `node --check content/panorama/scripts/custom_game/game_mode.js`,
check key registration, and inspect wrapping/placement in Tools at wide and
narrow aspect ratios.
