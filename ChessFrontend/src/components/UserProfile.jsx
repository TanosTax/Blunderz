import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import apiService from '../services/apiService';
import signalRService from '../services/signalRService';
import ChallengeModal from './ChallengeModal';

export default function UserProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [friendship, setFriendship] = useState(null);
  const [friends, setFriends] = useState([]);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [pendingChallenge, setPendingChallenge] = useState(null);
  const currentUserId = parseInt(localStorage.getItem('userId'));

  useEffect(() => {
    loadUserProfile();
    setupSignalR();

    return () => {
      signalRService.leaveUserChannel(currentUserId);
    };
  }, [userId]);

  const setupSignalR = async () => {
    try {
      await signalRService.connect();
      console.log('UserProfile.jsx: SignalR connected');
      
      // Small delay to ensure connection is ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await signalRService.joinUserChannel(currentUserId);
      console.log('UserProfile.jsx: Joined user channel', currentUserId);

      // Setup event listeners with functional updates
      signalRService.onFriendRequestSent((data) => {
        console.log('UserProfile: Friend request sent event:', data);
        if (data.toUserId === parseInt(userId)) {
          setFriendship({ status: 'pending_sent', id: data.id });
        }
      });

      signalRService.onFriendRequestAccepted((data) => {
        console.log('UserProfile: Friend request accepted event:', data);
        if (data.friendId === parseInt(userId)) {
          setFriendship({ status: 'accepted', id: data.friendshipId });
        }
      });

      signalRService.onFriendRequestRejected((data) => {
        console.log('UserProfile: Friend request rejected event:', data);
        if (friendship?.id === data.friendshipId) {
          setFriendship(null);
        }
      });

      signalRService.onFriendRemoved((data) => {
        console.log('UserProfile: Friend removed event:', data);
        if (friendship?.id === data.friendshipId) {
          setFriendship(null);
        }
      });

      // Challenge events
      signalRService.onChallengeSent((data) => {
        console.log('UserProfile: Challenge sent:', data);
        if (data.challengedId === parseInt(userId)) {
          setPendingChallenge(data);
        }
      });

      signalRService.onChallengeAccepted((data) => {
        console.log('UserProfile: Challenge accepted, navigating to game:', data.gameId);
        // Navigate to game
        window.location.href = `/game/${data.gameId}`;
      });

      signalRService.onChallengeDeclined((data) => {
        console.log('UserProfile: Challenge declined:', data);
        setPendingChallenge(null);
        alert(t('challenge.declined'));
      });

      signalRService.onChallengeCancelled((data) => {
        console.log('UserProfile: Challenge cancelled:', data);
        setPendingChallenge(null);
      });
    } catch (error) {
      console.error('UserProfile: Failed to setup SignalR:', error);
    }
  };

  const loadUserProfile = async () => {
    try {
      const userData = await apiService.getUser(parseInt(userId));
      setUser(userData);

      // Check friendship status
      const friendsData = await apiService.getFriends(currentUserId);
      const existingFriend = friendsData.find(f => f.friend.id === parseInt(userId));
      if (existingFriend) {
        setFriendship({ status: 'accepted', id: existingFriend.friendshipId });
      } else {
        // Check pending requests
        const requests = await apiService.getFriendRequests(currentUserId);
        const outgoing = requests.outgoing.find(r => r.friend.id === parseInt(userId));
        const incoming = requests.incoming.find(r => r.user.id === parseInt(userId));
        
        if (outgoing) {
          setFriendship({ status: 'pending_sent', id: outgoing.id });
        } else if (incoming) {
          setFriendship({ status: 'pending_received', id: incoming.id });
        }
      }

      // Load user's friends
      const userFriends = await apiService.getFriends(parseInt(userId));
      setFriends(userFriends);
    } catch (error) {
      console.error('Failed to load user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendFriendRequest = async () => {
    try {
      await signalRService.sendFriendRequest(currentUserId, parseInt(userId));
      // Real-time update will be handled by SignalR event
    } catch (error) {
      console.error('Failed to send friend request:', error);
      alert(error.message);
    }
  };

  const handleAcceptRequest = async () => {
    try {
      await signalRService.acceptFriendRequest(friendship.id, currentUserId);
      // Real-time update will be handled by SignalR event
    } catch (error) {
      console.error('Failed to accept request:', error);
    }
  };

  const handleRejectRequest = async () => {
    try {
      await signalRService.rejectFriendRequest(friendship.id, currentUserId);
      // Real-time update will be handled by SignalR event
    } catch (error) {
      console.error('Failed to reject request:', error);
    }
  };

  const handleRemoveFriend = async () => {
    if (!confirm(t('profile.removeFriend') + '?')) return;
    
    try {
      await signalRService.removeFriend(friendship.id, currentUserId);
      // Real-time update will be handled by SignalR event
    } catch (error) {
      console.error('Failed to remove friend:', error);
    }
  };

  const handleSendChallenge = async (timeControl) => {
    try {
      await signalRService.sendChallenge(currentUserId, parseInt(userId), timeControl);
      setShowChallengeModal(false);
    } catch (error) {
      console.error('Failed to send challenge:', error);
      alert(error.message);
    }
  };

  const handleCancelChallenge = async () => {
    if (!pendingChallenge) return;
    
    try {
      await signalRService.cancelChallenge(pendingChallenge.id, currentUserId);
      setPendingChallenge(null);
    } catch (error) {
      console.error('Failed to cancel challenge:', error);
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
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <button
        onClick={() => navigate(-1)}
        className="btn-outline"
        style={{ marginBottom: '20px' }}
      >
        ← {t('common.back') || 'Back'}
      </button>

      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ color: '#d4af37', margin: '0 0 8px 0' }}>
              👤 {user.username}
            </h2>
            <div style={{ color: '#888', fontSize: '14px' }}>
              {t('profile.rating')}: {user.elo}
            </div>
          </div>

          {currentUserId !== parseInt(userId) && (
            <div style={{ display: 'flex', gap: '8px' }}>
              {!friendship && (
                <button
                  onClick={handleSendFriendRequest}
                  className="btn-primary"
                >
                  {t('profile.addFriend')}
                </button>
              )}
              {friendship?.status === 'pending_sent' && (
                <button className="btn-outline" disabled>
                  {t('profile.pendingRequest')}
                </button>
              )}
              {friendship?.status === 'pending_received' && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={handleAcceptRequest}
                    className="btn-primary"
                  >
                    {t('profile.acceptRequest')}
                  </button>
                  <button
                    onClick={handleRejectRequest}
                    className="btn-outline"
                  >
                    {t('profile.rejectRequest')}
                  </button>
                </div>
              )}
              {friendship?.status === 'accepted' && !pendingChallenge && (
                <>
                  <button
                    onClick={() => setShowChallengeModal(true)}
                    className="btn-primary"
                  >
                    ⚔️ {t('profile.challenge')}
                  </button>
                  <button
                    onClick={handleRemoveFriend}
                    className="btn-outline"
                    style={{ color: '#ff5722', borderColor: '#ff5722' }}
                  >
                    {t('profile.removeFriend')}
                  </button>
                </>
              )}
              {friendship?.status === 'accepted' && pendingChallenge && (
                <button
                  onClick={handleCancelChallenge}
                  className="btn-outline"
                  style={{ color: '#ff9800', borderColor: '#ff9800' }}
                >
                  ⏳ {t('profile.cancelChallenge')}
                </button>
              )}
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
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

      <div className="card">
        <h3 style={{ color: '#d4af37', marginBottom: '16px' }}>
          {t('profile.friends')} ({friends.length})
        </h3>
        {friends.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#888', padding: '20px' }}>
            {t('profile.noFriends')}
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {friends.map(({ friend }) => (
              <div
                key={friend.id}
                onClick={() => navigate(`/user/${friend.id}`)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#d4af37';
                  e.currentTarget.style.background = 'rgba(212, 175, 55, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-border)';
                  e.currentTarget.style.background = 'var(--color-surface)';
                }}
              >
                <div>
                  <div style={{ color: '#fff', fontWeight: '500' }}>{friend.username}</div>
                  <div style={{ color: '#888', fontSize: '14px' }}>
                    {t('profile.rating')}: {friend.elo} • {friend.gamesPlayed} {t('profile.games') || 'games'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showChallengeModal && (
        <ChallengeModal
          friendUsername={user.username}
          onSend={handleSendChallenge}
          onClose={() => setShowChallengeModal(false)}
        />
      )}
    </div>
  );
}
