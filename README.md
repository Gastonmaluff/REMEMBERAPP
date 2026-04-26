# Rememberapp

Aplicacion de recordatorios hecha con React + Vite + Firebase/Firestore y publicada en GitHub Pages.

## URLs

- App principal: `https://gastonmaluff.github.io/REMEMBERAPP/`
- Portal de Maria: `https://gastonmaluff.github.io/REMEMBERAPP/?view=maria&token=maria-gaston-2026`

## Scripts

- `npm run dev`: desarrollo local
- `npm run build`: build de produccion
- `npm run preview`: preview local del build
- `npm run lint`: revision de ESLint
- `npm run deploy`: publica el build en GitHub Pages
- `npm run functions:install`: instala dependencias de Firebase Functions
- `npm run functions:deploy`: despliega Cloud Functions
- `npm run firebase:rules`: despliega reglas de Firestore
- `npm run firebase:indexes`: despliega indices de Firestore
- `npm run firebase:deploy`: despliega reglas e indices de Firestore
- `npm run firebase:emulators`: levanta Firestore Emulator

## Firebase

Proyecto configurado:

- `rememberapp-f0a70`

Archivos versionados en el repo:

- `.firebaserc`: alias del proyecto por defecto
- `firebase.json`: configuracion de Firestore y emuladores
- `firestore.rules`: reglas de validacion para la coleccion `reminders`
- `firestore.indexes.json`: indices versionados
- `functions/`: backend seguro para integraciones server-side

### Que protegen las reglas actuales

- permiten leer recordatorios
- permiten crear recordatorios solo con el shape esperado
- permiten actualizar recordatorios solo para cambiar `completed` y `updatedAt`
- bloquean deletes desde cliente
- validan categorias, prioridades, fecha, hora, color e iconos permitidos

Importante:

- hoy no hay login real, asi que estas reglas protegen la estructura de datos pero no la identidad del usuario
- el portal de Maria sigue usando un token simple por URL como filtro basico

## Flujo esperado

### App principal

- Gaston ve todos los recordatorios
- puede marcar pendientes como cumplidos
- los recordatorios creados desde Maria se ven con badge y estilo especial

### Portal de Maria

- Maria crea recordatorios para Gaston
- se guardan con:
  - `createdBy: "maria"`
  - `assignedTo: "gaston"`
  - `source: "maria_portal"`
  - `priority: "Alta"`
- Maria ve pendientes y cumplidos de los recordatorios que ella creo

## Verificacion manual recomendada antes de entregarla

1. Abrir la app principal.
2. Abrir el portal de Maria en otro navegador o dispositivo.
3. Crear un recordatorio desde el portal.
4. Confirmar que aparece en la app principal.
5. Marcarlo como cumplido desde la app principal.
6. Confirmar que aparece como cumplido en el portal de Maria.

## Deploy

### GitHub Pages

```bash
npm run deploy
```

### Firestore

```bash
npm run firebase:deploy
```

### Telegram con Cloud Functions

La funcion `sendTelegramReminderNotification` escucha solo creaciones nuevas en:

- `reminders/{reminderId}`

Y envia Telegram:

- mensaje normal para recordatorios creados desde la app principal
- mensaje especial si `createdBy === "maria"` o `source === "maria_portal"`

Secrets requeridos:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`

Comandos:

```bash
npm run functions:install
firebase functions:secrets:set TELEGRAM_BOT_TOKEN
firebase functions:secrets:set TELEGRAM_CHAT_ID
npm run functions:deploy
```

## Siguiente mejora recomendada

Si mas adelante quieren privacidad real y no solo un link especial, el siguiente paso correcto es agregar Firebase Auth y endurecer `firestore.rules` por usuario o rol.
