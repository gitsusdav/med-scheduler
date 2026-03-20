const translations = {
  es: {
    // Header
    appName: 'med',
    appNameAccent: '-scheduler',
    subtitle: 'Crea recetas digitales con recordatorios de medicamentos para tus pacientes.',
    // Form
    patientName: 'Nombre del paciente',
    patientNamePlaceholder: '',
    medSectionTitle: 'Medicamento',
    medName: 'Nombre del medicamento',
    medNamePlaceholder: '',
    dose: 'Dosis',
    dosePlaceholder: '',
    frequency: 'Frecuencia',
    freq4: 'Cada 4 horas',
    freq6: 'Cada 6 horas',
    freq8: 'Cada 8 horas',
    freq12: 'Cada 12 horas',
    freq24: 'Una vez al dia',
    duration: 'Duracion (dias)',
    startTime: 'Hora de inicio',
    startDate: 'Fecha de inicio',
    notes: 'Instrucciones especiales (opcional)',
    notesPlaceholder: '',
    addMed: '+ Agregar medicamento',
    generate: 'Generar receta',
    removeMed: 'Eliminar',

    // Schedule preview (reserved)

    // Validation
    errorPatientName: 'Ingresa el nombre del paciente',
    errorNoMeds: 'Agrega al menos un medicamento',
    errorMedFields: 'Completa nombre y dosis de todos los medicamentos',

    // Share panel (doctor)
    shareTitle: 'Compartir con el paciente',
    shareDesc: 'Envia el link o muestra el QR. El paciente abrira su receta y podra agregar los recordatorios a su calendario.',
    shareEmail: 'Correo',
    shareOther: 'Otro',
    copyLink: 'Copiar',
    emailSubject: 'Recordatorios de medicamentos',
    emailBody: 'Hola, aqui esta tu receta con recordatorios de medicamentos. Abre el siguiente link para verla y agregarlos a tu calendario:\n\n',
    emailFooter: '\n\nCada dosis tiene una alarma 5 minutos antes.\n\nGenerado con med-scheduler.',

    // Patient view
    rxTitle: 'Receta medica',
    rxFor: 'Para:',
    statEvents: 'Eventos',
    statReminders: 'Recordatorios',
    statDays: 'Dias',
    rxDownload: 'Agregar recordatorios al calendario',
    rxHint: 'Al abrir el archivo .ics, los recordatorios se agregaran a tu calendario con alarmas 5 minutos antes de cada dosis.',
    rxSuccessMsg: 'Archivo descargado. Abrelo para agregar los recordatorios a tu calendario.',
    rxError: 'No se pudo cargar la receta. El link puede estar incompleto.',

    // Footer
    footerText: 'Los recordatorios se agregan al calendario del paciente al abrir el archivo .ics',
  },

  en: {
    // Header
    appName: 'med',
    appNameAccent: '-scheduler',
    subtitle: 'Create digital prescriptions with medication reminders for your patients.',
    // Form
    patientName: 'Patient name',
    patientNamePlaceholder: '',
    medSectionTitle: 'Medication',
    medName: 'Medication name',
    medNamePlaceholder: '',
    dose: 'Dose',
    dosePlaceholder: '',
    frequency: 'Frequency',
    freq4: 'Every 4 hours',
    freq6: 'Every 6 hours',
    freq8: 'Every 8 hours',
    freq12: 'Every 12 hours',
    freq24: 'Once daily',
    duration: 'Duration (days)',
    startTime: 'Start time',
    startDate: 'Start date',
    notes: 'Special instructions (optional)',
    notesPlaceholder: '',
    addMed: '+ Add medication',
    generate: 'Generate prescription',
    removeMed: 'Remove',

    // Schedule preview (reserved)

    // Validation
    errorPatientName: 'Enter the patient name',
    errorNoMeds: 'Add at least one medication',
    errorMedFields: 'Fill in name and dose for all medications',

    // Share panel (doctor)
    shareTitle: 'Share with patient',
    shareDesc: 'Send the link or show the QR code. The patient will open their prescription and add the reminders to their calendar.',
    shareEmail: 'Email',
    shareOther: 'Other',
    copyLink: 'Copy',
    emailSubject: 'Medication reminders',
    emailBody: 'Hi, here is your prescription with medication reminders. Open the following link to view it and add them to your calendar:\n\n',
    emailFooter: '\n\nEach dose has an alarm 5 minutes before.\n\nGenerated with med-scheduler.',

    // Patient view
    rxTitle: 'Prescription',
    rxFor: 'For:',
    statEvents: 'Events',
    statReminders: 'Reminders',
    statDays: 'Days',
    rxDownload: 'Add reminders to calendar',
    rxHint: 'When you open the .ics file, reminders will be added to your calendar with alarms 5 minutes before each dose.',
    rxSuccessMsg: 'File downloaded. Open it to add the reminders to your calendar.',
    rxError: 'Could not load the prescription. The link may be incomplete.',

    // Footer
    footerText: 'Reminders are added to the patient\'s calendar when they open the .ics file',
  },
};

const FLAG_US = '<svg viewBox="0 0 640 480" class="flag-icon"><path fill="#bd3d44" d="M0 0h640v480H0"/><path stroke="#fff" stroke-width="37" d="M0 55.3h640M0 129h640M0 203h640M0 277h640M0 351h640M0 425h640"/><path fill="#192f5d" d="M0 0h364.8v258.5H0"/></svg>';
const FLAG_ES = '<svg viewBox="0 0 750 500" class="flag-icon"><rect width="750" height="500" fill="#c60b1e"/><rect y="125" width="750" height="250" fill="#ffc400"/></svg>';

let currentLang = localStorage.getItem('med-scheduler-lang') || 'es';

// --- Theme ---
(function initTheme() {
  const saved = localStorage.getItem('med-scheduler-theme');
  if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();

function toggleTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  if (isDark) {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('med-scheduler-theme', 'light');
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('med-scheduler-theme', 'dark');
  }
}

function t(key) {
  return translations[currentLang][key] || translations['es'][key] || key;
}

function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('med-scheduler-lang', lang);
  updateUI();
}

function toggleLang() {
  setLang(currentLang === 'es' ? 'en' : 'es');
}

function updateUI() {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    el.placeholder = t(key);
  });

  const langBtn = document.getElementById('lang-toggle');
  if (langBtn) langBtn.innerHTML = currentLang === 'es' ? FLAG_US : FLAG_ES;

  if (typeof renumberCards === 'function') renumberCards();
  if (typeof updateAllSchedules === 'function') updateAllSchedules();
}
