import { useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { User, Message, WebSocketMessage } from '../types/collaboration';
import { useEditorStore } from '../store/editorStore';

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEEAD', '#D4A5A5', '#9B59B6', '#3498DB'
];

export const useCollaboration = () => {
  const ws = useRef<WebSocket | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userId] = useState(() => uuidv4());
  const [userColor] = useState(() => COLORS[Math.floor(Math.random() * COLORS.length)]);
  const [isConnected, setIsConnected] = useState(false);
  const { addLine, addBox, addText } = useEditorStore();

  useEffect(() => {
    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        setIsConnected(true);
        sendPresenceUpdate('online');
      };

      ws.current.onclose = () => {
        setIsConnected(false);
        setTimeout(connect, 1000); // Reconnect after 1 second
      };

      ws.current.onmessage = (event) => {
        const message: WebSocketMessage = JSON.parse(event.data);
        
        switch (message.type) {
          case 'cursor_update':
            setUsers(prev => prev.map(user => 
              user.id === message.data.userId 
                ? { ...user, cursor: message.data.cursor }
                : user
            ));
            break;

          case 'presence_update':
            if (message.data.status === 'online') {
              setUsers(prev => [...prev, {
                id: message.data.userId,
                name: `User ${message.data.userId.slice(0, 4)}`,
                color: COLORS[users.length % COLORS.length],
                cursor: null
              }]);
            } else {
              setUsers(prev => prev.filter(user => user.id !== message.data.userId));
            }
            break;

          case 'chat_message':
            setMessages(prev => [...prev, message.data]);
            break;

          case 'canvas_update':
            // Handle canvas updates
            const { type, data } = message.data;
            switch (type) {
              case 'line':
                addLine(data.start, data.end);
                break;
              case 'box':
                addBox(data.start, data.end);
                break;
              case 'text':
                addText(data.position, data.content);
                break;
            }
            break;
        }
      };
    };

    connect();
    return () => {
      if (ws.current) {
        sendPresenceUpdate('offline');
        ws.current.close();
      }
    };
  }, []);

  const sendMessage = (content: string) => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      return;
    }

    const message: Message = {
      id: uuidv4(),
      userId,
      userName: `User ${userId.slice(0, 4)}`,
      content,
      timestamp: Date.now()
    };

    ws.current.send(JSON.stringify({
      type: 'chat_message',
      data: message
    }));
  };

  const updateCursor = (x: number, y: number) => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      return;
    }

    ws.current.send(JSON.stringify({
      type: 'cursor_update',
      data: {
        userId,
        cursor: { x, y }
      }
    }));
  };

  const sendPresenceUpdate = (status: 'online' | 'offline') => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      return;
    }

    ws.current.send(JSON.stringify({
      type: 'presence_update',
      data: {
        userId,
        status
      }
    }));
  };

  const broadcastCanvasUpdate = (type: string, data: any) => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      return;
    }

    ws.current.send(JSON.stringify({
      type: 'canvas_update',
      data: {
        type,
        data
      }
    }));
  };

  return {
    users,
    messages,
    userId,
    userColor,
    isConnected,
    sendMessage,
    updateCursor,
    broadcastCanvasUpdate
  };
};