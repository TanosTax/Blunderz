import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiService from '../services/apiService';

export default function TournamentArchive() {
  const navigate = useNavigate();
  const { tournamentId } = useParams();
  
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingGames, setLoadingGames] = useState(false);

  useEffect(() => {
    loadCompletedTournaments();
  }, []);

  useEffect(() => {
    if (tournamentId) {
      loadTournamentDetails(tournamentId);
    }
  }, [tournamentId]);

  const loadCompletedTournaments = async () => {
    try {
      const data = await apiService.getCompletedTournaments(50);
      setTournaments(data);
    } catch (error) {
      console.error('Failed to load completed tournaments:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTournamentDetails = async (id) => {
    setLoadingGames(true);
    try {
      const [tournamentData, gamesData] = await Promise.all([
        apiService.getTournament(id),
        apiService.getTournamentGames(id)
      ]);
      setSelectedTournament(tournamentData);
      setGames(gamesData);
    } catch (error) {
      console.error('Failed to load tournament details:', error);
    } finally {
      setLoadingGames(false);
    }
  };

  const handleSelectTournament = (tournament) => {
    navigate(`/tournaments/archive/${tournament.id}`);
  };

  const handleBackToList = () => {
    navigate('/tournaments/archive');
    setSelectedTournament(null);
    setGames([]);
  };

  const getWinnerName = (tournament) => {
    if (!tournament.matches || tournament.matches.length === 0) return null;
    
    // Find the last round
    const maxRound = Math.max(...tournament.matches.map(m => m.roundNumber));
    const finalMatch = tournament.matches.find(m => m.roundNumber === maxRound && m.winnerId);
    
    if (!finalMatch) return null;
    
    const winner = tournament.participants.find(p => p.userId === finalMatch.winnerId);
    return winner?.username || null;
  };

  if (loading) {
    return (
      <div className="container" style={{ maxWidth: 1100, margin: '80px auto', textAlign: 'center' }}>
        <div className="card">
          <p>Загрузка архива турниров...</p>
        </div>
      </div>
    );
  }

  // Show tournament details view
  if (selectedTournament) {
    const winner = getWinnerName(selectedTournament);

    return (
      <div className="container" style={{ maxWidth: 1100, margin: '80px auto' }}>
        <div className="card" style={{ marginBottom: 24 }}>
          <button 
            onClick={handleBackToList}
            className="btn-outline"
            style={{ marginBottom: 16 }}
          >
            ← Назад к списку
          </button>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 16 }}>
            <div>
              <h2 style={{ margin: 0, color: '#d4af37' }}>{selectedTournament.name}</h2>
              <div style={{ marginTop: 8, color: 'var(--color-text-secondary)' }}>
                Завершён: {selectedTournament.completedAt ? new Date(selectedTournament.completedAt).toLocaleString('ru-RU') : 'N/A'}
              </div>
              <div style={{ marginTop: 4, color: 'var(--color-text-secondary)' }}>
                {selectedTournament.timeControl} · BO{selectedTournament.bestOf} · {selectedTournament.participants?.length || 0} игроков
              </div>
            </div>
            
            {winner && (
              <div style={{
                padding: '16px 24px',
                background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(212, 175, 55, 0.05) 100%)',
                border: '2px solid #d4af37',
                borderRadius: 12,
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🏆</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Победитель</div>
                <div style={{ fontSize: 20, fontWeight: 'bold', color: '#d4af37' }}>{winner}</div>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0, marginBottom: 16, color: '#d4af37' }}>
            Партии турнира ({games.length})
          </h3>

          {loadingGames ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-secondary)' }}>
              Загрузка партий...
            </div>
          ) : games.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-secondary)' }}>
              Нет завершённых партий
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {games.map((game) => (
                <div
                  key={game.id}
                  style={{
                    padding: 16,
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 8,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onClick={() => navigate(`/game/${game.id}/replay`)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#d4af37';
                    e.currentTarget.style.background = 'rgba(212, 175, 55, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-border)';
                    e.currentTarget.style.background = 'var(--color-surface)';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                        <span style={{ 
                          fontWeight: game.winnerId === game.whitePlayerId ? 'bold' : 'normal',
                          color: game.winnerId === game.whitePlayerId ? '#d4af37' : 'var(--color-text-primary)'
                        }}>
                          {game.whitePlayerUsername}
                        </span>
                        <span style={{ color: 'var(--color-text-secondary)' }}>vs</span>
                        <span style={{ 
                          fontWeight: game.winnerId === game.blackPlayerId ? 'bold' : 'normal',
                          color: game.winnerId === game.blackPlayerId ? '#d4af37' : 'var(--color-text-primary)'
                        }}>
                          {game.blackPlayerUsername}
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', gap: 16, fontSize: 14, color: 'var(--color-text-secondary)' }}>
                        <span>⏱️ {game.timeControl}</span>
                        <span>📝 {game.moveCount} ходов</span>
                        <span>
                          {game.result === 'WhiteWin' && '1-0'}
                          {game.result === 'BlackWin' && '0-1'}
                          {(game.result === 'Draw' || game.result === 'Stalemate') && '½-½'}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="btn-outline"
                        style={{ padding: '8px 16px', fontSize: 14 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/game/${game.id}/replay`);
                        }}
                      >
                        📺 Повтор
                      </button>
                      <button
                        className="btn-outline"
                        style={{ 
                          padding: '8px 16px', 
                          fontSize: 14,
                          borderColor: '#4CAF50',
                          color: '#4CAF50'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/game/${game.id}/replay?analyze=true`);
                        }}
                      >
                        🤖 Анализ
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show tournaments list view
  return (
    <div className="container" style={{ maxWidth: 1100, margin: '80px auto' }}>
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, color: '#d4af37' }}>Архив турниров</h2>
            <p style={{ color: 'var(--color-text-secondary)', marginTop: 8, marginBottom: 0 }}>
              Завершённые турниры с возможностью просмотра всех партий
            </p>
          </div>
          <button 
            onClick={() => navigate('/tournaments')}
            className="btn-outline"
          >
            ← К турнирам
          </button>
        </div>
      </div>

      {tournaments.length === 0 ? (
        <div className="card">
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-secondary)' }}>
            Пока нет завершённых турниров
          </div>
        </div>
      ) : (
        <div className="card">
          <div style={{ display: 'grid', gap: 12 }}>
            {tournaments.map((tournament) => {
              const winner = getWinnerName(tournament);
              
              return (
                <div
                  key={tournament.id}
                  style={{
                    padding: 16,
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 8,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onClick={() => handleSelectTournament(tournament)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#d4af37';
                    e.currentTarget.style.background = 'rgba(212, 175, 55, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-border)';
                    e.currentTarget.style.background = 'var(--color-surface)';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: 0, marginBottom: 8, color: '#d4af37', fontSize: 18 }}>
                        {tournament.name}
                      </h3>
                      
                      <div style={{ display: 'flex', gap: 16, fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
                        <span>⏱️ {tournament.timeControl}</span>
                        <span>🎯 BO{tournament.bestOf}</span>
                        <span>👥 {tournament.participants?.length || 0} игроков</span>
                      </div>
                      
                      <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                        Завершён: {tournament.completedAt ? new Date(tournament.completedAt).toLocaleString('ru-RU') : 'N/A'}
                      </div>
                    </div>

                    {winner && (
                      <div style={{
                        padding: '8px 16px',
                        background: 'rgba(212, 175, 55, 0.1)',
                        border: '1px solid #d4af37',
                        borderRadius: 8,
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: 20, marginBottom: 4 }}>🏆</div>
                        <div style={{ fontSize: 14, fontWeight: 'bold', color: '#d4af37' }}>
                          {winner}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
