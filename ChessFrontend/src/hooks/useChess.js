import { useState, useEffect, useCallback, useRef } from 'react';
import { Chess } from 'chess.js';
import signalRService from '../services/signalRService';
import apiService from '../services/apiService';

export const useChess = (gameId, userId, isPlayerWhite, whiteTimeRef, blackTimeRef, setWhiteTime, setBlackTime) => {
  const [game] = useState(new Chess());
  const [fen, setFen] = useState(game.fen());
  const [moveHistory, setMoveHistory] = useState([]);
  const [isMyTurn, setIsMyTurn] = useState(isPlayerWhite); // White starts
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [eloChange, setEloChange] = useState(null);
  const lastMoveRef = useRef(null); // Track last move to avoid duplicates
  const gameEndedRef = useRef(false); // Track if game end was already sent to server

  console.log('useChess init:', { gameId, userId, isPlayerWhite, isMyTurn });

  const handleGameOver = useCallback(async () => {
    if (gameEndedRef.current) return; // Already handled
    gameEndedRef.current = true;

    setGameOver(true);
    
    let result;
    let winnerId = null;

    if (game.isCheckmate()) {
      const winnerColor = game.turn() === 'w' ? 'black' : 'white';
      setWinner(winnerColor);
      
      // Determine result and winner ID
      if (winnerColor === 'white') {
        result = 0; // WhiteWin
        winnerId = isPlayerWhite ? userId : null; // Need opponent ID
      } else {
        result = 1; // BlackWin
        winnerId = !isPlayerWhite ? userId : null;
      }
    } else if (game.isStalemate()) {
      result = 3; // Stalemate
    } else if (game.isDraw()) {
      result = 2; // Draw
    }

    try {
      // Get game details to find winner ID
      const gameData = await apiService.getGame(gameId);
      if (result === 0) { // WhiteWin
        winnerId = gameData.whitePlayerId;
      } else if (result === 1) { // BlackWin
        winnerId = gameData.blackPlayerId;
      }

      const response = await apiService.endGame(gameId, result, winnerId);
      console.log('Game ended successfully:', response);
      
      // Extract Elo change for current user
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
    const connectAndJoin = async () => {
      try {
        await signalRService.connect();
        
        // Ждем немного чтобы соединение точно установилось
        await new Promise(resolve => setTimeout(resolve, 100));
        
        await signalRService.joinGame(gameId);

        signalRService.onMoveMade((moveData) => {
          console.log('Move received:', moveData);
          
          // Skip if this is our own move (already applied locally)
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
              
              // Sync time from server
              if (moveData.whiteTimeLeft !== undefined && setWhiteTime) {
                setWhiteTime(moveData.whiteTimeLeft);
              }
              if (moveData.blackTimeLeft !== undefined && setBlackTime) {
                setBlackTime(moveData.blackTimeLeft);
              }
              
              // Toggle turn
              setIsMyTurn(prev => !prev);

              // Check game over
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
      } catch (error) {
        console.error('Failed to connect:', error);
      }
    };

    connectAndJoin();

    return () => {
      signalRService.leaveGame();
    };
  }, [gameId, handleGameOver, game, setWhiteTime, setBlackTime]);

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
        const newFen = game.fen();
        setFen(newFen);
        // Send move to server
        console.log('Sending move to server...');
        await signalRService.makeMove(gameId, move.san);
        console.log('Move sent successfully');
        
        // Toggle turn immediately
        setIsMyTurn(false);

        // Send move to server with current time
        console.log('Sending move to server...');
        const currentWhiteTime = whiteTimeRef?.current ?? 600;
        const currentBlackTime = blackTimeRef?.current ?? 600;
        console.log('Current time values:', { currentWhiteTime, currentBlackTime });
        await signalRService.makeMove(gameId, move.san, currentWhiteTime, currentBlackTime);
        console.log('Move sent successfully');

        // Check game over
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
    isStalemate: game.isStalemate()
  };
};
