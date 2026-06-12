import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GiChessKnight } from 'react-icons/gi';
import { useLanguage } from '../i18n/LanguageContext';
import apiService from '../services/apiService';

export default function Leaderboard() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('rapid');

  const categories = [
    { id: 'bullet', name: 'Bullet', icon: '⚡', desc: '< 3 min' },
    { id: 'blitz', name: 'Blitz', icon: '⚡', desc: '3-10 min' },
    { id: 'rapid', name: 'Rapid', icon: '🎯', desc: '10-30 min' },
    { id: 'classical', name: 'Classical', icon: '♟️', desc: '30+ min' }
  ];

  useEffect(() => {
    loadLeaderboard();
  }, [category]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const data = await apiService.getLeaderboard(50, category);
      setPlayers(data);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRating = (player) => {
    switch (category) {
      case 'bullet': return player.bulletRating;
      case 'blitz': return player.blitzRating;
      case 'rapid': return player.rapidRating;
      case 'classical': return player.classicalRating;
      default: return player.rapidRating;
    }
  };

  if (loading) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '50px',
        color: 'var(--color-text-primary)'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <div className="container" style={{ 
      maxWidth: '1000px', 
      margin: '80px auto', 
      padding: '20px' 
    }}>
      {/* Header */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '40px' 
      }}>
        <div style={{
          display: 'inline-block',
          padding: '15px',
          background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(212, 175, 55, 0.05) 100%)',
          borderRadius: '20px',
          border: '2px solid #d4af37',
          marginBottom: '20px'
        }}>
          <GiChessKnight 
            size={60} 
            style={{ 
              color: '#d4af37',
              filter: 'drop-shadow(0 0 15px rgba(212, 175, 55, 0.6))'
            }} 
          />
        </div>
        <h1 style={{ 
          fontSize: '42px', 
          marginBottom: '10px',
          color: '#d4af37',
          textShadow: '0 0 20px rgba(212, 175, 55, 0.3)'
        }}>
          🏆 {t('leaderboard.title')}
        </h1>
        <p style={{ 
          color: 'var(--color-text-secondary)', 
          fontSize: '16px' 
        }}>
          {t('leaderboard.topPlayers') || 'Top players by rating category'}
        </p>
      </div>

      {/* Category Tabs */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '30px',
        justifyContent: 'center',
        flexWrap: 'wrap'
      }}>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            style={{
              padding: '12px 24px',
              background: category === cat.id
                ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.1) 100%)'
                : 'var(--color-background)',
              border: category === cat.id
                ? '2px solid #d4af37'
                : '1px solid var(--color-border)',
              borderRadius: '8px',
              color: category === cat.id ? '#d4af37' : 'var(--color-text-primary)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              fontSize: '15px',
              fontWeight: category === cat.id ? '600' : '500'
            }}
            onMouseEnter={(e) => {
              if (category !== cat.id) {
                e.currentTarget.style.borderColor = '#d4af37';
              }
            }}
            onMouseLeave={(e) => {
              if (category !== cat.id) {
                e.currentTarget.style.borderColor = 'var(--color-border)';
              }
            }}
          >
            <div>{cat.icon} {cat.name}</div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              {cat.desc}
            </div>
          </button>
        ))}
      </div>

      {/* Leaderboard Table */}
      <div className="card" style={{ 
        padding: 0,
        overflow: 'hidden'
      }}>
        <div className="leaderboard-table-wrapper" style={{ overflowX: 'auto' }}>
          <table className="leaderboard-table" style={{ 
            width: '100%', 
            borderCollapse: 'collapse' 
          }}>
          <thead>
            <tr style={{ 
              background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(212, 175, 55, 0.05) 100%)',
              borderBottom: '2px solid #d4af37'
            }}>
              <th style={{ 
                padding: '16px', 
                textAlign: 'left',
                color: '#d4af37',
                fontWeight: '600',
                fontSize: '14px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {t('leaderboard.rank')}
              </th>
              <th style={{ 
                padding: '16px', 
                textAlign: 'left',
                color: '#d4af37',
                fontWeight: '600',
                fontSize: '14px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {t('leaderboard.player')}
              </th>
              <th style={{ 
                padding: '16px', 
                textAlign: 'center',
                color: '#d4af37',
                fontWeight: '600',
                fontSize: '14px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {t('leaderboard.rating')}
              </th>
              <th style={{ 
                padding: '16px', 
                textAlign: 'center',
                color: '#d4af37',
                fontWeight: '600',
                fontSize: '14px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {t('leaderboard.games')}
              </th>
              <th style={{ 
                padding: '16px', 
                textAlign: 'center',
                color: '#d4af37',
                fontWeight: '600',
                fontSize: '14px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {t('leaderboard.winRate')}
              </th>
            </tr>
          </thead>
          <tbody>
            {players.map((player, index) => {
              const winRate = player.gamesPlayed > 0 
                ? ((player.wins / player.gamesPlayed) * 100).toFixed(1) 
                : 0;
              const rating = getRating(player);

              return (
                <tr 
                  key={player.id}
                  style={{ 
                    borderTop: '1px solid var(--color-border)',
                    background: index < 3 
                      ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.05) 0%, rgba(212, 175, 55, 0.02) 100%)'
                      : 'transparent',
                    transition: 'background 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(212, 175, 55, 0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = index < 3 
                      ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.05) 0%, rgba(212, 175, 55, 0.02) 100%)'
                      : 'transparent';
                  }}
                >
                  <td style={{ padding: '16px' }}>
                    <span style={{ 
                      fontWeight: 'bold',
                      fontSize: index < 3 ? '24px' : '16px',
                      color: index < 3 ? '#d4af37' : 'var(--color-text-secondary)'
                    }}>
                      {index === 0 && '🥇'}
                      {index === 1 && '🥈'}
                      {index === 2 && '🥉'}
                      {index > 2 && `#${index + 1}`}
                    </span>
                  </td>
                  <td 
                    onClick={() => navigate(`/user/${player.id}`)}
                    style={{ 
                      padding: '16px', 
                      fontWeight: '500',
                      color: 'var(--color-text-primary)',
                      fontSize: '15px',
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
                    {player.username}
                  </td>
                  <td style={{ 
                    padding: '16px', 
                    textAlign: 'center',
                    fontWeight: 'bold',
                    fontSize: '20px',
                    color: '#d4af37'
                  }}>
                    {rating}
                  </td>
                  <td style={{ 
                    padding: '16px', 
                    textAlign: 'center',
                    color: 'var(--color-text-secondary)',
                    fontSize: '14px'
                  }}>
                    {player.gamesPlayed}
                  </td>
                  <td style={{ 
                    padding: '16px', 
                    textAlign: 'center',
                    color: winRate >= 50 ? '#4CAF50' : 'var(--color-text-secondary)',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    {winRate}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>

      {players.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px', 
          color: 'var(--color-text-secondary)',
          fontSize: '16px'
        }}>
          No players yet. Be the first!
        </div>
      )}
    </div>
  );
}
