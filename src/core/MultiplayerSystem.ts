// src/core/MultiplayerSystem.ts

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
export type PlayerType = 'human' | 'ai_ollama' | 'ai_basic';

export interface NetworkPlayer {
  id: string;
  name: string;
  type: PlayerType;
  connectionId?: string;
  isHost: boolean;
  isReady: boolean;
  lastActivity: number;
  ollamaModel?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: number;
  isSystem?: boolean;
  isPrivate?: boolean;
  recipientId?: string;
}

export interface GameAction {
  id: string;
  playerId: string;
  action: string;
  data: any;
  timestamp: number;
  synchronized: boolean;
}

export interface MultiplayerConfig {
  maxPlayers: number;
  allowAI: boolean;
  allowOllama: boolean;
  requirePassword: boolean;
  password?: string;
  turnBased: boolean;
  turnTimeLimit?: number; // seconds
}

export interface GameSession {
  id: string;
  name: string;
  hostId: string;
  config: MultiplayerConfig;
  players: NetworkPlayer[];
  status: 'lobby' | 'starting' | 'playing' | 'paused' | 'ended';
  createdAt: number;
  currentTurn?: string; // player ID whose turn it is
}

export class MultiplayerSystem {
  private connectionStatus: ConnectionStatus = 'disconnected';
  private localPlayerId?: string;
  private session?: GameSession;
  private chatHistory: ChatMessage[] = [];
  private pendingActions: GameAction[] = [];
  private eventListeners: Map<string, Function[]> = new Map();
  
  // WebSocket connection (for real multiplayer)
  private ws?: WebSocket;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;

  // For local/simulated multiplayer
  private simulatedMode = true;

  constructor() {
    this.initializeEventListeners();
  }

  private initializeEventListeners(): void {
    // Set up event listener maps
    const events = [
      'connectionStatusChanged',
      'playerJoined',
      'playerLeft',
      'chatMessage',
      'gameAction',
      'turnChanged',
      'sessionUpdated'
    ];
    
    events.forEach(event => {
      this.eventListeners.set(event, []);
    });
  }

  /**
   * Register event listener
   */
  public on(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.push(callback);
    this.eventListeners.set(event, listeners);
  }

  /**
   * Remove event listener
   */
  public off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event) || [];
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }

  /**
   * Emit event
   */
  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(callback => callback(data));
  }

  /**
   * Create a new game session (host)
   */
  public async createSession(
    config: Partial<MultiplayerConfig> = {},
    hostPlayer: {
      id: string;
      name: string;
      type: PlayerType;
    }
  ): Promise<GameSession> {
    const session: GameSession = {
      id: this.generateSessionId(),
      name: `${hostPlayer.name}'s Game`,
      hostId: hostPlayer.id,
      config: {
        maxPlayers: config.maxPlayers || 6,
        allowAI: config.allowAI ?? true,
        allowOllama: config.allowOllama ?? true,
        requirePassword: config.requirePassword ?? false,
        password: config.password,
        turnBased: config.turnBased ?? false,
        turnTimeLimit: config.turnTimeLimit
      },
      players: [{
        ...hostPlayer,
        isHost: true,
        isReady: false,
        lastActivity: Date.now()
      }],
      status: 'lobby',
      createdAt: Date.now()
    };

    this.session = session;
    this.localPlayerId = hostPlayer.id;
    this.connectionStatus = 'connected';

    this.emit('connectionStatusChanged', this.connectionStatus);
    this.emit('sessionUpdated', session);

    return session;
  }

  /**
   * Join an existing session
   */
  public async joinSession(
    sessionId: string,
    player: {
      id: string;
      name: string;
      type: PlayerType;
    },
    password?: string
  ): Promise<boolean> {
    // In simulated mode, for now just create a mock join
    if (this.simulatedMode) {
      if (!this.session || this.session.id !== sessionId) {
        throw new Error('Session not found');
      }

      if (this.session.config.requirePassword && this.session.config.password !== password) {
        throw new Error('Invalid password');
      }

      if (this.session.players.length >= this.session.config.maxPlayers) {
        throw new Error('Session is full');
      }

      const networkPlayer: NetworkPlayer = {
        ...player,
        isHost: false,
        isReady: false,
        lastActivity: Date.now()
      };

      this.session.players.push(networkPlayer);
      this.localPlayerId = player.id;

      this.emit('playerJoined', networkPlayer);
      this.emit('sessionUpdated', this.session);

      return true;
    }

    // For real multiplayer via WebSocket
    try {
      // Connect to server and join session
      await this.connect();
      
      // Send join request
      this.sendMessage({
        type: 'join_session',
        sessionId,
        player,
        password
      });

      return true;
    } catch (error) {
      console.error('Failed to join session:', error);
      return false;
    }
  }

  /**
   * Leave current session
   */
  public leaveSession(): void {
    if (!this.session || !this.localPlayerId) return;

    const player = this.session.players.find(p => p.id === this.localPlayerId);
    if (player) {
      this.session.players = this.session.players.filter(p => p.id !== this.localPlayerId);
      this.emit('playerLeft', player);
      this.emit('sessionUpdated', this.session);
    }

    if (this.session.hostId === this.localPlayerId && this.session.players.length > 0) {
      // Transfer host to another player
      this.session.hostId = this.session.players[0].id;
      this.session.players[0].isHost = true;
    }

    this.localPlayerId = undefined;
    this.connectionStatus = 'disconnected';
    
    if (this.ws) {
      this.ws.close();
    }

    this.emit('connectionStatusChanged', this.connectionStatus);
  }

  /**
   * Add AI player to session
   */
  public addAIPlayer(
    type: PlayerType = 'ai_basic',
    options?: {
      name?: string;
      ollamaModel?: string;
    }
  ): boolean {
    if (!this.session) return false;
    if (!this.session.config.allowAI) return false;
    if (type === 'ai_ollama' && !this.session.config.allowOllama) return false;
    if (this.session.players.length >= this.session.config.maxPlayers) return false;

    const aiPlayer: NetworkPlayer = {
      id: this.generatePlayerId(),
      name: options?.name || `AI ${type === 'ai_ollama' ? 'Ollama' : 'Bot'} ${this.session.players.length + 1}`,
      type,
      isHost: false,
      isReady: true,
      lastActivity: Date.now(),
      ollamaModel: options?.ollamaModel
    };

    this.session.players.push(aiPlayer);
    this.emit('playerJoined', aiPlayer);
    this.emit('sessionUpdated', this.session);

    return true;
  }

  /**
   * Set player ready status
   */
  public setReady(playerId: string, ready: boolean): void {
    if (!this.session) return;

    const player = this.session.players.find(p => p.id === playerId);
    if (player) {
      player.isReady = ready;
      this.emit('sessionUpdated', this.session);
    }
  }

  /**
   * Start the game
   */
  public startGame(): boolean {
    if (!this.session) return false;
    if (this.localPlayerId !== this.session.hostId) return false;
    if (this.session.players.length < 2) return false;

    const allReady = this.session.players.every(p => p.isReady || p.type !== 'human');
    if (!allReady) return false;

    this.session.status = 'starting';
    this.emit('sessionUpdated', this.session);

    // Transition to playing
    setTimeout(() => {
      if (this.session) {
        this.session.status = 'playing';
        if (this.session.config.turnBased) {
          this.session.currentTurn = this.session.players[0].id;
          this.emit('turnChanged', this.session.currentTurn);
        }
        this.emit('sessionUpdated', this.session);
      }
    }, 2000);

    return true;
  }

  /**
   * Send chat message
   */
  public sendChatMessage(
    message: string,
    isPrivate: boolean = false,
    recipientId?: string
  ): ChatMessage | null {
    if (!this.session || !this.localPlayerId) return null;

    const player = this.session.players.find(p => p.id === this.localPlayerId);
    if (!player) return null;

    const chatMessage: ChatMessage = {
      id: this.generateMessageId(),
      senderId: this.localPlayerId,
      senderName: player.name,
      message,
      timestamp: Date.now(),
      isSystem: false,
      isPrivate,
      recipientId
    };

    this.chatHistory.push(chatMessage);
    this.emit('chatMessage', chatMessage);

    // In real multiplayer, broadcast to other players
    if (!this.simulatedMode && this.ws) {
      this.sendMessage({
        type: 'chat_message',
        data: chatMessage
      });
    }

    return chatMessage;
  }

  /**
   * Send system message
   */
  public sendSystemMessage(message: string): void {
    const chatMessage: ChatMessage = {
      id: this.generateMessageId(),
      senderId: 'system',
      senderName: 'System',
      message,
      timestamp: Date.now(),
      isSystem: true
    };

    this.chatHistory.push(chatMessage);
    this.emit('chatMessage', chatMessage);
  }

  /**
   * Get chat history
   */
  public getChatHistory(limit?: number): ChatMessage[] {
    if (limit) {
      return this.chatHistory.slice(-limit);
    }
    return [...this.chatHistory];
  }

  /**
   * Record game action
   */
  public recordAction(action: string, data: any): void {
    if (!this.localPlayerId) return;

    const gameAction: GameAction = {
      id: this.generateActionId(),
      playerId: this.localPlayerId,
      action,
      data,
      timestamp: Date.now(),
      synchronized: false
    };

    this.pendingActions.push(gameAction);

    // Broadcast action in multiplayer
    if (!this.simulatedMode && this.ws) {
      this.sendMessage({
        type: 'game_action',
        data: gameAction
      });
    }

    this.emit('gameAction', gameAction);
  }

  /**
   * End current turn (turn-based mode)
   */
  public endTurn(): void {
    if (!this.session || !this.session.config.turnBased) return;
    if (this.session.currentTurn !== this.localPlayerId) return;

    const currentIndex = this.session.players.findIndex(p => p.id === this.localPlayerId);
    const nextIndex = (currentIndex + 1) % this.session.players.length;
    this.session.currentTurn = this.session.players[nextIndex].id;

    this.emit('turnChanged', this.session.currentTurn);
    this.emit('sessionUpdated', this.session);
  }

  /**
   * Check if it's local player's turn
   */
  public isMyTurn(): boolean {
    if (!this.session || !this.session.config.turnBased) return true;
    return this.session.currentTurn === this.localPlayerId;
  }

  /**
   * Get current session
   */
  public getSession(): GameSession | undefined {
    return this.session;
  }

  /**
   * Get connection status
   */
  public getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  /**
   * Connect to multiplayer server
   */
  private async connect(url: string = 'ws://localhost:8080'): Promise<void> {
    return new Promise((resolve, reject) => {
      this.connectionStatus = 'connecting';
      this.emit('connectionStatusChanged', this.connectionStatus);

      try {
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          this.connectionStatus = 'connected';
          this.reconnectAttempts = 0;
          this.emit('connectionStatusChanged', this.connectionStatus);
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleServerMessage(event.data);
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.connectionStatus = 'error';
          this.emit('connectionStatusChanged', this.connectionStatus);
          reject(error);
        };

        this.ws.onclose = () => {
          this.connectionStatus = 'disconnected';
          this.emit('connectionStatusChanged', this.connectionStatus);
          this.attemptReconnect(url);
        };
      } catch (error) {
        this.connectionStatus = 'error';
        this.emit('connectionStatusChanged', this.connectionStatus);
        reject(error);
      }
    });
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect(url: string): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;

    setTimeout(() => {
      console.log(`Reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      this.connect(url).catch(console.error);
    }, delay);
  }

  /**
   * Send message to server
   */
  private sendMessage(message: any): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected');
      return;
    }

    this.ws.send(JSON.stringify(message));
  }

  /**
   * Handle server message
   */
  private handleServerMessage(data: string): void {
    try {
      const message = JSON.parse(data);
      
      switch (message.type) {
        case 'player_joined':
          this.emit('playerJoined', message.data);
          break;
        case 'player_left':
          this.emit('playerLeft', message.data);
          break;
        case 'chat_message':
          this.chatHistory.push(message.data);
          this.emit('chatMessage', message.data);
          break;
        case 'game_action':
          this.emit('gameAction', message.data);
          break;
        case 'turn_changed':
          this.emit('turnChanged', message.data);
          break;
        case 'session_updated':
          this.session = message.data;
          this.emit('sessionUpdated', message.data);
          break;
      }
    } catch (error) {
      console.error('Error handling server message:', error);
    }
  }

  /**
   * Generate unique IDs
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private generatePlayerId(): string {
    return `player_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private generateActionId(): string {
    return `action_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Enable/disable simulated mode
   */
  public setSimulatedMode(enabled: boolean): void {
    this.simulatedMode = enabled;
  }

  /**
   * Get all players in session
   */
  public getPlayers(): NetworkPlayer[] {
    return this.session?.players || [];
  }

  /**
   * Get local player
   */
  public getLocalPlayer(): NetworkPlayer | undefined {
    if (!this.session || !this.localPlayerId) return undefined;
    return this.session.players.find(p => p.id === this.localPlayerId);
  }

  /**
   * Check if local player is host
   */
  public isHost(): boolean {
    const player = this.getLocalPlayer();
    return player?.isHost || false;
  }
}
