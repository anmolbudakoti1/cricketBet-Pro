import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useWebSocket } from '../contexts/WebSocketContext'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../services/api'
import { 
  ArrowLeft, 
  Play, 
  Clock, 
  CheckCircle, 
  Calendar, 
  MapPin, 
  Trophy,
  Target,
  TrendingUp,
  DollarSign,
  Users
} from 'lucide-react'

interface Match {
  id: string
  team1: { id: string; name: string; flag: string }
  team2: { id: string; name: string; flag: string }
  format: string
  status: string
  startTime: string
  venue: string
  series: string
  innings: any[]
  odds: any
  result?: any
  toss?: any
  totalOvers: number
}

interface BetSlip {
  matchId: string
  betType: string
  selection: string
  odds: number
  stake: number
}

export default function MatchDetail() {
  const { id } = useParams<{ id: string }>()
  const [match, setMatch] = useState<Match | null>(null)
  const [loading, setLoading] = useState(true)
  const [betSlip, setBetSlip] = useState<BetSlip | null>(null)
  const [placingBet, setPlacingBet] = useState(false)
  const { lastMessage } = useWebSocket()
  const { user, updateBalance } = useAuth()

  useEffect(() => {
    if (id) {
      loadMatch(id)
    }
  }, [id])

  useEffect(() => {
    if (lastMessage?.type === 'LIVE_SCORES' && match) {
      const updatedMatch = lastMessage.data.find((m: any) => m.id === match.id)
      if (updatedMatch) {
        setMatch(updatedMatch)
      }
    }
  }, [lastMessage, match])

  const loadMatch = async (matchId: string) => {
    try {
      setLoading(true)
      const response = await api.getMatch(matchId)
      setMatch(response.data)
    } catch (error) {
      console.error('Error loading match:', error)
    } finally {
      setLoading(false)
    }
  }

  const addToBetSlip = (betType: string, selection: string, odds: number) => {
    if (!match) return
    
    setBetSlip({
      matchId: match.id,
      betType,
      selection,
      odds,
      stake: 10 // Default stake
    })
  }

  const updateStake = (stake: number) => {
    if (betSlip) {
      setBetSlip({ ...betSlip, stake })
    }
  }

  const placeBet = async () => {
    if (!betSlip || !user) return

    try {
      setPlacingBet(true)
      await api.placeBet(betSlip)
      
      // Update user balance
      updateBalance(user.balance - betSlip.stake)
      
      // Clear bet slip
      setBetSlip(null)
      
      if (window.showNotification) {
        window.showNotification('Bet placed successfully!', 'success')
      }
    } catch (error: any) {
      if (window.showNotification) {
        window.showNotification(
          error.response?.data?.error || 'Failed to place bet',
          'error'
        )
      }
    } finally {
      setPlacingBet(false)
    }
  }

  // const formatTime = (dateString: string) => {
  //   return new Date(dateString).toLocaleTimeString([], { 
  //     hour: '2-digit', 
  //     minute: '2-digit' 
  //   })
  // }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString([], {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'live':
        return <Play className="w-5 h-5 text-red-500" />
      case 'upcoming':
        return <Clock className="w-5 h-5 text-blue-500" />
      case 'finished':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      default:
        return <Calendar className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'live':
        return <span className="badge-danger">🔴 LIVE</span>
      case 'upcoming':
        return <span className="badge-info">⏰ Upcoming</span>
      case 'finished':
        return <span className="badge-success">✅ Finished</span>
      default:
        return <span className="badge-warning">{status}</span>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!match) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Match not found</h3>
        <Link to="/matches" className="text-primary-600 hover:text-primary-700">
          ← Back to matches
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          to="/matches"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {match.team1.name} vs {match.team2.name}
          </h1>
          <div className="flex items-center space-x-4 text-gray-600 mt-1">
            <div className="flex items-center space-x-1">
              {getStatusIcon(match.status)}
              <span>{match.format}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(match.startTime)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <MapPin className="w-4 h-4" />
              <span>{match.venue}</span>
            </div>
          </div>
        </div>
        <div className="ml-auto">
          {getStatusBadge(match.status)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Match Score */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Match Score</h2>
              {match.status === 'live' && (
                <div className="flex items-center space-x-2 text-red-600">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Live</span>
                </div>
              )}
            </div>

            <div className="space-y-6">
              {/* Team 1 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-4xl">{match.team1.flag}</span>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{match.team1.name}</h3>
                    {match.innings.find(i => i.battingTeam === match.team1.id) && (
                      <div className="text-2xl font-bold text-primary-600">
                        {match.innings.find(i => i.battingTeam === match.team1.id)?.runs}/
                        {match.innings.find(i => i.battingTeam === match.team1.id)?.wickets}
                        <span className="text-lg text-gray-600 ml-2">
                          ({match.innings.find(i => i.battingTeam === match.team1.id)?.overs}.
                          {match.innings.find(i => i.battingTeam === match.team1.id)?.balls} overs)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                {match.innings.find(i => i.battingTeam === match.team1.id) && (
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Run Rate</div>
                    <div className="text-lg font-semibold">
                      {match.innings.find(i => i.battingTeam === match.team1.id)?.runRate}
                    </div>
                  </div>
                )}
              </div>

              {/* Team 2 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-4xl">{match.team2.flag}</span>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{match.team2.name}</h3>
                    {match.innings.find(i => i.battingTeam === match.team2.id) && (
                      <div className="text-2xl font-bold text-primary-600">
                        {match.innings.find(i => i.battingTeam === match.team2.id)?.runs}/
                        {match.innings.find(i => i.battingTeam === match.team2.id)?.wickets}
                        <span className="text-lg text-gray-600 ml-2">
                          ({match.innings.find(i => i.battingTeam === match.team2.id)?.overs}.
                          {match.innings.find(i => i.battingTeam === match.team2.id)?.balls} overs)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                {match.innings.find(i => i.battingTeam === match.team2.id) && (
                  <div className="text-right">
                    <div className="text-sm text-gray-600">
                      {match.innings.length > 1 ? 'Required Rate' : 'Run Rate'}
                    </div>
                    <div className="text-lg font-semibold">
                      {match.innings.find(i => i.battingTeam === match.team2.id)?.requiredRate || 
                       match.innings.find(i => i.battingTeam === match.team2.id)?.runRate}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Match Result */}
            {match.status === 'finished' && match.result && (
              <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <Trophy className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-800">
                    {match.result.winner === match.team1.id ? match.team1.name : match.team2.name} won by {match.result.margin} {match.result.marginType}
                  </span>
                </div>
              </div>
            )}

            {/* Toss Info */}
            {match.toss && (
              <div className="mt-4 text-sm text-gray-600">
                <strong>Toss:</strong> {match.toss.winner === match.team1.id ? match.team1.name : match.team2.name} won the toss and chose to {match.toss.decision}
              </div>
            )}
          </div>

          {/* Betting Markets */}
          {match.status !== 'finished' && match.odds && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Betting Markets</h2>
              
              <div className="space-y-6">
                {/* Match Winner */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Target className="w-4 h-4 mr-2" />
                    Match Winner
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => addToBetSlip('match_winner', match.team1.name, match.odds.matchWinner.team1)}
                      className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{match.team1.name}</div>
                          <div className="text-sm text-gray-600">{match.team1.flag}</div>
                        </div>
                        <div className="text-lg font-bold text-primary-600">
                          {match.odds.matchWinner.team1}
                        </div>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => addToBetSlip('match_winner', match.team2.name, match.odds.matchWinner.team2)}
                      className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{match.team2.name}</div>
                          <div className="text-sm text-gray-600">{match.team2.flag}</div>
                        </div>
                        <div className="text-lg font-bold text-primary-600">
                          {match.odds.matchWinner.team2}
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Total Runs */}
                {match.odds.totalRuns && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Total Runs (Line: {match.odds.totalRuns.line})
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => addToBetSlip('total_runs', `Over ${match.odds.totalRuns.line}`, match.odds.totalRuns.over)}
                        className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all text-left"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">Over {match.odds.totalRuns.line}</div>
                            <div className="text-sm text-gray-600">More than {match.odds.totalRuns.line} runs</div>
                          </div>
                          <div className="text-lg font-bold text-primary-600">
                            {match.odds.totalRuns.over}
                          </div>
                        </div>
                      </button>
                      
                      <button
                        onClick={() => addToBetSlip('total_runs', `Under ${match.odds.totalRuns.line}`, match.odds.totalRuns.under)}
                        className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all text-left"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">Under {match.odds.totalRuns.line}</div>
                            <div className="text-sm text-gray-600">Less than {match.odds.totalRuns.line} runs</div>
                          </div>
                          <div className="text-lg font-bold text-primary-600">
                            {match.odds.totalRuns.under}
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {/* Top Batsman */}
                {match.odds.topBatsman && Object.keys(match.odds.topBatsman).length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      Top Batsman
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(match.odds.topBatsman).slice(0, 6).map(([player, odds]) => (
                        <button
                          key={player}
                          onClick={() => addToBetSlip('top_batsman', player, odds as number)}
                          className="p-3 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all text-left"
                        >
                          <div className="flex items-center justify-between">
                            <div className="font-medium text-sm">{player}</div>
                            <div className="text-sm font-bold text-primary-600">{odds as number}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bet Slip */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Bet Slip
            </h2>
            
            {!betSlip ? (
              <div className="text-center py-8">
                <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">No bets selected</p>
                <p className="text-sm text-gray-400">Click on odds to add to bet slip</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="font-medium text-gray-900 mb-1">
                    {betSlip.selection}
                  </div>
                  <div className="text-sm text-gray-600 mb-2 capitalize">
                    {betSlip.betType.replace('_', ' ')}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Odds:</span>
                    <span className="font-bold text-primary-600">{betSlip.odds}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stake ($)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={user?.balance || 0}
                    value={betSlip.stake}
                    onChange={(e) => updateStake(Number(e.target.value))}
                    className="input w-full"
                    placeholder="Enter stake amount"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Available: ${user?.balance?.toFixed(2) || '0.00'}
                  </div>
                </div>

                <div className="bg-primary-50 rounded-lg p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Potential Win:</span>
                    <span className="font-bold text-primary-600">
                      ${(betSlip.stake * betSlip.odds).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-gray-600">Potential Profit:</span>
                    <span className="font-bold text-green-600">
                      ${((betSlip.stake * betSlip.odds) - betSlip.stake).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={placeBet}
                    disabled={placingBet || betSlip.stake <= 0 || betSlip.stake > (user?.balance || 0)}
                    className="btn-primary w-full py-3"
                  >
                    {placingBet ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto"></div>
                    ) : (
                      `Place Bet - $${betSlip.stake}`
                    )}
                  </button>
                  
                  <button
                    onClick={() => setBetSlip(null)}
                    className="btn-secondary w-full py-2"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}