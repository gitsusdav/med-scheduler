
![License](https://img.shields.io/badge/License-MIT-green)

**Doctors create prescriptions. Patients get automatic calendar reminders. No server required.**

*Doctores crean recetas. Los pacientes reciben recordatorios automaticos en su calendario. Sin servidor.*

---

## The Problem 

When a doctor prescribes medications with complex schedules (e.g., Amoxicillin every 8 hours for 7 days + Ibuprofen every 6 hours for 5 days), the patient has to manually create every reminder. That's tedious and error-prone.


## The Solution 

1. Doctor fills the prescription form 
2. Downloads an `.ics` file with all reminders
3. Sends it to the patient via WhatsApp, email, etc. 
4. Patient opens the file and all reminders are added to their calendar 

Works on iPhone, Android, Google Calendar, Outlook, and any calendar app that supports `.ics` files.

## Features

- Dynamic prescription form with multiple medications
- Automatic schedule calculation (e.g., every 8h from 8:00 AM = 8:00 AM, 4:00 PM, 12:00 AM)
- Generates `.ics` file with individual events (compatible with iOS and Android)
- 5-minute reminders before each dose
- Bilingual: Spanish and English with one-click toggle
- Mobile-first responsive design
- 100% client-side, no server required
- No data stored anywhere, fully private

## Quick Start

Just open `frontend/index.html` in your browser. That's it.

Or serve it with any static file server:

```bash
# Python
python -m http.server 8000 -d frontend

# Node.js
npx serve frontend

# VS Code Live Server
# Right-click index.html > Open with Live Server
```

## Project Structure

```
med-scheduler/
├── frontend/
│   ├── index.html        # Main app page
│   ├── css/
│   │   └── style.css     # Styles
│   └── js/
│       ├── i18n.js       # Translation system (ES/EN)
│       ├── ics.js        # .ics file generator
│       └── app.js        # Form logic and UI
├── .gitignore
├── CONTRIBUTING.md
├── LICENSE
└── README.md
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

[MIT](LICENSE)

## Roadmap

- [ ] More languages (Portuguese, French)
- [ ] PDF prescription export
- [ ] Print-friendly view
- [ ] QR code generation for easy sharing
