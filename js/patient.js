document.addEventListener('DOMContentLoaded', () => {
  const loadingEl = document.getElementById('loading');
  const contentEl = document.getElementById('content');
  const errorEl = document.getElementById('error-page');
  const langBtn = document.getElementById('lang-toggle');

  const themeBtn = document.getElementById('theme-toggle');

  langBtn.addEventListener('click', () => {
    toggleLang();
    // Re-render if we have data
    if (rxData) renderPrescription(rxData);
  });

  themeBtn.addEventListener('click', toggleTheme);

  // Decode prescription from URL hash
  const hash = window.location.hash.slice(1);
  const rxData = hash ? decodePrescription(hash) : null;

  if (!rxData) {
    loadingEl.style.display = 'none';
    errorEl.style.display = 'block';
    updateUI();
    return;
  }

  renderPrescription(rxData);
  loadingEl.style.display = 'none';
  contentEl.style.display = 'block';
  updateUI();

  // Download button
  document.getElementById('download-btn').addEventListener('click', () => {
    const icsContent = generateICS(rxData.patientName, rxData.medications);
    const fileName = `medicamentos-${rxData.patientName.replace(/\s+/g, '-').toLowerCase()}.ics`;
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    const successEl = document.getElementById('rx-success');
    successEl.textContent = t('rxSuccessMsg');
    successEl.classList.add('visible');
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
