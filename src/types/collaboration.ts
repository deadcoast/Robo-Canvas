export interface User {
  id: string;
  name: string;
  color: string;
  cursor: {
    x: number;
    y: number;
  } | null;
}

export interface Message {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: number;
}

export interface CursorUpdate {
  userId: string;
  cursor: {
    x: number;
    y: number;
  };
}

export interface PresenceUpdate {
  userId: string;
  status: 'online' | 'offline';
}

export type WebSocketMessage = {
  type: 'cursor_update';
  data: CursorUpdate;
} | {
  type: 'presence_update';
  data: PresenceUpdate;
} | {
  type: 'chat_message';
  data: Message;
} | {
  type: 'canvas_update';
  data: any; // Canvas state update
};