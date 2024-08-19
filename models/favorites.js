const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
    username: { type: String, required: true },
    contestId: { type: String, required: true },
    index: { type: String, required: true },
    name: { type: String, required: true },
});

const Favorite = mongoose.model('Favorite', favoriteSchema);

module.exports = Favorite;
