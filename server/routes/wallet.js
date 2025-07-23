import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken } from '../middleware/auth.js';
import { walletTransactions } from '../data/mockData.js';
import { broadcastToUser } from '../services/websocket.js';

const router = express.Router();

// Get wallet balance
router.get('/', authenticateToken, (req, res) => {
  res.json({
    balance: req.user.balance,
    currency: 'USD'
  });
});

// Get transaction history
router.get('/history', authenticateToken, (req, res) => {
  const userTransactions = walletTransactions.filter(t => t.userId === req.user.id);
  res.json(userTransactions);
});

// Deposit (mock)
router.post('/deposit', authenticateToken, (req, res) => {
  try {
    const { amount, method = 'credit_card' } = req.body;
    
    if (amount <= 0 || amount > 10000) {
      return res.status(400).json({ error: 'Invalid deposit amount' });
    }
    
    // Simulate deposit processing
    const transaction = {
      id: uuidv4(),
      userId: req.user.id,
      type: 'deposit',
      amount,
      method,
      status: 'completed',
      createdAt: new Date().toISOString(),
      description: `Deposit via ${method}`
    };
    
    walletTransactions.push(transaction);
    req.user.balance += amount;
    
    broadcastToUser(req.user.id, {
      type: 'DEPOSIT_SUCCESS',
      data: {
        message: `Deposit of $${amount} successful`,
        transaction,
        newBalance: req.user.balance
      }
    });
    
    res.json({
      transaction,
      newBalance: req.user.balance
    });
  } catch (error) {
    res.status(500).json({ error: 'Deposit failed' });
  }
});

// Withdraw (mock)
router.post('/withdraw', authenticateToken, (req, res) => {
  try {
    const { amount, method = 'bank_transfer' } = req.body;
    
    if (amount <= 0) {
      return res.status(400).json({ error: 'Invalid withdrawal amount' });
    }
    
    if (amount > req.user.balance) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }
    
    // Simulate withdrawal processing
    const transaction = {
      id: uuidv4(),
      userId: req.user.id,
      type: 'withdrawal',
      amount,
      method,
      status: 'pending',
      createdAt: new Date().toISOString(),
      description: `Withdrawal via ${method}`
    };
    
    walletTransactions.push(transaction);
    req.user.balance -= amount;
    
    // Simulate processing delay
    setTimeout(() => {
      transaction.status = 'completed';
      broadcastToUser(req.user.id, {
        type: 'WITHDRAWAL_PROCESSED',
        data: {
          message: `Withdrawal of $${amount} processed`,
          transaction
        }
      });
    }, 5000);
    
    res.json({
      transaction,
      newBalance: req.user.balance
    });
  } catch (error) {
    res.status(500).json({ error: 'Withdrawal failed' });
  }
});

export default router;