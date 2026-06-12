import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import apiService from '../services/apiService';
import signalRService from '../services/signalRService';

export default function NotificationsPanel({ userId, isOpen, onClose }) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [friendRequests, setFriendRequests] = useState([]);
  const [incomingChallenges, setIncomingChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, userId]);

  // Setup SignalR once on mount (like useChess.js)
  useEffect(() => {
    const setupSignalR = async () => {
      try {
        await signalRService.connect();
        console.log('NotificationsPanel: SignalR connected');
        
        // Small delay to ensure connection is ready
        await new Promise(resolve => setTimeout(resolve, 100));

        // Setup event listeners with functional updates
        signalRService.onFriendRequestReceived((data) => {
          console.log('NotificationsPanel: Friend request received:', data);
          setFriendRequests(prev => [...prev, {
            id: data.id,
            from: {
              id: data.fromUserId,
              username: data.fromUsername,
              elo: data.fromElo || 1500
            },
            createdAt: data.createdAt
          }]);
        });

        signalRService.onFriendRequestRejected((data) => {
          console.log('NotificationsPanel: Friend request rejected:', data);
          setFriendRequests(prev => prev.filter(r => r.id !== data.friendshipId));
        });

        signalRService.onChallengeReceived((data) => {
          console.log('NotificationsPanel: Challenge received:', data);
          setIncomingChallenges(prev => [...prev, data]);
        });

        signalRService.onChallengeCancelled((data) => {
          console.log('NotificationsPanel: Challenge cancelled:', data);
          setIncomingChallenges(prev => prev.filter(c => c.id !== data.challengeId));
        });

        signalRService.onChallengeDeclined((data) => {
          console.log('NotificationsPanel: Challenge declined:', data);
          setIncomingChallenges(prev => prev.filter(c => c.id !== data.challengeId));
        });

        signalRService.onChallengeAccepted((data) => {
          console.log('NotificationsPanel: Challenge accepted:', data);
          setIncomingChallenges(prev => prev.filter(c => c.id !== data.challengeId));
          
          // Navigate to game
          if (data.gameId) {
            console.log('NotificationsPanel: Navigating to game from panel:', data.gameId);
            window.location.href = `/game/${data.gameId}`;
          }
        });
      } catch (error) {
        console.error('NotificationsPanel: Failed to setup SignalR:', error);
      }
    };

    setupSignalR();
  }, []);

  // Update timer every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      
      // Load friend requests
      const requestsData = await apiService.getFriendRequests(userId);
      setFriendRequests(requestsData.incoming || []);

      // Load pending challenges (only incoming)
      const challengesData = await apiService.getPendingChallenges(userId);
      setIncomingChallenges(challengesData.incoming || []);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptFriendRequest = async (friendshipId) => {
    try {
      await signalRService.acceptFriendRequest(friendshipId, userId);
      // SignalR event will update state automatically
    } catch (error) {
      console.error('Failed to accept friend request:', error);
    }
  };

  const handleRejectFriendRequest = async (friendshipId) => {
    try {
      await signalRService.rejectFriendRequest(friendshipId, userId);
      // SignalR event will update state automatically
    } catch (error) {
      console.error('Failed to reject friend request:', error);
    }
  };

  const handleAcceptChallenge = async (challengeId) => {
    try {
      console.log('NotificationsPanel: Accepting challenge:', challengeId, 'userId:', userId);
      await signalRService.acceptChallenge(challengeId, userId);
      console.log('NotificationsPanel: Challenge accepted successfully, waiting for SignalR event...');
      // SignalR event will navigate to game (handled in App.jsx)
      onClose();
    } catch (error) {
      console.error('NotificationsPanel: Failed to accept challenge:', error);
      alert(`Failed to accept challenge: ${error.message}`);
    }
  };

  const handleDeclineChallenge = async (challengeId) => {
    try {
      await signalRService.declineChallenge(challengeId, userId);
      // SignalR event will update state automatically
    } catch (error) {
      console.error('Failed to decline challenge:', error);
    }
  };

  const formatTimeRemaining = (expiresAt) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = Math.max(0, Math.floor((expires - now) / 1000));
    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  const totalNotifications = friendRequests.length + incomingChallenges.length;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 999
        }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed',
        top: '70px',
        right: '20px',
        width: '400px',
        maxHeight: '80vh',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        border: '2px solid #d4af37',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.8)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideIn 0.3s ease-out'
      }}>
        <style>{`
          @keyframes slideIn {
            from {
              transform: translateX(400px);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}</style>

        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ color: '#d4af37', margin: 0, fontSize: '18px' }}>
            🔔 {t('notifications.title')} ({totalNotifications})
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#888',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '0',
              lineHeight: '1'
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px'
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: '#888', padding: '20px' }}>
              {t('common.loading')}
            </div>
          ) : totalNotifications === 0 ? (
            <div style={{ textAlign: 'center', color: '#888', padding: '40px 20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>✓</div>
              <div>{t('notifications.noNotifications')}</div>
            </div>
          ) : (
            <>
              {/* Friend Requests */}
              {friendRequests.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ color: '#888', fontSize: '14px', marginBottom: '12px' }}>
                    {t('notifications.friendRequests')} ({friendRequests.length})
                  </h4>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {friendRequests.map((request) => (
                      <div
                        key={request.id}
                        style={{
                          padding: '12px',
                          background: 'var(--color-surface)',
                          border: '1px solid var(--color-border)',
                          borderRadius: '8px'
                        }}
                      >
                        <div
                          onClick={() => {
                            navigate(`/user/${request.from.id}`);
                            onClose();
                          }}
                          style={{ cursor: 'pointer', marginBottom: '8px' }}
                        >
                          <div style={{ color: '#fff', fontWeight: '500' }}>
                            👤 {request.from.username}
                          </div>
                          <div style={{ color: '#888', fontSize: '12px' }}>
                            {t('profile.ratings')}: {request.from.elo}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleAcceptFriendRequest(request.id)}
                            className="btn-primary"
                            style={{ flex: 1, padding: '6px', fontSize: '12px' }}
                          >
                            ✓ {t('profile.acceptRequest')}
                          </button>
                          <button
                            onClick={() => handleRejectFriendRequest(request.id)}
                            className="btn-outline"
                            style={{ flex: 1, padding: '6px', fontSize: '12px' }}
                          >
                            ✗ {t('profile.rejectRequest')}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Incoming Challenges */}
              {incomingChallenges.length > 0 && (
                <div>
                  <h4 style={{ color: '#888', fontSize: '14px', marginBottom: '12px' }}>
                    {t('notifications.challenges')} ({incomingChallenges.length})
                  </h4>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {incomingChallenges.map((challenge) => (
                      <div
                        key={challenge.id}
                        style={{
                          padding: '12px',
                          background: 'var(--color-surface)',
                          border: '1px solid var(--color-border)',
                          borderRadius: '8px'
                        }}
                      >
                        <div style={{ marginBottom: '8px' }}>
                          <div style={{ color: '#fff', fontWeight: '500' }}>
                            ⚔️ {challenge.challengerUsername}
                          </div>
                          <div style={{ color: '#888', fontSize: '12px' }}>
                            {t('matchmaking.timeControl')}: {challenge.timeControl}
                          </div>
                          <div style={{ color: '#ff9800', fontSize: '12px' }}>
                            ⏱️ {formatTimeRemaining(challenge.expiresAt)}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleAcceptChallenge(challenge.id)}
                            className="btn-primary"
                            style={{ flex: 1, padding: '6px', fontSize: '12px' }}
                          >
                            ✓ {t('challenge.accept')}
                          </button>
                          <button
                            onClick={() => handleDeclineChallenge(challenge.id)}
                            className="btn-outline"
                            style={{ flex: 1, padding: '6px', fontSize: '12px' }}
                          >
                            ✗ {t('challenge.decline')}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
