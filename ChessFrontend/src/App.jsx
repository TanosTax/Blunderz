import { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { GiChessKnight } from 'react-icons/gi';
import ChessBoard from './components/ChessBoard';
import Matchmaking from './components/Matchmaking';
import Profile from './components/Profile';
import Leaderboard from './components/Leaderboard';
import Auth from './components/Auth';
import apiService from './services/apiService';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initUser();
  }, []);

  const initUser = async () => {
    try {
      // Check if user already logged in
      const savedUserId = localStorage.getItem('userId');
      const savedUsername = localStorage.getItem('username');
      const isAnonymous = localStorage.getItem('isAnonymous') === 'true';
      
      if (savedUserId && savedUsername) {
        // Fetch full user data
        const userData = await apiService.getUser(parseInt(savedUserId));
        setUser(userData);
      }
    } catch (error) {
      console.error('Failed to init user:', error);
      localStorage.removeItem('userId');
      localStorage.removeItem('username');
      localStorage.removeItem('isAnonymous');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = async (authData) => {
    // Fetch full user data
    const userData = await apiService.getUser(authData.userId);
    setUser(userData);
    
    // Если это гость, перенаправляем сразу в матчмейкинг
    if (authData.isGuest) {
      // Используем setTimeout чтобы дать время на рендер
      setTimeout(() => {
        window.location.href = '/play';
      }, 100);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('isAnonymous');
    setUser(null);
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <Router>
      <div className="app">
        <nav className="nav">
          <div className="nav-content">
            <Link to="/" className="nav-logo">
              <GiChessKnight 
                size={40} 
                style={{ 
                  color: '#d4af37',
                  filter: 'drop-shadow(0 0 10px rgba(212, 175, 55, 0.6))'
                }} 
              />
              <span>Blunderz</span>
            </Link>
            <div className="nav-links">
              <Link to="/play" className="nav-link">Play</Link>
              <Link to="/profile" className="nav-link">Profile</Link>
              <Link to="/leaderboard" className="nav-link">Leaderboard</Link>
            </div>
            <div className="nav-user">
              <div className="nav-user-info">
                <span>{user.username}</span>
                <span className="nav-user-elo">({user.elo})</span>
              </div>
              <button 
                onClick={handleLogout}
                className="btn-outline"
                style={{ padding: '6px 16px', fontSize: '14px' }}
              >
                Logout
              </button>
            </div>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/play" element={<PlayPage userId={user.id} />} />
          <Route path="/game/:gameId" element={<GamePage userId={user.id} onUserUpdate={setUser} />} />
          <Route path="/profile" element={<Profile userId={user.id} />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
        </Routes>
      </div>
    </Router>
  );
}

function Home() {
  const navigate = useNavigate();

  return (
    <div className="container" style={{ 
      maxWidth: '900px', 
      margin: '80px auto', 
      textAlign: 'center',
    }}>
      <div style={{ marginBottom: '48px' }}>
        <div style={{
          display: 'inline-block',
          padding: '20px',
          background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(212, 175, 55, 0.05) 100%)',
          borderRadius: '24px',
          border: '2px solid #d4af37',
          marginBottom: '24px',
          boxShadow: '0 8px 30px rgba(212, 175, 55, 0.4)'
        }}>
          <GiChessKnight 
            size={100} 
            style={{ 
              color: '#d4af37',
              filter: 'drop-shadow(0 0 20px rgba(212, 175, 55, 0.8))'
            }} 
          />
        </div>
        <h1 style={{ 
          fontSize: '56px', 
          marginBottom: '16px',
          background: 'linear-gradient(135deg, #f4d03f 0%, #d4af37 50%, #b8941e 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: '700',
          textShadow: '0 0 30px rgba(212, 175, 55, 0.3)'
        }}>
          Blunderz
        </h1>
        <p style={{ 
          color: 'var(--color-text-secondary)', 
          fontSize: '20px',
          marginBottom: '48px',
          maxWidth: '600px',
          margin: '0 auto 48px'
        }}>
          Master the art of chess. Play, compete, and rise through the ranks.
        </p>
        
        <button
          onClick={() => navigate('/play')}
          className="btn-primary"
          style={{
            padding: '20px 60px',
            fontSize: '20px',
            marginBottom: '16px',
            boxShadow: '0 8px 30px rgba(212, 175, 55, 0.5)'
          }}
        >
          Play Now
        </button>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '24px',
        marginTop: '80px'
      }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ 
            fontSize: '48px', 
            marginBottom: '16px',
            filter: 'drop-shadow(0 0 15px rgba(212, 175, 55, 0.5))'
          }}>⚡</div>
          <h3 style={{ 
            marginBottom: '12px',
            fontSize: '20px',
            color: '#d4af37'
          }}>Fast Matchmaking</h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px' }}>
            Find opponents instantly with our smart Elo-based matching system
          </p>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ 
            fontSize: '48px', 
            marginBottom: '16px',
            filter: 'drop-shadow(0 0 15px rgba(212, 175, 55, 0.5))'
          }}>📊</div>
          <h3 style={{ 
            marginBottom: '12px',
            fontSize: '20px',
            color: '#d4af37'
          }}>Rating System</h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px' }}>
            Track your progress with our advanced Elo rating system
          </p>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ 
            fontSize: '48px', 
            marginBottom: '16px',
            filter: 'drop-shadow(0 0 15px rgba(212, 175, 55, 0.5))'
          }}>🏆</div>
          <h3 style={{ 
            marginBottom: '12px',
            fontSize: '20px',
            color: '#d4af37'
          }}>Leaderboards</h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px' }}>
            Compete with players worldwide and climb to the top
          </p>
        </div>
      </div>
    </div>
  );
}

function PlayPage({ userId }) {
  const navigate = useNavigate();

  const handleGameFound = (gameId) => {
    navigate(`/game/${gameId}`);
  };

  return <Matchmaking userId={userId} onGameFound={handleGameFound} />;
}

function GamePage({ userId, onUserUpdate }) {
  const [gameData, setGameData] = useState(null);
  const [loading, setLoading] = useState(true);
  const eloUpdatedRef = useRef(false);
  
  // Get gameId from URL
  const gameId = window.location.pathname.split('/').pop();

  useEffect(() => {
    loadGame();
  }, [gameId]);

  const loadGame = async () => {
    try {
      const game = await apiService.getGame(gameId);
      setGameData(game);
      
      // Start game if pending (status 0 = Pending, 1 = Active)
      if (game.status === 0) {
        try {
          await apiService.startGame(gameId);
          // Reload game to get updated status
          const updatedGame = await apiService.getGame(gameId);
          setGameData(updatedGame);
        } catch (error) {
          console.warn('Failed to start game (might be already started):', error);
          // Game might be already started, continue anyway
        }
      }
    } catch (error) {
      console.error('Failed to load game:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEloChange = async (change) => {
    // Prevent multiple updates
    if (eloUpdatedRef.current) return;
    eloUpdatedRef.current = true;
    
    console.log('Updating Elo by:', change);
    
    // Fetch updated user data from server
    try {
      const updatedUser = await apiService.getUser(userId);
      onUserUpdate(updatedUser);
      console.log('User updated with new Elo:', updatedUser.elo);
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Loading game...</div>;
  }

  if (!gameData) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Game not found</div>;
  }

  const isPlayerWhite = gameData.whitePlayerId === userId;

  return (
    <div>
      <ChessBoard 
        gameId={gameId} 
        userId={userId} 
        isPlayerWhite={isPlayerWhite}
        onEloChange={handleEloChange}
      />
    </div>
  );
}

export default App;
