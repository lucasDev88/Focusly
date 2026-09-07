import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'focusly-server'
    })
});

app.listen(PORT, () => {
    console.log(`Focusly Server running on http://localhost:${PORT}`)
})