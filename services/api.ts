import { Teacher, Course, Department, RegistrationData } from '../types';

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
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzYJgSKAg0uVC3Z_EQbCGNXwCnPh8x2Y195nrOshyHh0rGHgZABcBZy_2uuJAyVprte/exec";

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

// Función auxiliar para manejar las respuestas de la API de forma robusta
const handleApiResponse = async (response: Response) => {
    if (!response.ok) {
        const errorText = await response.text();
        console.error("Respuesta no exitosa del servidor:", errorText);
        // Intentamos mostrar un error más útil si es la página de error de Google
        if (errorText.includes("Google Apps Script")) {
            throw new Error(`Error en el servidor de Google Apps Script (código: ${response.status}). Revise la configuración de permisos del script y de la Hoja de Cálculo.`);
        }
        throw new Error(`Error de red o del servidor (código: ${response.status}).`);
    }

    const result = await response.json();

    if (!result.success) {
        console.error("Error reportado por la API:", result.message);
        throw new Error(result.message || 'La API reportó un error sin mensaje específico.');
    }

    return result;
}


// --- FUNCIONES DE API REALES ---

export const getTeachers = async (): Promise<Teacher[]> => {
  if (!SCRIPT_URL.startsWith('https://')) throw new Error('La URL del script no ha sido configurada. Revisa los comentarios en el archivo services/api.ts y pega la URL de tu script desplegado.');
  const response = await fetch(`${SCRIPT_URL}?action=getTeachers`);
  const result = await handleApiResponse(response);
  return result.data;
};

export const getCourses = async (): Promise<Course[]> => {
  if (!SCRIPT_URL.startsWith('https://')) throw new Error('La URL del script no ha sido configurada. Revisa los comentarios en el archivo services/api.ts y pega la URL de tu script desplegado.');
  const response = await fetch(`${SCRIPT_URL}?action=getCourses`);
  const result = await handleApiResponse(response);
  return result.data.map((course: any) => ({
      ...course,
      registrations: course.registrations || 0
  }));
};

export const getDepartments = async (): Promise<Department[]> => {
  if (!SCRIPT_URL.startsWith('https://')) throw new Error('La URL del script no ha sido configurada. Revisa los comentarios en el archivo services/api.ts y pega la URL de tu script desplegado.');
  const response = await fetch(`${SCRIPT_URL}?action=getDepartments`);
  const result = await handleApiResponse(response);
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
    mode: 'cors',
    body: JSON.stringify(submissionData),
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
  });
  
  const result = await handleApiResponse(response);
  
  return { message: result.message };
};