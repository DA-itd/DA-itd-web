# Sistema de Inscripción a Cursos de Actualización Docente

¡Felicidades! Tienes los archivos finales para desplegar tu aplicación. Este documento te guiará paso a paso para poner tu sistema en línea.

El despliegue consta de 3 partes principales:
1.  **Configurar la Hoja de Cálculo** (Donde se guardarán los datos).
2.  **Desplegar el Backend** (El script de Google que procesa los datos).
3.  **Desplegar el Frontend** (La página web que los usuarios verán).

---

## Parte 1: Configurar la Hoja de Cálculo de Google

Esta hoja será tu base de datos donde se guardarán todas las inscripciones.

1.  **Crear la Hoja:** Ve a [sheets.google.com](https://sheets.google.com) y crea una nueva "Hoja de cálculo en blanco".
2.  **Cambiar Nombre de la Pestaña:** En la parte inferior, haz clic derecho en "Hoja 1" y selecciona "Cambiar nombre". Nómbrala exactamente `inscripciones`.
3.  **Copiar el ID:** Mira la URL en la barra de direcciones de tu navegador. Se verá algo así: `https://docs.google.com/spreadsheets/d/ID_LARGO_DE_LETRAS_Y_NUMEROS/edit`. Copia esa parte del medio (el ID). **Guárdalo, lo necesitarás en la siguiente parte.**
4.  **Añadir las Columnas:** En la primera fila de la hoja `inscripciones`, escribe los siguientes encabezados, cada uno en una columna separada (de la A a la M). **El orden es muy importante.**
    - `Timestamp`
    - `Id_Curso`
    - `NombreCompleto`
    - `Curp`
    - `Email`
    - `Genero`
    - `CursoSeleccionado`
    - `DepartamentoSeleccionado`
    - `FechaVisible`
    - `Lugar`
    - `Horario`
    - `Folio`
    - `Status`

---

## Parte 2: Desplegar el Backend (Google Apps Script)

Este script será el cerebro de tu aplicación. Recibirá los datos, los guardará en la hoja y enviará los correos.

1.  **Crear el Script:** Ve a [script.google.com](https://script.google.com) y haz clic en "**Nuevo proyecto**".
2.  **Pegar el Código:** Borra todo el código que aparece por defecto en el editor. Abre el archivo `Code.gs` que te proporcioné, copia todo su contenido y pégalo en el editor de Apps Script.
3.  **Configurar el ID de la Hoja:** Dentro del código que acabas de pegar, busca esta línea:
    ```javascript
    var SPREADSHEET_ID = 'TU_ID_DE_HOJA_DE_CALCULO_AQUI';
    ```
    Reemplaza `'TU_ID_DE_HOJA_DE_CALCULO_AQUI'` con el ID que copiaste en el paso anterior.
4.  **Guardar:** Haz clic en el ícono de guardar (disquete) en la parte superior.
5.  **Implementar la Aplicación Web:**
    -   Haz clic en el botón azul **"Implementar"** en la esquina superior derecha.
    -   Selecciona **"Nueva implementación"**.
    -   Haz clic en el ícono de engranaje (⚙️) junto a "Seleccionar tipo" y elige **"Aplicación web"**.
    -   En la configuración que aparece:
        -   **Descripción:** Pon algo como "API para Formulario de Inscripción".
        -   **Ejecutar como:** Déjalo en **"Yo (...)"**.
        -   **Quién tiene acceso:** Cámbialo a **"Cualquier persona"**. ¡Esto es muy importante para que funcione!
    -   Haz clic en el botón **"Implementar"**.
6.  **Autorizar Permisos:**
    -   Google te pedirá que revises y autorices los permisos. Haz clic en **"Autorizar el acceso"**.
    -   Elige tu cuenta de Google.
    -   Verás una pantalla de advertencia que dice "Google no ha verificado esta aplicación". No te preocupes, es normal. Haz clic en **"Configuración avanzada"** y luego en **"Ir a [Nombre de tu proyecto] (no seguro)"**.
    -   Finalmente, haz clic en **"Permitir"**.
7.  **Copiar la URL del Backend:**
    -   Después de autorizar, aparecerá una ventana con la **"URL de la aplicación web"**.
    -   **¡COPIA ESTA URL!** Es la dirección de tu backend. Guárdala para la siguiente parte.

---

## Parte 3: Desplegar el Frontend (GitHub Pages)

Ahora vamos a publicar la página web para que todo el mundo pueda verla.

1.  **Actualizar el Frontend:**
    -   Abre el archivo `index.html` en un editor de texto.
    -   Busca el bloque de **CONFIGURACIÓN OBLIGATORIA** que se ve así:
        ```html
        <script>
          window.CONFIG = {
            APPS_SCRIPT_URL: 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec'
          };
        </script>
        ```
    -   Reemplaza la URL de ejemplo (`https://.../YOUR_DEPLOYMENT_ID/exec`) con la **URL de la aplicación web** que copiaste en el último paso de la Parte 2.
    -   Guarda el archivo `index.html`.
2.  **Subir a GitHub:**
    -   Ve a [github.com](https://github.com) y crea un **"Nuevo repositorio"**.
    -   Dale un nombre (ej. `inscripcion-cursos`). Asegúrate de que sea **Público**.
    -   Una vez creado, haz clic en **"uploading an existing file"**.
    -   Arrastra tus archivos `index.html` y `Code.gs` a la página y confirma la subida.
3.  **Activar GitHub Pages:**
    -   En tu repositorio de GitHub, ve a la pestaña **"Settings"** (Configuración).
    -   En el menú de la izquierda, haz clic en **"Pages"**.
    -   Bajo "Branch", asegúrate de que esté seleccionada la rama `main` (o `master`) y la carpeta `/ (root)`.
    -   Haz clic en **"Save"**.
4.  **¡Listo!**
    -   GitHub te mostrará un enlace a tu sitio publicado (puede tardar un par de minutos en activarse). La URL será algo como `https://tu-usuario.github.io/tu-repositorio/`.
    -   ¡Visita el enlace y tu sistema de inscripción estará en línea y funcionando!

---

## Parte 4: Solución de Problemas (Troubleshooting)

### Error Común: "Error de envío: La comunicación con el servidor falló"

Este es el error más frecuente. Casi siempre significa que tu página web no puede contactar al script de Google. La causa #1 es que la URL del script en tu `index.html` es incorrecta o está desactualizada.

---

#### **Causa Principal: Acabas de modificar `Code.gs`**

**¡IMPORTANTE!** Cada vez que editas y guardas tu archivo `Code.gs`, los cambios **no se publican automáticamente**. Debes actualizar tu implementación para que los cambios estén activos en la web.

Sigue estos pasos **cada vez que modifiques el script**:

1.  En tu proyecto de Apps Script, haz clic en el botón azul **`Implementar`** (Deploy) en la esquina superior derecha.
2.  Selecciona **`Gestionar implementaciones`** (Manage deployments).
3.  En la ventana que aparece, haz clic en el **ícono de lápiz (✏️)** para editar tu implementación activa.
4.  En el menú desplegable **`Versión`** (Version), selecciona **`Nueva versión`** (New version).
5.  Haz clic en el botón **`Implementar`** (Deploy).
6.  Apps Script te mostrará la URL actualizada de la implementación. **¡COPIA ESTA URL!** Es la única URL que funcionará con tus nuevos cambios.
7.  Abre tu archivo `index.html`, busca la sección `window.CONFIG` y **pega la nueva URL**, reemplazando la antigua.
8.  Guarda `index.html` y vuelve a subirlo a tu hosting (por ejemplo, GitHub Pages).

> **Alternativa:** Si prefieres, puedes usar `Implementar` > `Nueva implementación`. Esto también funciona, pero te creará múltiples implementaciones. Gestionar una sola es más ordenado.

---

#### Checklist de Diagnóstico General

Si el error persiste después de actualizar la URL, revisa estos puntos:

**1. ¿Los permisos de acceso son correctos?**
   - **Problema:** El script no está configurado para ser accesible públicamente.
   - **Solución:** Ve a `Implementar` > `Gestionar implementaciones`, edita (✏️) tu implementación y asegúrate de que la opción **`Quién tiene acceso`** (Who has access) esté configurada como **`Cualquier persona`** (Anyone).

**2. ¿Hay errores dentro del script `Code.gs`?**
   - **Problema:** El script tiene un error de programación que le impide ejecutarse.
   - **Solución:** En el editor de Apps Script, haz clic en `Ejecuciones` (Executions) en el menú de la izquierda. Busca si hay ejecuciones con estado "Error". Haz clic en ellas para ver los detalles y los registros (`console.log`) que te ayudarán a encontrar el error.

**3. ¿Configuraste el ID de la Hoja de Cálculo?**
   - **Problema:** El script no sabe a qué hoja de cálculo conectarse.
   - **Solución:** Asegúrate de que en la línea `var SPREADSHEET_ID = '...';` dentro de `Code.gs` hayas reemplazado el texto de ejemplo con el ID real de tu hoja de Google Sheets.
