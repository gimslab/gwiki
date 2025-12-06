const simpleGit = require('simple-git');
const fs = require('fs');
const path = require('path');
const config = { dataDirectoryPath: '/home/gim/projects/gwiki/gwiki-data' };

async function run() {
    const git = simpleGit(config.dataDirectoryPath);

    // Set config just in case
    await git.addConfig('user.name', 'Tester', false, 'global');
    await git.addConfig('user.email', 'tester@example.com', false, 'global');

    const filePath = path.join(config.dataDirectoryPath, 'verify_deletion.md');
    fs.writeFileSync(filePath, 'This is content that should be visible after deletion.');

    await git.add('verify_deletion.md');
    await git.commit('Add verification file');

    fs.unlinkSync(filePath);
    console.log('Setup complete: verify_deletion.md created, committed, and deleted.');
}

run();
