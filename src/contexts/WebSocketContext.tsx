import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useAuth } from './AuthContext'

interface WebSocketMessage {
  type: string
  data: any
}

interface WebSocketContextType {
  isConnected: boolean
  lastMessage: WebSocketMessage | null
  sendMessage: (message: any) => void
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined)

export function useWebSocket() {
  const context = useContext(WebSocketContext)
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider')
  }
  return context
}

interface WebSocketProviderProps {
  children: ReactNode
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const [ws, setWs] = useState<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return

    const connectWebSocket = () => {
      const websocket = new WebSocket('ws://cricketbet-pro.onrender.com/ws')
      
      websocket.onopen = () => {
        console.log('WebSocket connected')
        setIsConnected(true)
        setWs(websocket)
      }
      
      websocket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          setLastMessage(message)
          
          // Handle different message types
          switch (message.type) {
            case 'LIVE_SCORES':
              // Live scores will be handled by components
              break
            case 'MATCH_EVENT':
              // Show notification for match events
              if (window.showNotification) {
                window.showNotification(message.data.message, 'info')
              }
              break
            case 'BET_PLACED':
            case 'BET_CASHED_OUT':
            case 'DEPOSIT_SUCCESS':
              if (window.showNotification) {
                window.showNotification(message.data.message, 'success')
              }
              break
            default:
              console.log('Unhandled WebSocket message:', message)
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }
      
      websocket.onclose = () => {
        console.log('WebSocket disconnected')
        setIsConnected(false)
        setWs(null)
        
        // Reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000)
      }
      
      websocket.onerror = (error) => {
        console.error('WebSocket error:', error)
      }
    }

    connectWebSocket()

    return () => {
      if (ws) {
        ws.close()
      }
    }
  }, [user])

  const sendMessage = (message: any) => {
    if (ws && isConnected) {
      ws.send(JSON.stringify(message))
    }
  }

  const value = {
    isConnected,
    lastMessage,
    sendMessage
  }

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>
}