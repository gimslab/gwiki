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
    const targetFiles = files.filter((file) => file.endsWith('.md') || file.endsWith('.moniwiki'));

    const results = [];
    for (const file of targetFiles) {
      const filePath = path.join(config.dataDirectoryPath, file);
      const stats = await fs.stat(filePath); // Get file stats
      if (!stats.isFile()) { // Skip if it's not a file
        continue;
      }
      const content = await fs.readFile(filePath, 'utf-8');
      const fileName = file.toLowerCase();
      if (fileName.includes(q.toLowerCase()) || content.toLowerCase().includes(q.toLowerCase())) {
        results.push(file);
      }
    }

    res.json(results);
  } catch (error) {
    console.error('Error searching pages:', error);
    if (error instanceof Error) {
      res.status(500).json({ message: 'Error searching pages', error: error.message });
    } else {
      res.status(500).json({ message: 'Error searching pages', error: String(error) });
    }
  }
});

export default router;
