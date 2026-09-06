/* ===== Life OS — Tarefas (Kanban) ===== */
const Tasks = {
  STORAGE_KEY: 'tasks',

  defaults() { return { tasks: [] }; },

  getData() { return Storage.load(this.STORAGE_KEY, this.defaults()); },
  saveData(d) { Storage.save(this.STORAGE_KEY, d); },

  addTask(t) {
    const data = this.getData();
    t.id = generateId();
    t.status = t.status || 'todo';
    t.createdAt = todayStr();
    data.tasks.push(t);
    this.saveData(data);
    return data;
  },

  updateTask(id, updates) {
    const data = this.getData();
    const idx = data.tasks.findIndex(t => t.id === id);
    if (idx === -1) return data;
    data.tasks[idx] = { ...data.tasks[idx], ...updates };
    this.saveData(data);
    return data;
  },

  removeTask(id) {
    const data = this.getData();
    data.tasks = data.tasks.filter(t => t.id !== id);
    this.saveData(data);
    return data;
  },

  moveTask(id, newStatus) {
    return this.updateTask(id, { status: newStatus });
  },

  render() {
    const data = this.getData();
    const view = document.getElementById('view-tasks');
    view.innerHTML = `
      <div class="section">
        <div class="card-header">
          <h2 class="card-title">✅ Tarefas</h2>
          <div class="flex gap-sm">
            <select id="taskFilterStatus" style="width:auto">
              <option value="all">Todos</option>
              <option value="todo">A fazer</option>
              <option value="doing">Em andamento</option>
              <option value="done">Concluído</option>
            </select>
            <select id="taskFilterPriority" style="width:auto">
              <option value="all">Todas prioridades</option>
              <option value="urgente">Urgente</option>
              <option value="alta">Alta</option>
              <option value="média">Média</option>
              <option value="baixa">Baixa</option>
            </select>
            <button class="btn btn-primary btn-sm" id="taskAdd">+ Tarefa</button>
          </div>
        </div>
      </div>

      <div class="kpi-grid">
        <div class="kpi"><div class="kpi-label">Total</div><div class="kpi-value">${data.tasks.length}</div></div>
        <div class="kpi"><div class="kpi-label">A Fazer</div><div class="kpi-value">${data.tasks.filter(t => t.status === 'todo').length}</div></div>
        <div class="kpi"><div class="kpi-label">Em Andamento</div><div class="kpi-value">${data.tasks.filter(t => t.status === 'doing').length}</div></div>
        <div class="kpi"><div class="kpi-label">Concluído</div><div class="kpi-value positive">${data.tasks.filter(t => t.status === 'done').length}</div></div>
      </div>

      <div class="kanban" id="taskKanban">
        <div class="kanban-col" data-status="todo">
          <div class="kanban-col-header">A Fazer <span class="count" id="countTodo"></span></div>
          <div class="kanban-cards" id="colTodo"></div>
        </div>
        <div class="kanban-col" data-status="doing">
          <div class="kanban-col-header">Em Andamento <span class="count" id="countDoing"></span></div>
          <div class="kanban-cards" id="colDoing"></div>
        </div>
        <div class="kanban-col" data-status="done">
          <div class="kanban-col-header">Concluído <span class="count" id="countDone"></span></div>
          <div class="kanban-cards" id="colDone"></div>
        </div>
      </div>
    `;

    this._renderKanban(data);
    this._bindEvents();
  },

  _renderKanban(data) {
    const filterStatus = document.getElementById('taskFilterStatus').value;
    const filterPriority = document.getElementById('taskFilterPriority').value;

    const filter = (tasks) => tasks.filter(t => {
      if (filterStatus !== 'all' && t.status !== filterStatus) return false;
      if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
      return true;
    });

    const todo = filter(data.tasks.filter(t => t.status === 'todo'));
    const doing = filter(data.tasks.filter(t => t.status === 'doing'));
    const done = filter(data.tasks.filter(t => t.status === 'done'));

    document.getElementById('countTodo').textContent = todo.length;
    document.getElementById('countDoing').textContent = doing.length;
    document.getElementById('countDone').textContent = done.length;

    const renderCard = (t) => {
      const priBadge = { urgente: 'badge-danger', alta: 'badge-warning', média: 'badge-info', baixa: 'badge-success' };
      return `
        <div class="kanban-card" draggable="true" data-id="${t.id}">
          <div class="kanban-card-title">${t.title || 'Sem título'}</div>
          <div class="kanban-card-meta">
            <span class="badge ${priBadge[t.priority] || 'badge-info'}">${t.priority || 'média'}</span>
            ${t.category ? `<span class="badge badge-primary">${t.category}</span>` : ''}
            ${t.dueDate ? `<span class="text-xs text-muted">${formatDate(t.dueDate)}</span>` : ''}
          </div>
          <div class="flex gap-sm mt-md">
            <button class="btn btn-ghost btn-sm taskEdit" data-id="${t.id}">✏️</button>
            <button class="btn btn-ghost btn-sm taskDel" data-id="${t.id}">🗑️</button>
          </div>
        </div>
      `;
    };

    document.getElementById('colTodo').innerHTML = todo.map(renderCard).join('') || '<div class="empty-state"><div class="empty-state-text text-xs">Nenhuma</div></div>';
    document.getElementById('colDoing').innerHTML = doing.map(renderCard).join('') || '<div class="empty-state"><div class="empty-state-text text-xs">Nenhuma</div></div>';
    document.getElementById('colDone').innerHTML = done.map(renderCard).join('') || '<div class="empty-state"><div class="empty-state-text text-xs">Nenhuma</div></div>';

    this._initDragDrop();
  },

  _initDragDrop() {
    const cards = document.querySelectorAll('.kanban-card');
    const cols = document.querySelectorAll('.kanban-cards');

    cards.forEach(card => {
      card.addEventListener('dragstart', (e) => {
        card.classList.add('dragging');
        e.dataTransfer.setData('text/plain', card.dataset.id);
      });
      card.addEventListener('dragend', () => card.classList.remove('dragging'));
    });

    cols.forEach(col => {
      col.addEventListener('dragover', (e) => {
        e.preventDefault();
        col.classList.add('drag-over');
      });
      col.addEventListener('dragleave', () => col.classList.remove('drag-over'));
      col.addEventListener('drop', (e) => {
        e.preventDefault();
        col.classList.remove('drag-over');
        const taskId = e.dataTransfer.getData('text/plain');
        const status = col.closest('.kanban-col').dataset.status;
        if (taskId && status) {
          this.moveTask(taskId, status);
          this.render();
          App.toast('Tarefa movida', 'info');
        }
      });
    });
  },

  _bindEvents() {
    const addBtn = document.getElementById('taskAdd');
    if (addBtn) addBtn.onclick = () => this._showTaskModal();

    const fStatus = document.getElementById('taskFilterStatus');
    const fPriority = document.getElementById('taskFilterPriority');
    if (fStatus) fStatus.onchange = () => this._renderKanban(this.getData());
    if (fPriority) fPriority.onchange = () => this._renderKanban(this.getData());

    document.querySelectorAll('.taskEdit').forEach(btn => {
      btn.onclick = (e) => { e.stopPropagation(); this._showTaskModal(btn.dataset.id); };
    });
    document.querySelectorAll('.taskDel').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        App.confirm('Excluir esta tarefa?', () => {
          this.removeTask(btn.dataset.id);
          this.render();
          App.toast('Tarefa excluída', 'success');
        });
      };
    });
  },

  _showTaskModal(editId) {
    const data = this.getData();
    const task = editId ? data.tasks.find(t => t.id === editId) : null;
    const cats = ['Trabalho', 'Estudos', 'Pessoal', 'Casa', 'Saúde', 'Outros'];

    App.modal(task ? 'Editar Tarefa' : 'Nova Tarefa', `
      <div class="form-group">
        <label class="form-label">Título</label>
        <input type="text" id="modalTaskTitle" value="${task ? task.title : ''}" required>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Prioridade</label>
          <select id="modalTaskPri">
            ${['baixa', 'média', 'alta', 'urgente'].map(p => `<option value="${p}" ${task && task.priority === p ? 'selected' : ''}>${p.charAt(0).toUpperCase() + p.slice(1)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Categoria</label>
          <select id="modalTaskCat">
            ${cats.map(c => `<option value="${c}" ${task && task.category === c ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Status</label>
          <select id="modalTaskStatus">
            <option value="todo" ${task && task.status === 'todo' ? 'selected' : ''}>A fazer</option>
            <option value="doing" ${task && task.status === 'doing' ? 'selected' : ''}>Em andamento</option>
            <option value="done" ${task && task.status === 'done' ? 'selected' : ''}>Concluído</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Data limite</label>
          <input type="date" id="modalTaskDue" value="${task ? task.dueDate || '' : ''}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Descrição</label>
        <textarea id="modalTaskDesc" rows="2">${task ? (task.description || '') : ''}</textarea>
      </div>
    `, [
      { label: 'Cancelar', class: 'btn-ghost', action: 'close' },
      { label: task ? 'Atualizar' : 'Adicionar', class: 'btn-primary', action: () => {
        const title = document.getElementById('modalTaskTitle').value.trim();
        if (!title) { App.toast('Informe o título', 'error'); return; }
        const updates = {
          title,
          priority: document.getElementById('modalTaskPri').value,
          category: document.getElementById('modalTaskCat').value,
          status: document.getElementById('modalTaskStatus').value,
          dueDate: document.getElementById('modalTaskDue').value,
          description: document.getElementById('modalTaskDesc').value.trim()
        };
        if (task) { this.updateTask(task.id, updates); App.toast('Tarefa atualizada', 'success'); }
        else { this.addTask(updates); App.toast('Tarefa adicionada', 'success'); }
        this.render();
        App.closeModal();
      }}
    ]);
  },

  getSummary() {
    const data = this.getData();
    return {
      total: data.tasks.length,
      todo: data.tasks.filter(t => t.status === 'todo').length,
      doing: data.tasks.filter(t => t.status === 'doing').length,
      done: data.tasks.filter(t => t.status === 'done').length
    };
  }
};
