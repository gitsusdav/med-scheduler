// Encode/decode prescription data into URL-safe format
// Uses short keys to keep URLs compact:
// p=patient, m=meds, n=name, d=dose, f=freq, u=duration, t=time, s=date, o=notes

function encodePrescription(patientName, medications) {
  const data = {
    p: patientName,
    m: medications.map((med) => {
      const obj = {
        n: med.name,
        d: med.dose,
        f: med.frequencyHours,
        u: med.durationDays,
        t: med.startTime,
        s: med.startDate,
      };
      if (med.notes) obj.o = med.notes;
      return obj;
    }),
  };
  const json = JSON.stringify(data);
  // btoa with Unicode support
  const encoded = btoa(unescape(encodeURIComponent(json)));
  // Make URL-safe: replace +/= with -_
  return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodePrescription(hash) {
  try {
    // Restore base64: replace -_ back to +/
    let b64 = hash.replace(/-/g, '+').replace(/_/g, '/');
    // Add padding if needed
    while (b64.length % 4) b64 += '=';
    const json = decodeURIComponent(escape(atob(b64)));
    const data = JSON.parse(json);

    return {
      patientName: data.p,
      medications: data.m.map((med) => ({
        name: med.n,
        dose: med.d,
        frequencyHours: med.f,
        durationDays: med.u,
        startTime: med.t,
        startDate: med.s,
        notes: med.o || null,
      })),
    };
  } catch (e) {
    return null;
  }
}

function buildRxURL(patientName, medications) {
  const encoded = encodePrescription(patientName, medications);
  const base = window.location.href.replace(/\/[^/]*$/, '');
  return `${base}/rx.html#${encoded}`;
}
