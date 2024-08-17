const express = require('express');
const axios = require('axios');
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));


mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB:', err));

// Define a schema for solutions
const solutionSchema = new mongoose.Schema({
    username: String,
    problemId: String,
    solutionText: String,
    date: { type: Date, default: Date.now }
});

// Create a model from the schema
const Solution = mongoose.model('Solution', solutionSchema);

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
        // Load problems from cache or API
        if (cachedProblems.length === 0) {
            const response = await axios.get('https://codeforces.com/api/problemset.problems');
            cachedProblems = response.data.result.problems;
        }

        // Filter by tags if provided
        let filteredProblems = cachedProblems;
        if (tags) {
            const tagArray = tags.split(',');
            filteredProblems = filteredProblems.filter(problem =>
                tagArray.every(tag => problem.tags.includes(tag))
            );
        }

        // Filter by ratings if provided
        if (ratings) {
            const ratingArray = ratings.split(',').map(Number);
            filteredProblems = filteredProblems.filter(problem => {
                const rating = Number(problem.rating);
                const hasRating = ratingArray.includes(rating);
                console.log('Problem rating:', rating, 'Has rating:', hasRating);
                return hasRating;
            });
        }

        // Pagination
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



app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
