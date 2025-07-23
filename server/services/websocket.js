export function broadcastToAll(message) {
  if (!global.wsConnections) return;
  
  const messageStr = JSON.stringify(message);
  
  global.wsConnections.forEach(ws => {
    if (ws.readyState === 1) { // WebSocket.OPEN
      try {
        ws.send(messageStr);
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
        global.wsConnections.delete(ws);
      }
    }
  });
}

export function broadcastToUser(userId, message) {
  // In a real app, you'd track user connections
  // For now, broadcast to all
  broadcastToAll(message);
}