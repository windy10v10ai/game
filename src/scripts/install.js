const assert = require('assert');
const fs = require('fs-extra');
const path = require('path');
const { getAddonName, getDotaPath } = require('./utils');
const readline = require('readline');

async function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) =>
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    }),
  );
}

(async () => {
  // find dota path
  const dotaPath = await getDotaPath();
  if (dotaPath === undefined) {
    console.log('No Dota 2 installation found. Addon linking is skipped.');
    return;
  }

  for (const directoryName of ['game', 'content']) {
    const sourcePath = path.resolve(__dirname, '../..', directoryName);
    const targetPath = path.join(dotaPath, directoryName, 'dota_addons', getAddonName());

    if (fs.existsSync(targetPath)) {
      const isCorrect =
        fs.lstatSync(sourcePath).isSymbolicLink() && fs.realpathSync(sourcePath) === targetPath;
      if (isCorrect) {
        console.log(`Skipping '${sourcePath}' since it is already linked to '${targetPath}'`);
        continue;
      } else {
        // throw new Error(`'${targetPath}' is already linked to another directory`);
        // ask user to delete it for install
        const answer = await askQuestion(
          `'${targetPath}' already exists, do you want to delete it to continue? (y/n) `,
        );
        if (answer.toLowerCase() === 'y') {
          fs.removeSync(targetPath);
          console.log(`Deleted ${targetPath}`);
        } else {
          throw new Error(`'${targetPath}' is already linked to another directory`);
        }
      }
    }

    fs.copySync(sourcePath, targetPath);
    fs.removeSync(sourcePath);
    fs.symlinkSync(targetPath, sourcePath, 'junction');
    console.log(`Linked ${sourcePath} <==> ${targetPath}`);
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
