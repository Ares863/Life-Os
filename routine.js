/* ===== Life OS — Rotina & Hábitos ===== */
const Routine = {
  STORAGE_KEY: 'routine',
  HABITS_KEY: 'habits',

  routineDefaults() { return { activities: [] }; },
  habitsDefaults() { return { habits: [] }; },

  getData() { return Storage.load(this.STORAGE_KEY, this.routineDefaults()); },
  saveData(d) { Storage.save(this.STORAGE_KEY, d); },

  getHabits() { return Storage.load(this.HABITS_KEY, this.habitsDefaults()); },
  saveHabits(d) { Storage.save(this.HABITS_KEY, d); },

  addActivity(a) {
    const data = this.getData();
    a.id = generateId();
    a.done = false;
    a.date = a.date || todayStr();
    data.activities.push(a);
    this.saveData(data);
    return data;
  },

  updateActivity(id, updates) {
    const data = this.getData();
    const idx = data.activities.findIndex(a => a.id === id);
    if (idx === -1) return data;
    data.activities[idx] = { ...data.activities[idx], ...updates };
    this.saveData(data);
    return data;
  },

  removeActivity(id) {
    const data = this.getData();
    data.activities = data.activities.filter(a => a.id !== id);
    this.saveData(data);
    return data;
  },

  addHabit(h) {
    const data = this.getHabits();
    h.id = generateId();
    h.streak = 0;
    h.bestStreak = 0;
    h.history = [];
    data.habits.push(h);
    this.saveHabits(data);
    return data;
  },

  toggleHabitDay(habitId, date) {
    const data = this.getHabits();
    const h = data.habits.find(h => h.id === habitId);
    if (!h) return data;
    if (!h.history) h.history = [];
    const idx = h.history.indexOf(date);
    if (idx >= 0) {
      h.history.splice(idx, 1);
    } else {
      h.history.push(date);
    }
    h.streak = this._calcStreak(h.history);
    h.bestStreak = Math.max(h.bestStreak || 0, h.streak);
    this.saveHabits(data);
    return data;
  },

  removeHabit(id) {
    const data = this.getHabits();
    data.habits = data.habits.filter(h => h.id !== id);
    this.saveHabits(data);
    return data;
  },

  _calcStreak(history) {
    if (!history || history.length === 0) return 0;
    const sorted = [...history].sort().reverse();
    let streak = 0;
    let current = new Date(todayStr());
    for (const d of sorted) {
      const diff = Math.round((current - new Date(d)) / 86400000);
      if (diff <= 1) {
        streak++;
        current = new Date(d);
      } else {
        break;
      }
    }
    return streak;
  },

  _getConsistencyScore() {
    const habits = this.getHabits().habits;
    if (habits.length === 0) return 0;
    const today = todayStr();
    let total = 0;
    habits.forEach(h => {
      if (h.history && h.history.includes(today)) total++;
    });
    return Math.round((total / habits.length) * 100);
  },

  render() {
    const data = this.getData();
    const habits = this.getHabits();
    const today = todayStr();
    const todayActivities = data.activities.filter(a => a.date === today);

    const view = document.getElementById('view-routine');
    view.innerHTML = `
      <div class="section">
        <div class="card-header">
          <h2 class="card-title">📋 Rotina</h2>
          <div class="flex gap-sm">
            <button class="btn btn-primary btn-sm" id="routAddAct">+ Atividade</button>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="kpi-grid">
          <div class="kpi"><div class="kpi-label">Atividades Hoje</div><div class="kpi-value">${todayActivities.length}</div></div>
          <div class="kpi"><div class="kpi-label">Concluídas</div><div class="kpi-value positive">${todayActivities.filter(a => a.done).length}</div></div>
          <div class="kpi"><div class="kpi-label">Progresso</div><div class="kpi-value">${todayActivities.length > 0 ? formatPercent(todayActivities.filter(a => a.done).length / todayActivities.length * 100) : '0%'}</div></div>
        </div>
      </div>

      <div class="section">
        <div class="card-header"><h3 class="card-title">Atividades de Hoje</h3></div>
        <div class="card">
          <div id="routTodayList"></div>
          <div id="routEmpty" class="empty-state" style="display:none">
            <div class="empty-state-icon">📋</div>
            <div class="empty-state-text">Nenhuma atividade para hoje</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="card-header">
          <h3 class="card-title">Hábitos</h3>
          <button class="btn btn-primary btn-sm" id="routAddHabit">+ Hábito</button>
        </div>
        <div class="card">
          <div id="routHabitsList"></div>
          <div id="routHabitsEmpty" class="empty-state" style="display:none">
            <div class="empty-state-icon">🔄</div>
            <div class="empty-state-text">Nenhum hábito registrado</div>
          </div>
        </div>
      </div>
    `;

    this._renderActivities(data);
    this._renderHabits(habits);
    this._bindEvents();
  },

  _renderActivities(data) {
    const today = todayStr();
    const acts = data.activities.filter(a => a.date === today);
    const list = document.getElementById('routTodayList');
    const empty = document.getElementById('routEmpty');
    if (!list) return;
    if (acts.length === 0) {
      list.innerHTML = '';
      if (empty) empty.style.display = '';
      return;
    }
    if (empty) empty.style.display = 'none';
    list.innerHTML = acts.map(a => `
      <div class="flex items-center justify-between" style="padding:.5rem 0;border-bottom:1px solid var(--border)">
        <div class="flex items-center gap-sm">
          <input type="checkbox" ${a.done ? 'checked' : ''} class="routToggleAct" data-id="${a.id}" style="width:auto">
          <div>
            <div class="text-sm font-bold" style="${a.done ? 'text-decoration:line-through;opacity:.6' : ''}">${a.title || 'Sem título'}</div>
            <div class="text-xs text-muted">${a.time || ''} ${a.category ? '· ' + a.category : ''} ${a.duration ? '· ' + a.duration + 'min' : ''}</div>
          </div>
        </div>
        <div class="flex gap-sm">
          <button class="btn btn-ghost btn-sm routEditAct" data-id="${a.id}">✏️</button>
          <button class="btn btn-ghost btn-sm routDelAct" data-id="${a.id}">🗑️</button>
        </div>
      </div>
    `).join('');
  },

  _renderHabits(habitsData) {
    const list = document.getElementById('routHabitsList');
    const empty = document.getElementById('routHabitsEmpty');
    if (!list) return;
    const habits = habitsData.habits || [];
    if (habits.length === 0) {
      list.innerHTML = '';
      if (empty) empty.style.display = '';
      return;
    }
    if (empty) empty.style.display = 'none';
    const today = todayStr();
    list.innerHTML = habits.map(h => {
      const isDoneToday = h.history && h.history.includes(today);
      return `
        <div class="flex items-center justify-between" style="padding:.5rem 0;border-bottom:1px solid var(--border)">
          <div class="flex items-center gap-sm">
            <input type="checkbox" ${isDoneToday ? 'checked' : ''} class="routToggleHabit" data-id="${h.id}" style="width:auto">
            <div>
              <div class="text-sm font-bold">${h.name || 'Sem nome'}</div>
              <div class="text-xs text-muted">Sequência: ${h.streak || 0} · Melhor: ${h.bestStreak || 0} · Total: ${(h.history || []).length} dias</div>
            </div>
          </div>
          <div class="flex gap-sm">
            <button class="btn btn-ghost btn-sm routDelHabit" data-id="${h.id}">🗑️</button>
          </div>
        </div>
        <div class="heatmap mb-sm" id="heatmap_${h.id}"></div>
      `;
    }).join('');

    habits.forEach(h => {
      const hm = document.getElementById('heatmap_' + h.id);
      if (!hm) return;
      let cells = '';
      for (let i = 27; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const ds = d.toISOString().slice(0, 10);
        const done = h.history && h.history.includes(ds);
        const level = done ? 'l4' : '';
        cells += `<div class="heatmap-cell ${level}" title="${ds}${done ? ' ✓' : ''}"></div>`;
      }
      hm.innerHTML = cells;
    });
  },

  _bindEvents() {
    const addAct = document.getElementById('routAddAct');
    if (addAct) addAct.onclick = () => this._showActivityModal();

    const addHabit = document.getElementById('routAddHabit');
    if (addHabit) addHabit.onclick = () => this._showHabitModal();

    document.querySelectorAll('.routToggleAct').forEach(cb => {
      cb.onchange = () => {
        this.updateActivity(cb.dataset.id, { done: cb.checked });
        this.render();
      };
    });

    document.querySelectorAll('.routEditAct').forEach(btn => {
      btn.onclick = () => this._showActivityModal(btn.dataset.id);
    });

    document.querySelectorAll('.routDelAct').forEach(btn => {
      btn.onclick = () => {
        App.confirm('Excluir esta atividade?', () => {
          this.removeActivity(btn.dataset.id);
          this.render();
          App.toast('Atividade excluída', 'success');
        });
      };
    });

    document.querySelectorAll('.routToggleHabit').forEach(cb => {
      cb.onchange = () => {
        this.toggleHabitDay(cb.dataset.id, todayStr());
        this.render();
      };
    });

    document.querySelectorAll('.routDelHabit').forEach(btn => {
      btn.onclick = () => {
        App.confirm('Excluir este hábito?', () => {
          this.removeHabit(btn.dataset.id);
          this.render();
          App.toast('Hábito excluído', 'success');
        });
      };
    });
  },

  _showActivityModal(editId) {
    const data = this.getData();
    const act = editId ? data.activities.find(a => a.id === editId) : null;
    const categories = ['Trabalho', 'Estudo', 'Exercício', 'Saúde', 'Lazer', 'Casa', 'Outros'];
    App.modal(act ? 'Editar Atividade' : 'Nova Atividade', `
      <div class="form-group">
        <label class="form-label">Título</label>
        <input type="text" id="modalActTitle" value="${act ? act.title : ''}" required>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Horário</label>
          <input type="time" id="modalActTime" value="${act ? act.time : ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Duração (min)</label>
          <input type="number" id="modalActDur" value="${act ? act.duration || '' : ''}" min="0" max="${MAX_VALUE}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Categoria</label>
          <select id="modalActCat">
            ${categories.map(c => `<option value="${c}" ${act && act.category === c ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Data</label>
          <input type="date" id="modalActDate" value="${act ? act.date : todayStr()}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Descrição</label>
        <textarea id="modalActDesc" rows="2">${act ? (act.description || '') : ''}</textarea>
      </div>
    `, [
      { label: 'Cancelar', class: 'btn-ghost', action: 'close' },
      { label: act ? 'Atualizar' : 'Adicionar', class: 'btn-primary', action: () => {
        const title = document.getElementById('modalActTitle').value.trim();
        if (!title) { App.toast('Informe o título', 'error'); return; }
        const updates = {
          title,
          time: document.getElementById('modalActTime').value,
          duration: clampNumber(document.getElementById('modalActDur').value),
          category: document.getElementById('modalActCat').value,
          date: document.getElementById('modalActDate').value || todayStr(),
          description: document.getElementById('modalActDesc').value.trim()
        };
        if (act) { this.updateActivity(act.id, updates); App.toast('Atividade atualizada', 'success'); }
        else { this.addActivity(updates); App.toast('Atividade adicionada', 'success'); }
        this.render();
        App.closeModal();
      }}
    ]);
    setTimeout(() => {
      const inp = document.getElementById('modalActDur');
      if (inp) enforceMaxValue(inp);
    }, 50);
  },

  _showHabitModal() {
    App.modal('Novo Hábito', `
      <div class="form-group">
        <label class="form-label">Nome do hábito</label>
        <input type="text" id="modalHabitName" placeholder="Ex: Estudar 30 min" required>
      </div>
    `, [
      { label: 'Cancelar', class: 'btn-ghost', action: 'close' },
      { label: 'Adicionar', class: 'btn-primary', action: () => {
        const name = document.getElementById('modalHabitName').value.trim();
        if (!name) { App.toast('Informe o nome', 'error'); return; }
        this.addHabit({ name });
        this.render();
        App.closeModal();
        App.toast('Hábito adicionado', 'success');
      }}
    ]);
  },

  getSummary() {
    const data = this.getData();
    const today = todayStr();
    const todayActs = data.activities.filter(a => a.date === today);
    return {
      total: todayActs.length,
      done: todayActs.filter(a => a.done).length
    };
  }
};
