import { TREINO_A, TREINO_B, DIAS_PARA_TREINO, RODADAS, SEMANAS } from './data.js';
import { getTodayISO, getDayName, storageGet, storageSet, STORAGE_KEYS, generateId, formatTime } from './utils.js';
import { initTimer } from './timer.js';

let currentState = null;
let selectedWeek = "Semana 1";

function init() {
  // Inicializar configurações
  const settings = storageGet(STORAGE_KEYS.SETTINGS, { semana: "Semana 1" });
  selectedWeek = settings.semana;
  
  // Atualizar botões de semana
  document.querySelectorAll('.week-btn').forEach(btn => {
    if (btn.dataset.week === selectedWeek) {
      btn.classList.add('active');
    }
    btn.addEventListener('click', () => {
      document.querySelectorAll('.week-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedWeek = btn.dataset.week;
      storageSet(STORAGE_KEYS.SETTINGS, { semana: selectedWeek });
      loadOrCreateCurrentState();
      render();
    });
  });
  
  // Inicializar cronômetro
  initTimer();
  
  // Botão finalizar
  document.getElementById('btnFinalizar').addEventListener('click', finalizarTreino);
  
  // Carregar ou criar estado do dia
  loadOrCreateCurrentState();
  render();
}

function loadOrCreateCurrentState() {
  const today = getTodayISO();
  const saved = storageGet(STORAGE_KEYS.CURRENT, null);
  
  if (saved && saved.data === today) {
    currentState = saved;
    return;
  }
  
  // Criar novo estado para hoje
  const diaSemana = getDayName(new Date());
  const tipoTreino = DIAS_PARA_TREINO[new Date().getDay()];
  const treinos = tipoTreino === "A" ? TREINO_A : TREINO_B;
  
  const rodadas = [];
  for (let r = 1; r <= RODADAS; r++) {
    const exercicios = treinos.map(ex => ({
      id: `${ex.id}_r${r}`,
      exercicioId: ex.id,
      nome: ex.nome,
      foco: ex.foco,
      instrucao: ex.instrucao,
      meta: ex.meta[selectedWeek],
      feito: false
    }));
    rodadas.push({ numero: r, exercicios });
  }
  
  currentState = {
    data: today,
    diaSemana,
    treino: tipoTreino,
    semana: selectedWeek,
    rodadas,
    iniciadoEm: Date.now()
  };
  
  storageSet(STORAGE_KEYS.CURRENT, currentState);
}

function render() {
  const today = getTodayISO();
  const diaSemana = getDayName(new Date());
  const tipoTreino = DIAS_PARA_TREINO[new Date().getDay()];
  
  // Header
  document.getElementById('headerDate').textContent = new Date().toLocaleDateString('pt-BR');
  document.getElementById('headerDay').textContent = diaSemana;
  document.getElementById('headerTreino').textContent = `Treino ${tipoTreino}`;
  
  // Atualizar semana selecionada nos dados se mudou
  if (currentState.semana !== selectedWeek) {
    currentState.semana = selectedWeek;
    // Atualizar metas
    const treinos = tipoTreino === "A" ? TREINO_A : TREINO_B;
    currentState.rodadas.forEach(rodada => {
      rodada.exercicios.forEach(ex => {
        const treinoEx = treinos.find(t => t.id === ex.exercicioId);
        if (treinoEx) {
          ex.meta = treinoEx.meta[selectedWeek];
        }
      });
    });
    storageSet(STORAGE_KEYS.CURRENT, currentState);
  }
  
  // Renderizar rodadas
  const container = document.getElementById('roundsContainer');
  container.innerHTML = '';
  
  currentState.rodadas.forEach(rodada => {
    const todosFeitos = rodada.exercicios.every(ex => ex.feito);
    const feitosCount = rodada.exercicios.filter(ex => ex.feito).length;
    
    const roundCard = document.createElement('div');
    roundCard.className = 'round-card';
    roundCard.innerHTML = `
      <div class="round-header">
        <div class="round-title">Rodada ${rodada.numero}</div>
        <div class="round-status ${todosFeitos ? 'complete' : ''}">
          ${feitosCount}/${rodada.exercicios.length} ${todosFeitos ? '✓ Completa' : ''}
        </div>
      </div>
      <div class="exercises-list">
        ${rodada.exercicios.map(ex => `
          <div class="exercise-item ${ex.feito ? 'done' : ''}" data-ex-id="${ex.id}">
            <input type="checkbox" class="exercise-checkbox" ${ex.feito ? 'checked' : ''} data-ex-id="${ex.id}">
            <div class="exercise-content">
              <div class="exercise-name">${ex.nome}</div>
              <div class="exercise-meta">
                <span class="exercise-focus">${ex.foco}</span>
                <span>• ${ex.meta}</span>
              </div>
              <div class="exercise-instruction">${ex.instrucao}</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    container.appendChild(roundCard);
  });
  
  // Event listeners para checkboxes
  document.querySelectorAll('.exercise-checkbox').forEach(cb => {
    cb.addEventListener('change', (e) => {
      const exId = e.target.dataset.exId;
      let found = false;
      for (let r of currentState.rodadas) {
        for (let ex of r.exercicios) {
          if (ex.id === exId) {
            ex.feito = e.target.checked;
            found = true;
            break;
          }
        }
        if (found) break;
      }
      storageSet(STORAGE_KEYS.CURRENT, currentState);
      render();
    });
  });
  
  // Progresso
  let totalExercicios = 0;
  let totalFeitos = 0;
  currentState.rodadas.forEach(r => {
    totalExercicios += r.exercicios.length;
    totalFeitos += r.exercicios.filter(ex => ex.feito).length;
  });
  
  const percent = totalExercicios === 0 ? 0 : (totalFeitos / totalExercicios) * 100;
  document.getElementById('progressText').textContent = `${totalFeitos}/${totalExercicios} exercícios`;
  document.getElementById('progressBar').style.width = percent + '%';
  
  // Botão finalizar
  const btnFinalizar = document.getElementById('btnFinalizar');
  if (totalFeitos === totalExercicios && totalExercicios > 0) {
    btnFinalizar.disabled = false;
  } else {
    btnFinalizar.disabled = true;
  }
  
  lucide.createIcons();
}

function finalizarTreino() {
  const history = storageGet(STORAGE_KEYS.HISTORY, []);
  
  let totalExercicios = 0;
  let totalFeitos = 0;
  currentState.rodadas.forEach(r => {
    totalExercicios += r.exercicios.length;
    totalFeitos += r.exercicios.filter(ex => ex.feito).length;
  });
  
  const registro = {
    id: generateId(),
    data: currentState.data,
    diaSemana: currentState.diaSemana,
    treino: currentState.treino,
    semana: currentState.semana,
    rodadasCompletas: RODADAS,
    totalExercicios,
    concluidos: totalFeitos,
    iniciadoEm: currentState.iniciadoEm,
    finalizadoEm: Date.now(),
    detalhes: JSON.parse(JSON.stringify(currentState.rodadas))
  };
  
  history.unshift(registro);
  storageSet(STORAGE_KEYS.HISTORY, history);
  
  // Criar novo estado para amanhã (mas manter no current até trocar de dia)
  alert('Treino finalizado com sucesso! 🎉');
  // Resetar para não mostrar finalizar novamente até próximo dia
  document.getElementById('btnFinalizar').disabled = true;
  document.getElementById('btnFinalizar').innerHTML = '<i data-lucide="check"></i> Treino Finalizado';
}

document.addEventListener('DOMContentLoaded', init);
