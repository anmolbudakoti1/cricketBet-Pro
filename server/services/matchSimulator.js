import { v4 as uuidv4 } from 'uuid';
import { matches, teams, players } from '../data/mockData.js';
import { broadcastToAll } from './websocket.js';

const MATCH_FORMATS = ['T20', 'ODI', 'Test'];
const MATCH_STATUSES = ['upcoming', 'live', 'finished'];

export function initializeMatches() {
  // Clear existing matches
  matches.length = 0;
  
  // Create upcoming matches
  for (let i = 0; i < 3; i++) {
    const team1 = teams[Math.floor(Math.random() * teams.length)];
    let team2 = teams[Math.floor(Math.random() * teams.length)];
    while (team2.id === team1.id) {
      team2 = teams[Math.floor(Math.random() * teams.length)];
    }
    
    const startTime = new Date();
    startTime.setHours(startTime.getHours() + (i + 1) * 2);
    
    matches.push(createMatch(team1, team2, 'upcoming', startTime));
  }
  
  // Create live matches
  for (let i = 0; i < 2; i++) {
    const team1 = teams[Math.floor(Math.random() * teams.length)];
    let team2 = teams[Math.floor(Math.random() * teams.length)];
    while (team2.id === team1.id) {
      team2 = teams[Math.floor(Math.random() * teams.length)];
    }
    
    const startTime = new Date();
    startTime.setHours(startTime.getHours() - 1);
    
    const match = createMatch(team1, team2, 'live', startTime);
    initializeLiveMatch(match);
    matches.push(match);
  }
  
  // Create finished matches
  for (let i = 0; i < 2; i++) {
    const team1 = teams[Math.floor(Math.random() * teams.length)];
    let team2 = teams[Math.floor(Math.random() * teams.length)];
    while (team2.id === team1.id) {
      team2 = teams[Math.floor(Math.random() * teams.length)];
    }
    
    const startTime = new Date();
    startTime.setHours(startTime.getHours() - 5);
    
    const match = createMatch(team1, team2, 'finished', startTime);
    finalizeMatch(match);
    matches.push(match);
  }
  
  console.log(`✅ Initialized ${matches.length} matches`);
}

function createMatch(team1, team2, status, startTime) {
  const format = MATCH_FORMATS[Math.floor(Math.random() * MATCH_FORMATS.length)];
  const totalOvers = format === 'T20' ? 20 : format === 'ODI' ? 50 : 90;
  
  return {
    id: uuidv4(),
    team1,
    team2,
    format,
    status,
    startTime: startTime.toISOString(),
    venue: `Stadium ${Math.floor(Math.random() * 10) + 1}`,
    series: `${team1.name} vs ${team2.name} Series`,
    toss: null,
    innings: [],
    currentInnings: 0,
    totalOvers,
    odds: generateInitialOdds(),
    lastUpdate: new Date().toISOString()
  };
}

function generateInitialOdds() {
  const team1Odds = 1.5 + Math.random() * 2; // 1.5 to 3.5
  const team2Odds = 1.5 + Math.random() * 2;
  
  return {
    matchWinner: {
      team1: parseFloat(team1Odds.toFixed(2)),
      team2: parseFloat(team2Odds.toFixed(2))
    },
    totalRuns: {
      over: parseFloat((1.8 + Math.random() * 0.4).toFixed(2)),
      under: parseFloat((1.8 + Math.random() * 0.4).toFixed(2)),
      line: Math.floor(150 + Math.random() * 100)
    },
    topBatsman: generatePlayerOdds(),
    topBowler: generatePlayerOdds()
  };
}

function generatePlayerOdds() {
  const odds = {};
  const allPlayers = [...players.IND, ...players.AUS, ...players.ENG].slice(0, 10);
  
  allPlayers.forEach(player => {
    odds[player] = parseFloat((2 + Math.random() * 8).toFixed(2));
  });
  
  return odds;
}

function initializeLiveMatch(match) {
  // Simulate toss
  match.toss = {
    winner: Math.random() > 0.5 ? match.team1.id : match.team2.id,
    decision: Math.random() > 0.5 ? 'bat' : 'bowl'
  };
  
  // Initialize first innings
  const battingTeam = match.toss.decision === 'bat' ? match.toss.winner : 
    (match.toss.winner === match.team1.id ? match.team2.id : match.team1.id);
  
  match.innings.push({
    battingTeam,
    runs: Math.floor(Math.random() * 50) + 20,
    wickets: Math.floor(Math.random() * 4),
    overs: Math.floor(Math.random() * 10) + 5,
    balls: Math.floor(Math.random() * 6),
    runRate: 0,
    requiredRate: 0
  });
  
  updateInningsStats(match.innings[0]);
}

function updateInningsStats(innings) {
  const totalBalls = innings.overs * 6 + innings.balls;
  innings.runRate = totalBalls > 0 ? parseFloat((innings.runs / totalBalls * 6).toFixed(2)) : 0;
}

function finalizeMatch(match) {
  match.toss = {
    winner: Math.random() > 0.5 ? match.team1.id : match.team2.id,
    decision: 'bat'
  };
  
  // Create completed innings
  const team1Score = Math.floor(Math.random() * 100) + 150;
  const team2Score = Math.floor(Math.random() * 100) + 140;
  
  match.innings = [
    {
      battingTeam: match.team1.id,
      runs: team1Score,
      wickets: Math.floor(Math.random() * 8) + 2,
      overs: match.totalOvers,
      balls: 0,
      runRate: parseFloat((team1Score / match.totalOvers).toFixed(2))
    },
    {
      battingTeam: match.team2.id,
      runs: team2Score,
      wickets: team2Score > team1Score ? Math.floor(Math.random() * 5) : 10,
      overs: team2Score > team1Score ? Math.floor(Math.random() * match.totalOvers) + 15 : match.totalOvers,
      balls: Math.floor(Math.random() * 6),
      runRate: parseFloat((team2Score / match.totalOvers).toFixed(2))
    }
  ];
  
  match.result = {
    winner: team1Score > team2Score ? match.team1.id : match.team2.id,
    margin: Math.abs(team1Score - team2Score),
    marginType: team1Score > team2Score ? 'runs' : 'wickets'
  };
}

export function updateLiveMatches() {
  const liveMatches = matches.filter(m => m.status === 'live');
  
  liveMatches.forEach(match => {
    // Simulate match progression
    const currentInnings = match.innings[match.currentInnings];
    if (!currentInnings) return;
    
    // Random events
    const event = Math.random();
    
    if (event < 0.1) {
      // Wicket
      currentInnings.wickets = Math.min(currentInnings.wickets + 1, 10);
      broadcastMatchEvent(match, 'wicket', 'Wicket! Batsman dismissed');
    } else if (event < 0.3) {
      // Boundary (4 or 6)
      const runs = Math.random() > 0.7 ? 6 : 4;
      currentInnings.runs += runs;
      broadcastMatchEvent(match, 'boundary', `${runs} runs! What a shot!`);
    } else {
      // Regular runs
      const runs = Math.floor(Math.random() * 4);
      currentInnings.runs += runs;
    }
    
    // Progress overs
    currentInnings.balls++;
    if (currentInnings.balls >= 6) {
      currentInnings.balls = 0;
      currentInnings.overs++;
    }
    
    updateInningsStats(currentInnings);
    
    // Check if innings is complete
    if (currentInnings.wickets >= 10 || currentInnings.overs >= match.totalOvers) {
      if (match.currentInnings === 0) {
        // Start second innings
        match.currentInnings = 1;
        const battingTeam = currentInnings.battingTeam === match.team1.id ? match.team2.id : match.team1.id;
        match.innings.push({
          battingTeam,
          runs: 0,
          wickets: 0,
          overs: 0,
          balls: 0,
          runRate: 0,
          requiredRate: parseFloat(((currentInnings.runs + 1) / match.totalOvers).toFixed(2))
        });
      } else {
        // Match finished
        match.status = 'finished';
        const team1Score = match.innings.find(i => i.battingTeam === match.team1.id)?.runs || 0;
        const team2Score = match.innings.find(i => i.battingTeam === match.team2.id)?.runs || 0;
        
        match.result = {
          winner: team1Score > team2Score ? match.team1.id : match.team2.id,
          margin: Math.abs(team1Score - team2Score),
          marginType: team1Score > team2Score ? 'runs' : 'wickets'
        };
        
        broadcastMatchEvent(match, 'match_end', `Match finished! ${getTeamName(match, match.result.winner)} wins!`);
      }
    }
    
    match.lastUpdate = new Date().toISOString();
    
    // Update odds slightly
    updateMatchOdds(match);
  });
  
  // Broadcast live updates
  if (liveMatches.length > 0) {
    broadcastToAll({
      type: 'LIVE_SCORES',
      data: liveMatches
    });
  }
}

function updateMatchOdds(match) {
  const variation = 0.1; // 10% variation
  
  // Update match winner odds based on current score
  if (match.innings.length > 0) {
    const currentInnings = match.innings[match.currentInnings];
    const factor = Math.random() * variation - variation / 2;
    
    match.odds.matchWinner.team1 = Math.max(1.1, 
      parseFloat((match.odds.matchWinner.team1 * (1 + factor)).toFixed(2))
    );
    match.odds.matchWinner.team2 = Math.max(1.1,
      parseFloat((match.odds.matchWinner.team2 * (1 - factor)).toFixed(2))
    );
  }
}

function broadcastMatchEvent(match, type, message) {
  broadcastToAll({
    type: 'MATCH_EVENT',
    data: {
      matchId: match.id,
      eventType: type,
      message,
      timestamp: new Date().toISOString()
    }
  });
}

function getTeamName(match, teamId) {
  return teamId === match.team1.id ? match.team1.name : match.team2.name;
}