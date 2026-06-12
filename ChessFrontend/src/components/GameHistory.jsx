import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import apiService from '../services/apiService';

export default function GameHistory({ userId }) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    loadGames();
  }, [userId, filter, page]);

  const loadGames = async () => {
    try {
      setLoading(true);
      const filterParam = filter === 'all' ? null : filter;
      const data = await apiService.getUserGameHistory(userId, filterParam, page, 20);
      setGames(data.games);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Failed to load game history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getResultBadge = (game) => {
    if (game.isWin) {
      return { text: 'Victory', color: '#4CAF50', emoji: '🏆' };
    } else if (game.isLoss) {
      return { text: 'Defeat', color: '#f44336', emoji: '😔' };
    } else {
      return { text: 'Draw', color: '#FF9800', emoji: '🤝' };
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const formatDuration = (start, end) => {
    if (!start || !end) return 'N/A';
    const diffMs = new Date(end) - new Date(start);
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m`;
  };

  if (loading && games.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
        Loading game history...
      </div>
    );
  }

  return (
    <div className="game-history-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      {/* Header */}
      <div className="game-history-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <h2 style={{ color: '#d4af37', margin: 0 }}>📜 {t('history.title')}</h2>
        <button
          onClick={() => navigate('/')}
          className="btn-outline"
          style={{ padding: '8px 16px' }}
        >
          ← {t('common.back')}
        </button>
      </div>

      {/* Filters */}
      <div className="game-history-filters" style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '24px',
        flexWrap: 'wrap'
      }}>
        {['all', 'win', 'loss', 'draw'].map(f => (
          <button
            key={f}
            className="game-history-filter-btn"
            onClick={() => {
              setFilter(f);
              setPage(1);
            }}
            style={{
              padding: '10px 20px',
              background: filter === f 
                ? 'linear-gradient(135deg, #d4af37 0%, #c9a532 100%)'
                : 'var(--color-background)',
              color: filter === f ? '#1a1a1a' : 'var(--color-text-primary)',
              border: filter === f ? 'none' : '1px solid var(--color-border)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: filter === f ? 'bold' : 'normal',
              textTransform: 'capitalize',
              transition: 'all 0.3s ease'
            }}
          >
            {f === 'all' ? 'All Games' : f === 'win' ? '🏆 Wins' : f === 'loss' ? '😔 Losses' : '🤝 Draws'}
          </button>
        ))}
      </div>

      {/* Stats Summary */}
      {pagination && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div style={{
            padding: '20px',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border-gold)',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#d4af37' }}>
              {pagination.totalGames}
            </div>
            <div style={{ color: '#888', fontSize: '14px', marginTop: '4px' }}>
              Total Games
            </div>
          </div>
        </div>
      )}

      {/* Games List */}
      {games.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: 'var(--color-surface)',
          borderRadius: '12px',
          border: '1px solid var(--color-border)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎮</div>
          <h3 style={{ color: '#d4af37', marginBottom: '8px' }}>No games found</h3>
          <p style={{ color: '#888' }}>
            {filter === 'all' 
              ? 'Start playing to build your game history!' 
              : `No ${filter}s yet. Keep playing!`}
          </p>
          <button
            onClick={() => navigate('/play')}
            className="btn-primary"
            style={{ marginTop: '20px' }}
          >
            Find a Game
          </button>
        </div>
      ) : (
        <div className="game-history-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {games.map(game => {
            const result = getResultBadge(game);
            return (
              <div
                key={game.id}
                className="game-history-item"
                style={{
                  padding: '20px',
                  background: 'var(--color-surface)',
                  border: `2px solid ${result.color}`,
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '20px'
                }}
                onClick={() => navigate(`/game/${game.id}/replay`)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = `0 4px 12px ${result.color}40`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Result Badge */}
                <div style={{
                  minWidth: '100px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '32px', marginBottom: '4px' }}>
                    {result.emoji}
                  </div>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: result.color
                  }}>
                    {result.text}
                  </div>
                </div>

                {/* Game Info */}
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '8px'
                  }}>
                    <span 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/user/${game.opponentId}`);
                      }}
                      style={{
                        fontSize: '18px',
                        fontWeight: 'bold',
                        color: 'var(--color-text-primary)',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        textDecorationColor: 'transparent',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#d4af37';
                        e.currentTarget.style.textDecorationColor = '#d4af37';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--color-text-primary)';
                        e.currentTarget.style.textDecorationColor = 'transparent';
                      }}
                    >
                      vs {game.opponentUsername}
                    </span>
                    <span style={{
                      padding: '4px 8px',
                      background: 'rgba(212, 175, 55, 0.2)',
                      color: '#d4af37',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {game.opponentElo}
                    </span>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    gap: '16px',
                    fontSize: '13px',
                    color: '#888'
                  }}>
                    <span>
                      {game.playerColor === 'white' ? '⚪' : '⚫'} Playing as {game.playerColor}
                    </span>
                    <span>⏱️ {game.timeControl}</span>
                    <span>🕐 {formatDuration(game.createdAt, game.completedAt)}</span>
                  </div>
                </div>

                {/* Date */}
                <div style={{
                  textAlign: 'right',
                  minWidth: '100px'
                }}>
                  <div style={{
                    fontSize: '13px',
                    color: '#888'
                  }}>
                    {formatDate(game.completedAt)}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: '#666',
                    marginTop: '4px'
                  }}>
                    Click to replay
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '12px',
          marginTop: '32px'
        }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-outline"
            style={{
              padding: '8px 16px',
              opacity: page === 1 ? 0.5 : 1,
              cursor: page === 1 ? 'not-allowed' : 'pointer'
            }}
          >
            ← Previous
          </button>
          
          <span style={{ color: '#888' }}>
            Page {page} of {pagination.totalPages}
          </span>
          
          <button
            onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
            disabled={page === pagination.totalPages}
            className="btn-outline"
            style={{
              padding: '8px 16px',
              opacity: page === pagination.totalPages ? 0.5 : 1,
              cursor: page === pagination.totalPages ? 'not-allowed' : 'pointer'
            }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
