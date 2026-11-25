# Mi Banca

App web (PWA) para llevar el control diario de las ventas de lotería, las ganancias, los premios y la banca desde el teléfono.

- Especificación: [sistema-loteria.md](sistema-loteria.md)
- Diseño: [diseno-ui.md](diseno-ui.md) (manda sobre lo visual)

Stack: Vite + React + TypeScript, Tailwind CSS + shadcn/ui, Firebase Auth + Firestore (con caché offline), vite-plugin-pwa y Vercel.

---

## 1. Correr en la computadora

Necesitas Node 20 o más reciente.

```bash
npm install
cp .env.example .env   # y completa los valores (ver paso 2)
npm run dev
```

Otros comandos:

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo en http://localhost:5173 |
| `npm run build` | Revisa los tipos y genera la versión final en `dist/` |
| `npm run preview` | Sirve la versión de `dist/` para probarla |

---

## 2. Configurar Firebase

### 2.1 Crear el proyecto
1. Entra a https://console.firebase.google.com y toca **Agregar proyecto**. El plan gratuito (Spark) alcanza; no hace falta tarjeta.
2. En **Configuración del proyecto → General → Tus apps**, agrega una **App web** (ícono `</>`). No hace falta activar Firebase Hosting (usamos Vercel).
3. Copia los valores de `firebaseConfig` a tu `.env`:

| Variable | Valor en `firebaseConfig` |
|---|---|
| `VITE_FIREBASE_API_KEY` | `apiKey` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `VITE_FIREBASE_PROJECT_ID` | `projectId` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `storageBucket` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
| `VITE_FIREBASE_APP_ID` | `appId` |

4. Elige un sufijo para las contraseñas y ponlo en `VITE_PASS_SUFFIX` (por ejemplo `mb`). Ver 2.3.

### 2.2 Activar el inicio de sesión
1. **Authentication → Comenzar → Método de acceso**.
2. Activa **Correo electrónico/contraseña** (solo la primera opción; no actives "Vínculo de correo electrónico").

### 2.3 Crear el usuario de Wendy
Wendy entra con usuario **Wendy** y contraseña **1234**, sin correo. Por dentro, la app convierte esos datos así:

| Lo que ella escribe | Lo que se envía a Firebase |
|---|---|
| Usuario `Wendy` | Correo `wendy@mibanca.app` (sin mayúsculas ni espacios) |
| Contraseña `1234` | `1234` + `VITE_PASS_SUFFIX` |

Entonces, en **Authentication → Usuarios → Agregar usuario**:

- **Correo:** `wendy@mibanca.app`
- **Contraseña:** `1234` seguido de tu sufijo. Con el sufijo `mb`, sería `1234mb`.

> Si después cambias `VITE_PASS_SUFFIX`, la contraseña guardada en Firebase deja de coincidir. En ese caso, cambia también la contraseña del usuario en la consola.

No hay pantalla de registro: las cuentas solo se crean desde la consola.

### 2.4 Crear la base de datos
1. **Firestore Database → Crear base de datos**, en modo **producción** y en una ubicación cercana (por ejemplo `us-central1` o `us-east1`).
2. En **Reglas**, pega estas reglas y toca **Publicar** (cada usuario solo ve sus propios datos):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    match /usuarios/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

---

## 3. Publicar en Vercel

1. Sube el proyecto a un repositorio de GitHub (el archivo `.env` **no** se sube; ya está en `.gitignore`).
2. En https://vercel.com → **Add New → Project**, importa el repositorio. Vercel detecta Vite solo:
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. En **Settings → Environment Variables**, agrega las mismas 7 variables de tu `.env` (`VITE_FIREBASE_*` y `VITE_PASS_SUFFIX`) para Production, Preview y Development.
4. Toca **Deploy**. Si cambias una variable después, hay que volver a desplegar (Deployments → Redeploy), porque Vite las mete en el código al compilar.
5. En Firebase → **Authentication → Configuración → Dominios autorizados**, agrega el dominio de Vercel (por ejemplo `mi-banca.vercel.app`) y cualquier dominio propio.

`vercel.json` ya redirige todas las rutas a `/index.html`, para que al recargar en `/historial` o `/juegos` no salga un error 404.

---

## 4. Instalar en el teléfono

- **Android (Chrome):** abrir la página → menú ⋮ → **Instalar app** / **Agregar a pantalla principal**.
- **iPhone (Safari):** abrir la página → botón Compartir → **Agregar a inicio**.

Después del primer ingreso la sesión queda guardada y no vuelve a pedir usuario ni contraseña, salvo que se toque **Cerrar sesión**.
