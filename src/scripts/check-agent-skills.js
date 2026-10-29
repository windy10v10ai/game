const fs = require('fs');
const path = require('path');

// Every agent tool only reads name and description from the frontmatter; a malformed
// skill disappears from discovery without any error, so validate them in CI instead.
const repoRoot = path.resolve(__dirname, '..', '..');
const skillsDir = path.join(repoRoot, '.claude', 'skills');
const NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_NAME_LENGTH = 64;
const MAX_DESCRIPTION_LENGTH = 1024;

function parseFrontmatter(text) {
  const normalized = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  if (!normalized.startsWith('---\n')) return null;

  const end = normalized.indexOf('\n---', 3);
  if (end === -1) return null;

  const fields = new Map();
  for (const line of normalized.slice(4, end).split('\n')) {
    const match = /^([A-Za-z][\w-]*):\s*(.*)$/.exec(line);
    if (match) fields.set(match[1], match[2].trim().replace(/^(['"])(.*)\1$/, '$2'));
  }
  return fields;
}

const skillNames = fs
  .readdirSync(skillsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
  .map((entry) => entry.name)
  .sort();

const problems = [];
for (const skillName of skillNames) {
  const skillFile = path.join(skillsDir, skillName, 'SKILL.md');
  if (!fs.existsSync(skillFile)) {
    problems.push(`${skillName}: missing SKILL.md`);
    continue;
  }

  const fields = parseFrontmatter(fs.readFileSync(skillFile, 'utf8'));
  if (fields === null) {
    problems.push(`${skillName}: SKILL.md does not start with a --- delimited frontmatter block`);
    continue;
  }

  const name = fields.get('name') ?? '';
  const description = fields.get('description') ?? '';

  if (!name) problems.push(`${skillName}: frontmatter is missing name`);
  else if (!NAME_PATTERN.test(name)) problems.push(`${skillName}: name "${name}" is not kebab-case`);
  else if (name.length > MAX_NAME_LENGTH) {
    problems.push(`${skillName}: name exceeds ${MAX_NAME_LENGTH} characters`);
  } else if (name !== skillName) {
    problems.push(`${skillName}: name "${name}" does not match its directory`);
  }

  if (!description) problems.push(`${skillName}: frontmatter is missing description`);
  else if (description.length > MAX_DESCRIPTION_LENGTH) {
    problems.push(`${skillName}: description exceeds ${MAX_DESCRIPTION_LENGTH} characters`);
  }
}

if (skillNames.length === 0) problems.push('no skills found');

if (problems.length > 0) {
  for (const problem of problems) console.error(`error: ${problem}`);
  console.error(`\n${problems.length} problem(s) across ${skillNames.length} skill(s)`);
  process.exit(1);
}

console.log(`Checked ${skillNames.length} skill(s), all frontmatter blocks are valid`);
