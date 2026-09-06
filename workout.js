/* ===== Life OS — Treinos ===== */
const Workout = {
  STORAGE_KEY: 'workouts',

  defaults() { return { workouts: [] }; },

  getData() { return Storage.load(this.STORAGE_KEY, this.defaults()); },
  saveData(d) { Storage.save(this.STORAGE_KEY, d); },

  addWorkout(w) {
    const data = this.getData();
    w.id = generateId();
    w.exercises = [];
    w.status = 'pending'; // pending → in_progress → completed
    w.createdAt = todayStr();
    data.workouts.push(w);
    this.saveData(data);
    return data;
  },

  updateWorkout(id, updates) {
    const data = this.getData();
    const idx = data.workouts.findIndex(w => w.id === id);
    if (idx === -1) return data;
    data.workouts[idx] = { ...data.workouts[idx], ...updates };
    this.saveData(data);
    return data;
  },

  removeWorkout(id) {
    const data = this.getData();
    data.workouts = data.workouts.filter(w => w.id !== id);
    this.saveData(data);
    return data;
  },

  addExercise(workoutId, ex) {
    const data = this.getData();
    const w = data.workouts.find(w => w.id === workoutId);
    if (!w) return data;
    ex.id = generateId();
    ex.done = false;
    ex.sets = ex.sets || 3;
    ex.reps = ex.reps || 10;
    ex.weight = clampNumber(ex.weight) || 0;
    if (!w.exercises) w.exercises = [];
    w.exercises.push(ex);
    if (w.status === 'pending') w.status = 'in_progress';
    this.saveData(data);
    return data;
  },

  removeExercise(workoutId, exId) {
    const data = this.getData();
    const w = data.workouts.find(w => w.id === workoutId);
    if (!w) return data;
    w.exercises = (w.exercises || []).filter(e => e.id !== exId);
    this.saveData(data);
    return data;
  },

  toggleExercise(workoutId, exId) {
    const data = this.getData();
    const w = data.workouts.find(w => w.id === workoutId);
    if (!w) return data;
    const ex = (w.exercises || []).find(e => e.id === exId);
    if (ex) ex.done = !ex.done;
    this.saveData(data);
    return data;
  },

  completeWorkout(id) {
    const data = this.getData();
    const w = data.workouts.find(w => w.id === id);
    if (!w) return data;
    const allDone = (w.exercises || []).length > 0 && w.exercises.every(e => e.done);
    if (allDone) {
      w.status = 'completed';
      w.completedAt = todayStr();
    }
    this.saveData(data);
    return data;
  },

  render() {
    const data = this.getData();
    const view = document.getElementById('view-workout');
    view.innerHTML = `
      <div class="section">
        <div class="card-header">
          <h2 class="card-title">🏋️ Treino</h2>
          <button class="btn btn-primary btn-sm" id="wkAdd">+ Treino</button>
        </div>
      </div>

      <div class="kpi-grid">
        <div class="kpi"><div class="kpi-label">Total de Treinos</div><div class="kpi-value">${data.workouts.length}</div></div>
        <div class="kpi"><div class="kpi-label">Pendentes</div><div class="kpi-value">${data.workouts.filter(w => w.status === 'pending').length}</div></div>
        <div class="kpi"><div class="kpi-label">Em Andamento</div><div class="kpi-value">${data.workouts.filter(w => w.status === 'in_progress').length}</div></div>
        <div class="kpi"><div class="kpi-label">Concluídos</div><div class="kpi-value positive">${data.workouts.filter(w => w.status === 'completed').length}</div></div>
      </div>

      <div class="section">
        <div id="wkList"></div>
        <div id="wkEmpty" class="empty-state" style="display:none">
          <div class="empty-state-icon">🏋️</div>
          <div class="empty-state-text">Nenhum treino criado</div>
        </div>
      </div>
    `;

    this._renderList(data);
    this._bindEvents();
  },

  _renderList(data) {
    const list = document.getElementById('wkList');
    const empty = document.getElementById('wkEmpty');
    if (!list) return;
    if (data.workouts.length === 0) {
      list.innerHTML = '';
      if (empty) empty.style.display = '';
      return;
    }
    if (empty) empty.style.display = 'none';

    const statusBadge = (s) => {
      const m = { pending: 'badge-warning', in_progress: 'badge-info', completed: 'badge-success' };
      const l = { pending: 'Pendente', in_progress: 'Em andamento', completed: 'Concluído' };
      return `<span class="badge ${m[s] || 'badge-info'}">${l[s] || s}</span>`;
    };

    list.innerHTML = data.workouts.map(w => {
      const exs = w.exercises || [];
      const doneCount = exs.filter(e => e.done).length;
      const totalWeight = exs.reduce((sum, e) => sum + (e.done ? (e.weight || 0) * (e.sets || 0) * (e.reps || 0) : 0), 0);
      return `
        <div class="card mb-md">
          <div class="card-header">
            <div>
              <span class="card-title">${w.name || 'Sem nome'}</span>
              ${statusBadge(w.status)}
              <span class="text-xs text-muted" style="margin-left:.5rem">${formatDate(w.createdAt)}</span>
            </div>
            <div class="flex gap-sm">
              <button class="btn btn-ghost btn-sm wkEdit" data-id="${w.id}">✏️</button>
              <button class="btn btn-ghost btn-sm wkDel" data-id="${w.id}">🗑️</button>
            </div>
          </div>
          <div class="text-xs text-muted mb-sm">${exs.length > 0 ? `${doneCount}/${exs.length} exercícios` : 'Nenhum exercício'} · ${totalWeight > 0 ? formatCurrency(totalWeight) + ' carga total' : ''}</div>
          <div class="progress mb-sm"><div class="progress-bar ${doneCount === exs.length && exs.length > 0 ? 'success' : ''}" style="width:${exs.length > 0 ? (doneCount / exs.length * 100) : 0}%"></div></div>
          <div id="wkExercises_${w.id}"></div>
          <div class="flex gap-sm mt-md">
            <button class="btn btn-primary btn-sm wkAddEx" data-id="${w.id}">+ Exercício</button>
            ${w.status !== 'completed' ? `<button class="btn btn-success btn-sm wkComplete" data-id="${w.id}" ${doneCount < exs.length || exs.length === 0 ? 'disabled style="opacity:.5;cursor:not-allowed"' : ''}>Finalizar Treino</button>` : ''}
          </div>
        </div>
      `;
    }).join('');

    data.workouts.forEach(w => {
      const exContainer = document.getElementById('wkExercises_' + w.id);
      if (!exContainer) return;
      const exs = w.exercises || [];
      if (exs.length === 0) {
        exContainer.innerHTML = '<div class="text-xs text-muted">Adicione exercícios para este treino</div>';
        return;
      }
      exContainer.innerHTML = `
        <table>
          <thead><tr><th></th><th>Exercício</th><th>Séries</th><th>Reps</th><th>Peso</th><th></th></tr></thead>
          <tbody>
            ${exs.map(e => `
              <tr>
                <td><input type="checkbox" class="wkToggleEx" data-wid="${w.id}" data-eid="${e.id}" ${e.done ? 'checked' : ''} style="width:auto"></td>
                <td style="${e.done ? 'text-decoration:line-through;opacity:.6' : ''}">${e.name || '—'}</td>
                <td>${e.sets}</td>
                <td>${e.reps}</td>
                <td>${e.weight ? e.weight + ' kg' : '—'}</td>
                <td><button class="btn btn-ghost btn-sm wkDelEx" data-wid="${w.id}" data-eid="${e.id}">🗑️</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    });
  },

  _bindEvents() {
    const addBtn = document.getElementById('wkAdd');
    if (addBtn) addBtn.onclick = () => this._showWorkoutModal();

    document.querySelectorAll('.wkEdit').forEach(btn => {
      btn.onclick = () => this._showWorkoutModal(btn.dataset.id);
    });
    document.querySelectorAll('.wkDel').forEach(btn => {
      btn.onclick = () => {
        App.confirm('Excluir este treino?', () => {
          this.removeWorkout(btn.dataset.id);
          this.render();
          App.toast('Treino excluído', 'success');
        });
      };
    });
    document.querySelectorAll('.wkAddEx').forEach(btn => {
      btn.onclick = () => this._showExerciseModal(btn.dataset.id);
    });
    document.querySelectorAll('.wkToggleEx').forEach(cb => {
      cb.onchange = () => {
        this.toggleExercise(cb.dataset.wid, cb.dataset.eid);
        this.render();
      };
    });
    document.querySelectorAll('.wkDelEx').forEach(btn => {
      btn.onclick = () => {
        this.removeExercise(btn.dataset.wid, btn.dataset.eid);
        this.render();
        App.toast('Exercício removido', 'success');
      };
    });
    document.querySelectorAll('.wkComplete').forEach(btn => {
      btn.onclick = () => {
        this.completeWorkout(btn.dataset.id);
        this.render();
        App.toast('Treino finalizado com sucesso!', 'success');
      };
    });
  },

  _showWorkoutModal(editId) {
    const data = this.getData();
    const w = editId ? data.workouts.find(w => w.id === editId) : null;
    App.modal(w ? 'Editar Treino' : 'Novo Treino', `
      <div class="form-group">
        <label class="form-label">Nome do treino</label>
        <input type="text" id="modalWkName" value="${w ? w.name : ''}" placeholder="Ex: Peito e Tríceps" required>
      </div>
    `, [
      { label: 'Cancelar', class: 'btn-ghost', action: 'close' },
      { label: w ? 'Atualizar' : 'Criar', class: 'btn-primary', action: () => {
        const name = document.getElementById('modalWkName').value.trim();
        if (!name) { App.toast('Informe o nome', 'error'); return; }
        if (w) { this.updateWorkout(w.id, { name }); App.toast('Treino atualizado', 'success'); }
        else { this.addWorkout({ name }); App.toast('Treino criado', 'success'); }
        this.render();
        App.closeModal();
      }}
    ]);
  },

  _showExerciseModal(workoutId) {
    App.modal('Novo Exercício', `
      <div class="form-group">
        <label class="form-label">Nome do exercício</label>
        <input type="text" id="modalExName" placeholder="Ex: Supino Reto" required>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Séries</label>
          <input type="number" id="modalExSets" value="3" min="1" max="100">
        </div>
        <div class="form-group">
          <label class="form-label">Repetições</label>
          <input type="number" id="modalExReps" value="10" min="1" max="100">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Peso (kg)</label>
        <input type="number" id="modalExWeight" value="0" min="0" max="${MAX_VALUE}" step="0.5">
      </div>
    `, [
      { label: 'Cancelar', class: 'btn-ghost', action: 'close' },
      { label: 'Adicionar', class: 'btn-primary', action: () => {
        const name = document.getElementById('modalExName').value.trim();
        if (!name) { App.toast('Informe o nome', 'error'); return; }
        this.addExercise(workoutId, {
          name,
          sets: clampNumber(document.getElementById('modalExSets').value) || 3,
          reps: clampNumber(document.getElementById('modalExReps').value) || 10,
          weight: clampNumber(document.getElementById('modalExWeight').value)
        });
        this.render();
        App.closeModal();
        App.toast('Exercício adicionado', 'success');
      }}
    ]);
    setTimeout(() => {
      const inp = document.getElementById('modalExWeight');
      if (inp) enforceMaxValue(inp);
    }, 50);
  },

  getSummary() {
    const data = this.getData();
    const today = todayStr();
    return {
      total: data.workouts.length,
      completed: data.workouts.filter(w => w.status === 'completed').length,
      completedToday: data.workouts.filter(w => w.status === 'completed' && w.completedAt === today).length
    };
  },

  getCompletedWorkouts() {
    const data = this.getData();
    return data.workouts.filter(w => w.status === 'completed');
  }
};
