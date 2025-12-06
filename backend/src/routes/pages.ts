import { Router, Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { config } from '../config';

const router = Router();

/**
 * Safely constructs a file path from a user-provided page name,
 * ensuring it remains within the configured data directory.
 * @param pageName The page name from the user request.
 * @returns The resolved, safe file path.
 * @throws An error if a path traversal attempt is detected.
 */
function getSafePath(pageName: string): string {
  const resolvedDataDirPath = path.resolve(config.dataDirectoryPath);
  const resolvedFilePath = path.resolve(path.join(config.dataDirectoryPath, pageName));

  // Ensure the resolved path is within the data directory
  if (!resolvedFilePath.startsWith(resolvedDataDirPath + path.sep) && resolvedFilePath !== resolvedDataDirPath) {
    throw new Error('Path traversal attempt detected');
  }

  return resolvedFilePath;
}

router.get('/', async (req: Request, res: Response) => {
  try {
    const files = await fs.readdir(config.dataDirectoryPath);
    const pageFiles = files.filter((file) => file.endsWith('.md') || file.endsWith('.moniwiki'));

    const pagesWithStats = await Promise.all(pageFiles.map(async (file) => {
      const filePath = getSafePath(file);
      const stats = await fs.stat(filePath);
      return { name: file, mtimeMs: stats.mtimeMs };
    }));

    pagesWithStats.sort((a, b) => b.mtimeMs - a.mtimeMs);

    res.json(pagesWithStats.slice(0, 50).map(page => page.name));
  } catch (error) {
    console.error('Error reading data directory:', error);
    res.status(500).json({ message: 'Error reading wiki pages' });
  }
});

router.get('/all', async (req: Request, res: Response) => {
  try {
    const files = await fs.readdir(config.dataDirectoryPath);
    const pageFiles = files.filter((file) => file.endsWith('.md') || file.endsWith('.moniwiki'));
    
    pageFiles.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

    res.json(pageFiles);
  } catch (error) {
    console.error('Error reading data directory:', error);
    res.status(500).json({ message: 'Error reading wiki pages' });
  }
});

router.get('/exists/:pageName', async (req: Request, res: Response) => {
  const { pageName } = req.params;
  const baseName = pageName.split('.').slice(0, -1).join('.');
  const currentExt = pageName.split('.').pop();

  if (!baseName || !currentExt) {
    return res.status(400).json({ exists: false, message: 'Invalid page name' });
  }

  const otherExt = currentExt === 'md' ? 'moniwiki' : 'md';
  const otherFileName = `${baseName}.${otherExt}`;
  
  try {
    const filePath = getSafePath(otherFileName);
    await fs.access(filePath);
    res.json({ exists: true, fileName: otherFileName });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Path traversal')) {
      return res.status(400).json({ exists: false, message: 'Invalid page name' });
    }
    res.json({ exists: false });
  }
});

router.get('/:pageName', async (req: Request, res: Response) => {
  const { pageName: encodedPageName } = req.params;
  const pageName = decodeURIComponent(encodedPageName);
  
  try {
    const filePath = getSafePath(pageName);
    const content = await fs.readFile(filePath, 'utf-8');
    res.send(content);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Path traversal')) {
      return res.status(400).json({ message: 'Invalid page name' });
    }
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
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

  try {
    const filePath = getSafePath(pageName);
    await fs.writeFile(filePath, content, { flag: 'wx' });
    res.status(201).json({ message: 'Page created successfully' });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Path traversal')) {
      return res.status(400).json({ message: 'Invalid page name' });
    }
    if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
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

  try {
    const filePath = getSafePath(pageName);
    // Check if file exists
    await fs.access(filePath);
    // File exists, so write to it
    await fs.writeFile(filePath, content);
    res.json({ message: 'Page updated successfully' });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Path traversal')) {
      return res.status(400).json({ message: 'Invalid page name' });
    }
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      res.status(404).json({ message: 'Page not found' });
    } else {
      console.error(`Error updating page ${pageName}:`, error);
      res.status(500).json({ message: 'Error updating wiki page' });
    }
  }
});

router.delete('/:pageName', async (req: Request, res: Response) => {
  const { pageName } = req.params;

  try {
    const filePath = getSafePath(pageName);
    await fs.unlink(filePath);
    res.json({ message: 'Page deleted successfully' });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Path traversal')) {
      return res.status(400).json({ message: 'Invalid page name' });
    }
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      res.status(404).json({ message: 'Page not found' });
    } else {
      console.error(`Error deleting page ${pageName}:`, error);
      res.status(500).json({ message: 'Error deleting wiki page' });
    }
  }
});

router.post('/convert-moniwiki', async (req: Request, res: Response) => {
  const { originalFileName, newFileName, markdownContent } = req.body;

  if (!originalFileName || !newFileName || markdownContent === undefined) {
    return res.status(400).json({ message: 'originalFileName, newFileName, and markdownContent are required' });
  }

  try {
    const newFilePath = getSafePath(newFileName);

    // Check if the new file already exists to prevent overwriting
    await fs.access(newFilePath)
      .then(() => {
        // If access succeeds, file exists
        return res.status(409).json({ message: `Markdown file '${newFileName}' already exists.` });
      })
      .catch(async (error) => {
        // If access fails with ENOENT, file does not exist, so proceed to write
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          await fs.writeFile(newFilePath, markdownContent);
          res.status(201).json({ message: `Page '${originalFileName}' converted to Markdown successfully as '${newFileName}'` });
        } else {
          // Other errors during access check
          console.error(`Error checking existence of new file ${newFileName}:`, error);
          res.status(500).json({ message: 'Error during file conversion process' });
        }
      });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Path traversal')) {
      return res.status(400).json({ message: 'Invalid file name' });
    }
    console.error(`Error converting Moniwiki file ${originalFileName} to Markdown:`, error);
    res.status(500).json({ message: 'Error converting Moniwiki file to Markdown' });
  }
});

export default router;
