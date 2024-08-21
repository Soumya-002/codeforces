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

let allProblems = [];

function fetchAllProblems() {
    // Assuming you have an endpoint that fetches all problems
    fetch('https://codeforces.com/api/problemset.problems')
        .then(response => response.json())
        .then(data => {
            allProblems = data.result.problems; // Adjust according to your API response structure
        })
        .catch(error => console.error('Error fetching problems:', error));
}

// Call this function when your server starts to populate allProblems
fetchAllProblems();

app.post('/filter-problems', (req, res) => {
    const { tags, ratings } = req.body;

    let filteredProblems = allProblems; // Start with all problems

    // Filter by tags if any tags are selected
    if (tags && tags.length > 0) {
        filteredProblems = filteredProblems.filter(problem => 
            tags.every(tag => problem.tags.includes(tag))
        );
    }

    // Filter by ratings if any ratings are selected
    if (ratings && ratings.length > 0) {
        filteredProblems = filteredProblems.filter(problem => 
            ratings.includes(String(problem.rating))
        );
    }

    res.json(filteredProblems); // Return the filtered problems
});




app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
