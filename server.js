// server.js
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

connectDB();

// Mount routes
app.use('/problems', require('./routes/problems'));
app.use('/solved-problems', require('./routes/solvedProblems'));
app.use('/solutions', require('./routes/solutions'));
app.use('/recommendations', require('./routes/recommendations'));
app.use('/upcoming-contests', require('./routes/contests'));
app.use('/favorites', require('./routes/favorites'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
