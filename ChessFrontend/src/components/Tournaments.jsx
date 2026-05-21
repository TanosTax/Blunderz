import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/apiService';
import '../styles/tournaments-responsive.css';

function slugify(input) {
  return (input || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9_-]/g, '');
}

export default function Tournaments({ userId }) {
  const navigate = useNavigate();

  const [roomName, setRoomName] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState(null);
  const [activeTournaments, setActiveTournaments] = useState([]);
  const [loadingTournaments, setLoadingTournaments] = useState(true);

  const [name, setName] = useState('School Cup');
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');
  const [timeControl, setTimeControl] = useState('5+0');
  const [bestOf, setBestOf] = useState(1);
  const [breakMinutesBetweenRounds, setBreakMinutesBetweenRounds] = useState(5);

  const normalizedRoomName = useMemo(() => slugify(roomName), [roomName]);

  // Load active tournaments
  useEffect(() => {
    const loadActiveTournaments = async () => {
      try {
        const tournaments = await apiService.getActiveTournaments();
        setActiveTournaments(tournaments);
      } catch (e) {
        console.error('Failed to load active tournaments:', e);
      } finally {
        setLoadingTournaments(false);
      }
    };

    loadActiveTournaments();
    
    // Refresh every 5 seconds
    const interval = setInterval(loadActiveTournaments, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setError(null);
  }, [roomName, name, isPrivate, password, timeControl, bestOf, breakMinutesBetweenRounds]);

  // Auto-suggest tournament code from name (can still edit manually)
  useEffect(() => {
    if (!roomName) {
      setRoomName(slugify(name));
    }
  }, [name]);

  const handleJoinByRoom = async () => {
    setJoining(true);
    try {
      const t = await apiService.getTournamentByRoom(normalizedRoomName);
      navigate(`/t/${t.roomName}`);
    } catch (e) {
      setError(e.message || 'Failed to join');
    } finally {
      setJoining(false);
    }
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      const payload = {
        creatorUserId: userId,
        roomName: normalizedRoomName,
        name,
        timeControl,
        bestOf,
        breakMinutesBetweenRounds,
        isPrivate,
        password: isPrivate ? password : null
      };

      const t = await apiService.createTournament(payload);
      // auto-navigate to lobby
      navigate(`/t/${t.roomName}`);
    } catch (e) {
      setError(e.message || 'Failed to create tournament');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="tournaments-container container" style={{ maxWidth: 800, margin: '80px auto' }}>
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="tournaments-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, color: '#d4af37' }}>Tournaments</h2>
            <p style={{ color: 'var(--color-text-secondary)', marginTop: 8, marginBottom: 0 }}>
              Create a single-elimination tournament, share the room name, and play BO1/BO3 with a break between rounds.
            </p>
          </div>
          <button 
            onClick={() => navigate('/tournaments/archive')}
            className="btn-outline"
            style={{ padding: '10px 16px' }}
          >
            📚 Архив
          </button>
        </div>

        <div className="tournament-join-grid" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', marginBottom: 8 }}>Код турнира (ввод для входа)</label>
            <input
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="например: school-cup-8a"
              style={{ width: '100%' }}
            />
            <div style={{ marginTop: 6, fontSize: 12, color: 'var(--color-text-secondary)' }}>
              Будет сохранено как: <span style={{ color: 'var(--color-text-primary)' }}>{normalizedRoomName || '—'}</span>
            </div>
          </div>
          <button className="btn-outline" disabled={!normalizedRoomName || joining} onClick={handleJoinByRoom}>
            {joining ? 'Открываю…' : 'Открыть'}
          </button>
        </div>

        {error && (
          <div style={{ marginTop: 12, color: '#ff6b6b' }}>
            {error}
          </div>
        )}
      </div>

      {/* Active Tournaments List */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ marginTop: 0, marginBottom: 16, color: '#d4af37' }}>Активные турниры</h3>
        
        {loadingTournaments ? (
          <div style={{ textAlign: 'center', padding: 20, color: 'var(--color-text-secondary)' }}>
            Загрузка...
          </div>
        ) : activeTournaments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 20, color: 'var(--color-text-secondary)' }}>
            Нет активных турниров. Создайте первый!
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {activeTournaments.map((tournament) => (
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
                onClick={() => navigate(`/t/${tournament.roomName}`)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#d4af37';
                  e.currentTarget.style.background = 'rgba(212, 175, 55, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-border)';
                  e.currentTarget.style.background = 'var(--color-surface)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                  <div>
                    <h4 style={{ margin: 0, color: '#d4af37', fontSize: 18 }}>
                      {tournament.name}
                      {tournament.isPrivate && <span style={{ marginLeft: 8, fontSize: 14 }}>🔒</span>}
                    </h4>
                    <div style={{ marginTop: 4, fontSize: 14, color: 'var(--color-text-secondary)' }}>
                      Код: <span style={{ color: 'var(--color-text-primary)', fontWeight: 'bold' }}>{tournament.roomName}</span>
                    </div>
                  </div>
                  <div style={{
                    padding: '4px 12px',
                    borderRadius: 12,
                    fontSize: 12,
                    fontWeight: 'bold',
                    background: tournament.status === 'InProgress' 
                      ? 'rgba(76, 175, 80, 0.2)' 
                      : 'rgba(33, 150, 243, 0.2)',
                    color: tournament.status === 'InProgress' ? '#4CAF50' : '#2196F3'
                  }}>
                    {tournament.status === 'InProgress' ? 'В игре' : '📝 Регистрация'}
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: 16, fontSize: 14, color: 'var(--color-text-secondary)' }}>
                  <span>⏱️ {tournament.timeControl}</span>
                  <span>🎯 BO{tournament.bestOf}</span>
                  <span>👥 {tournament.participants?.length || 0} игроков</span>
                  {tournament.status === 'InProgress' && tournament.currentRound > 0 && (
                    <span>🏆 Раунд {tournament.currentRound}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0, marginBottom: 16, color: '#d4af37' }}>Создать турнир</h3>

        <div className="tournament-create-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 8 }}>Название турнира (для отображения)</label>
            <input value={name} onChange={(e) => setName(e.target.value)} style={{ width: '100%' }} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 8 }}>Контроль времени</label>
            <select value={timeControl} onChange={(e) => setTimeControl(e.target.value)} style={{ width: '100%' }}>
              <option value="1+0">Bullet (1+0)</option>
              <option value="3+0">Blitz (3+0)</option>
              <option value="5+0">Blitz (5+0)</option>
              <option value="10+0">Rapid (10+0)</option>
              <option value="15+10">Rapid (15+10)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 8 }}>Формат матча</label>
            <select value={bestOf} onChange={(e) => setBestOf(Number(e.target.value))} style={{ width: '100%' }}>
              <option value={1}>BO1 (first win)</option>
              <option value={3}>BO3 (first to 2 wins)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 8 }}>Перерыв между раундами (минуты)</label>
            <input
              type="number"
              min={0}
              max={120}
              value={breakMinutesBetweenRounds}
              onChange={(e) => setBreakMinutesBetweenRounds(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <label style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} />
            Приватный турнир (нужен пароль)
          </label>
          {isPrivate && (
            <div style={{ marginTop: 10 }}>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="пароль (3..64 символа)"
                style={{ width: '100%' }}
              />
            </div>
          )}
        </div>

        <div className="tournament-create-actions" style={{ marginTop: 16 }}>
          <button
            className="btn-primary"
            disabled={!normalizedRoomName || creating || !name || (isPrivate && password.length < 3)}
            onClick={handleCreate}
            style={{ width: '100%', padding: 14 }}
          >
            {creating ? 'Создаю…' : 'Создать и открыть лобби'}
          </button>
        </div>
      </div>
    </div>
  );
}

