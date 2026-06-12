import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import apiService from '../services/apiService';

function groupByRound(matches) {
  const map = new Map();
  for (const m of matches) {
    const r = m.roundNumber || 1;
    if (!map.has(r)) map.set(r, []);
    map.get(r).push(m);
  }
  return [...map.entries()].sort((a, b) => a[0] - b[0]);
}

export default function TournamentBracket({ userId }) {
  const { roomName } = useParams();
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef(null);
  const autoNavRef = useRef(false);
  const [autoRedirectEnabled, setAutoRedirectEnabled] = useState(() => {
    const v = localStorage.getItem('tournamentAutoRedirect');
    return v === null ? true : v === 'true';
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const t = await apiService.getTournamentByRoom(roomName);
        setTournament(t);
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
        // ignore
      }
    }, 2000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [roomName]);

  useEffect(() => {
    if (!tournament) return;
    if (tournament.status !== 'InProgress') return;
    if (!autoRedirectEnabled) return;
    if (autoNavRef.current) return;

    const myActive = (tournament.matches || []).find(
      (m) =>
        m.status === 'InProgress' &&
        m.gameId &&
        (m.playerAId === userId || m.playerBId === userId)
    );

    if (!myActive?.gameId) return;

    const startedAt = tournament.startedAt ? new Date(tournament.startedAt).getTime() : Date.now();
    const tournamentStartGate = startedAt + 15000;
    const delay = Date.now() < tournamentStartGate ? Math.max(0, tournamentStartGate - Date.now()) : 1000;

    const timer = setTimeout(() => {
      if (autoNavRef.current) return;
      autoNavRef.current = true;
      window.location.href = `/game/${myActive.gameId}?t=${encodeURIComponent(tournament.roomName)}`;
    }, delay);

    return () => clearTimeout(timer);
  }, [tournament?.status, tournament?.matches, userId, autoRedirectEnabled, tournament?.startedAt, tournament?.roomName]);

  useEffect(() => {
    localStorage.setItem('tournamentAutoRedirect', String(autoRedirectEnabled));
    if (!autoRedirectEnabled) {
      autoNavRef.current = false;
    }
  }, [autoRedirectEnabled]);

  const participantsById = useMemo(() => {
    const m = new Map();
    (tournament?.participants || []).forEach((p) => m.set(p.userId, p));
    return m;
  }, [tournament?.participants]);

  const rounds = useMemo(() => groupByRound(tournament?.matches || []), [tournament?.matches]);

  const now = Date.now();
  const breakEndsMs = tournament?.roundReadyAt ? new Date(tournament.roundReadyAt).getTime() : null;
  const breakSecondsLeft = breakEndsMs ? Math.max(0, Math.floor((breakEndsMs - now) / 1000)) : 0;

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 60 }}>Loading bracket…</div>;
  }

  if (!tournament) {
    return <div style={{ textAlign: 'center', padding: 60 }}>Tournament not found</div>;
  }

  return (
    <div className="container" style={{ maxWidth: 1100, margin: '80px auto' }}>
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ margin: 0, color: '#d4af37' }}>{tournament.name}</h2>
            <div style={{ marginTop: 8, color: 'var(--color-text-secondary)' }}>
              Room: <b style={{ color: 'var(--color-text-primary)' }}>{tournament.roomName}</b> · {tournament.timeControl} · BO{tournament.bestOf}
              {tournament.status === 'InProgress' && breakEndsMs && (
                <>
                  {' '}· break: <b style={{ color: '#d4af37' }}>{breakSecondsLeft}s</b>
                </>
              )}
            </div>
            <label style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 10, color: 'var(--color-text-secondary)' }}>
              <input
                type="checkbox"
                checked={autoRedirectEnabled}
                onChange={(e) => setAutoRedirectEnabled(e.target.checked)}
              />
              Автопереход в игру
            </label>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Link to={`/t/${tournament.roomName}`} className="btn-outline" style={{ textDecoration: 'none', padding: '10px 14px' }}>
              Lobby
            </Link>
            <Link to="/tournaments" className="btn-outline" style={{ textDecoration: 'none', padding: '10px 14px' }}>
              Tournaments
            </Link>
          </div>
        </div>
      </div>

      {tournament.status !== 'InProgress' && tournament.status !== 'Completed' && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ color: 'var(--color-text-secondary)' }}>
            Status: <b style={{ color: 'var(--color-text-primary)' }}>{tournament.status}</b>. Start the tournament from the lobby.
          </div>
        </div>
      )}

      {tournament.status === 'Completed' && (() => {
        // Find the winner from the last round
        const lastRound = rounds.length > 0 ? rounds[rounds.length - 1] : null;
        const finalMatch = lastRound ? lastRound[1].find(m => m.winnerId) : null;
        const winner = finalMatch?.winnerId ? participantsById.get(finalMatch.winnerId) : null;

        return (
          <div className="card" style={{ 
            marginBottom: 16, 
            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(212, 175, 55, 0.05) 100%)',
            border: '2px solid #d4af37',
            textAlign: 'center',
            padding: '30px'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏆</div>
            <h2 style={{ 
              color: '#d4af37', 
              margin: '0 0 12px 0',
              fontSize: '32px',
              textShadow: '0 0 20px rgba(212, 175, 55, 0.5)'
            }}>
              Tournament Champion
            </h2>
            {winner ? (
              <div style={{ 
                fontSize: '28px', 
                fontWeight: 'bold',
                color: '#fff',
                marginBottom: '8px'
              }}>
                {winner.username}
              </div>
            ) : (
              <div style={{ color: 'var(--color-text-secondary)' }}>
                Winner not determined
              </div>
            )}
            <div style={{ 
              color: 'var(--color-text-secondary)', 
              fontSize: '16px',
              marginTop: '12px'
            }}>
              Tournament completed on {tournament.completedAt ? new Date(tournament.completedAt).toLocaleString() : 'N/A'}
            </div>
          </div>
        );
      })()}

      <div style={{ display: 'grid', gap: 16 }}>
        {rounds.length === 0 ? (
          <div className="card" style={{ color: 'var(--color-text-secondary)' }}>
            No matches yet.
          </div>
        ) : (
          <div className="card" style={{ overflowX: 'auto' }}>
            <div style={{ display: 'flex', gap: 16, minWidth: 900 }}>
              {rounds.map(([round, matches]) => (
                <div key={round} style={{ minWidth: 280, flex: '0 0 280px' }}>
                  <h3 style={{ marginTop: 0, marginBottom: 12, color: '#d4af37' }}>Round {round}</h3>
                  <div style={{ display: 'grid', gap: 12 }}>
                    {matches.map((m) => {
                      const a = m.playerAId ? participantsById.get(m.playerAId) : null;
                      const b = m.playerBId ? participantsById.get(m.playerBId) : null;
                      const winner = m.winnerId ? participantsById.get(m.winnerId) : null;

                      const status = m.status;
                      const isMine = m.playerAId === userId || m.playerBId === userId;
                      const gameLink = m.gameId ? `/game/${m.gameId}` : null;

                      return (
                        <div
                          key={m.id}
                          style={{
                            border: '1px solid var(--color-border)',
                            borderRadius: 12,
                            padding: 12,
                            background: isMine ? 'rgba(212, 175, 55, 0.08)' : 'var(--color-surface)'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start' }}>
                            <div style={{ display: 'grid', gap: 6 }}>
                              <div>
                                <b style={{ color: winner && winner.userId === a?.userId ? '#d4af37' : 'inherit' }}>
                                  {a ? a.username : '—'}
                                </b>
                                {m.bestOf === 3 && (
                                  <span style={{ marginLeft: 8, color: 'var(--color-text-secondary)' }}>{m.aWins}</span>
                                )}
                              </div>
                              <div>
                                <b style={{ color: winner && winner.userId === b?.userId ? '#d4af37' : 'inherit' }}>
                                  {b ? b.username : '—'}
                                </b>
                                {m.bestOf === 3 && (
                                  <span style={{ marginLeft: 8, color: 'var(--color-text-secondary)' }}>{m.bWins}</span>
                                )}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}>{status}</div>
                              {status === 'Bye' && (
                                <div style={{ marginTop: 8, color: 'var(--color-text-secondary)', fontSize: 12 }}>BYE</div>
                              )}
                            </div>
                          </div>

                          {gameLink && (
                            <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
                              <Link
                                to={`/watch/${m.gameId}`}
                                className="btn-primary"
                                style={{ textDecoration: 'none', display: 'inline-block', padding: '8px 12px' }}
                              >
                                👁️ View
                              </Link>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

