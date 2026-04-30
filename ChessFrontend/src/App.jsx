import { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { GiChessKnight } from 'react-icons/gi';
import ChessBoard from './components/ChessBoard';
import Matchmaking from './components/Matchmaking';
import Profile from './components/Profile';
import UserProfile from './components/UserProfile';
import Leaderboard from './components/Leaderboard';
import Auth from './components/Auth';
import GameHistory from './components/GameHistory';
import GameReplay from './components/GameReplay';
import Coach from './components/Coach';
import Puzzles from './components/Puzzles';
import LiveGames from './components/LiveGames';
import SpectatorBoard from './components/SpectatorBoard';
import LanguageSwitcher from './components/LanguageSwitcher';
import NotificationsPanel from './components/NotificationsPanel';
import { useLanguage } from './i18n/LanguageContext';
import apiService from './services/apiService';
import signalRService from './services/signalRService';
import './App.css';
import './styles/components-responsive.css';
import './styles/profile-coach-responsive.css';

function App() {
  const { t } = useLanguage();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    initUser();
    setupNotificationListeners();
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [window.location.pathname]);

  // Close mobile menu when clicking outside & prevent body scroll
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuOpen && !event.target.closest('.nav') && !event.target.closest('.mobile-menu')) {
        setMobileMenuOpen(false);
      }
    };

    // Prevent body scroll when menu is open
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  const setupNotificationListeners = async () => {
    const savedUserId = localStorage.getItem('userId');
    if (!savedUserId) return;

    try {
      // Load initial counts (only incoming)
      const [requestsData, challengesData] = await Promise.all([
        apiService.getFriendRequests(parseInt(savedUserId)),
        apiService.getPendingChallenges(parseInt(savedUserId))
      ]);
      
      const totalCount = (requestsData.incoming?.length || 0) + (challengesData.incoming?.length || 0);
      setNotificationsCount(totalCount);

      // Connect to SignalR and wait for connection
      await signalRService.connect();
      console.log('App.jsx: SignalR connected');
      
      // Small delay to ensure connection is ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await signalRService.joinUserChannel(parseInt(savedUserId));
      console.log('App.jsx: Joined user channel:', savedUserId);

      // Setup event listeners with functional updates (like useChess.js)
      signalRService.onFriendRequestReceived(() => {
        console.log('App.jsx: Friend request received');
        setNotificationsCount(prev => prev + 1);
      });

      signalRService.onFriendRequestAccepted(() => {
        console.log('App.jsx: Friend request accepted');
        setNotificationsCount(prev => Math.max(0, prev - 1));
      });

      signalRService.onFriendRequestRejected(() => {
        console.log('App.jsx: Friend request rejected');
        setNotificationsCount(prev => Math.max(0, prev - 1));
      });

      signalRService.onChallengeReceived((data) => {
        console.log('App.jsx: Challenge received', data);
        setNotificationsCount(prev => prev + 1);
      });

      signalRService.onChallengeAccepted((data) => {
        console.log('App.jsx: Challenge accepted', data);
        setNotificationsCount(prev => Math.max(0, prev - 1));
        // Navigate to game immediately
        if (data.gameId) {
          console.log('App.jsx: Navigating to game:', data.gameId);
          window.location.href = `/game/${data.gameId}`;
        }
      });

      signalRService.onChallengeCancelled(() => {
        console.log('App.jsx: Challenge cancelled');
        setNotificationsCount(prev => Math.max(0, prev - 1));
      });

      signalRService.onChallengeDeclined(() => {
        console.log('App.jsx: Challenge declined');
        setNotificationsCount(prev => Math.max(0, prev - 1));
      });

      signalRService.onError((message) => {
        console.error('SignalR Error:', message);
        alert(message);
      });
    } catch (error) {
      console.error('Failed to setup notification listeners:', error);
    }
  };



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
    
    // No auto-redirect - let user choose what to do
  };

  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('isAnonymous');
    setUser(null);
    // Redirect to login page
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        {t('common.loading')}
      </div>
    );
  }

  if (!user) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<Auth onAuthSuccess={handleAuthSuccess} />} />
          <Route path="*" element={<Auth onAuthSuccess={handleAuthSuccess} />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <div className="app">
        <NotificationsPanel
          userId={user.id}
          isOpen={notificationsOpen}
          onClose={() => setNotificationsOpen(false)}
        />
        
        <nav className="nav">
          <div className="nav-content">
            <Link to="/" className="nav-logo" onClick={() => setMobileMenuOpen(false)}>
              <GiChessKnight 
                size={32} 
                style={{ 
                  color: '#d4af37',
                  filter: 'drop-shadow(0 0 10px rgba(212, 175, 55, 0.6))'
                }} 
              />
              <span>Blunderz</span>
            </Link>

            {/* Burger button - visible only on mobile */}
            <button 
              className="burger-menu"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <span className={mobileMenuOpen ? 'active' : ''}></span>
              <span className={mobileMenuOpen ? 'active' : ''}></span>
              <span className={mobileMenuOpen ? 'active' : ''}></span>
            </button>

            {/* Desktop navigation */}
            <div className="nav-links nav-links-desktop">
              <Link to="/play" className="nav-link">{t('nav.play')}</Link>
              <Link to="/puzzles" className="nav-link">{t('nav.puzzles')}</Link>
              <Link to="/live" className="nav-link">{t('nav.liveGames')}</Link>
              <Link to="/history" className="nav-link">{t('nav.history')}</Link>
              <Link to="/coach" className="nav-link">{t('nav.coach')}</Link>
              <Link to="/profile" className="nav-link">{t('nav.profile')}</Link>
              <Link to="/leaderboard" className="nav-link">{t('nav.leaderboard')}</Link>
            </div>

            <div className="nav-user nav-user-desktop">
              <div className="nav-user-info">
                <span>{user.username}</span>
                <span className="nav-user-elo">({user.elo})</span>
              </div>
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="notification-btn"
                style={{
                  position: 'relative',
                  background: notificationsOpen ? 'rgba(212, 175, 55, 0.1)' : 'var(--color-surface)',
                  border: `2px solid ${notificationsOpen ? '#d4af37' : 'var(--color-border)'}`,
                  borderRadius: '8px',
                  padding: '6px 10px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '20px',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '48px',
                  height: '40px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(212, 175, 55, 0.1)';
                  e.currentTarget.style.borderColor = '#d4af37';
                }}
                onMouseLeave={(e) => {
                  if (!notificationsOpen) {
                    e.currentTarget.style.background = 'var(--color-surface)';
                    e.currentTarget.style.borderColor = 'var(--color-border)';
                  }
                }}
                title={t('nav.notifications')}
              >
                🔔
                {notificationsCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    background: '#ff5722',
                    color: '#fff',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 8px rgba(255, 87, 34, 0.6)',
                    border: '2px solid var(--color-background)'
                  }}>
                    {notificationsCount}
                  </span>
                )}
              </button>
              <LanguageSwitcher />
              <button 
                onClick={handleLogout}
                className="btn-outline"
                style={{ padding: '6px 16px', fontSize: '14px' }}
              >
                {t('nav.logout')}
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
            <div className="mobile-menu-header">
              <div className="nav-user-info">
                <span>{user.username}</span>
                <span className="nav-user-elo">({user.elo})</span>
              </div>
            </div>
            <div className="mobile-menu-links">
              <Link to="/play" className="mobile-menu-link" onClick={() => setMobileMenuOpen(false)}>
                ⚡ {t('nav.play')}
              </Link>
              <Link to="/puzzles" className="mobile-menu-link" onClick={() => setMobileMenuOpen(false)}>
                🧩 {t('nav.puzzles')}
              </Link>
              <Link to="/live" className="mobile-menu-link" onClick={() => setMobileMenuOpen(false)}>
                👁️ {t('nav.liveGames')}
              </Link>
              <Link to="/history" className="mobile-menu-link" onClick={() => setMobileMenuOpen(false)}>
                📜 {t('nav.history')}
              </Link>
              <Link to="/coach" className="mobile-menu-link" onClick={() => setMobileMenuOpen(false)}>
                🤖 {t('nav.coach')}
              </Link>
              <Link to="/profile" className="mobile-menu-link" onClick={() => setMobileMenuOpen(false)}>
                👤 {t('nav.profile')}
              </Link>
              <Link to="/leaderboard" className="mobile-menu-link" onClick={() => setMobileMenuOpen(false)}>
                🏆 {t('nav.leaderboard')}
              </Link>
            </div>
            <div className="mobile-menu-actions">
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'center' }}>
                <button
                  onClick={() => {
                    setNotificationsOpen(!notificationsOpen);
                    setMobileMenuOpen(false);
                  }}
                  style={{
                    position: 'relative',
                    background: 'var(--color-surface)',
                    border: '2px solid var(--color-border)',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '20px',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '48px',
                    height: '40px'
                  }}
                >
                  🔔
                  {notificationsCount > 0 && (
                    <span className="notification-badge" style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px'
                    }}>{notificationsCount}</span>
                  )}
                </button>
                <LanguageSwitcher />
              </div>
              <button 
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="mobile-menu-btn"
              >
                {t('nav.logout')}
              </button>
            </div>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/play" element={<PlayPage userId={user.id} />} />
          <Route path="/puzzles" element={<Puzzles userId={user.id} />} />
          <Route path="/live" element={<LiveGames />} />
          <Route path="/watch/:gameId" element={<WatchGamePage />} />
          <Route path="/game/:gameId" element={<GamePage userId={user.id} onUserUpdate={setUser} />} />
          <Route path="/game/:gameId/replay" element={<GameReplay />} />
          <Route path="/history" element={<GameHistory userId={user.id} />} />
          <Route path="/coach" element={<Coach userId={user.id} />} />
          <Route path="/profile" element={<Profile userId={user.id} />} />
          <Route path="/user/:userId" element={<UserProfile />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
        </Routes>
      </div>
    </Router>
  );
}

function Home() {
  const { t } = useLanguage();
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
          {t('home.title')}
        </h1>
        <p style={{ 
          color: 'var(--color-text-secondary)', 
          fontSize: '20px',
          marginBottom: '48px',
          maxWidth: '600px',
          margin: '0 auto 48px'
        }}>
          {t('home.subtitle')}
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
          {t('home.playNow')}
        </button>
        
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '16px' }}>
          <button
            onClick={() => navigate('/history')}
            className="btn-outline"
            style={{ padding: '12px 24px', fontSize: '16px' }}
          >
            📜 {t('home.gameHistory')}
          </button>
          <button
            onClick={() => navigate('/leaderboard')}
            className="btn-outline"
            style={{ padding: '12px 24px', fontSize: '16px' }}
          >
            🏆 {t('home.leaderboard')}
          </button>
        </div>
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
          }}>{t('home.fastMatchmaking')}</h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px' }}>
            {t('home.fastMatchmakingDesc')}
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
          }}>{t('home.ratingSystem')}</h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px' }}>
            {t('home.ratingSystemDesc')}
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
          }}>{t('home.leaderboards')}</h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px' }}>
            {t('home.leaderboardsDesc')}
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
  const { t } = useLanguage();
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
      console.log('Game loaded:', game);
      setGameData(game);
      
      // Start game if pending (status 0 = Pending, 1 = Active)
      if (game.status === 0) {
        console.log('Game is pending, starting...');
        try {
          await apiService.startGame(gameId);
          // Reload game to get updated status
          const updatedGame = await apiService.getGame(gameId);
          console.log('Game started, updated status:', updatedGame.status);
          setGameData(updatedGame);
        } catch (error) {
          console.warn('Failed to start game (might be already started):', error);
          // Game might be already started, continue anyway
        }
      } else {
        console.log('Game status:', game.status);
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
    return <div style={{ textAlign: 'center', padding: '50px' }}>{t('common.loadingGame')}</div>;
  }

  if (!gameData) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>{t('common.gameNotFound')}</div>;
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

function WatchGamePage() {
  const gameId = window.location.pathname.split('/').pop();
  
  return (
    <div>
      <SpectatorBoard gameId={gameId} />
    </div>
  );
}

export default App;
