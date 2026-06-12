import { useState, useRef, useEffect } from 'react';
import apiService from '../services/apiService';
import { useLanguage } from '../i18n/LanguageContext';

export default function Matchmaking({ userId, onGameFound }) {
  const { t } = useLanguage();
  const [searching, setSearching] = useState(false);
  const [timeControl, setTimeControl] = useState('10+0');
  const [eloRange, setEloRange] = useState(200);
  const pollIntervalRef = useRef(null);

  // Remove auto-start for guests - let them choose time control first
  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const startSearch = async () => {
    setSearching(true);
    
    try {
      const result = await apiService.joinMatchmaking(userId, timeControl, eloRange);
      
      if (result.matched) {
        console.log('Match found!', result.gameId);
        onGameFound(result.gameId);
      } else {
        // Keep polling for match
        pollForMatch();
      }
    } catch (error) {
      console.error('Failed to join matchmaking:', error);
      setSearching(false);
    }
  };

  const pollForMatch = () => {
    pollIntervalRef.current = setInterval(async () => {
      try {
        const result = await apiService.joinMatchmaking(userId, timeControl, eloRange);
        
        if (result.matched) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
          console.log('Match found!', result.gameId);
          setSearching(false);
          onGameFound(result.gameId);
        }
      } catch (error) {
        console.error('Polling error:', error);
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        setSearching(false);
      }
    }, 3000); // Poll every 3 seconds
  };

  const cancelSearch = async () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    
    try {
      await apiService.leaveMatchmaking(userId);
      setSearching(false);
    } catch (error) {
      console.error('Failed to leave matchmaking:', error);
      setSearching(false);
    }
  };

  return (
    <div className="container matchmaking-container" style={{ 
      maxWidth: '600px', 
      margin: '80px auto',
      textAlign: 'center'
    }}>
      {!searching ? (
        <div className="card">
          <h2 style={{ 
            marginBottom: '32px',
            fontSize: '32px',
            color: '#d4af37'
          }}>
            {t('matchmaking.title')}
          </h2>
          
          <div style={{ marginBottom: '24px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '12px',
              color: 'var(--color-text-primary)',
              fontSize: '16px',
              fontWeight: '500'
            }}>
              {t('matchmaking.timeControl')}
            </label>
            <select 
              value={timeControl} 
              onChange={(e) => setTimeControl(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'var(--color-background)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                color: 'var(--color-text-primary)',
                fontSize: '15px',
                cursor: 'pointer'
              }}
            >
              <option value="1+0">⚡ {t('matchmaking.bullet')} (1+0)</option>
              <option value="3+0">⚡ {t('matchmaking.blitz')} (3+0)</option>
              <option value="5+0">⚡ {t('matchmaking.blitz')} (5+0)</option>
              <option value="10+0">🎯 {t('matchmaking.rapid')} (10+0)</option>
              <option value="15+10">🎯 {t('matchmaking.rapid')} (15+10)</option>
              <option value="30+0">♟️ {t('matchmaking.classical')} (30+0)</option>
            </select>
          </div>

          <div style={{ marginBottom: '32px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '12px',
              color: 'var(--color-text-primary)',
              fontSize: '16px',
              fontWeight: '500'
            }}>
              {t('matchmaking.ratingRange')}: <span style={{ color: '#d4af37' }}>±{eloRange}</span>
            </label>
            <input 
              type="range" 
              min="50" 
              max="500" 
              step="50"
              value={eloRange}
              onChange={(e) => setEloRange(Number(e.target.value))}
              style={{ 
                width: '100%',
                height: '6px',
                background: 'linear-gradient(90deg, var(--color-background) 0%, #d4af37 50%, var(--color-background) 100%)',
                borderRadius: '3px',
                outline: 'none',
                cursor: 'pointer'
              }}
            />
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '8px',
              fontSize: '12px',
              color: 'var(--color-text-secondary)'
            }}>
              <span>{t('matchmaking.narrow')}</span>
              <span>{t('matchmaking.wide')}</span>
            </div>
          </div>

          <button 
            onClick={startSearch}
            className="btn-primary"
            style={{
              width: '100%',
              padding: '16px',
              fontSize: '18px'
            }}
          >
            🔍 {t('matchmaking.findGame')}
          </button>
        </div>
      ) : (
        <div className="card">
          <div style={{ marginBottom: '32px' }}>
            <div style={{ 
              fontSize: '64px', 
              marginBottom: '24px',
              animation: 'pulse 2s infinite'
            }}>
              🔍
            </div>
            <h2 style={{ 
              marginBottom: '16px',
              fontSize: '28px',
              color: '#d4af37'
            }}>
              {t('matchmaking.searching')}
            </h2>
            <div style={{ 
              fontSize: '15px', 
              color: 'var(--color-text-secondary)',
              marginBottom: '8px'
            }}>
              {t('matchmaking.timeControl')}: <span style={{ color: 'var(--color-text-primary)' }}>{timeControl}</span>
            </div>
            <div style={{ 
              fontSize: '15px', 
              color: 'var(--color-text-secondary)'
            }}>
              {t('matchmaking.ratingRange')}: <span style={{ color: 'var(--color-text-primary)' }}>±{eloRange}</span>
            </div>
          </div>

          <button 
            onClick={cancelSearch}
            className="btn-outline"
            style={{
              width: '100%',
              padding: '14px'
            }}
          >
            {t('matchmaking.cancel')}
          </button>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
