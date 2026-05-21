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

  async getLeaderboard(limit = 100, category = 'rapid') {
    const response = await fetch(`${API_URL}/users/leaderboard?limit=${limit}&category=${category}`);
    
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

  async getGameChat(gameId) {
    const response = await fetch(`${API_URL}/games/${gameId}/chat`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch chat messages');
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

  async getUserGameHistory(userId, result = null, page = 1, pageSize = 20) {
    let url = `${API_URL}/games/user/${userId}/history?page=${page}&pageSize=${pageSize}`;
    if (result) {
      url += `&result=${result}`;
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Failed to fetch game history');
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

  async analyzeGame(gameId) {
    const response = await fetch(`${API_URL}/analysis/game/${gameId}`, {
      method: 'POST'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Analysis error:', errorData);
      throw new Error(errorData.message || `Failed to analyze game: ${response.status}`);
    }

    return response.json();
  }

  // Friends API
  async getFriends(userId) {
    const response = await fetch(`${API_URL}/friends/${userId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch friends');
    }

    return response.json();
  }

  async getFriendRequests(userId) {
    const response = await fetch(`${API_URL}/friends/${userId}/requests`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch friend requests');
    }

    return response.json();
  }

  // Challenges API
  async getPendingChallenges(userId) {
    const response = await fetch(`${API_URL}/challenges/pending/${userId}`);
    
    if (!response.ok) {
      // If endpoint doesn't exist yet, return empty array
      return [];
    }

    return response.json();
  }

  async sendFriendRequest(requesterId, addresseeId) {
    const response = await fetch(`${API_URL}/friends/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requesterId, addresseeId })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to send friend request');
    }

    return response.json();
  }

  async acceptFriendRequest(friendshipId) {
    const response = await fetch(`${API_URL}/friends/accept/${friendshipId}`, {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error('Failed to accept friend request');
    }

    return response.json();
  }

  async rejectFriendRequest(friendshipId) {
    const response = await fetch(`${API_URL}/friends/reject/${friendshipId}`, {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error('Failed to reject friend request');
    }

    return response.json();
  }

  async removeFriend(friendshipId) {
    const response = await fetch(`${API_URL}/friends/${friendshipId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error('Failed to remove friend');
    }

    return response.json();
  }

  // AI Coach
  async getAIAnalysis(gameId, language = 'en') {
    const response = await fetch(`${API_URL}/aicoach/analyze/${gameId}?language=${language}`, {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error('Failed to get AI analysis');
    }

    return response.json();
  }

  async chatWithAI(message, gameId = null, language = 'en') {
    const response = await fetch(`${API_URL}/aicoach/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, gameId, language })
    });

    if (!response.ok) {
      throw new Error('Failed to chat with AI');
    }

    return response.json();
  }

  // Puzzles API
  async getRandomPuzzle(userId, rating = null) {
    let url = `${API_URL}/puzzles/random?userId=${userId}`;
    if (rating) {
      url += `&rating=${rating}`;
    }
    
    console.log('Fetching puzzle from:', url);
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Puzzle fetch failed:', response.status, errorText);
      throw new Error(`Failed to fetch puzzle: ${response.status}`);
    }

    const data = await response.json();
    console.log('Puzzle data received:', data);
    return data;
  }

  async checkPuzzleSolution(userId, puzzleId, move) {
    const response = await fetch(`${API_URL}/puzzles/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, puzzleId, move })
    });

    if (!response.ok) {
      throw new Error('Failed to check solution');
    }

    return response.json();
  }

  async getPuzzleStats(userId) {
    const response = await fetch(`${API_URL}/puzzles/stats/${userId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch puzzle stats');
    }

    return response.json();
  }

  async getPuzzlesByTheme(theme, count = 10) {
    const response = await fetch(`${API_URL}/puzzles/theme/${theme}?count=${count}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch puzzles by theme');
    }

    return response.json();
  }

  // Live Games API
  async getActiveGames(limit = 20) {
    const response = await fetch(`${API_URL}/games/active?limit=${limit}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch active games');
    }

    return response.json();
  }

  // Tournaments API
  async createTournament(payload) {
    const response = await fetch(`${API_URL}/tournaments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to create tournament');
    }

    return response.json();
  }

  async getTournament(tournamentId) {
    const response = await fetch(`${API_URL}/tournaments/${tournamentId}`);
    if (!response.ok) throw new Error('Tournament not found');
    return response.json();
  }

  async getTournamentByRoom(roomName) {
    const response = await fetch(`${API_URL}/tournaments/by-room/${encodeURIComponent(roomName)}`);
    if (!response.ok) throw new Error('Tournament not found');
    return response.json();
  }

  async joinTournament(tournamentId, userId, password = null) {
    const response = await fetch(`${API_URL}/tournaments/${tournamentId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, password })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to join tournament');
    }

    return response.json();
  }

  async leaveTournament(tournamentId, userId) {
    const response = await fetch(`${API_URL}/tournaments/${tournamentId}/leave`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to leave tournament');
    }

    return response.json();
  }

  async updateTournamentSeeds(tournamentId, creatorUserId, seeds) {
    const response = await fetch(`${API_URL}/tournaments/${tournamentId}/seeds`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creatorUserId, seeds })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to update seeds');
    }

    return response.json();
  }

  async startTournament(tournamentId, creatorUserId) {
    const response = await fetch(`${API_URL}/tournaments/${tournamentId}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creatorUserId })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to start tournament');
    }

    return response.json();
  }

  async getActiveTournaments() {
    const response = await fetch(`${API_URL}/tournaments/active`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch active tournaments');
    }

    return response.json();
  }

  async getCompletedTournaments(limit = 50) {
    const response = await fetch(`${API_URL}/tournaments/completed?limit=${limit}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch completed tournaments');
    }

    return response.json();
  }

  async getTournamentGames(tournamentId) {
    const response = await fetch(`${API_URL}/tournaments/${tournamentId}/games`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch tournament games');
    }

    return response.json();
  }
}

export default new ApiService();

