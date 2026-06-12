import { useState, useEffect, useRef } from 'react';
import { Chessground } from 'chessground';
import { Chess } from 'chess.js';
import { useLanguage } from '../i18n/LanguageContext';
import apiService from '../services/apiService';
import 'chessground/assets/chessground.base.css';
import 'chessground/assets/chessground.brown.css';
import 'chessground/assets/chessground.cburnett.css';

export default function Puzzles({ userId }) {
  const { t } = useLanguage();
  const [puzzle, setPuzzle] = useState(null);
  const [chess, setChess] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success', 'error', 'info'
  const [stats, setStats] = useState({ total: 0, solved: 0, failed: 0 });
  const [loading, setLoading] = useState(false);
  const [movesMade, setMovesMade] = useState([]);
  const boardRef = useRef(null);
  const groundRef = useRef(null);

  useEffect(() => {
    loadStats();
    loadNewPuzzle();
  }, [userId]);

  useEffect(() => {
    if (boardRef.current && !groundRef.current && chess) {
      groundRef.current = Chessground(boardRef.current, {
        fen: chess.fen(),
        orientation: chess.turn() === 'w' ? 'white' : 'black',
        movable: {
          free: false,
          color: chess.turn() === 'w' ? 'white' : 'black',
          events: {
            after: handleMove
          }
        },
        draggable: {
          enabled: true,
          showGhost: true
        }
      });
    }

    return () => {
      if (groundRef.current) {
        groundRef.current.destroy();
        groundRef.current = null;
      }
    };
  }, [chess]);

  useEffect(() => {
    if (groundRef.current && chess && puzzle) {
      updateBoard();
    }
  }, [chess, puzzle]);

  const loadStats = async () => {
    try {
      const userStats = await apiService.getPuzzleStats(userId);
      setStats(userStats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadNewPuzzle = async () => {
    setLoading(true);
    setMessage('');
    setMovesMade([]);
    
    try {
      console.log('Loading puzzle for user:', userId);
      const newPuzzle = await apiService.getRandomPuzzle(userId);
      console.log('Puzzle loaded:', newPuzzle);
      
      if (!newPuzzle || !newPuzzle.fen) {
        throw new Error('Invalid puzzle data');
      }
      
      setPuzzle(newPuzzle);
      
      const game = new Chess(newPuzzle.fen);
      setChess(game);
      
      setMessage(t('puzzles.findBestMove'));
      setMessageType('info');
    } catch (error) {
      console.error('Failed to load puzzle:', error);
      setMessage(error.message || t('puzzles.noPuzzles'));
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const updateBoard = () => {
    if (!groundRef.current || !chess) return;

    const dests = new Map();
    const legalMoves = chess.moves({ verbose: true });
    
    legalMoves.forEach(move => {
      if (!dests.has(move.from)) {
        dests.set(move.from, []);
      }
      dests.get(move.from).push(move.to);
    });

    groundRef.current.set({
      fen: chess.fen(),
      turnColor: chess.turn() === 'w' ? 'white' : 'black',
      movable: {
        color: chess.turn() === 'w' ? 'white' : 'black',
        dests: dests,
        free: false
      },
      check: chess.inCheck()
    });
  };

  const handleMove = (orig, dest) => {
    if (!chess || !puzzle) return;

    try {
      const move = chess.move({
        from: orig,
        to: dest,
        promotion: 'q'
      });

      if (move === null) {
        updateBoard();
        return;
      }

      const moveSan = move.san;
      setMovesMade(prev => [...prev, moveSan]);
      updateBoard();

      checkSolution(moveSan);
    } catch (error) {
      console.error('Move error:', error);
      updateBoard();
    }
  };

  const checkSolution = async (moveSan) => {
    try {
      const result = await apiService.checkPuzzleSolution(userId, puzzle.id, moveSan);

      if (result.correct) {
        const ratingText = result.firstAttempt && result.ratingChange !== 0
          ? ` (${result.ratingChange > 0 ? '+' : ''}${result.ratingChange})`
          : result.firstAttempt ? '' : ' (повтор)';
        
        setMessage(t('puzzles.correct') + ratingText);
        setMessageType('success');
        
        loadStats();
        
        setTimeout(() => {
          loadNewPuzzle();
        }, 2000);
      } else {
        const ratingText = result.firstAttempt && result.ratingChange !== 0
          ? ` (${result.ratingChange > 0 ? '+' : ''}${result.ratingChange})`
          : '';
        
        setMessage(t('puzzles.incorrect') + ratingText);
        setMessageType('error');
        
        chess.undo();
        setMovesMade(prev => prev.slice(0, -1));
        updateBoard();
      }
    } catch (error) {
      console.error('Check solution error:', error);
    }
  };

  const handleSkip = () => {
    loadNewPuzzle();
  };

  const handleReset = () => {
    if (!puzzle) return;
    
    const game = new Chess(puzzle.fen);
    setChess(game);
    setMovesMade([]);
    setMessage(t('puzzles.findBestMove'));
    setMessageType('info');
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', color: '#888' }}>
        {t('common.loading')}
      </div>
    );
  }

  return (
    <div className="puzzles-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      {/* Stats */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <h2 style={{ color: '#d4af37', margin: '0 0 20px 0' }}>
          🧩 {t('puzzles.title')}
        </h2>
        
        <div className="puzzles-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
          <div className="stat-card">
            <div className="stat-label">{t('puzzles.total')}</div>
            <div className="stat-value">{stats.total}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">{t('puzzles.solved')}</div>
            <div className="stat-value" style={{ color: '#4CAF50' }}>{stats.solved}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">{t('puzzles.failed')}</div>
            <div className="stat-value" style={{ color: '#f44336' }}>{stats.failed}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">{t('puzzles.accuracy')}</div>
            <div className="stat-value" style={{ color: '#d4af37' }}>
              {stats.total > 0 ? Math.round((stats.solved / stats.total) * 100) : 0}%
            </div>
          </div>
        </div>
      </div>

      {/* Puzzle Board */}
      <div className="puzzles-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '20px' }}>
        <div className="card puzzles-board-container">
          {puzzle && (
            <>
              <div style={{ marginBottom: '16px' }}>
                <div className="puzzles-info" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ color: '#888', fontSize: '14px' }}>
                    {t('puzzles.rating')}: {puzzle.rating}
                  </span>
                  <span style={{ color: '#888', fontSize: '14px' }}>
                    {puzzle.themes.split(',').map(theme => `#${theme}`).join(' ')}
                  </span>
                </div>
                
                {message && (
                  <div className="puzzles-message" style={{
                    padding: '12px',
                    borderRadius: '8px',
                    background: messageType === 'success' ? 'rgba(76, 175, 80, 0.1)' :
                               messageType === 'error' ? 'rgba(244, 67, 54, 0.1)' :
                               'rgba(212, 175, 55, 0.1)',
                    border: `1px solid ${messageType === 'success' ? '#4CAF50' :
                                        messageType === 'error' ? '#f44336' :
                                        '#d4af37'}`,
                    color: messageType === 'success' ? '#4CAF50' :
                          messageType === 'error' ? '#f44336' :
                          '#d4af37',
                    fontWeight: '500',
                    textAlign: 'center'
                  }}>
                    {message}
                  </div>
                )}
              </div>

              <div 
                ref={boardRef}
                className="puzzles-board-wrapper"
                style={{ 
                  width: '100%',
                  maxWidth: '600px',
                  aspectRatio: '1/1',
                  margin: '0 auto',
                  boxShadow: '0 8px 30px rgba(212, 175, 55, 0.3)',
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}
              />

              <div className="puzzles-buttons" style={{ display: 'flex', gap: '12px', marginTop: '20px', justifyContent: 'center' }}>
                <button
                  onClick={handleReset}
                  className="btn-outline"
                  style={{ flex: 1, maxWidth: '200px' }}
                >
                  🔄 {t('puzzles.reset')}
                </button>
                <button
                  onClick={handleSkip}
                  className="btn-secondary"
                  style={{ flex: 1, maxWidth: '200px' }}
                >
                  ⏭️ {t('puzzles.skip')}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Info Panel */}
        <div className="card puzzles-info-panel">
          <h3 style={{ color: '#d4af37', marginBottom: '16px' }}>
            {t('puzzles.howToPlay')}
          </h3>
          
          <div className="puzzles-info" style={{ color: '#ccc', fontSize: '14px', lineHeight: '1.8' }}>
            <p style={{ marginBottom: '12px' }}>
              {t('puzzles.instruction1')}
            </p>
            <p style={{ marginBottom: '12px' }}>
              {t('puzzles.instruction2')}
            </p>
            <p style={{ marginBottom: '12px' }}>
              {t('puzzles.instruction3')}
            </p>
          </div>

          {movesMade.length > 0 && (
            <>
              <h4 style={{ color: '#888', marginTop: '24px', marginBottom: '12px', fontSize: '14px' }}>
                {t('puzzles.movesMade')}
              </h4>
              <div style={{ 
                background: '#1a1a1a', 
                padding: '12px', 
                borderRadius: '8px',
                border: '1px solid #333'
              }}>
                {movesMade.map((move, idx) => (
                  <span key={idx} style={{ 
                    color: '#d4af37', 
                    marginRight: '8px',
                    fontSize: '14px'
                  }}>
                    {idx + 1}. {move}
                  </span>
                ))}
              </div>
            </>
          )}

          {puzzle && (
            <div style={{ marginTop: '24px', padding: '12px', background: '#1a1a1a', borderRadius: '8px', border: '1px solid #333' }}>
              <div style={{ color: '#888', fontSize: '12px', marginBottom: '4px' }}>FEN:</div>
              <div style={{ color: '#666', fontSize: '11px', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                {puzzle.fen}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
