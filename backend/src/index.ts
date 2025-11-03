import express, { Request, Response } from 'express';
import { config } from './config';
import authRoutes from './routes/auth';

const app = express();

// JSON body parser middleware
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

app.get('/', (req: Request, res: Response) => {
  res.send('gwiki API server is running!');
});

app.listen(config.port, () => {
  console.log(`Server is running on http://localhost:${config.port}`);
});
