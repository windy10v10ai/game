---
name: faq
description: "Maintain loading-screen FAQ questions and answers in the loading UI and Chinese, English, and Russian localization. Use when adding FAQ entries or changing loading-screen wording or tips."
---

# Maintenance loading screen FAQ

Displays a random FAQ at the top center right of the custom loading screen. When the user gives the original text, it is regarded as localization text and implementation authorization, and the writing is directly optimized and completed; it is only asked when the mechanism facts cannot be confirmed from the code, or the classification will obviously change the user's intention.

## fixed structure

- Layout: [content/panorama/layout/custom_game/custom_loading_screen.xml](content/panorama/layout/custom_game/custom_loading_screen.xml)
  - Maintain the two labels `LoadingFaqQuestion` and `LoadingFaqAnswer` under `LoadingFaqPanel`.
  - Do not add a FAQ title and does not merge the questions and answers into a single Label.
- style: [content/panorama/styles/custom_game/custom_loading_screen.css](content/panorama/styles/custom_game/custom_loading_screen.css)
  - FAQ is an embedded text with no borders and no background, and is not a floating card.
  - Keep the upper center-right position, avoiding the game options on the left, the team panel on the right, and the central Dota logo.
  - Use warm, larger, and bold text for questions, and smaller, lighter text for answers.
- Random logic: [content/panorama/scripts/custom_game/game_mode.js](content/panorama/scripts/custom_game/game_mode.js) The common group weight of
  - `LOADING_FAQ_GROUPS` is `8`, and the unpopular group weight is `2`. They are first weighted by group, and then drawn with equal probability within the group.
  - Each entry only writes the key prefix `loading_faq_<topic>`, and the script reads `<prefix>_question` and `<prefix>_answer`.

## localization text and classification

1. First search the terminology in the existing localization, and then write the localization text. Keep the existing names, such as "treasure chest", "item lottery", "roshan" and "awakening". The
2. question is tiered toward new players and directly describes the phenomena seen by players, avoiding internal jargon and implementation details.
3. Give priority to answers in 1–2 sentences. Give the conclusion first, and then give the necessary conditions or operations. Don't use semicolons.
4. Do not use `<br>`, HTML or text breaks to separate questions and answers, and the two Labels wrap naturally.
5. Core, new player high-frequency or global mechanisms are classified as common. Only specific heroes, multiplayer scenarios, pack boundaries, or advanced rules are classified as upsets.
6. When it comes to actual rewards, prize pools, stacking or drop rules, read the corresponding code first to verify; do not write "higher probability" as "higher reward tier", or vice versa.
7. Question bit is not forced to be written as a question sentence. If the content is operational advice/techniques rather than abnormal phenomena where players will actively ask "why", it would be more natural to directly use a declarative title (such as "Those who open the treasure chest first will be rewarded better"). Don't use "What are the benefits of...?" questions just to make up the question and answer format.
8. Do not introduce false comparison conditions to create questions. The game is fixed at 10v10, and a frame like "When playing in multiplayer..." would imply that the single-player scenario is not true, and the single-player scenario does not exist.
9. Search existing FAQs to see if they cover the same mechanism before adding new ones. If the content overlaps, merge into the answers to existing entries. Do not juxtapose two similar questions and answers.
10. The tone of the question starting with "Why" is more accusatory, and the entire question bank should avoid letting it become the dominant sentence pattern. Instead, use softer questions such as "What situation/when..." "...?" "What should I do...?" or change it to a descriptive title according to Article 7. Before adding or modifying items, read through the existing Question wordings in the question bank to avoid stacking the same beginnings in succession.

## write localization

Modify the following three files at the same time:

- `game/resource/addon_schinese.txt`
- `game/resource/addon_english.txt`
- `game/resource/addon_russian.txt`

Leave a blank line after the `loading_status_*` paragraph and start the FAQ paragraph with `// FAQ`. Each FAQ must use the same two keys in the three language files:

```text
loading_faq_<topic>_question
loading_faq_<topic>_answer
```

maintains two-tab indentation, complete three-language key correspondence, and the same paragraph structure. The order of keys in the three files is consistent with the comments.

## Workflow

1. Read `game/resource/CLAUDE.md` and `localization-format-guide` skills to view the existing FAQ and related mechanism codes.
2. Optimize the user's original text into Chinese questions and answers, and translates it into English and Russian according to existing terminology.
3. Select the common or unpopular group, add the corresponding prefix to `LOADING_FAQ_GROUPS`, and add the question and answer key to the trilingual `// FAQ` segment.
4. If you modify the Q&A structure or display style, check XML, scripts and CSS at the same time and still use the borderless embedded design of two Labels.
5. Verification: Run `git diff --check`, `node --check content/panorama/scripts/custom_game/game_mode.js`, check that each new key appears once in the trilingual file, and confirm that the entry has been registered in the script.
6. Prompt users to measure position, line wrapping and random results in Dota Tools in 16:9 and narrow screens.
