// server.js
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
app.use(cors({
    origin: 'https://66cc7bc037ef60528656a0c1--jocular-sopapillas-a9a03a.netlify.app',
  }));

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

let problems = [];

function fetchAllProblems() {
    // Assuming you have an endpoint that fetches all problems
    fetch('https://codeforces.com/api/problemset.problems')
        .then(response => response.json())
        .then(data => {
            problems = data.result.problems; // Adjust according to your API response structure
        })
        .catch(error => console.error('Error fetching problems:', error));
}

// Call this function when your server starts to populate allProblems
fetchAllProblems();

app.post('/filter-problems', (req, res) => {
    const { tags, ratings, page, pageSize } = req.body;
    let filteredProblems = problems;

    // Filter problems based on tags
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

    // Pagination
    const totalProblems = filteredProblems.length;
    const totalPages = Math.ceil(totalProblems / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const problemsToSend = filteredProblems.slice(startIndex, endIndex);

    res.json({
        problems: problemsToSend,
        totalPages: totalPages
    });
});





app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
