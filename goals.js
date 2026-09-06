/* ===== Life OS — Metas ===== */
const Goals = {
  STORAGE_KEY: 'goals',

  defaults() { return { goals: [] }; },

  getData() { return Storage.load(this.STORAGE_KEY, this.defaults()); },
  saveData(d) { Storage.save(this.STORAGE_KEY, d); },

  addGoal(g) {
    const data = this.getData();
    g.id = generateId();
    g.progress = 0;
    g.status = 'pending';
    g.createdAt = todayStr();
    data.goals.push(g);
    this.saveData(data);
    return data;
  },

  updateGoal(id, updates) {
    const data = this.getData();
    const idx = data.goals.findIndex(g => g.id === id);
    if (idx === -1) return data;
    data.goals[idx] = { ...data.goals[idx], ...updates };
    if (data.goals[idx].progress >= 100) {
      data.goals[idx].status = 'completed';
      data.goals[idx].completedAt = todayStr();
    } else if (data.goals[idx].progress > 0) {
      data.goals[idx].status = 'in_progress';
    }
    this.saveData(data);
    return data;
  },

  removeGoal(id) {
    const data = this.getData();
    data.goals = data.goals.filter(g => g.id !== id);
    this.saveData(data);
    return data;
  },

  render() {
    const data = this.getData();
    const view = document.getElementById('view-goals');
    view.innerHTML = `
      <div class="section">
        <div class="card-header">
          <h2 class="card-title">🎯 Metas</h2>
          <button class="btn btn-primary btn-sm" id="goalAdd">+ Meta</button>
        </div>
      </div>

      <div class="kpi-grid">
        <div class="kpi"><div class="kpi-label">Total</div><div class="kpi-value">${data.goals.length}</div></div>
        <div class="kpi"><div class="kpi-label">Pendentes</div><div class="kpi-value">${data.goals.filter(g => g.status === 'pending').length}</div></div>
        <div class="kpi"><div class="kpi-label">Em Andamento</div><div class="kpi-value">${data.goals.filter(g => g.status === 'in_progress').length}</div></div>
        <div class="kpi"><div class="kpi-label">Concluídas</div><div class="kpi-value positive">${data.goals.filter(g => g.status === 'completed').length}</div></div>
      </div>

      <div class="section">
        <div id="goalList"></div>
        <div id="goalEmpty" class="empty-state" style="display:none">
          <div class="empty-state-icon">🎯</div>
          <div class="empty-state-text">Nenhuma meta criada</div>
        </div>
      </div>
    `;

    this._renderList(data);
    this._bindEvents();
  },

  _renderList(data) {
    const list = document.getElementById('goalList');
    const empty = document.getElementById('goalEmpty');
    if (!list) return;
    if (data.goals.length === 0) {
      list.innerHTML = '';
      if (empty) empty.style.display = '';
      return;
    }
    if (empty) empty.style.display = 'none';

    const typeColors = { financeira: 'badge-success', saúde: 'badge-info', estudos: 'badge-primary', trabalho: 'badge-warning', pessoal: 'badge-danger' };
    const statusBadge = (s) => {
      const m = { pending: 'badge-warning', in_progress: 'badge-info', completed: 'badge-success' };
      const l = { pending: 'Pendente', in_progress: 'Em andamento', completed: 'Concluída' };
      return `<span class="badge ${m[s] || 'badge-info'}">${l[s] || s}</span>`;
    };

    list.innerHTML = data.goals.map(g => `
      <div class="card mb-md">
        <div class="card-header">
          <div>
            <span class="card-title">${g.title || 'Sem título'}</span>
            ${statusBadge(g.status)}
            <span class="badge ${typeColors[g.type] || 'badge-info'}" style="margin-left:.25rem">${g.type || 'pessoal'}</span>
          </div>
          <div class="flex gap-sm">
            <button class="btn btn-ghost btn-sm goalEdit" data-id="${g.id}">✏️</button>
            <button class="btn btn-ghost btn-sm goalDel" data-id="${g.id}">🗑️</button>
          </div>
        </div>
        <div class="text-xs text-muted mb-sm">${g.description || ''} ${g.dueDate ? ' · Prazo: ' + formatDate(g.dueDate) : ''}</div>
        <div class="flex items-center gap-sm mb-sm">
          <div class="progress" style="flex:1"><div class="progress-bar ${g.progress >= 100 ? 'success' : ''}" style="width:${g.progress || 0}%"></div></div>
          <span class="text-xs font-bold">${g.progress || 0}%</span>
        </div>
        <div class="flex gap-sm">
          ${g.status !== 'completed' ? `<button class="btn btn-ghost btn-sm goalProgress" data-id="${g.id}">Atualizar Progresso</button>` : ''}
        </div>
      </div>
    `).join('');
  },

  _bindEvents() {
    const addBtn = document.getElementById('goalAdd');
    if (addBtn) addBtn.onclick = () => this._showGoalModal();

    document.querySelectorAll('.goalEdit').forEach(btn => {
      btn.onclick = () => this._showGoalModal(btn.dataset.id);
    });
    document.querySelectorAll('.goalDel').forEach(btn => {
      btn.onclick = () => {
        App.confirm('Excluir esta meta?', () => {
          this.removeGoal(btn.dataset.id);
          this.render();
          App.toast('Meta excluída', 'success');
        });
      };
    });
    document.querySelectorAll('.goalProgress').forEach(btn => {
      btn.onclick = () => this._showProgressModal(btn.dataset.id);
    });
  },

  _showGoalModal(editId) {
    const data = this.getData();
    const g = editId ? data.goals.find(g => g.id === editId) : null;
    const types = ['financeira', 'saúde', 'estudos', 'trabalho', 'pessoal'];

    App.modal(g ? 'Editar Meta' : 'Nova Meta', `
      <div class="form-group">
        <label class="form-label">Título</label>
        <input type="text" id="modalGoalTitle" value="${g ? g.title : ''}" required>
      </div>
      <div class="form-group">
        <label class="form-label">Descrição</label>
        <textarea id="modalGoalDesc" rows="2">${g ? (g.description || '') : ''}</textarea>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Tipo</label>
          <select id="modalGoalType">
            ${types.map(t => `<option value="${t}" ${g && g.type === t ? 'selected' : ''}>${t.charAt(0).toUpperCase() + t.slice(1)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Prazo</label>
          <input type="date" id="modalGoalDue" value="${g ? g.dueDate || '' : ''}">
        </div>
      </div>
    `, [
      { label: 'Cancelar', class: 'btn-ghost', action: 'close' },
      { label: g ? 'Atualizar' : 'Criar', class: 'btn-primary', action: () => {
        const title = document.getElementById('modalGoalTitle').value.trim();
        if (!title) { App.toast('Informe o título', 'error'); return; }
        const updates = {
          title,
          description: document.getElementById('modalGoalDesc').value.trim(),
          type: document.getElementById('modalGoalType').value,
          dueDate: document.getElementById('modalGoalDue').value
        };
        if (g) { this.updateGoal(g.id, updates); App.toast('Meta atualizada', 'success'); }
        else { this.addGoal(updates); App.toast('Meta criada', 'success'); }
        this.render();
        App.closeModal();
      }}
    ]);
  },

  _showProgressModal(goalId) {
    const data = this.getData();
    const g = data.goals.find(g => g.id === goalId);
    if (!g) return;

    App.modal('Atualizar Progresso', `
      <div class="form-group">
        <label class="form-label">Progresso (%)</label>
        <input type="number" id="modalGoalProgress" value="${g.progress || 0}" min="0" max="100" step="1">
        <div class="form-hint">0 a 100</div>
      </div>
    `, [
      { label: 'Cancelar', class: 'btn-ghost', action: 'close' },
      { label: 'Salvar', class: 'btn-primary', action: () => {
        const val = clampNumber(document.getElementById('modalGoalProgress').value);
        const pct = Math.min(100, Math.max(0, Math.round(val)));
        this.updateGoal(goalId, { progress: pct });
        this.render();
        App.closeModal();
        App.toast(pct >= 100 ? 'Meta concluída!' : 'Progresso atualizado', pct >= 100 ? 'success' : 'info');
      }}
    ]);
  },

  getSummary() {
    const data = this.getData();
    return {
      total: data.goals.length,
      pending: data.goals.filter(g => g.status === 'pending').length,
      in_progress: data.goals.filter(g => g.status === 'in_progress').length,
      completed: data.goals.filter(g => g.status === 'completed').length
    };
  }
};
