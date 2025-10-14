(() => {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Lead data management
  window.SalesQueenLead = (() => {
    const leadData = {
      businessName: '',
      industry: '',
      phone: '',
      email: '',
      website: '',
      address: '',
      notes: ''
    };

    function sanitize(str) {
      return String(str || '').trim().slice(0, 500);
    }

    function set(partial) {
      Object.assign(leadData, Object.fromEntries(Object.entries(partial).map(([k, v]) => [k, sanitize(v)])));
      autoSave();
    }

    function captureFromPlace(place) {
      set({
        businessName: place.name,
        address: place.vicinity || place.formatted_address || ''
      });
      showToast('Business selected. Lead captured.', 'text-bg-success');
    }

    function get() { return { ...leadData }; }

    function autoSave() {
      const project = SalesQueenStorage.load() || {};
      project.lead = get();
      SalesQueenStorage.save(project);
    }

    return { set, get, captureFromPlace };
  })();

  // Quote form logic and validation
  const quoteForm = document.getElementById('quote-form');
  if (quoteForm) {
    quoteForm.addEventListener('submit', (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (!quoteForm.checkValidity()) {
        quoteForm.classList.add('was-validated');
        return;
      }

      const numPages = Number(document.getElementById('num-pages').value || 0);
      const ecommerce = document.getElementById('ecommerce').value;
      const seo = document.getElementById('seo').value;
      const timeline = Number(document.getElementById('timeline').value || 0);
      const maintenance = document.getElementById('maintenance').checked;

      const breakdown = [];
      const basePerPage = 150;
      const pagesCost = numPages * basePerPage;
      breakdown.push({ label: 'Pages', amount: pagesCost });

      const ecommerceCost = ecommerce === 'basic' ? 1200 : ecommerce === 'advanced' ? 2400 : 0;
      breakdown.push({ label: 'E-commerce', amount: ecommerceCost });

      const seoMap = { standard: 500, plus: 900, premium: 1500 };
      const seoCost = seoMap[seo] || 0;
      breakdown.push({ label: 'SEO', amount: seoCost });

      const rushMultiplier = timeline <= 4 ? 1.25 : 1.0;
      const maintenanceCost = maintenance ? 120 : 0; // per month (not in total)

      const subtotal = breakdown.reduce((s, i) => s + i.amount, 0);
      const total = Math.round(subtotal * rushMultiplier);

      renderBreakdown(breakdown, total, maintenanceCost);
      renderChart(breakdown);

      // mark progress
      SalesQueenProgress.setStage('quote', 'complete');
    });
  }

  function renderBreakdown(items, total, maintenanceMonthly) {
    const list = document.getElementById('estimate-breakdown');
    const totalEl = document.getElementById('estimate-total');
    if (!list || !totalEl) return;
    list.innerHTML = '';
    items.forEach(i => {
      const li = document.createElement('li');
      li.className = 'list-group-item d-flex justify-content-between align-items-center';
      li.innerHTML = `<span>${i.label}</span><span>$${i.amount.toLocaleString()}</span>`;
      list.appendChild(li);
    });
    if (maintenanceMonthly) {
      const li = document.createElement('li');
      li.className = 'list-group-item d-flex justify-content-between align-items-center';
      li.innerHTML = `<span>Maintenance (monthly)</span><span>$${maintenanceMonthly.toLocaleString()}</span>`;
      list.appendChild(li);
    }
    totalEl.textContent = `$${total.toLocaleString()}`;
  }

  let estimateChart;
  function renderChart(items) {
    const ctx = document.getElementById('estimate-chart');
    if (!ctx) return;
    const labels = items.map(i => i.label);
    const data = items.map(i => i.amount);
    const colors = ['#0d6efd', '#6f42c1', '#20c997', '#fd7e14', '#198754'];
    if (estimateChart) {
      estimateChart.destroy();
    }
    estimateChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{ data, backgroundColor: colors.slice(0, data.length) }]
      },
      options: {
        plugins: { legend: { position: 'bottom' } },
        animation: { duration: 500 }
      }
    });
  }

  // Save / Export / Share
  const btnSave = document.getElementById('btn-save');
  const btnExport = document.getElementById('btn-export');
  const exportMenu = document.querySelectorAll('.dropdown-menu [data-export]');
  const btnShare = document.getElementById('btn-share');

  function collectProjectState() {
    return {
      progress: SalesQueenProgress.getState(),
      quote: collectQuoteForm(),
      design: collectDesignState(),
      find: collectFindState(),
      lead: window.SalesQueenLead ? window.SalesQueenLead.get() : null
    };
  }

  function collectQuoteForm() {
    const form = document.getElementById('quote-form');
    if (!form) return null;
    return {
      numPages: Number(document.getElementById('num-pages').value || 0),
      ecommerce: document.getElementById('ecommerce').value || '',
      seo: document.getElementById('seo').value || '',
      timeline: Number(document.getElementById('timeline').value || 0),
      maintenance: document.getElementById('maintenance').checked
    };
  }

  function collectDesignState() {
    const canvas = document.getElementById('design-canvas');
    if (!canvas) return null;
    const blocks = [...canvas.querySelectorAll('.sq-block')].map(b => ({ type: b.dataset.type, html: b.innerHTML }));
    return { blocks };
  }

  function collectFindState() {
    const input = document.getElementById('place-input');
    return { query: input ? input.value : '' };
  }

  btnSave && btnSave.addEventListener('click', () => {
    const ok = SalesQueenStorage.save(collectProjectState());
    const msg = ok ? 'Progress saved locally.' : 'Failed to save.';
    showToast(msg, ok ? 'text-bg-success' : 'text-bg-danger');
  });

  exportMenu.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const mode = item.getAttribute('data-export');
      const data = collectProjectState();
      if (mode === 'json') {
        SalesQueenExport.exportJSON('salesqueen_project.json', data);
      } else {
        SalesQueenExport.exportPDFStub();
      }
    });
  });

  btnShare && btnShare.addEventListener('click', async () => {
    const data = collectProjectState();
    const text = `SalesQueen Project\nProgress: ${JSON.stringify(data.progress)}\nQuote: ${JSON.stringify(data.quote)}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'SalesQueen Project', text });
      } catch (_) { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(text);
      showToast('Project details copied to clipboard.', 'text-bg-secondary');
    }
  });

  // Simple toast feedback using Bootstrap
  function showToast(message, themeClass = '') {
    const toast = document.createElement('div');
    toast.className = `toast align-items-center ${themeClass}`;
    toast.role = 'status'; toast.ariaLive = 'polite'; toast.ariaAtomic = 'true';
    toast.style.position = 'fixed'; toast.style.bottom = '16px'; toast.style.right = '16px';
    toast.innerHTML = `<div class="d-flex"><div class="toast-body">${message}</div><button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button></div>`;
    document.body.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast, { delay: 2500 });
    bsToast.show();
    toast.addEventListener('hidden.bs.toast', () => toast.remove());
  }
  // Expose globally for other modules (e.g., estimator)
  window.SQ_toast = showToast;

  // Ripple effect for buttons
  document.body.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn');
    if (!btn) return;
    const ripple = document.createElement('span');
    ripple.style.position = 'absolute';
    ripple.style.borderRadius = '50%';
    ripple.style.transform = 'scale(0)';
    ripple.style.opacity = '0.4';
    ripple.style.pointerEvents = 'none';
    ripple.style.background = 'currentColor';
    ripple.style.transition = 'transform 300ms ease, opacity 300ms ease';
    const rect = btn.getBoundingClientRect();
    ripple.style.width = ripple.style.height = Math.max(rect.width, rect.height) + 'px';
    ripple.style.left = (e.clientX - rect.left - rect.width/2) + 'px';
    ripple.style.top = (e.clientY - rect.top - rect.height/2) + 'px';
    btn.style.position = 'relative';
    btn.appendChild(ripple);
    requestAnimationFrame(() => {
      ripple.style.transform = 'scale(1)';
      ripple.style.opacity = '0';
    });
    setTimeout(() => ripple.remove(), 350);
  }, true);

  // Drag visual effects
  document.addEventListener('dragstart', (e) => {
    const draggable = e.target.closest('.sq-draggable, .sq-block');
    if (draggable) draggable.classList.add('dragging');
  });
  document.addEventListener('dragend', (e) => {
    const draggable = e.target.closest('.sq-draggable, .sq-block');
    if (draggable) draggable.classList.remove('dragging');
  });

  // Mobile collapsible sections (use Bootstrap collapse by data attributes if needed)
  // Example: collapse estimator groups on small screens – handled via layout; extend as required.

  // Count-up animation for estimator totals
  function animateNumber(el, to, duration = 1000) {
    const from = Number((el.textContent || '0').replace(/[^0-9]/g, '')) || 0;
    const start = performance.now();
    function tick(now) {
      const p = Math.min(1, (now - start) / duration);
      const v = Math.round(from + (to - from) * p);
      el.textContent = '₹' + v.toLocaleString('en-IN');
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  // Hook estimator totals for animation
  const subtotalEl = document.getElementById('estimate-subtotal');
  const gstEl = document.getElementById('estimate-gst');
  const totalEl = document.getElementById('estimate-total');
  const _setText = (el, val) => { if (!el) return; animateNumber(el, val); };
  document.addEventListener('sq-estimate-updated', (e) => {
    const { modified, gst, total } = e.detail || {};
    _setText(subtotalEl, modified || 0);
    _setText(gstEl, gst || 0);
    _setText(totalEl, total || 0);
  });

  // Drag & Drop for Design Canvas
  const palette = document.getElementById('component-palette');
  const canvas = document.getElementById('design-canvas');
  // multiple palettes (accordion sections)
  const allPalettes = document.querySelectorAll('[id^="component-palette-"]');
  if (canvas) {
    [palette, ...allPalettes].filter(Boolean).forEach(pal => {
      pal.addEventListener('dragstart', (e) => {
        const target = e.target.closest('.sq-draggable');
        if (!target) return;
        e.dataTransfer.setData('text/plain', target.getAttribute('data-type'));
      });
    });

    canvas.addEventListener('dragover', (e) => {
      e.preventDefault();
      canvas.classList.add('drag-over');
    });
    canvas.addEventListener('dragleave', () => canvas.classList.remove('drag-over'));
    canvas.addEventListener('drop', (e) => {
      e.preventDefault();
      canvas.classList.remove('drag-over');
      const type = e.dataTransfer.getData('text/plain');
      if (!type) return;
      addBlockToCanvas(type);
      SalesQueenProgress.setStage('design', 'in-progress');
    });
  }

  function addBlockToCanvas(type) {
    const block = document.createElement('div');
    block.className = 'sq-block';
    block.dataset.type = type;
    block.contentEditable = 'true';
    block.innerHTML = getDefaultBlockHtml(type);
    canvas.appendChild(block);
    canvas.dataset.empty = 'false';
    enableBlockInteractions(block);
    persistDesign();
  }

  function getDefaultBlockHtml(type) {
    switch (type) {
      case 'hero':
        return '<h3>Hero Banner</h3><p>Click to edit headline and copy.</p>';
      case 'features':
        return '<h4>Features</h4><ul><li>Feature one</li><li>Feature two</li><li>Feature three</li></ul>';
      case 'testimonials':
        return '<h4>Testimonials</h4><blockquote>“Great service!” — Happy Client</blockquote>';
      case 'cta':
        return '<h4>Call to Action</h4><button class="btn btn-primary">Get Started</button>';
      case 'footer':
        return '<p class="mb-0">© Your Company</p>';
      default:
        return '<p>New block</p>';
    }
  }

  // Selection and styling
  let selectedBlock = null;
  function enableBlockInteractions(block) {
    block.addEventListener('click', (e) => {
      selectBlock(block);
    });
    block.setAttribute('draggable', 'true');
    block.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/block-index', [...canvas.querySelectorAll('.sq-block')].indexOf(block));
    });
  }
  function selectBlock(block) {
    canvas.querySelectorAll('.sq-block').forEach(b => b.classList.remove('selected'));
    selectedBlock = block;
    block.classList.add('selected');
    const hint = document.getElementById('style-selection-hint');
    if (hint) hint.textContent = `Editing: ${block.dataset.type}`;
  }

  // Reorder inside canvas
  if (canvas) {
    canvas.addEventListener('dragover', (e) => {
      // allow internal reorder by dropping before/after
      if (e.dataTransfer.types.includes('text/block-index')) e.preventDefault();
    });
    canvas.addEventListener('drop', (e) => {
      const fromIndex = e.dataTransfer.getData('text/block-index');
      if (fromIndex !== '') {
        const blocks = [...canvas.querySelectorAll('.sq-block')];
        const from = blocks[Number(fromIndex)];
        const to = e.target.closest('.sq-block');
        if (from && to && from !== to) {
          canvas.insertBefore(from, to);
          persistDesign();
        }
      }
    });
    // enable interactions for preloaded blocks
    canvas.querySelectorAll('.sq-block').forEach(enableBlockInteractions);
  }

  // Style form
  const styleForm = document.getElementById('style-form');
  const styleApply = document.getElementById('style-apply');
  if (styleForm && styleApply) {
    styleApply.addEventListener('click', () => {
      if (!selectedBlock) { showToast('Select a block to style.'); return; }
      const bg = document.getElementById('style-bg').value;
      const color = document.getElementById('style-color').value;
      const padding = Number(document.getElementById('style-padding').value || 0);
      const font = Number(document.getElementById('style-font').value || 16);
      selectedBlock.style.backgroundColor = bg;
      selectedBlock.style.color = color;
      selectedBlock.style.padding = `${padding}px`;
      selectedBlock.style.fontSize = `${font}px`;
      persistDesign();
    });
  }

  // Device preview
  const wrap = document.querySelector('.sq-canvas-wrap');
  document.querySelectorAll('[data-device]').forEach(btn => {
    btn.addEventListener('click', () => {
      wrap && wrap.setAttribute('data-device', btn.getAttribute('data-device'));
    });
  });

  // Export HTML
  const exportHtmlBtn = document.getElementById('btn-export-html');
  exportHtmlBtn && exportHtmlBtn.addEventListener('click', () => {
    const html = generateCanvasHtml();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'salesqueen_layout.html';
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  });

  function generateCanvasHtml() {
    const content = [...canvas.querySelectorAll('.sq-block')].map(b => `<section data-type="${b.dataset.type}" style="${b.getAttribute('style')||''}">${b.innerHTML}</section>`).join('\n');
    return `<!doctype html>\n<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>SalesQueen Layout</title></head><body>${content}</body></html>`;
  }

  function persistDesign() {
    const project = SalesQueenStorage.load() || {};
    const blocks = [...canvas.querySelectorAll('.sq-block')].map(b => ({ type: b.dataset.type, html: b.innerHTML, style: b.getAttribute('style') || '' }));
    project.design = { blocks };
    SalesQueenStorage.save(project);
  }

  // Map placeholder + simple interaction
  const searchBtn = document.getElementById('btn-search');
  const placeInput = document.getElementById('place-input');
  const mapEl = document.getElementById('map');
  if (searchBtn && placeInput && mapEl) {
    searchBtn.addEventListener('click', () => {
      if (placeInput.value.trim().length === 0) {
        placeInput.focus();
        return;
      }
      mapEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      mapEl.classList.add('shadow-soft');
      setTimeout(() => mapEl.classList.remove('shadow-soft'), 1200);
    });
  }

  // Restore saved state if available
  document.addEventListener('DOMContentLoaded', () => {
    const saved = SalesQueenStorage.load();
    if (!saved) return;
    if (saved.progress) SalesQueenProgress.setState(saved.progress);
    if (saved.quote) {
      document.getElementById('num-pages').value = saved.quote.numPages || 0;
      document.getElementById('ecommerce').value = saved.quote.ecommerce || '';
      document.getElementById('seo').value = saved.quote.seo || '';
      document.getElementById('timeline').value = saved.quote.timeline || 0;
      document.getElementById('maintenance').checked = !!saved.quote.maintenance;
    }
    if (saved.design && saved.design.blocks) {
      saved.design.blocks.forEach(b => {
        const block = document.createElement('div');
        block.className = 'sq-block';
        block.dataset.type = b.type;
        block.contentEditable = 'true';
        block.innerHTML = b.html;
        if (b.style) block.setAttribute('style', b.style);
        canvas.appendChild(block);
      });
      if (saved.design.blocks.length) canvas.dataset.empty = 'false';
      // re-enable interactions after restore
      canvas.querySelectorAll('.sq-block').forEach(enableBlockInteractions);
    }
    if (saved.find && saved.find.query && placeInput) {
      placeInput.value = saved.find.query;
    }
    if (saved.lead && window.SalesQueenLead) {
      window.SalesQueenLead.set(saved.lead);
    }
  });
  // Manual form validation + autosave
  const mf = document.getElementById('manual-form');
  if (mf) {
    mf.addEventListener('submit', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!mf.checkValidity()) {
        mf.classList.add('was-validated');
        return;
      }
      const payload = {
        businessName: document.getElementById('mf-name').value,
        industry: document.getElementById('mf-industry').value,
        phone: document.getElementById('mf-phone').value,
        email: document.getElementById('mf-email').value,
        website: document.getElementById('mf-website').value,
        notes: document.getElementById('mf-notes').value
      };
      window.SalesQueenLead.set(payload);
      SalesQueenProgress.setStage('lead', 'complete');
      showToast('Lead saved. Proceed to quote.', 'text-bg-success');
    });
  }
})();


