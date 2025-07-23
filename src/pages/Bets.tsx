import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api'
import { 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle, 
  DollarSign,
  Target,
  Trophy,
  AlertCircle
} from 'lucide-react'

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
  settledAt?: string
  result?: string
  cashOutAmount?: number
}

interface Match {
  id: string
  team1: { name: string; flag: string }
  team2: { name: string; flag: string }
  format: string
  status: string
}

export default function Bets() {
  const [bets, setBets] = useState<Bet[]>([])
  const [matches, setMatches] = useState<{ [key: string]: Match }>({})
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [cashingOut, setCashingOut] = useState<string | null>(null)

  useEffect(() => {
    loadBets()
  }, [])

  const loadBets = async () => {
    try {
      setLoading(true)
      const [betsResponse, matchesResponse] = await Promise.all([
        api.getMyBets(),
        api.getMatches()
      ])

      setBets(betsResponse.data)
      
      // Create matches lookup
      const matchesLookup: { [key: string]: Match } = {}
      matchesResponse.data.forEach((match: Match) => {
        matchesLookup[match.id] = match
      })
      setMatches(matchesLookup)
    } catch (error) {
      console.error('Error loading bets:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCashOut = async (betId: string) => {
    try {
      setCashingOut(betId)
      await api.cashOutBet(betId)
      
      // Reload bets to get updated data
      await loadBets()
      
      if (window.showNotification) {
        window.showNotification('Bet cashed out successfully!', 'success')
      }
    } catch (error: any) {
      if (window.showNotification) {
        window.showNotification(
          error.response?.data?.error || 'Cash out failed',
          'error'
        )
      }
    } finally {
      setCashingOut(null)
    }
  }

  const filteredBets = bets.filter(bet => {
    switch (activeTab) {
      case 'active':
        return bet.status === 'active'
      case 'settled':
        return ['won', 'lost', 'cashed_out'].includes(bet.status)
      default:
        return true
    }
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Clock className="w-4 h-4 text-blue-500" />
      case 'won':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'lost':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'cashed_out':
        return <DollarSign className="w-4 h-4 text-yellow-500" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const canCashOut = (bet: Bet) => {
    const match = matches[bet.matchId]
    return bet.status === 'active' && match?.status === 'live'
  }

  const tabs = [
    { id: 'all', label: 'All Bets', count: bets.length },
    { id: 'active', label: 'Active', count: bets.filter(b => b.status === 'active').length },
    { id: 'settled', label: 'Settled', count: bets.filter(b => ['won', 'lost', 'cashed_out'].includes(b.status)).length }
  ]

  const totalStaked = bets.reduce((sum, bet) => sum + bet.stake, 0)
  const totalWon = bets.filter(b => b.status === 'won').reduce((sum, bet) => sum + bet.potentialWin, 0)
  const totalCashedOut = bets.filter(b => b.status === 'cashed_out').reduce((sum, bet) => sum + (bet.cashOutAmount || 0), 0)

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
        <h1 className="text-3xl font-bold text-gray-900">My Bets</h1>
        <p className="text-gray-600 mt-2">Track your betting history and active wagers</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Bets</p>
              <p className="text-2xl font-bold text-gray-900">{bets.length}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Staked</p>
              <p className="text-2xl font-bold text-gray-900">${totalStaked.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Trophy className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Won</p>
              <p className="text-2xl font-bold text-gray-900">${totalWon.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Cashed Out</p>
              <p className="text-2xl font-bold text-gray-900">${totalCashedOut.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
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

      {/* Bets List */}
      {filteredBets.length === 0 ? (
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {activeTab === 'all' ? 'No bets placed yet' : `No ${activeTab} bets`}
          </h3>
          <p className="text-gray-500 mb-4">
            {activeTab === 'all' 
              ? 'Start betting on your favorite cricket matches'
              : `You don't have any ${activeTab} bets at the moment`
            }
          </p>
          {activeTab === 'all' && (
            <Link to="/matches" className="btn-primary">
              Browse Matches
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBets.map((bet) => {
            const match = matches[bet.matchId]
            
            return (
              <div key={bet.id} className="card p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {getStatusIcon(bet.status)}
                      <h3 className="font-semibold text-gray-900">
                        {match ? `${match.team1.name} vs ${match.team2.name}` : 'Match'}
                      </h3>
                      {getStatusBadge(bet.status)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div>
                        <div className="text-sm text-gray-600">Bet Type</div>
                        <div className="font-medium capitalize">
                          {bet.betType.replace('_', ' ')}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-sm text-gray-600">Selection</div>
                        <div className="font-medium">{bet.selection}</div>
                      </div>
                      
                      <div>
                        <div className="text-sm text-gray-600">Stake</div>
                        <div className="font-medium">${bet.stake}</div>
                      </div>
                      
                      <div>
                        <div className="text-sm text-gray-600">Odds</div>
                        <div className="font-medium">{bet.odds}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-6">
                        <div>
                          <div className="text-sm text-gray-600">Potential Win</div>
                          <div className="font-bold text-primary-600">
                            ${bet.potentialWin.toFixed(2)}
                          </div>
                        </div>
                        
                        {bet.status === 'cashed_out' && bet.cashOutAmount && (
                          <div>
                            <div className="text-sm text-gray-600">Cashed Out</div>
                            <div className="font-bold text-yellow-600">
                              ${bet.cashOutAmount.toFixed(2)}
                            </div>
                          </div>
                        )}
                        
                        <div>
                          <div className="text-sm text-gray-600">Placed</div>
                          <div className="text-sm text-gray-900">
                            {formatDate(bet.placedAt)}
                          </div>
                        </div>
                        
                        {bet.settledAt && (
                          <div>
                            <div className="text-sm text-gray-600">Settled</div>
                            <div className="text-sm text-gray-900">
                              {formatDate(bet.settledAt)}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        {canCashOut(bet) && (
                          <button
                            onClick={() => handleCashOut(bet.id)}
                            disabled={cashingOut === bet.id}
                            className="btn-secondary px-4 py-2"
                          >
                            {cashingOut === bet.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mx-auto"></div>
                            ) : (
                              'Cash Out'
                            )}
                          </button>
                        )}
                        
                        {match && (
                          <Link
                            to={`/matches/${match.id}`}
                            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                          >
                            View Match
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}