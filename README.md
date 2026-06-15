# Wedding Template

Aplicacion React + Vite para gestionar la parte publica y el panel de administracion de una boda.

## Configuracion

Copia `.env.example` a `.env` y ajusta los valores del despliegue:

```env
VITE_ADMIN_PASSWORD=change-me
VITE_RSVP_API_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
VITE_APP_STORAGE_PREFIX=wedding-template
VITE_ENABLE_MENU_MODULE=false
```

- `VITE_ADMIN_PASSWORD`: clave de acceso al panel de administracion.
- `VITE_RSVP_API_URL`: URL publicada de Google Apps Script.
- `VITE_APP_STORAGE_PREFIX`: prefijo para claves locales de navegador.
- `VITE_ENABLE_MENU_MODULE`: activa o desactiva el modulo de menu.

En desarrollo, la app avisa por consola si falta configuracion critica. Las operaciones contra Apps Script fallan con un error explicito si la URL no esta configurada.

## Comandos

```bash
npm run dev
npm run lint
npm run build
npm run preview
```
