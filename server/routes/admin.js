import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { matches, bets, users, walletTransactions } from '../data/mockData.js';
import { broadcastToAll } from '../services/websocket.js';

const router = express.Router();

// Get admin dashboard stats
router.get('/stats', authenticateToken, requireAdmin, (req, res) => {
  const totalUsers = users.length;
  const totalBets = bets.length;
  const totalVolume = bets.reduce((sum, bet) => sum + bet.stake, 0);
  const activeBets = bets.filter(b => b.status === 'active').length;
  const liveMatches = matches.filter(m => m.status === 'live').length;
  
  res.json({
    totalUsers,
    totalBets,
    totalVolume: parseFloat(totalVolume.toFixed(2)),
    activeBets,
    liveMatches,
    totalMatches: matches.length
  });
});

// Get all users
router.get('/users', authenticateToken, requireAdmin, (req, res) => {
  const safeUsers = users.map(u => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    balance: u.balance,
    createdAt: u.createdAt
  }));
  
  res.json(safeUsers);
});

// Get all bets
router.get('/bets', authenticateToken, requireAdmin, (req, res) => {
  res.json(bets);
});

// Resolve match manually
router.post('/resolve-match/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { winner, margin, marginType } = req.body;
    const match = matches.find(m => m.id === req.params.id);
    
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }
    
    // Update match
    match.status = 'finished';
    match.result = { winner, margin, marginType };
    match.lastUpdate = new Date().toISOString();
    
    // Settle related bets
    const matchBets = bets.filter(b => b.matchId === match.id && b.status === 'active');
    
    matchBets.forEach(bet => {
      let won = false;
      
      switch (bet.betType) {
        case 'match_winner':
          won = bet.selection === winner;
          break;
        case 'total_runs':
          // Simulate total runs check
          const totalRuns = Math.floor(Math.random() * 100) + 200;
          won = (bet.selection === 'over' && totalRuns > bet.line) ||
                (bet.selection === 'under' && totalRuns < bet.line);
          break;
        default:
          won = Math.random() > 0.5; // Random for other bet types
      }
      
      bet.status = won ? 'won' : 'lost';
      bet.settledAt = new Date().toISOString();
      bet.result = won ? 'win' : 'loss';
      
      if (won) {
        const user = users.find(u => u.id === bet.userId);
        if (user) {
          user.balance += bet.potentialWin;
        }
      }
    });
    
    broadcastToAll({
      type: 'MATCH_RESOLVED',
      data: {
        match,
        settledBets: matchBets.length
      }
    });
    
    res.json({
      match,
      settledBets: matchBets.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to resolve match' });
  }
});

export default router;