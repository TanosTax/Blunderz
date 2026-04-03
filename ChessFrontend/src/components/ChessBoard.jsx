import { useEffect, useRef, useState } from 'react';
import { Chessground } from 'chessground';
import { Chess } from 'chess.js';
import { useChess } from '../hooks/useChess';
import { useNavigate } from 'react-router-dom';
import BoardSettings from './BoardSettings';
import apiService from '../services/apiService';
import 'chessground/assets/chessground.base.css';
import 'chessground/assets/chessground.brown.css';
import 'chessground/assets/chessground.cburnett.css';
import '../styles/chessboard-themes.css';

export default function ChessBoard({ gameId, userId, isPlayerWhite, onEloChange }) {
  const navigate = useNavigate();
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [gameData, setGameData] = useState(null);
  const [whiteTime, setWhiteTime] = useState(600); // 10 minutes in seconds
  const [blackTime, setBlackTime] = useState(600);
  const whiteTimeRef = useRef(600);
  const blackTimeRef = useRef(600);
  const timerIntervalRef = useRef(null);
  
  // Update refs when time changes
  useEffect(() => {
    whiteTimeRef.current = whiteTime;
  }, [whiteTime]);
  
  useEffect(() => {
    blackTimeRef.current = blackTime;
  }, [blackTime]);
  const [boardSettings, setBoardSettings] = useState(() => {
    const saved = localStorage.getItem('boardSettings');
    return saved ? JSON.parse(saved) : {
      theme: 'gold',
      size: 'medium',
      showCoordinates: true
    };
  });
  const eloCallbackCalledRef = useRef(false);

  const {
    fen,
    moveHistory,
    isMyTurn,
    gameOver,
    winner,
    eloChange,
    makeMove,
    isCheck,
    isCheckmate,
    isDraw
  } = useChess(gameId, userId, isPlayerWhite, whiteTimeRef, blackTimeRef, setWhiteTime, setBlackTime);
  
  const [timeUntilWin, setTimeUntilWin] = useState(null);

  const boardRef = useRef(null);
  const cgRef = useRef(null);
  const chessRef = useRef(new Chess());
  const isMyTurnRef = useRef(isMyTurn);

  // Update ref when isMyTurn changes
  useEffect(() => {
    isMyTurnRef.current = isMyTurn;
  }, [isMyTurn]);

  console.log('ChessBoard render:', { isMyTurn, gameOver, isPlayerWhite });
  
  // Load game data
  useEffect(() => {
    const loadGameData = async () => {
      try {
        const data = await apiService.getGame(gameId);
        setGameData(data);
        
        // Use actual time left from database
        setWhiteTime(data.whiteTimeLeft || 600);
        setBlackTime(data.blackTimeLeft || 600);
      } catch (error) {
        console.error('Failed to load game data:', error);
      }
    };
    
    loadGameData();
  }, [gameId]);
  
  // Timer logic - runs continuously and checks whose turn it is
  useEffect(() => {
    if (gameOver) {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      return;
    }
    
    timerIntervalRef.current = setInterval(() => {
      // Check whose turn it is using ref (always up to date)
      if (isMyTurnRef.current) {
        if (isPlayerWhite) {
          setWhiteTime(prev => Math.max(0, prev - 1));
        } else {
          setBlackTime(prev => Math.max(0, prev - 1));
        }
      }
    }, 1000);
    
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [gameOver, isPlayerWhite]);
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const getOpponentName = () => {
    if (!gameData) return 'Opponent';
    return isPlayerWhite ? gameData.blackPlayer?.username : gameData.whitePlayer?.username;
  };
  
  const getMyName = () => {
    if (!gameData) return 'You';
    return isPlayerWhite ? gameData.whitePlayer?.username : gameData.blackPlayer?.username;
  };

  // Convert chess.js moves to chessground format
  const toDests = (chess) => {
    const dests = new Map();
    const moves = chess.moves({ verbose: true });
    
    moves.forEach(move => {
      if (!dests.has(move.from)) {
        dests.set(move.from, []);
      }
      dests.get(move.from).push(move.to);
    });
    
    return dests;
  };

  useEffect(() => {
    if (!boardRef.current) return;

    // Destroy existing board if it exists
    if (cgRef.current) {
      cgRef.current.destroy();
    }

    // Initialize chessground
    cgRef.current = Chessground(boardRef.current, {
      fen: fen,
      orientation: isPlayerWhite ? 'white' : 'black',
      turnColor: isPlayerWhite ? 'white' : 'black',
      coordinates: boardSettings.showCoordinates,
      movable: {
        free: false,
        dests: isMyTurn && !gameOver ? toDests(chessRef.current) : new Map(),
        events: {
          after: (orig, dest) => {
            console.log('Move made:', orig, dest);
            makeMove(orig, dest);
          }
        }
      },
      draggable: {
        enabled: true,
        showGhost: true
      }
    });

    return () => {
      if (cgRef.current) {
        cgRef.current.destroy();
      }
    };
  }, [boardSettings]); // Re-create board when settings change

  // Update board when fen changes
  useEffect(() => {
    if (cgRef.current && chessRef.current) {
      chessRef.current.load(fen);
      
      const turnColor = chessRef.current.turn() === 'w' ? 'white' : 'black';
      const canMove = isMyTurn && !gameOver;
      
      cgRef.current.set({
        fen: fen,
        turnColor: turnColor,
        movable: {
          color: canMove ? (isPlayerWhite ? 'white' : 'black') : undefined,
          dests: canMove ? toDests(chessRef.current) : new Map()
        }
      });
    }
  }, [fen, isMyTurn, gameOver, isPlayerWhite]);

  // Show modal when game ends
  useEffect(() => {
    if (gameOver && !showGameOverModal) {
      console.log('Game over detected, eloChange:', eloChange);
      setShowGameOverModal(true);
    }
  }, [gameOver]);

  // Handle Elo change separately
  useEffect(() => {
    if (gameOver && eloChange !== null && onEloChange && !eloCallbackCalledRef.current) {
      console.log('Calling onEloChange with:', eloChange);
      eloCallbackCalledRef.current = true;
      onEloChange(eloChange);
    }
  }, [eloChange, gameOver]); // Watch for eloChange updates

  const handleFindNewGame = () => {
    navigate('/play');
  };

  const handleBackToMenu = () => {
    navigate('/');
  };

  const getGameResultText = () => {
    if (isCheckmate) {
      const didIWin = (winner === 'white' && isPlayerWhite) || (winner === 'black' && !isPlayerWhite);
      return {
        title: didIWin ? '🎉 Victory!' : '😔 Defeat',
        subtitle: `Checkmate! ${winner === 'white' ? 'White' : 'Black'} wins!`,
        color: didIWin ? '#4CAF50' : '#f44336'
      };
    }
    if (isDraw) {
      return {
        title: '🤝 Draw',
        subtitle: 'Game ended in a draw',
        color: '#FF9800'
      };
    }
    return {
      title: 'Game Over',
      subtitle: 'Game has ended',
      color: '#2196F3'
    };
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      {/* Settings Modal */}
      {showSettings && (
        <BoardSettings
          settings={boardSettings}
          onSettingsChange={setBoardSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
      {/* Game Over Modal */}
      {showGameOverModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '40px',
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{
              fontSize: '64px',
              marginBottom: '20px'
            }}>
              {getGameResultText().title.split(' ')[0]}
            </div>
            <h2 style={{
              color: getGameResultText().color,
              marginBottom: '10px',
              fontSize: '28px'
            }}>
              {getGameResultText().title.split(' ').slice(1).join(' ') || getGameResultText().title}
            </h2>
            <p style={{
              color: '#666',
              fontSize: '18px',
              marginBottom: '30px'
            }}>
              {getGameResultText().subtitle}
            </p>
            
            {eloChange !== null && (
              <div style={{
                padding: '15px',
                backgroundColor: eloChange > 0 ? '#E8F5E9' : '#FFEBEE',
                borderRadius: '8px',
                marginBottom: '20px'
              }}>
                <div style={{
                  fontSize: '14px',
                  color: '#666',
                  marginBottom: '5px'
                }}>
                  Rating Change
                </div>
                <div style={{
                  fontSize: '32px',
                  fontWeight: 'bold',
                  color: eloChange > 0 ? '#4CAF50' : '#f44336'
                }}>
                  {eloChange > 0 ? '+' : ''}{eloChange}
                </div>
              </div>
            )}
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <button
                onClick={handleFindNewGame}
                style={{
                  padding: '15px 30px',
                  fontSize: '16px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                🔍 Find New Game
              </button>
              
              <button
                onClick={handleBackToMenu}
                style={{
                  padding: '15px 30px',
                  fontSize: '16px',
                  backgroundColor: '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                🏠 Back to Menu
              </button>
              
              <button
                onClick={() => setShowGameOverModal(false)}
                style={{
                  padding: '12px 30px',
                  fontSize: '14px',
                  backgroundColor: 'transparent',
                  color: '#666',
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                View Board
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ margin: 0, color: '#d4af37' }}>Chess Game</h2>
          <button
            onClick={() => setShowSettings(true)}
            className="btn-outline"
            style={{ padding: '8px 16px', fontSize: '14px' }}
          >
            ⚙️ Settings
          </button>
        </div>
        
        <div style={{ fontSize: '18px', marginTop: '10px' }}>
          {gameOver ? (
            <div>
              <strong style={{ color: getGameResultText().color }}>Game Over!</strong>
              {isCheckmate && <div>Checkmate! {winner === 'white' ? 'White' : 'Black'} wins!</div>}
              {isDraw && <div>Draw!</div>}
              {winner === 'you' && <div>You won!</div>}
              {winner === 'opponent' && <div>Opponent won!</div>}
            </div>
          ) : (
            <div>
              {isCheck && <div style={{ color: 'red', fontWeight: 'bold' }}>⚠️ Check!</div>}
              <div style={{ 
                padding: '8px 16px',
                backgroundColor: isMyTurn ? '#4CAF50' : '#FF9800',
                color: 'white',
                borderRadius: '20px',
                display: 'inline-block',
                marginTop: '8px'
              }}>
                {isMyTurn ? "🎯 Your turn" : "⏳ Opponent's turn"}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Player info panels */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        marginBottom: '20px',
        gap: '20px'
      }}>
        {/* Opponent info */}
        <div style={{
          flex: 1,
          padding: '20px',
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
          borderRadius: '12px',
          border: !isMyTurn ? '3px solid #d4af37' : '3px solid #3a3a3a',
          boxShadow: !isMyTurn ? '0 0 20px rgba(212, 175, 55, 0.3)' : '0 4px 6px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.3s ease'
        }}>
          <div style={{ 
            fontSize: '18px', 
            fontWeight: 'bold', 
            marginBottom: '12px',
            color: '#d4af37',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            {getOpponentName()}
          </div>
          <div style={{ 
            fontSize: '32px', 
            fontWeight: 'bold',
            color: (isPlayerWhite ? blackTime : whiteTime) < 60 ? '#ff4444' : '#ffffff',
            fontFamily: 'monospace',
            textShadow: (isPlayerWhite ? blackTime : whiteTime) < 60 ? '0 0 10px #ff4444' : 'none'
          }}>
            ⏱️ {formatTime(isPlayerWhite ? blackTime : whiteTime)}
          </div>
        </div>
        
        {/* Your info */}
        <div style={{
          flex: 1,
          padding: '20px',
          background: 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)',
          borderRadius: '12px',
          border: isMyTurn ? '3px solid #d4af37' : '3px solid #3a3a3a',
          boxShadow: isMyTurn ? '0 0 20px rgba(212, 175, 55, 0.3)' : '0 4px 6px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.3s ease'
        }}>
          <div style={{ 
            fontSize: '18px', 
            fontWeight: 'bold', 
            marginBottom: '12px',
            color: '#d4af37',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            {getMyName()} <span style={{ color: '#888', fontSize: '14px' }}>(YOU)</span>
          </div>
          <div style={{ 
            fontSize: '32px', 
            fontWeight: 'bold',
            color: (isPlayerWhite ? whiteTime : blackTime) < 60 ? '#ff4444' : '#ffffff',
            fontFamily: 'monospace',
            textShadow: (isPlayerWhite ? whiteTime : blackTime) < 60 ? '0 0 10px #ff4444' : 'none'
          }}>
            ⏱️ {formatTime(isPlayerWhite ? whiteTime : blackTime)}
          </div>
        </div>
      </div>

      <div 
        ref={boardRef} 
        className={`
          theme-${boardSettings.theme} 
          board-${boardSettings.size}
        `}
        style={{ 
          width: '100%', 
          maxWidth: boardSettings.size === 'small' ? '400px' : boardSettings.size === 'large' ? '800px' : '600px',
          aspectRatio: '1/1',
          margin: '0 auto',
          transition: 'all 0.3s ease'
        }}
      />

      <div style={{ marginTop: '20px' }}>
        <h3>Move History</h3>
        <div style={{ 
          maxHeight: '200px', 
          overflowY: 'auto',
          border: '1px solid #ccc',
          padding: '10px',
          borderRadius: '4px'
        }}>
          {moveHistory.length === 0 ? (
            <div>No moves yet</div>
          ) : (
            moveHistory.map((move, index) => (
              <span key={index} style={{ marginRight: '10px' }}>
                {Math.floor(index / 2) + 1}.{index % 2 === 0 ? '' : '..'} {move}
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
