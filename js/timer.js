// Vigorix - Cronômetro de Descanso
let timerInterval = null;
let timeRemaining = 60;
let isRunning = false;

export function initTimer() {
  const modal = document.getElementById('timerModal');
  const btnDescanso = document.getElementById('btnDescanso');
  const btnClose = document.getElementById('timerClose');
  const btnStart = document.getElementById('btnTimerStart');
  const btnPause = document.getElementById('btnTimerPause');
  const btnCancel = document.getElementById('btnTimerCancel');
  const presets = document.querySelectorAll('.timer-preset');
  const btnCustom = document.getElementById('btnCustomTime');
  const customInput = document.getElementById('customTime');
  const display = document.getElementById('timerDisplay');
  
  btnDescanso.addEventListener('click', () => {
    modal.classList.add('active');
    resetTimer();
  });
  
  btnClose.addEventListener('click', () => {
    modal.classList.remove('active');
    stopTimer();
  });
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
      stopTimer();
    }
  });
  
  presets.forEach(preset => {
    preset.addEventListener('click', () => {
      presets.forEach(p => p.classList.remove('active'));
      preset.classList.add('active');
      timeRemaining = parseInt(preset.dataset.time);
      updateDisplay();
      stopTimer();
    });
  });
  
  btnCustom.addEventListener('click', () => {
    const val = parseInt(customInput.value);
    if (val && val > 0 && val <= 300) {
      presets.forEach(p => p.classList.remove('active'));
      timeRemaining = val;
      updateDisplay();
      stopTimer();
      customInput.value = '';
    }
  });
  
  btnStart.addEventListener('click', startTimer);
  btnPause.addEventListener('click', pauseTimer);
  btnCancel.addEventListener('click', () => {
    modal.classList.remove('active');
    stopTimer();
  });
  
  updateDisplay();
}

function updateDisplay() {
  const display = document.getElementById('timerDisplay');
  const mins = Math.floor(timeRemaining / 60);
  const secs = timeRemaining % 60;
  display.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function startTimer() {
  if (isRunning) return;
  isRunning = true;
  
  document.getElementById('btnTimerStart').style.display = 'none';
  document.getElementById('btnTimerPause').style.display = 'flex';
  
  timerInterval = setInterval(() => {
    timeRemaining--;
    updateDisplay();
    
    if (timeRemaining <= 0) {
      stopTimer();
      alert('Descanso finalizado! 💪');
    }
  }, 1000);
}

function pauseTimer() {
  if (!isRunning) return;
  isRunning = false;
  clearInterval(timerInterval);
  
  document.getElementById('btnTimerStart').style.display = 'flex';
  document.getElementById('btnTimerPause').style.display = 'none';
}

function stopTimer() {
  isRunning = false;
  clearInterval(timerInterval);
  resetTimer();
  
  document.getElementById('btnTimerStart').style.display = 'flex';
  document.getElementById('btnTimerPause').style.display = 'none';
}

function resetTimer() {
  const activePreset = document.querySelector('.timer-preset.active');
  if (activePreset) {
    timeRemaining = parseInt(activePreset.dataset.time);
  } else {
    timeRemaining = 60;
  }
  updateDisplay();
  isRunning = false;
  clearInterval(timerInterval);
  
  document.getElementById('btnTimerStart').style.display = 'flex';
  document.getElementById('btnTimerPause').style.display = 'none';
}
