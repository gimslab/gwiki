import { Router, Request, Response } from 'express';
import simpleGit from 'simple-git';
import { config } from '../config';

const router = Router();
const git = simpleGit(config.dataDirectoryPath);

router.get('/status', async (req: Request, res: Response) => {
  try {
    const status = await git.status();
    res.json(status);
  } catch (error) {
    console.error('Error getting git status:', error);
    res.status(500).json({ message: 'Error getting git status' });
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

export default router;
