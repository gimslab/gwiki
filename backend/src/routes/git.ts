import { Router, Request, Response } from 'express';
import simpleGit from 'simple-git';
import * as fs from 'fs';
import * as path from 'path';
import { config } from '../config';

const router = Router();
const git = simpleGit(config.dataDirectoryPath);

router.get('/status', async (req: Request, res: Response) => {
  try {
    // First, get status to find untracked files
    let status = await git.status();

    // Register untracked files with git add -N so they can be diffed
    const untrackedFiles = status.not_added.filter(file =>
      status.files.some(f => f.path === file && f.working_dir === '?')
    );

    if (untrackedFiles.length > 0) {
      // git add -N (--intent-to-add) allows diff on new files
      await git.raw(['add', '-N', ...untrackedFiles]);
      // Re-fetch status after adding
      status = await git.status();
    }

    res.json(status);
  } catch (error) {
    console.error('Error getting git status:', error);
    res.status(500).json({ message: 'Error getting git status' });
  }
});

router.get('/status-summary', async (req: Request, res: Response) => {
  try {
    const status = await git.status();
    const changedFilesCount = status.files.length;
    const hasChanges = changedFilesCount > 0;
    res.json({ hasChanges, changedFilesCount });
  } catch (error) {
    console.error('Error getting git status summary:', error);
    res.status(500).json({ message: 'Error getting git status summary' });
  }
});

router.post('/commit', async (req: Request, res: Response) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ message: 'Commit message is required' });
  }

  try {
    const status = await git.status();
    if (status.files.length === 0) {
      return res.status(400).json({ message: 'No changes to commit' });
    }

    await git.add('./*');
    const commitSummary = await git.commit(message);
    res.json(commitSummary);
  } catch (error) {
    console.error('Error committing changes:', error);
    res.status(500).json({ message: 'Error committing changes' });
  }
});

router.get('/diff', async (req: Request, res: Response) => {
  const fileParam = req.query.file as string;

  console.log(`[DEBUG] /diff requested for file param: ${fileParam}`);

  if (!fileParam) {
    console.log('[DEBUG] File path missing');
    return res.status(400).json({ message: 'File path is required' });
  }

  // Decode URI component just in case express doesn't do it automatically for query params (it usually does, but let's be safe)
  // Actually express decodes query params.
  const file = fileParam;

  try {
    const diff = await git.diff(['--', file]);
    console.log(`[DEBUG] Diff success. Length: ${diff.length}`);
    res.json({ diff });
  } catch (error) {
    console.error('Error getting git diff:', error);
    res.status(500).json({ message: 'Error getting git diff', error: String(error) });
  }
});

router.post('/restore', async (req: Request, res: Response) => {
  const { file } = req.body;

  if (!file) {
    return res.status(400).json({ message: 'File path is required' });
  }

  try {
    const status = await git.status();
    const fileStatus = status.files.find(f => f.path === file);

    if (fileStatus && (fileStatus.working_dir === '?' || fileStatus.index === 'A')) {
      // It's a new file (untracked or intent-to-add)
      const filePath = path.join(config.dataDirectoryPath, file);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
    } else {
      // It's a modified or deleted file
      await git.checkout(file);
    }

    res.json({ message: 'File restored successfully' });
  } catch (error) {
    console.error('Error restoring file:', error);
    res.status(500).json({ message: 'Error restoring file' });
  }
});

export default router;
