import { useState, useEffect } from 'react';
import apiService from '../services/apiService';

export default function Leaderboard() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const data = await apiService.getLeaderboard(50);
      setPlayers(data);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>;
  }

  return (
    <div style={{ maxWidth: '800px', margin: '20px auto', padding: '20px' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>🏆 Leaderboard</h2>
      
      <div style={{ 
        border: '1px solid #ccc', 
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f5f5f5' }}>
              <th style={{ padding: '15px', textAlign: 'left' }}>Rank</th>
              <th style={{ padding: '15px', textAlign: 'left' }}>Player</th>
              <th style={{ padding: '15px', textAlign: 'center' }}>Rating</th>
              <th style={{ padding: '15px', textAlign: 'center' }}>Games</th>
              <th style={{ padding: '15px', textAlign: 'center' }}>Win Rate</th>
            </tr>
          </thead>
          <tbody>
            {players.map((player, index) => {
              const winRate = player.gamesPlayed > 0 
                ? ((player.wins / player.gamesPlayed) * 100).toFixed(1) 
                : 0;

              return (
                <tr 
                  key={player.id}
                  style={{ 
                    borderTop: '1px solid #eee',
                    backgroundColor: index < 3 ? '#fffbf0' : 'white'
                  }}
                >
                  <td style={{ padding: '15px' }}>
                    <span style={{ 
                      fontWeight: 'bold',
                      fontSize: index < 3 ? '20px' : '16px'
                    }}>
                      {index === 0 && '🥇'}
                      {index === 1 && '🥈'}
                      {index === 2 && '🥉'}
                      {index > 2 && `#${index + 1}`}
                    </span>
                  </td>
                  <td style={{ padding: '15px', fontWeight: '500' }}>
                    {player.username}
                  </td>
                  <td style={{ 
                    padding: '15px', 
                    textAlign: 'center',
                    fontWeight: 'bold',
                    fontSize: '18px',
                    color: '#4CAF50'
                  }}>
                    {player.elo}
                  </td>
                  <td style={{ padding: '15px', textAlign: 'center' }}>
                    {player.gamesPlayed}
                  </td>
                  <td style={{ padding: '15px', textAlign: 'center' }}>
                    {winRate}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {players.length === 0 && (
        <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>
          No players yet. Be the first!
        </div>
      )}
    </div>
  );
}
