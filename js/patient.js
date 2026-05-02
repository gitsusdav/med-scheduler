document.addEventListener('DOMContentLoaded', () => {
  const loadingEl = document.getElementById('loading');
  const contentEl = document.getElementById('content');
  const errorEl = document.getElementById('error-page');
  const langBtn = document.getElementById('lang-toggle');
  const themeBtn = document.getElementById('theme-toggle');

  // iOS detection (also catches iPads in desktop mode where UA reports as Mac).
  const isIOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);

  themeBtn.addEventListener('click', toggleTheme);

  const hash = window.location.hash.slice(1);
  const rxData = hash ? decodePrescription(hash) : null;

  langBtn.addEventListener('click', () => {
    toggleLang();
    if (rxData) {
      renderPrescription(rxData);
      updateDownloadLinks();
    }
  });

  if (!rxData) {
    loadingEl.style.display = 'none';
    errorEl.style.display = 'block';
    updateUI();
    return;
  }

  renderPrescription(rxData);
  updateDownloadLinks();
  loadingEl.style.display = 'none';
  contentEl.style.display = 'block';
  updateUI();

  function buildBaseName() {
    return rxData.patientName.replace(/\s+/g, '-').toLowerCase();
  }

  function updateDownloadLinks() {
    const calBtn = document.getElementById('download-btn');
    const remBtn = document.getElementById('download-reminder-btn');

    if (isIOS) {
      // On iOS the click handler will use Web Share API (or data: URI fallback);
      // strip download attribute so Safari doesn't try its broken download path.
      calBtn.removeAttribute('href');
      remBtn.removeAttribute('href');
      calBtn.removeAttribute('download');
      remBtn.removeAttribute('download');
      return;
    }

    const baseName = buildBaseName();
    const calIcs = generateICS(rxData.patientName, rxData.medications);
    const remIcs = generateICSReminders(rxData.patientName, rxData.medications);

    calBtn.href = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(calIcs);
    remBtn.href = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(remIcs);
    calBtn.download = `medicamentos-${baseName}.ics`;
    remBtn.download = `recordatorios-${baseName}.ics`;
  }

  function showSuccess(key) {
    const successEl = document.getElementById('rx-success');
    successEl.textContent = t(key);
    successEl.classList.add('visible');
  }

  async function shareIosIcs(content, fileName, successKey) {
    const file = new File([content], fileName, { type: 'text/calendar' });

    // Web Share API: opens native iOS share sheet. User can pick "Save to Files",
    // "Mail", or any third-party app. Saving to Files lets them tap the file
    // afterwards to import into Calendar/Reminders. This is the most reliable
    // path on current iOS Safari since data: URI navigation is restricted.
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file] });
        showSuccess(successKey);
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
        // Fall through to data URI fallback if share fails for other reasons.
      }
    }

    // Fallback for older iOS without Web Share API for files.
    window.location.href = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(content);
  }

  if (isIOS) {
    document.getElementById('download-btn').addEventListener('click', (e) => {
      e.preventDefault();
      const content = generateICS(rxData.patientName, rxData.medications);
      shareIosIcs(content, `medicamentos-${buildBaseName()}.ics`, 'rxSuccessMsgIOS');
    });

    document.getElementById('download-reminder-btn').addEventListener('click', (e) => {
      e.preventDefault();
      const content = generateICSReminders(rxData.patientName, rxData.medications);
      shareIosIcs(content, `recordatorios-${buildBaseName()}.ics`, 'rxSuccessReminderMsgIOS');
    });
  } else {
    document.getElementById('download-btn').addEventListener('click', () => {
      showSuccess('rxSuccessMsg');
    });
    document.getElementById('download-reminder-btn').addEventListener('click', () => {
      showSuccess('rxSuccessReminderMsg');
    });
  }

  function renderPrescription(rx) {
    document.getElementById('patient-name').textContent = rx.patientName;

    let totalEvents = 0;
    let totalReminders = 0;
    let maxDays = 0;

    const medsContainer = document.getElementById('medications-list');
    medsContainer.innerHTML = '';

    for (const med of rx.medications) {
      const schedules = computeSchedules(med.startTime, med.frequencyHours);
      const numEvents = schedules.length;
      totalEvents += numEvents;
      totalReminders += numEvents * med.durationDays;
      if (med.durationDays > maxDays) maxDays = med.durationDays;

      const dateLabel = formatDate(med.startDate);
      const freqLabel = currentLang === 'es'
        ? `Cada ${med.frequencyHours}h por ${med.durationDays} dias — desde ${dateLabel}`
        : `Every ${med.frequencyHours}h for ${med.durationDays} days — from ${dateLabel}`;

      const card = document.createElement('div');
      card.className = 'rx-med';
      card.innerHTML = `
        <div class="rx-med__name">${escapeHtml(med.name)}</div>
        <div class="rx-med__dose">${escapeHtml(med.dose)}</div>
        <div class="rx-med__detail">${freqLabel}</div>
        <div class="rx-med__schedule">
          ${schedules.map((s) => `<span class="rx-med__time">${formatTime12(s)}</span>`).join('')}
        </div>
        ${med.notes ? `<div class="rx-med__notes">${escapeHtml(med.notes)}</div>` : ''}
      `;
      medsContainer.appendChild(card);
    }

    document.getElementById('stat-events').textContent = totalEvents;
    document.getElementById('stat-reminders').textContent = totalReminders;
    document.getElementById('stat-days').textContent = maxDays;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
});
