import { Router, Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { config } from '../config';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const files = await fs.readdir(config.dataDirectoryPath);
    const pages = files
      .filter((file) => file.endsWith('.md'))
      .map((file) => file.replace(/\.md$/, ''));
    res.json(pages);
  } catch (error) {
    console.error('Error reading data directory:', error);
    res.status(500).json({ message: 'Error reading wiki pages' });
  }
});

router.get('/:pageName', async (req: Request, res: Response) => {
  const { pageName } = req.params;
  const filePath = path.join(config.dataDirectoryPath, `${pageName}.md`);

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    res.send(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.status(404).json({ message: 'Page not found' });
    } else {
      console.error(`Error reading page ${pageName}:`, error);
      res.status(500).json({ message: 'Error reading wiki page' });
    }
  }
});

router.post('/', async (req: Request, res: Response) => {
  const { pageName, content } = req.body;

  if (!pageName || content === undefined) {
    return res.status(400).json({ message: 'pageName and content are required' });
  }

  const filePath = path.join(config.dataDirectoryPath, `${pageName}.md`);

  try {
    await fs.writeFile(filePath, content, { flag: 'wx' });
    res.status(201).json({ message: 'Page created successfully' });
  } catch (error) {
    if (error.code === 'EEXIST') {
      res.status(409).json({ message: 'Page already exists' });
    } else {
      console.error(`Error creating page ${pageName}:`, error);
      res.status(500).json({ message: 'Error creating wiki page' });
    }
  }
});

router.put('/:pageName', async (req: Request, res: Response) => {
  const { pageName } = req.params;
  const { content } = req.body;

  if (content === undefined) {
    return res.status(400).json({ message: 'content is required' });
  }

  const filePath = path.join(config.dataDirectoryPath, `${pageName}.md`);

  try {
    // Check if file exists
    await fs.access(filePath);
    // File exists, so write to it
    await fs.writeFile(filePath, content);
    res.json({ message: 'Page updated successfully' });
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.status(404).json({ message: 'Page not found' });
    } else {
      console.error(`Error updating page ${pageName}:`, error);
      res.status(500).json({ message: 'Error updating wiki page' });
    }
  }
});

router.delete('/:pageName', async (req: Request, res: Response) => {
  const { pageName } = req.params;
  const filePath = path.join(config.dataDirectoryPath, `${pageName}.md`);

  try {
    await fs.unlink(filePath);
    res.json({ message: 'Page deleted successfully' });
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.status(404).json({ message: 'Page not found' });
    } else {
      console.error(`Error deleting page ${pageName}:`, error);
      res.status(500).json({ message: 'Error deleting wiki page' });
    }
  }
});

export default router;
