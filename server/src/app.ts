import express from 'express';
import cors from 'cors';
import prisma from './lib/prisma';
import userRoutes from './routes/user.routes';
import subjectRoutes from './routes/subject.routes';
import sessionRoutes from './routes/session.routes'
import goalRoutes from './routes/goal.routes'

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

app.use('/subjects', subjectRoutes);

app.use('/sessions', sessionRoutes)

app.use('/goals', goalRoutes)

export default app;