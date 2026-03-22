document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('prescription-form');
  const medsContainer = document.getElementById('medications-container');
  const addMedBtn = document.getElementById('add-medication');
  const submitBtn = document.getElementById('submit-btn');
  const sharePanel = document.getElementById('share-panel');
  const rxLinkInput = document.getElementById('rx-link');
  const copyBtn = document.getElementById('copy-link');
  const langBtn = document.getElementById('lang-toggle');
  const themeBtn = document.getElementById('theme-toggle');
  const globalStartDate = document.getElementById('global-start-date');
  let medCount = 0;
  let rxURL = '';

  function getTodayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  // --- Medication cards ---

  function addMedication() {
    medCount++;
    const card = document.createElement('div');
    card.className = 'med-card';
    card.dataset.index = medCount;
    card.innerHTML = `
      <div class="med-card__header">
        <span class="med-card__number" data-med-index="${medCount}"></span>
        ${medCount > 1 ? `<button type="button" class="med-card__remove" title="${t('removeMed')}">&times;</button>` : ''}
      </div>
      <div class="form-row form-row--2">
        <div class="form-group">
          <label class="form-label" data-i18n="medName">${t('medName')}</label>
          <input type="text" class="form-input med-name" required>
        </div>
        <div class="form-group">
          <label class="form-label" data-i18n="dose">${t('dose')}</label>
          <input type="text" class="form-input med-dose" required>
        </div>
      </div>
      <div class="form-row form-row--3">
        <div class="form-group">
          <label class="form-label" data-i18n="frequency">${t('frequency')}</label>
          <select class="form-select med-frequency" required>
            <option value="4" data-i18n="freq4">${t('freq4')}</option>
            <option value="6" data-i18n="freq6">${t('freq6')}</option>
            <option value="8" selected data-i18n="freq8">${t('freq8')}</option>
            <option value="12" data-i18n="freq12">${t('freq12')}</option>
            <option value="24" data-i18n="freq24">${t('freq24')}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" data-i18n="duration">${t('duration')}</label>
          <input type="number" class="form-input med-duration" min="1" max="365" value="7" required>
        </div>
        <div class="form-group">
          <label class="form-label" data-i18n="startTime">${t('startTime')}</label>
          <input type="time" class="form-input med-start-time" value="08:00" required>
        </div>
      </div>
      <div class="form-row form-row--1">
        <div class="form-group">
          <label class="form-label" data-i18n="startDate">${t('startDate')}</label>
          <input type="date" class="form-input med-start-date" value="${globalStartDate.value || getTodayStr()}" required>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label" data-i18n="notes">${t('notes')}</label>
        <input type="text" class="form-input med-notes">
      </div>
      <div class="med-card__schedule"></div>
    `;

    medsContainer.appendChild(card);

    // Sync start date from global field after DOM insertion
    if (globalStartDate.value) {
      card.querySelector('.med-start-date').value = globalStartDate.value;
    }

    const removeBtn = card.querySelector('.med-card__remove');
    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        card.remove();
        renumberCards();
      });
    }

    card.querySelector('.med-frequency').addEventListener('change', () => updateSchedulePreview(card));
    card.querySelector('.med-start-time').addEventListener('change', () => updateSchedulePreview(card));
    card.querySelector('.med-duration').addEventListener('change', () => updateSchedulePreview(card));
    card.querySelector('.med-start-date').addEventListener('change', () => updateSchedulePreview(card));

    updateSchedulePreview(card);
    renumberCards();
  }

  window.renumberCards = function () {
    const cards = medsContainer.querySelectorAll('.med-card');
    cards.forEach((card, i) => {
      card.querySelector('.med-card__number').textContent = `${t('medSectionTitle')} #${i + 1}`;
    });
  };

  window.updateAllSchedules = function () {
    medsContainer.querySelectorAll('.med-card').forEach((card) => {
      updateSchedulePreview(card);
    });
  };

  function updateSchedulePreview(card) {
    const freq = parseInt(card.querySelector('.med-frequency').value);
    const startTime = card.querySelector('.med-start-time').value;
    const duration = parseInt(card.querySelector('.med-duration').value) || 0;
    const startDateVal = card.querySelector('.med-start-date').value;
    const scheduleEl = card.querySelector('.med-card__schedule');

    if (!startTime || !freq || !duration) {
      scheduleEl.innerHTML = '';
      return;
    }

    const schedules = computeSchedules(startTime, freq);
    const timesFormatted = schedules.map((s) => formatTime12(s)).join(' &middot; ');

    let dateRange = '';
    if (startDateVal && duration) {
      const endDate = new Date(startDateVal + 'T00:00:00');
      endDate.setDate(endDate.getDate() + duration - 1);
      const endDateStr = endDate.getFullYear() + '-' + String(endDate.getMonth() + 1).padStart(2, '0') + '-' + String(endDate.getDate()).padStart(2, '0');
      dateRange = `${formatDate(startDateVal)} &ndash; ${formatDate(endDateStr)}`;
    }

    scheduleEl.innerHTML = `<strong>${timesFormatted}</strong>${dateRange ? ` &middot; ${dateRange}` : ''}`;
  }

  function collectMedications() {
    const cards = medsContainer.querySelectorAll('.med-card');
    const medications = [];

    for (const card of cards) {
      const name = card.querySelector('.med-name').value.trim();
      const dose = card.querySelector('.med-dose').value.trim();
      const frequencyHours = parseInt(card.querySelector('.med-frequency').value);
      const durationDays = parseInt(card.querySelector('.med-duration').value);
      const startTime = card.querySelector('.med-start-time').value;
      const startDate = card.querySelector('.med-start-date').value;
      const notes = card.querySelector('.med-notes').value.trim();

      if (!name || !dose) return null;

      medications.push({
        name,
        dose,
        frequencyHours,
        durationDays,
        startTime,
        startDate,
        notes: notes || null,
      });
    }

    return medications.length > 0 ? medications : null;
  }

  function generateQR(url) {
    const container = document.getElementById('qr-container');
    container.innerHTML = '';

    if (typeof qrcode === 'undefined') return;

    // Auto-detect best version for the URL length
    const qr = qrcode(0, 'M');
    qr.addData(url);
    qr.make();

    container.innerHTML = qr.createSvgTag({ scalable: true });
  }

  // --- Global start date ---
  globalStartDate.value = getTodayStr();
  globalStartDate.addEventListener('change', () => {
    const val = globalStartDate.value;
    if (!val) return;
    medsContainer.querySelectorAll('.med-start-date').forEach((input) => {
      input.value = val;
    });
    updateAllSchedules();
  });

  // --- Init ---
  addMedication();
  addMedBtn.addEventListener('click', addMedication);
  langBtn.addEventListener('click', toggleLang);
  themeBtn.addEventListener('click', toggleTheme);

  // --- Form submit: generate link + show share panel ---
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const patientName = document.getElementById('patient-name').value.trim();
    if (!patientName) {
      alert(t('errorPatientName'));
      return;
    }

    const medications = collectMedications();
    if (!medications) {
      alert(t('errorMedFields'));
      return;
    }

    rxURL = buildRxURL(patientName, medications);
    rxLinkInput.value = rxURL;
    generateQR(rxURL);

    sharePanel.classList.add('visible');
    sharePanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  // --- Copy link ---
  copyBtn.addEventListener('click', () => {
    rxLinkInput.select();
    navigator.clipboard.writeText(rxURL).then(() => {
      const original = copyBtn.textContent;
      copyBtn.textContent = currentLang === 'es' ? 'Copiado!' : 'Copied!';
      setTimeout(() => (copyBtn.textContent = original), 2000);
    });
  });

  // --- Share: WhatsApp ---
  document.getElementById('share-whatsapp').addEventListener('click', () => {
    if (!rxURL) return;
    const msg = currentLang === 'es'
      ? `Hola, aqui estan tus recordatorios de medicamentos:\n${rxURL}`
      : `Hi, here are your medication reminders:\n${rxURL}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  });

  // --- Share: Email ---
  document.getElementById('share-email').addEventListener('click', () => {
    if (!rxURL) return;
    const subject = encodeURIComponent(t('emailSubject'));
    const body = encodeURIComponent(t('emailBody') + '\n' + rxURL + t('emailFooter'));
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  });

  // --- Share: Telegram ---
  document.getElementById('share-telegram').addEventListener('click', () => {
    if (!rxURL) return;
    const msg = currentLang === 'es'
      ? `Aqui estan tus recordatorios de medicamentos:\n${rxURL}`
      : `Here are your medication reminders:\n${rxURL}`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(rxURL)}&text=${encodeURIComponent(msg)}`, '_blank');
  });

  // --- Share: Native ---
  document.getElementById('share-native').addEventListener('click', async () => {
    if (!rxURL) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: t('emailSubject'),
          text: currentLang === 'es'
            ? 'Aqui estan tus recordatorios de medicamentos'
            : 'Here are your medication reminders',
          url: rxURL,
        });
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }

    // Fallback: copy to clipboard
    navigator.clipboard.writeText(rxURL);
    const btn = document.getElementById('share-native');
    const original = btn.querySelector('span').textContent;
    btn.querySelector('span').textContent = currentLang === 'es' ? 'Copiado!' : 'Copied!';
    setTimeout(() => (btn.querySelector('span').textContent = original), 2000);
  });

  // Initial i18n render
  updateUI();
});
