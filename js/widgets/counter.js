// ============================================
// COUNTER WIDGET - Canlı İlişki Sayacı
// ============================================

const CounterWidget = {
  intervalId: null,
  startDate: null,

  init() {
    this.daysEl = document.getElementById('counterDays');
    this.hoursEl = document.getElementById('counterHours');
    this.minutesEl = document.getElementById('counterMinutes');
    this.secondsEl = document.getElementById('counterSeconds');

    this.startDate = this.getStartDate();
  },

  getStartDate() {
    const start = APP_CONFIG.relationshipStart;
    return new Date(start.year, start.month - 1, start.day, start.hour || 0, start.minute || 0);
  },

  start() {
    if (this.intervalId) return;
    this.update();
    this.intervalId = setInterval(() => this.update(), 1000);
  },

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  },

  update() {
    const now = new Date();
    const diff = now.getTime() - this.startDate.getTime();

    if (diff < 0) return;

    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    this.animateNumber(this.daysEl, days, 3);
    this.animateNumber(this.hoursEl, hours, 2);
    this.animateNumber(this.minutesEl, minutes, 2);
    this.animateNumber(this.secondsEl, seconds, 2);
  },

  animateNumber(el, value, padLength) {
    const padded = String(value).padStart(padLength, '0');
    if (el.textContent !== padded) {
      el.textContent = padded;
      el.style.transform = 'scale(1.1)';
      setTimeout(() => {
        el.style.transform = 'scale(1)';
      }, 150);
    }
  }
};
