import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Chessground } from 'chessground';
import { Chess } from 'chess.js';
import apiService from '../services/apiService';
import { useLanguage } from '../i18n/LanguageContext';
import 'chessground/assets/chessground.base.css';
import 'chessground/assets/chessground.brown.css';
import 'chessground/assets/chessground.cburnett.css';
import '../styles/chessboard-themes.css';

export default function GameReplay() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [gameData, setGameData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1); // -1 = starting position
  const [chess] = useState(new Chess());
  const boardRef = useRef(null);
  const cgRef = useRef(null);
  const [boardSettings] = useState(() => {
    const saved = localStorage.getItem('boardSettings');
    return saved ? JSON.parse(saved) : {
      theme: 'gold',
      size: 'medium',
      showCoordinates: true
    };
  });
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [currentEvaluation, setCurrentEvaluation] = useState(0);
  const [lastMoveSquares, setLastMoveSquares] = useState({ from: null, to: null });

  useEffect(() => {
    loadGame();
  }, [gameId]);

  const loadGame = async () => {
    try {
      const game = await apiService.getGame(gameId);
      setGameData(game);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load game:', error);
      setLoading(false);
    }
  };

  // Initialize board
  useEffect(() => {
    if (!boardRef.current || !gameData) return;

    if (cgRef.current) {
      cgRef.current.destroy();
    }

    cgRef.current = Chessground(boardRef.current, {
      fen: chess.fen(),
      orientation: 'white',
      viewOnly: true,
      coordinates: boardSettings.showCoordinates,
      movable: {
        free: false,
        dests: new Map()
      }
    });

    return () => {
      if (cgRef.current) {
        cgRef.current.destroy();
      }
    };
  }, [gameData]);

  // Update board when move index changes
  useEffect(() => {
    if (!gameData || !cgRef.current) return;

    try {
      // Reset to starting position
      chess.reset();
      let lastMove = null;

      // Apply moves up to current index
      if (currentMoveIndex >= 0 && gameData.moves && gameData.moves.length > 0) {
        for (let i = 0; i <= currentMoveIndex && i < gameData.moves.length; i++) {
          try {
            const move = chess.move(gameData.moves[i].san);
            if (!move) {
              console.error('Invalid move at index', i, ':', gameData.moves[i].san);
              break;
            }
            if (i === currentMoveIndex) {
              lastMove = move;
            }
          } catch (error) {
            console.error('Error applying move at index', i, ':', gameData.moves[i].san, error);
            break;
          }
        }
      }

      // Update last move squares for highlighting
      if (lastMove) {
        setLastMoveSquares({ from: lastMove.from, to: lastMove.to });
      } else {
        setLastMoveSquares({ from: null, to: null });
      }

      // Update board
      cgRef.current.set({
        fen: chess.fen(),
        lastMove: lastMove ? [lastMove.from, lastMove.to] : undefined
      });

      // Update evaluation if analysis is available
      if (analysis && currentMoveIndex >= 0 && currentMoveIndex < analysis.moves.length) {
        let evaluation = analysis.moves[currentMoveIndex].evaluationAfter;
        // Clamp mate scores to reasonable range for display
        if (Math.abs(evaluation) > 9000) {
          evaluation = evaluation > 0 ? 2000 : -2000;
        }
        setCurrentEvaluation(evaluation);
      } else {
        setCurrentEvaluation(0);
      }
    } catch (error) {
      console.error('Error updating board:', error);
    }
  }, [currentMoveIndex, gameData, chess, analysis]);

  const goToStart = () => {
    console.log('Going to start');
    setCurrentMoveIndex(-1);
  };
  
  const goToPrevious = () => {
    console.log('Going to previous, current:', currentMoveIndex);
    setCurrentMoveIndex(Math.max(-1, currentMoveIndex - 1));
  };
  
  const goToNext = () => {
    const maxIndex = (gameData?.moves?.length || 1) - 1;
    console.log('Going to next, current:', currentMoveIndex, 'max:', maxIndex);
    setCurrentMoveIndex(Math.min(maxIndex, currentMoveIndex + 1));
  };
  
  const goToEnd = () => {
    const maxIndex = (gameData?.moves?.length || 1) - 1;
    console.log('Going to end, max:', maxIndex);
    setCurrentMoveIndex(maxIndex);
  };

  const goToMove = (index) => {
    console.log('Going to move:', index);
    setCurrentMoveIndex(index);
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const result = await apiService.analyzeGame(gameId);
      setAnalysis(result);
      console.log('Analysis complete:', result);
    } catch (error) {
      console.error('Failed to analyze game:', error);
      alert('Failed to analyze game. Check console for details.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAIAnalyze = async () => {
    setAiAnalyzing(true);
    try {
      const result = await apiService.getAIAnalysis(gameId);
      setAiAnalysis(result);
      setShowAiModal(true);
      console.log('AI Analysis complete:', result);
    } catch (error) {
      console.error('Failed to get AI analysis:', error);
      alert(t('aiCoach.error') + ': ' + error.message);
    } finally {
      setAiAnalyzing(false);
    }
  };

  const getClassificationColor = (classification) => {
    switch (classification) {
      case 0: return '#00ff00'; // Brilliant
      case 1: return '#4CAF50'; // Great
      case 2: return '#8BC34A'; // Best
      case 3: return '#FFC107'; // Good
      case 4: return '#FF9800'; // Inaccuracy
      case 5: return '#FF5722'; // Mistake
      case 6: return '#f44336'; // Blunder
      default: return '#888';
    }
  };

  const getClassificationSymbol = (classification) => {
    switch (classification) {
      case 0: return '!!'; // Brilliant
      case 1: return '!';  // Great
      case 2: return '';   // Best (no symbol)
      case 3: return '★';  // Good
      case 4: return '?!'; // Inaccuracy
      case 5: return '?';  // Mistake
      case 6: return '??'; // Blunder
      default: return '';
    }
  };

  const getClassificationText = (classification) => {
    switch (classification) {
      case 0: return 'Brilliant';
      case 1: return 'Great';
      case 2: return 'Best';
      case 3: return 'Good';
      case 4: return 'Inaccuracy';
      case 5: return 'Mistake';
      case 6: return 'Blunder';
      default: return '';
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', color: '#888' }}>
        Loading game...
      </div>
    );
  }

  if (!gameData) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', color: '#888' }}>
        Game not found
      </div>
    );
  }

  const getResultText = () => {
    if (gameData.result === 0) return '1-0 (White wins)';
    if (gameData.result === 1) return '0-1 (Black wins)';
    if (gameData.result === 2 || gameData.result === 3) return '½-½ (Draw)';
    return 'Game ended';
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      {/* AI Analysis Modal */}
      {showAiModal && aiAnalysis && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={() => setShowAiModal(false)}
        >
          <div 
            className="card"
            style={{
              maxWidth: '800px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: '#1a1a1a',
              border: '2px solid #d4af37',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '20px',
              paddingBottom: '15px',
              borderBottom: '1px solid #333'
            }}>
              <h2 style={{ color: '#d4af37', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                🤖 {t('aiCoach.title')}
              </h2>
              <button
                onClick={() => setShowAiModal(false)}
                className="btn-outline"
                style={{ padding: '8px 16px' }}
              >
                ✕
              </button>
            </div>

            <div style={{ 
              color: '#ddd', 
              lineHeight: '1.8',
              whiteSpace: 'pre-wrap',
              fontSize: '15px'
            }}>
              {aiAnalysis.analysis}
            </div>

            <div style={{ 
              marginTop: '20px', 
              paddingTop: '15px', 
              borderTop: '1px solid #333',
              color: '#888',
              fontSize: '13px',
              textAlign: 'center'
            }}>
              {t('aiCoach.loading')}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="game-replay-header" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <h2 style={{ color: '#d4af37', margin: '0 0 8px 0' }}>
            📺 Game Replay
          </h2>
          <div style={{ color: '#888', fontSize: '14px' }}>
            {gameData.whitePlayer?.username} vs {gameData.blackPlayer?.username}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="btn-primary"
            style={{ padding: '8px 16px' }}
          >
            {analyzing ? '⏳ ' + t('replay.analyzing') : '🔍 ' + t('replay.analyze')}
          </button>
          <button
            onClick={handleAIAnalyze}
            disabled={aiAnalyzing}
            className="btn-primary"
            style={{ 
              padding: '8px 16px',
              background: aiAnalyzing ? '#666' : 'linear-gradient(135deg, #d4af37 0%, #f4d03f 100%)',
              border: 'none'
            }}
          >
            {aiAnalyzing ? '⏳ ' + t('aiCoach.analyzing') : t('aiCoach.button')}
          </button>
          <button
            onClick={() => navigate('/history')}
            className="btn-outline"
            style={{ padding: '8px 16px' }}
          >
            ← {t('replay.backToHistory')}
          </button>
        </div>
      </div>

      <div className="game-replay-container" style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 350px',
        gap: '20px',
        alignItems: 'start'
      }}>
        {/* Board with Evaluation Bar */}
        <div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {/* Evaluation Bar */}
            {analysis && (
              <div style={{
                width: '40px',
                height: boardSettings.size === 'small' ? '400px' : boardSettings.size === 'large' ? '800px' : '600px',
                background: '#1a1a1a',
                border: '2px solid #333',
                borderRadius: '8px',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* White advantage (bottom) */}
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: '#fff',
                  height: `${Math.min(100, Math.max(0, 50 + (currentEvaluation / 40)))}%`,
                  transition: 'height 0.3s ease'
                }} />
                
                {/* Black advantage (top) */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  background: '#000',
                  height: `${Math.min(100, Math.max(0, 50 - (currentEvaluation / 40)))}%`,
                  transition: 'height 0.3s ease'
                }} />

                {/* Center line */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: 0,
                  right: 0,
                  height: '2px',
                  background: '#d4af37',
                  transform: 'translateY(-50%)'
                }} />

                {/* Evaluation text */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  color: '#d4af37',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  textShadow: '0 0 4px rgba(0,0,0,0.8)',
                  writingMode: 'vertical-rl',
                  textOrientation: 'mixed'
                }}>
                  {(() => {
                    if (analysis && currentMoveIndex >= 0 && currentMoveIndex < analysis.moves.length) {
                      const rawEval = analysis.moves[currentMoveIndex].evaluationAfter;
                      if (Math.abs(rawEval) > 9000) {
                        return rawEval > 0 ? 'M' : 'M';
                      }
                    }
                    return currentEvaluation > 0 ? `+${(currentEvaluation / 100).toFixed(1)}` : (currentEvaluation / 100).toFixed(1);
                  })()}
                </div>
              </div>
            )}

            {/* Chess Board */}
            <div style={{ 
              position: 'relative',
              width: '100%',
              maxWidth: boardSettings.size === 'small' ? '400px' : boardSettings.size === 'large' ? '800px' : '600px'
            }}>
              <div 
                ref={boardRef}
                className={`theme-${boardSettings.theme} board-${boardSettings.size}`}
                style={{ 
                  width: '100%',
                  aspectRatio: '1/1'
                }}
              />
              
              {/* Move annotation overlay */}
              {analysis && currentMoveIndex >= 0 && lastMoveSquares.to && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  pointerEvents: 'none',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(8, 1fr)',
                  gridTemplateRows: 'repeat(8, 1fr)'
                }}>
                  {(() => {
                    const moveAnalysis = analysis.moves[currentMoveIndex];
                    if (!moveAnalysis) return null;
                    
                    const symbol = getClassificationSymbol(moveAnalysis.classification);
                    if (!symbol) return null;
                    
                    const color = getClassificationColor(moveAnalysis.classification);
                    const file = lastMoveSquares.to.charCodeAt(0) - 97; // a=0, b=1, etc
                    const rank = 8 - parseInt(lastMoveSquares.to[1]); // 8=0, 7=1, etc
                    
                    return (
                      <div style={{
                        gridColumn: file + 1,
                        gridRow: rank + 1,
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'flex-end',
                        padding: '2px'
                      }}>
                        <div style={{
                          background: color,
                          color: '#000',
                          fontWeight: 'bold',
                          fontSize: boardSettings.size === 'small' ? '14px' : boardSettings.size === 'large' ? '22px' : '18px',
                          padding: '2px 4px',
                          borderRadius: '3px',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
                          lineHeight: 1
                        }}>
                          {symbol}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="game-replay-controls" style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '12px',
            marginTop: '20px'
          }}>
            <button
              onClick={goToStart}
              disabled={currentMoveIndex === -1}
              className="btn-outline"
              style={{ 
                padding: '10px 16px',
                fontSize: '18px',
                minWidth: '50px'
              }}
              title="Go to start"
            >
              ⏮️
            </button>
            <button
              onClick={goToPrevious}
              disabled={currentMoveIndex === -1}
              className="btn-outline"
              style={{ 
                padding: '10px 16px',
                fontSize: '18px',
                minWidth: '50px'
              }}
              title="Previous move"
            >
              ◀️
            </button>
            <div className="game-replay-counter" style={{
              padding: '10px 20px',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              color: '#d4af37',
              fontWeight: 'bold',
              minWidth: '100px',
              textAlign: 'center'
            }}>
              {currentMoveIndex === -1 ? 'Start' : `${currentMoveIndex + 1} / ${gameData.moves?.length || 0}`}
            </div>
            <button
              onClick={goToNext}
              disabled={currentMoveIndex >= (gameData.moves?.length - 1 || 0)}
              className="btn-outline"
              style={{ 
                padding: '10px 16px',
                fontSize: '18px',
                minWidth: '50px'
              }}
              title="Next move"
            >
              ▶️
            </button>
            <button
              onClick={goToEnd}
              disabled={currentMoveIndex >= (gameData.moves?.length - 1 || 0)}
              className="btn-outline"
              style={{ 
                padding: '10px 16px',
                fontSize: '18px',
                minWidth: '50px'
              }}
              title="Go to end"
            >
              ⏭️
            </button>
          </div>
        </div>

        {/* Move List & Info */}
        <div className="game-replay-sidebar game-replay-info">
          <div className="game-replay-info-grid">
          {/* Game Info */}
          <div className="card" style={{ marginBottom: '0' }}>
            <h3 style={{ color: '#d4af37', marginBottom: '12px', fontSize: '18px' }}>
              Game Information
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#888' }}>White:</span>
                <span style={{ color: '#fff', fontWeight: '500' }}>
                  {gameData.whitePlayer?.username} ({gameData.whitePlayer?.elo})
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#888' }}>Black:</span>
                <span style={{ color: '#fff', fontWeight: '500' }}>
                  {gameData.blackPlayer?.username} ({gameData.blackPlayer?.elo})
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#888' }}>Time Control:</span>
                <span style={{ color: '#d4af37', fontWeight: '500' }}>{gameData.timeControl}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#888' }}>Result:</span>
                <span style={{ color: '#d4af37', fontWeight: '500' }}>{getResultText()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#888' }}>Total Moves:</span>
                <span style={{ color: '#fff', fontWeight: '500' }}>{gameData.moves?.length || 0}</span>
              </div>
            </div>
          </div>

          {/* Analysis Summary */}
          {analysis && (
            <>
              <div className="card" style={{ marginBottom: '0' }}>
                <h3 style={{ color: '#d4af37', marginBottom: '12px', fontSize: '18px' }}>
                  ⚪ White Performance
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#888' }}>Accuracy:</span>
                    <span style={{ color: '#d4af37', fontWeight: 'bold' }}>
                      {analysis.whitePerformance.averageAccuracy.toFixed(1)}%
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', marginTop: '4px' }}>
                    {analysis.whitePerformance.brilliant > 0 && (
                      <div style={{ color: '#00ff00' }}>💎 {analysis.whitePerformance.brilliant}</div>
                    )}
                    {analysis.whitePerformance.great > 0 && (
                      <div style={{ color: '#4CAF50' }}>⭐ {analysis.whitePerformance.great}</div>
                    )}
                    {analysis.whitePerformance.best > 0 && (
                      <div style={{ color: '#8BC34A' }}>✓ {analysis.whitePerformance.best}</div>
                    )}
                    {analysis.whitePerformance.good > 0 && (
                      <div style={{ color: '#FFC107' }}>○ {analysis.whitePerformance.good}</div>
                    )}
                    {analysis.whitePerformance.inaccuracies > 0 && (
                      <div style={{ color: '#FF9800' }}>?! {analysis.whitePerformance.inaccuracies}</div>
                    )}
                    {analysis.whitePerformance.mistakes > 0 && (
                      <div style={{ color: '#FF5722' }}>? {analysis.whitePerformance.mistakes}</div>
                    )}
                    {analysis.whitePerformance.blunders > 0 && (
                      <div style={{ color: '#f44336' }}>?? {analysis.whitePerformance.blunders}</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="card" style={{ marginBottom: '0' }}>
                <h3 style={{ color: '#d4af37', marginBottom: '12px', fontSize: '18px' }}>
                  ⚫ Black Performance
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#888' }}>Accuracy:</span>
                    <span style={{ color: '#d4af37', fontWeight: 'bold' }}>
                      {analysis.blackPerformance.averageAccuracy.toFixed(1)}%
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', marginTop: '4px' }}>
                    {analysis.blackPerformance.brilliant > 0 && (
                      <div style={{ color: '#00ff00' }}>💎 {analysis.blackPerformance.brilliant}</div>
                    )}
                    {analysis.blackPerformance.great > 0 && (
                      <div style={{ color: '#4CAF50' }}>⭐ {analysis.blackPerformance.great}</div>
                    )}
                    {analysis.blackPerformance.best > 0 && (
                      <div style={{ color: '#8BC34A' }}>✓ {analysis.blackPerformance.best}</div>
                    )}
                    {analysis.blackPerformance.good > 0 && (
                      <div style={{ color: '#FFC107' }}>○ {analysis.blackPerformance.good}</div>
                    )}
                    {analysis.blackPerformance.inaccuracies > 0 && (
                      <div style={{ color: '#FF9800' }}>?! {analysis.blackPerformance.inaccuracies}</div>
                    )}
                    {analysis.blackPerformance.mistakes > 0 && (
                      <div style={{ color: '#FF5722' }}>? {analysis.blackPerformance.mistakes}</div>
                    )}
                    {analysis.blackPerformance.blunders > 0 && (
                      <div style={{ color: '#f44336' }}>?? {analysis.blackPerformance.blunders}</div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Move List */}
          <div className="card">
            <h3 style={{ color: '#d4af37', marginBottom: '12px', fontSize: '18px' }}>
              Move History
            </h3>
            <div className="game-replay-moves" style={{
              maxHeight: '400px',
              overflowY: 'auto',
              display: 'grid',
              gridTemplateColumns: 'auto 1fr 1fr',
              gap: '4px 8px',
              fontSize: '14px'
            }}>
              {gameData.moves && gameData.moves.length > 0 ? (
                <>
                  {Array.from({ length: Math.ceil(gameData.moves.length / 2) }).map((_, pairIndex) => {
                    const whiteMove = gameData.moves[pairIndex * 2];
                    const blackMove = gameData.moves[pairIndex * 2 + 1];
                    
                    // Get analysis for moves
                    const whiteAnalysis = analysis?.moves?.[pairIndex * 2];
                    const blackAnalysis = analysis?.moves?.[pairIndex * 2 + 1];
                    
                    return (
                      <div key={pairIndex} style={{ display: 'contents' }}>
                        {/* Move number */}
                        <div style={{ 
                          color: '#888', 
                          fontWeight: 'bold',
                          padding: '4px 0'
                        }}>
                          {pairIndex + 1}.
                        </div>
                        
                        {/* White move */}
                        <div
                          className="game-replay-move-item"
                          onClick={() => goToMove(pairIndex * 2)}
                          style={{
                            padding: '6px 8px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            background: currentMoveIndex === pairIndex * 2 
                              ? 'rgba(212, 175, 55, 0.2)' 
                              : 'transparent',
                            color: currentMoveIndex === pairIndex * 2 ? '#d4af37' : '#fff',
                            fontWeight: currentMoveIndex === pairIndex * 2 ? 'bold' : 'normal',
                            transition: 'all 0.2s ease',
                            borderLeft: whiteAnalysis ? `3px solid ${getClassificationColor(whiteAnalysis.classification)}` : 'none'
                          }}
                          onMouseEnter={(e) => {
                            if (currentMoveIndex !== pairIndex * 2) {
                              e.currentTarget.style.background = 'rgba(212, 175, 55, 0.1)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (currentMoveIndex !== pairIndex * 2) {
                              e.currentTarget.style.background = 'transparent';
                            }
                          }}
                          title={whiteAnalysis ? `${getClassificationText(whiteAnalysis.classification)} (${whiteAnalysis.centipawnsLost.toFixed(0)} cp lost)` : ''}
                        >
                          {whiteMove.san}
                        </div>
                        
                        {/* Black move */}
                        {blackMove ? (
                          <div
                            className="game-replay-move-item"
                            onClick={() => goToMove(pairIndex * 2 + 1)}
                            style={{
                              padding: '6px 8px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              background: currentMoveIndex === pairIndex * 2 + 1 
                                ? 'rgba(212, 175, 55, 0.2)' 
                                : 'transparent',
                              color: currentMoveIndex === pairIndex * 2 + 1 ? '#d4af37' : '#fff',
                              fontWeight: currentMoveIndex === pairIndex * 2 + 1 ? 'bold' : 'normal',
                              transition: 'all 0.2s ease',
                              borderLeft: blackAnalysis ? `3px solid ${getClassificationColor(blackAnalysis.classification)}` : 'none'
                            }}
                            onMouseEnter={(e) => {
                              if (currentMoveIndex !== pairIndex * 2 + 1) {
                                e.currentTarget.style.background = 'rgba(212, 175, 55, 0.1)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (currentMoveIndex !== pairIndex * 2 + 1) {
                                e.currentTarget.style.background = 'transparent';
                              }
                            }}
                            title={blackAnalysis ? `${getClassificationText(blackAnalysis.classification)} (${blackAnalysis.centipawnsLost.toFixed(0)} cp lost)` : ''}
                          >
                            {blackMove.san}
                          </div>
                        ) : (
                          <div></div>
                        )}
                      </div>
                    );
                  })}
                </>
              ) : (
                <div style={{ gridColumn: '1 / -1', color: '#888', textAlign: 'center', padding: '20px' }}>
                  No moves recorded
                </div>
              )}
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
