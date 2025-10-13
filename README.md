# Sistema de Inscripción a Cursos de Actualización Docente

¡Felicidades! Tienes los archivos finales para desplegar tu aplicación. Este documento te guiará paso a paso para poner tu sistema en línea.

El despliegue consta de 3 partes principales:
1.  **Configurar las Hojas de Cálculo** (Donde se guardarán los datos).
2.  **Desplegar el Backend** (El script de Google que procesa los datos).
3.  **Desplegar el Frontend** (La página web que los usuarios verán).

---

## Parte 1: Configurar las Hojas de Cálculo de Google

Estas hojas serán tu base de datos. Necesitarás una para las inscripciones de los participantes y otra para las propuestas de los instructores.

1.  **Crear la Hoja de Cálculo Principal:** Ve a [sheets.google.com](https://sheets.google.com) y crea una nueva "Hoja de cálculo en blanco".
2.  **Copiar el ID de la Hoja de Cálculo:** Mira la URL en la barra de direcciones. Se verá algo así: `https://docs.google.com/spreadsheets/d/ID_LARGO_DE_LETRAS_Y_NUMEROS/edit`. Copia esa parte del medio (el ID). **Guárdalo, lo necesitarás en la siguiente parte.**
3.  **Crear Pestaña "inscripciones":**
    *   En la parte inferior, haz clic derecho en "Hoja 1" y selecciona "Cambiar nombre". Nómbrala exactamente `inscripciones`.
    *   En la primera fila, escribe los siguientes encabezados, cada uno en una columna separada (de la A a la M): `Timestamp`, `Id_Curso`, `NombreCompleto`, `Curp`, `Email`, `Genero`, `CursoSeleccionado`, `DepartamentoSeleccionado`, `FechaVisible`, `Lugar`, `Horario`, `Folio`, `Status`.
4.  **Crear Pestaña "Instructores":**
    *   Haz clic en el signo `+` en la parte inferior izquierda para añadir una nueva hoja.
    *   Haz clic derecho en la nueva hoja y renómbrala a `Instructores`.
    *   En la primera fila de esta nueva hoja, escribe los siguientes encabezados (de la A a la F): `ID_curso`, `NombreInstructor`, `NombreCurso`, `Fechacurso`, `Cvu`, `FichaTecnica`.

---

## Parte 2: Desplegar el Backend (Google Apps Script)

Este script será el cerebro de tu aplicación. Recibirá los datos, los guardará en las hojas y subirá los archivos.

1.  **Crear el Script:** Ve a [script.google.com](https://script.google.com) y haz clic en "**Nuevo proyecto**".
2.  **Pegar el Código:** Borra todo el código que aparece por defecto. Abre el archivo `Code.gs` que te proporcioné, copia todo su contenido y pégalo en el editor de Apps Script.
3.  **Configurar el ID de la Hoja:** Dentro del código que acabas de pegar, busca esta línea y reemplaza el ID de ejemplo con el que copiaste en el paso 1.2:
    ```javascript
    var SPREADSHEET_ID = 'TU_ID_DE_HOJA_DE_CALCULO_AQUI';
    ```
4.  **Configurar el ID de la Carpeta de Drive:**
    *   Ve a la carpeta de Google Drive donde quieres que se guarden los archivos de los instructores. La URL es: `https://drive.google.com/drive/folders/1nwzLS81ct3ZoimPqJsikznQxhzg3_86T`
    *   El ID es la última parte de la URL. En este caso: `1nwzLS81ct3ZoimPqJsikznQxhzg3_86T`.
    *   En el código de Apps Script, busca esta línea y asegúrate de que el ID sea el correcto:
    ```javascript
    var INSTRUCTOR_DRIVE_FOLDER_ID = '1nwzLS81ct3ZoimPqJsikznQxhzg3_86T';
    ```
5.  **Guardar:** Haz clic en el ícono de guardar (disquete) en la parte superior.
6.  **Implementar la Aplicación Web:**
    *   Haz clic en el botón azul **"Implementar"** en la esquina superior derecha.
    *   Selecciona **"Nueva implementación"**.
    *   Haz clic en el ícono de engranaje (⚙️) junto a "Seleccionar tipo" y elige **"Aplicación web"**.
    *   En la configuración que aparece:
        -   **Descripción:** Pon algo como "API para Formulario de Inscripción V2".
        -   **Ejecutar como:** Déjalo en **"Yo (...)"**.
        -   **Quién tiene acceso:** Cámbialo a **"Cualquier persona"**. ¡Esto es muy importante!
    *   Haz clic en el botón **"Implementar"**.
7.  **Autorizar Permisos:**
    *   Google te pedirá que autorices los permisos (ahora incluirá permisos para Google Drive). Haz clic en **"Autorizar el acceso"**.
    *   Elige tu cuenta, luego haz clic en **"Configuración avanzada"** -> **"Ir a [Nombre de tu proyecto] (no seguro)"** -> **"Permitir"**.
8.  **Copiar la URL del Backend:**
    *   Después de autorizar, aparecerá una ventana con la **"URL de la aplicación web"**.
    *   **¡COPIA ESTA URL!** Es la dirección de tu backend. Guárdala para la siguiente parte.

---

## Parte 3: Desplegar el Frontend (GitHub Pages)

Ahora vamos a publicar la página web.

1.  **Actualizar el Frontend:**
    *   Abre el archivo `index.html` en un editor de texto.
    *   Busca el bloque de **CONFIGURACIÓN OBLIGATORIA** y reemplaza la URL de ejemplo con la **URL de la aplicación web** que copiaste en el último paso.
    *   Guarda el archivo `index.html`.
2.  **Subir a GitHub y Activar Pages:** Sigue los pasos estándar para subir tus archivos a un repositorio público y activar GitHub Pages en la pestaña "Settings" -> "Pages".

---

## Parte 4: Solución de Problemas (Guía Definitiva)

### Problema: El folio sigue saliendo mal o los cambios en el backend no se aplican.

Este es el problema más común. Su causa es siempre la misma: **tu página web está hablando con una versión antigua de tu `Code.gs` que Google ha guardado en caché.**

Sigue estos pasos **EXACTAMENTE** cada vez que modifiques tu `Code.gs`.

1.  **Ve al Editor de Apps Script**.
2.  En la esquina superior derecha, haz clic en **`Implementar`** -> **`Gestionar implementaciones`**.
3.  Verás tu implementación activa. A la derecha, haz clic en el **ícono del lápiz (✏️)** para editar.
4.  **ESTE ES EL PASO MÁS IMPORTANTE.** En la ventana que aparece, busca el menú desplegable **`Versión`** y selecciona **`Nueva versión`**.
5.  Haz clic en el botón azul **`Implementar`**.

¡Listo! La URL no cambia, pero el código que se ejecuta detrás de ella ahora será el más reciente. Vuelve a tu página de inscripción y haz una **recarga forzada** (`Ctrl + Shift + R` o `Cmd + Shift + R`) para limpiar la caché de tu navegador.