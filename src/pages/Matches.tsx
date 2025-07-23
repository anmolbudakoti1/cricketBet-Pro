import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useWebSocket } from '../contexts/WebSocketContext'
import { api } from '../services/api'
import { Play, Clock, CheckCircle, Calendar, MapPin, Trophy } from 'lucide-react'

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
}

export default function Matches() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [searchParams, setSearchParams] = useSearchParams()
  const { lastMessage } = useWebSocket()

  useEffect(() => {
    const status = searchParams.get('status')
    if (status) {
      setActiveTab(status)
    }
    loadMatches(status || undefined)
  }, [searchParams])

  useEffect(() => {
    if (lastMessage?.type === 'LIVE_SCORES') {
      // Update live matches
      setMatches(prevMatches => 
        prevMatches.map(match => {
          const updatedMatch = lastMessage.data.find((m: any) => m.id === match.id)
          return updatedMatch || match
        })
      )
    }
  }, [lastMessage])

  const loadMatches = async (status?: string) => {
    try {
      setLoading(true)
      const response = await api.getMatches(status)
      setMatches(response.data)
    } catch (error) {
      console.error('Error loading matches:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    if (tab === 'all') {
      setSearchParams({})
      loadMatches()
    } else {
      setSearchParams({ status: tab })
      loadMatches(tab)
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
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'live':
        return <Play className="w-4 h-4 text-red-500" />
      case 'upcoming':
        return <Clock className="w-4 h-4 text-blue-500" />
      case 'finished':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      default:
        return <Calendar className="w-4 h-4 text-gray-500" />
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

  const tabs = [
    { id: 'all', label: 'All Matches', count: matches.length },
    { id: 'live', label: 'Live', count: matches.filter(m => m.status === 'live').length },
    { id: 'upcoming', label: 'Upcoming', count: matches.filter(m => m.status === 'upcoming').length },
    { id: 'finished', label: 'Finished', count: matches.filter(m => m.status === 'finished').length }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Cricket Matches</h1>
        <p className="text-gray-600 mt-2">Live scores, upcoming fixtures, and betting opportunities</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                  activeTab === tab.id
                    ? 'bg-primary-100 text-primary-600'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Matches Grid */}
      {matches.length === 0 ? (
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No matches found</h3>
          <p className="text-gray-500">Check back later for upcoming matches</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {matches.map((match) => (
            <Link
              key={match.id}
              to={`/matches/${match.id}`}
              className="card p-6 hover:shadow-md transition-shadow"
            >
              {/* Match Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(match.status)}
                  <span className="text-sm font-medium text-gray-600">{match.format}</span>
                </div>
                {getStatusBadge(match.status)}
              </div>

              {/* Teams */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">{match.team1.flag}</span>
                  <div>
                    <div className="font-semibold text-gray-900">{match.team1.name}</div>
                    {match.innings.length > 0 && match.innings.find(i => i.battingTeam === match.team1.id) && (
                      <div className="text-sm text-gray-600">
                        {match.innings.find(i => i.battingTeam === match.team1.id)?.runs}/
                        {match.innings.find(i => i.battingTeam === match.team1.id)?.wickets}
                        {match.status === 'live' && match.innings.find(i => i.battingTeam === match.team1.id) && (
                          <span className="ml-1">
                            ({match.innings.find(i => i.battingTeam === match.team1.id)?.overs}.
                            {match.innings.find(i => i.battingTeam === match.team1.id)?.balls})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-lg font-bold text-gray-400">VS</div>
                  {match.status === 'upcoming' && (
                    <div className="text-xs text-gray-500 mt-1">
                      {formatTime(match.startTime)}
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-3 text-right">
                  <div>
                    <div className="font-semibold text-gray-900">{match.team2.name}</div>
                    {match.innings.length > 0 && match.innings.find(i => i.battingTeam === match.team2.id) && (
                      <div className="text-sm text-gray-600">
                        {match.innings.find(i => i.battingTeam === match.team2.id)?.runs}/
                        {match.innings.find(i => i.battingTeam === match.team2.id)?.wickets}
                        {match.status === 'live' && match.innings.find(i => i.battingTeam === match.team2.id) && (
                          <span className="ml-1">
                            ({match.innings.find(i => i.battingTeam === match.team2.id)?.overs}.
                            {match.innings.find(i => i.battingTeam === match.team2.id)?.balls})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <span className="text-3xl">{match.team2.flag}</span>
                </div>
              </div>

              {/* Match Info */}
              <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                <div className="flex items-center space-x-4">
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

              {/* Series */}
              <div className="text-sm text-gray-500 mb-4">{match.series}</div>

              {/* Result or Odds */}
              {match.status === 'finished' && match.result ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="text-sm font-medium text-green-800">
                    🏆 {match.result.winner === match.team1.id ? match.team1.name : match.team2.name} won by {match.result.margin} {match.result.marginType}
                  </div>
                </div>
              ) : match.odds ? (
                <div className="flex justify-between items-center bg-gray-50 rounded-lg p-3">
                  <div className="text-center">
                    <div className="text-xs text-gray-600 mb-1">Match Winner</div>
                    <div className="flex space-x-4">
                      <div className="text-center">
                        <div className="text-sm font-medium text-primary-600">
                          {match.odds.matchWinner?.team1}
                        </div>
                        <div className="text-xs text-gray-500">{match.team1.name}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-primary-600">
                          {match.odds.matchWinner?.team2}
                        </div>
                        <div className="text-xs text-gray-500">{match.team2.name}</div>
                      </div>
                    </div>
                  </div>
                  
                  {match.odds.totalRuns && (
                    <div className="text-center">
                      <div className="text-xs text-gray-600 mb-1">Total Runs</div>
                      <div className="flex space-x-2">
                        <span className="text-sm font-medium text-primary-600">
                          O {match.odds.totalRuns.line}: {match.odds.totalRuns.over}
                        </span>
                        <span className="text-sm font-medium text-primary-600">
                          U {match.odds.totalRuns.line}: {match.odds.totalRuns.under}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}

              {/* Live indicator */}
              {match.status === 'live' && (
                <div className="mt-3 flex items-center justify-center">
                  <div className="flex items-center space-x-2 text-red-600">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">Live Updates</span>
                  </div>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}