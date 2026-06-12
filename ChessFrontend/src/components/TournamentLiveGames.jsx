import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/apiService';

export default function TournamentLiveGames({ tournamentId, currentUserId, onClose }) {
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGames();
    
    // Refresh every 3 seconds
    const interval = setInterval(loadGames, 3000);
    return () => clearInterval(interval);
  }, [tournamentId]);

  const loadGames = async () => {
    try {
      const data = await apiService.getTournamentGames(tournamentId);
      // Filter only active games
      const activeGames = data.filter(g => g.status === 'Active');
      setGames(activeGames);
    } catch (error) {
      console.error('Failed to load tournament games:', error);
    } finally {
      setLoading(false);
    }
  };

  const isMyGame = (game) => {
    return game.whitePlayerId === currentUserId || game.blackPlayerId === currentUserId;
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        borderRadius: '12px',
        padding: '30px',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 0 30px rgba(212, 175, 55, 0.3)',
        border: '2px solid #d4af37'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, color: '#d4af37' }}>👁️ Активные игры турнира</h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#888',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '0 8px'
            }}
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-secondary)' }}>
            Загрузка...
          </div>
        ) : games.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-secondary)' }}>
            Нет активных игр в данный момент
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {games.map((game) => {
              const myGame = isMyGame(game);
              
              return (
                <div
                  key={game.id}
                  style={{
                    padding: 16,
                    background: myGame ? 'rgba(212, 175, 55, 0.1)' : 'var(--color-surface)',
                    border: myGame ? '2px solid #d4af37' : '1px solid var(--color-border)',
                    borderRadius: 8,
                    cursor: myGame ? 'default' : 'pointer',
                    transition: 'all 0.2s ease',
                    opacity: myGame ? 0.7 : 1
                  }}
                  onClick={() => {
                    if (!myGame) {
                      navigate(`/watch/${game.id}`);
                      onClose();
                    }
                  }}
                  onMouseEnter={(e) => {
                    if (!myGame) {
                      e.currentTarget.style.borderColor = '#d4af37';
                      e.currentTarget.style.background = 'rgba(212, 175, 55, 0.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!myGame) {
                      e.currentTarget.style.borderColor = 'var(--color-border)';
                      e.currentTarget.style.background = 'var(--color-surface)';
                    }
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                        <span style={{ 
                          fontWeight: 'bold',
                          color: 'var(--color-text-primary)'
                        }}>
                          {game.whitePlayerUsername}
                        </span>
                        <span style={{ color: 'var(--color-text-secondary)' }}>vs</span>
                        <span style={{ 
                          fontWeight: 'bold',
                          color: 'var(--color-text-primary)'
                        }}>
                          {game.blackPlayerUsername}
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', gap: 16, fontSize: 14, color: 'var(--color-text-secondary)' }}>
                        <span>⏱️ {game.timeControl}</span>
                        <span>📝 {game.moveCount} ходов</span>
                        {myGame && <span style={{ color: '#d4af37', fontWeight: 'bold' }}>🎮 Ваша игра</span>}
                      </div>
                    </div>

                    {!myGame && (
                      <div style={{
                        padding: '8px 16px',
                        background: 'rgba(33, 150, 243, 0.2)',
                        color: '#2196F3',
                        borderRadius: 8,
                        fontSize: 14,
                        fontWeight: 'bold'
                      }}>
                        👁️ Смотреть
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <button
            onClick={onClose}
            className="btn-outline"
            style={{ padding: '12px 24px' }}
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
