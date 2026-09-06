/* ===== Life OS — Relatórios ===== */
const Reports = {
  render() {
    const fin = Finances.getData();
    const tasks = Tasks.getData();
    const workouts = Workout.getData();
    const goals = Goals.getData();
    const routine = Routine.getData();
    const diet = Diet.getData();

    const today = todayStr();
    const finSummary = Finances.getSummary();
    const taskSummary = Tasks.getSummary();
    const workoutSummary = Workout.getSummary();
    const goalSummary = Goals.getSummary();
    const routineSummary = Routine.getSummary();
    const dietSummary = Diet.getSummary();

    const completedWorkouts = workouts.workouts.filter(w => w.status === 'completed');
    const completedThisMonth = completedWorkouts.filter(w => {
      const d = w.completedAt || w.createdAt;
      return d && d >= startOfMonth();
    });

    const view = document.getElementById('view-reports');
    view.innerHTML = `
      <div class="section">
        <div class="card-header">
          <h2 class="card-title">📊 Relatórios</h2>
          <div class="flex gap-sm">
            <button class="btn btn-ghost btn-sm" id="repExportCSV">Exportar CSV</button>
            <button class="btn btn-ghost btn-sm" id="repPrint">Imprimir</button>
          </div>
        </div>
      </div>

      <div class="kpi-grid">
        <div class="kpi"><div class="kpi-label">Renda Mensal</div><div class="kpi-value">${formatCurrency(finSummary.income)}</div></div>
        <div class="kpi"><div class="kpi-label">Gastos Mensais</div><div class="kpi-value negative">${formatCurrency(finSummary.totalExpenses)}</div></div>
        <div class="kpi"><div class="kpi-label">Disponível</div><div class="kpi-value ${finSummary.available >= 0 ? 'positive' : 'negative'}">${formatCurrency(finSummary.available)}</div></div>
        <div class="kpi"><div class="kpi-label">Treinos Concluídos</div><div class="kpi-value positive">${workoutSummary.completed}</div></div>
        <div class="kpi"><div class="kpi-label">Tarefas Concluídas</div><div class="kpi-value">${taskSummary.done}</div></div>
        <div class="kpi"><div class="kpi-label">Metas Concluídas</div><div class="kpi-value">${goalSummary.completed}</div></div>
        <div class="kpi"><div class="kpi-label">Hábitos Hoje</div><div class="kpi-value">${routineSummary.done}/${routineSummary.total}</div></div>
      </div>

      <div class="section">
        <div class="card-header"><h3 class="card-title">Financeiro</h3></div>
        <div class="grid-2">
          <div class="card">
            <div class="card-header"><span class="text-sm font-bold">Gastos por Categoria</span></div>
            <div class="chart-container"><canvas id="repChartCat"></canvas></div>
          </div>
          <div class="card">
            <div class="card-header"><span class="text-sm font-bold">Evolução Mensal</span></div>
            <div class="chart-container"><canvas id="repChartEvol"></canvas></div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="card-header"><h3 class="card-title">Tarefas</h3></div>
        <div class="card">
          <div class="grid-2">
            <div><div class="text-sm font-bold mb-sm">Status</div>
              <div class="text-xs text-muted">A fazer: ${taskSummary.todo}</div>
              <div class="text-xs text-muted">Em andamento: ${taskSummary.doing}</div>
              <div class="text-xs text-muted">Concluído: ${taskSummary.done}</div>
            </div>
            <div class="chart-container"><canvas id="repChartTasks"></canvas></div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="card-header"><h3 class="card-title">Treinos</h3></div>
        <div class="card">
          <div class="text-xs text-muted mb-sm">Treinos concluídos: ${workoutSummary.completed} · Hoje: ${workoutSummary.completedToday} · Este mês: ${completedThisMonth.length}</div>
          ${completedWorkouts.length > 0 ? `
            <table>
              <thead><tr><th>Treino</th><th>Data</th></tr></thead>
              <tbody>
                ${completedWorkouts.slice(-10).reverse().map(w => `
                  <tr><td>${w.name}</td><td>${formatDate(w.completedAt || w.createdAt)}</td></tr>
                `).join('')}
              </tbody>
            </table>
          ` : '<div class="empty-state"><div class="empty-state-text text-xs">Nenhum treino concluído</div></div>'}
        </div>
      </div>

      <div class="section">
        <div class="card-header"><h3 class="card-title">Metas</h3></div>
        <div class="card">
          <div class="text-xs text-muted mb-sm">Pendentes: ${goalSummary.pending} · Em andamento: ${goalSummary.in_progress} · Concluídas: ${goalSummary.completed}</div>
          ${goals.goals.length > 0 ? `
            <table>
              <thead><tr><th>Meta</th><th>Tipo</th><th>Progresso</th><th>Status</th></tr></thead>
              <tbody>
                ${goals.goals.map(g => `
                  <tr>
                    <td>${g.title}</td>
                    <td><span class="badge badge-info">${g.type || 'pessoal'}</span></td>
                    <td>
                      <div class="flex items-center gap-sm">
                        <div class="progress" style="width:80px"><div class="progress-bar ${g.progress >= 100 ? 'success' : ''}" style="width:${g.progress || 0}%"></div></div>
                        <span class="text-xs">${g.progress || 0}%</span>
                      </div>
                    </td>
                    <td><span class="badge ${g.status === 'completed' ? 'badge-success' : g.status === 'in_progress' ? 'badge-info' : 'badge-warning'}">${g.status === 'completed' ? 'Concluída' : g.status === 'in_progress' ? 'Em andamento' : 'Pendente'}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : '<div class="empty-state"><div class="empty-state-text text-xs">Nenhuma meta registrada</div></div>'}
        </div>
      </div>
    `;

    this._renderCharts(fin, tasks);
    this._bindEvents();
  },

  _renderCharts(fin, tasks) {
    const c = Charts.getColors();

    const catMap = {};
    fin.expenses.forEach(e => {
      const cat = e.category || 'Outros';
      catMap[cat] = (catMap[cat] || 0) + (e.value || 0);
    });
    const catLabels = Object.keys(catMap);
    const catValues = Object.values(catMap);
    if (catLabels.length > 0) {
      Charts.doughnut('repChartCat', catLabels, catValues);
    }

    const monthly = {};
    fin.expenses.forEach(e => {
      const m = (e.date || '').slice(0, 7);
      if (!m) return;
      monthly[m] = (monthly[m] || 0) + (e.value || 0);
    });
    const months = Object.keys(monthly).sort();
    if (months.length > 0) {
      Charts.bar('repChartEvol', months, [{ label: 'Gastos', data: months.map(m => monthly[m]), backgroundColor: c.primary }]);
    }

    const taskData = tasks.tasks;
    Charts.doughnut('repChartTasks', ['A fazer', 'Em andamento', 'Concluído'],
      [taskData.filter(t => t.status === 'todo').length, taskData.filter(t => t.status === 'doing').length, taskData.filter(t => t.status === 'done').length]);
  },

  _bindEvents() {
    const csvBtn = document.getElementById('repExportCSV');
    if (csvBtn) csvBtn.onclick = () => this._exportCSV();

    const printBtn = document.getElementById('repPrint');
    if (printBtn) printBtn.onclick = () => window.print();
  },

  _exportCSV() {
    const fin = Finances.getData();
    let csv = 'Seção,Campo,Valor\n';
    csv += `Financeiro,Renda,${fin.income}\n`;
    csv += `Financeiro,Total Gastos,${Finances.totalExpenses(fin)}\n`;
    fin.expenses.forEach(e => {
      csv += `Despesa,${e.name},${e.value},${e.category},${e.type},${e.date}\n`;
    });

    const tasks = Tasks.getData();
    tasks.tasks.forEach(t => {
      csv += `Tarefa,${t.title},${t.status},${t.priority},${t.category}\n`;
    });

    const workouts = Workout.getData();
    workouts.workouts.forEach(w => {
      csv += `Treino,${w.name},${w.status},${w.completedAt || ''}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'life-os-relatorio.csv';
    link.click();
    URL.revokeObjectURL(link.href);
    App.toast('CSV exportado', 'success');
  }
};
