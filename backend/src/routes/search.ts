import { Router, Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { config } from '../config';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const { q } = req.query;

  if (!q || typeof q !== 'string') {
    return res.status(400).json({ message: 'Query parameter "q" is required' });
  }

  try {
    const files = await fs.readdir(config.dataDirectoryPath);
    const mdFiles = files.filter((file) => file.endsWith('.md'));

    const results = [];
    for (const file of mdFiles) {
      const filePath = path.join(config.dataDirectoryPath, file);
      const content = await fs.readFile(filePath, 'utf-8');
      if (content.toLowerCase().includes(q.toLowerCase())) {
        results.push(file.replace(/\.md$/, ''));
      }
    }

    res.json(results);
  } catch (error) {
    console.error('Error searching pages:', error);
    res.status(500).json({ message: 'Error searching pages' });
  }
});

export default router;
