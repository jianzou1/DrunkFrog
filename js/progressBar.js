let isUpdating = false;
let timerId = null;
let visibilityHandler = null;

// Simplified i18n wrapper (仅保留真正需要多语言的部分)
export const i18n = {
  getTranslation: (key, ...params) => LangManager.cachedTranslate(key, ...params),
  safeUpdateElement: (element, key, ...params) => 
    LangManager.applyParameters(element, key, ...params)
};

export function updateProgressBar() {
  if (isUpdating) return;
  isUpdating = true;

  const now = new Date();
  const gridWidth = 28;
  const container = document.querySelector('.progress-container');
  const containerWidth = container?.clientWidth;

  if (!containerWidth) {
    console.error(i18n.getTranslation('errors.progress_container'));
    isUpdating = false;
    return;
  }

  const totalGrids = Math.floor(containerWidth / (gridWidth + 2));

  function updateProgress(start, end, percentageId, progressBarId) {
    const totalDuration = (end - start) / (1000 * 60);
    const passedDuration = (now - start) / (1000 * 60);
    const targetPercentage = Math.min((passedDuration / totalDuration) * 100, 100);

    const percentageElement = document.getElementById(percentageId);
    if (!percentageElement) {
      console.error(i18n.getTranslation('errors.element_not_found', percentageId));
      isUpdating = false;
      return;
    }

    const gridCount = Math.max(1, Math.floor((targetPercentage / 100) * totalGrids));
    const progressBar = document.getElementById(progressBarId);
    if (!progressBar) {
      console.error(i18n.getTranslation('errors.element_not_found', progressBarId));
      isUpdating = false;
      return;
    }

    progressBar.innerHTML = '';

    function addGrid(i) {
      if (i < gridCount) {
        const grid = document.createElement('div');
        grid.className = 'grid';
        progressBar.appendChild(grid);
        setTimeout(() => addGrid(i + 1), Math.random() * 80);
      } else {
        isUpdating = false;
      }
    }
    addGrid(0);

    let currentPercentage = 0;
    function animatePercentage() {
      if (currentPercentage < targetPercentage) {
        currentPercentage += 1;
        percentageElement.textContent = `${Math.max(Math.floor(currentPercentage), 1)}%`;
        requestAnimationFrame(animatePercentage);
      } else {
        percentageElement.textContent = `${Math.max(Math.floor(targetPercentage), 1)}%`;
      }
    }
    animatePercentage();
  }

  // Update all progress bars
  updateProgress(
    new Date(now.getFullYear(), 0, 1),
    new Date(now.getFullYear() + 1, 0, 1),
    'progress-percentage',
    'progress-bar'
  );
  updateProgress(
    new Date(now.getFullYear(), now.getMonth(), 1),
    new Date(now.getFullYear(), now.getMonth() + 1, 1),
    'month-percentage',
    'month-progress-bar'
  );
  updateProgress(
    new Date(now.getFullYear(), now.getMonth(), now.getDate()),
    new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
    'day-percentage',
    'day-progress-bar'
  );

  startCountdownTimer();
}

function startCountdownTimer() {
  const cleanup = () => {
    if (timerId) clearTimeout(timerId);
    if (visibilityHandler) {
      document.removeEventListener('visibilitychange', visibilityHandler);
    }
  };

  const updateTimer = () => {
    const refreshTimerElement = document.getElementById('refresh-timer');
    const refreshContainer = document.getElementById('refresh-container');
    const now = new Date();
    const secondsLeft = 3600 - (now.getMinutes() * 60 + now.getSeconds());

    if (refreshTimerElement) {
      const minutesLeft = Math.floor(secondsLeft / 60);
      const secondsLeftWithinMinute = secondsLeft % 60;

      LangManager.applyParameters(
        refreshTimerElement,
        'index_refresh',
        minutesLeft,
        secondsLeftWithinMinute
      );

      if (refreshContainer) {
        refreshContainer.style.display = 'flex';
      }
    }

    if (secondsLeft > 0) {
      timerId = setTimeout(updateTimer, 1000);
    } else {
      try {
        updateProgressBar();
        const refreshTimerElement = document.getElementById('refresh-timer');
        if (refreshTimerElement) {
          LangManager.applyParameters(
            refreshTimerElement,
            'timer.refresh_complete',
            new Date().toLocaleTimeString()
          );
        }
      } catch (error) {
        console.error(i18n.getTranslation('errors.progress_update'), error);
      }
    }
  };

  const ensureDOMReady = (callback, interval = 50) => {
    const check = () => {
      if (document.getElementById('refresh-timer')) {
        callback();
      } else {
        setTimeout(check, interval);
      }
    };
    check();
  };

  visibilityHandler = () => {
    if (document.visibilityState === 'visible') {
      ensureDOMReady(updateTimer);
    }
  };
  document.addEventListener('visibilitychange', visibilityHandler);

  cleanup();
  if (LangManager.isInitialized) {
    ensureDOMReady(updateTimer);
  } else {
    LangManager.init().then(() => ensureDOMReady(updateTimer));
  }
}

export function initProgressSystem() {
  const init = () => {
    if (!document.querySelector('.progress-container')) {
      setTimeout(init, 50);
      return;
    }
    updateProgressBar();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}