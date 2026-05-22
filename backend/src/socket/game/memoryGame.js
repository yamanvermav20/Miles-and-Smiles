/**
 * Memory Card Matching Game State Class
 * Manages game state, card pairs, flipping, and matching mechanics
 */

// Card symbols/emojis for matching pairs
const CARD_SYMBOLS = [
  "🎮", "🎲", "🎯", "🎪", "🎨", "🎭", "🎬", "🎹",
  "🌟", "🌙", "🌈", "🌸", "🌺", "🍀", "🦋", "🐬",
];

/**
 * Memory Game Class
 * Manages card matching game for 2 players
 */
export class MemoryGame {
  constructor(gridSize = 4) {
    // Grid size (4x4 = 16 cards = 8 pairs by default)
    this.gridSize = gridSize;
    this.totalCards = gridSize * gridSize;
    this.totalPairs = this.totalCards / 2;
    
    // Initialize cards
    this.cards = [];
    this.initializeCards();
    
    // Player socket IDs and user IDs
    this.players = { 1: null, 2: null };
    this.userIds = { 1: null, 2: null };
    
    // Scores (matched pairs count)
    this.scores = { 1: 0, 2: 0 };
    
    // Currently flipped cards (max 2)
    this.flippedCards = [];
    
    // Matched card indices
    this.matchedCards = new Set();
    
    // Game state
    this.currentTurn = 1; // Player 1 starts
    this.winner = null;
    this.gameStarted = false;
    this.isProcessing = false; // Lock during card flip animation
  }

  /**
   * Initialize and shuffle cards
   */
  initializeCards() {
    // Select random symbols for this game
    const shuffledSymbols = [...CARD_SYMBOLS].sort(() => Math.random() - 0.5);
    const selectedSymbols = shuffledSymbols.slice(0, this.totalPairs);
    
    // Create pairs
    const cardPairs = [];
    selectedSymbols.forEach((symbol, index) => {
      cardPairs.push({ id: index * 2, symbol, pairId: index });
      cardPairs.push({ id: index * 2 + 1, symbol, pairId: index });
    });
    
    // Shuffle cards
    this.cards = cardPairs.sort(() => Math.random() - 0.5);
    
    // Assign final indices
    this.cards = this.cards.map((card, index) => ({
      ...card,
      index,
      isFlipped: false,
      isMatched: false,
    }));
  }

  /**
   * Add a player to the game
   * @param {string} socketId - Socket ID
   * @param {string} userId - User ID
   * @returns {number|null} Player number (1 or 2) or null if game is full
   */
  addPlayer(socketId, userId) {
    if (!this.players[1]) {
      this.players[1] = socketId;
      this.userIds[1] = userId;
      return 1;
    } else if (!this.players[2]) {
      this.players[2] = socketId;
      this.userIds[2] = userId;
      this.gameStarted = true;
      return 2;
    }
    return null;
  }

  /**
   * Get player number from socket ID
   * @param {string} socketId - Socket ID
   * @returns {number|null} Player number (1 or 2) or null
   */
  getPlayerNumber(socketId) {
    if (this.players[1] === socketId) return 1;
    if (this.players[2] === socketId) return 2;
    return null;
  }

  /**
   * Flip a card
   * @param {string} socketId - Socket ID of the player
   * @param {number} cardIndex - Index of the card to flip
   * @returns {Object} Result of the flip
   */
  flipCard(socketId, cardIndex) {
    const playerNumber = this.getPlayerNumber(socketId);
    
    // Validation checks
    if (!playerNumber) {
      return { success: false, error: "You are not a player in this game" };
    }
    
    if (!this.gameStarted) {
      return { success: false, error: "Game has not started yet" };
    }
    
    if (this.winner) {
      return { success: false, error: "Game is already over" };
    }
    
    if (playerNumber !== this.currentTurn) {
      return { success: false, error: "It's not your turn" };
    }
    
    if (this.isProcessing) {
      return { success: false, error: "Processing previous move" };
    }
    
    if (cardIndex < 0 || cardIndex >= this.totalCards) {
      return { success: false, error: "Invalid card index" };
    }
    
    const card = this.cards[cardIndex];
    
    if (card.isMatched) {
      return { success: false, error: "Card already matched" };
    }
    
    if (this.flippedCards.includes(cardIndex)) {
      return { success: false, error: "Card already flipped" };
    }
    
    if (this.flippedCards.length >= 2) {
      return { success: false, error: "Two cards already flipped" };
    }
    
    // Flip the card
    this.flippedCards.push(cardIndex);
    
    // Check if this is the second card
    if (this.flippedCards.length === 2) {
      this.isProcessing = true;
      const [firstIndex, secondIndex] = this.flippedCards;
      const firstCard = this.cards[firstIndex];
      const secondCard = this.cards[secondIndex];
      
      // Check for match
      const isMatch = firstCard.pairId === secondCard.pairId;
      
      if (isMatch) {
        // Mark cards as matched
        this.cards[firstIndex].isMatched = true;
        this.cards[secondIndex].isMatched = true;
        this.matchedCards.add(firstIndex);
        this.matchedCards.add(secondIndex);
        this.scores[playerNumber]++;
        
        // Clear flipped cards
        this.flippedCards = [];
        this.isProcessing = false;
        
        // Check for game over
        if (this.matchedCards.size === this.totalCards) {
          this.winner = this.scores[1] > this.scores[2] ? 1 : 
                        this.scores[2] > this.scores[1] ? 2 : "tie";
        }
        
        return {
          success: true,
          isMatch: true,
          cardIndex,
          card: { index: cardIndex, symbol: card.symbol },
          firstCard: { index: firstIndex, symbol: firstCard.symbol },
          secondCard: { index: secondIndex, symbol: secondCard.symbol },
          scores: { ...this.scores },
          gameOver: this.matchedCards.size === this.totalCards,
          winner: this.winner,
          currentTurn: this.currentTurn,
          sameTurn: true, // Player gets another turn on match
        };
      } else {
        // No match - cards will be hidden after delay
        return {
          success: true,
          isMatch: false,
          cardIndex,
          card: { index: cardIndex, symbol: card.symbol },
          firstCard: { index: firstIndex, symbol: firstCard.symbol },
          secondCard: { index: secondIndex, symbol: secondCard.symbol },
          scores: { ...this.scores },
          gameOver: false,
          currentTurn: this.currentTurn,
          sameTurn: false,
        };
      }
    }
    
    // First card flip
    return {
      success: true,
      isFirstCard: true,
      cardIndex,
      card: { index: cardIndex, symbol: card.symbol },
      scores: { ...this.scores },
      gameOver: false,
      currentTurn: this.currentTurn,
    };
  }

  /**
   * Hide non-matched flipped cards and switch turn
   * Called after delay when cards don't match
   */
  hideCards() {
    this.flippedCards = [];
    this.currentTurn = this.currentTurn === 1 ? 2 : 1;
    this.isProcessing = false;
    
    return {
      success: true,
      currentTurn: this.currentTurn,
    };
  }

  /**
   * Reset game state for a new game
   */
  reset() {
    // Keep players, reset game state
    this.initializeCards();
    this.scores = { 1: 0, 2: 0 };
    this.flippedCards = [];
    this.matchedCards = new Set();
    this.currentTurn = 1;
    this.winner = null;
    this.isProcessing = false;
    this.gameStarted = this.players[1] && this.players[2];
  }

  /**
   * Get current game state for clients
   * @param {boolean} revealAll - Whether to reveal all card symbols
   * @returns {Object} Game state
   */
  getState(revealAll = false) {
    return {
      gridSize: this.gridSize,
      totalCards: this.totalCards,
      totalPairs: this.totalPairs,
      cards: this.cards.map(card => ({
        index: card.index,
        isFlipped: this.flippedCards.includes(card.index),
        isMatched: card.isMatched,
        // Only reveal symbol if card is flipped, matched, or revealAll is true
        symbol: (this.flippedCards.includes(card.index) || card.isMatched || revealAll) 
          ? card.symbol 
          : null,
      })),
      players: { ...this.players },
      userIds: { ...this.userIds },
      scores: { ...this.scores },
      currentTurn: this.currentTurn,
      winner: this.winner,
      gameStarted: this.gameStarted,
      flippedCards: [...this.flippedCards],
      matchedCount: this.matchedCards.size,
      isProcessing: this.isProcessing,
    };
  }

  /**
   * Check if game is full
   * @returns {boolean} True if both players have joined
   */
  isFull() {
    return this.players[1] && this.players[2];
  }

  /**
   * Remove a player from the game
   * @param {string} socketId - Socket ID
   * @returns {number|null} Player number that was removed
   */
  removePlayer(socketId) {
    if (this.players[1] === socketId) {
      this.players[1] = null;
      this.userIds[1] = null;
      this.gameStarted = false;
      return 1;
    } else if (this.players[2] === socketId) {
      this.players[2] = null;
      this.userIds[2] = null;
      this.gameStarted = false;
      return 2;
    }
    return null;
  }
}

export default MemoryGame;
