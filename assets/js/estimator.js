(() => {
  const TYPES = [
    { id: 'ecommerce', label: 'E-commerce', price: 50000, icon: 'fa-bag-shopping' },
    { id: 'business', label: 'Business/Corporate', price: 25000, icon: 'fa-briefcase' },
    { id: 'portfolio', label: 'Portfolio', price: 15000, icon: 'fa-images' },
    { id: 'blog', label: 'Blog/News', price: 20000, icon: 'fa-newspaper' },
    { id: 'custom', label: 'Custom Application', price: 75000, icon: 'fa-gears' }
  ];

  const FEATURES_CORE = [
    { id: 'responsive', label: 'Responsive Design', price: 0 },
    { id: 'seo-basic', label: 'Basic SEO', price: 1500 },
    { id: 'cms', label: 'CMS Integration', price: 5000 }
  ];

  const FEATURES_ADDONS = [
    { id: 'payments', label: 'Online Payments', price: 7000 },
    { id: 'multi-language', label: 'Multi-language', price: 6000 },
    { id: 'analytics', label: 'Analytics Setup', price: 2500 },
    { id: 'chatbot', label: 'Chatbot', price: 8000 },
    { id: 'content', label: 'Content Writing (per 5 pages)', price: 6000 }
  ];

  const GST_RATE = 0.18;

  const state = {
    type: null,
    features: new Set(),
    timeline: 'standard',
    budget: 0
  };

  // DOM
  const stepper = document.querySelector('.sq-stepper');
  const panes = document.querySelectorAll('.sq-step-pane');
  const prevBtn = document.getElementById('estimator-prev');
  const nextBtn = document.getElementById('estimator-next');
  const form = document.getElementById('estimator-form');
  if (!form) return;

  // Populate type cards
  const typeCards = document.getElementById('type-cards');
  typeCards.innerHTML = TYPES.map(t => `
    <div class="col">
      <div class="sq-card-select p-3 h-100" role="button" tabindex="0" data-type="${t.id}">
        <div class="d-flex align-items-center gap-2">
          <i class="fa-solid ${t.icon} text-primary"></i>
          <strong>${t.label}</strong>
        </div>
        <div class="text-secondary mt-1">Base: ₹${t.price.toLocaleString('en-IN')}</div>
      </div>
    </div>`).join('');

  typeCards.querySelectorAll('[data-type]').forEach(card => {
    card.addEventListener('click', () => selectType(card.dataset.type, card));
    card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectType(card.dataset.type, card); } });
  });

  function selectType(typeId, card) {
    state.type = typeId;
    typeCards.querySelectorAll('[data-type]').forEach(c => c.classList.remove('active'));
    card.classList.add('active');
    updateTotals();
  }

  // Populate features
  function renderFeatureList(containerId, items) {
    const container = document.getElementById(containerId);
    container.innerHTML = items.map(i => `
      <div class="col">
        <div class="sq-feature-item">
          <div>
            <label class="form-check-label" for="feat-${i.id}">${i.label}</label>
          </div>
          <div class="d-flex align-items-center gap-2">
            <div class="text-secondary small">₹${i.price.toLocaleString('en-IN')}</div>
            <input class="form-check-input" type="checkbox" id="feat-${i.id}" data-feature="${i.id}">
          </div>
        </div>
      </div>`).join('');
    container.querySelectorAll('[data-feature]').forEach(cb => cb.addEventListener('change', () => toggleFeature(cb.dataset.feature, cb.checked)));
  }
  renderFeatureList('features-core', FEATURES_CORE);
  renderFeatureList('features-addons', FEATURES_ADDONS);

  function toggleFeature(id, checked) {
    if (checked) state.features.add(id); else state.features.delete(id);
    updateTotals();
  }

  // Timeline & budget
  document.querySelectorAll('input[name="timeline"]').forEach(r => r.addEventListener('change', () => {
    state.timeline = r.value;
    updateTotals();
  }));
  const budgetInput = document.getElementById('budget');
  budgetInput && budgetInput.addEventListener('input', () => {
    state.budget = Number(budgetInput.value || 0);
    updateTotals();
  });

  // Step navigation
  let currentStep = 1;
  updateStepUI();
  prevBtn.addEventListener('click', () => { if (currentStep > 1) { currentStep--; updateStepUI(); }});
  nextBtn.addEventListener('click', () => { if (validateStep(currentStep)) { currentStep = Math.min(4, currentStep + 1); updateStepUI(); }});

  function updateStepUI() {
    panes.forEach(p => p.classList.toggle('d-none', Number(p.dataset.stepPane) !== currentStep));
    stepper.querySelectorAll('.sq-step').forEach(s => {
      const stepNum = Number(s.dataset.step);
      s.classList.toggle('active', stepNum === currentStep);
    });
    prevBtn.disabled = currentStep === 1;
    nextBtn.textContent = currentStep === 4 ? 'Finish' : 'Next';
    form.setAttribute('aria-valuenow', String(currentStep));
    if (currentStep === 4) updateTotals();
  }

  function validateStep(step) {
    switch (step) {
      case 1:
        if (!state.type) { showToast('Please select a website type.', 'text-bg-warning'); return false; }
        return true;
      default:
        return true;
    }
  }

  // Pricing
  function getBasePrice() {
    const t = TYPES.find(x => x.id === state.type);
    return t ? t.price : 0;
  }
  function getFeaturesTotal() {
    const all = [...FEATURES_CORE, ...FEATURES_ADDONS];
    return [...state.features].reduce((sum, id) => {
      const f = all.find(x => x.id === id);
      return sum + (f ? f.price : 0);
    }, 0);
  }
  function applyTimelineModifier(amount) {
    if (state.timeline === 'rush') return Math.round(amount * 1.3);
    if (state.timeline === 'flex') return Math.round(amount * 0.9);
    return amount;
  }

  function formatINR(n) {
    return `₹${n.toLocaleString('en-IN')}`;
  }

  function updateTotals() {
    const breakdown = document.getElementById('estimate-breakdown');
    const subtotalEl = document.getElementById('estimate-subtotal');
    const gstEl = document.getElementById('estimate-gst');
    const totalEl = document.getElementById('estimate-total');
    const warning = document.getElementById('budget-warning');
    if (!breakdown || !subtotalEl || !gstEl || !totalEl) return;

    const base = getBasePrice();
    const features = getFeaturesTotal();
    const preTimeline = base + features;
    const modified = applyTimelineModifier(preTimeline);
    const gst = Math.round(modified * GST_RATE);
    const total = modified + gst;

    // Render breakdown
    const items = [
      { label: 'Base package', amount: base },
      { label: 'Selected features', amount: features },
      { label: `Timeline (${state.timeline})`, amount: modified - preTimeline }
    ];
    breakdown.innerHTML = '';
    items.forEach(i => {
      const li = document.createElement('li');
      li.className = 'list-group-item d-flex justify-content-between align-items-center';
      li.innerHTML = `<span>${i.label}</span><span>${formatINR(i.amount)}</span>`;
      breakdown.appendChild(li);
    });
    subtotalEl.textContent = formatINR(modified);
    gstEl.textContent = formatINR(gst);
    totalEl.textContent = formatINR(total);

    // Chart
    renderChart([
      { label: 'Base', amount: base },
      { label: 'Features', amount: features },
      { label: 'Timeline', amount: modified - preTimeline },
      { label: 'GST', amount: gst }
    ]);

    // Budget warning
    if (state.budget > 0 && total > state.budget) {
      warning.classList.remove('d-none');
      warning.textContent = `Your selections exceed your budget by ${formatINR(total - state.budget)}. Consider deselecting some features or choosing a flexible timeline.`;
    } else {
      warning.classList.add('d-none');
      warning.textContent = '';
    }

    // Save to project
    const project = SalesQueenStorage.load() || {};
    project.estimate = { type: state.type, features: [...state.features], timeline: state.timeline, budget: state.budget, total, modified, gst };
    SalesQueenStorage.save(project);
    SalesQueenProgress.setStage('quote', 'complete');
  }

  // Chart (reuse global Chart)
  let chart;
  function renderChart(items) {
    const ctx = document.getElementById('estimate-chart');
    if (!ctx || !window.Chart) return;
    const labels = items.map(i => i.label);
    const data = items.map(i => i.amount);
    const colors = ['#0d6efd', '#6f42c1', '#20c997', '#fd7e14'];
    if (chart) chart.destroy();
    chart = new Chart(ctx, { type: 'doughnut', data: { labels, datasets: [{ data, backgroundColor: colors }] }, options: { plugins: { legend: { position: 'bottom' } } } });
  }

  // Quote export/share/email
  document.getElementById('btn-generate-quote')?.addEventListener('click', () => {
    showToast('Quote ready. You can print or share now.', 'text-bg-success');
    window.scrollTo({ top: document.getElementById('phase-quote').offsetTop, behavior: 'smooth' });
  });
  document.getElementById('btn-print-quote')?.addEventListener('click', () => window.print());
  document.getElementById('btn-export-json')?.addEventListener('click', (e) => {
    e.preventDefault();
    const project = SalesQueenStorage.load() || {};
    SalesQueenExport.exportJSON('salesqueen_quote.json', project.estimate || {});
  });
  document.getElementById('btn-email-quote')?.addEventListener('click', () => {
    const project = SalesQueenStorage.load() || {};
    const est = project.estimate || {};
    const body = encodeURIComponent(`Website Type: ${est.type}\nTimeline: ${est.timeline}\nTotal: ₹${(est.total||0).toLocaleString('en-IN')}`);
    window.location.href = `mailto:?subject=SalesQueen Quote&body=${body}`;
  });
})();


