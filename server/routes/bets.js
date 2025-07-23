import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken } from '../middleware/auth.js';
import { bets, matches, users } from '../data/mockData.js';
import { broadcastToUser } from '../services/websocket.js';

const router = express.Router();

// Get user's bets
router.get('/my', authenticateToken, (req, res) => {
  const userBets = bets.filter(b => b.userId === req.user.id);
  res.json(userBets);
});

// Place a bet
router.post('/place', authenticateToken, (req, res) => {
  try {
    const { matchId, betType, selection, stake, odds } = req.body;
    
    // Validate match
    const match = matches.find(m => m.id === matchId);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }
    
    if (match.status === 'finished') {
      return res.status(400).json({ error: 'Cannot bet on finished match' });
    }
    
    // Check user balance
    if (req.user.balance < stake) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }
    
    // Deduct stake from user balance
    req.user.balance -= stake;
    
    // Create bet
    const bet = {
      id: uuidv4(),
      userId: req.user.id,
      matchId,
      betType,
      selection,
      stake,
      odds,
      potentialWin: parseFloat((stake * odds).toFixed(2)),
      status: 'active',
      placedAt: new Date().toISOString(),
      settledAt: null,
      result: null
    };
    
    bets.push(bet);
    
    // Broadcast notification
    broadcastToUser(req.user.id, {
      type: 'BET_PLACED',
      data: {
        message: `Bet placed successfully on ${match.team1.name} vs ${match.team2.name}`,
        bet
      }
    });
    
    res.status(201).json(bet);
  } catch (error) {
    res.status(500).json({ error: 'Failed to place bet' });
  }
});

// Cash out bet
router.post('/cashout/:id', authenticateToken, (req, res) => {
  try {
    const bet = bets.find(b => b.id === req.params.id && b.userId === req.user.id);
    if (!bet) {
      return res.status(404).json({ error: 'Bet not found' });
    }
    
    if (bet.status !== 'active') {
      return res.status(400).json({ error: 'Bet cannot be cashed out' });
    }
    
    const match = matches.find(m => m.id === bet.matchId);
    if (!match || match.status !== 'live') {
      return res.status(400).json({ error: 'Cash out not available' });
    }
    
    // Calculate cash out amount (usually less than potential win)
    const cashOutAmount = parseFloat((bet.stake * 0.8 + Math.random() * bet.stake * 0.4).toFixed(2));
    
    // Update bet
    bet.status = 'cashed_out';
    bet.settledAt = new Date().toISOString();
    bet.cashOutAmount = cashOutAmount;
    
    // Add to user balance
    req.user.balance += cashOutAmount;
    
    broadcastToUser(req.user.id, {
      type: 'BET_CASHED_OUT',
      data: {
        message: `Bet cashed out for $${cashOutAmount}`,
        bet
      }
    });
    
    res.json(bet);
  } catch (error) {
    res.status(500).json({ error: 'Cash out failed' });
  }
});

// Get bet by ID
router.get('/:id', authenticateToken, (req, res) => {
  const bet = bets.find(b => b.id === req.params.id && b.userId === req.user.id);
  if (!bet) {
    return res.status(404).json({ error: 'Bet not found' });
  }
  
  res.json(bet);
});

export default router;