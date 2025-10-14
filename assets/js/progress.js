const SalesQueenProgress = (() => {
  const stageOrder = ['lead', 'quote', 'design'];
  const stageStates = { lead: 'incomplete', quote: 'incomplete', design: 'incomplete' };

  function computePercentage() {
    const completeCount = Object.values(stageStates).filter(s => s === 'complete').length;
    const inProgressCount = Object.values(stageStates).filter(s => s === 'in-progress').length;
    const total = stageOrder.length;
    // simple weighting: complete = 100%, in-progress = 50%
    const pct = Math.round(((completeCount + inProgressCount * 0.5) / total) * 100);
    return Math.min(100, Math.max(0, pct));
  }

  function render() {
    const container = document.querySelector('.sq-progress');
    if (!container) return;
    stageOrder.forEach(stage => {
      const el = container.querySelector(`.sq-stage[data-stage="${stage}"]`);
      if (!el) return;
      el.classList.remove('in-progress', 'complete');
      const state = stageStates[stage];
      if (state === 'in-progress') el.classList.add('in-progress');
      if (state === 'complete') el.classList.add('complete');
    });
    const pctEl = container.querySelector('.sq-percentage');
    if (pctEl) pctEl.textContent = `${computePercentage()}%`;
  }

  function setStage(stage, state) {
    if (!stageOrder.includes(stage)) return;
    if (!['incomplete', 'in-progress', 'complete'].includes(state)) return;
    stageStates[stage] = state;
    render();
  }

  function getState() {
    return { ...stageStates };
  }

  function setState(newState) {
    stageOrder.forEach(s => {
      if (newState[s]) stageStates[s] = newState[s];
    });
    render();
  }

  document.addEventListener('DOMContentLoaded', render);

  return { setStage, getState, setState };
})();


