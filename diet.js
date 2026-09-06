/* ===== Life OS — Dieta ===== */
const Diet = {
  STORAGE_KEY: 'diet',

  defaults() {
    return {
      goals: { calories: 2000, protein: 150, carbs: 250, fat: 70 },
      meals: []
    };
  },

  getData() { return Storage.load(this.STORAGE_KEY, this.defaults()); },
  saveData(d) { Storage.save(this.STORAGE_KEY, d); },

  addMeal(m) {
    const data = this.getData();
    m.id = generateId();
    m.date = m.date || todayStr();
    m.foods = [];
    data.meals.push(m);
    this.saveData(data);
    return data;
  },

  updateMeal(id, updates) {
    const data = this.getData();
    const idx = data.meals.findIndex(m => m.id === id);
    if (idx === -1) return data;
    data.meals[idx] = { ...data.meals[idx], ...updates };
    this.saveData(data);
    return data;
  },

  removeMeal(id) {
    const data = this.getData();
    data.meals = data.meals.filter(m => m.id !== id);
    this.saveData(data);
    return data;
  },

  addFood(mealId, food) {
    const data = this.getData();
    const m = data.meals.find(m => m.id === mealId);
    if (!m) return data;
    food.id = generateId();
    food.calories = clampNumber(food.calories);
    food.protein = clampNumber(food.protein);
    food.carbs = clampNumber(food.carbs);
    food.fat = clampNumber(food.fat);
    if (!m.foods) m.foods = [];
    m.foods.push(food);
    this.saveData(data);
    return data;
  },

  removeFood(mealId, foodId) {
    const data = this.getData();
    const m = data.meals.find(m => m.id === mealId);
    if (!m) return data;
    m.foods = (m.foods || []).filter(f => f.id !== foodId);
    this.saveData(data);
    return data;
  },

  getTotals(date) {
    const data = this.getData();
    const d = date || todayStr();
    const meals = data.meals.filter(m => m.date === d);
    const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    meals.forEach(m => {
      (m.foods || []).forEach(f => {
        totals.calories += f.calories || 0;
        totals.protein += f.protein || 0;
        totals.carbs += f.carbs || 0;
        totals.fat += f.fat || 0;
      });
    });
    return totals;
  },

  render() {
    const data = this.getData();
    const totals = this.getTotals();
    const goals = data.goals;

    const view = document.getElementById('view-diet');
    view.innerHTML = `
      <div class="section">
        <div class="card-header">
          <h2 class="card-title">🥗 Dieta</h2>
          <div class="flex gap-sm">
            <button class="btn btn-ghost btn-sm" id="dietEditGoals">Metas</button>
            <button class="btn btn-primary btn-sm" id="dietAddMeal">+ Refeição</button>
          </div>
        </div>
      </div>

      <div class="kpi-grid">
        <div class="kpi">
          <div class="kpi-label">Calorias</div>
          <div class="kpi-value">${totals.calories.toFixed(0)} / ${goals.calories}</div>
          <div class="progress mt-md"><div class="progress-bar ${totals.calories > goals.calories ? 'danger' : 'success'}" style="width:${Math.min(100, totals.calories / goals.calories * 100)}%"></div></div>
        </div>
        <div class="kpi">
          <div class="kpi-label">Proteína</div>
          <div class="kpi-value">${totals.protein.toFixed(0)}g / ${goals.protein}g</div>
          <div class="progress mt-md"><div class="progress-bar ${totals.protein > goals.protein ? 'success' : 'info'}" style="width:${Math.min(100, totals.protein / goals.protein * 100)}%"></div></div>
        </div>
        <div class="kpi">
          <div class="kpi-label">Carboidratos</div>
          <div class="kpi-value">${totals.carbs.toFixed(0)}g / ${goals.carbs}g</div>
          <div class="progress mt-md"><div class="progress-bar ${totals.carbs > goals.carbs ? 'warning' : 'info'}" style="width:${Math.min(100, totals.carbs / goals.carbs * 100)}%"></div></div>
        </div>
        <div class="kpi">
          <div class="kpi-label">Gordura</div>
          <div class="kpi-value">${totals.fat.toFixed(0)}g / ${goals.fat}g</div>
          <div class="progress mt-md"><div class="progress-bar ${totals.fat > goals.fat ? 'warning' : 'info'}" style="width:${Math.min(100, totals.fat / goals.fat * 100)}%"></div></div>
        </div>
      </div>

      <div class="section">
        <div id="dietMealList"></div>
        <div id="dietEmpty" class="empty-state" style="display:none">
          <div class="empty-state-icon">🥗</div>
          <div class="empty-state-text">Nenhuma refeição registrada hoje</div>
        </div>
      </div>
    `;

    this._renderMeals(data);
    this._bindEvents();
  },

  _renderMeals(data) {
    const today = todayStr();
    const meals = data.meals.filter(m => m.date === today);
    const list = document.getElementById('dietMealList');
    const empty = document.getElementById('dietEmpty');
    if (!list) return;
    if (meals.length === 0) {
      list.innerHTML = '';
      if (empty) empty.style.display = '';
      return;
    }
    if (empty) empty.style.display = 'none';

    list.innerHTML = meals.map(m => {
      const foods = m.foods || [];
      const mealTotals = foods.reduce((acc, f) => ({
        cal: acc.cal + (f.calories || 0),
        pro: acc.pro + (f.protein || 0),
        carb: acc.carb + (f.carbs || 0),
        fat: acc.fat + (f.fat || 0)
      }), { cal: 0, pro: 0, carb: 0, fat: 0 });

      return `
        <div class="card mb-md">
          <div class="card-header">
            <div>
              <span class="card-title">${m.name || 'Refeição'}</span>
              <span class="text-xs text-muted" style="margin-left:.5rem">${mealTotals.cal.toFixed(0)} kcal</span>
            </div>
            <div class="flex gap-sm">
              <button class="btn btn-primary btn-sm dietAddFood" data-id="${m.id}">+ Alimento</button>
              <button class="btn btn-ghost btn-sm dietDelMeal" data-id="${m.id}">🗑️</button>
            </div>
          </div>
          ${foods.length > 0 ? `
            <table>
              <thead><tr><th>Alimento</th><th>Cal</th><th>Prot</th><th>Carb</th><th>Gord</th><th></th></tr></thead>
              <tbody>
                ${foods.map(f => `
                  <tr>
                    <td>${f.name || '—'}</td>
                    <td>${f.calories || 0}</td>
                    <td>${f.protein || 0}g</td>
                    <td>${f.carbs || 0}g</td>
                    <td>${f.fat || 0}g</td>
                    <td><button class="btn btn-ghost btn-sm dietDelFood" data-mid="${m.id}" data-fid="${f.id}">🗑️</button></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : '<div class="text-xs text-muted">Nenhum alimento adicionado</div>'}
        </div>
      `;
    }).join('');
  },

  _bindEvents() {
    const addMeal = document.getElementById('dietAddMeal');
    if (addMeal) addMeal.onclick = () => this._showMealModal();

    const editGoals = document.getElementById('dietEditGoals');
    if (editGoals) editGoals.onclick = () => this._showGoalsModal();

    document.querySelectorAll('.dietAddFood').forEach(btn => {
      btn.onclick = () => this._showFoodModal(btn.dataset.id);
    });
    document.querySelectorAll('.dietDelMeal').forEach(btn => {
      btn.onclick = () => {
        App.confirm('Excluir esta refeição?', () => {
          this.removeMeal(btn.dataset.id);
          this.render();
          App.toast('Refeição excluída', 'success');
        });
      };
    });
    document.querySelectorAll('.dietDelFood').forEach(btn => {
      btn.onclick = () => {
        this.removeFood(btn.dataset.mid, btn.dataset.fid);
        this.render();
        App.toast('Alimento removido', 'success');
      };
    });
  },

  _showMealModal() {
    const meals = ['Café da manhã', 'Almoço', 'Lanche', 'Jantar', 'Ceia'];
    App.modal('Nova Refeição', `
      <div class="form-group">
        <label class="form-label">Nome</label>
        <select id="modalMealName">
          ${meals.map(m => `<option value="${m}">${m}</option>`).join('')}
        </select>
      </div>
    `, [
      { label: 'Cancelar', class: 'btn-ghost', action: 'close' },
      { label: 'Adicionar', class: 'btn-primary', action: () => {
        const name = document.getElementById('modalMealName').value;
        this.addMeal({ name });
        this.render();
        App.closeModal();
        App.toast('Refeição adicionada', 'success');
      }}
    ]);
  },

  _showFoodModal(mealId) {
    App.modal('Adicionar Alimento', `
      <div class="form-group">
        <label class="form-label">Nome do alimento</label>
        <input type="text" id="modalFoodName" placeholder="Ex: Arroz, feijão..." required>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Calorias</label>
          <input type="number" id="modalFoodCal" min="0" max="${MAX_VALUE}">
        </div>
        <div class="form-group">
          <label class="form-label">Proteína (g)</label>
          <input type="number" id="modalFoodPro" min="0" max="${MAX_VALUE}" step="0.1">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Carboidratos (g)</label>
          <input type="number" id="modalFoodCarb" min="0" max="${MAX_VALUE}" step="0.1">
        </div>
        <div class="form-group">
          <label class="form-label">Gordura (g)</label>
          <input type="number" id="modalFoodFat" min="0" max="${MAX_VALUE}" step="0.1">
        </div>
      </div>
    `, [
      { label: 'Cancelar', class: 'btn-ghost', action: 'close' },
      { label: 'Adicionar', class: 'btn-primary', action: () => {
        const name = document.getElementById('modalFoodName').value.trim();
        if (!name) { App.toast('Informe o nome', 'error'); return; }
        this.addFood(mealId, {
          name,
          calories: clampNumber(document.getElementById('modalFoodCal').value),
          protein: clampNumber(document.getElementById('modalFoodPro').value),
          carbs: clampNumber(document.getElementById('modalFoodCarb').value),
          fat: clampNumber(document.getElementById('modalFoodFat').value)
        });
        this.render();
        App.closeModal();
        App.toast('Alimento adicionado', 'success');
      }}
    ]);
    setTimeout(() => {
      ['modalFoodCal', 'modalFoodPro', 'modalFoodCarb', 'modalFoodFat'].forEach(id => {
        const el = document.getElementById(id);
        if (el) enforceMaxValue(el);
      });
    }, 50);
  },

  _showGoalsModal() {
    const data = this.getData();
    const g = data.goals;
    App.modal('Metas Nutricionais Diárias', `
      <div class="form-group">
        <label class="form-label">Calorias</label>
        <input type="number" id="modalDietCal" value="${g.calories}" min="0" max="${MAX_VALUE}">
      </div>
      <div class="form-group">
        <label class="form-label">Proteína (g)</label>
        <input type="number" id="modalDietPro" value="${g.protein}" min="0" max="${MAX_VALUE}" step="0.1">
      </div>
      <div class="form-group">
        <label class="form-label">Carboidratos (g)</label>
        <input type="number" id="modalDietCarb" value="${g.carbs}" min="0" max="${MAX_VALUE}" step="0.1">
      </div>
      <div class="form-group">
        <label class="form-label">Gordura (g)</label>
        <input type="number" id="modalDietFat" value="${g.fat}" min="0" max="${MAX_VALUE}" step="0.1">
      </div>
    `, [
      { label: 'Cancelar', class: 'btn-ghost', action: 'close' },
      { label: 'Salvar', class: 'btn-primary', action: () => {
        const d = this.getData();
        d.goals = {
          calories: clampNumber(document.getElementById('modalDietCal').value),
          protein: clampNumber(document.getElementById('modalDietPro').value),
          carbs: clampNumber(document.getElementById('modalDietCarb').value),
          fat: clampNumber(document.getElementById('modalDietFat').value)
        };
        this.saveData(d);
        this.render();
        App.closeModal();
        App.toast('Metas atualizadas', 'success');
      }}
    ]);
    setTimeout(() => {
      ['modalDietCal', 'modalDietPro', 'modalDietCarb', 'modalDietFat'].forEach(id => {
        const el = document.getElementById(id);
        if (el) enforceMaxValue(el);
      });
    }, 50);
  },

  getSummary() {
    const totals = this.getTotals();
    return totals;
  }
};
