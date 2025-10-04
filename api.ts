import { Teacher, Course, Department, RegistrationData } from '../types';

// ¡IMPORTANTE! Reemplaza esta URL con la URL que obtengas al desplegar tu Google Apps Script.
const SCRIPT_URL = "URL_DE_TU_SCRIPT_DESPLEGADO";

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
  if (!SCRIPT_URL.startsWith('https://')) throw new Error('La URL del script no ha sido configurada. Revisa el archivo services/api.ts');
  const response = await fetch(`${SCRIPT_URL}?action=getTeachers`);
  const result = await response.json();
  if (!result.success) throw new Error(result.message);
  return result.data;
};

export const getCourses = async (): Promise<Course[]> => {
  if (!SCRIPT_URL.startsWith('https://')) throw new Error('La URL del script no ha sido configurada.');
  const response = await fetch(`${SCRIPT_URL}?action=getCourses`);
  const result = await response.json();
  if (!result.success) throw new Error(result.message);
  return result.data.map((course: any) => ({
      ...course,
      registrations: course.registrations || 0
  }));
};

export const getDepartments = async (): Promise<Department[]> => {
  if (!SCRIPT_URL.startsWith('https://')) throw new Error('La URL del script no ha sido configurada.');
  const response = await fetch(`${SCRIPT_URL}?action=getDepartments`);
  const result = await response.json();
  if (!result.success) throw new Error(result.message);
  return result.data;
};

export const submitRegistration = async (data: RegistrationData): Promise<{ message: string }> => {
  if (!SCRIPT_URL.startsWith('https://')) throw new Error('La URL del script no ha sido configurada.');
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