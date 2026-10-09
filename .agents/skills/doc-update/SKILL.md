---
name: doc-update
description: "Record reusable user corrections and conventions in scoped instructions, module READMEs, or skills. Use when the user corrects a reusable behavior, supplies a non-inferable convention, or documentation disagrees with code."
---

# doc-update

Record reusable conventions from the conversation in documentation. The primary reader of these documents is the model, and every sentence must change the behavior of the model.

## 1. List candidates

Review the conversation and identify the following events:

| Type              | Signal                                                                               |
| ----------------- | ------------------------------------------------------------------------------------ |
| Correction        | The user rejected the method because the document was missing or written incorrectly |
| New convention    | The user gave a rule that cannot be inferred from the code                           |
| Document conflict | The paths, fields, rules and codes written in the document do not match              |
| Process discovery | The steps or trigger conditions of a certain skill need to be adjusted in actual use |

Keep constraints that will be useful in future conversations. Patterns inferable from code belong in code; current progress belongs in the issue; debugging history and fixes belong in the commit.

Completion conditions: Every correction and every new agreement in the conversation has been classified as a candidate, or the reasons for exclusion have been stated.

## 2. Locate the single source of truth

Use the `.agents/docs/documentation.md` table to select the nearest location; the boundaries between README and `CLAUDE.md` are found in the document "Ownership and maintenance".

There is only one **Single Source of Truth** per rule. Before writing, use keywords and synonyms to express the old standard of the repository-wide rule search, and mark each hit:

- **Truth Source**: Change the original entry and write in full
- **Pointer**: Other copies of the same meaning (common in `CLAUDE.md`, `SKILL.md`, `references/`), change it to "See X" or delete it
- **Unrelated**: Similar words only

Completion conditions: Every search hit is marked.

## 3. Confirm

When the user has clearly stated the content of the rule in the conversation, go directly to step 4.

Candidates inferred by Claude, use `AskUserQuestion` to confirm one by one: what was found, the content to be written (no more than 3 lines), and the target location. The options include at least "write" and "skip", and a maximum of 4 items can be paralleled at a time.

## 4. Drafting

Write sentence by sentence according to the following principles:

- **Write the target behavior**: Use positive sentences to say what to do. Prohibited sentences leave only hard guardrails that cannot be expressed positively, and follow what to do
- **Passed no-op test**: Ask sentence by sentence "If you delete this sentence, will the model do something wrong?" If not, delete the entire sentence.
- **Use keywords to gather**: When the same meaning appears in several places with different expressions, replace it with a word that the model already understands (such as "single source of truth" and "nearby") to express it uniformly
- **Put the same concept together**: The definition, exceptions and examples of a rule are placed under the same title
- **Steps with completion conditions** (`SKILL.md`): Each step ends with a checkable completion condition. If you can write "everywhere...", don't write "give a copy..."
- **Hierarchical by branch** (`SKILL.md`): The details used in each operation are left in `SKILL.md`; only the details used by some branches are put in `references/`, and in `SKILL.md`, use one sentence to indicate when to read it.
- **description write-only trigger branch** (`SKILL.md`): one statement for each branch, synonymous statements are merged; what the skill does is left to the text

## 5. Implement and prune

Make minimal changes to the closest semantic position, and at the same time prune the paragraphs where the changes are made: old sentences that are overwritten or overturned by new rules, and sentences that contradict the reality of the code are also deleted, leaving one consistent rule in each paragraph.

Completion conditions: Every place marked in step 2 has been processed, and there are no sentences in the changed paragraph that conflict with the new rules.
