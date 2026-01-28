# Admin Konfiguration

## Aktivierte Seen verwalten

Bearbeite einfach die Datei `admin-config.json` direkt:

```json
{
  "enabledLakes": [
    "zurichsee",
    "vierwaldstaettersee",
    "thunersee"
  ]
}
```

## Verfügbare Seen

- `zurichsee` - Zürichsee
- `vierwaldstaettersee` - Vierwaldstättersee
- `thunersee` - Thunersee
- `brienzersee` - Brienzersee
- `genfersee` - Genfersee
- `aegerisee` - Aegerisee
- `bodensee` - Bodensee
- `hallwilersee` - Hallwilersee
- `lagomaggiore` - Lago Maggiore
- `luganersee` - Luganersee
- `walensee` - Walensee
- `zugersee` - Zugersee

## Workflow

1. Bearbeite `admin-config.json` lokal
2. Committe die Änderungen: `git add data/admin-config.json && git commit -m "Update enabled lakes"`
3. Pushe: `git push`
4. Vercel deployt automatisch mit den neuen Einstellungen

