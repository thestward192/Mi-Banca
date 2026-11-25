# Guía de Diseño — App de Control de Lotería

Complementa a `sistema-loteria.md`. Este documento define **cómo se ve y cómo se usa** la app. Si algo choca con las secciones 4 y 6 de ese archivo, **manda este documento**.

**Objetivo:** que una persona sin conocimientos técnicos pueda anotar un sorteo en menos de 15 segundos desde el teléfono, sin perderse.

---

## 1. Principios

1. **Minimalista**: en pantalla solo se ve lo que se usa todos los días. Todo lo demás va en el menú lateral.
2. **Una acción principal por pantalla**: en "Hoy", esa acción es **+ Jugada**.
3. **Todo se puede editar**: si se ve un dato, se puede tocar para cambiarlo.
4. **Nada se pierde por error**: borrar siempre ofrece **Deshacer**.
5. **Hablar como ella habla**: "Banca", "Vendido", "Premio", "Ganancia". Sin palabras técnicas.
6. **Sin emojis**: en ninguna parte de la app (menús, botones, avisos, textos). Solo íconos de línea **Lucide**, en gris o con el color de acento.
7. **Primero el teléfono**: se diseña para 360 px de ancho y desde ahí se adapta a pantallas más grandes.

---

## 2. Estilo visual

### 2.1 Colores
Fondo claro, un solo color de acento y colores con significado para el dinero.

| Uso | Color | Hex |
|---|---|---|
| Fondo | Blanco hueso | `#FAFAF9` |
| Tarjetas | Blanco | `#FFFFFF` |
| Texto principal | Casi negro | `#1C1917` |
| Texto secundario | Gris | `#78716C` |
| Bordes / divisores | Gris claro | `#E7E5E4` |
| **Acento** (botones, enlaces) | Azul | `#2563EB` |
| Ganancia / suma | Verde | `#16A34A` |
| Premio / resta | Rojo | `#DC2626` |
| Movimiento de banca | Ámbar | `#D97706` |

- **Modo oscuro** opcional, que se activa desde el menú lateral: fondo `#0C0A09`, tarjetas `#1C1917` y texto `#FAFAF9`.
- El color **nunca va solo**: siempre lo acompaña un signo (+ / −) o una etiqueta, para que se entienda aunque se vea mal la pantalla.

### 2.2 Tipografía
- Fuente: **Inter**. Alternativa sin descarga: la fuente del sistema, `system-ui`.
- Los números usan `font-variant-numeric: tabular-nums` para que queden alineados en columna.

| Elemento | Tamaño | Peso |
|---|---|---|
| Banca (encabezado) | 36 px | 700 |
| Título de pantalla | 20 px | 600 |
| Texto normal / campos | 16 px | 400 |
| Texto secundario | 14 px | 400 |
| Etiquetas pequeñas | 12 px | 500 |

Desde **Ajustes → Tamaño de letra** se puede elegir Normal, Grande o Muy grande. Todo escala con `rem`.

### 2.3 Espaciado y formas
- Escala de espacios: **4 · 8 · 12 · 16 · 24 · 32 px**.
- Margen lateral de la pantalla: **16 px**.
- Bordes redondeados: tarjetas de **12 px**, botones y campos de **10 px**.
- Sombras mínimas: solo `0 1px 2px rgba(0,0,0,.06)` en tarjetas. Sin degradados.
- Íconos de líneas simples (**Lucide**) de 20–24 px. **Nunca emojis.**

---

## 3. Estructura de la app

```
┌──────────────────────────────┐
│ [≡]  Mié 25 Nov         [cal] │  ← barra superior
├──────────────────────────────┤
│        BANCA                 │
│      ₡ 2.224                 │  ← encabezado fijo
│  Ganancia hoy  ₡10.749       │
├──────────────────────────────┤
│                              │
│   Lista de jugadas del día   │  ← se desplaza
│                              │
├──────────────────────────────┤
│  [ ⇄ Banca ]  [ + Jugada  ]  │  ← botones fijos abajo
└──────────────────────────────┘
```

- **[≡]** (ícono Lucide `Menu`) abre el **menú lateral** (sección 6).
- **[cal]** (ícono Lucide `CalendarDays`) abre el calendario para ir a otro día.
- No hay barra de navegación inferior: todo lo que no es "Hoy" vive en el menú lateral. Así la pantalla queda limpia.

---

## 4. Pantalla principal: "Hoy"

### 4.1 Encabezado de banca
- La **banca** es el número más grande de la app.
- Debajo se ven, en pequeño, la **ganancia de hoy** y la **ganancia acumulada**.
- Al tocar el encabezado se abre el **resumen del día**: banca inicial, total vendido, total ganancia, total premios, movimientos y banca final.

### 4.2 Tarjeta de jugada
Cada sorteo es una tarjeta. En el teléfono no se usa tabla, porque no cabe.

```
┌──────────────────────────────┐
│ #98  Primera          96.188 │  ← número · juego · banca después
│ Vendió 9.750   Gan. +585     │
│ Neto 9.165     Premio −13.500│
└──────────────────────────────┘
```

- La **banca resultante** va arriba a la derecha, en negrita.
- Si nadie pegó: aparece **"Sin premio"** en gris en lugar del monto.
- Si la jugada tiene nota: se muestra el ícono `StickyNote` y el texto en una línea gris.
- **Tocar la tarjeta** abre la edición de esa jugada.

### 4.3 Tarjeta de movimiento de banca
Se distingue con una barra ámbar a la izquierda:

```
┃ ⇄ Entrega a dueños     −40.000
┃   "Entregado a don X"   100.523
```

### 4.4 Apuntes del día
Al final de la lista hay una tarjeta **Apuntes** (ícono `StickyNote`). Al tocarla se escribe directamente ahí mismo y se **guarda sola** (con un texto "Guardado" discreto). No hace falta un botón.

### 4.5 Estado vacío
Si es un día nuevo y no hay nada anotado, la lista muestra:

> **Aún no hay jugadas hoy**
> Banca inicial: ₡ 2.224
> [ + Agregar primera jugada ]

---

## 5. Formularios (hojas desde abajo)

Agregar y editar se hacen en una **hoja que sube desde abajo** (bottom sheet). Es cómoda para el pulgar y no saca a la persona de la pantalla.

### 5.1 Jugada

```
┌──────────────────────────────┐
│ ───                          │
│ Nueva jugada            [x]  │
│                              │
│ Juego                        │
│ [ Tica 7pm            ▾ ]    │
│                              │
│ Número         Vendido       │
│ [ 66   ]       [ 31150    ]  │
│                              │
│ Premio              [Nadie] │
│ [ 63000        ] [000]       │
│                              │
│ ▸ Más opciones (%, nota)     │
│                              │
│ Ganancia 1.869 · Neto 29.281 │
│ Banca quedará: ₡ 43.604      │  ← vista previa en vivo
│                              │
│ [        Guardar          ]  │
└──────────────────────────────┘
```

- El **juego va primero** y recuerda el último que se usó.
- Lo que casi no se cambia (**% y nota**) queda escondido en "Más opciones", para no cargar la vista.
- Botón **[000]** junto al premio: agrega tres ceros, igual que el "27~" del cuaderno.
- Botón **[Nadie]**: pone el premio en 0.
- La **vista previa** de la banca se actualiza mientras ella escribe.
- En modo editar, el formulario tiene además un botón **Eliminar** en rojo, en texto y no como botón grande.

### 5.2 Selector de juego
- Es una lista que se puede buscar escribiendo.
- Arriba aparecen los **más usados**.
- La última opción es **"+ Crear juego nuevo"**, que pide nombre y % ahí mismo, sin salir del formulario.

### 5.3 Movimiento de banca
Dos botones grandes para elegir el tipo, luego el monto y una nota:

```
[ − Entrega a dueños ] [ + Ingreso ]
Monto  [            ]
Nota   [            ]
Banca quedará: ₡ 100.523
[ Guardar ]
```

### 5.4 Reglas de los campos
- Montos: `inputmode="numeric"`. Mientras se escribe se muestra el separador de miles.
- Altura mínima de **48 px** y letra de **16 px** (así el iPhone no hace zoom).
- Si falta algo, el error sale debajo del campo en rojo y en palabras simples: "Escribe cuánto vendió".
- Después de guardar: la hoja se cierra, la nueva tarjeta se resalta un momento y sale un aviso pequeño: "Jugada guardada".

---

## 6. Menú lateral (configuración)

Se abre con el ícono **Menu** o deslizando desde el borde izquierdo. Ocupa el **85% del ancho** en el teléfono y tiene un fondo oscuro semitransparente detrás. Se cierra tocando afuera o deslizando a la izquierda.

```
┌───────────────────────┐
│ Wendy                 │
├───────────────────────┤
│ [ ] Hoy               │
│ [ ] Historial         │
│ [ ] Resumen           │
├── DINERO ─────────────┤
│ [ ] Banca             │
│ [ ] Ganancia acumulada│
├── CONFIGURACIÓN ──────┤
│ [ ] Juegos            │
│ [ ] Ajustes generales │
│ [ ] Apariencia        │
├── CUENTA ─────────────┤
│ [ ] Cambiar contraseña│
│ [ ] Respaldo/Exportar │
│ [ ] Cerrar sesión     │
└───────────────────────┘
```

`[ ]` = ícono Lucide de línea, en gris, 20 px:

| Opción | Ícono Lucide |
|---|---|
| Hoy | `Home` |
| Historial | `CalendarDays` |
| Resumen | `BarChart3` |
| Banca | `Wallet` |
| Ganancia acumulada | `PiggyBank` |
| Juegos | `Ticket` |
| Ajustes generales | `Settings` |
| Apariencia | `Palette` |
| Cambiar contraseña | `Lock` |
| Respaldo / Exportar | `Download` |
| Cerrar sesión | `LogOut` |

### 6.1 Contenido de cada opción

| Opción | Qué se puede hacer |
|---|---|
| **Historial** | Ver la lista de días con su banca final y ganancia. Al tocar un día, se abre igual que "Hoy" y se puede editar todo. |
| **Resumen** | Ver los totales por semana o por mes: vendido, ganancia y premios. |
| **Banca** | Ver la banca actual. **Ajustar la banca** (corrección manual, que queda registrada con motivo). Ver la lista de todos los movimientos. |
| **Ganancia acumulada** | Ver el acumulado. **Registrar un cobro**. **Editar el acumulado inicial**. Ver el historial de cobros. |
| **Juegos** | Agregar, renombrar y cambiar el % de cada juego. Ordenar arrastrando. Activar o desactivar. |
| **Ajustes generales** | % de ganancia por defecto (6%). Símbolo de moneda (₡). Nombre que aparece en el menú. Pedir confirmación antes de borrar (sí/no). |
| **Apariencia** | Claro / Oscuro / Automático. Tamaño de letra: Normal / Grande / Muy grande. |
| **Respaldo / Exportar** | Descargar los datos de un rango de fechas en Excel (CSV) o PDF. |
| **Cerrar sesión** | Pide confirmación, porque después tendrá que volver a escribir usuario y contraseña. |

---

## 7. Todo es editable

| Dato | Cómo se edita |
|---|---|
| Jugada | Tocar la tarjeta → hoja de edición |
| Movimiento de banca | Tocar la tarjeta → hoja de edición |
| Apuntes del día | Se escribe directo; se guarda solo |
| Banca inicial de un día | Resumen del día → tocar "Banca inicial" |
| Banca actual | Menú → Banca → Ajustar |
| Ganancia acumulada | Menú → Ganancia acumulada → Editar |
| Juegos y sus % | Menú → Juegos |
| Días anteriores | Menú → Historial → elegir día |
| Ajustes y apariencia | Menú → Ajustes / Apariencia |

**Reglas:**
- Cada cambio que afecta la banca se recalcula solo hacia adelante, y se muestra un aviso: "Se actualizaron las bancas siguientes".
- **Borrar** deja un aviso de 5 segundos con **[Deshacer]**.
- En días anteriores aparece una franja suave arriba: "Estás editando el 24 Nov". Así nunca se confunde con hoy.

---

## 8. Responsive

| Tamaño | Ancho | Cómo se ve |
|---|---|---|
| **Teléfono** (principal) | < 640 px | Una columna, tarjetas, botones fijos abajo, menú lateral deslizable y formularios como hoja desde abajo. |
| **Tableta** | 640–1023 px | Tarjetas en 2 columnas. Los formularios se abren como ventana centrada (máx. 480 px). |
| **Computadora** | ≥ 1024 px | Menú lateral **siempre visible** a la izquierda (260 px). Las jugadas se ven en **tabla**, como el cuaderno. Contenido con máximo 960 px de ancho. |

**Detalles importantes para el teléfono:**
- Respetar las zonas seguras del iPhone (muesca y barra inferior): `padding-bottom: env(safe-area-inset-bottom)`.
- Usar `100dvh` en lugar de `100vh`, para que los botones de abajo no queden tapados por la barra del navegador.
- Cuando se abre el teclado, el botón **Guardar** tiene que seguir visible.
- Áreas táctiles de **mínimo 44×44 px** y al menos 8 px de separación entre ellas.
- Probar en pantallas pequeñas de **360 px** (Android económico) y en iPhone SE (375 px).
- Evitar que el formulario tape el teclado numérico: los campos suben solos al recibir el foco.

---

## 9. Pequeños detalles que ayudan

- **Pantalla de carga**: un esqueleto gris con la forma de las tarjetas, y no un círculo girando.
- **Sin internet**: una franja discreta que dice "Sin conexión · se guardará al volver". La app sigue funcionando porque Firestore guarda los datos en el teléfono.
- **Animaciones** de 150–200 ms, solo para abrir y cerrar hojas y el menú. Nada decorativo.
- **Formato de fecha** en español: "Mié 25 Nov".
- **Montos** siempre con `₡` y separador de miles: `₡ 96.188`.

---

## 10. Recomendaciones

1. **Usar componentes ya hechos** para no reinventar nada: **React + Tailwind CSS + shadcn/ui**. Trae listos la hoja inferior (`Drawer`), el menú lateral (`Sheet`), el selector con buscador (`Command`) y los avisos (`Sonner`). Todo es minimalista y accesible desde el inicio.
2. **Probar con ella antes de terminar**: hacer una versión con solo "Hoy" y "+ Jugada", que la use 2–3 días y ajustar según lo que diga. Lo que a nosotros nos parece claro, a ella puede no parecérselo.
3. **Empezar con los datos reales del cuaderno**: cargar el día 24 de noviembre como prueba. Si los números coinciden, ella va a confiar en la app.
4. **No pedir nada que no se necesite**: el número ganador y la nota son opcionales. Solo **juego** y **vendido** son obligatorios.
5. **Mantener el cuaderno 1–2 semanas en paralelo** hasta que ella esté segura de que la app suma bien.
6. **Exportar un respaldo cada semana** (CSV). Es solo un botón y da tranquilidad si algo pasa con la cuenta.
7. **Cambiar la contraseña inicial** desde el menú después del primer ingreso. `1234` es muy fácil de adivinar, y como la sesión queda guardada, una clave más larga casi nunca habrá que escribirla.
8. **Plan gratuito de Firebase (Spark)**: para una sola persona alcanza de sobra. No hace falta tarjeta de crédito.
9. **Ícono de la app reconocible**: un ícono simple (por ejemplo, un boleto o "₡") con el color de acento, para encontrarlo rápido en la pantalla del teléfono.
10. **Fase 2 (más adelante)**: acceso de solo lectura para los dueños, resúmenes mensuales con gráfico y un recordatorio si un día no se anotó nada.
