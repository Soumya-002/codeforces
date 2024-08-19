// routes/recommendations.js
const express = require('express');
const axios = require('axios');
const router = express.Router();

const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

router.get('/', async (req, res) => {
    const { username } = req.query;

    if (!username) {
        return res.status(400).json({ error: 'Username is required' });
    }

    try {
        const userResponse = await axios.get(`https://codeforces.com/api/user.info?handles=${username}`);
        const userRating = userResponse.data.result[0].rating;

        const problemResponse = await axios.get('https://codeforces.com/api/problemset.problems');
        let problems = problemResponse.data.result.problems;

        problems = problems.filter(problem => problem.rating && problem.rating >= userRating);

        const groupedProblems = problems.reduce((acc, problem) => {
            const rating = problem.rating;
            if (!acc[rating]) {
                acc[rating] = [];
            }
            acc[rating].push(problem);
            return acc;
        }, {});

        const recommendedProblems = Object.values(groupedProblems)
            .map(group => shuffleArray(group).slice(0, 20))
            .flat();

        recommendedProblems.sort((a, b) => a.rating - b.rating);

        res.json(recommendedProblems);
    } catch (error) {
        console.error('Error fetching recommendations:', error);
        res.status(500).json({ error: 'Error fetching recommendations' });
    }
});

module.exports = router;
