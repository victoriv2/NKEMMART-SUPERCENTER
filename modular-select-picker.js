/**
 * RALPHMART UNIVERSAL MODULAR SELECT PICKER
 * Automatically upgrades native HTML <select> elements into:
 * - Custom Modal Dialogs (on Desktop)
 * - Bottom Sheet Modals / Action Sheets (on Mobile)
 * - Searchable modular pickers with custom radio styling
 * Keeps underlying native <select> in 100% sync, dispatching real 'change' events.
 */
(function() {
  function initModularSelects() {
    const selects = document.querySelectorAll('select:not([data-modular-select-ready]):not([data-modular-ignore])');
    selects.forEach(select => {
      // Skip if explicitly hidden, ignored, or inside an already generated modal
      if (select.closest('.modular-picker-dialog') || select.closest('.filter-picker-modal-dialog')) {
        return;
      }
      if (select.style.display === 'none' && !select.classList.contains('modular-select-native-hidden')) {
        return;
      }
      enhanceSelect(select);
    });
  }

  function enhanceSelect(select) {
    select.setAttribute('data-modular-select-ready', 'true');
    select.classList.add('modular-select-native-hidden');

    // Create trigger button
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'modular-select-btn';
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.setAttribute('aria-expanded', 'false');

    // Match original select attributes
    if (select.id) {
      trigger.setAttribute('data-target-select', select.id);
    }
    if (select.disabled) {
      trigger.disabled = true;
    }

    const labelSpan = document.createElement('span');
    labelSpan.className = 'btn-label';
    trigger.appendChild(labelSpan);

    const chevronSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    chevronSvg.setAttribute('class', 'btn-chevron');
    chevronSvg.setAttribute('width', '14');
    chevronSvg.setAttribute('height', '14');
    chevronSvg.setAttribute('viewBox', '0 0 24 24');
    chevronSvg.setAttribute('fill', 'none');
    chevronSvg.setAttribute('stroke', 'currentColor');
    chevronSvg.setAttribute('stroke-width', '2.5');
    chevronSvg.innerHTML = '<polyline points="6 9 12 15 18 9"></polyline>';
    trigger.appendChild(chevronSvg);

    // Insert trigger after select in DOM
    if (select.nextSibling) {
      select.parentNode.insertBefore(trigger, select.nextSibling);
    } else {
      select.parentNode.appendChild(trigger);
    }

    function updateTriggerState() {
      trigger.disabled = select.disabled;
      const selectedIndex = select.selectedIndex;
      const selectedOpt = selectedIndex >= 0 ? select.options[selectedIndex] : null;

      if (selectedOpt && selectedOpt.value !== '' && !selectedOpt.disabled) {
        labelSpan.textContent = selectedOpt.textContent.trim();
        labelSpan.classList.remove('is-placeholder');
      } else {
        let placeholderText = 'Select an option';
        if (selectedOpt && selectedOpt.textContent.trim()) {
          placeholderText = selectedOpt.textContent.trim();
        } else if (select.options.length > 0 && select.options[0].textContent.trim()) {
          placeholderText = select.options[0].textContent.trim();
        }
        labelSpan.textContent = placeholderText;
        labelSpan.classList.add('is-placeholder');
      }
    }

    updateTriggerState();

    // Listen to native select change & input events
    select.addEventListener('change', updateTriggerState);
    select.addEventListener('input', updateTriggerState);

    // MutationObserver to watch for disabled attribute or dynamic option changes
    const observer = new MutationObserver(() => {
      updateTriggerState();
    });
    observer.observe(select, { attributes: true, childList: true, subtree: true });

    // Click trigger opens modal
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (select.disabled) return;
      openPickerModal(select, trigger, updateTriggerState);
    });
  }

  // Shared modal overlay singleton
  let sharedOverlay = null;

  function getSharedModal() {
    if (!sharedOverlay) {
      sharedOverlay = document.createElement('div');
      sharedOverlay.className = 'modular-picker-overlay';
      sharedOverlay.setAttribute('role', 'dialog');
      sharedOverlay.setAttribute('aria-modal', 'true');
      document.body.appendChild(sharedOverlay);
    }
    return sharedOverlay;
  }

  function openPickerModal(select, trigger, onSelectCallback) {
    const overlay = getSharedModal();
    const selectLabel = getSelectLabel(select);
    const options = Array.from(select.options);
    const validOptions = options.filter(opt => opt.value !== '' || !opt.disabled);
    const hasSearch = validOptions.length > 6;

    overlay.innerHTML = `
      <div class="modular-picker-dialog">
        <div class="modular-picker-header">
          <h3 class="modular-picker-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#512175" stroke-width="2.2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            <span>${escapeHtml(selectLabel)}</span>
          </h3>
          <button type="button" class="modular-picker-close" aria-label="Close dialog">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        ${hasSearch ? `
          <div class="modular-picker-search-wrap">
            <svg class="modular-picker-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input type="text" class="modular-picker-search-input" placeholder="Search options..." autocomplete="off">
          </div>
        ` : ''}
        <div class="modular-picker-body">
          ${renderOptionsHtml(options, select.value)}
        </div>
      </div>
    `;

    overlay.classList.add('open');
    trigger.classList.add('is-active');
    document.body.classList.add('modal-open');
    if (document.documentElement) document.documentElement.classList.add('modal-open');

    function closeModal() {
      overlay.classList.remove('open');
      trigger.classList.remove('is-active');
      document.body.classList.remove('modal-open');
      if (document.documentElement) document.documentElement.classList.remove('modal-open');
      document.removeEventListener('keydown', onKeyDown);
    }

    function onKeyDown(e) {
      if (e.key === 'Escape') closeModal();
    }

    document.addEventListener('keydown', onKeyDown);

    const closeBtn = overlay.querySelector('.modular-picker-close');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    overlay.onclick = (e) => {
      if (e.target === overlay) closeModal();
    };

    // Search filter
    const searchInput = overlay.querySelector('.modular-picker-search-input');
    const itemsContainer = overlay.querySelector('.modular-picker-body');
    if (searchInput && itemsContainer) {
      setTimeout(() => searchInput.focus(), 80);
      searchInput.addEventListener('input', () => {
        const query = searchInput.value.trim().toLowerCase();
        const items = itemsContainer.querySelectorAll('.modular-picker-item');
        let matchCount = 0;
        items.forEach(item => {
          const text = (item.getAttribute('data-label') || '').toLowerCase();
          const matches = text.includes(query);
          item.style.display = matches ? 'flex' : 'none';
          if (matches) matchCount++;
        });
        let emptyEl = itemsContainer.querySelector('.modular-picker-empty');
        if (matchCount === 0) {
          if (!emptyEl) {
            emptyEl = document.createElement('div');
            emptyEl.className = 'modular-picker-empty';
            emptyEl.textContent = 'No matching options found';
            itemsContainer.appendChild(emptyEl);
          }
        } else if (emptyEl) {
          emptyEl.remove();
        }
      });
    }

    // Option items click
    const optionItems = itemsContainer ? itemsContainer.querySelectorAll('.modular-picker-item:not([disabled])') : [];
    optionItems.forEach(item => {
      item.addEventListener('click', () => {
        const val = item.getAttribute('data-value');
        select.value = val;
        // Trigger both change and input events
        select.dispatchEvent(new Event('change', { bubbles: true }));
        select.dispatchEvent(new Event('input', { bubbles: true }));
        if (onSelectCallback) onSelectCallback();
        closeModal();
      });
    });
  }

  function renderOptionsHtml(options, currentValue) {
    const valid = options.filter(opt => opt.value !== '' || !opt.disabled);
    if (valid.length === 0) {
      return '<div class="modular-picker-empty">No options available</div>';
    }
    return valid.map(opt => {
      const isSelected = opt.value === currentValue;
      const disabledAttr = opt.disabled ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : '';
      return `
        <button type="button" class="modular-picker-item ${isSelected ? 'selected' : ''}" data-value="${escapeHtml(opt.value)}" data-label="${escapeHtml(opt.textContent.trim())}" ${disabledAttr}>
          <span class="modular-picker-item-label">${escapeHtml(opt.textContent.trim())}</span>
          <div class="modular-picker-radio">
            <div class="modular-picker-radio-dot"></div>
          </div>
        </button>
      `;
    }).join('');
  }

  function getSelectLabel(select) {
    if (select.id) {
      const label = document.querySelector(`label[for="${select.id}"]`);
      if (label) return label.textContent.replace('*', '').trim();
    }
    const parentField = select.closest('.form-field, .form-group');
    if (parentField) {
      const label = parentField.querySelector('label');
      if (label) return label.textContent.replace('*', '').trim();
    }
    const ariaLabel = select.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel;
    return 'Select Option';
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Auto-init on DOMContentLoaded and whenever body changes
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initModularSelects);
  } else {
    initModularSelects();
  }

  // Expose globally
  window.initModularSelects = initModularSelects;

  // MutationObserver for dynamic select additions
  if (typeof MutationObserver !== 'undefined') {
    const domObserver = new MutationObserver(() => {
      initModularSelects();
    });
    domObserver.observe(document.documentElement, { childList: true, subtree: true });
  }
})();
