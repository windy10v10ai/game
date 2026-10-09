const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const source = path.join(root, '.agents', 'skills');
const link = path.join(root, '.claude', 'skills');
const args = process.argv.slice(2);

try {
  if (args.some((arg) => arg !== '--junction') || args.length > 1) {
    throw new Error('Usage: node scripts/link-skills.js [--junction]');
  }
  const junction = args.includes('--junction');
  if (junction && process.platform !== 'win32') {
    throw new Error('--junction is supported only on Windows. Omit it to create a symlink.');
  }
  if (!fs.statSync(source).isDirectory()) {
    throw new Error('Expected the shared skill directory at .agents/skills.');
  }

  let existing;
  try {
    existing = fs.lstatSync(link);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  if (existing) {
    if (!existing.isSymbolicLink() || fs.realpathSync(link) !== fs.realpathSync(source)) {
      throw new Error(
        '.claude/skills already exists and does not link to .agents/skills. Preserve its contents before replacing it.',
      );
    }
    console.log(`Existing skill link: ${fs.readlinkSync(link)}`);
  } else {
    fs.mkdirSync(path.dirname(link), { recursive: true });
    fs.symlinkSync(junction ? source : '../.agents/skills', link, junction ? 'junction' : 'dir');
    console.log(
      `Created ${junction ? 'Windows junction' : 'relative symlink'}: .claude/skills -> .agents/skills`,
    );
  }
} catch (error) {
  console.error(error.message);
  if (process.platform === 'win32' && ['EPERM', 'EACCES'].includes(error.code)) {
    console.error(
      'Enable Windows Developer Mode or run with symlink privileges, then retry. Alternatively, explicitly use: node scripts/link-skills.js --junction',
    );
  }
  process.exitCode = 1;
}
