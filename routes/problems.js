// routes/problems.js
const express = require('express');
const axios = require('axios');
const router = express.Router();

let cachedProblems = [];

router.get('/', async (req, res) => {
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

module.exports = router;
