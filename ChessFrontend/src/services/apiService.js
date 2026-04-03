const API_URL = 'http://localhost:5049/api';

class ApiService {
  async createUser(telegramId, username) {
    const response = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telegramId, username })
    });

    if (!response.ok) {
      if (response.status === 409) {
        // User already exists, get by telegram ID
        return this.getUserByTelegramId(telegramId);
      }
      throw new Error('Failed to create user');
    }

    return response.json();
  }

  async getUserByTelegramId(telegramId) {
    const response = await fetch(`${API_URL}/users/telegram/${telegramId}`);
    
    if (!response.ok) {
      throw new Error('User not found');
    }

    return response.json();
  }

  async getUser(userId) {
    const response = await fetch(`${API_URL}/users/${userId}`);
    
    if (!response.ok) {
      throw new Error('User not found');
    }

    return response.json();
  }

  async getLeaderboard(limit = 100) {
    const response = await fetch(`${API_URL}/users/leaderboard?limit=${limit}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch leaderboard');
    }

    return response.json();
  }

  async createGame(whitePlayerId, blackPlayerId, timeControl = '10+0') {
    const response = await fetch(`${API_URL}/games`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ whitePlayerId, blackPlayerId, timeControl })
    });

    if (!response.ok) {
      throw new Error('Failed to create game');
    }

    return response.json();
  }

  async getGame(gameId) {
    const response = await fetch(`${API_URL}/games/${gameId}`);
    
    if (!response.ok) {
      throw new Error('Game not found');
    }

    return response.json();
  }

  async getUserGames(userId) {
    const response = await fetch(`${API_URL}/games/user/${userId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch games');
    }

    return response.json();
  }

  async startGame(gameId) {
    const response = await fetch(`${API_URL}/games/${gameId}/start`, {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error('Failed to start game');
    }

    return response.json();
  }

  async endGame(gameId, result, winnerId = null) {
    const response = await fetch(`${API_URL}/games/${gameId}/end`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ result, winnerId })
    });

    if (!response.ok) {
      throw new Error('Failed to end game');
    }

    return response.json();
  }

  async joinMatchmaking(userId, timeControl = '10+0', eloRange = 200) {
    const response = await fetch(`${API_URL}/matchmaking/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, timeControl, eloRange })
    });

    if (!response.ok) {
      throw new Error('Failed to join matchmaking');
    }

    return response.json();
  }

  async leaveMatchmaking(userId) {
    const response = await fetch(`${API_URL}/matchmaking/leave/${userId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error('Failed to leave matchmaking');
    }

    return response.json();
  }

  async register(username, password, email = null) {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, email })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }

    return response.json();
  }

  async login(username, password) {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    return response.json();
  }

  async createGuest() {
    const response = await fetch(`${API_URL}/auth/guest`, {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error('Failed to create guest account');
    }

    return response.json();
  }
}

export default new ApiService();
