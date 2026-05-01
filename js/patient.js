document.addEventListener('DOMContentLoaded', () => {
  const loadingEl = document.getElementById('loading');
  const contentEl = document.getElementById('content');
  const errorEl = document.getElementById('error-page');
  const langBtn = document.getElementById('lang-toggle');
  const themeBtn = document.getElementById('theme-toggle');

  // iOS detection (also catches iPads in desktop mode where UA reports as Mac).
  // Critical: on iOS Safari we must use a real anchor with data: URI and let
  // the user tap it directly. Programmatic .click() and the `download` attribute
  // both trigger "Safari cannot download this file".
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

  function updateDownloadLinks() {
    const baseName = rxData.patientName.replace(/\s+/g, '-').toLowerCase();
    const calBtn = document.getElementById('download-btn');
    const remBtn = document.getElementById('download-reminder-btn');

    const calIcs = generateICS(rxData.patientName, rxData.medications);
    const remIcs = generateICSReminders(rxData.patientName, rxData.medications);

    calBtn.href = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(calIcs);
    remBtn.href = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(remIcs);

    if (isIOS) {
      calBtn.removeAttribute('download');
      remBtn.removeAttribute('download');
    } else {
      calBtn.download = `medicamentos-${baseName}.ics`;
      remBtn.download = `recordatorios-${baseName}.ics`;
    }
  }

  function showSuccess(key) {
    const successEl = document.getElementById('rx-success');
    successEl.textContent = t(key);
    successEl.classList.add('visible');
  }

  document.getElementById('download-btn').addEventListener('click', () => {
    showSuccess(isIOS ? 'rxSuccessMsgIOS' : 'rxSuccessMsg');
  });

  document.getElementById('download-reminder-btn').addEventListener('click', () => {
    showSuccess(isIOS ? 'rxSuccessReminderMsgIOS' : 'rxSuccessReminderMsg');
  });

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
