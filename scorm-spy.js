javascript:(function(){
  if(window.__scormSpyActive) return;
  window.__scormSpyActive = true;

  // --- Переменные состояния ---
  let currentScoreRaw = '—', currentScoreMax = '—', currentStatus = '—';
  let activityInterval = null;
  let capturedConsole = [];

  // --- Создание интерфейса ---
  function createPanel() {
    let p = document.getElementById('scorm-spy-panel');
    if (p) { p.style.display = 'flex'; return p; }
    let div = document.createElement('div');
    div.id = 'scorm-spy-panel';
    div.style.cssText = 'position:fixed; bottom:20px; right:20px; width:400px; max-height:450px; background:rgba(30,30,30,0.95); color:#0f0; font-family:monospace; font-size:12px; border:1px solid #0f0; border-radius:8px; padding:8px; box-shadow:0 0 15px rgba(0,255,0,0.3); z-index:9999; display:flex; flex-direction:column; backdrop-filter:blur(4px);';
    
    // Заголовок с кнопками
    let header = document.createElement('div');
    header.style.cssText = 'display:flex; justify-content:space-between; align-items:center; margin-bottom:5px; border-bottom:1px solid #0f0; padding-bottom:3px;';
    header.innerHTML = '<span style="font-weight:bold;">📡 SCORM Spy</span> <span style="display:flex; gap:5px;">' +
      '<button id="scorm-clear" style="background:transparent; border:1px solid #0f0; color:#0f0; border-radius:4px; cursor:pointer; font-size:11px;">🗑️</button>' +
      '<button id="scorm-activity" style="background:transparent; border:1px solid #0f0; color:#0f0; border-radius:4px; cursor:pointer; font-size:11px;">🖱️ Активация</button>' +
      '<button id="scorm-hide" style="background:transparent; border:1px solid #0f0; color:#0f0; border-radius:4px; cursor:pointer; font-size:11px;">✖️</button>' +
      '</span>';
    
    // Часы
    let clockDiv = document.createElement('div');
    clockDiv.id = 'scorm-clock';
    clockDiv.style.cssText = 'background:rgba(0,0,0,0.5); border:1px solid #0f0; border-radius:4px; padding:4px 8px; margin:5px 0; font-size:16px; font-weight:bold; text-align:center; letter-spacing:2px;';
    clockDiv.innerHTML = '⏱️ Время: 00:00:00';
    
    // Статус
    let statusDiv = document.createElement('div');
    statusDiv.id = 'scorm-status';
    statusDiv.style.cssText = 'display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.5); border:1px solid #0f0; border-radius:4px; padding:4px 8px; margin:5px 0;';
    statusDiv.innerHTML = '📊 Статус: <span id="scorm-status-value">—</span>';
    
    // Баллы
    let scoreDiv = document.createElement('div');
    scoreDiv.id = 'scorm-score';
    scoreDiv.style.cssText = 'display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.5); border:1px solid #0f0; border-radius:4px; padding:4px 8px; margin:5px 0;';
    scoreDiv.innerHTML = '🎯 Баллы: <span id="scorm-score-value">— / —</span>';
    
    // Лог
    let content = document.createElement('div');
    content.id = 'scorm-log';
    content.style.cssText = 'overflow-y:auto; max-height:200px; white-space:pre-wrap; word-break:break-word; padding-right:5px; border-top:1px solid #0f0; margin-top:5px;';
    
    div.appendChild(header);
    div.appendChild(clockDiv);
    div.appendChild(statusDiv);
    div.appendChild(scoreDiv);
    div.appendChild(content);
    document.body.appendChild(div);
    
    // Обработчики кнопок
    document.getElementById('scorm-clear').onclick = () => {
      document.getElementById('scorm-log').innerHTML = '';
    };
    document.getElementById('scorm-hide').onclick = () => {
      div.style.display = 'none';
    };
    document.getElementById('scorm-activity').onclick = () => {
      if (activityInterval) {
        clearInterval(activityInterval);
        activityInterval = null;
        document.getElementById('scorm-activity').style.background = 'transparent';
        addLog('⏸️ Имитация активности остановлена');
      } else {
        startActivitySimulation();
        document.getElementById('scorm-activity').style.background = 'rgba(0,255,0,0.2)';
        addLog('▶️ Имитация активности запущена (каждые 2 мин)');
      }
    };
    
    return div;
  }

  // --- Вспомогательные функции ---
  function addLog(msg) {
    let log = document.getElementById('scorm-log');
    if (!log) return;
    let entry = document.createElement('div');
    entry.textContent = msg;
    entry.style.cssText = 'margin:2px 0; border-bottom:1px dotted #333; padding:2px 0;';
    log.appendChild(entry);
    log.scrollTop = log.scrollHeight;
  }

  function updateClock(timeStr) {
    let clock = document.getElementById('scorm-clock');
    if (clock) clock.innerHTML = '⏱️ Время: ' + timeStr;
  }

  function updateStatus(statusVal) {
    let statusSpan = document.getElementById('scorm-status-value');
    if (!statusSpan) return;
    let icon = '';
    if (statusVal === 'completed') { icon = '✅'; statusVal = 'завершено'; }
    else if (statusVal === 'incomplete') { icon = '⏳'; statusVal = 'не завершено'; }
    else if (statusVal === 'passed') { icon = '🏆'; statusVal = 'сдано'; }
    else if (statusVal === 'failed') { icon = '❌'; statusVal = 'не сдано'; }
    else icon = '📊';
    statusSpan.innerHTML = icon + ' ' + statusVal;
  }

  function updateScore(raw, max) {
    let scoreSpan = document.getElementById('scorm-score-value');
    if (!scoreSpan) return;
    if (max !== '—') scoreSpan.innerHTML = raw + ' / ' + max;
    else scoreSpan.innerHTML = raw;
  }

  // --- Имитация активности ---
  function simulateActivity() {
    // Движение мыши
    document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 100 + Math.random() * 100, clientY: 100 + Math.random() * 100 }));
    // Скролл
    window.scrollBy(0, 1);
    window.scrollBy(0, -1);
    // Нажатие клавиши Ctrl (безопасно)
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Control', bubbles: true }));
    document.dispatchEvent(new KeyboardEvent('keyup', { key: 'Control', bubbles: true }));
    addLog('🤖 Имитирована активность (движение, скролл, клавиша)');
  }

  function startActivitySimulation() {
    if (activityInterval) clearInterval(activityInterval);
    activityInterval = setInterval(simulateActivity, 2 * 60 * 1000); // каждые 2 минуты
  }

  // --- Перехват консольных сообщений ---
  const originalConsoleLog = console.log;
  const originalConsoleWarn = console.warn;
  const originalConsoleError = console.error;

  console.log = function(...args) {
    let msg = args.map(arg => (typeof arg === 'object' ? JSON.stringify(arg) : arg)).join(' ');
    addLog('📋 [LOG] ' + msg);
    originalConsoleLog.apply(console, args);
  };
  console.warn = function(...args) {
    let msg = args.map(arg => (typeof arg === 'object' ? JSON.stringify(arg) : arg)).join(' ');
    addLog('⚠️ [WARN] ' + msg);
    originalConsoleWarn.apply(console, args);
  };
  console.error = function(...args) {
    let msg = args.map(arg => (typeof arg === 'object' ? JSON.stringify(arg) : arg)).join(' ');
    addLog('❌ [ERROR] ' + msg);
    originalConsoleError.apply(console, args);
  };

  // --- Перехват alert/confirm/prompt ---
  window.alert = function(msg) {
    addLog('🛑 ALERT перехвачен: ' + msg);
    // Можно не показывать оригинал
  };
  window.confirm = function(msg) {
    addLog('🛑 CONFIRM перехвачен: ' + msg + ' → автоматически OK');
    return true; // имитируем нажатие OK
  };
  window.prompt = function(msg) {
    addLog('🛑 PROMPT перехвачен: ' + msg + ' → автоматически отмена');
    return null; // отмена
  };

  // --- Наблюдение за появлением новых DOM-элементов (возможно, окно бездействия) ---
  const observer = new MutationObserver(mutations => {
    mutations.forEach(m => {
      m.addedNodes.forEach(node => {
        if (node.nodeType === 1) { // элемент
          // Проверяем, похоже ли это на окно предупреждения (по тексту или классам)
          let text = node.innerText || '';
          if (text.includes('бездействи') || text.includes('inactivity') || text.includes('тайм-аут') || text.includes('timeout')) {
            addLog('🚫 Обнаружено возможное окно бездействия. Попытка удалить...');
            node.remove(); // удаляем элемент
          }
        }
      });
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // --- Перехват SCORM API ---
  let api = window.API || window.API_1484_11;
  if (!api || !(api.LMSSetValue || api.SetValue)) {
    addLog('❌ SCORM API не найден');
    return;
  }

  let orig = api.LMSSetValue || api.SetValue;
  let dict = {
    "cmi.core.score.min": "Минимальный балл",
    "cmi.core.score.max": "Максимальный балл",
    "cmi.core.score.raw": "Текущий балл",
    "cmi.core.lesson_status": "Статус",
    "cmi.core.session_time": "Время работы",
    "cmi.completion_status": "Статус завершения",
    "cmi.success_status": "Статус успеха",
    "cmi.core.lesson_location": "Позиция",
    "cmi.core.total_time": "Общее время"
  };
  let lastStatus = '';

  let handler = function(varName, val) {
    if (varName.includes('suspend_data')) return orig.call(this, varName, val);
    
    // Обновляем время
    if (varName.toLowerCase().includes('time') && /^\d{2}:\d{2}:\d{2}$/.test(val)) {
      updateClock(val);
    }
    
    // Обновляем баллы
    if (varName.includes('score.max')) {
      currentScoreMax = val;
      updateScore(currentScoreRaw, currentScoreMax);
    }
    if (varName.includes('score.raw')) {
      currentScoreRaw = val;
      updateScore(currentScoreRaw, currentScoreMax);
    }
    
    // Обновляем статус
    if (varName.includes('lesson_status') || varName.includes('completion_status') || varName.includes('success_status')) {
      currentStatus = val;
      updateStatus(val);
    }
    
    // Формируем читаемое сообщение для лога
    let label = dict[varName] || varName.replace(/^cmi\.(core\.)?/, '').replace(/\./g, ' ');
    if (varName.includes('status') || varName.includes('Status')) {
      if (val === 'completed') label += ' (завершено)';
      else if (val === 'incomplete') label += ' (не завершено)';
      else if (val === 'passed') label += ' (сдано)';
      else if (val === 'failed') label += ' (не сдано)';
    }
    let msg = 'SCORM: ' + label + ' = ' + val;
    addLog(msg);
    
    // Сообщение о завершении
    if (varName === 'cmi.core.lesson_status' && val === 'completed' && lastStatus !== 'completed') {
      addLog('✅ КУРС ЗАВЕРШЁН');
    }
    lastStatus = val;
    
    return orig.call(this, varName, val);
  };

  if (api.LMSSetValue) api.LMSSetValue = handler;
  else api.SetValue = handler;

  // --- Запуск панели ---
  let panel = createPanel();
  addLog('⏳ SCORM перехват запущен');
  addLog('✅ Перехват активен, авто-закрытие окон включено');
})();
