const express = require('express');
const Favorite = require('../models/favorites'); // Import the Mongoose model
const router = express.Router();

router.post('/', async (req, res) => {
    const { username, problem } = req.body;

    if (!username || !problem) {
        return res.status(400).json({ error: 'Username and problem are required' });
    }

    try {
        const existingFavorite = await Favorite.findOne({
            username: username,
            contestId: problem.contestId,
            index: problem.index,
        });

        if (existingFavorite) {
            await existingFavorite.deleteOne();
            res.status(200).json({ message: 'Problem removed from favorites' });
        } else {
            const newFavorite = new Favorite({
                username: username,
                contestId: problem.contestId,
                index: problem.index,
                name: problem.name,
            });
            await newFavorite.save();
            res.status(200).json({ message: 'Problem added to favorites' });
        }
    } catch (error) {
        console.error('Error managing favorites:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/get-favorites/:username', async (req, res) => {
    const { username } = req.params;

    try {
        const favorites = await Favorite.find({ username: username });
        if (favorites.length === 0) {
            return res.status(404).json({ error: 'No favorites found for this user' });
        }
        res.status(200).json(favorites);
    } catch (error) {
        console.error('Error fetching favorites:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
