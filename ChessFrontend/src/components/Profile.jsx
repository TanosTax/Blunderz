import { useState, useEffect } from 'react';
import apiService from '../services/apiService';

export default function Profile({ userId }) {
  const [user, setUser] = useState(null);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, [userId]);

  const loadUserData = async () => {
    try {
      const [userData, userGames] = await Promise.all([
        apiService.getUser(userId),
        apiService.getUserGames(userId)
      ]);

      setUser(userData);
      setGames(userGames);
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>;
  }

  if (!user) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>User not found</div>;
  }

  const winRate = user.gamesPlayed > 0 
    ? ((user.wins / user.gamesPlayed) * 100).toFixed(1) 
    : 0;

  return (
    <div style={{ maxWidth: '800px', margin: '20px auto', padding: '20px' }}>
      <div style={{ 
        border: '1px solid #ccc', 
        borderRadius: '8px', 
        padding: '30px',
        marginBottom: '30px'
      }}>
        <h2>{user.username}</h2>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '20px',
          marginTop: '20px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#4CAF50' }}>
              {user.elo}
            </div>
            <div style={{ color: '#666' }}>Rating</div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
              {user.gamesPlayed}
            </div>
            <div style={{ color: '#666' }}>Games</div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#2196F3' }}>
              {user.wins}
            </div>
            <div style={{ color: '#666' }}>Wins</div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f44336' }}>
              {user.losses}
            </div>
            <div style={{ color: '#666' }}>Losses</div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#FF9800' }}>
              {user.draws}
            </div>
            <div style={{ color: '#666' }}>Draws</div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
              {winRate}%
            </div>
            <div style={{ color: '#666' }}>Win Rate</div>
          </div>
        </div>
      </div>

      <div>
        <h3>Recent Games</h3>
        {games.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', color: '#666' }}>
            No games played yet
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {games.slice(0, 10).map((game) => {
              const isWhite = game.whitePlayerId === userId;
              const opponent = isWhite ? game.blackPlayer : game.whitePlayer;
              
              let resultText = 'In Progress';
              let resultColor = '#666';
              
              // GameStatus: 0 = Pending, 1 = Active, 2 = Completed
              if (game.status === 2) {
                if (game.winnerId === userId) {
                  resultText = 'Win';
                  resultColor = '#4CAF50';
                } else if (game.winnerId === null) {
                  resultText = 'Draw';
                  resultColor = '#FF9800';
                } else {
                  resultText = 'Loss';
                  resultColor = '#f44336';
                }
              } else if (game.status === 1) {
                resultText = 'Active';
                resultColor = '#2196F3';
              } else if (game.status === 0) {
                resultText = 'Pending';
                resultColor = '#9E9E9E';
              }

              return (
                <div 
                  key={game.id}
                  style={{
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    padding: '15px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 'bold' }}>
                      vs {opponent?.username || 'Unknown'}
                    </div>
                    <div style={{ fontSize: '14px', color: '#666' }}>
                      {isWhite ? 'White' : 'Black'} • {game.timeControl}
                    </div>
                  </div>
                  <div style={{ 
                    fontWeight: 'bold', 
                    fontSize: '18px',
                    color: resultColor 
                  }}>
                    {resultText}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
