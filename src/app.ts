import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import 'dotenv/config';

import { env } from './config/env.js';
import { testConnection } from './config/database.js';
import routes from './routes/index.js';
import { notFoundHandler, globalErrorHandler } from './middleware/error-handler.js';

// Use process.cwd() for uploads path since we're in ESM
const uploadsPath = path.join(process.cwd(), 'uploads');

const app = express();

// Security middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS configuration
app.use(cors({
    origin: env.FRONTEND_URL,
    credentials: true,
}));

// Request logging
if (env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploads
app.use('/uploads', express.static(uploadsPath));

// API routes
app.use('/api', routes);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'FKMB UNESA API Server',
        version: '1.0.0',
        documentation: '/api/health',
    });
});

// Error handling
app.use(notFoundHandler);
app.use(globalErrorHandler);

// Start server
const PORT = parseInt(env.PORT);

async function startServer() {
    // Test database connection
    const dbConnected = await testConnection();

    if (!dbConnected) {
        console.error('❌ Failed to connect to database. Exiting...');
        process.exit(1);
    }

    app.listen(PORT, () => {
        console.log(`
╔════════════════════════════════════════════════════════╗
║                                                        ║
║   🚀 FKMB UNESA API Server                            ║
║                                                        ║
║   Server running on: http://localhost:${PORT}            ║
║   Environment: ${env.NODE_ENV.padEnd(11)}                        ║
║   API Base URL: http://localhost:${PORT}/api             ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
    `);
    });
}

startServer();

export default app;
