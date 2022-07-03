const assert = require("assert");
const fs = require("fs-extra");
const path = require("path");
const { getAddonName, getDotaPath } = require("./utils");
const readline = require('readline');

(async () => {
    // find dota path
    const dotaPath = await getDotaPath();
    if (dotaPath === undefined) {
        console.log("No Dota 2 installation found. Addon linking is skipped.");
        return;
    }

    for (const directoryName of ["game", "content"]) {
        const sourcePath = path.join(dotaPath, directoryName, "dota_addons", getAddonName());
        const targetPath = path.resolve(__dirname, "../..", directoryName);
        console.log(`sourcePath '${sourcePath}'`);

        if (fs.existsSync(sourcePath)) {
            const isCorrect = fs.lstatSync(sourcePath).isSymbolicLink() && fs.realpathSync(sourcePath) === targetPath;
            if (isCorrect) {
                console.log(`Skipping '${sourcePath}' since it is already linked`);
                continue;
            } else {
                fs.removeSync(sourcePath);
                console.log(`Removed existing directory '${sourcePath}'`);
            }
        }

        fs.symlinkSync(targetPath, sourcePath, "junction");
        console.log(`Linked ${sourcePath} <==> ${targetPath}`);
    }
})().catch(error => {
    console.error(error);
    process.exit(1);
});
