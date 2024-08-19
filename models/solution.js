// models/solution.js
const mongoose = require('mongoose');

const SolutionSchema = new mongoose.Schema({
    problemId: String,
    username: String,
    solutionText: String,
    date: { type: Date, default: Date.now },
    likes: { type: Number, default: 0 },
    dislikes: { type: Number, default: 0 }
});

const Solution = mongoose.model('Solution', SolutionSchema);

module.exports = Solution;
