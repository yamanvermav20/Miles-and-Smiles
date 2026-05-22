/**
 * Unit tests for Turn Engine
 */

import { TurnEngine } from "../../../src/socket/game/TurnEngine.js";

describe("Turn Engine", () => {
  let engine;
  const player1 = { odId: "user1", socketId: "socket1" };
  const player2 = { odId: "user2", socketId: "socket2" };
  const config = {
    turnDuration: 30,
    gracePeriod: 5,
    maxTimeouts: 2,
  };

  beforeEach(() => {
    engine = new TurnEngine([player1, player2], config);
    jest.useFakeTimers();
  });

  afterEach(() => {
    engine.cleanup();
    jest.useRealTimers();
  });

  describe("initialization", () => {
    it("should initialize with correct players", () => {
      expect(engine.players).toHaveLength(2);
      expect(engine.players[0]).toEqual(player1);
      expect(engine.players[1]).toEqual(player2);
    });

    it("should start with first player's turn", () => {
      expect(engine.currentTurnIndex).toBe(0);
      expect(engine.getCurrentPlayer()).toEqual(player1);
    });

    it("should use provided config", () => {
      expect(engine.turnDuration).toBe(30);
      expect(engine.gracePeriod).toBe(5);
      expect(engine.maxTimeouts).toBe(2);
    });

    it("should use defaults when no config provided", () => {
      const defaultEngine = new TurnEngine([player1, player2]);
      expect(defaultEngine.turnDuration).toBe(60);
      expect(defaultEngine.gracePeriod).toBe(10);
      expect(defaultEngine.maxTimeouts).toBe(3);
      defaultEngine.cleanup();
    });
  });

  describe("startTurn", () => {
    it("should emit turn-started event", () => {
      const handler = jest.fn();
      engine.on("turn-started", handler);
      
      engine.startTurn();
      
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          player: player1,
          turnNumber: 1,
          duration: 30,
        })
      );
    });

    it("should increment turn number", () => {
      engine.startTurn();
      expect(engine.turnNumber).toBe(1);
      
      engine.endTurn(player1.odId);
      engine.startTurn();
      expect(engine.turnNumber).toBe(2);
    });
  });

  describe("endTurn", () => {
    it("should switch to next player", () => {
      engine.startTurn();
      engine.endTurn(player1.odId);
      
      expect(engine.getCurrentPlayer()).toEqual(player2);
    });

    it("should wrap around to first player", () => {
      engine.startTurn();
      engine.endTurn(player1.odId);
      engine.startTurn();
      engine.endTurn(player2.odId);
      
      expect(engine.getCurrentPlayer()).toEqual(player1);
    });

    it("should emit turn-ended event", () => {
      const handler = jest.fn();
      engine.on("turn-ended", handler);
      
      engine.startTurn();
      engine.endTurn(player1.odId);
      
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          player: player1,
          turnNumber: 1,
        })
      );
    });

    it("should reject if not player's turn", () => {
      engine.startTurn();
      
      expect(() => engine.endTurn(player2.odId)).toThrow();
    });
  });

  describe("turn timer", () => {
    it("should emit timeout event when time runs out", () => {
      const handler = jest.fn();
      engine.on("turn-timeout", handler);
      
      engine.startTurn();
      
      // Fast forward past turn duration + grace period
      jest.advanceTimersByTime((30 + 5) * 1000 + 100);
      
      expect(handler).toHaveBeenCalled();
    });

    it("should emit timer-tick events", () => {
      const handler = jest.fn();
      engine.on("timer-tick", handler);
      
      engine.startTurn();
      
      // Fast forward 1 second
      jest.advanceTimersByTime(1000);
      
      expect(handler).toHaveBeenCalled();
    });

    it("should track timeout count per player", () => {
      engine.startTurn();
      
      // Force timeout
      jest.advanceTimersByTime(36000);
      
      expect(engine.timeoutCount.get(player1.odId)).toBe(1);
    });

    it("should emit game-forfeit after max timeouts", () => {
      const handler = jest.fn();
      engine.on("game-forfeit", handler);
      
      // Timeout twice (max is 2)
      for (let i = 0; i < 2; i++) {
        engine.startTurn();
        jest.advanceTimersByTime(36000);
        
        // If not forfeited yet, start next turn cycle
        if (i < 1) {
          engine.startTurn();
          engine.endTurn(player2.odId);
        }
      }
      
      expect(handler).toHaveBeenCalled();
    });
  });

  describe("pause/resume", () => {
    it("should pause the timer", () => {
      engine.startTurn();
      engine.pause();
      
      expect(engine.isPaused).toBe(true);
    });

    it("should not emit timeout while paused", () => {
      const handler = jest.fn();
      engine.on("turn-timeout", handler);
      
      engine.startTurn();
      engine.pause();
      
      jest.advanceTimersByTime(60000);
      
      expect(handler).not.toHaveBeenCalled();
    });

    it("should resume the timer", () => {
      engine.startTurn();
      engine.pause();
      engine.resume();
      
      expect(engine.isPaused).toBe(false);
    });

    it("should emit pause/resume events", () => {
      const pauseHandler = jest.fn();
      const resumeHandler = jest.fn();
      engine.on("game-paused", pauseHandler);
      engine.on("game-resumed", resumeHandler);
      
      engine.startTurn();
      engine.pause();
      engine.resume();
      
      expect(pauseHandler).toHaveBeenCalled();
      expect(resumeHandler).toHaveBeenCalled();
    });
  });

  describe("disconnect handling", () => {
    it("should handle player disconnect", () => {
      const handler = jest.fn();
      engine.on("player-disconnected", handler);
      
      engine.startTurn();
      engine.handleDisconnect(player1.odId);
      
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          odId: player1.odId,
        })
      );
    });

    it("should pause game on disconnect", () => {
      engine.startTurn();
      engine.handleDisconnect(player1.odId);
      
      expect(engine.isPaused).toBe(true);
    });

    it("should handle player reconnect", () => {
      const handler = jest.fn();
      engine.on("player-reconnected", handler);
      
      engine.startTurn();
      engine.handleDisconnect(player1.odId);
      engine.handleReconnect(player1.odId, "newSocket");
      
      expect(handler).toHaveBeenCalled();
    });

    it("should resume game on reconnect", () => {
      engine.startTurn();
      engine.handleDisconnect(player1.odId);
      engine.handleReconnect(player1.odId, "newSocket");
      
      expect(engine.isPaused).toBe(false);
    });
  });

  describe("move history", () => {
    it("should record moves", () => {
      engine.startTurn();
      engine.recordMove(player1.odId, { type: "move", data: "test" });
      
      expect(engine.moveHistory).toHaveLength(1);
      expect(engine.moveHistory[0]).toMatchObject({
        playerId: player1.odId,
        move: { type: "move", data: "test" },
        turnNumber: 1,
      });
    });

    it("should include timestamps in moves", () => {
      engine.startTurn();
      engine.recordMove(player1.odId, { type: "move" });
      
      expect(engine.moveHistory[0].timestamp).toBeDefined();
    });
  });

  describe("getState", () => {
    it("should return current state", () => {
      engine.startTurn();
      const state = engine.getState();
      
      expect(state).toMatchObject({
        currentPlayer: player1,
        turnNumber: 1,
        isPaused: false,
        players: [player1, player2],
      });
    });

    it("should include remaining time", () => {
      engine.startTurn();
      jest.advanceTimersByTime(5000);
      
      const state = engine.getState();
      expect(state.remainingTime).toBeLessThan(30);
      expect(state.remainingTime).toBeGreaterThan(20);
    });
  });
});
