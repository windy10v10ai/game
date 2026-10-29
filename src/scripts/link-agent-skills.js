const fs = require('fs');
const path = require('path');

// Claude Code only reads .claude/skills, while Codex and DSH discover repo skills at
// .agents/skills. Link the two so every tool shares one copy instead of drifting duplicates.
const repoRoot = path.resolve(__dirname, '..', '..');
const skillsDir = path.join(repoRoot, '.claude', 'skills');
const agentsDir = path.join(repoRoot, '.agents');
const linkPath = path.join(agentsDir, 'skills');

if (!fs.existsSync(skillsDir)) {
  console.error(`${skillsDir} does not exist`);
  process.exit(1);
}

let existing = null;
try {
  existing = fs.lstatSync(linkPath);
} catch {
  // No link yet, which is the normal first run.
}

if (existing !== null) {
  const current = existing.isSymbolicLink() ? fs.realpathSync(linkPath) : null;
  if (current === fs.realpathSync(skillsDir)) {
    console.log(`Link already exists: ${linkPath}`);
    process.exit(0);
  }
  console.error(
    current === null
      ? `${linkPath} is a real directory, remove it before running this script`
      : `${linkPath} points to ${current}, remove that link before running this script`,
  );
  process.exit(1);
}

fs.mkdirSync(agentsDir, { recursive: true });
if (process.platform === 'win32') {
  fs.symlinkSync(skillsDir, linkPath, 'junction');
} else {
  fs.symlinkSync(path.relative(agentsDir, skillsDir), linkPath, 'dir');
}

console.log(`Created ${linkPath} -> ${skillsDir}`);
console.log('Codex and DSH will pick these skills up on their next catalog refresh; the link is not tracked.');
