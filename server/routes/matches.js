import express from 'express';
import { matches } from '../data/mockData.js';

const router = express.Router();

// Get all matches
router.get('/', (req, res) => {
  const { status } = req.query;
  
  let filteredMatches = matches;
  if (status) {
    filteredMatches = matches.filter(m => m.status === status);
  }
  
  res.json(filteredMatches);
});

// Get match by ID
router.get('/:id', (req, res) => {
  const match = matches.find(m => m.id === req.params.id);
  if (!match) {
    return res.status(404).json({ error: 'Match not found' });
  }
  
  res.json(match);
});

// Get live matches
router.get('/status/live', (req, res) => {
  const liveMatches = matches.filter(m => m.status === 'live');
  res.json(liveMatches);
});

export default router;