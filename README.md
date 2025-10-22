# 📚 Sistema de Inscripción a Cursos - Instituto Tecnológico de Durango

Sistema web para la inscripción y gestión de cursos de actualización docente del Instituto Tecnológico de Durango.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## 🌟 Características

### Para Estudiantes/Docentes
- ✅ Inscripción a múltiples cursos (hasta 3 simultáneos)
- ✅ Validación automática de CURP
- ✅ Detección de conflictos de horarios
- ✅ Modificación de inscripciones existentes
- ✅ Cancelación individual de cursos
- ✅ Confirmación por email con folios únicos
- ✅ Autocompletado de datos de docentes registrados

### Para Instructores
- ✅ Propuesta de nuevos cursos
- ✅ Carga de documentos (CVU, Ficha Técnica)
- ✅ Envío de evidencias post-curso
- ✅ Notificaciones automáticas

### Administración
- ✅ Control de cupo (máximo 30 por curso)
- ✅ Generación automática de folios
- ✅ Registro en Google Sheets
- ✅ Almacenamiento de archivos en Google Drive

---

## 🚀 Tecnologías Utilizadas

### Frontend
- **React 18** (UMD)
- **TypeScript** (transpilado con Babel)
- **Tailwind CSS**
- HTML5

### Backend
- **Google Apps Script** (JavaScript)
- **Google Sheets** (Base de datos)
- **Google Drive** (Almacenamiento de archivos)

---

## 📋 Requisitos Previos

1. **Cuenta de Google** con acceso a:
   - Google Sheets
   - Google Drive
   - Google Apps Script

2. **Navegador web moderno**:
   - Chrome 90+
   - Firefox 88+
   - Safari 14+
   - Edge 90+

3. **Servidor web** (para desarrollo local):
   - Live Server (VS Code)
   - http-server
   - Python SimpleHTTPServer
   - O cualquier servidor HTTP local

---

## 🛠️ Instalación y Configuración

### Paso 1: Configurar Google Sheets

1. **Crear una nueva hoja de cálculo** en Google Sheets

2. **Crear las siguientes pestañas**:

#### Hoja: `Cursos`
| Id_Curso | Nombre_Curso | Fechas | Periodo | Horas | Lugar | Horario | Tipo |
|----------|--------------|--------|---------|-------|-------|---------|------|
| TNM-054-01-2026-01 | Excel Avanzado | 10-14 Feb | PERIODO_1 | 30 | Lab A | 16:00-18:00 | Presencial |

#### Hoja: `Docentes`
| Nombre_Completo | CURP | Email |
|-----------------|------|-------|
| JUAN PÉREZ LÓPEZ | PELJ850101HDFRPN01 | juan.perez@itdurango.edu.mx |

#### Hoja: `Inscripciones`
| Timestamp | Id_Curso | Nombre_Completo | CURP | Email | Genero | Nombre_Curso | Departamento | Fechas | Lugar | Horario | Folio | Status |
|-----------|----------|-----------------|------|-------|--------|--------------|--------------|--------|-------|---------|-------|--------|

#### Hoja: `Instructores`
| Timestamp | Nombre_Instructor | Curso_Propuesto | Email_Instructor | Id_Curso | URL_CVU | URL_Ficha | Estado |
|-----------|-------------------|-----------------|------------------|----------|---------|-----------|--------|

#### Hoja: `Evidencias`
| Timestamp | Nombre_Instructor | Email_Instructor | Nombre_Curso | URLs_Evidencias | Cantidad_Archivos |
|-----------|-------------------|------------------|--------------|-----------------|-------------------|

3. **Publicar las hojas `Cursos` y `Docentes` como CSV**:
   - Archivo > Compartir > Publicar en la web
   - Seleccionar la hoja específica
   - Formato: CSV
   - Copiar la URL generada

---

### Paso 2: Configurar Google Drive

1. Crear una carpeta para almacenar PDFs
2. Click derecho > Compartir > Obtener enlace
3. Copiar el ID de la carpeta (está en la URL):