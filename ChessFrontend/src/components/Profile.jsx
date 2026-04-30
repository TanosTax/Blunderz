import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import apiService from '../services/apiService';
import signalRService from '../services/signalRService';
import '../styles/profile-coach-responsive.css';

export default function Profile({ userId }) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState({ incoming: [], outgoing: [] });

  useEffect(() => {
    loadUserData();

    const setupSignalR = async () => {
      try {
        await signalRService.connect();
        console.log('Profile.jsx: SignalR connected');
        
        // Small delay to ensure connection is ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        await signalRService.joinUserChannel(userId);
        console.log('Profile.jsx: Joined user channel', userId);

        // Setup event listeners with functional updates (like useChess.js)
        signalRService.onFriendRequestReceived((data) => {
          console.log('Profile.jsx: Friend request received:', data);
          setFriendRequests(prev => ({
            ...prev,
            incoming: [...prev.incoming, {
              id: data.id,
              from: {
                id: data.fromUserId,
                username: data.fromUsername,
                elo: data.fromElo || 1500
              },
              createdAt: data.createdAt
            }]
          }));
        });

        signalRService.onFriendRequestSent((data) => {
          console.log('Profile.jsx: Friend request sent:', data);
          setFriendRequests(prev => ({
            ...prev,
            outgoing: [...prev.outgoing, {
              id: data.id,
              to: {
                id: data.toUserId,
                username: data.toUsername,
                elo: data.toElo || 1500
              },
              createdAt: data.createdAt || new Date().toISOString()
            }]
          }));
        });

        signalRService.onFriendRequestAccepted((data) => {
          console.log('Profile.jsx: Friend request accepted event:', data);
          
          // Remove from requests
          setFriendRequests(prev => ({
            incoming: prev.incoming.filter(r => r.id !== data.friendshipId),
            outgoing: prev.outgoing.filter(r => r.id !== data.friendshipId)
          }));
          
          // Add to friends
          setFriends(prev => {
            if (prev.some(f => f.friendshipId === data.friendshipId)) {
              console.log('Profile.jsx: Friend already exists, skipping');
              return prev;
            }
            
            const newFriend = {
              friendshipId: data.friendshipId,
              friend: {
                id: data.friendId,
                username: data.friendUsername,
                elo: data.friendElo,
                gamesPlayed: 0
              }
            };
            console.log('Profile.jsx: Adding friend:', newFriend);
            return [...prev, newFriend];
          });
        });

        signalRService.onFriendRequestRejected((data) => {
          console.log('Profile.jsx: Friend request rejected:', data);
          setFriendRequests(prev => ({
            incoming: prev.incoming.filter(r => r.id !== data.friendshipId),
            outgoing: prev.outgoing.filter(r => r.id !== data.friendshipId)
          }));
        });

        signalRService.onFriendRemoved((data) => {
          console.log('Profile.jsx: Friend removed event received:', data);
          setFriends(prev => {
            const filtered = prev.filter(f => f.friendshipId !== data.friendshipId);
            console.log('Profile.jsx: Friends before removal:', prev.length);
            console.log('Profile.jsx: Friends after removal:', filtered.length);
            return filtered;
          });
        });
      } catch (error) {
        console.error('Failed to setup SignalR:', error);
      }
    };

    setupSignalR();

    return () => {
      signalRService.leaveUserChannel(userId);
    };
  }, [userId]);

  const loadUserData = async () => {
    try {
      const [userData, friendsData, requestsData] = await Promise.all([
        apiService.getUser(userId),
        apiService.getFriends(userId),
        apiService.getFriendRequests(userId)
      ]);

      setUser(userData);
      setFriends(friendsData);
      setFriendRequests(requestsData);
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (friendshipId) => {
    try {
      await signalRService.acceptFriendRequest(friendshipId, userId);
      // Real-time update will be handled by SignalR event
    } catch (error) {
      console.error('Failed to accept request:', error);
    }
  };

  const handleRejectRequest = async (friendshipId) => {
    try {
      await signalRService.rejectFriendRequest(friendshipId, userId);
      // Real-time update will be handled by SignalR event
    } catch (error) {
      console.error('Failed to reject request:', error);
    }
  };

  const handleRemoveFriend = async (friendshipId) => {
    if (!confirm(t('profile.removeFriend') + '?')) return;
    
    try {
      await signalRService.removeFriend(friendshipId, userId);
      // Real-time update will be handled by SignalR event
    } catch (error) {
      console.error('Failed to remove friend:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', color: '#888' }}>
        {t('common.loading')}
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', color: '#888' }}>
        User not found
      </div>
    );
  }

  const winRate = user.gamesPlayed > 0 
    ? ((user.wins / user.gamesPlayed) * 100).toFixed(1) 
    : 0;

  return (
    <div className="profile-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      {/* User Stats */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <h2 style={{ color: '#d4af37', margin: '0 0 20px 0' }}>
          👤 {user.username}
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
          <div className="stat-card">
            <div className="stat-label">{t('profile.bulletRating')}</div>
            <div className="stat-value" style={{ color: '#d4af37' }}>{user.bulletRating}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">{t('profile.blitzRating')}</div>
            <div className="stat-value" style={{ color: '#d4af37' }}>{user.blitzRating}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">{t('profile.rapidRating')}</div>
            <div className="stat-value" style={{ color: '#d4af37' }}>{user.rapidRating}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">{t('profile.classicalRating')}</div>
            <div className="stat-value" style={{ color: '#d4af37' }}>{user.classicalRating}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">{t('profile.puzzleRating')}</div>
            <div className="stat-value" style={{ color: '#d4af37' }}>{user.puzzleRating}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">{t('profile.gamesPlayed')}</div>
            <div className="stat-value">{user.gamesPlayed}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">{t('profile.wins')}</div>
            <div className="stat-value" style={{ color: '#4CAF50' }}>{user.wins}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">{t('profile.losses')}</div>
            <div className="stat-value" style={{ color: '#f44336' }}>{user.losses}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">{t('profile.draws')}</div>
            <div className="stat-value" style={{ color: '#FFC107' }}>{user.draws}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">{t('profile.winRate')}</div>
            <div className="stat-value">{winRate}%</div>
          </div>
        </div>
      </div>

      <div className="profile-friends-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Friends */}
        <div className="card">
          <h3 style={{ color: '#d4af37', marginBottom: '16px' }}>
            {t('profile.friends')} ({friends.length})
          </h3>
          {friends.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#888', padding: '20px' }}>
              {t('profile.noFriends')}
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px', maxHeight: '400px', overflowY: 'auto' }}>
              {friends.map(({ friendshipId, friend }) => (
                <div
                  key={friendshipId}
                  className="friend-card"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px'
                  }}
                >
                  <div
                    onClick={() => navigate(`/user/${friend.id}`)}
                    style={{ cursor: 'pointer', flex: 1 }}
                  >
                    <div style={{ color: '#fff', fontWeight: '500' }}>{friend.username}</div>
                    <div style={{ color: '#888', fontSize: '14px' }}>
                      {t('profile.ratings')}: {friend.elo}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveFriend(friendshipId)}
                    className="btn-outline"
                    style={{ 
                      padding: '4px 12px', 
                      fontSize: '12px',
                      color: '#ff5722',
                      borderColor: '#ff5722'
                    }}
                  >
                    {t('profile.removeFriend')}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Friend Requests */}
        <div className="card">
          <h3 style={{ color: '#d4af37', marginBottom: '16px' }}>
            {t('profile.friendRequests') || 'Friend Requests'} ({friendRequests.incoming.length})
          </h3>
          {friendRequests.incoming.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#888', padding: '20px' }}>
              {t('profile.noRequests') || 'No pending requests'}
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px', maxHeight: '400px', overflowY: 'auto' }}>
              {friendRequests.incoming.map((request) => (
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
                    onClick={() => navigate(`/user/${request.from.id}`)}
                    style={{ cursor: 'pointer', marginBottom: '8px' }}
                  >
                    <div style={{ color: '#fff', fontWeight: '500' }}>{request.from.username}</div>
                    <div style={{ color: '#888', fontSize: '14px' }}>
                      {t('profile.ratings')}: {request.from.elo}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleAcceptRequest(request.id)}
                      className="btn-primary"
                      style={{ flex: 1, padding: '6px', fontSize: '14px' }}
                    >
                      {t('profile.acceptRequest')}
                    </button>
                    <button
                      onClick={() => handleRejectRequest(request.id)}
                      className="btn-outline"
                      style={{ flex: 1, padding: '6px', fontSize: '14px' }}
                    >
                      {t('profile.rejectRequest')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {friendRequests.outgoing.length > 0 && (
            <>
              <h4 style={{ color: '#888', marginTop: '20px', marginBottom: '12px', fontSize: '14px' }}>
                {t('profile.sentRequests') || 'Sent Requests'} ({friendRequests.outgoing.length})
              </h4>
              <div style={{ display: 'grid', gap: '8px' }}>
                {friendRequests.outgoing.map((request) => (
                  <div
                    key={request.id}
                    onClick={() => navigate(`/user/${request.to.id}`)}
                    style={{
                      padding: '10px',
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ color: '#fff', fontSize: '14px' }}>{request.to.username}</div>
                      <div style={{ color: '#888', fontSize: '12px' }}>
                        {t('profile.ratings')}: {request.to.elo}
                      </div>
                    </div>
                    <span style={{ color: '#FFC107', fontSize: '12px' }}>
                      {t('profile.pendingRequest')}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
