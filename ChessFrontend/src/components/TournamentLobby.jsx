import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import apiService from '../services/apiService';

function sortBySeed(participants) {
  return [...participants].sort((a, b) => (a.seed ?? 0) - (b.seed ?? 0));
}

export default function TournamentLobby({ userId }) {
  const { roomName } = useParams();
  const navigate = useNavigate();

  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [savingSeeds, setSavingSeeds] = useState(false);
  const [starting, setStarting] = useState(false);
  const [autoRedirectEnabled, setAutoRedirectEnabled] = useState(() => {
    const v = localStorage.getItem('tournamentAutoRedirect');
    return v === null ? true : v === 'true';
  });

  const pollRef = useRef(null);
  const redirectRef = useRef(false);
  const tickRef = useRef(null);

  const isCreator = tournament?.creatorUserId === userId;

  useEffect(() => {
    localStorage.setItem('tournamentAutoRedirect', String(autoRedirectEnabled));
  }, [autoRedirectEnabled]);

  const participants = useMemo(() => {
    if (!tournament?.participants) return [];
    return sortBySeed(tournament.participants);
  }, [tournament]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const t = await apiService.getTournamentByRoom(roomName);
        setTournament(t);
      } catch (e) {
        setError(e.message || 'Failed to load tournament');
      } finally {
        setLoading(false);
      }
    };

    load();

    pollRef.current = setInterval(async () => {
      try {
        const t = await apiService.getTournamentByRoom(roomName);
        setTournament(t);
      } catch {
        // ignore polling errors
      }
    }, 2000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [roomName]);

  useEffect(() => {
    if (!tournament) return;
    if (tournament.status !== 'InProgress') return;

    // Auto-redirect players to their first-round game after a short delay (15s from tournament start).
    // This is "cool UX" for school usage: everyone hits Start and players get taken to their boards.
    if (!autoRedirectEnabled) {
      navigate(`/t/${tournament.roomName}/bracket`);
      return;
    }

    const matches = tournament.matches || [];
    const myActive = matches.find(
      (m) =>
        m.status === 'InProgress' &&
        m.gameId &&
        (m.playerAId === userId || m.playerBId === userId)
    );

    // If no active match yet, just go to bracket and keep polling there.
    if (!myActive) {
      navigate(`/t/${tournament.roomName}/bracket`);
      return;
    }

    if (redirectRef.current) return;

    // For tournament start: enforce a 15s delay before sending players to boards.
    // For later rounds: redirect shortly after your match becomes active.
    const startedAt = tournament.startedAt ? new Date(tournament.startedAt).getTime() : Date.now();
    const tournamentStartGate = startedAt + 15000;
    const redirectAt = Date.now() < tournamentStartGate ? tournamentStartGate : Date.now() + 1000;

    const maybeRedirect = () => {
      if (redirectRef.current) return;
      const now = Date.now();
      if (now >= redirectAt) {
        redirectRef.current = true;
        window.location.href = `/game/${myActive.gameId}?t=${encodeURIComponent(tournament.roomName)}`;
      }
    };

    // Try immediately and then tick.
    maybeRedirect();
    tickRef.current = setInterval(maybeRedirect, 250);

    return () => {
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
    };
  }, [tournament?.status, tournament?.matches, tournament?.startedAt, userId]);

  const join = async () => {
    setError(null);
    try {
      const t = await apiService.joinTournament(tournament.id, userId, password || null);
      setTournament(t);
    } catch (e) {
      setError(e.message || 'Failed to join');
    }
  };

  const leave = async () => {
    setError(null);
    try {
      const t = await apiService.leaveTournament(tournament.id, userId);
      setTournament(t);
    } catch (e) {
      setError(e.message || 'Failed to leave');
    }
  };

  const saveSeeds = async (newOrder) => {
    setSavingSeeds(true);
    try {
      const seeds = newOrder.map((p, idx) => ({ userId: p.userId, seed: idx + 1 }));
      const t = await apiService.updateTournamentSeeds(tournament.id, userId, seeds);
      setTournament(t);
    } catch (e) {
      setError(e.message || 'Failed to save seeds');
    } finally {
      setSavingSeeds(false);
    }
  };

  const start = async () => {
    setStarting(true);
    setError(null);
    try {
      const t = await apiService.startTournament(tournament.id, userId);
      setTournament(t);
    } catch (e) {
      setError(e.message || 'Failed to start');
    } finally {
      setStarting(false);
    }
  };

  // Drag & drop reorder (only creator, before start)
  const [dragIndex, setDragIndex] = useState(null);
  const [draftOrder, setDraftOrder] = useState(null);

  useEffect(() => {
    setDraftOrder(participants);
  }, [participants.length]);

  const canEditSeeds = isCreator && (tournament?.status === 'Registration' || tournament?.status === 'Draft');
  const order = draftOrder || participants;

  const onDragStart = (idx) => {
    if (!canEditSeeds) return;
    setDragIndex(idx);
  };

  const onDragOver = (e) => {
    if (!canEditSeeds) return;
    e.preventDefault();
  };

  const onDrop = (idx) => {
    if (!canEditSeeds) return;
    if (dragIndex === null || dragIndex === idx) return;
    const next = [...order];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(idx, 0, moved);
    setDraftOrder(next);
    setDragIndex(null);
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 60 }}>Loading tournament…</div>;
  }

  if (!tournament) {
    return <div style={{ textAlign: 'center', padding: 60 }}>Tournament not found</div>;
  }

  const joined = participants.some((p) => p.userId === userId);
  const canShowCountdown = tournament.status === 'InProgress' && tournament.startedAt;
  const countdownSecondsLeft = canShowCountdown
    ? Math.max(0, Math.ceil((new Date(tournament.startedAt).getTime() + 15000 - Date.now()) / 1000))
    : 0;

  return (
    <div className="container" style={{ maxWidth: 900, margin: '80px auto' }}>
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ margin: 0, color: '#d4af37' }}>{tournament.name}</h2>
            <div style={{ marginTop: 8, color: 'var(--color-text-secondary)' }}>
              Room: <b style={{ color: 'var(--color-text-primary)' }}>{tournament.roomName}</b> · {tournament.timeControl} · BO{tournament.bestOf} · break {tournament.breakMinutesBetweenRounds}m
            </div>
            <label style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 10, color: 'var(--color-text-secondary)' }}>
              <input
                type="checkbox"
                checked={autoRedirectEnabled}
                onChange={(e) => {
                  redirectRef.current = false; // allow future redirects if re-enabled
                  setAutoRedirectEnabled(e.target.checked);
                }}
              />
              Автопереход в игру
            </label>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Link to="/tournaments" className="btn-outline" style={{ textDecoration: 'none', padding: '10px 14px' }}>
              Back
            </Link>
            <Link to={`/t/${tournament.roomName}/bracket`} className="btn-outline" style={{ textDecoration: 'none', padding: '10px 14px' }}>
              Bracket
            </Link>
          </div>
        </div>

        {error && <div style={{ marginTop: 12, color: '#ff6b6b' }}>{error}</div>}
      </div>

      {canShowCountdown && countdownSecondsLeft > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <b style={{ color: '#d4af37' }}>Tournament started</b>
              <div style={{ marginTop: 6, color: 'var(--color-text-secondary)' }}>
                Redirecting players to their boards in <b style={{ color: 'var(--color-text-primary)' }}>{countdownSecondsLeft}s</b>…
              </div>
            </div>
            <Link
              to={`/t/${tournament.roomName}/bracket`}
              className="btn-outline"
              style={{ textDecoration: 'none', padding: '10px 14px', alignSelf: 'center' }}
            >
              Open bracket
            </Link>
          </div>
        </div>
      )}

      <div className="card">
        <h3 style={{ marginTop: 0, marginBottom: 12, color: '#d4af37' }}>Participants ({participants.length})</h3>

        {!joined ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'end', marginBottom: 16 }}>
            {tournament.isPrivate ? (
              <div>
                <label style={{ display: 'block', marginBottom: 8 }}>Password</label>
                <input value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%' }} />
              </div>
            ) : (
              <div style={{ color: 'var(--color-text-secondary)' }}>This tournament is public.</div>
            )}
            <button className="btn-primary" onClick={join}>
              Join
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
            <div style={{ color: 'var(--color-text-secondary)' }}>
              You joined. {canEditSeeds ? 'As creator, you can reorder players before starting.' : ''}
            </div>
            <button className="btn-outline" onClick={leave}>
              Leave
            </button>
          </div>
        )}

        <div style={{ display: 'grid', gap: 10 }}>
          {order.map((p, idx) => (
            <div
              key={p.userId}
              draggable={canEditSeeds}
              onDragStart={() => onDragStart(idx)}
              onDragOver={onDragOver}
              onDrop={() => onDrop(idx)}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                cursor: canEditSeeds ? 'grab' : 'default'
              }}
              title={canEditSeeds ? 'Drag to reorder seeds' : undefined}
            >
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ color: 'var(--color-text-secondary)', width: 36 }}>#{idx + 1}</span>
                <b>{p.username}</b>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}>{p.status}</span>
              </div>
              {p.userId === tournament.creatorUserId && (
                <span style={{ color: '#d4af37', fontWeight: 600 }}>creator</span>
              )}
            </div>
          ))}
        </div>

        {canEditSeeds && (
          <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
            <button className="btn-outline" disabled={savingSeeds || !draftOrder} onClick={() => setDraftOrder(participants)}>
              Reset order
            </button>
            <button className="btn-outline" disabled={savingSeeds || !draftOrder} onClick={() => saveSeeds(order)}>
              {savingSeeds ? 'Saving…' : 'Save order'}
            </button>
            <button className="btn-primary" disabled={starting || participants.length < 2} onClick={start} style={{ marginLeft: 'auto' }}>
              {starting ? 'Starting…' : 'Start tournament'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

