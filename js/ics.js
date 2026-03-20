function generateUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  }) + '@med-scheduler';
}

function foldLine(line) {
  const encoder = new TextEncoder();
  const encoded = encoder.encode(line);
  if (encoded.length <= 75) return line;

  const parts = [];
  let offset = 0;
  let isFirst = true;

  while (offset < encoded.length) {
    const maxBytes = isFirst ? 75 : 74;
    let end = Math.min(offset + maxBytes, encoded.length);

    // Don't cut in the middle of a multi-byte UTF-8 character
    while (end < encoded.length && (encoded[end] & 0xc0) === 0x80) {
      end--;
    }

    const chunk = encoded.slice(offset, end);
    parts.push(new TextDecoder().decode(chunk));
    offset = end;
    isFirst = false;
  }

  return parts.join('\r\n ');
}

function escapeICS(text) {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

function computeSchedules(startTime, frequencyHours) {
  const [hour, minute] = startTime.split(':').map(Number);
  const schedules = [];
  const seen = new Set();
  let currentHour = hour;
  const slots = frequencyHours <= 24 ? Math.floor(24 / frequencyHours) : 1;

  for (let i = 0; i < slots; i++) {
    const h = currentHour % 24;
    const timeStr = `${String(h).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    if (seen.has(timeStr)) break;
    seen.add(timeStr);
    schedules.push(timeStr);
    currentHour += frequencyHours;
  }

  return schedules;
}

function formatTime12(time24) {
  const [h, m] = time24.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

// Format a "YYYY-MM-DD" date string according to current language
// ES: dd/mm/aa   EN: mm/dd/yyyy
function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-');
  if (currentLang === 'es') {
    return `${d}/${m}/${y.slice(2)}`;
  }
  return `${m}/${d}/${y}`;
}

function formatICSDate(date) {
  return (
    date.getFullYear().toString() +
    String(date.getMonth() + 1).padStart(2, '0') +
    String(date.getDate()).padStart(2, '0') +
    'T' +
    String(date.getHours()).padStart(2, '0') +
    String(date.getMinutes()).padStart(2, '0') +
    '00'
  );
}

function generateICS(patientName, medications) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//med-scheduler//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  const now = new Date();
  const dtstamp =
    now.getUTCFullYear().toString() +
    String(now.getUTCMonth() + 1).padStart(2, '0') +
    String(now.getUTCDate()).padStart(2, '0') +
    'T' +
    String(now.getUTCHours()).padStart(2, '0') +
    String(now.getUTCMinutes()).padStart(2, '0') +
    String(now.getUTCSeconds()).padStart(2, '0') +
    'Z';

  for (const med of medications) {
    const [startH, startM] = med.startTime.split(':').map(Number);

    // First dose: startDate at startTime
    const firstDose = new Date(med.startDate + 'T00:00:00');
    firstDose.setHours(startH, startM, 0, 0);

    // End of treatment: durationDays after the first dose
    const endOfTreatment = new Date(firstDose);
    endOfTreatment.setDate(endOfTreatment.getDate() + med.durationDays);

    const summary = `${med.name} - ${med.dose}`;
    let description = `${currentLang === 'es' ? 'Dosis' : 'Dose'}: ${med.dose}`;
    if (med.notes) {
      description += `\n${currentLang === 'es' ? 'Indicaciones' : 'Instructions'}: ${med.notes}`;
    }
    description += `\n\n${currentLang === 'es' ? 'Paciente' : 'Patient'}: ${patientName}`;
    description += '\n\nGenerado con med-scheduler';

    // Generate each dose by advancing frequencyHours from the first dose
    const current = new Date(firstDose);
    while (current < endOfTreatment) {
      const endTime = new Date(current);
      endTime.setMinutes(endTime.getMinutes() + 15);

      lines.push(
        'BEGIN:VEVENT',
        `DTSTAMP:${dtstamp}`,
        foldLine(`UID:${generateUID()}`),
        `DTSTART:${formatICSDate(current)}`,
        `DTEND:${formatICSDate(endTime)}`,
        foldLine(`SUMMARY:${escapeICS(summary)}`),
        foldLine(`DESCRIPTION:${escapeICS(description)}`),
        'BEGIN:VALARM',
        'TRIGGER:-PT5M',
        'ACTION:DISPLAY',
        foldLine(`DESCRIPTION:${escapeICS(summary)}`),
        'END:VALARM',
        'END:VEVENT'
      );

      current.setHours(current.getHours() + med.frequencyHours);
    }
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

