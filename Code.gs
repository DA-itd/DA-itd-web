// ============================================================================
// CONFIGURACIÓN OBLIGATORIA
// ============================================================================
// Reemplaza 'TU_ID_DE_HOJA_DE_CALCULO_AQUI' con el ID real de tu Google Sheet.
var SPREADSHEET_ID = '1KLPdMw1AzDdNSqYRRUZnvkyHLQnL2TWQ0Sk0282CN-A'; 
// ============================================================================

var SHEET_NAME = 'inscripciones';

/**
 * @description Punto de entrada principal para las solicitudes GET.
 * Se utiliza para buscar registros existentes por CURP.
 * @param {object} e - El objeto del evento de la solicitud.
 * @returns {ContentService.TextOutput} - Respuesta JSON.
 */
function doGet(e) {
  try {
    var action = e.parameter.action;
    if (action === 'lookupByCurp') {
      var curp = e.parameter.curp;
      if (!curp) {
        return createJsonResponse({ status: 'error', message: 'CURP no proporcionado.' });
      }
      var registeredCourses = findActiveRegistrationsByCurp(curp);
      return createJsonResponse({ status: 'success', data: { registeredCourses: registeredCourses } });
    }
    return createJsonResponse({ status: 'error', message: 'Acción no válida.' });
  } catch (error) {
    Logger.log('Error en doGet: ' + error.toString());
    return createJsonResponse({ status: 'error', message: 'Error interno del servidor: ' + error.toString() });
  }
}

/**
 * @description Punto de entrada principal para las solicitudes POST.
 * Maneja el registro, la modificación y la cancelación de cursos.
 * @param {object} e - El objeto del evento de la solicitud.
 * @returns {ContentService.TextOutput} - Respuesta JSON.
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000); // Espera hasta 30 segundos por el bloqueo.

  try {
    var requestData = JSON.parse(e.postData.contents);
    var action = requestData.action || 'submit'; // 'submit' es la acción por defecto

    if (action === 'cancelSingle') {
        return handleSingleCancellation(requestData);
    } else { // 'submit'
        return handleRegistration(requestData);
    }

  } catch (error) {
    Logger.log('Error en doPost: ' + error.toString() + ' Stack: ' + error.stack);
    return createJsonResponse({ status: 'error', message: 'Error al procesar la solicitud: ' + error.toString() });
  } finally {
    lock.releaseLock();
  }
}

/**
 * @description Procesa las solicitudes de inscripción y modificación.
 * @param {object} data - Los datos de la solicitud.
 * @returns {ContentService.TextOutput} - Respuesta JSON.
 */
function handleRegistration(data) {
    var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    var newRegistrations = [];
    var applicantName = data.fullName;
    var applicantEmail = data.email;
    
    Logger.log("Datos de registro recibidos: " + JSON.stringify(data));


    // Si es una modificación, cancelar cursos deseleccionados
    if (data.previousRegistrationIds && data.previousRegistrationIds.length > 0) {
        var newCourseIds = data.selectedCourses.map(function(c) { return c.id; });
        var coursesToCancel = data.previousRegistrationIds.filter(function(id) {
            return newCourseIds.indexOf(id) === -1;
        });

        if (coursesToCancel.length > 0) {
            updateStatusByCourseIds(sheet, data.curp, coursesToCancel, 'CANCELADO');
        }
    }
    
    // Registrar solo los cursos nuevos
    for (var i = 0; i < data.selectedCourses.length; i++) {
        var course = data.selectedCourses[i];
        
        // Verificar si ya existe un registro ACTIVO para este curso y CURP
        if (isAlreadyRegistered(sheet, data.curp, course.id)) {
            continue; // Si ya está registrado y activo, no hacer nada.
        }

        var newFolio = generateFolio(sheet, course.id);
        var rowData = [
            new Date(),
            course.id,
            data.fullName,
            data.curp,
            data.email,
            data.gender,
            course.name,
            data.DepartamentoSeleccionado, // CORREGIDO: Usar el nombre de campo correcto
            course.dates,
            course.location,
            course.schedule,
            newFolio,
            'ACTIVO'
        ];
        sheet.appendRow(rowData);
        newRegistrations.push({ courseName: course.name, registrationId: newFolio });
    }

    if (newRegistrations.length > 0) {
        sendConfirmationEmail(applicantEmail, applicantName, newRegistrations);
    }

    return createJsonResponse({ status: 'success', data: newRegistrations });
}


/**
 * @description Procesa la cancelación de un único curso.
 * @param {object} data - Los datos de la solicitud.
 * @returns {ContentService.TextOutput} - Respuesta JSON.
 */
function handleSingleCancellation(data) {
    var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    var courseToCancel = data.courseToCancel;
    
    updateStatusByCourseIds(sheet, data.curp, [courseToCancel.id], 'CANCELADO');
    
    sendCancellationEmail(data.email, data.fullName, courseToCancel.name);
    
    return createJsonResponse({ status: 'success', message: 'Curso cancelado exitosamente.' });
}


/**
 * @description Verifica si un CURP ya tiene un registro activo para un curso.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - La hoja de cálculo.
 * @param {string} curp - El CURP a verificar.
 * @param {string} courseId - El ID del curso a verificar.
 * @returns {boolean} - True si ya existe un registro activo.
 */
function isAlreadyRegistered(sheet, curp, courseId) {
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
        // CURP en col D(3), Id_Curso en col B(1), Status en col M(12)
        if (data[i][3] === curp && data[i][1] === courseId && data[i][12] === 'ACTIVO') {
            return true;
        }
    }
    return false;
}

/**
 * @description Actualiza el estado de registros específicos.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - La hoja de cálculo.
 * @param {string} curp - El CURP del usuario.
 * @param {string[]} courseIds - Array de IDs de cursos a actualizar.
 * @param {string} newStatus - El nuevo estado ('CANCELADO').
 */
function updateStatusByCourseIds(sheet, curp, courseIds, newStatus) {
    var data = sheet.getDataRange().getValues();
    var range = sheet.getRange("M2:M" + sheet.getLastRow()); // Columna de Status
    var statuses = range.getValues();

    for (var i = 1; i < data.length; i++) { // Empezar en la fila 2 (índice 1)
        var rowCurp = data[i][3];
        var rowCourseId = data[i][1];
        if (rowCurp === curp && courseIds.indexOf(rowCourseId) !== -1) {
             statuses[i - 1][0] = newStatus; // i-1 porque el rango de status empieza en la fila 2
        }
    }
    range.setValues(statuses);
}

/**
 * @description Genera un folio único para un curso.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - La hoja de cálculo.
 * @param {string} courseId - El ID del curso.
 * @returns {string} - El folio generado.
 */
function generateFolio(sheet, courseId) {
    var data = sheet.getDataRange().getValues();
    var year = new Date().getFullYear();
    var count = 1;
    for (var i = 0; i < data.length; i++) {
        if (data[i][1] === courseId) { // Columna Id_Curso es B (índice 1)
            count++;
        }
    }
    var consecutive = ("000" + count).slice(-3); // Asegura 3 dígitos para el consecutivo
    // Formato: TNM-054-ID_CURSO-AÑO-CONSECUTIVO
    return "TNM-054-" + courseId + "-" + year + "-" + consecutive;
}


/**
 * @description Busca todos los cursos activos para un CURP.
 * @param {string} curp - El CURP a buscar.
 * @returns {string[]} - Un array de IDs de cursos activos.
 */
function findActiveRegistrationsByCurp(curp) {
    var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    var data = sheet.getDataRange().getValues();
    var registeredCourses = [];

    for (var i = 1; i < data.length; i++) {
        // CURP en col D(3), Id_Curso en col B(1), Status en col M(12)
        if (data[i][3] === curp && data[i][12] === 'ACTIVO') {
            registeredCourses.push(data[i][1]); // Añadir el ID del curso
        }
    }
    return registeredCourses;
}

/**
 * @description Crea una respuesta JSON estandarizada.
 * @param {object} obj - El objeto a convertir en JSON.
 * @returns {ContentService.TextOutput} - La respuesta en formato JSON.
 */
function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}


// --- FUNCIONES DE EMAIL ---

/**
 * @description Envía un correo de confirmación de inscripción.
 * @param {string} recipientEmail - El email del destinatario.
 * @param {string} applicantName - El nombre del solicitante.
 * @param {Array<{courseName: string, registrationId: string}>} registrations - Detalles de la inscripción.
 */
function sendConfirmationEmail(recipientEmail, applicantName, registrations) {
  var subject = "Confirmación de Inscripción a Cursos de Actualización Docente";
  var courseDetailsHtml = registrations.map(function(reg) {
    return '<li><b>Curso:</b> ' + reg.courseName + '<br>' +
           '<b>Folio de Inscripción:</b> ' + reg.registrationId + '</li>';
  }).join('');

  var body = 'Hola ' + applicantName + ',<br><br>' +
             'Tu inscripción a los siguientes cursos ha sido procesada exitosamente:<br>' +
             '<ul>' + courseDetailsHtml + '</ul>' +
             'Gracias por tu participación.<br><br>' +
             '<b>Coordinación de Actualización Docente - Desarrollo Académico</b><br>' +
             '<b>Instituto Tecnológico de Durango</b>';
             
  MailApp.sendEmail({
    to: recipientEmail,
    subject: subject,
    htmlBody: body,
    name: 'Coordinación de Actualización Docente'
  });
}

/**
 * @description Envía un correo de confirmación de cancelación.
 * @param {string} recipientEmail - El email del destinatario.
 * @param {string} applicantName - El nombre del solicitante.
 * @param {string} cancelledCourseName - El nombre del curso cancelado.
 */
function sendCancellationEmail(recipientEmail, applicantName, cancelledCourseName) {
  var subject = "Confirmación de Cancelación de Curso";
  var body = 'Hola ' + applicantName + ',<br><br>' +
             'Te confirmamos que tu inscripción al siguiente curso ha sido <b>cancelada exitosamente</b>:<br><br>' +
             '<ul><li><b>Curso:</b> ' + cancelledCourseName + '</li></ul>' +
             'Si tienes alguna duda, por favor contáctanos.<br><br>' +
             '<b>Coordinación de Actualización Docente - Desarrollo Académico</b><br>' +
             '<b>Instituto Tecnológico de Durango</b>';

  MailApp.sendEmail({
    to: recipientEmail,
    subject: subject,
    htmlBody: body,
    name: 'Coordinación de Actualización Docente'
  });
}
