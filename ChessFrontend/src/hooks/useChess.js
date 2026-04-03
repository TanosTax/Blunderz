// v3.0 - Fixed parameter order
import { useState, useEffect, useCallback, useRef } from 'react';
import { Chess } from 'chess.js';
import signalRService from '../services/signalRService';
import apiService from '../services/apiService';

export const useChess = (gameId, userId, isPlayerWhite, setWhiteTime, setBlackTime, whiteTimeRef, blackTimeRef) => {
  const [game] = useState(new Chess());
  const [fen, setFen] = useState(game.fen());
  const [moveHistory, setMoveHistory] = useState([]);
  const [isMyTurn, setIsMyTurn] = useState(isPlayerWhite);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [eloChange, setEloChange] = useState(null);
  const [opponentConnected, setOpponentConnected] = useState(true);
  const [opponentDisconnectTime, setOpponentDisconnectTime] = useState(null);
  const [canClaimVictory, setCanClaimVictory] = useState(false);
  const lastMoveRef = useRef(null);
  const gameEndedRef = useRef(false);
  const heartbeatIntervalRef = useRef(null);

  console.log('useChess init:', { gameId, userId, isPlayerWhite, isMyTurn });

  const handleGameOver = useCallback(async () => {
    if (gameEndedRef.current) return;
    gameEndedRef.current = true;

    setGameOver(true);
    
    let result;
    let winnerId = null;

    if (game.isCheckmate()) {
      const winnerColor = game.turn() === 'w' ? 'black' : 'white';
      setWinner(winnerColor);
      
      if (winnerColor === 'white') {
        result = 0;
        winnerId = isPlayerWhite ? userId : null;
      } else {
        result = 1;
        winnerId = !isPlayerWhite ? userId : null;
      }
    } else if (game.isStalemate()) {
      result = 3;
    } else if (game.isDraw()) {
      result = 2;
    }

    try {
      const gameData = await apiService.getGame(gameId);
      if (result === 0) {
        winnerId = gameData.whitePlayerId;
      } else if (result === 1) {
        winnerId = gameData.blackPlayerId;
      }

      const response = await apiService.endGame(gameId, result, winnerId);
      console.log('Game ended successfully:', response);
      
      if (response.eloChanges) {
        const myChange = userId === response.eloChanges.whitePlayerId 
          ? response.eloChanges.whiteChange 
          : response.eloChanges.blackChange;
        setEloChange(myChange);
      }
    } catch (error) {
      console.error('Failed to end game:', error);
    }
  }, [gameId, userId, isPlayerWhite, game]);

  useEffect(() => {
    const loadGameAndConnect = async () => {
      try {
        // Load game data first
        const gameData = await apiService.getGame(gameId);
        console.log('Game loaded:', gameData);
        
        // Set initial time from DB
        const initialWhiteTime = gameData.whiteTimeLeft || 600;
        const initialBlackTime = gameData.blackTimeLeft || 600;
        
        // Apply all moves from history
        if (gameData.moves && gameData.moves.length > 0) {
          console.log('Applying', gameData.moves.length, 'moves from history');
          gameData.moves.forEach(move => {
            try {
              game.move(move.san);
            } catch (error) {
              console.error('Failed to apply move:', move.san, error);
            }
          });
          setFen(game.fen());
          setMoveHistory(game.history());
          
          // Determine whose turn it is based on move count
          const isWhiteTurn = gameData.moves.length % 2 === 0;
          const myTurn = isPlayerWhite ? isWhiteTurn : !isWhiteTurn;
          setIsMyTurn(myTurn);
          
          // Calculate elapsed time since last move
          const lastMove = gameData.moves[gameData.moves.length - 1];
          const lastMoveTime = new Date(lastMove.createdAt);
          const now = new Date();
          const elapsedSeconds = Math.floor((now - lastMoveTime) / 1000);
          
          console.log('Time calculation:', {
            lastMoveTime,
            now,
            elapsedSeconds,
            isWhiteTurn,
            whiteTimeFromDB: initialWhiteTime,
            blackTimeFromDB: initialBlackTime
          });
          
          // Subtract elapsed time from current player's time
          if (isWhiteTurn) {
            const adjustedWhiteTime = Math.max(0, initialWhiteTime - elapsedSeconds);
            setWhiteTime(adjustedWhiteTime);
            setBlackTime(initialBlackTime);
          } else {
            const adjustedBlackTime = Math.max(0, initialBlackTime - elapsedSeconds);
            setWhiteTime(initialWhiteTime);
            setBlackTime(adjustedBlackTime);
          }
        } else {
          // No moves yet - set initial time
          setWhiteTime(initialWhiteTime);
          setBlackTime(initialBlackTime);
        }
        
        // Now connect to SignalR
        await signalRService.connect();
        await new Promise(resolve => setTimeout(resolve, 100));
        await signalRService.joinGame(gameId);

        signalRService.onMoveMade((moveData) => {
          console.log('Move received:', moveData);
          
          if (lastMoveRef.current === moveData.san) {
            console.log('Skipping own move');
            lastMoveRef.current = null;
            return;
          }
          
          try {
            const move = game.move(moveData.san);
            if (move) {
              setFen(game.fen());
              setMoveHistory(game.history());
              
              if (moveData.whiteTimeLeft !== undefined && setWhiteTime) {
                setWhiteTime(moveData.whiteTimeLeft);
              }
              if (moveData.blackTimeLeft !== undefined && setBlackTime) {
                setBlackTime(moveData.blackTimeLeft);
              }
              
              setIsMyTurn(prev => !prev);

              if (game.isGameOver()) {
                handleGameOver();
              }
            }
          } catch (error) {
            console.error('Invalid move received:', error);
          }
        });
        
        signalRService.onError((error) => {
          console.error('SignalR Error:', error);
        });

        // Setup connection status handlers
        signalRService.onPlayerConnected((data) => {
          console.log('Player connected:', data);
          setOpponentConnected(true);
          setOpponentDisconnectTime(null);
          setCanClaimVictory(false);
        });

        signalRService.onPlayerDisconnected((data) => {
          console.log('Player disconnected:', data);
          setOpponentConnected(false);
          setOpponentDisconnectTime(new Date(data.timestamp));
        });

        signalRService.onOpponentDisconnectedTimeout(() => {
          console.log('Opponent disconnected for 2 minutes');
          setCanClaimVictory(true);
        });

        signalRService.onGameEnded(async (data) => {
          console.log('Game ended:', data);
          setGameOver(true);
          
          if (data.result === 'timeout') {
            if (data.winnerId === userId) {
              setWinner(isPlayerWhite ? 'white' : 'black');
            } else {
              setWinner(isPlayerWhite ? 'black' : 'white');
            }
          } else if (data.result === 'draw') {
            setWinner(null);
          }
          
          // Get Elo change from response
          if (data.eloChanges) {
            const myChange = userId === data.eloChanges.whitePlayerId 
              ? data.eloChanges.whiteChange 
              : data.eloChanges.blackChange;
            setEloChange(myChange);
          }
        });

        // Start heartbeat
        heartbeatIntervalRef.current = setInterval(() => {
          signalRService.sendHeartbeat(gameId, userId);
        }, 5000);
      } catch (error) {
        console.error('Failed to load game or connect:', error);
      }
    };

    loadGameAndConnect();

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      signalRService.leaveGame();
    };
  }, [gameId, handleGameOver, game, setWhiteTime, setBlackTime, isPlayerWhite, userId]);

  const makeMove = useCallback(async (from, to, promotion = 'q') => {
    console.log('makeMove called:', { from, to, isMyTurn, gameOver });
    
    if (gameOver) {
      console.log('Move rejected: game over');
      return false;
    }

    try {
      const move = game.move({
        from,
        to,
        promotion
      });

      if (move) {
        console.log('Move valid:', move.san);
        setFen(game.fen());
        setMoveHistory(game.history()); // Update history immediately
        setIsMyTurn(false);

        const currentWhiteTime = whiteTimeRef?.current ?? 600;
        const currentBlackTime = blackTimeRef?.current ?? 600;
        console.log('Sending move with time:', { currentWhiteTime, currentBlackTime });
        
        lastMoveRef.current = move.san;
        await signalRService.makeMove(gameId, move.san, currentWhiteTime, currentBlackTime);
        console.log('Move sent successfully');

        if (game.isGameOver()) {
          handleGameOver();
        }

        return true;
      } else {
        console.log('Invalid move');
      }
    } catch (error) {
      console.error('Invalid move:', error);
    }

    return false;
  }, [gameId, gameOver, handleGameOver, game, whiteTimeRef, blackTimeRef]);

  const isValidMove = useCallback((from, to) => {
    const moves = game.moves({ square: from, verbose: true });
    return moves.some(move => move.to === to);
  }, [game]);

  const claimVictory = useCallback(async () => {
    try {
      await signalRService.claimVictory(gameId, userId);
      console.log('Victory claimed');
    } catch (error) {
      console.error('Failed to claim victory:', error);
    }
  }, [gameId, userId]);

  const offerDrawAfterDisconnect = useCallback(async () => {
    try {
      await signalRService.offerDrawAfterDisconnect(gameId);
      console.log('Draw offered');
    } catch (error) {
      console.error('Failed to offer draw:', error);
    }
  }, [gameId]);

  return {
    fen,
    moveHistory,
    isMyTurn,
    gameOver,
    winner,
    eloChange,
    makeMove,
    isValidMove,
    isCheck: game.isCheck(),
    isCheckmate: game.isCheckmate(),
    isDraw: game.isDraw(),
    isStalemate: game.isStalemate(),
    moveCount: moveHistory.length,
    opponentConnected,
    opponentDisconnectTime,
    canClaimVictory,
    claimVictory,
    offerDrawAfterDisconnect
  };
};
