/* ===== Life OS — Charts ===== */
const Charts = {
  instances: {},

  destroy(id) {
    if (this.instances[id]) {
      this.instances[id].destroy();
      delete this.instances[id];
    }
  },

  destroyAll() {
    Object.keys(this.instances).forEach(id => this.destroy(id));
  },

  getColors() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    return {
      text: isDark ? '#9ca3af' : '#6b7280',
      grid: isDark ? '#2a2d3a' : '#e5e7eb',
      primary: '#6366f1',
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#ef4444',
      info: '#3b82f6',
      palette: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#64748b']
    };
  },

  defaults() {
    const c = this.getColors();
    return {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { labels: { color: c.text, font: { family: 'Inter', size: 12 } } },
        tooltip: { backgroundColor: '#1a1d27', titleColor: '#fff', bodyColor: '#d1d5db', padding: 10, cornerRadius: 8 }
      },
      scales: {
        x: { ticks: { color: c.text, font: { size: 11 } }, grid: { color: c.grid } },
        y: { ticks: { color: c.text, font: { size: 11 } }, grid: { color: c.grid } }
      }
    };
  },

  bar(canvasId, labels, datasets, opts = {}) {
    this.destroy(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    const defs = this.defaults();
    this.instances[canvasId] = new Chart(canvas, {
      type: 'bar',
      data: { labels, datasets },
      options: {
        ...defs,
        ...opts,
        plugins: { ...defs.plugins, ...(opts.plugins || {}) },
        scales: { ...defs.scales, ...(opts.scales || {}) }
      }
    });
    return this.instances[canvasId];
  },

  line(canvasId, labels, datasets, opts = {}) {
    this.destroy(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    const defs = this.defaults();
    this.instances[canvasId] = new Chart(canvas, {
      type: 'line',
      data: { labels, datasets },
      options: {
        ...defs,
        ...opts,
        elements: { line: { tension: 0.35 }, point: { radius: 3 } },
        plugins: { ...defs.plugins, ...(opts.plugins || {}) },
        scales: { ...defs.scales, ...(opts.scales || {}) }
      }
    });
    return this.instances[canvasId];
  },

  doughnut(canvasId, labels, data, opts = {}) {
    this.destroy(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    const c = this.getColors();
    this.instances[canvasId] = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{ data, backgroundColor: c.palette.slice(0, data.length), borderWidth: 0 }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '65%',
        plugins: {
          legend: { position: 'bottom', labels: { color: c.text, font: { size: 11 }, padding: 12 } },
          tooltip: { backgroundColor: '#1a1d27', titleColor: '#fff', bodyColor: '#d1d5db', padding: 10, cornerRadius: 8 }
        },
        ...opts
      }
    });
    return this.instances[canvasId];
  }
};
