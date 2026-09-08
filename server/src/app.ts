import express from 'express';
import cors from 'cors';
import prisma from './lib/prisma';
import userRoutes from './routes/user.routes';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'focusly-server'
    });
});

app.get('/health/db', async (req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;

        res.json({
            status: 'ok',
            database: 'connected'
        });
    } catch (error) {
        console.error('Database connection error:', error);

        res.status(500).json({
            status: 'error',
            database: 'disconnected'
        });
    }
});

app.use('/users', userRoutes);

export default app;