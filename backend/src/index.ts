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
app.use('/api/pages', pagesRoutes);
app.use('/api/git', gitRoutes);
app.use('/api/search', searchRoutes);

// Serve frontend
const frontendDist = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDist));

import http from 'http';
import https from 'https';
import fs from 'fs';

// ... (rest of the file remains the same until the listen part)

// Catch-all to serve index.html for client-side routing
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

if (config.sslKeyPath && config.sslCertPath) {
  try {
    const options = {
      key: fs.readFileSync(config.sslKeyPath),
      cert: fs.readFileSync(config.sslCertPath),
    };

    https.createServer(options, app).listen(config.port, () => {
      console.log(`HTTPS Server is running on https://localhost:${config.port}`);
    });

    // Create a separate HTTP server to redirect to HTTPS
    const httpApp = express();

    const publicDir = path.join(__dirname, '../public');
    const wellKnownDir = path.join(publicDir, '.well-known');
    console.log(`Serving .well-known from: ${wellKnownDir}`);

    // Serve ACME challenge files for Let's Encrypt
    httpApp.use('/.well-known', express.static(wellKnownDir));

    // Prevent redirect for ACME challenges if file not found
    httpApp.use('/.well-known', (req, res) => {
      res.status(404).send('Not Found');
    });

    httpApp.get(/.*/, (req, res) => {
      res.redirect(`https://localhost:${config.port}` + req.url);
    });

    const httpServerPort = 8000;
    http.createServer(httpApp).listen(httpServerPort, () => {
        console.log(`HTTP redirect server is running on http://localhost:${httpServerPort}`);
    });

  } catch (error) {
    console.error('Could not start HTTPS server.', error);
    console.log('Falling back to HTTP.');
    http.createServer(app).listen(config.port, () => {
      console.log(`Server is running on http://localhost:${config.port}`);
    });
  }
} else {
  http.createServer(app).listen(config.port, () => {
    console.log(`Server is running on http://localhost:${config.port}`);
  });
}
