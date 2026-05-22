/**
 * Timer Manager
 * Handles turn timers, grace periods, and reconnect timers
 */

/**
 * TimerManager class for managing game timers
 */
export class TimerManager {
  constructor() {
    this.turnTimer = null;
    this.gracePeriodTimer = null;
    this.reconnectTimer = null;
    this.warningTimers = [];
  }

  /**
   * Start turn timer with optional warnings
   * @param {number} timeLimit - Time limit in milliseconds
   * @param {Function} onTimeout - Callback when timer expires
   * @param {Function} onWarning - Callback for warnings
   */
  startTurnTimer(timeLimit, onTimeout, onWarning) {
    this.clearTurnTimer();

    // Main timer
    this.turnTimer = setTimeout(onTimeout, timeLimit);

    // Warning at 10 seconds
    if (timeLimit > 10000 && onWarning) {
      this.warningTimers.push(
        setTimeout(() => onWarning(10), timeLimit - 10000)
      );
    }

    // Warning at 5 seconds
    if (timeLimit > 5000 && onWarning) {
      this.warningTimers.push(
        setTimeout(() => onWarning(5), timeLimit - 5000)
      );
    }
  }

  /**
   * Start grace period timer
   * @param {number} duration - Duration in milliseconds
   * @param {Function} onExpire - Callback when grace period expires
   */
  startGracePeriod(duration, onExpire) {
    this.clearGracePeriod();
    this.gracePeriodTimer = setTimeout(onExpire, duration);
  }

  /**
   * Start reconnect timer
   * @param {number} duration - Duration in milliseconds
   * @param {Function} onExpire - Callback when reconnect time expires
   */
  startReconnectTimer(duration, onExpire) {
    this.clearReconnectTimer();
    this.reconnectTimer = setTimeout(onExpire, duration);
  }

  /**
   * Clear turn timer and warnings
   */
  clearTurnTimer() {
    if (this.turnTimer) {
      clearTimeout(this.turnTimer);
      this.turnTimer = null;
    }
    this.warningTimers.forEach(t => clearTimeout(t));
    this.warningTimers = [];
  }

  /**
   * Clear grace period timer
   */
  clearGracePeriod() {
    if (this.gracePeriodTimer) {
      clearTimeout(this.gracePeriodTimer);
      this.gracePeriodTimer = null;
    }
  }

  /**
   * Clear reconnect timer
   */
  clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Clear all timers
   */
  clearAll() {
    this.clearTurnTimer();
    this.clearGracePeriod();
    this.clearReconnectTimer();
  }
}
