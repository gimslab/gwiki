import express, { Request, Response } from 'express';
import path from 'path';
import { config } from './config';
import authRoutes from './routes/auth';
import pagesRoutes from './routes/pages';
import gitRoutes from './routes/git';
import searchRoutes from './routes/search';
import { authMiddleware } from './middleware/auth';

const app = express();

// JSON body parser middleware
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/pages', authMiddleware, pagesRoutes);
app.use('/api/git', authMiddleware, gitRoutes);
app.use('/api/search', authMiddleware, searchRoutes);

// Serve frontend
const frontendDist = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDist));

// Catch-all to serve index.html for client-side routing
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

app.listen(config.port, () => {
  console.log(`Server is running on http://localhost:${config.port}`);
});
