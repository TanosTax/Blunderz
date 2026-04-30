import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import apiService from '../services/apiService';

export default function LiveGames() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActiveGames();
    
    // Refresh every 10 seconds
    const interval = setInterval(loadActiveGames, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadActiveGames = async () => {
    try {
      console.log('Loading active games...');
      const activeGames = await apiService.getActiveGames();
      console.log('Active games loaded:', activeGames);
      setGames(activeGames);
    } catch (error) {
      console.error('Failed to load active games:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWatchGame = (gameId) => {
    navigate(`/watch/${gameId}`);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', color: '#888' }}>
        {t('common.loading')}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div className="card">
        <h2 style={{ color: '#d4af37', margin: '0 0 20px 0' }}>
          🔴 {t('liveGames.title')}
        </h2>

        {games.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#888', padding: '40px' }}>
            {t('liveGames.noGames')}
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {games.map(game => (
              <div
                key={game.id}
                style={{
                  padding: '20px',
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '12px',
                  display: 'grid',
                  gridTemplateColumns: '1fr auto 1fr auto',
                  alignItems: 'center',
                  gap: '20px',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onClick={() => handleWatchGame(game.id)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#d4af37';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-border)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {/* White Player */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#fff', fontSize: '18px', fontWeight: '600', marginBottom: '4px' }}>
                    {game.whitePlayer.username}
                  </div>
                  <div style={{ color: '#888', fontSize: '14px' }}>
                    {game.whitePlayer.elo}
                  </div>
                </div>

                {/* VS */}
                <div style={{ 
                  color: '#d4af37', 
                  fontSize: '16px', 
                  fontWeight: '700',
                  padding: '0 16px'
                }}>
                  VS
                </div>

                {/* Black Player */}
                <div style={{ textAlign: 'left' }}>
                  <div style={{ color: '#fff', fontSize: '18px', fontWeight: '600', marginBottom: '4px' }}>
                    {game.blackPlayer.username}
                  </div>
                  <div style={{ color: '#888', fontSize: '14px' }}>
                    {game.blackPlayer.elo}
                  </div>
                </div>

                {/* Game Info */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{ 
                    color: '#d4af37', 
                    fontSize: '14px', 
                    marginBottom: '4px',
                    fontWeight: '600'
                  }}>
                    {game.timeControl}
                  </div>
                  <div style={{ color: '#888', fontSize: '13px' }}>
                    {t('liveGames.moves')}: {game.moveCount}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleWatchGame(game.id);
                    }}
                    className="btn-primary"
                    style={{ 
                      marginTop: '8px',
                      padding: '6px 16px',
                      fontSize: '13px'
                    }}
                  >
                    👁️ {t('liveGames.watch')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
