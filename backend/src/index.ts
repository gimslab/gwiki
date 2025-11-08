import express, { Request, Response } from 'express';
import { config } from './config';
import authRoutes from './routes/auth';
import pagesRoutes from './routes/pages';
import gitRoutes from './routes/git';
import searchRoutes from './routes/search';
import { authMiddleware } from './middleware/auth';

const app = express();

// JSON body parser middleware
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/pages', authMiddleware, pagesRoutes);
app.use('/api/git', authMiddleware, gitRoutes);
app.use('/api/search', authMiddleware, searchRoutes);

app.get('/', (req: Request, res: Response) => {
  res.send('gwiki API server is running!');
});

app.listen(config.port, () => {
  console.log(`Server is running on http://localhost:${config.port}`);
});
