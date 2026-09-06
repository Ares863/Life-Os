/* ===== Life OS — Storage ===== */
const Storage = {
  PREFIX: 'lifeos_',

  save(key, data) {
    try {
      localStorage.setItem(this.PREFIX + key, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Storage.save error:', e);
      return false;
    }
  },

  load(key, fallback = null) {
    try {
      const raw = localStorage.getItem(this.PREFIX + key);
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      console.error('Storage.load error:', e);
      return fallback;
    }
  },

  update(key, updater) {
    const data = this.load(key);
    const updated = updater(data);
    this.save(key, updated);
    return updated;
  },

  remove(key) {
    localStorage.removeItem(this.PREFIX + key);
  },

  resetAll() {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(this.PREFIX) && k !== this.PREFIX + 'theme') {
        keys.push(k);
      }
    }
    keys.forEach(k => localStorage.removeItem(k));
  },

  getTheme() {
    return localStorage.getItem(this.PREFIX + 'theme') || 'light';
  },

  setTheme(theme) {
    localStorage.setItem(this.PREFIX + 'theme', theme);
  }
};

const MAX_VALUE = 10000000;

function clampNumber(v) {
  const n = parseFloat(v);
  if (isNaN(n)) return 0;
  return Math.max(0, Math.min(MAX_VALUE, Math.round(n * 100) / 100));
}

function enforceMaxValue(input) {
  if (!input) return;
  input.addEventListener('input', () => {
    let val = input.value.replace(/[^\d.]/g, '');
    const parts = val.split('.');
    if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('');
    const num = parseFloat(val);
    if (!isNaN(num) && num > MAX_VALUE) {
      input.value = MAX_VALUE;
    }
  });
  input.addEventListener('paste', (e) => {
    setTimeout(() => {
      const num = parseFloat(input.value);
      if (!isNaN(num) && num > MAX_VALUE) {
        input.value = MAX_VALUE;
      }
    }, 0);
  });
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function formatCurrency(v) {
  return 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(d) {
  if (!d) return '';
  const dt = new Date(d);
  return dt.toLocaleDateString('pt-BR');
}

function formatPercent(v) {
  return Number(v || 0).toFixed(1) + '%';
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function startOfWeek() {
  const d = new Date();
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  return d.toISOString().slice(0, 10);
}

function startOfMonth() {
  return new Date().toISOString().slice(0, 8) + '01';
}

function startOfYear() {
  return new Date().toISOString().slice(0, 5) + '01-01';
}

function monthsAgo(n) {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d.toISOString().slice(0, 10);
}
