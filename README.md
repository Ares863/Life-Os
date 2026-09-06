# Life OS

Dashboard pessoal de **finanças, rotina e saúde** — minimalista, moderno e com cara de produto SaaS, totalmente local.

> 💾 **Aviso de privacidade:** todos os dados ficam armazenados no seu navegador (`localStorage`). Nenhuma informação é enviada a servidores ou APIs externas. Os gráficos (Chart.js) são baixados do CDN jsdelivr apenas para renderização local.

---

## 🚀 Como executar

Você tem duas opções:

**1. Abrir direto (recomendado para uso rápido):**
> Basta dar duplo clique em `index.html`.

**2. Com servidor local:**
Se quiser usar um endereço `localhost`, rode na pasta do projeto:

```bash
python -m http.server 5500
```

E abra `http://localhost:5500`.

> A recomendação é usar o servidor local (`https://localhost`), pois alguns navegadores bloqueiam/limitam certas coisas ao abrir via `file://`. O aplicativo **não exige backend**, banco de dados ou instalação de dependências.

---

## 📁 Estrutura do projeto

```
life-os/
│
├── index.html          # Única página (SPA)
├── README.md
│
├── css/
│   ├── style.css       # Design system, componentes, dark mode
│   └── responsive.css  # Adaptação para tablet e celular
│
├── js/
│   ├── storage.js      # localStorage: salvar/carregar/remover + dados iniciais
│   ├── charts.js       # Helpers de gráficos (Chart.js)
│   ├── finances.js     # Renda, despesas, orçamento, feedback e análise
│   ├── routine.js      # Rotina, hábitos e Índice de Consistência
│   ├── tasks.js        # Kanban (criar, editar, excluir, drag & drop, filtros)
│   ├── workout.js      # Treinos, exercícios e evolução de carga
│   ├── diet.js         # Refeições, alimentos e macros
│   ├── goals.js        # Metas e progresso
│   ├── reports.js      # Relatórios, exportação CSV e impressão
│   └── app.js          # Núcleo: roteamento, dashboard, modais, toasts, eventos
│
└── assets/             # (imagens/ícones adicionais)
```

---

## ✨ Funcionalidades

### 💰 Finanças
- Cadastro de renda mensal e **despesas** (nome, valor, categoria, tipo fixo/variável, data, observação).
- 10 categorias predefinidas e tipos Fixo/Variável.
- **Orçamento inteligente** com percentuais personalizáveis (necessidades, desejos, investimentos, reserva, outros) e cálculo automático dos valores.
- **Feedback financeiro** gerado com regras locais (dentro/estourado do orçamento, despesas por categoria, dicas de economia).
- Gráficos: gastos por categoria, evolução, renda × gastos, economia mensal e distribuição do orçamento — com filtros **Semana, Mês, 3 meses, 6 meses, Ano**.

### 📋 Rotina & Habitos
- Timeline diária com horário, título, categoria, duração e descrição.
- Marcar atividades como concluídas.
- **Hábitos** com sequência atual, melhor sequência, % de conclusão e **heatmap** dos últimos 28 dias.

### ✅ Tarefas (Kanban)
- Colunas: **A fazer / Em andamento / Concluído**.
- Prioridades (Baixa, Média, Alta, Urgente), categoria e data limite.
- Criar, editar, excluir, concluir.
- **Drag & drop** entre colunas (+ atalhos de teclado com setas).
- Filtros por status, prioridade e pesquisa.

### 🏋️ Treino
- Crie treinos com exercícios (séries, repetições, peso).
- Adicionar, editar, remover e marcar exercícios como concluídos.
- **Gráfico de evolução de carga** por exercício.

### 🥗 Dieta
- Metas diárias de calorias, proteína, carboidratos e gordura.
- Refeições (Café, Almoço, Lanche, Jantar) com alimentos e valores nutricionais.
- Barras de progresso dos macros.

### 🎯 Metas
- Tipos: Financeira, Saúde, Estudos, Trabalho, Pessoal.
- Criar, editar, excluir, atualizar progresso e definir prazo.

### 🏆 Índice de Consistência
- Escore de **0 a 100** calculado a partir de Finanças, Rotina, Tarefas, Treinos, Hábitos e Metas.
- Mostra pontos fortes, pontos de atenção e um veredito.

### 📊 Relatórios
- Resumo visual com gráficos e KPIs.
- **Exportar CSV** e **Imprimir** (salvar em PDF pelo navegador).
- Filtro de período.

### 🎨 Geral
- Tema claro/escuro (com preferência salva).
- Modais com validação (sem `prompt()`).
- Toasts de sucesso/erro, estados vazios, confirmações antes de excluir, tooltips.
- Navegação por teclado, foco visível, HTML semântico e `aria-*`.
- Atalhos de teclado: `g` visão geral · `f` finanças · `r` rotina · `t` tarefas · `w` treino · `d` dieta · `m` metas.

---

## 💾 Como os dados são armazenados

Tudo é persistido no `localStorage`, sob chaves com o prefixo `lifeos_`:

| Chave                  | Conteúdo            |
|------------------------|---------------------|
| `lifeos_finances`      | Renda, orçamento e despesas |
| `lifeos_routine`       | Atividades da rotina |
| `lifeos_habits`        | Hábitos e histórico |
| `lifeos_tasks`         | Tarefas do Kanban  |
| `lifeos_workouts`      | Treinos e exercícios |
| `lifeos_diet`          | Refeições e metas nutricionais |
| `lifeos_goals`         | Metas |
| `lifeos_theme`         | Preferência de tema |

As funções reutilizáveis de armazenamento vivem em `js/storage.js` (`Storage.save`, `Storage.load`, `Storage.update`, `Storage.remove`, `Storage.resetAll`).

Na **primeira execução**, se não houver dados, o app carrega **dados fictícios** de exemplo para que o painel não fique vazio. Conforme você cadastra suas próprias informações, elas substituem os exemplos.

---

## 🔄 Como resetar os dados do aplicativo

> Isto apaga **todos** os dados salvos no navegador e recarrega os dados de exemplo.

**Pelo app:** abra **Configurações** (⚙️ na sidebar) → clicar em **"Redefinir tudo"** → confirmar.

**Manualmente:** no console do navegador (`F12`), execute:

```js
localStorage.clear(); location.reload();
```

ou remova apenas as chaves do app:

```js
Object.keys(localStorage)
  .filter(k => k.startsWith('lifeos_'))
  .forEach(k => localStorage.removeItem(k));
location.reload();
```

---

## 🛠️ Stack

- **HTML5 / CSS3 / JavaScript (ES6+)**
- **Chart.js** (via CDN) para gráficos
- **localStorage** para persistência

Sem React, sem backend, sem banco de dados.