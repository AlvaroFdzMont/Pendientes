# Pendientes

Tu libreta de cosas por hacer, en el móvil. Las apuntas **escribiendo** o **con la voz** y las vas **tachando**.
Funciona sin conexión y se instala como una app. Todo se guarda **solo en el móvil** (sin cuentas ni servidores).

## Cómo se usa

- **Apuntar**: escribe y pulsa la flecha, o toca el micrófono y dilo. Si escribes varias líneas, cada línea es una tarea;
  al dictar, di **«nueva tarea»** para separarlas. Se apuntan como en una libreta: la nueva, al final.
- **Tachar**: toca el círculo o desliza la tarea **a la derecha**. Lo tachado hoy se queda abajo, con la raya,
  hasta mañana (como en el papel). El anillo de arriba cuenta cuántas llevas tachadas de las del día.
- **Deslizar a la izquierda**: aparecen **Mañana** (la pasa al día siguiente) y **Borrar**. Si deslizas hasta el final,
  se borra.
- **Mover**: mantén pulsada una tarea y arrástrala para ordenarlas a tu gusto.
- **Editar**: toca el texto. Puedes cambiarlo, añadir **notas**, elegir **para cuándo** (hoy, mañana u otro día),
  **repetir** (cada día, entre semana, cada semana, cada mes) y marcarla como **importante**.
- **Buscar**: la lupa de arriba busca en todo, también en lo ya tachado.
- Todo tiene **Deshacer** durante unos segundos.

### Atajos al escribir o dictar

| Dices o escribes | Qué hace |
|---|---|
| «Comprar pan **mañana**», «**el viernes** pasar la ITV» | La apunta para ese día (sale en «Próximos días» y aparece sola ese día). |
| «Llamar al banco **importante**» | Sale arriba, en Importantes. |
| «Tomar la vitamina **todos los días**» (o **entre semana**, **cada semana**, **cada mes**) | Al tacharla, vuelve a aparecer el próximo día que toque. |
| «Enviar factura **#trabajo**» | Etiqueta en color; arriba puedes filtrar por etiqueta. |
| Un teléfono o un enlace en el texto o en las notas | Botón para llamar (y WhatsApp en la ficha) o para abrir el enlace. |

Encima de la barra de escribir se ve lo que ha entendido antes de apuntarlo. «Por la mañana» o «del viernes» no se
toman como fechas.

### Lo que se queda sin hacer

Lo que no taches un día sigue en la lista al día siguiente, marcado en naranja («De ayer», «Desde el lunes»…), para que
no se te olvide. En **Hechas** está todo lo tachado por días y un resumen de los últimos 7 días.

## Publicarla en GitHub Pages (desde la web, sin instalar nada)

1. En github.com: **New repository** → nombre, por ejemplo `pendientes` → **Public** → *Create repository*.
2. En el repositorio vacío: **uploading an existing file** → arrastra **el contenido** de esta carpeta
   (`index.html`, `app.js`, `styles.css`, `sw.js`, `manifest.webmanifest`, `README.md` y la carpeta `icons`) → *Commit changes*.
3. **Settings → Pages** → *Source*: **Deploy from a branch** → Branch **main** y carpeta **/ (root)** → *Save*.
4. En uno o dos minutos estará en `https://TU-USUARIO.github.io/pendientes/`.

> El micrófono solo funciona con **https**, y GitHub Pages ya lo da.

## Instalarla en el móvil (y quitar la barra del navegador)

Ninguna web puede esconder la barra de direcciones de Chrome o Safari mientras se abre como página normal. La forma de
quitarla es **instalarla**: así se abre a pantalla completa, como una app. La propia app lo propone con un aviso arriba
(«Úsala a pantalla completa») y desde Ajustes → «Instalar en el móvil», con los pasos de tu móvil.

- **Android (Chrome)**: menú ⋮ → **Instalar aplicación** / *Añadir a pantalla de inicio*.
- **iPhone (Safari)**: botón **Compartir** → **Añadir a pantalla de inicio**.

La primera vez que uses el micrófono el móvil pedirá permiso: acéptalo.

## Bueno saber

- El **dictado** usa el reconocimiento de voz del navegador: en Android (Chrome) necesita internet. En iPhone funciona
  en Safari; si instalada como app no te deja dictar, la app pasa sola a **grabar audio**.
- Los datos viven en el navegador de ese móvil. Si borras los datos de Chrome/Safari o cambias de móvil se pierden:
  usa **Ajustes → Guardar copia de seguridad** de vez en cuando.
- No avisa con notificaciones a una hora: una web sin servidor no puede hacerlo de forma fiable con el móvil bloqueado.
- Cuando cambies algún archivo y lo subas, la app se actualiza sola la siguiente vez que la abras (a veces hace falta
  abrirla dos veces). Si no, sube el número de `CACHE` en `sw.js` (`pendientes-v3` → `pendientes-v4`).
