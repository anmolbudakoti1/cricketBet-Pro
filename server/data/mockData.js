import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

// Mock users
export const users = [
  {
    id: uuidv4(),
    email: 'admin@cricketbet.com',
    password: bcrypt.hashSync('admin123', 10),
    name: 'Admin User',
    role: 'admin',
    balance: 10000,
    createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    email: 'user@example.com',
    password: bcrypt.hashSync('user123', 10),
    name: 'John Doe',
    role: 'user',
    balance: 1000,
    createdAt: new Date().toISOString()
  }
];

// Mock teams
export const teams = [
  { id: 'IND', name: 'India', flag: '🇮🇳' },
  { id: 'AUS', name: 'Australia', flag: '🇦🇺' },
  { id: 'ENG', name: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { id: 'PAK', name: 'Pakistan', flag: '🇵🇰' },
  { id: 'SA', name: 'South Africa', flag: '🇿🇦' },
  { id: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
  { id: 'WI', name: 'West Indies', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { id: 'SL', name: 'Sri Lanka', flag: '🇱🇰' }
];

// Mock matches (will be populated by simulator)
export const matches = [];

// Mock bets
export const bets = [];

// Mock wallet transactions
export const walletTransactions = [];

// Cricket players for top batsman/bowler bets
export const players = {
  IND: ['Virat Kohli', 'Rohit Sharma', 'KL Rahul', 'Hardik Pandya', 'Jasprit Bumrah'],
  AUS: ['Steve Smith', 'David Warner', 'Pat Cummins', 'Mitchell Starc', 'Glenn Maxwell'],
  ENG: ['Joe Root', 'Ben Stokes', 'Jos Buttler', 'Jofra Archer', 'Jonny Bairstow'],
  PAK: ['Babar Azam', 'Mohammad Rizwan', 'Shaheen Afridi', 'Fakhar Zaman', 'Hasan Ali'],
  SA: ['Quinton de Kock', 'Kagiso Rabada', 'AB de Villiers', 'Faf du Plessis', 'Anrich Nortje'],
  NZ: ['Kane Williamson', 'Trent Boult', 'Ross Taylor', 'Martin Guptill', 'Tim Southee'],
  WI: ['Chris Gayle', 'Andre Russell', 'Jason Holder', 'Kieron Pollard', 'Shimron Hetmyer'],
  SL: ['Angelo Mathews', 'Lasith Malinga', 'Kusal Perera', 'Wanindu Hasaranga', 'Dushmantha Chameera']
};