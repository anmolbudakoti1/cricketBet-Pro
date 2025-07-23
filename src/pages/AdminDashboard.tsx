import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Activity,
  Calendar,
  Target,
  Settings,
  CheckCircle,
} from 'lucide-react'

interface AdminStats {
  totalUsers: number
  totalBets: number
  totalVolume: number
  activeBets: number
  liveMatches: number
  totalMatches: number
}

interface User {
  id: string
  email: string
  name: string
  role: string
  balance: number
  createdAt: string
}

interface Bet {
  id: string
  userId: string
  matchId: string
  betType: string
  selection: string
  stake: number
  odds: number
  potentialWin: number
  status: string
  placedAt: string
}

interface Match {
  id: string
  team1: { name: string; flag: string }
  team2: { name: string; flag: string }
  format: string
  status: string
  startTime: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [bets, setBets] = useState<Bet[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [resolvingMatch, setResolvingMatch] = useState<string | null>(null)

  useEffect(() => {
    loadAdminData()
  }, [])

  const loadAdminData = async () => {
    try {
      setLoading(true)
      const [statsResponse, usersResponse, betsResponse, matchesResponse] = await Promise.all([
        api.getAdminStats(),
        api.getAdminUsers(),
        api.getAdminBets(),
        api.getMatches()
      ])

      setStats(statsResponse.data)
      setUsers(usersResponse.data)
      setBets(betsResponse.data)
      setMatches(matchesResponse.data)
    } catch (error) {
      console.error('Error loading admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  const resolveMatch = async (matchId: string, winner: string) => {
    try {
      setResolvingMatch(matchId)
      await api.resolveMatch(matchId, {
        winner,
        margin: Math.floor(Math.random() * 50) + 10,
        marginType: Math.random() > 0.5 ? 'runs' : 'wickets'
      })
      
      await loadAdminData()
      
      if (window.showNotification) {
        window.showNotification('Match resolved successfully!', 'success')
      }
    } catch (error: any) {
      if (window.showNotification) {
        window.showNotification(
          error.response?.data?.error || 'Failed to resolve match',
          'error'
        )
      }
    } finally {
      setResolvingMatch(null)
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="badge-info">Active</span>
      case 'won':
        return <span className="badge-success">Won</span>
      case 'lost':
        return <span className="badge-danger">Lost</span>
      case 'live':
        return <span className="badge-danger">🔴 Live</span>
      case 'upcoming':
        return <span className="badge-info">⏰ Upcoming</span>
      case 'finished':
        return <span className="badge-success">✅ Finished</span>
      default:
        return <span className="badge-warning">{status}</span>
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'bets', label: 'Bets', icon: TrendingUp },
    { id: 'matches', label: 'Matches', icon: Calendar }
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
      <div className="flex items-center space-x-3">
        <Settings className="w-8 h-8 text-primary-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage users, bets, and matches</p>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="card p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Users</p>
                <p className="text-xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total Bets</p>
                <p className="text-xl font-bold text-gray-900">{stats.totalBets}</p>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Volume</p>
                <p className="text-xl font-bold text-gray-900">${stats.totalVolume}</p>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Target className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Active Bets</p>
                <p className="text-xl font-bold text-gray-900">{stats.activeBets}</p>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <Activity className="w-5 h-5 text-red-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Live Matches</p>
                <p className="text-xl font-bold text-gray-900">{stats.liveMatches}</p>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Calendar className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total Matches</p>
                <p className="text-xl font-bold text-gray-900">{stats.totalMatches}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="card">
        {activeTab === 'overview' && (
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">System Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Recent Activity</h3>
                <div className="space-y-2">
                  <div className="text-sm text-gray-600">
                    • {bets.filter(b => b.status === 'active').length} active bets worth ${bets.filter(b => b.status === 'active').reduce((sum, b) => sum + b.stake, 0).toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">
                    • {matches.filter(m => m.status === 'live').length} live matches in progress
                  </div>
                  <div className="text-sm text-gray-600">
                    • {users.filter(u => u.role === 'user').length} registered users
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-3">System Health</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-gray-600">Betting system operational</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-gray-600">Live updates active</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-gray-600">Payment processing ready</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">User Management</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">User</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Role</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Balance</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-gray-100">
                      <td className="py-3 px-4 text-sm text-gray-900">{user.name}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{user.email}</td>
                      <td className="py-3 px-4">
                        <span className={`badge ${user.role === 'admin' ? 'badge-danger' : 'badge-info'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">${user.balance.toFixed(2)}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{formatDate(user.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'bets' && (
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Bet Management</h2>
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
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Placed</th>
                  </tr>
                </thead>
                <tbody>
                  {bets.slice(0, 20).map((bet) => (
                    <tr key={bet.id} className="border-b border-gray-100">
                      <td className="py-3 px-4 text-sm text-gray-900 capitalize">
                        {bet.betType.replace('_', ' ')}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{bet.selection}</td>
                      <td className="py-3 px-4 text-sm text-gray-900">${bet.stake}</td>
                      <td className="py-3 px-4 text-sm text-gray-900">{bet.odds}</td>
                      <td className="py-3 px-4 text-sm text-gray-900">${bet.potentialWin.toFixed(2)}</td>
                      <td className="py-3 px-4">{getStatusBadge(bet.status)}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{formatDate(bet.placedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'matches' && (
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Match Management</h2>
            <div className="space-y-4">
              {matches.map((match) => (
                <div key={match.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">{match.team1.flag}</span>
                        <span className="font-medium">{match.team1.name}</span>
                        <span className="text-gray-400">vs</span>
                        <span className="font-medium">{match.team2.name}</span>
                        <span className="text-2xl">{match.team2.flag}</span>
                      </div>
                      {getStatusBadge(match.status)}
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-gray-600">
                        {match.format} • {formatDate(match.startTime)}
                      </span>
                      
                      {match.status === 'live' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => resolveMatch(match.id, match.team1.name)}
                            disabled={resolvingMatch === match.id}
                            className="btn-success px-3 py-1 text-xs"
                          >
                            {resolvingMatch === match.id ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mx-auto"></div>
                            ) : (
                              `${match.team1.name} Wins`
                            )}
                          </button>
                          
                          <button
                            onClick={() => resolveMatch(match.id, match.team2.name)}
                            disabled={resolvingMatch === match.id}
                            className="btn-success px-3 py-1 text-xs"
                          >
                            {resolvingMatch === match.id ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mx-auto"></div>
                            ) : (
                              `${match.team2.name} Wins`
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}