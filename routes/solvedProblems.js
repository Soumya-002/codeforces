// routes/solvedProblems.js
const express = require('express');
const axios = require('axios');
const router = express.Router();

router.post('/', async (req, res) => {
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

module.exports = router;
