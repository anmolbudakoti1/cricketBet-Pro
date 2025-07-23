import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useWebSocket } from '../contexts/WebSocketContext'
import { api } from '../services/api'
import { 
  Calendar, 
  TrendingUp, 
  Wallet, 
  Play, 
  Clock,
  Trophy,
  Target,
  Activity
} from 'lucide-react'

interface Match {
  id: string
  team1: { id: string; name: string; flag: string }
  team2: { id: string; name: string; flag: string }
  format: string
  status: string
  startTime: string
  venue: string
  innings: any[]
  odds: any
}

interface Bet {
  id: string
  matchId: string
  betType: string
  selection: string
  stake: number
  odds: number
  potentialWin: number
  status: string
  placedAt: string
}

export default function Dashboard() {
  const [liveMatches, setLiveMatches] = useState<Match[]>([])
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([])
  const [recentBets, setRecentBets] = useState<Bet[]>([])
  const [loading, setLoading] = useState(true)
  const { lastMessage } = useWebSocket()

  useEffect(() => {
    loadDashboardData()
  }, [])

  useEffect(() => {
    if (lastMessage?.type === 'LIVE_SCORES') {
      setLiveMatches(lastMessage.data)
    }
  }, [lastMessage])

  const loadDashboardData = async () => {
    try {
      const [liveResponse, upcomingResponse, betsResponse] = await Promise.all([
        api.getLiveMatches(),
        api.getMatches('upcoming'),
        api.getMyBets()
      ])

      setLiveMatches(liveResponse.data)
      setUpcomingMatches(upcomingResponse.data.slice(0, 3))
      setRecentBets(betsResponse.data.slice(0, 5))
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString([], {
      month: 'short',
      day: 'numeric'
    })
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

  const getBetStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="badge-info">Active</span>
      case 'won':
        return <span className="badge-success">Won</span>
      case 'lost':
        return <span className="badge-danger">Lost</span>
      case 'cashed_out':
        return <span className="badge-warning">Cashed Out</span>
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back! Here's what's happening in cricket betting.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <Play className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Live Matches</p>
              <p className="text-2xl font-bold text-gray-900">{liveMatches.length}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Upcoming</p>
              <p className="text-2xl font-bold text-gray-900">{upcomingMatches.length}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Target className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Bets</p>
              <p className="text-2xl font-bold text-gray-900">
                {recentBets.filter(b => b.status === 'active').length}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Activity className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Bets</p>
              <p className="text-2xl font-bold text-gray-900">{recentBets.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Live Matches */}
        <div className="card">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Play className="w-5 h-5 text-red-500 mr-2" />
                Live Matches
              </h2>
              <Link to="/matches?status=live" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                View All
              </Link>
            </div>
          </div>
          <div className="p-6">
            {liveMatches.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No live matches at the moment</p>
            ) : (
              <div className="space-y-4">
                {liveMatches.slice(0, 3).map((match) => (
                  <Link
                    key={match.id}
                    to={`/matches/${match.id}`}
                    className="block p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{match.team1.flag}</span>
                        <span className="font-medium">{match.team1.name}</span>
                        <span className="text-gray-400">vs</span>
                        <span className="font-medium">{match.team2.name}</span>
                        <span className="text-2xl">{match.team2.flag}</span>
                      </div>
                      {getStatusBadge(match.status)}
                    </div>
                    
                    {match.innings.length > 0 && (
                      <div className="text-sm text-gray-600">
                        <div className="flex justify-between">
                          <span>
                            {match.innings[0].runs}/{match.innings[0].wickets} 
                            ({match.innings[0].overs}.{match.innings[0].balls})
                          </span>
                          <span>Run Rate: {match.innings[0].runRate}</span>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center mt-2 text-sm">
                      <span className="text-gray-500">{match.format} • {match.venue}</span>
                      <div className="flex space-x-4">
                        <span className="text-primary-600">
                          {match.team1.name}: {match.odds?.matchWinner?.team1}
                        </span>
                        <span className="text-primary-600">
                          {match.team2.name}: {match.odds?.matchWinner?.team2}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Matches */}
        <div className="card">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Calendar className="w-5 h-5 text-blue-500 mr-2" />
                Upcoming Matches
              </h2>
              <Link to="/matches?status=upcoming" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                View All
              </Link>
            </div>
          </div>
          <div className="p-6">
            {upcomingMatches.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No upcoming matches</p>
            ) : (
              <div className="space-y-4">
                {upcomingMatches.map((match) => (
                  <Link
                    key={match.id}
                    to={`/matches/${match.id}`}
                    className="block p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{match.team1.flag}</span>
                        <span className="font-medium">{match.team1.name}</span>
                        <span className="text-gray-400">vs</span>
                        <span className="font-medium">{match.team2.name}</span>
                        <span className="text-2xl">{match.team2.flag}</span>
                      </div>
                      {getStatusBadge(match.status)}
                    </div>
                    
                    <div className="flex justify-between items-center text-sm">
                      <div className="text-gray-600">
                        <div>{formatDate(match.startTime)} • {formatTime(match.startTime)}</div>
                        <div>{match.format} • {match.venue}</div>
                      </div>
                      <div className="flex space-x-4">
                        <span className="text-primary-600">
                          {match.team1.name}: {match.odds?.matchWinner?.team1}
                        </span>
                        <span className="text-primary-600">
                          {match.team2.name}: {match.odds?.matchWinner?.team2}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Bets */}
      <div className="card">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <TrendingUp className="w-5 h-5 text-green-500 mr-2" />
              Recent Bets
            </h2>
            <Link to="/bets" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              View All
            </Link>
          </div>
        </div>
        <div className="p-6">
          {recentBets.length === 0 ? (
            <div className="text-center py-8">
              <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No bets placed yet</p>
              <Link to="/matches" className="btn-primary">
                Place Your First Bet
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Bet Type</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Selection</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Stake</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Odds</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Potential Win</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBets.map((bet) => (
                    <tr key={bet.id} className="border-b border-gray-100">
                      <td className="py-3 px-4 text-sm text-gray-900 capitalize">
                        {bet.betType.replace('_', ' ')}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{bet.selection}</td>
                      <td className="py-3 px-4 text-sm text-gray-900">${bet.stake}</td>
                      <td className="py-3 px-4 text-sm text-gray-900">{bet.odds}</td>
                      <td className="py-3 px-4 text-sm text-gray-900">${bet.potentialWin}</td>
                      <td className="py-3 px-4">{getBetStatusBadge(bet.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}