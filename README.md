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
| `npm test` | Corre las pruebas (cálculos con los datos del 24 de noviembre, periodos y CSV) |
| `npm run iconos` | Vuelve a generar los íconos PNG a partir de `public/icono.svg` |

### Qué hay en la app

| Pantalla (menú) | Para qué sirve |
|---|---|
| Hoy | Banca, jugadas, movimientos de banca y apuntes del día |
| Historial | Días anteriores; se abren y se corrigen igual que Hoy (recalcula hasta hoy) |
| Resumen | Totales por semana, mes o año |
| Banca | Banca actual, entrega o ingreso, ajustar al monto real con motivo |
| Ganancia acumulada | Acumulado, registrar y corregir cobros |
| Juegos | Agregar, renombrar, cambiar %, ordenar y desactivar |
| Ajustes generales | % por defecto, moneda, nombre del menú, confirmar al borrar |
| Apariencia | Claro / Oscuro / Automático y tamaño de letra (por teléfono) |
| Cambiar contraseña | Cambia la contraseña de la cuenta |
| Respaldo / Exportar | Descarga un rango de fechas en CSV para Excel |

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
2. En **Reglas**, pega el contenido de [firestore.rules](firestore.rules) y toca **Publicar**. Cada usuario solo puede ver y cambiar lo que está dentro de `usuarios/{su uid}`; todo lo demás queda cerrado.

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

Si usas la línea de comandos de Firebase, también se pueden publicar desde aquí (`firebase.json` ya apunta al archivo):

```bash
npx firebase-tools deploy --only firestore:rules --project mi-banca-d73c7
```

### 2.5 Cómo se guardan los datos

```
usuarios/{uid}/config/general          banca actual, ganancia acumulada, ajustes
usuarios/{uid}/juegos/{id}             catálogo de juegos
usuarios/{uid}/dias/{AAAA-MM-DD}       totales del día y apuntes
usuarios/{uid}/dias/{fecha}/registros  jugadas y movimientos, en orden
usuarios/{uid}/cobrosGanancia/{id}     cobros de la ganancia
```

Todo lo que cambia la banca se escribe en un solo *batch* (funciona sin señal y se sincroniza después). Al corregir un día anterior, la app recalcula en cadena los días siguientes hasta hoy.

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

Queda un ícono negro con un boleto en la pantalla principal y se abre a pantalla completa, sin la barra del navegador. Después del primer ingreso la sesión queda guardada y no vuelve a pedir usuario ni contraseña, salvo que se toque **Cerrar sesión**.

La app funciona con mala señal: lo que se anota sin conexión se guarda en el teléfono y se sube solo cuando vuelve el internet (arriba aparece "Sin conexión · se guardará al volver"). Cuando se publica una versión nueva, la app se actualiza sola la próxima vez que se abre.

### Recomendaciones para Wendy
1. **Cambiar la contraseña** desde el menú después del primer ingreso (1234 es muy fácil de adivinar).
2. **Poner la banca inicial** del primer día: tocar "Banca inicial" en Hoy.
3. **Poner el acumulado** del cuaderno: menú → Ganancia acumulada → Corregir acumulado.
4. **Llevar el cuaderno en paralelo 1–2 semanas** hasta confiar en los números.
5. **Respaldo semanal**: menú → Respaldo / Exportar → "Todas las jugadas (CSV)".
