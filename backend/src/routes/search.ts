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

    const filenameMatches: string[] = [];
    const contentMatches: string[] = [];
    const queryLower = q.toLowerCase();

    for (const file of targetFiles) {
      const filePath = path.join(config.dataDirectoryPath, file);
      const stats = await fs.stat(filePath);
      if (!stats.isFile()) {
        continue;
      }
      
      const fileNameLower = file.toLowerCase();
      if (fileNameLower.includes(queryLower)) {
        filenameMatches.push(file);
      } else {
        const content = await fs.readFile(filePath, 'utf-8');
        if (content.toLowerCase().includes(queryLower)) {
          contentMatches.push(file);
        }
      }
    }

    res.json({ filenameMatches, contentMatches });
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
