// routes/contests.js
const express = require('express');
const axios = require('axios');
const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const response = await axios.get('https://codeforces.com/api/contest.list');
        const contests = response.data.result.filter(contest => contest.phase === 'BEFORE');
        res.json(contests);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching contests' });
    }
});

module.exports = router;
