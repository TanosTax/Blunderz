import { useEffect, useRef, useState, useCallback } from 'react';
import { Chessground } from 'chessground';
import { Chess } from 'chess.js';
import { useChess } from '../hooks/useChess';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import BoardSettings from './BoardSettings';
import GameChat from './GameChat';
import apiService from '../services/apiService';
import 'chessground/assets/chessground.base.css';
import 'chessground/assets/chessground.brown.css';
import 'chessground/assets/chessground.cburnett.css';
import '../styles/chessboard-themes.css';
import '../styles/chessboard-responsive.css';

export default function ChessBoard({ gameId, userId, isPlayerWhite, onEloChange }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [showResignModal, setShowResignModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [gameData, setGameData] = useState(null);
  const [berserkMode, setBerserkMode] = useState(false);
  const [opponentBerserkMode, setOpponentBerserkMode] = useState(false);
  const [canActivateBerserk, setCanActivateBerserk] = useState(true);
  const [berserkActivating, setBerserkActivating] = useState(false);
  const [whiteTime, setWhiteTime] = useState(600); // 10 minutes in seconds
  const [blackTime, setBlackTime] = useState(600);
  const [initialTime, setInitialTime] = useState(600); // Store initial time for progress calculation
  const [opponentInitialTime, setOpponentInitialTime] = useState(600); // Store opponent's initial time
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
  const timeoutHandledRef = useRef(false);

  const {
    fen,
    moveHistory,
    isMyTurn,
    gameOver,
    winner,
    eloChange,
    gameEndReason,
    makeMove,
    isCheck,
    isCheckmate,
    isDraw,
    moveCount,
    opponentConnected,
    opponentDisconnectTime,
    canClaimVictory,
    claimVictory,
    offerDrawAfterDisconnect,
    drawOffered,
    drawOfferedByMe,
    offerDraw,
    acceptDraw,
    declineDraw,
    resign,
    activateBerserk
  } = useChess(
    gameId, 
    userId, 
    isPlayerWhite, 
    setWhiteTime, 
    setBlackTime,
    whiteTimeRef,
    blackTimeRef
  );
  


  const boardRef = useRef(null);
  const cgRef = useRef(null);
  const chessRef = useRef(new Chess());
  const isMyTurnRef = useRef(isMyTurn);

  // Update ref when isMyTurn changes
  useEffect(() => {
    isMyTurnRef.current = isMyTurn;
  }, [isMyTurn]);

  console.log('ChessBoard render:', { isMyTurn, gameOver, isPlayerWhite });
  
  // Load game data (but don't set time - useChess handles that)
  useEffect(() => {
    const loadGameData = async () => {
      try {
        const data = await apiService.getGame(gameId);
        setGameData(data);
        
        // Parse time control to get initial time
        if (data.timeControl) {
          const parts = data.timeControl.split('+');
          if (parts.length > 0) {
            const minutes = parseInt(parts[0]);
            if (!isNaN(minutes)) {
              const baseTime = minutes * 60;
              setInitialTime(baseTime);
              setOpponentInitialTime(baseTime);
            }
          }
        }
        
        // Check if berserk is already activated
        if (isPlayerWhite && data.whitePlayerBerserk) {
          setBerserkMode(true);
          setCanActivateBerserk(false);
          // My berserk - update my initial time
          setInitialTime(prev => prev / 2);
        } else if (!isPlayerWhite && data.blackPlayerBerserk) {
          setBerserkMode(true);
          setCanActivateBerserk(false);
          // My berserk - update my initial time
          setInitialTime(prev => prev / 2);
        }
        
        if (isPlayerWhite && data.blackPlayerBerserk) {
          setOpponentBerserkMode(true);
          // Opponent's berserk - update opponent's initial time
          setOpponentInitialTime(prev => prev / 2);
        } else if (!isPlayerWhite && data.whitePlayerBerserk) {
          setOpponentBerserkMode(true);
          // Opponent's berserk - update opponent's initial time
          setOpponentInitialTime(prev => prev / 2);
        }
      } catch (error) {
        console.error('Failed to load game data:', error);
      }
    };
    
    loadGameData();
    
    // Setup berserk activation listener
    window.onBerserkActivated = (data) => {
      const isMyBerserk = (isPlayerWhite && data.isWhite) || (!isPlayerWhite && !data.isWhite);
      
      if (isMyBerserk) {
        setBerserkMode(true);
        setCanActivateBerserk(false);
        // Update initial time to half for correct progress bar calculation
        setInitialTime(prev => prev / 2);
      } else {
        setOpponentBerserkMode(true);
        // Update opponent's initial time to half
        setOpponentInitialTime(prev => prev / 2);
      }
    };
    
    return () => {
      window.onBerserkActivated = null;
    };
  }, [gameId, isPlayerWhite]);
  
  // Timer logic - runs continuously and checks whose turn it is
  useEffect(() => {
    if (gameOver) {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      return;
    }
    
    // Don't start timer until first move is made
    if (moveCount === 0) {
      return;
    }
    
    timerIntervalRef.current = setInterval(() => {
      // Decrease time for whoever's turn it is
      const currentTurn = isMyTurnRef.current;
      
      if (currentTurn) {
        // My turn - decrease my time
        if (isPlayerWhite) {
          setWhiteTime(prev => Math.max(0, prev - 1));
        } else {
          setBlackTime(prev => Math.max(0, prev - 1));
        }
      } else {
        // Opponent's turn - decrease opponent's time
        if (isPlayerWhite) {
          setBlackTime(prev => Math.max(0, prev - 1));
        } else {
          setWhiteTime(prev => Math.max(0, prev - 1));
        }
      }
    }, 1000);
    
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [gameOver, isPlayerWhite, moveCount]);
  
  // Check for timeout
  useEffect(() => {
    if (moveCount === 0 || timeoutHandledRef.current) return;
    
    // Check if time ran out
    if (whiteTime === 0 || blackTime === 0) {
      console.log('TIMEOUT DETECTED:', { whiteTime, blackTime, gameData });
      
      // Mark as handled immediately to prevent multiple calls
      timeoutHandledRef.current = true;
      
      // End game due to timeout
      const endGameByTimeout = async () => {
        try {
          // Load game data if not available
          let currentGameData = gameData;
          if (!currentGameData) {
            console.log('Loading game data for timeout...');
            currentGameData = await apiService.getGame(gameId);
          }
          
          // Determine winner based on who ran out of time
          const actualWinnerId = whiteTime === 0 ? 
            currentGameData.blackPlayerId : 
            currentGameData.whitePlayerId;
          
          console.log('Calling endGame API:', { 
            gameId, 
            result: whiteTime === 0 ? 1 : 0, 
            winnerId: actualWinnerId 
          });
          
          await apiService.endGame(gameId, whiteTime === 0 ? 1 : 0, actualWinnerId);
          
          console.log('endGame API call successful - waiting for SignalR GameEnded event');
        } catch (error) {
          console.error('Failed to end game by timeout:', error);
          // Reset flag on error so it can be retried
          timeoutHandledRef.current = false;
        }
      };
      
      endGameByTimeout();
    }
  }, [whiteTime, blackTime, moveCount, gameId, gameData]);
  
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
    // Check for timeout
    if (gameEndReason === 'timeout') {
      const didIWin = (winner === 'white' && isPlayerWhite) || (winner === 'black' && !isPlayerWhite);
      return {
        title: didIWin ? `🎉 ${t('game.victory')}` : `😔 ${t('game.defeat')}`,
        subtitle: didIWin ? t('game.opponentRanOutOfTime') : t('game.youRanOutOfTime'),
        color: didIWin ? '#4CAF50' : '#f44336'
      };
    }
    
    // Check for resignation
    if (gameEndReason === 'resignation') {
      const didIWin = (winner === 'white' && isPlayerWhite) || (winner === 'black' && !isPlayerWhite);
      return {
        title: didIWin ? `🎉 ${t('game.victory')}` : `😔 ${t('game.defeat')}`,
        subtitle: didIWin ? t('game.opponentResigned') : t('game.youResigned'),
        color: didIWin ? '#4CAF50' : '#f44336'
      };
    }
    
    // Check for checkmate
    if (isCheckmate) {
      const didIWin = (winner === 'white' && isPlayerWhite) || (winner === 'black' && !isPlayerWhite);
      const winnerText = winner === 'white' ? t('game.white') : t('game.black');
      return {
        title: didIWin ? `🎉 ${t('game.victory')}` : `😔 ${t('game.defeat')}`,
        subtitle: `${t('game.checkmate')} ${winnerText} ${t('game.checkmateSuffix')}`,
        color: didIWin ? '#4CAF50' : '#f44336'
      };
    }
    
    // Check for draw
    if (isDraw || gameEndReason === 'draw') {
      return {
        title: `🤝 ${t('game.draw')}`,
        subtitle: t('game.drawEnded'),
        color: '#FF9800'
      };
    }
    
    return {
      title: t('game.gameOver'),
      subtitle: t('game.gameEnded'),
      color: '#2196F3'
    };
  };

  // Show disconnect modal when can claim victory
  useEffect(() => {
    if (canClaimVictory && !gameOver) {
      setShowDisconnectModal(true);
    }
  }, [canClaimVictory, gameOver]);

  const handleClaimVictory = async () => {
    await claimVictory();
    setShowDisconnectModal(false);
  };

  const handleOfferDraw = async () => {
    await offerDrawAfterDisconnect();
    setShowDisconnectModal(false);
  };

  const handleOfferDrawInGame = async () => {
    await offerDraw();
  };

  const handleAcceptDraw = async () => {
    await acceptDraw();
  };

  const handleDeclineDraw = async () => {
    await declineDraw();
  };

  const handleResign = async () => {
    setShowResignModal(true);
  };

  const handleConfirmResign = async () => {
    await resign();
    setShowResignModal(false);
  };

  const handleActivateBerserk = async () => {
    if (!canActivateBerserk || moveCount > 0) return;
    
    setBerserkActivating(true);
    
    // Включаем берсерк режим через полсекунды для плавного перехода
    setTimeout(() => {
      setBerserkMode(true);
      setCanActivateBerserk(false);
    }, 500);
    
    // Анимация активации
    setTimeout(async () => {
      const success = await activateBerserk();
      
      if (!success) {
        // Если не удалось активировать, откатываем
        setBerserkMode(false);
        setCanActivateBerserk(true);
      }
      
      setBerserkActivating(false);
    }, 1000);
  };

  return (
    <div className="chessboard-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px', position: 'relative' }}>
      {/* Berserk Mode Overlay */}
      {berserkMode && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle, rgba(139, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.6) 100%)',
          pointerEvents: 'none',
          zIndex: 1,
          animation: 'berserkPulse 2s ease-in-out infinite'
        }} />
      )}

      {/* Berserk Activation Animation */}
      {berserkActivating && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: '#ff0000',
          zIndex: 999,
          animation: 'berserkFlash 1s ease-out forwards'
        }} />
      )}

      <style>{`
        @keyframes berserkPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.5; }
        }
        
        @keyframes berserkFlash {
          0% { opacity: 0; }
          50% { opacity: 0.8; }
          100% { opacity: 0; }
        }
        
        @keyframes berserkShake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        
        ${berserkMode ? `
          /* Global red theme for berserk mode */
          .nav-logo span,
          .nav-link,
          h2:not(.modal-content h2), 
          h3:not(.modal-content h3),
          .btn-primary:not(.modal-content .btn-primary),
          .btn-outline:not(.modal-content .btn-outline) {
            color: #ff0000 !important;
            border-color: #ff0000 !important;
          }
          
          .nav-logo svg {
            color: #ff0000 !important;
            filter: drop-shadow(0 0 10px rgba(255, 0, 0, 0.6)) !important;
          }
          
          .btn-primary:not(.modal-content .btn-primary) {
            background: linear-gradient(135deg, #ff0000 0%, #8b0000 100%) !important;
          }
          
          .nav {
            border-bottom: 2px solid #ff0000 !important;
          }
          
          .nav-user-info {
            border: 1px solid #ff0000 !important;
          }
          
          :root {
            --color-border-gold: #ff0000 !important;
          }
        ` : ''}
      `}</style>

      {/* Berserk Button */}
      {canActivateBerserk && 
       (isPlayerWhite ? moveCount < 1 : moveCount < 2) && 
       !gameOver && (
        <button
          className="berserk-button"
          onClick={handleActivateBerserk}
          disabled={berserkActivating}
          style={{
            position: 'fixed',
            top: '50%',
            right: '20px',
            transform: 'translateY(-50%)',
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: berserkActivating 
              ? 'linear-gradient(135deg, #ff0000 0%, #8b0000 100%)'
              : 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
            border: '3px solid #ff0000',
            color: '#ff0000',
            fontSize: '40px',
            cursor: berserkActivating ? 'not-allowed' : 'pointer',
            boxShadow: '0 0 20px rgba(255, 0, 0, 0.5)',
            transition: 'all 0.3s ease',
            zIndex: 998,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: berserkActivating ? 'berserkShake 0.5s ease-in-out infinite' : 'none'
          }}
          onMouseEnter={(e) => {
            if (!berserkActivating) {
              e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
              e.currentTarget.style.boxShadow = '0 0 30px rgba(255, 0, 0, 0.8)';
            }
          }}
          onMouseLeave={(e) => {
            if (!berserkActivating) {
              e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(255, 0, 0, 0.5)';
            }
          }}
          title="Activate Berserk Mode: Half time, double stakes!"
        >
          💀
        </button>
      )}
      {/* Settings Modal */}
      {showSettings && (
        <BoardSettings
          settings={boardSettings}
          onSettingsChange={setBoardSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Resign Confirmation Modal */}
      {showResignModal && !gameOver && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
            borderRadius: '12px',
            padding: '40px',
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 0 30px rgba(244, 67, 54, 0.3)',
            border: '2px solid #f44336'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>🏳️</div>
            <h2 style={{ marginBottom: '10px', fontSize: '24px', color: '#f44336' }}>{t('game.resignGame')}</h2>
            <p style={{ color: '#aaa', fontSize: '16px', marginBottom: '30px' }}>
              {t('game.resignConfirm')}
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={handleConfirmResign}
                style={{
                  padding: '15px 30px',
                  fontSize: '16px',
                  background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                {t('game.yesResign')}
              </button>
              
              <button
                onClick={() => setShowResignModal(false)}
                style={{
                  padding: '15px 30px',
                  fontSize: '16px',
                  backgroundColor: 'transparent',
                  color: '#888',
                  border: '1px solid #444',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Draw Offer Modal */}
      {drawOffered && !gameOver && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
            borderRadius: '12px',
            padding: '40px',
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 0 30px rgba(212, 175, 55, 0.3)',
            border: '2px solid #d4af37'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>🤝</div>
            <h2 style={{ marginBottom: '10px', fontSize: '24px', color: '#d4af37' }}>{t('game.drawOfferReceived')}</h2>
            <p style={{ color: '#aaa', fontSize: '16px', marginBottom: '30px' }}>
              {t('game.drawQuestion')}
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={handleAcceptDraw}
                style={{
                  padding: '15px 30px',
                  fontSize: '16px',
                  background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                ✓ {t('game.acceptDraw')}
              </button>
              
              <button
                onClick={handleDeclineDraw}
                style={{
                  padding: '15px 30px',
                  fontSize: '16px',
                  background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                ✗ {t('game.declineDraw')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Disconnect Modal */}
      {showDisconnectModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
            borderRadius: '12px',
            padding: '40px',
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 0 30px rgba(212, 175, 55, 0.3)',
            border: '2px solid #d4af37'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
            <h2 style={{ marginBottom: '10px', fontSize: '24px', color: '#d4af37' }}>{t('game.opponentDisconnected')}</h2>
            <p style={{ color: '#aaa', fontSize: '16px', marginBottom: '30px' }}>
              {t('game.opponentDisconnectedMsg')}
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={handleClaimVictory}
                style={{
                  padding: '15px 30px',
                  fontSize: '16px',
                  background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                🏆 {t('game.claimVictory')}
              </button>
              
              <button
                onClick={handleOfferDraw}
                style={{
                  padding: '15px 30px',
                  fontSize: '16px',
                  background: 'linear-gradient(135deg, #FF9800 0%, #f57c00 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                🤝 {t('game.offerDraw')}
              </button>
              
              <button
                onClick={() => setShowDisconnectModal(false)}
                style={{
                  padding: '12px 30px',
                  fontSize: '14px',
                  backgroundColor: 'transparent',
                  color: '#888',
                  border: '1px solid #444',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                {t('game.wait')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over Modal */}
      {showGameOverModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
            borderRadius: '12px',
            padding: '40px',
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 0 30px rgba(212, 175, 55, 0.3)',
            border: '2px solid #d4af37'
          }}>
            <div style={{
              fontSize: '64px',
              marginBottom: '20px'
            }}>
              {getGameResultText().title.split(' ')[0]}
            </div>
            <h2 style={{
              color: '#d4af37',
              marginBottom: '10px',
              fontSize: '28px'
            }}>
              {getGameResultText().title.split(' ').slice(1).join(' ') || getGameResultText().title}
            </h2>
            <p style={{
              color: '#aaa',
              fontSize: '18px',
              marginBottom: '30px'
            }}>
              {getGameResultText().subtitle}
            </p>
            
            {eloChange !== null && (
              <div style={{
                padding: '15px',
                background: eloChange > 0 
                  ? 'linear-gradient(135deg, rgba(76, 175, 80, 0.2) 0%, rgba(69, 160, 73, 0.2) 100%)' 
                  : 'linear-gradient(135deg, rgba(244, 67, 54, 0.2) 0%, rgba(211, 47, 47, 0.2) 100%)',
                borderRadius: '8px',
                marginBottom: '20px',
                border: eloChange > 0 ? '1px solid #4CAF50' : '1px solid #f44336'
              }}>
                <div style={{
                  fontSize: '14px',
                  color: '#aaa',
                  marginBottom: '5px'
                }}>
                  {t('game.ratingChange')}
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
                  background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                🔍 {t('game.findNewGame')}
              </button>
              
              <button
                onClick={handleBackToMenu}
                style={{
                  padding: '15px 30px',
                  fontSize: '16px',
                  background: 'linear-gradient(135deg, #d4af37 0%, #c9a532 100%)',
                  color: '#1a1a1a',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                🏠 {t('game.backToMenu')}
              </button>
              
              <button
                onClick={() => setShowGameOverModal(false)}
                style={{
                  padding: '12px 30px',
                  fontSize: '14px',
                  backgroundColor: 'transparent',
                  color: '#888',
                  border: '1px solid #444',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                {t('game.viewBoard')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="chessboard-header" style={{ marginBottom: '20px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ margin: 0, color: berserkMode ? '#ff0000' : '#d4af37' }}>
            {gameData?.timeControl || '10+0'}
          </h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            {!gameOver && (
              <>
                <button
                  onClick={handleOfferDrawInGame}
                  disabled={drawOfferedByMe}
                  className="btn-outline"
                  style={{ 
                    padding: '8px 16px', 
                    fontSize: '14px',
                    opacity: drawOfferedByMe ? 0.5 : 1,
                    cursor: drawOfferedByMe ? 'not-allowed' : 'pointer'
                  }}
                  title={drawOfferedByMe ? t('game.drawOffered') : t('game.offerDraw')}
                >
                  🤝 {drawOfferedByMe ? t('game.drawOffered') : t('game.offerDraw')}
                </button>
                <button
                  onClick={handleResign}
                  className="btn-outline"
                  style={{ 
                    padding: '8px 16px', 
                    fontSize: '14px',
                    borderColor: '#f44336',
                    color: '#f44336'
                  }}
                >
                  🏳️ {t('game.resign')}
                </button>
              </>
            )}
            <button
              onClick={() => setShowSettings(true)}
              className="btn-outline"
              style={{ padding: '8px 16px', fontSize: '14px' }}
            >
              ⚙️ {t('game.settings')}
            </button>
          </div>
        </div>
        
        <div style={{ fontSize: '18px', marginTop: '10px' }}>
          {gameOver ? (
            <div>
              <strong style={{ color: getGameResultText().color }}>{t('game.gameOver')}</strong>
              {isCheckmate && <div>{t('game.checkmate')} {winner === 'white' ? t('game.white') : t('game.black')} {t('game.checkmateSuffix')}!</div>}
              {isDraw && <div>{t('game.draw')}!</div>}
              {winner === 'you' && <div>{t('game.youWon')}</div>}
              {winner === 'opponent' && <div>{t('game.youLost')}</div>}
            </div>
          ) : (
            <div>
              {isCheck && <div style={{ color: 'red', fontWeight: 'bold' }}>⚠️ {t('game.check')}</div>}
              {moveCount === 0 && (
                <div style={{ 
                  padding: '12px 20px',
                  backgroundColor: '#2196F3',
                  color: 'white',
                  borderRadius: '20px',
                  display: 'inline-block',
                  marginTop: '8px',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}>
                  ⏸️ {t('game.waitingForFirstMove')}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Player info panels */}
      <div className="player-info-panels" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        marginBottom: '20px',
        gap: '20px'
      }}>
        {/* Opponent info */}
        <div className="player-info-card" style={{
          flex: 1,
          position: 'relative',
          padding: '25px',
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
          borderRadius: '12px',
          border: 'none',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.3s ease'
        }}>
          {/* Animated border progress */}
          {!isMyTurn && moveCount > 0 && (
            <svg
              style={{
                position: 'absolute',
                top: '-3px',
                left: '-3px',
                width: 'calc(100% + 6px)',
                height: 'calc(100% + 6px)',
                pointerEvents: 'none',
                borderRadius: '12px'
              }}
            >
              <rect
                x="3"
                y="3"
                width="calc(100% - 6px)"
                height="calc(100% - 6px)"
                rx="12"
                fill="none"
                stroke={opponentBerserkMode ? "#ff0000" : "#d4af37"}
                strokeWidth="3"
                pathLength="100"
                strokeDasharray="100"
                strokeDashoffset={100 - (100 * ((isPlayerWhite ? blackTime : whiteTime) / opponentInitialTime))}
                style={{
                  transition: 'stroke-dashoffset 1s linear',
                  filter: opponentBerserkMode ? 'drop-shadow(0 0 5px #ff0000)' : 'none'
                }}
              />
            </svg>
          )}
          
          <div style={{ 
            fontSize: '18px', 
            fontWeight: 'bold', 
            marginBottom: '12px',
            color: berserkMode ? '#ff0000' : '#d4af37',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            position: 'relative',
            zIndex: 1
          }}>
            <span style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: opponentConnected ? '#4CAF50' : '#888',
              boxShadow: opponentConnected ? '0 0 8px #4CAF50' : 'none',
              transition: 'all 0.3s ease'
            }}></span>
            {getOpponentName()}
            {opponentBerserkMode && <span style={{ marginLeft: '8px', fontSize: '20px' }}>💀</span>}
          </div>
          <div style={{ 
            fontSize: '32px', 
            fontWeight: 'bold',
            color: (isPlayerWhite ? blackTime : whiteTime) < 60 ? '#ff4444' : '#ffffff',
            fontFamily: 'monospace',
            textShadow: (isPlayerWhite ? blackTime : whiteTime) < 60 ? '0 0 10px #ff4444' : 'none',
            position: 'relative',
            zIndex: 1
          }}>
            ⏱️ {formatTime(isPlayerWhite ? blackTime : whiteTime)}
          </div>
        </div>
        
        {/* Your info */}
        <div className="player-info-card" style={{
          flex: 1,
          position: 'relative',
          padding: '25px',
          background: 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)',
          borderRadius: '12px',
          border: 'none',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.3s ease'
        }}>
          {/* Animated border progress */}
          {isMyTurn && moveCount > 0 && (
            <svg
              style={{
                position: 'absolute',
                top: '-3px',
                left: '-3px',
                width: 'calc(100% + 6px)',
                height: 'calc(100% + 6px)',
                pointerEvents: 'none',
                borderRadius: '12px'
              }}
            >
              <rect
                x="3"
                y="3"
                width="calc(100% - 6px)"
                height="calc(100% - 6px)"
                rx="12"
                fill="none"
                stroke={berserkMode ? "#ff0000" : "#d4af37"}
                strokeWidth="3"
                pathLength="100"
                strokeDasharray="100"
                strokeDashoffset={100 - (100 * ((isPlayerWhite ? whiteTime : blackTime) / initialTime))}
                style={{
                  transition: 'stroke-dashoffset 1s linear',
                  filter: berserkMode ? 'drop-shadow(0 0 5px #ff0000)' : 'none'
                }}
              />
            </svg>
          )}
          
          <div style={{ 
            fontSize: '18px', 
            fontWeight: 'bold', 
            marginBottom: '12px',
            color: berserkMode ? '#ff0000' : '#d4af37',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            position: 'relative',
            zIndex: 1
          }}>
            <span style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: '#4CAF50',
              boxShadow: '0 0 8px #4CAF50',
              transition: 'all 0.3s ease'
            }}></span>
            {getMyName()} <span style={{ color: '#888', fontSize: '14px' }}>({t('game.you')})</span>
            {berserkMode && <span style={{ marginLeft: '8px', fontSize: '20px' }}>💀</span>}
          </div>
          <div style={{ 
            fontSize: '32px', 
            fontWeight: 'bold',
            color: (isPlayerWhite ? whiteTime : blackTime) < 60 ? '#ff4444' : '#ffffff',
            fontFamily: 'monospace',
            textShadow: (isPlayerWhite ? whiteTime : blackTime) < 60 ? '0 0 10px #ff4444' : 'none',
            position: 'relative',
            zIndex: 1
          }}>
            ⏱️ {formatTime(isPlayerWhite ? whiteTime : blackTime)}
          </div>
        </div>
      </div>

      <div 
        ref={boardRef} 
        className={`
          chessboard-board
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

      <div className="move-history" style={{ marginTop: '20px' }}>
        <h3>{t('game.moveHistory')}</h3>
        <div style={{ 
          maxHeight: '200px', 
          overflowY: 'auto',
          border: '1px solid #ccc',
          padding: '10px',
          borderRadius: '4px'
        }}>
          {moveHistory.length === 0 ? (
            <div>{t('game.noMovesYet')}</div>
          ) : (
            moveHistory.map((move, index) => (
              <span key={index} style={{ marginRight: '10px' }}>
                {Math.floor(index / 2) + 1}.{index % 2 === 0 ? '' : '..'} {move}
              </span>
            ))
          )}
        </div>
      </div>

      {/* Game Chat */}
      {gameData && (
        <GameChat
          gameId={gameId}
          userId={userId}
          username={getMyName()}
          isOpen={chatOpen}
          onToggle={() => setChatOpen(!chatOpen)}
          berserkMode={berserkMode}
        />
      )}
    </div>
  );
}
