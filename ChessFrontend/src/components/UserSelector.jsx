import { useState, useEffect } from 'react';
import apiService from '../services/apiService';

export default function UserSelector({ onUserSelected }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newUsername, setNewUsername] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const leaderboard = await apiService.getLeaderboard(100);
      setUsers(leaderboard);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectUser = (user) => {
    localStorage.setItem('selectedUserId', user.id);
    localStorage.setItem('selectedUserTelegramId', user.telegramId);
    onUserSelected(user);
  };

  const createNewUser = async () => {
    if (!newUsername.trim()) {
      alert('Enter username');
      return;
    }

    setCreating(true);
    try {
      const telegramId = Date.now(); // Unique ID
      const user = await apiService.createUser(telegramId, newUsername);
      selectUser(user);
    } catch (error) {
      console.error('Failed to create user:', error);
      alert('Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>;
  }

  return (
    <div style={{ maxWidth: '600px', margin: '50px auto', padding: '20px' }}>
      <h2>Select User (Dev Mode)</h2>
      
      <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h3>Create New User</h3>
        <input
          type="text"
          placeholder="Username"
          value={newUsername}
          onChange={(e) => setNewUsername(e.target.value)}
          style={{ padding: '10px', width: '200px', marginRight: '10px' }}
        />
        <button
          onClick={createNewUser}
          disabled={creating}
          style={{
            padding: '10px 20px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {creating ? 'Creating...' : 'Create'}
        </button>
      </div>

      <div>
        <h3>Or Select Existing User</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {users.map((user) => (
            <button
              key={user.id}
              onClick={() => selectUser(user)}
              style={{
                padding: '15px',
                textAlign: 'left',
                border: '1px solid #ccc',
                borderRadius: '4px',
                cursor: 'pointer',
                backgroundColor: 'white'
              }}
            >
              <div style={{ fontWeight: 'bold' }}>{user.username}</div>
              <div style={{ fontSize: '14px', color: '#666' }}>
                Elo: {user.elo} | Games: {user.gamesPlayed}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
