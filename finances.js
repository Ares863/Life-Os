/* ===== Life OS — Finanças ===== */
const Finances = {
  STORAGE_KEY: 'finances',

  defaults() {
    return {
      income: 0,
      budget: {
        necessidades: 50,
        desejos: 20,
        investimentos: 15,
        reserva: 10,
        outros: 5
      },
      expenses: []
    };
  },

  getData() {
    return Storage.load(this.STORAGE_KEY, this.defaults());
  },

  saveData(data) {
    Storage.save(this.STORAGE_KEY, data);
  },

  addExpense(expense) {
    const data = this.getData();
    expense.id = generateId();
    expense.date = expense.date || todayStr();
    expense.value = clampNumber(expense.value);
    data.expenses.push(expense);
    this.saveData(data);
    return data;
  },

  updateExpense(id, updates) {
    const data = this.getData();
    const idx = data.expenses.findIndex(e => e.id === id);
    if (idx === -1) return data;
    data.expenses[idx] = { ...data.expenses[idx], ...updates, value: clampNumber(updates.value ?? data.expenses[idx].value) };
    this.saveData(data);
    return data;
  },

  removeExpense(id) {
    const data = this.getData();
    data.expenses = data.expenses.filter(e => e.id !== id);
    this.saveData(data);
    return data;
  },

  totalExpenses(data, from, to) {
    return data.expenses
      .filter(e => {
        if (from && e.date < from) return false;
        if (to && e.date > to) return false;
        return true;
      })
      .reduce((sum, e) => sum + (e.value || 0), 0);
  },

  expensesByCategory(data, from, to) {
    const map = {};
    data.expenses.forEach(e => {
      if (from && e.date < from) return;
      if (to && e.date > to) return;
      const cat = e.category || 'Outros';
      map[cat] = (map[cat] || 0) + (e.value || 0);
    });
    return map;
  },

  budgetValues(data) {
    const inc = data.income || 0;
    return Object.entries(data.budget).map(([key, pct]) => ({
      key,
      label: key.charAt(0).toUpperCase() + key.slice(1),
      percent: pct,
      value: inc * pct / 100
    }));
  },

  render() {
    const data = this.getData();
    const inc = data.income || 0;
    const totalExp = this.totalExpenses(data);
    const available = inc - totalExp;
    const saved = Math.max(0, available);

    const view = document.getElementById('view-finances');
    view.innerHTML = `
      <div class="section">
        <div class="card-header">
          <h2 class="card-title">💰 Finanças</h2>
          <div class="flex gap-sm">
            <button class="btn btn-primary btn-sm" id="finSetIncome">Definir Renda</button>
            <button class="btn btn-primary btn-sm" id="finAddExpense">+ Despesa</button>
            <button class="btn btn-ghost btn-sm" id="finEditBudget">Orçamento</button>
          </div>
        </div>
      </div>

      <div class="kpi-grid">
        <div class="kpi"><div class="kpi-label">Renda Mensal</div><div class="kpi-value">${formatCurrency(inc)}</div></div>
        <div class="kpi"><div class="kpi-label">Total Gasto</div><div class="kpi-value negative">${formatCurrency(totalExp)}</div></div>
        <div class="kpi"><div class="kpi-label">Disponível</div><div class="kpi-value ${available >= 0 ? 'positive' : 'negative'}">${formatCurrency(available)}</div></div>
        <div class="kpi"><div class="kpi-label">Economizado</div><div class="kpi-value positive">${formatCurrency(saved)}</div></div>
      </div>

      <div class="section">
        <div class="card-header"><h2 class="card-title">Distribuição do Orçamento</h2></div>
        <div class="card">
          <div class="grid-2">
            <div class="chart-container"><canvas id="chartBudget"></canvas></div>
            <div id="budgetDetails"></div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="flex items-center justify-between mb-sm">
          <h3 class="card-title">Despesas</h3>
          <div class="flex gap-sm">
            <select id="finPeriod" style="width:auto">
              <option value="month">Mês</option>
              <option value="week">Semana</option>
              <option value="3months">3 meses</option>
              <option value="6months">6 meses</option>
              <option value="year">Ano</option>
              <option value="all">Tudo</option>
            </select>
          </div>
        </div>
        <div class="card">
          <div class="table-wrap">
            <table>
              <thead>
                <tr><th>Nome</th><th>Valor</th><th>Categoria</th><th>Tipo</th><th>Data</th><th></th></tr>
              </thead>
              <tbody id="finExpenseList"></tbody>
            </table>
          </div>
          <div id="finEmpty" class="empty-state" style="display:none">
            <div class="empty-state-icon">💸</div>
            <div class="empty-state-text">Nenhuma despesa registrada</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="card-header"><h2 class="card-title">Gráficos</h2></div>
        <div class="grid-2">
          <div class="card"><div class="card-header"><span class="text-sm font-bold">Gastos por Categoria</span></div><div class="chart-container"><canvas id="chartCategory"></canvas></div></div>
          <div class="card"><div class="card-header"><span class="text-sm font-bold">Evolução Mensal</span></div><div class="chart-container"><canvas id="chartEvolution"></canvas></div></div>
        </div>
      </div>

      <div class="section">
        <div class="card">
          <div class="card-header"><span class="card-title">Feedback Financeiro</span></div>
          <div id="finFeedback"></div>
        </div>
      </div>
    `;

    this._renderExpenses(data);
    this._renderBudget(data);
    this._renderCharts(data);
    this._renderFeedback(data, inc, totalExp, available);
    this._bindEvents();
  },

  _getPeriodFilter() {
    const sel = document.getElementById('finPeriod');
    const v = sel ? sel.value : 'month';
    const today = todayStr();
    switch (v) {
      case 'week': return [startOfWeek(), today];
      case 'month': return [startOfMonth(), today];
      case '3months': return [monthsAgo(3), today];
      case '6months': return [monthsAgo(6), today];
      case 'year': return [startOfYear(), today];
      default: return [null, null];
    }
  },

  _renderExpenses(data) {
    const [from, to] = this._getPeriodFilter();
    const filtered = data.expenses.filter(e => {
      if (from && e.date < from) return false;
      if (to && e.date > to) return false;
      return true;
    });
    const list = document.getElementById('finExpenseList');
    const empty = document.getElementById('finEmpty');
    if (!list) return;
    if (filtered.length === 0) {
      list.innerHTML = '';
      if (empty) empty.style.display = '';
      return;
    }
    if (empty) empty.style.display = 'none';
    list.innerHTML = filtered.map(e => `
      <tr>
        <td>${e.name || '—'}</td>
        <td>${formatCurrency(e.value)}</td>
        <td><span class="badge badge-info">${e.category || 'Outros'}</span></td>
        <td><span class="badge ${e.type === 'fixo' ? 'badge-danger' : 'badge-warning'}">${e.type || 'variável'}</span></td>
        <td>${formatDate(e.date)}</td>
        <td>
          <button class="btn btn-ghost btn-sm finEdit" data-id="${e.id}">✏️</button>
          <button class="btn btn-ghost btn-sm finDel" data-id="${e.id}">🗑️</button>
        </td>
      </tr>
    `).join('');
  },

  _renderBudget(data) {
    const budgetVals = this.budgetValues(data);
    const container = document.getElementById('budgetDetails');
    if (!container) return;
    container.innerHTML = budgetVals.map(b => `
      <div class="mb-sm">
        <div class="flex justify-between text-xs mb-sm">
          <span class="font-bold">${b.label}</span>
          <span>${b.percent}% — ${formatCurrency(b.value)}</span>
        </div>
        <div class="progress"><div class="progress-bar" style="width:${b.percent}%"></div></div>
      </div>
    `).join('');

    const c = Charts.getColors();
    Charts.doughnut('chartBudget', budgetVals.map(b => b.label), budgetVals.map(b => b.value));
  },

  _renderCharts(data) {
    const [from, to] = this._getPeriodFilter();
    const catMap = this.expensesByCategory(data, from, to);
    const catLabels = Object.keys(catMap);
    const catValues = Object.values(catMap);
    const c = Charts.getColors();

    if (catLabels.length > 0) {
      Charts.doughnut('chartCategory', catLabels, catValues);
    }

    const monthly = {};
    data.expenses.forEach(e => {
      const m = (e.date || '').slice(0, 7);
      if (!m) return;
      monthly[m] = (monthly[m] || 0) + (e.value || 0);
    });
    const months = Object.keys(monthly).sort();
    if (months.length > 0) {
      Charts.bar('chartEvolution', months, [{
        label: 'Gastos',
        data: months.map(m => monthly[m]),
        backgroundColor: c.primary
      }]);
    }
  },

  _renderFeedback(data, inc, totalExp, available) {
    const fb = document.getElementById('finFeedback');
    if (!fb) return;
    const msgs = [];
    if (inc === 0) {
      msgs.push({ type: 'info', text: 'Defina sua renda mensal para começar o acompanhamento financeiro.' });
    } else {
      if (totalExp > inc) {
        msgs.push({ type: 'danger', text: `Atenção: seus gastos (${formatCurrency(totalExp)}) superam a renda (${formatCurrency(inc)}).` });
      } else if (totalExp > inc * 0.9) {
        msgs.push({ type: 'warning', text: 'Seus gastos estão perto do limite da renda.' });
      } else {
        msgs.push({ type: 'success', text: `Parabéns! Você ainda tem ${formatCurrency(available)} disponível.` });
      }
      const byCat = this.expensesByCategory(data);
      const maxCat = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0];
      if (maxCat) {
        msgs.push({ type: 'info', text: `Maior gasto: ${maxCat[0]} com ${formatCurrency(maxCat[1])}.` });
      }
    }
    fb.innerHTML = msgs.map(m => `
      <div style="padding:.5rem .75rem;margin-bottom:.5rem;border-radius:var(--radius-xs);background:var(--${m.type === 'danger' ? 'danger' : m.type === 'warning' ? 'warning' : m.type === 'success' ? 'success' : 'info'}-light);color:var(--${m.type === 'danger' ? 'danger' : m.type === 'warning' ? 'warning' : m.type === 'success' ? 'success' : 'info'});font-size:.85rem;">
        ${m.text}
      </div>
    `).join('');
  },

  _bindEvents() {
    const setIncome = document.getElementById('finSetIncome');
    if (setIncome) setIncome.onclick = () => this._showIncomeModal();

    const addExp = document.getElementById('finAddExpense');
    if (addExp) addExp.onclick = () => this._showExpenseModal();

    const editBudget = document.getElementById('finEditBudget');
    if (editBudget) editBudget.onclick = () => this._showBudgetModal();

    const period = document.getElementById('finPeriod');
    if (period) period.onchange = () => this.render();

    document.querySelectorAll('.finEdit').forEach(btn => {
      btn.onclick = () => this._showExpenseModal(btn.dataset.id);
    });
    document.querySelectorAll('.finDel').forEach(btn => {
      btn.onclick = () => {
        App.confirm('Excluir esta despesa?', () => {
          this.removeExpense(btn.dataset.id);
          this.render();
          App.toast('Despesa excluída', 'success');
        });
      };
    });
  },

  _showIncomeModal() {
    const data = this.getData();
    App.modal('Definir Renda Mensal', `
      <div class="form-group">
        <label class="form-label">Renda mensal (R$)</label>
        <input type="number" id="modalIncome" value="${data.income || ''}" min="0" max="${MAX_VALUE}" step="0.01">
      </div>
    `, [
      { label: 'Cancelar', class: 'btn-ghost', action: 'close' },
      { label: 'Salvar', class: 'btn-primary', action: () => {
        const v = clampNumber(document.getElementById('modalIncome').value);
        const d = this.getData();
        d.income = v;
        this.saveData(d);
        this.render();
        App.closeModal();
        App.toast('Renda atualizada', 'success');
      }}
    ]);
    setTimeout(() => {
      const inp = document.getElementById('modalIncome');
      if (inp) { inp.focus(); enforceMaxValue(inp); }
    }, 50);
  },

  _showExpenseModal(editId) {
    const data = this.getData();
    const exp = editId ? data.expenses.find(e => e.id === editId) : null;
    const categories = ['Alimentação', 'Moradia', 'Transporte', 'Lazer', 'Saúde', 'Educação', 'Vestuário', 'Assinaturas', 'Impostos', 'Outros'];

    App.modal(exp ? 'Editar Despesa' : 'Nova Despesa', `
      <div class="form-group">
        <label class="form-label">Nome</label>
        <input type="text" id="modalExpName" value="${exp ? exp.name : ''}" placeholder="Ex: Supermercado" required>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Valor (R$)</label>
          <input type="number" id="modalExpValue" value="${exp ? exp.value : ''}" min="0" max="${MAX_VALUE}" step="0.01" required>
        </div>
        <div class="form-group">
          <label class="form-label">Data</label>
          <input type="date" id="modalExpDate" value="${exp ? exp.date : todayStr()}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Categoria</label>
          <select id="modalExpCat">
            ${categories.map(c => `<option value="${c}" ${exp && exp.category === c ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Tipo</label>
          <select id="modalExpType">
            <option value="variável" ${exp && exp.type === 'variável' ? 'selected' : ''}>Variável</option>
            <option value="fixo" ${exp && exp.type === 'fixo' ? 'selected' : ''}>Fixo</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Observação</label>
        <textarea id="modalExpNote" rows="2">${exp ? (exp.note || '') : ''}</textarea>
      </div>
    `, [
      { label: 'Cancelar', class: 'btn-ghost', action: 'close' },
      { label: exp ? 'Atualizar' : 'Adicionar', class: 'btn-primary', action: () => {
        const name = document.getElementById('modalExpName').value.trim();
        const value = clampNumber(document.getElementById('modalExpValue').value);
        if (!name) { App.toast('Informe o nome', 'error'); return; }
        const updates = {
          name,
          value,
          date: document.getElementById('modalExpDate').value || todayStr(),
          category: document.getElementById('modalExpCat').value,
          type: document.getElementById('modalExpType').value,
          note: document.getElementById('modalExpNote').value.trim()
        };
        if (exp) {
          this.updateExpense(exp.id, updates);
          App.toast('Despesa atualizada', 'success');
        } else {
          this.addExpense(updates);
          App.toast('Despesa adicionada', 'success');
        }
        this.render();
        App.closeModal();
      }}
    ]);
    setTimeout(() => {
      const inp = document.getElementById('modalExpValue');
      if (inp) enforceMaxValue(inp);
    }, 50);
  },

  _showBudgetModal() {
    const data = this.getData();
    const budget = data.budget;
    App.modal('Editar Orçamento (%)', `
      ${Object.entries(budget).map(([k, v]) => `
        <div class="form-group">
          <label class="form-label">${k.charAt(0).toUpperCase() + k.slice(1)} (%)</label>
          <input type="number" id="modalBudget_${k}" value="${v}" min="0" max="100" step="1">
        </div>
      `).join('')}
      <div id="budgetSum" class="text-xs text-muted mt-md"></div>
    `, [
      { label: 'Cancelar', class: 'btn-ghost', action: 'close' },
      { label: 'Salvar', class: 'btn-primary', action: () => {
        let total = 0;
        const newBudget = {};
        for (const k of Object.keys(budget)) {
          const v = parseFloat(document.getElementById('modalBudget_' + k).value) || 0;
          newBudget[k] = v;
          total += v;
        }
        if (Math.abs(total - 100) > 0.5) {
          App.toast(`Total deve ser 100% (atual: ${total.toFixed(1)}%)`, 'error');
          return;
        }
        const d = this.getData();
        d.budget = newBudget;
        this.saveData(d);
        this.render();
        App.closeModal();
        App.toast('Orçamento atualizado', 'success');
      }}
    ]);
  },

  getSummary() {
    const data = this.getData();
    return {
      income: data.income || 0,
      totalExpenses: this.totalExpenses(data),
      available: (data.income || 0) - this.totalExpenses(data)
    };
  }
};
