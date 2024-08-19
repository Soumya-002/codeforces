const express = require('express');
const Solution = require('../models/solution');
const router = express.Router();

router.post('/submit', async (req, res) => {
    const { username, problemId, solutionText } = req.body;
    if (!username || !problemId || !solutionText) {
        return res.status(400).json({ success: false, message: 'All fields are required.' });
    }
    try {
        const newSolution = new Solution({ username, problemId, solutionText });
        await newSolution.save();
        res.json({ success: true, message: 'Solution submitted successfully!' });
    } catch (error) {
        console.error('Error submitting solution:', error);
        res.status(500).json({ success: false, message: 'Failed to submit solution.' });
    }
});

router.get('/', async (req, res) => {
    try {
        const solutions = await Solution.find().sort({ date: -1 });
        res.json(solutions);
    } catch (error) {
        console.error('Error fetching solutions:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch solutions.' });
    }
});

router.post('/like/:id', async (req, res) => {
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

router.post('/dislike/:id', async (req, res) => {
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

module.exports = router;
