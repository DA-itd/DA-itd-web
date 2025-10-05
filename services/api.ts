import { Teacher, Course, Department, RegistrationData } from '../types.ts';

// --- PASO CRÍTICO DE CONFIGURACIÓN ---
//
// 1. Ve a script.google.com y crea un nuevo proyecto de Google Apps Script.
// 2. Pega el código del backend (el archivo Code.gs que te proporcioné en el chat anterior).
// 3. En ESE archivo de script, reemplaza los placeholders con los IDs que ya tienes:
//    - SPREADSHEET_ID = "1e12Sl5Hd8Ot48C914jT8-vkpXuDzPQuFnPm63kPQWVs"
//    - DRIVE_FOLDER_ID = "1nwzLS81ct3ZoimPqJsikznQxhzg3_86T"
// 4. Implementa el script como "Aplicación web" (con acceso para "Cualquier persona").
// 5. Google te dará una URL. ¡ESA URL es la que debes pegar aquí abajo!
//
const SCRIPT_URL = "PEGA_AQUÍ_LA_URL_DE_TU_APLICACIÓN_WEB_DESPLEGADA";

// Función auxiliar para convertir un archivo a formato Base64
const fileToBase64 = (file: File): Promise<any> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            // Formato esperado por el script: { name, mimeType, content }
            resolve({
                name: file.name,
                mimeType: file.type,
                content: result.split(',')[1] // Quitamos el "data:mime/type;base64,"
            });
        };
        reader.onerror = error => reject(error);
    });
};

// --- FUNCIONES DE API REALES ---

export const getTeachers = async (): Promise<Teacher[]> => {
  if (!SCRIPT_URL.startsWith('https://')) throw new Error('La URL del script no ha sido configurada. Revisa los comentarios en el archivo services/api.ts y pega la URL de tu script desplegado.');
  const response = await fetch(`${SCRIPT_URL}?action=getTeachers`);
  const result = await response.json();
  if (!result.success) throw new Error(result.message);
  return result.data;
};

export const getCourses = async (): Promise<Course[]> => {
  if (!SCRIPT_URL.startsWith('https://')) throw new Error('La URL del script no ha sido configurada. Revisa los comentarios en el archivo services/api.ts y pega la URL de tu script desplegado.');
  const response = await fetch(`${SCRIPT_URL}?action=getCourses`);
  const result = await response.json();
  if (!result.success) throw new Error(result.message);
  return result.data.map((course: any) => ({
      ...course,
      registrations: course.registrations || 0
  }));
};

export const getDepartments = async (): Promise<Department[]> => {
  if (!SCRIPT_URL.startsWith('https://')) throw new Error('La URL del script no ha sido configurada. Revisa los comentarios en el archivo services/api.ts y pega la URL de tu script desplegado.');
  const response = await fetch(`${SCRIPT_URL}?action=getDepartments`);
  const result = await response.json();
  if (!result.success) throw new Error(result.message);
  return result.data;
};

export const submitRegistration = async (data: RegistrationData): Promise<{ message: string }> => {
  if (!SCRIPT_URL.startsWith('https://')) throw new Error('La URL del script no ha sido configurada. Revisa los comentarios en el archivo services/api.ts y pega la URL de tu script desplegado.');
  let submissionData: any = { ...data };

  // Si hay archivos, los convertimos a Base64 antes de enviar
  if (data.instructorDetails) {
      const { cv, ficha } = data.instructorDetails;
      submissionData.instructorDetails.cv = cv ? await fileToBase64(cv) : null;
      submissionData.instructorDetails.ficha = ficha ? await fileToBase64(ficha) : null;
  }
  
  const response = await fetch(SCRIPT_URL, {
    method: 'POST',
    mode: 'cors', // Modo correcto para comunicación entre sitios
    body: JSON.stringify(submissionData),
    // Apps Script a veces prefiere text/plain cuando se envía JSON en el cuerpo.
    // Si da problemas, puedes cambiarlo, pero esto suele ser robusto.
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
  });
  
  // Ahora sí podemos leer la respuesta del script
  const result = await response.json();
  if (!result.success) throw new Error(result.message);

  // Usamos el mensaje del script o generamos uno por defecto
  let successMessage = result.message;
  if (!successMessage) {
      if (data.instructorDetails) {
        successMessage = '¡Registro como instructor exitoso! Sus documentos han sido enviados para revisión.';
      } else {
        successMessage = `¡Inscripción exitosa! Se ha registrado a ${data.selectedCourses.length} curso(s). Recibirá un correo de confirmación.`;
      }
  }
  return { message: successMessage };
};