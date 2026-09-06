/* ===== Life OS — App ===== */
const App = {
  currentView: 'overview',

  init() {
    this._initTheme();
    this._initNavigation();
    this._initModal();
    this._initSidebar();
    this._initKeyboard();
    this.navigate('overview');
  },

  _initTheme() {
    const theme = Storage.getTheme();
    this._applyTheme(theme);
    const btn = document.getElementById('themeToggle');
    if (btn) {
      btn.onclick = () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        this._applyTheme(next);
        Storage.setTheme(next);
      };
    }
  },

  _applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const sun = document.getElementById('iconSun');
    const moon = document.getElementById('iconMoon');
    if (sun) sun.classList.toggle('hidden', theme === 'dark');
    if (moon) moon.classList.toggle('hidden', theme === 'light');
  },

  _initNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.onclick = (e) => {
        e.preventDefault();
        const view = item.dataset.view;
        if (view) this.navigate(view);
        this._closeSidebar();
      };
    });
  },

  navigate(view) {
    this.currentView = view;
    Charts.destroyAll();

    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    const target = document.getElementById('view-' + view);
    if (target) target.classList.add('active');

    const nav = document.querySelector(`.nav-item[data-view="${view}"]`);
    if (nav) nav.classList.add('active');

    const titles = {
      overview: 'Visão geral',
      finances: 'Finanças',
      routine: 'Rotina',
      tasks: 'Tarefas',
      workout: 'Treino',
      diet: 'Dieta',
      goals: 'Metas',
      reports: 'Relatórios',
      settings: 'Configurações'
    };
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) pageTitle.textContent = titles[view] || view;

    this._renderView(view);
  },

  _renderView(view) {
    switch (view) {
      case 'overview': this._renderDashboard(); break;
      case 'finances': Finances.render(); break;
      case 'routine': Routine.render(); break;
      case 'tasks': Tasks.render(); break;
      case 'workout': Workout.render(); break;
      case 'diet': Diet.render(); break;
      case 'goals': Goals.render(); break;
      case 'reports': Reports.render(); break;
      case 'settings': this._renderSettings(); break;
    }
  },

  _renderDashboard() {
    const finSummary = Finances.getSummary();
    const taskSummary = Tasks.getSummary();
    const workoutSummary = Workout.getSummary();
    const goalSummary = Goals.getSummary();
    const routineSummary = Routine.getSummary();
    const dietSummary = Diet.getSummary();

    const data = Finances.getData();
    const totalExp = finSummary.totalExpenses;
    const available = finSummary.available;

    const completedWorkouts = Workout.getCompletedWorkouts();
    const today = todayStr();
    const todayCompleted = completedWorkouts.filter(w => (w.completedAt || w.createdAt) === today);

    const consistency = this._calcConsistencyScore();

    const view = document.getElementById('view-overview');
    view.innerHTML = `
      <div class="section">
        <h2 class="section-title">Visão Geral</h2>
      </div>

      <div class="kpi-grid">
        <div class="kpi">
          <div class="kpi-label">💰 Renda Mensal</div>
          <div class="kpi-value">${formatCurrency(finSummary.income)}</div>
          <div class="kpi-sub">Disponível: <span class="${available >= 0 ? 'positive' : 'negative'}" style="color:var(--${available >= 0 ? 'success' : 'danger'})">${formatCurrency(available)}</span></div>
        </div>
        <div class="kpi">
          <div class="kpi-label">✅ Tarefas</div>
          <div class="kpi-value">${taskSummary.done}/${taskSummary.total}</div>
          <div class="kpi-sub">${taskSummary.todo} pendentes</div>
        </div>
        <div class="kpi">
          <div class="kpi-label">🏋️ Treinos Concluídos</div>
          <div class="kpi-value positive">${completedWorkouts.length}</div>
          <div class="kpi-sub">${todayCompleted.length} hoje</div>
        </div>
        <div class="kpi">
          <div class="kpi-label">🎯 Metas</div>
          <div class="kpi-value">${goalSummary.completed}/${goalSummary.total}</div>
          <div class="kpi-sub">${goalSummary.in_progress} em andamento</div>
        </div>
        <div class="kpi">
          <div class="kpi-label">📋 Rotina Hoje</div>
          <div class="kpi-value">${routineSummary.done}/${routineSummary.total}</div>
          <div class="kpi-sub">${routineSummary.total > 0 ? formatPercent(routineSummary.done / routineSummary.total * 100) : '0%'} concluído</div>
        </div>
        <div class="kpi">
          <div class="kpi-label">🏆 Índice de Consistência</div>
          <div class="kpi-value" style="color:var(--${consistency >= 70 ? 'success' : consistency >= 40 ? 'warning' : 'danger'})">${consistency}/100</div>
          <div class="kpi-sub">${consistency >= 70 ? 'Excelente!' : consistency >= 40 ? 'Bom progresso' : 'Continue tentando'}</div>
        </div>
      </div>

      <div class="grid-2">
        <div class="card">
          <div class="card-header"><span class="card-title">Distribuição de Gastos</span></div>
          <div class="chart-container"><canvas id="dashChartCat"></canvas></div>
          <div id="dashEmptyChart" class="empty-state" style="display:none"><div class="text-xs text-muted">Sem dados financeiros</div></div>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">Resumo</span></div>
          <div class="mb-sm">
            <div class="text-xs text-muted mb-sm">Gastos do mês: ${formatCurrency(totalExp)}</div>
            <div class="progress"><div class="progress-bar ${totalExp > finSummary.income ? 'danger' : 'success'}" style="width:${finSummary.income > 0 ? Math.min(100, totalExp / finSummary.income * 100) : 0}%"></div></div>
          </div>
          <div class="mb-sm">
            <div class="text-xs text-muted mb-sm">Tarefas concluídas: ${taskSummary.done}/${taskSummary.total}</div>
            <div class="progress"><div class="progress-bar success" style="width:${taskSummary.total > 0 ? (taskSummary.done / taskSummary.total * 100) : 0}%"></div></div>
          </div>
          <div class="mb-sm">
            <div class="text-xs text-muted mb-sm">Metas concluídas: ${goalSummary.completed}/${goalSummary.total}</div>
            <div class="progress"><div class="progress-bar success" style="width:${goalSummary.total > 0 ? (goalSummary.completed / goalSummary.total * 100) : 0}%"></div></div>
          </div>
        </div>
      </div>

      ${todayCompleted.length > 0 ? `
        <div class="section mt-lg">
          <div class="card-header"><span class="card-title">Treinos Concluídos Hoje</span></div>
          <div class="card">
            ${todayCompleted.map(w => `
              <div class="flex items-center justify-between" style="padding:.5rem 0;border-bottom:1px solid var(--border)">
                <div>
                  <div class="text-sm font-bold">${w.name}</div>
                  <div class="text-xs text-muted">${w.exercises ? w.exercises.length : 0} exercícios</div>
                </div>
                <span class="badge badge-success">Concluído</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    `;

    const catMap = {};
    data.expenses.forEach(e => {
      const cat = e.category || 'Outros';
      catMap[cat] = (catMap[cat] || 0) + (e.value || 0);
    });
    const catLabels = Object.keys(catMap);
    const catValues = Object.values(catMap);
    if (catLabels.length > 0) {
      Charts.doughnut('dashChartCat', catLabels, catValues);
    } else {
      const chart = document.getElementById('dashChartCat');
      const empty = document.getElementById('dashEmptyChart');
      if (chart) chart.parentElement.style.display = 'none';
      if (empty) empty.style.display = '';
    }
  },

  _calcConsistencyScore() {
    let score = 0;
    let count = 0;

    const fin = Finances.getSummary();
    if (fin.income > 0) {
      score += fin.income > fin.totalExpenses ? 20 : (fin.totalExpenses <= fin.income * 1.1 ? 10 : 0);
      count += 20;
    }

    const routine = Routine.getSummary();
    if (routine.total > 0) {
      score += Math.round((routine.done / routine.total) * 20);
      count += 20;
    }

    const tasks = Tasks.getSummary();
    if (tasks.total > 0) {
      score += Math.round((tasks.done / tasks.total) * 20);
      count += 20;
    }

    const workouts = Workout.getSummary();
    if (workouts.completed > 0) {
      score += Math.min(20, workouts.completed * 5);
      count += 20;
    }

    const goals = Goals.getSummary();
    if (goals.total > 0) {
      score += Math.round((goals.completed / goals.total) * 20);
      count += 20;
    }

    return count > 0 ? Math.round(score / count * 100) : 0;
  },

  _renderSettings() {
    const view = document.getElementById('view-settings');
    view.innerHTML = `
      <div class="section">
        <h2 class="section-title">⚙️ Configurações</h2>
      </div>

      <div class="card mb-md">
        <div class="card-header"><span class="card-title">Tema</span></div>
        <div class="flex gap-sm">
          <button class="btn btn-ghost btn-sm" id="setThemeLight">☀️ Claro</button>
          <button class="btn btn-ghost btn-sm" id="setThemeDark">🌙 Escuro</button>
        </div>
      </div>

      <div class="card mb-md">
        <div class="card-header"><span class="card-title">Dados</span></div>
        <div class="text-sm text-muted mb-md">
          Todos os dados são salvos localmente no navegador (localStorage). Nada é enviado para servidores externos.
        </div>
      </div>

      <div class="card reset-section">
        <div class="card-header"><span class="card-title" style="color:var(--danger)">Resetar Dados</span></div>
        <div class="text-sm text-muted mb-md">
          Esta ação irá apagar todos os dados pessoais cadastrados no sistema (finanças, rotina, tarefas, treinos, dieta, metas).
          <strong>O código-fonte do projeto NÃO será apagado.</strong>
        </div>
        <button class="btn btn-danger" id="setReset">Redefinir todos os dados</button>
      </div>

      <div class="card mt-lg">
        <div class="card-header"><span class="card-title">Sobre</span></div>
        <div class="text-sm text-muted">
          <strong>Life OS</strong> — Dashboard pessoal de finanças, rotina e saúde.<br>
          Todos os dados ficam no seu navegador. Sem backend, sem banco de dados externo.
        </div>
      </div>
    `;

    const themeLight = document.getElementById('setThemeLight');
    const themeDark = document.getElementById('setThemeDark');
    if (themeLight) themeLight.onclick = () => { this._applyTheme('light'); Storage.setTheme('light'); App.toast('Tema claro ativado', 'info'); };
    if (themeDark) themeDark.onclick = () => { this._applyTheme('dark'); Storage.setTheme('dark'); App.toast('Tema escuro ativado', 'info'); };

    const resetBtn = document.getElementById('setReset');
    if (resetBtn) {
      resetBtn.onclick = () => {
        this.confirm('Tem certeza que deseja apagar TODOS os dados? Esta ação é irreversível.', () => {
          Storage.resetAll();
          App.toast('Todos os dados foram resetados. Recarregando...', 'success');
          setTimeout(() => location.reload(), 1000);
        });
      };
    }
  },

  _initSidebar() {
    const hamburger = document.getElementById('hamburger');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const closeBtn = document.getElementById('sidebarClose');

    if (hamburger) hamburger.onclick = () => { sidebar.classList.add('open'); overlay.classList.add('open'); };
    if (overlay) overlay.onclick = () => this._closeSidebar();
    if (closeBtn) closeBtn.onclick = () => this._closeSidebar();
  },

  _closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
  },

  _initModal() {
    const overlay = document.getElementById('modalOverlay');
    const closeBtn = document.getElementById('modalClose');
    if (closeBtn) closeBtn.onclick = () => this.closeModal();
    if (overlay) {
      overlay.onclick = (e) => {
        if (e.target === overlay) this.closeModal();
      };
    }
  },

  modal(title, bodyHTML, buttons = []) {
    const overlay = document.getElementById('modalOverlay');
    const titleEl = document.getElementById('modalTitle');
    const body = document.getElementById('modalBody');
    const footer = document.getElementById('modalFooter');

    titleEl.textContent = title;
    body.innerHTML = bodyHTML;
    footer.innerHTML = '';

    buttons.forEach(b => {
      const btn = document.createElement('button');
      btn.className = `btn ${b.class || 'btn-ghost'}`;
      btn.textContent = b.label;
      if (b.action === 'close') {
        btn.onclick = () => this.closeModal();
      } else if (typeof b.action === 'function') {
        btn.onclick = b.action;
      }
      footer.appendChild(btn);
    });

    overlay.removeAttribute('hidden');
  },

  closeModal() {
    const overlay = document.getElementById('modalOverlay');
    overlay.setAttribute('hidden', '');
  },

  confirm(message, onOk) {
    const overlay = document.getElementById('confirmOverlay');
    const text = document.getElementById('confirmText');
    const okBtn = document.getElementById('confirmOk');
    const cancelBtn = document.getElementById('confirmCancel');

    text.textContent = message;
    overlay.removeAttribute('hidden');

    const cleanup = () => {
      overlay.setAttribute('hidden', '');
      okBtn.onclick = null;
      cancelBtn.onclick = null;
    };

    okBtn.onclick = () => { cleanup(); if (onOk) onOk(); };
    cancelBtn.onclick = cleanup;
  },

  toast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = { success: '✓', error: '✗', info: 'ℹ' };
    toast.innerHTML = `<span>${icons[type] || 'ℹ'}</span> ${message}`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      toast.style.transition = '.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },

  _initKeyboard() {
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
      const map = { g: 'overview', f: 'finances', r: 'routine', t: 'tasks', w: 'workout', d: 'diet', m: 'goals', l: 'reports' };
      if (map[e.key]) {
        e.preventDefault();
        this.navigate(map[e.key]);
      }
      if (e.key === 'Escape') {
        this.closeModal();
        document.getElementById('confirmOverlay').setAttribute('hidden', '');
      }
    });
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
