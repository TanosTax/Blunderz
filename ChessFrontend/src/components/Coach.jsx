import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import apiService from '../services/apiService';
import '../styles/profile-coach-responsive.css';

export default function Coach({ userId }) {
  const { t, language } = useLanguage();
  const [games, setGames] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    console.log('Coach component mounted, userId:', userId);
    
    if (userId) {
      console.log('Loading games for user:', userId);
      loadRecentGames(userId);
      
      // Load chat history from localStorage
      const savedChat = localStorage.getItem(`coach_chat_${userId}`);
      if (savedChat) {
        try {
          const parsed = JSON.parse(savedChat);
          setMessages(parsed);
          console.log('Loaded chat history:', parsed.length, 'messages');
          return; // Don't add welcome message if we have history
        } catch (e) {
          console.error('Failed to parse saved chat:', e);
        }
      }
    } else {
      console.log('No userId provided');
    }

    // Welcome message (only if no saved history)
    setMessages([{
      role: 'assistant',
      content: t('aiCoach.welcome'),
      timestamp: new Date()
    }]);
  }, [userId]);

  // Update first message when language changes (only if it's the welcome message)
  useEffect(() => {
    if (messages.length === 1 && messages[0].role === 'assistant') {
      setMessages([{
        role: 'assistant',
        content: t('aiCoach.welcome'),
        timestamp: new Date()
      }]);
    }
  }, [language]);

  // Save chat history to localStorage whenever messages change
  useEffect(() => {
    if (userId && messages.length > 0) {
      localStorage.setItem(`coach_chat_${userId}`, JSON.stringify(messages));
    }
  }, [messages, userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadRecentGames = async (userId) => {
    try {
      console.log('Loading games for user:', userId);
      const response = await apiService.getUserGames(userId);
      console.log('Games response:', response);
      
      // getUserGames returns array directly, not { games: [] }
      const gamesArray = Array.isArray(response) ? response : (response.games || []);
      console.log('Games array:', gamesArray);
      
      // Sort by date, most recent first
      const sortedGames = gamesArray
        .filter(g => g.result !== null) // Only completed games
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 20);
      
      console.log('Sorted games:', sortedGames.length);
      setGames(sortedGames);
    } catch (error) {
      console.error('Failed to load games:', error);
    }
  };

  const handleGameSelect = async (game) => {
    setSelectedGame(game);
    setAnalyzing(true);

    // Add user message
    const userMsg = {
      role: 'user',
      content: `${t('aiCoach.gameSelected')}: ${game.whitePlayer.username} vs ${game.blackPlayer.username}`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      const analysis = await apiService.getAIAnalysis(game.id, language);
      
      const aiMsg = {
        role: 'assistant',
        content: analysis.analysis,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error('Failed to analyze game:', error);
      const errorMsg = {
        role: 'assistant',
        content: t('aiCoach.error') + ': ' + error.message,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const userMsg = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      // Build context from previous messages
      const context = messages.map(m => `${m.role}: ${m.content}`).join('\n\n');
      const fullPrompt = selectedGame 
        ? `Context: Analyzing game ${selectedGame.id}\n\n${context}\n\nuser: ${inputMessage}`
        : `${context}\n\nuser: ${inputMessage}`;

      const response = await apiService.chatWithAI(fullPrompt, selectedGame?.id, language);
      
      const aiMsg = {
        role: 'assistant',
        content: response.response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMsg = {
        role: 'assistant',
        content: t('aiCoach.error'),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const getResultText = (game) => {
    if (game.result === 0) return '1-0';
    if (game.result === 1) return '0-1';
    return '½-½';
  };

  return (
    <div className="coach-container" style={{ 
      maxWidth: '1400px', 
      margin: '0 auto', 
      padding: '20px',
      height: 'calc(100vh - 100px)',
      display: 'flex',
      gap: '20px'
    }}>
      {/* Games Sidebar */}
      <div className="coach-sidebar" style={{
        width: '350px',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '12px',
        padding: '20px',
        overflowY: 'auto'
      }}>
        <h2 style={{ color: '#d4af37', marginBottom: '20px', fontSize: '20px' }}>
          {t('aiCoach.coachTitle')}
        </h2>
        
        <button
          onClick={() => {
            if (confirm(language === 'ru' ? 'Очистить историю чата?' : 'Clear chat history?')) {
              setMessages([{
                role: 'assistant',
                content: t('aiCoach.welcome'),
                timestamp: new Date()
              }]);
              setSelectedGame(null);
              if (userId) {
                localStorage.removeItem(`coach_chat_${userId}`);
              }
            }
          }}
          style={{
            width: '100%',
            padding: '10px',
            background: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '8px',
            color: '#888',
            cursor: 'pointer',
            marginBottom: '20px',
            fontSize: '13px'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#222'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#1a1a1a'}
        >
          🗑️ {language === 'ru' ? 'Очистить историю' : 'Clear History'}
        </button>
        
        <h3 style={{ color: '#888', fontSize: '14px', marginBottom: '15px', textTransform: 'uppercase' }}>
          {t('aiCoach.recentGames')}
        </h3>

        {games.length === 0 ? (
          <div style={{ color: '#666', fontSize: '14px', textAlign: 'center', padding: '20px' }}>
            {t('aiCoach.noGames')}
          </div>
        ) : (
          <div className="coach-games-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {games.map(game => (
              <div
                key={game.id}
                className="coach-game-card"
                onClick={() => handleGameSelect(game)}
                style={{
                  padding: '15px',
                  background: selectedGame?.id === game.id ? 'rgba(212, 175, 55, 0.1)' : '#1a1a1a',
                  border: selectedGame?.id === game.id ? '2px solid #d4af37' : '1px solid #333',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (selectedGame?.id !== game.id) {
                    e.currentTarget.style.background = '#222';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedGame?.id !== game.id) {
                    e.currentTarget.style.background = '#1a1a1a';
                  }
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#fff', fontSize: '14px', fontWeight: '500' }}>
                    {game.whitePlayer.username}
                  </span>
                  <span style={{ color: '#d4af37', fontSize: '14px', fontWeight: 'bold' }}>
                    {getResultText(game)}
                  </span>
                  <span style={{ color: '#fff', fontSize: '14px', fontWeight: '500' }}>
                    {game.blackPlayer.username}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#888' }}>
                  <span>{game.timeControl}</span>
                  <span>{new Date(game.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chat Area */}
      <div className="coach-chat" style={{
        flex: 1,
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Messages */}
        <div className="coach-messages" style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '15px'
        }}>
          {messages.map((msg, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
              }}
            >
              <div className="coach-message" style={{
                maxWidth: '70%',
                padding: '12px 16px',
                borderRadius: '12px',
                background: msg.role === 'user' 
                  ? 'linear-gradient(135deg, #d4af37 0%, #f4d03f 100%)'
                  : '#1a1a1a',
                color: msg.role === 'user' ? '#000' : '#ddd',
                border: msg.role === 'assistant' ? '1px solid #333' : 'none',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {msg.content}
              </div>
            </div>
          ))}
          
          {(loading || analyzing) && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{
                padding: '12px 16px',
                borderRadius: '12px',
                background: '#1a1a1a',
                border: '1px solid #333',
                color: '#888'
              }}>
                {analyzing ? t('aiCoach.analyzing') : t('common.loading')}...
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="coach-input-area" style={{
          padding: '20px',
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          gap: '10px'
        }}>
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={t('aiCoach.chatPlaceholder')}
            disabled={loading || analyzing}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '14px',
              outline: 'none'
            }}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || loading || analyzing}
            className="btn-primary"
            style={{
              padding: '12px 24px',
              minWidth: '100px'
            }}
          >
            {loading ? '...' : t('aiCoach.send')}
          </button>
        </div>
      </div>
    </div>
  );
}
