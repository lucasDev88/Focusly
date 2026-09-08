import app from './app';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Focusly Server running on http://localhost:${PORT}`);
});