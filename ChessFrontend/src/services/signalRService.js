import * as signalR from '@microsoft/signalr';

class SignalRService {
  constructor() {
    this.connection = null;
    this.gameId = null;
  }

  async connect(backendUrl = 'http://localhost:5049') {
    if (this.connection && this.connection.state === 'Connected') {
      console.log('Already connected');
      return;
    }

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(`${backendUrl}/hubs/chess`)
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

  async makeMove(gameId, san, whiteTimeLeft, blackTimeLeft) {
    if (!this.connection) {
      console.error('SignalR: No connection object');
      throw new Error('Not connected');
    }

    if (this.connection.state !== 'Connected') {
      console.error('SignalR: Connection state is', this.connection.state);
      throw new Error(`SignalR not connected. State: ${this.connection.state}`);
    }

    console.log('SignalR makeMove:', { gameId, san, whiteTimeLeft, blackTimeLeft });
    
    try {
      await this.connection.invoke('MakeMove', gameId, san, whiteTimeLeft, blackTimeLeft);
      console.log('SignalR makeMove sent successfully');
    } catch (error) {
      console.error('SignalR makeMove error:', error);
      throw error;
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
