import { MessageCircle, Send, Users } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useCollaboration } from '../hooks/useCollaboration';

const CollaborationPanel: React.FC = () => {
  const {
    users,
    messages,
    userId,
    userColor,
    isConnected,
    sendMessage
  } = useCollaboration();
  
  const [newMessage, setNewMessage] = useState('');
  const [showChat, setShowChat] = useState(true);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      sendMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  return (
    <div className="w-80">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200">
        <div className="flex items-center justify-between p-3 border-b">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-gray-600" />
            <span className="font-medium">Collaboration</span>
            <span className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`} />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowChat(!showChat)}
              className={`p-1.5 rounded ${
                showChat ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
              }`}
            >
              <MessageCircle size={16} />
            </button>
          </div>
        </div>

        <div className="p-3 border-b">
          <div className="text-sm font-medium mb-2">Online Users</div>
          <div className="flex flex-wrap gap-2">
            {users.map(user => (
              <div
                key={user.id}
                className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs"
                style={{ backgroundColor: user.color + '20', color: user.color }}
              >
                <span className="w-2 h-2 rounded-full bg-current" />
                <span>{user.id === userId ? 'You' : user.name}</span>
              </div>
            ))}
          </div>
        </div>

        {showChat && (
          <>
            <div
              ref={chatRef}
              className="h-64 overflow-y-auto p-3 space-y-2"
            >
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`flex flex-col ${
                    message.userId === userId ? 'items-end' : 'items-start'
                  }`}
                >
                  <div className="text-xs text-gray-500 mb-1">
                    {message.userId === userId ? 'You' : message.userName}
                  </div>
                  <div
                    className={`px-3 py-2 rounded-lg max-w-[80%] ${
                      message.userId === userId
                        ? 'text-white'
                        : 'bg-gray-100'
                    }`}
                    style={message.userId === userId ? { backgroundColor: userColor } : {}}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
            </div>

            <form
              onSubmit={handleSendMessage}
              className="p-3 border-t flex gap-2"
            >
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-3 py-1.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="p-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                disabled={!newMessage.trim()}
              >
                <Send size={16} />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default CollaborationPanel