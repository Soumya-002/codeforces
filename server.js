const express = require('express');
const axios = require('axios');
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
// const favoriteRoutes = require('./public/routes/favourite');

dotenv.config();

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB:', err));

// Define a schema for solutions
const SolutionSchema = new mongoose.Schema({
    problemId: String,
    username: String,
    solutionText: String,
    date: { type: Date, default: Date.now },
    likes: { type: Number, default: 0 },
    dislikes: { type: Number, default: 0 }
});

// Create a model from the schema
const Solution = mongoose.model('Solution', SolutionSchema);

// Route to handle solution submission
app.post('/submit-solution', async (req, res) => {
    const { username, problemId, solutionText } = req.body;

    if (!username || !problemId || !solutionText) {
        return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    try {
        const newSolution = new Solution({
            username,
            problemId,
            solutionText // Store the submitted code here
        });

        await newSolution.save();

        res.json({ success: true, message: 'Solution submitted successfully!' });
    } catch (error) {
        console.error('Error submitting solution:', error);
        res.status(500).json({ success: false, message: 'Failed to submit solution.' });
    }
});

let cachedProblems = [];

app.get('/problems', async (req, res) => {
    const { page = 1, limit = 50, tags = '', ratings = '' } = req.query;
    const offset = (page - 1) * limit;

    try {
        if (cachedProblems.length === 0) {
            const response = await axios.get('https://codeforces.com/api/problemset.problems');
            cachedProblems = response.data.result.problems;
        }

        let filteredProblems = cachedProblems;
        if (ratings) {
            const ratingArray = ratings.split(',').map(Number);
            filteredProblems = filteredProblems.filter(problem => {
                const rating = Number(problem.rating);
                return ratingArray.includes(rating);
            });
        }

        const paginatedProblems = filteredProblems.slice(offset, offset + parseInt(limit));

        res.json({
            problems: paginatedProblems,
            totalProblems: filteredProblems.length,
        });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching problems' });
    }
});

app.post('/solved-problems', async (req, res) => {
    const { username } = req.body;

    if (!username) {
        return res.status(400).json({ error: 'Username is required' });
    }

    try {
        const response = await axios.get(`https://codeforces.com/api/user.status?handle=${username}`);
        const solvedProblems = response.data.result
            .filter(submission => submission.verdict === 'OK')
            .map(submission => ({
                contestId: submission.problem.contestId,
                index: submission.problem.index,
            }));

        res.json(solvedProblems);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching solved problems' });
    }
});

app.get('/get-solutions', async (req, res) => {
    try {
        const solutions = await Solution.find().sort({ date: -1 });
        res.json(solutions);
    } catch (error) {
        console.error('Error fetching solutions:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch solutions.' });
    }
});

app.post('/like-solution/:id', async (req, res) => {
    const solutionId = req.params.id;
    try {
        const updatedSolution = await Solution.findByIdAndUpdate(
            solutionId,
            { $inc: { likes: 1 } },
            { new: true }
        );

        if (!updatedSolution) {
            return res.status(404).json({ error: 'Solution not found' });
        }

        res.json({ likes: updatedSolution.likes });
    } catch (error) {
        console.error('Error updating likes:', error);
        res.status(500).json({ error: 'An error occurred while liking the solution' });
    }
});

app.post('/dislike-solution/:id', async (req, res) => {
    const solutionId = req.params.id;
    try {
        const updatedSolution = await Solution.findByIdAndUpdate(
            solutionId,
            { $inc: { dislikes: 1 } },
            { new: true }
        );

        if (!updatedSolution) {
            return res.status(404).json({ error: 'Solution not found' });
        }

        res.json({ dislikes: updatedSolution.dislikes });
    } catch (error) {
        console.error('Error updating dislikes:', error);
        res.status(500).json({ error: 'An error occurred while disliking the solution' });
    }
});

// Mount user and favorites routes
// app.use('/api/favorites', favoriteRoutes);

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

app.get('/recommendations', async (req, res) => {
    const { username } = req.query;

    if (!username) {
        return res.status(400).json({ error: 'Username is required' });
    }

    try {
        // Fetch user rating
        const userResponse = await axios.get(`https://codeforces.com/api/user.info?handles=${username}`);
        const userRating = userResponse.data.result[0].rating;
        console.log(userRating);

        // Fetch problems
        const problemResponse = await axios.get('https://codeforces.com/api/problemset.problems');
        let problems = problemResponse.data.result.problems;

        // Filter problems based on user rating
        problems = problems.filter(problem => problem.rating && problem.rating >= userRating);

        // Group problems by their rating and shuffle each group
        const groupedProblems = problems.reduce((acc, problem) => {
            const rating = problem.rating;
            if (!acc[rating]) {
                acc[rating] = [];
            }
            acc[rating].push(problem);
            return acc;
        }, {});

        // Shuffle each group and limit to 20 problems per rating
        const recommendedProblems = Object.values(groupedProblems)
            .map(group => shuffleArray(group).slice(0, 20))
            .flat();

        // Sort the recommended problems by rating in increasing order
        recommendedProblems.sort((a, b) => a.rating - b.rating);

        res.json(recommendedProblems);
    } catch (error) {
        console.error('Error fetching recommendations:', error);
        res.status(500).json({ error: 'Error fetching recommendations' });
    }
});

app.get('/upcoming-contests', async (req, res) => {
    try {
        const response = await axios.get('https://codeforces.com/api/contest.list');
        const contests = response.data.result.filter(contest => contest.phase === 'BEFORE');
        res.json(contests);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching contests' });
    }
});

let favoriteProblems = {}; // In-memory storage for simplicity

app.post('/toggle-favorite', (req, res) => {
    const { username, problem } = req.body;

    if (!username || !problem) {
        return res.status(400).json({ error: 'Username and problem are required' });
    }

    if (!favoriteProblems[username]) {
        favoriteProblems[username] = [];
    }

    const userFavorites = favoriteProblems[username];
    const problemIndex = userFavorites.findIndex(
        fav => fav.contestId === problem.contestId && fav.index === problem.index
    );

    if (problemIndex !== -1) {
        userFavorites.splice(problemIndex, 1); // Remove from favorites
        res.status(200).json({ message: 'Problem removed from favorites' });
    } else {
        userFavorites.push(problem); // Add to favorites
        res.status(200).json({ message: 'Problem added to favorites' });
    }
});

// Get favorite problems route
app.get('/get-favorites/:username', (req, res) => {
    const { username } = req.params;

    if (!username || !favoriteProblems[username]) {
        return res.status(404).json({ error: 'No favorites found for this user' });
    }

    res.status(200).json(favoriteProblems[username]);
});



app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
