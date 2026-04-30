import { useState, useEffect, useRef } from 'react';
import signalRService from '../services/signalRService';
import apiService from '../services/apiService';

export default function GameChat({ gameId, userId, username, isOpen, onToggle, berserkMode }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    loadChatHistory();
    
    // Subscribe to new messages
    signalRService.onChatMessageReceived((message) => {
      setMessages(prev => [...prev, message]);
    });
  }, [gameId]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Focus input when chat opens
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const loadChatHistory = async () => {
    try {
      const history = await apiService.getGameChat(gameId);
      setMessages(history);
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || sending) return;

    try {
      setSending(true);
      await signalRService.sendChatMessage(gameId, userId, inputMessage.trim());
      setInputMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: berserkMode 
            ? 'linear-gradient(135deg, #ff0000 0%, #8b0000 100%)'
            : 'linear-gradient(135deg, #d4af37 0%, #c9a532 100%)',
          border: 'none',
          color: '#1a1a1a',
          fontSize: '28px',
          cursor: 'pointer',
          boxShadow: berserkMode
            ? '0 4px 12px rgba(255, 0, 0, 0.5)'
            : '0 4px 12px rgba(212, 175, 55, 0.5)',
          transition: 'all 0.3s ease',
          zIndex: 999
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = berserkMode
            ? '0 6px 20px rgba(255, 0, 0, 0.7)'
            : '0 6px 20px rgba(212, 175, 55, 0.7)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = berserkMode
            ? '0 4px 12px rgba(255, 0, 0, 0.5)'
            : '0 4px 12px rgba(212, 175, 55, 0.5)';
        }}
      >
        💬
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '350px',
      height: '500px',
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
      border: '2px solid #d4af37',
      borderRadius: '16px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.8)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000,
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        background: berserkMode
          ? 'linear-gradient(135deg, #ff0000 0%, #8b0000 100%)'
          : 'linear-gradient(135deg, #d4af37 0%, #c9a532 100%)',
        color: '#1a1a1a',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontWeight: 'bold',
        fontSize: '16px'
      }}>
        <span>💬 Game Chat</span>
        <button
          onClick={onToggle}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#1a1a1a',
            fontSize: '24px',
            cursor: 'pointer',
            padding: '0',
            width: '30px',
            height: '30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {messages.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: '#888',
            padding: '40px 20px',
            fontSize: '14px'
          }}>
            No messages yet. Say hi! 👋
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMyMessage = msg.playerId === userId;
            return (
              <div
                key={msg.id || index}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isMyMessage ? 'flex-end' : 'flex-start'
                }}
              >
                <div style={{
                  maxWidth: '80%',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  background: isMyMessage 
                    ? 'linear-gradient(135deg, #d4af37 0%, #c9a532 100%)'
                    : '#2d2d2d',
                  color: isMyMessage ? '#1a1a1a' : '#fff',
                  wordBreak: 'break-word'
                }}>
                  {!isMyMessage && (
                    <div style={{
                      fontSize: '11px',
                      fontWeight: 'bold',
                      marginBottom: '4px',
                      opacity: 0.8
                    }}>
                      {msg.playerUsername}
                    </div>
                  )}
                  <div style={{ fontSize: '14px' }}>
                    {msg.message}
                  </div>
                  <div style={{
                    fontSize: '10px',
                    marginTop: '4px',
                    opacity: 0.7,
                    textAlign: 'right'
                  }}>
                    {formatTime(msg.timestamp || msg.createdAt)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} style={{
        padding: '16px',
        borderTop: '1px solid #444',
        display: 'flex',
        gap: '8px'
      }}>
        <input
          ref={inputRef}
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type a message..."
          maxLength={500}
          disabled={sending}
          style={{
            flex: 1,
            padding: '10px 14px',
            background: '#2d2d2d',
            border: '1px solid #444',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '14px',
            outline: 'none'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#d4af37';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#444';
          }}
        />
        <button
          type="submit"
          disabled={!inputMessage.trim() || sending}
          style={{
            padding: '10px 20px',
            background: inputMessage.trim() && !sending
              ? berserkMode
                ? 'linear-gradient(135deg, #ff0000 0%, #8b0000 100%)'
                : 'linear-gradient(135deg, #d4af37 0%, #c9a532 100%)'
              : '#444',
            border: 'none',
            borderRadius: '8px',
            color: inputMessage.trim() && !sending ? '#1a1a1a' : '#888',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: inputMessage.trim() && !sending ? 'pointer' : 'not-allowed',
            transition: 'all 0.3s ease'
          }}
        >
          {sending ? '...' : 'Send'}
        </button>
      </form>
    </div>
  );
}
