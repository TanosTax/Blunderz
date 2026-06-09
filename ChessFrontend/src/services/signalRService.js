import * as signalR from '@microsoft/signalr';

class SignalRService {
  constructor() {
    this.connection = null;
    this.gameId = null;
    this.joinedUserChannels = new Set(); // Track joined user channels
  }

  async connect(backendUrl = import.meta.env.VITE_SIGNALR_URL || 'http://localhost:5049') {
    if (this.connection && this.connection.state === 'Connected') {
      console.log('Already connected');
      return;
    }

    this.connection = new signalR.HubConnectionBuilder()
        .withUrl(backendUrl)  // ← ИСПРАВЛЕНО (было `${backendUrl}/hubs/chess`)
        .withAutomaticReconnect()
        .configureLogging(signalR.LogLevel.Information)
        .build();

    try {
      await this.connection.start();
      console.log('SignalR Connected');
    } catch (err) {
      console.error('SignalR Connection Error: ', err);
      throw err;
    }
  }

  async joinGame(gameId) {
    if (!this.connection || this.connection.state !== 'Connected') {
      throw new Error('Not connected to SignalR');
    }

    this.gameId = gameId;
    await this.connection.invoke('JoinGame', gameId);
    console.log(`Joined game: ${gameId}`);
  }

  async leaveGame() {
    if (!this.connection || !this.gameId) {
      return;
    }

    await this.connection.invoke('LeaveGame', this.gameId);
    this.gameId = null;
  }

  async claimVictory(gameId, winnerId) {
    if (!this.connection || this.connection.state !== 'Connected') {
      throw new Error('Not connected to SignalR');
    }

    await this.connection.invoke('ClaimVictory', gameId, winnerId);
  }

  async offerDrawAfterDisconnect(gameId) {
    if (!this.connection || this.connection.state !== 'Connected') {
      throw new Error('Not connected to SignalR');
    }

    await this.connection.invoke('OfferDrawAfterDisconnect', gameId);
  }

  async offerDraw(gameId, playerId) {
    if (!this.connection || this.connection.state !== 'Connected') {
      throw new Error('Not connected to SignalR');
    }

    await this.connection.invoke('OfferDraw', gameId, playerId);
  }

  async acceptDraw(gameId) {
    if (!this.connection || this.connection.state !== 'Connected') {
      throw new Error('Not connected to SignalR');
    }

    await this.connection.invoke('AcceptDraw', gameId);
  }

  async declineDraw(gameId) {
    if (!this.connection || this.connection.state !== 'Connected') {
      throw new Error('Not connected to SignalR');
    }

    await this.connection.invoke('DeclineDraw', gameId);
  }

  async resign(gameId, playerId) {
    if (!this.connection || this.connection.state !== 'Connected') {
      throw new Error('Not connected to SignalR');
    }

    await this.connection.invoke('ResignGame', gameId, playerId);
  }

  async sendChatMessage(gameId, playerId, message) {
    if (!this.connection || this.connection.state !== 'Connected') {
      throw new Error('Not connected to SignalR');
    }

    await this.connection.invoke('SendChatMessage', gameId, playerId, message);
  }

  async activateBerserk(gameId, playerId) {
    if (!this.connection || this.connection.state !== 'Connected') {
      throw new Error('Not connected to SignalR');
    }

    await this.connection.invoke('ActivateBerserk', gameId, playerId);
  }

  async makeMove(gameId, san, fen, whiteTimeLeft, blackTimeLeft) {
    if (!this.connection) {
      console.error('SignalR: No connection object');
      throw new Error('Not connected');
    }

    if (this.connection.state !== 'Connected') {
      console.error('SignalR: Connection state is', this.connection.state);
      throw new Error(`SignalR not connected. State: ${this.connection.state}`);
    }

    console.log('SignalR makeMove:', { gameId, san, fen, whiteTimeLeft, blackTimeLeft });
    
    try {
      await this.connection.invoke('MakeMove', gameId, san, fen, whiteTimeLeft, blackTimeLeft);
      console.log('SignalR makeMove sent successfully');
    } catch (error) {
      console.error('SignalR makeMove error:', error);
      throw error;
    }
  }

  async sendHeartbeat(gameId, playerId) {
    if (!this.connection || this.connection.state !== 'Connected') {
      return;
    }

    try {
      await this.connection.invoke('Heartbeat', gameId, playerId);
    } catch (error) {
      console.error('Heartbeat error:', error);
    }
  }

  onMoveMade(callback) {
    if (!this.connection) {
      return;
    }

    this.connection.on('MoveMade', callback);
  }

  onError(callback) {
    if (!this.connection) {
      return;
    }

    this.connection.on('Error', callback);
  }

  onPlayerConnected(callback) {
    if (!this.connection) {
      return;
    }

    this.connection.on('PlayerConnected', callback);
  }

  onPlayerDisconnected(callback) {
    if (!this.connection) {
      return;
    }

    this.connection.on('PlayerDisconnected', callback);
  }

  onOpponentDisconnectedTimeout(callback) {
    if (!this.connection) {
      return;
    }

    this.connection.on('OpponentDisconnectedTimeout', callback);
  }

  onDrawOffered(callback) {
    if (!this.connection) {
      return;
    }

    this.connection.on('DrawOffered', callback);
  }

  onDrawDeclined(callback) {
    if (!this.connection) {
      return;
    }

    this.connection.on('DrawDeclined', callback);
  }

  onGameEnded(callback) {
    if (!this.connection) {
      return;
    }

    this.connection.on('GameEnded', callback);
  }

  onChatMessageReceived(callback) {
    if (!this.connection) {
      return;
    }

    this.connection.on('ChatMessageReceived', callback);
  }

  onBerserkActivated(callback) {
    if (!this.connection) {
      return;
    }

    this.connection.on('BerserkActivated', callback);
  }

  // Friend system methods
  async joinUserChannel(userId) {
    if (!this.connection || this.connection.state !== 'Connected') {
      throw new Error('Not connected to SignalR');
    }

    // Check if already joined
    if (this.joinedUserChannels.has(userId)) {
      console.log(`Already joined user channel: ${userId}`);
      return;
    }

    await this.connection.invoke('JoinUserChannel', userId);
    this.joinedUserChannels.add(userId);
    console.log(`Joined user channel: ${userId}`);
  }

  async leaveUserChannel(userId) {
    if (!this.connection || this.connection.state !== 'Connected') {
      return;
    }

    await this.connection.invoke('LeaveUserChannel', userId);
    this.joinedUserChannels.delete(userId);
  }

  async sendFriendRequest(fromUserId, toUserId) {
    if (!this.connection || this.connection.state !== 'Connected') {
      throw new Error('Not connected to SignalR');
    }

    await this.connection.invoke('SendFriendRequest', fromUserId, toUserId);
  }

  async acceptFriendRequest(friendshipId, userId) {
    if (!this.connection || this.connection.state !== 'Connected') {
      throw new Error('Not connected to SignalR');
    }

    await this.connection.invoke('AcceptFriendRequest', friendshipId, userId);
  }

  async rejectFriendRequest(friendshipId, userId) {
    if (!this.connection || this.connection.state !== 'Connected') {
      throw new Error('Not connected to SignalR');
    }

    await this.connection.invoke('RejectFriendRequest', friendshipId, userId);
  }

  async removeFriend(friendshipId, userId) {
    if (!this.connection || this.connection.state !== 'Connected') {
      throw new Error('Not connected to SignalR');
    }

    await this.connection.invoke('RemoveFriend', friendshipId, userId);
  }

  // Friend event listeners
  onFriendRequestReceived(callback) {
    if (!this.connection) {
      return;
    }

    this.connection.on('FriendRequestReceived', callback);
  }

  onFriendRequestSent(callback) {
    if (!this.connection) {
      return;
    }

    this.connection.on('FriendRequestSent', callback);
  }

  onFriendRequestAccepted(callback) {
    if (!this.connection) {
      return;
    }

    this.connection.on('FriendRequestAccepted', callback);
  }

  onFriendRequestRejected(callback) {
    if (!this.connection) {
      return;
    }

    this.connection.on('FriendRequestRejected', callback);
  }

  onFriendRemoved(callback) {
    if (!this.connection) {
      return;
    }

    this.connection.on('FriendRemoved', callback);
  }

  // Challenge system methods
  async sendChallenge(challengerId, challengedId, timeControl) {
    if (!this.connection || this.connection.state !== 'Connected') {
      throw new Error('Not connected to SignalR');
    }

    await this.connection.invoke('SendChallenge', challengerId, challengedId, timeControl);
  }

  async acceptChallenge(challengeId, userId) {
    if (!this.connection || this.connection.state !== 'Connected') {
      throw new Error('Not connected to SignalR');
    }

    await this.connection.invoke('AcceptChallenge', challengeId, userId);
  }

  async declineChallenge(challengeId, userId) {
    if (!this.connection || this.connection.state !== 'Connected') {
      throw new Error('Not connected to SignalR');
    }

    await this.connection.invoke('DeclineChallenge', challengeId, userId);
  }

  async cancelChallenge(challengeId, userId) {
    if (!this.connection || this.connection.state !== 'Connected') {
      throw new Error('Not connected to SignalR');
    }

    await this.connection.invoke('CancelChallenge', challengeId, userId);
  }

  // Challenge event listeners
  onChallengeReceived(callback) {
    if (!this.connection) {
      return;
    }

    this.connection.on('ChallengeReceived', callback);
  }

  onChallengeSent(callback) {
    if (!this.connection) {
      return;
    }

    this.connection.on('ChallengeSent', callback);
  }

  onChallengeAccepted(callback) {
    if (!this.connection) {
      return;
    }

    this.connection.on('ChallengeAccepted', callback);
  }

  onChallengeDeclined(callback) {
    if (!this.connection) {
      return;
    }

    this.connection.on('ChallengeDeclined', callback);
  }

  onChallengeCancelled(callback) {
    if (!this.connection) {
      return;
    }

    this.connection.on('ChallengeCancelled', callback);
  }

  async leaveGameAsSpectator(gameId) {
    if (!this.connection || this.connection.state !== 'Connected') {
      return;
    }

    await this.connection.invoke('LeaveGameAsSpectator', gameId);
  }

  async joinGameAsSpectator(gameId) {
    if (!this.connection || this.connection.state !== 'Connected') {
      throw new Error('Not connected to SignalR');
    }

    await this.connection.invoke('JoinGameAsSpectator', gameId);
    console.log(`Joined game ${gameId} as spectator`);
  }

  async disconnect() {
    if (this.connection) {
      await this.leaveGame();
      await this.connection.stop();
      this.connection = null;
      console.log('SignalR Disconnected');
    }
  }
}

export default new SignalRService();
