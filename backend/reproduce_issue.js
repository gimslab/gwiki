const simpleGit = require('simple-git');
const fs = require('fs');
const path = require('path');

async function run() {
    const dir = path.join(__dirname, 'temp_git_test');
    if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
    }
    fs.mkdirSync(dir);

    const git = simpleGit(dir);

    try {
        await git.init();
        await git.addConfig('user.name', 'Test User');
        await git.addConfig('user.email', 'test@example.com');

        const filePath = path.join(dir, 'test.txt');
        fs.writeFileSync(filePath, 'Hello World\nLine 2');

        await git.add('test.txt');
        await git.commit('Initial commit');

        fs.unlinkSync(filePath);

        console.log('File deleted. Running diff...');

        // Try with '--' to separate paths
        console.log('File deleted. Running diff with -- ...');
        const diff = await git.diff(['--', 'test.txt']);
        console.log('Diff result:', diff);
    } catch (e) {
        console.error('Error caught:', e);
    } finally {
        if (fs.existsSync(dir)) {
            fs.rmSync(dir, { recursive: true, force: true });
        }
    }
}

run();
