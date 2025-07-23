import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useWebSocket } from '../contexts/WebSocketContext'
import { 
  Home, 
  Calendar, 
  TrendingUp, 
  Wallet, 
  Settings, 
  LogOut,
  Wifi,
  WifiOff
} from 'lucide-react'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { isConnected } = useWebSocket()
  const location = useLocation()

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Matches', href: '/matches', icon: Calendar },
    { name: 'My Bets', href: '/bets', icon: TrendingUp },
    { name: 'Wallet', href: '/wallet', icon: Wallet },
  ]

  if (user?.role === 'admin') {
    navigation.push({ name: 'Admin', href: '/admin', icon: Settings })
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">CB</span>
            </div>
            <span className="text-xl font-bold text-gray-900">CricketBet Pro</span>
          </Link>

          {/* Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </div>

          {/* User menu */}
          <div className="flex items-center space-x-4">
            {/* Connection status */}
            <div className="flex items-center space-x-2">
              {isConnected ? (
                <Wifi className="w-4 h-4 text-success-500" />
              ) : (
                <WifiOff className="w-4 h-4 text-danger-500" />
              )}
              <span className="text-sm text-gray-600">
                {isConnected ? 'Live' : 'Offline'}
              </span>
            </div>

            {/* Balance */}
            <div className="bg-gray-100 px-3 py-1 rounded-full">
              <span className="text-sm font-medium text-gray-900">
                ${user?.balance?.toFixed(2) || '0.00'}
              </span>
            </div>

            {/* User info */}
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">{user?.name}</div>
                <div className="text-xs text-gray-500">{user?.role}</div>
              </div>
              
              <button
                onClick={logout}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile navigation */}
        <div className="md:hidden border-t border-gray-200">
          <div className="flex overflow-x-auto py-2 space-x-1">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}