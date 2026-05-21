import { useEffect, useRef, useState } from 'react';
import { Chessground } from 'chessground';
import { Chess } from 'chess.js';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import signalRService from '../services/signalRService';
import apiService from '../services/apiService';
import 'chessground/assets/chessground.base.css';
import 'chessground/assets/chessground.brown.css';
import 'chessground/assets/chessground.cburnett.css';
import '../styles/chessboard-themes.css';
import '../styles/chessboard-responsive.css';

export default function SpectatorBoard({ gameId }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const tournamentRoom = new URLSearchParams(window.location.search).get('t');
  const [gameData, setGameData] = useState(null);
  const [fen, setFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [moveHistory, setMoveHistory] = useState([]);
  const [whiteTime, setWhiteTime] = useState(600);
  const [blackTime, setBlackTime] = useState(600);
  const [gameOver, setGameOver] = useState(false);
  const [gameResult, setGameResult] = useState(null);
  const [winnerId, setWinnerId] = useState(null);
  const [boardSettings, setBoardSettings] = useState(() => {
    const saved = localStorage.getItem('boardSettings');
    return saved ? JSON.parse(saved) : {
      theme: 'gold',
      size: 'medium',
      showCoordinates: true
    };
  });
  
  const boardRef = useRef(null);
  const cgRef = useRef(null);
  const chessRef = useRef(new Chess());
  const whiteTimeRef = useRef(600);
  const blackTimeRef = useRef(600);
  const timerIntervalRef = useRef(null);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Load game data
  useEffect(() => {
    const loadGame = async () => {
      try {
        const data = await apiService.getGame(gameId);
        console.log('Spectator: Game loaded:', data);
        console.log('Spectator: Time from API - White:', data.whiteTimeLeft, 'Black:', data.blackTimeLeft);
        setGameData(data);
        
        // Set time from game data (use actual time left, not base time)
        if (data.whiteTimeLeft !== undefined && data.whiteTimeLeft !== null) {
          setWhiteTime(data.whiteTimeLeft);
          whiteTimeRef.current = data.whiteTimeLeft;
          console.log('Spectator: Set white time to', data.whiteTimeLeft);
        }
        
        if (data.blackTimeLeft !== undefined && data.blackTimeLeft !== null) {
          setBlackTime(data.blackTimeLeft);
          blackTimeRef.current = data.blackTimeLeft;
          console.log('Spectator: Set black time to', data.blackTimeLeft);
        }
        
        // If time is not available, parse from timeControl as fallback
        if ((data.whiteTimeLeft === undefined || data.whiteTimeLeft === null) && data.timeControl) {
          const parts = data.timeControl.split('+');
          if (parts.length > 0) {
            const minutes = parseInt(parts[0]);
            if (!isNaN(minutes)) {
              const baseTime = minutes * 60;
              setWhiteTime(baseTime);
              setBlackTime(baseTime);
              whiteTimeRef.current = baseTime;
              blackTimeRef.current = baseTime;
              console.log('Spectator: Using fallback time from timeControl:', baseTime);
            }
          }
        }
        
        // Apply move history
        if (data.moves && data.moves.length > 0) {
          data.moves.forEach(move => {
            try {
              chessRef.current.move(move.san);
            } catch (error) {
              console.error('Failed to apply move:', move.san, error);
            }
          });
          setFen(chessRef.current.fen());
          setMoveHistory(chessRef.current.history());
        }
        
        // Check if game is over (status: 0=Pending, 1=Active, 2=Completed, 3=Abandoned)
        if (data.status !== 1) {
          setGameOver(true);
          setGameResult(data.result);
        }
      } catch (error) {
        console.error('Failed to load game:', error);
      }
    };
    
    loadGame();
  }, [gameId]);

  // Connect to SignalR as spectator (only for active games)
  useEffect(() => {
    // Don't connect to SignalR for completed games
    if (gameData && gameData.status !== 1) {
      console.log('Spectator: Game is not active, skipping SignalR connection');
      return;
    }
    
    const connectAsSpectator = async () => {
      try {
        await signalRService.connect();
        await signalRService.joinGameAsSpectator(gameId);
        
        console.log('Spectator: Connected to SignalR for game', gameId);
        
        // Listen for moves
        const handleMoveMade = (moveData) => {
          console.log('Spectator received move:', moveData);
          
          try {
            const move = chessRef.current.move(moveData.san);
            if (move) {
              setFen(chessRef.current.fen());
              setMoveHistory(chessRef.current.history());
              
              if (moveData.whiteTimeLeft !== undefined) {
                setWhiteTime(moveData.whiteTimeLeft);
                whiteTimeRef.current = moveData.whiteTimeLeft;
              }
              if (moveData.blackTimeLeft !== undefined) {
                setBlackTime(moveData.blackTimeLeft);
                blackTimeRef.current = moveData.blackTimeLeft;
              }
            }
          } catch (error) {
            console.error('Spectator: Invalid move received:', error);
          }
        };
        
        // Listen for game end
        const handleGameEnded = (data) => {
          console.log('Spectator: Game ended:', data);
          setGameOver(true);
          setGameResult(data.result);
          setWinnerId(data.winnerId);
        };
        
        signalRService.onMoveMade(handleMoveMade);
        signalRService.onGameEnded(handleGameEnded);
      } catch (error) {
        console.error('Failed to connect as spectator:', error);
      }
    };
    
    connectAsSpectator();
    
    return () => {
      if (gameData && gameData.status === 1) {
        signalRService.leaveGameAsSpectator(gameId);
      }
    };
  }, [gameId, gameData]);

  // Timer logic
  useEffect(() => {
    if (gameOver || !gameData || moveHistory.length === 0) {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      return;
    }
    
    timerIntervalRef.current = setInterval(() => {
      const isWhiteTurn = moveHistory.length % 2 === 0;
      
      if (isWhiteTurn) {
        setWhiteTime(prev => Math.max(0, prev - 1));
      } else {
        setBlackTime(prev => Math.max(0, prev - 1));
      }
    }, 1000);
    
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [gameOver, gameData, moveHistory.length]);

  // Initialize chessground
  useEffect(() => {
    if (!boardRef.current) {
      console.log('Spectator: boardRef not ready');
      return;
    }

    console.log('Spectator: Initializing board with FEN:', fen);

    if (cgRef.current) {
      cgRef.current.destroy();
    }

    cgRef.current = Chessground(boardRef.current, {
      fen: fen,
      orientation: 'white',
      coordinates: boardSettings.showCoordinates,
      viewOnly: true, // Read-only for spectators
      movable: {
        free: false,
        dests: new Map()
      }
    });

    console.log('Spectator: Board initialized');

    return () => {
      if (cgRef.current) {
        cgRef.current.destroy();
      }
    };
  }, [gameData]); // Re-initialize when game data loads

  // Update board when fen changes
  useEffect(() => {
    if (cgRef.current) {
      cgRef.current.set({
        fen: fen,
        viewOnly: true
      });
    }
  }, [fen]);

  if (!gameData) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '24px', marginBottom: '20px' }}>⏳</div>
        <div>{t('common.loading')}...</div>
      </div>
    );
  }

  return (
    <div className="chessboard-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div className="chessboard-header" style={{ marginBottom: '20px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ margin: 0, color: '#d4af37' }}>
            👁️ {t('spectator.watchingGame')}
          </h2>
          <button
            onClick={() => tournamentRoom ? navigate(`/t/${tournamentRoom}/bracket`) : navigate('/live')}
            className="btn-outline"
            style={{ padding: '8px 16px', fontSize: '14px' }}
          >
            ← {tournamentRoom ? t('spectator.backToTournament') : t('spectator.backToLiveGames')}
          </button>
        </div>
        
        <div style={{ fontSize: '16px', color: '#aaa' }}>
          {gameData.whitePlayer?.username} vs {gameData.blackPlayer?.username} • {gameData.timeControl}
          {gameOver && (
            <div style={{ marginTop: '8px', color: '#d4af37', fontWeight: 'bold' }}>
              {gameResult === 'draw' ? '🤝 ' + t('game.draw') : 
               winnerId && gameData ? 
                 `🏆 ${winnerId === gameData.whitePlayerId ? gameData.whitePlayer?.username : gameData.blackPlayer?.username} ${t('game.wins')}` : 
                 t('game.gameOver')}
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
        {/* Black player */}
        <div className="player-info-card" style={{
          flex: 1,
          padding: '25px',
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{ 
            fontSize: '18px', 
            fontWeight: 'bold', 
            marginBottom: '12px',
            color: '#d4af37'
          }}>
            {gameData.blackPlayer?.username}
          </div>
          <div style={{ 
            fontSize: '32px', 
            fontWeight: 'bold',
            color: blackTime < 60 ? '#ff4444' : '#ffffff',
            fontFamily: 'monospace'
          }}>
            ⏱️ {formatTime(blackTime)}
          </div>
        </div>
        
        {/* White player */}
        <div className="player-info-card" style={{
          flex: 1,
          padding: '25px',
          background: 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{ 
            fontSize: '18px', 
            fontWeight: 'bold', 
            marginBottom: '12px',
            color: '#d4af37'
          }}>
            {gameData.whitePlayer?.username}
          </div>
          <div style={{ 
            fontSize: '32px', 
            fontWeight: 'bold',
            color: whiteTime < 60 ? '#ff4444' : '#ffffff',
            fontFamily: 'monospace'
          }}>
            ⏱️ {formatTime(whiteTime)}
          </div>
        </div>
      </div>

      <div 
        ref={boardRef} 
        className={`chessboard-board theme-${boardSettings.theme} board-${boardSettings.size}`}
        style={{ 
          width: '100%', 
          maxWidth: boardSettings.size === 'small' ? '400px' : boardSettings.size === 'large' ? '800px' : '600px',
          aspectRatio: '1/1',
          margin: '0 auto'
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
    </div>
  );
}
