# Sistema de Control de Lotería — Especificación

App web para llevar el control diario de las ventas de lotería (Tica, Nica, Primera, Salvador, etc.), las ganancias, los premios pagados y la **banca** (el dinero disponible). Se usa desde el **teléfono**, y se guarda en la pantalla principal como si fuera una app. Los datos se guardan en **Firebase**.

---

## 1. Resumen del funcionamiento

Cada día, la vendedora anota cada sorteo en una línea. En el cuaderno se ve así:

```
#98  Primera   9750   585   9165   13500   96188
 │      │        │     │      │      │       └─ Banca después de este sorteo
 │      │        │     │      │      └─ Premio pagado (x = nadie pegó)
 │      │        │     │      └─ Neto (vendido − ganancia)
 │      │        │     └─ Ganancia / comisión (6%)
 │      │        └─ Total vendido
 │      └─ Juego / sorteo
 └─ Número ganador (puede llevar una letra o nota: 26B, 29R)
```

La banca **siempre se arrastra**: la banca final de un día es la banca inicial del siguiente.

---

## 2. Fórmulas

| Campo | Fórmula | Ejemplo (#98 Primera) |
|---|---|---|
| Ganancia | `vendido × % del juego` (redondeado a colones enteros) | 9750 × 6% = **585** |
| Neto | `vendido − ganancia` | 9750 − 585 = **9165** |
| Premio | Se escribe a mano (0 si nadie pegó) | **13500** |
| Banca nueva | `banca anterior + neto − premio` | 100523 + 9165 − 13500 = **96188** |

- El **porcentaje** sale del juego (por defecto **6%**). Ella puede **cambiarlo en cada línea**. Por ejemplo, los reventados del Tica 7pm usan 10%: 1800 → 180.
- En el cuaderno, el premio se escribe abreviado: "27~" = 27.000. En la app se escribe el monto completo, pero el teclado tiene un botón **"000"** para hacerlo rápido.

### 2.1 Comprobación con el día 24 de noviembre (datos reales)

Banca inicial: **100.523**

| # | Juego | Vendido | % | Ganancia | Neto | Premio | Banca |
|---|---|---|---|---|---|---|---|
| 98 | Primera | 9.750 | 6 | 585 | 9.165 | 13.500 | 96.188 |
| 24 | Nica 11 | 14.900 | 6 | 894 | 14.006 | 27.000 | 83.194 |
| 27 | Salvador | 6.050 | 6 | 363 | 5.687 | 0 | 88.881 |
| 26B | Tica 1pm | 20.600 | 6 | 1.236 | 19.364 | 27.000 | 81.245 |
| 77 | Nica 3pm | 16.200 | 6 | 972 | 15.228 | 0 | 96.473 |
| 29R | Tica 4pm | 18.800 | 6 | 1.128 | 17.672 | 45.000 | 69.145 |
| 42 | Primera | 8.700 | 6 | 522 | 8.178 | 0 | 77.323 |
| 66 | Tica 7pm | 31.150 | 6 | 1.869 | 29.281 | 63.000 | 43.604 |
| R | Tica 7pm (reventado) | 1.800 | 10 | 180 | 1.620 | 0 | 45.224 |
| 06 | Nica 9pm | 42.700 | 6 | 2.562 | 40.138 | 36.000 | 49.362 |
| 06 | Salvador | 7.300 | 6 | 438 | 6.862 | 54.000 | **2.224** |

**Totales del día:** vendido 177.950 · ganancia **10.749** · premios 265.500 · banca final **2.224**

> Esta tabla sirve de **prueba**: al cargar estos datos, la app tiene que dar exactamente estos números.

---

## 3. Funciones

### 3.1 Inicio de sesión
- Se entra con **usuario y contraseña, sin correo**. Ella nunca ve ni escribe un correo.
  - Usuario: **Wendy** (no importan mayúsculas ni minúsculas, y se quitan los espacios).
  - Contraseña: **1234**.
- **Cómo funciona por dentro** (Firebase solo acepta correo y una contraseña de 6 caracteres o más):
  - El usuario se convierte en un correo interno que nunca se muestra: `wendy` → `wendy@mibanca.app`.
  - La contraseña se completa internamente antes de enviarla a Firebase: `1234` → `1234` + un sufijo fijo definido en la variable de entorno `VITE_PASS_SUFFIX` (por ejemplo `1234mb`).
  - La cuenta en Firebase se crea con `wendy@mibanca.app` y la contraseña ya completada.
  - "Cambiar contraseña" en el menú aplica la misma regla.
- En la pantalla de login, el campo de contraseña es numérico (`inputmode="numeric"`).
- **La sesión queda guardada** (persistencia `local`). Después del primer ingreso no vuelve a pedir datos, salvo que ella toque "Cerrar sesión".
- Por ahora hay un solo usuario. La cuenta se crea desde la consola de Firebase y no hay pantalla de registro público.

### 3.2 Día de trabajo
- Al abrir la app se busca el día de **hoy** (zona horaria `America/Costa_Rica`).
- Si el día no existe, se crea automáticamente:
  - `fecha` = hoy
  - `bancaInicial` = la banca actual (la banca final del último día)
- Arriba siempre se ve: **fecha**, **banca actual** (grande y destacada) y la **ganancia del día**.
- Se pueden **consultar días anteriores** desde un historial (calendario o lista). Esos días se pueden ver y corregir.

### 3.3 Agregar una jugada (línea)
Formulario corto, pensado para el teléfono:

1. **Número ganador**: texto libre (permite "26B", "29R", "R" o dejarlo vacío).
2. **Juego**: selector con buscador que muestra los juegos guardados.
   - Opción **"+ Nuevo juego"** dentro del mismo selector: pide nombre y % y lo guarda para la próxima vez.
3. **Vendido**: teclado numérico.
4. **% ganancia**: se llena solo con el % del juego y se puede cambiar.
5. **Premio**: teclado numérico con botón "000". Hay un interruptor **"Nadie pegó"** que lo deja en 0.
6. **Nota** (opcional): texto libre.

Mientras escribe, la app muestra en vivo la **ganancia, el neto y cómo queda la banca**. Al tocar **Guardar**, la línea aparece en la lista y la banca se actualiza.

### 3.4 Editar o borrar una jugada
- Al tocar una línea se abre para editarla. También se puede borrar, con confirmación.
- Al editar o borrar, **se recalculan las bancas de las líneas siguientes** y la banca final del día. Si el día no es el último, también se recalculan los días posteriores (ver 5.2).

### 3.5 Movimientos de banca (depósitos)
Sirven para mover dinero fuera o dentro de la banca. En el cuaderno aparece así: "dp. 40.000", donde la banca pasa de 140.523 a 100.523.

| Tipo | Efecto | Uso |
|---|---|---|
| **Entrega a dueños / depósito** | Resta de la banca | Pasar plata a los dueños |
| **Ingreso** | Suma a la banca | Si le dan plata para cubrir premios, o para corregir |

Cada movimiento guarda monto, fecha y hora, nota, banca antes y banca después. Se muestra **dentro de la lista del día**, en orden, con otro color.

### 3.6 Ganancia acumulada
- **Ganancia del día**: suma de las ganancias de las jugadas de hoy.
- **Ganancia acumulada**: lo que lleva acumulado desde la última vez que cobró su comisión. En el cuaderno equivale al "% 21.749".
- Botón **"Registrar cobro de ganancia"**: pide el monto, guarda el registro y baja el acumulado. **No toca la banca**, porque la ganancia ya está fuera de la banca.
- Al configurar la app por primera vez se puede poner un **acumulado inicial**, para empezar con el valor que ya tiene en el cuaderno.

### 3.7 Apuntes del día
- Campo de texto libre para cada día ("Chelo 23400", recordatorios, etc.).
- **No afecta ningún cálculo.** Se guarda solo.

### 3.8 Juegos (catálogo)
Pantalla sencilla para ver, agregar, editar el % y ordenar los juegos. Un juego se puede **desactivar** para que no salga en el selector sin perder su historial.

Juegos iniciales sugeridos (todos al 6%, salvo los reventados):
- Primera
- Nica 11am · Nica 3pm · Nica 9pm
- Tica 1pm · Tica 4pm · Tica 7pm
- Reventado Tica (10%)
- Salvador

---

## 4. Pantallas

> El diseño detallado (estilo, menú lateral, responsive) está en **`diseno-ui.md`**, y ese documento manda sobre esta sección y la sección 6. La navegación final usa **menú lateral** en lugar de barra inferior.

```
┌─────────────────────────┐
│ [≡]  24 Nov 2026         │
│  BANCA                  │
│  ₡ 2.224                │  ← grande, siempre visible
│  Ganancia hoy ₡10.749   │
│  Acumulada   ₡21.749    │
├─────────────────────────┤
│ #98 Primera             │
│ 9.750 · 585 · 9.165     │
│ Premio 13.500  → 96.188 │
├─────────────────────────┤
│ #24 Nica 11  ...        │
├─────────────────────────┤
│ Apuntes del día          │
└─────────────────────────┘
   [ + Jugada ] [ ⇄ Banca ]   ← botones fijos abajo
 ─────────────────────────
  Hoy | Historial | Juegos     ← barra de navegación inferior
```

1. **Login**: usuario y contraseña. Solo se ve la primera vez.
2. **Hoy** (pantalla principal): encabezado con la banca, lista de líneas en forma de tarjetas y apuntes.
3. **Agregar/editar jugada**: hoja que sube desde abajo (bottom sheet).
4. **Movimiento de banca**: hoja con tipo, monto y nota.
5. **Historial**: lista de días con fecha, ganancia, premios y banca final. Al tocar un día se abre su detalle.
6. **Juegos**: catálogo.
7. **Ajustes**: ganancia acumulada, registrar cobro, % por defecto y cerrar sesión.

En el teléfono, cada línea se muestra como **tarjeta** y no como una tabla ancha. En una tableta o computadora se puede mostrar como tabla, parecida al cuaderno.

---

## 5. Diseño técnico

### 5.1 Tecnología
- **Frontend**: React con Vite y TypeScript, Tailwind CSS. Alternativa más simple: HTML/JS sin frameworks.
- **PWA**: `manifest.json` (nombre, ícono, `display: standalone`, color de tema) y un service worker, para que salga la opción **"Agregar a pantalla principal"** y se abra a pantalla completa como una app.
- **Firebase**:
  - Authentication (proveedor Email/Password usado con usuario → correo interno, ver 3.1; persistencia `browserLocalPersistence`)
  - Cloud Firestore, con **caché offline activada** para que funcione con mala señal y sincronice después
- **Hosting: Vercel** (no Firebase Hosting)
  - Las claves de Firebase van como variables de entorno `VITE_FIREBASE_*` en Vercel.
  - `vercel.json` con rewrite de todas las rutas a `/index.html` (SPA).
  - Agregar el dominio de Vercel en Firebase → Authentication → Dominios autorizados.

### 5.2 Estructura en Firestore

```
usuarios/{uid}
  ├─ config (documento)
  │    porcentajeDefault: 6
  │    bancaActual: 2224
  │    gananciaAcumulada: 21749
  │
  ├─ juegos/{juegoId}
  │    nombre: "Tica 7pm"
  │    porcentaje: 6
  │    activo: true
  │    orden: 7
  │
  ├─ dias/{AAAA-MM-DD}
  │    fecha: "2026-11-24"
  │    bancaInicial: 100523
  │    bancaFinal: 2224
  │    totalVendido: 177950
  │    totalGanancia: 10749
  │    totalPremios: 265500
  │    apuntes: "Chelo 23400"
  │    │
  │    └─ registros/{registroId}
  │         tipo: "jugada" | "movimiento"
  │         orden: 1                   // posición en el día
  │         creadoEn: timestamp
  │         // si es jugada:
  │         numero: "98"
  │         juegoId, juegoNombre       // se copia el nombre por si el juego cambia
  │         vendido: 9750
  │         porcentaje: 6
  │         ganancia: 585
  │         neto: 9165
  │         premio: 13500
  │         nota: ""
  │         // si es movimiento:
  │         subtipo: "entrega" | "ingreso"
  │         monto: 40000
  │         nota: "Entrega a don X"
  │         // ambos:
  │         bancaResultante: 96188
  │
  └─ cobrosGanancia/{id}
       monto, fecha, nota
```

**Reglas de cálculo:**
- `bancaResultante` de cada registro = banca del registro anterior (o `bancaInicial` si es el primero) + `neto` − `premio` (si es jugada), o ± `monto` (si es movimiento).
- `bancaFinal` del día = `bancaResultante` del último registro.
- Al editar un día anterior: se recalcula ese día y se pasa la nueva `bancaFinal` como `bancaInicial` del día siguiente, en cadena hasta hoy. Al final se actualiza `config.bancaActual`.
- Las escrituras que cambian la banca se hacen dentro de una **transacción o batch** de Firestore para que los números nunca queden desfasados.
- Montos en **colones enteros** (sin decimales). La ganancia se redondea con `Math.round`.

### 5.3 Reglas de seguridad (Firestore)
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
Cada usuario solo puede ver y modificar sus propios datos.

---

## 6. Diseño responsive (prioridad: teléfono)

- **Mobile-first**: diseñado para pantallas de 360–430 px. Desde ahí se adapta a pantallas más grandes.
- Botones y campos de **mínimo 48 px de alto** para tocarlos con el dedo.
- Campos numéricos con `inputmode="numeric"` para que salga el teclado de números.
- Letra grande: la banca a 32 px o más y el texto normal a 16 px o más (así iOS no hace zoom al escribir).
- Botones principales **fijos abajo**, al alcance del pulgar.
- Números con separador de miles (`₡ 96.188`), con `Intl.NumberFormat('es-CR')`.
- Colores: premio en rojo, ganancia en verde y movimientos en azul o gris, para identificar cada cosa de un vistazo.
- Buen contraste, porque se puede usar con el sol de frente.
- Debe funcionar bien en Android (Chrome) y en iPhone (Safari).

---

## 7. Cómo instalarla en el teléfono

- **Android (Chrome):** abrir la página → menú ⋮ → **"Agregar a pantalla principal"** / **"Instalar app"**.
- **iPhone (Safari):** abrir la página → botón Compartir → **"Agregar a inicio"**.

Queda un ícono en la pantalla principal y se abre sin la barra del navegador. Ya no vuelve a pedir usuario ni contraseña.

---

## 8. Lo que queda fuera de esta versión (para después)
- Varios usuarios (por ejemplo, que los dueños vean la banca en modo solo lectura).
- Reportes semanales o mensuales y exportar a Excel o PDF.
- Respaldo automático.

---

## 9. Criterios de aceptación
1. Al ingresar los datos del 24 de noviembre (sección 2.1) con banca inicial 100.523, cada línea da la misma banca que el cuaderno y la banca final es **2.224**.
2. Un movimiento "entrega" de 40.000 con banca 140.523 deja la banca en **100.523**.
3. Al día siguiente, la banca inicial es la banca final del día anterior.
4. Editar el premio de una línea intermedia recalcula todas las bancas siguientes.
5. Después de cerrar y abrir la app, no pide usuario ni contraseña.
6. Se puede crear un juego nuevo desde el mismo formulario de la jugada.
7. Todo se usa cómodamente en un teléfono de 360 px de ancho, sin tener que moverse hacia los lados.
