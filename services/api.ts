import { Teacher, Course, Department, RegistrationData } from '../types.ts';

// ¡IMPORTANTE! Reemplaza esta URL con la URL que obtengas al desplegar tu Google Apps Script.
const SCRIPT_URL = "URL_DE_TU_SCRIPT_DESPLEGADO";
const USE_MOCK_DATA = !SCRIPT_URL.startsWith('https://');

// --- DATOS DE PRUEBA (MOCK DATA) ---
const mockTeachers: Teacher[] = [
  { NombreCompleto: 'MARIA GUADALUPE ESTRADA GARCIA', Curp: 'EAGM850101XXXXXX', Email: 'maria.eg@itdurango.edu.mx' },
  { NombreCompleto: 'JUAN PEREZ GONZALEZ', Curp: 'PEGJ800202XXXXXX', Email: 'juan.pg@itdurango.edu.mx' },
  { NombreCompleto: 'ANA SOFIA RAMIREZ LOPEZ', Curp: 'RALS900303XXXXXX', Email: 'ana.rl@itdurango.edu.mx' },
  { NombreCompleto: 'CARLOS ALBERTO MARTINEZ SANCHEZ', Curp: 'MASC880404XXXXXX', Email: 'carlos.ms@itdurango.edu.mx' },
];

const mockCourses: Course[] = [
  { Id_Curso: 'C001', Nombre_curso: 'INTELIGENCIA ARTIFICIAL APLICADA', FechaVisible: '01/Ago - 15/Ago', Periodo: 'PERIODO_1', Horas: 40, Lugar: 'Sala A', Horario: '09:00 a 13:00 hrs', Tipo: 'Docente', registrations: 15 },
  { Id_Curso: 'C002', Nombre_curso: 'DESARROLLO WEB MODERNO CON REACT', FechaVisible: '01/Ago - 15/Ago', Periodo: 'PERIODO_1', Horas: 40, Lugar: 'Sala B', Horario: '14:00 a 18:00 hrs', Tipo: 'Profesional', registrations: 28 },
  { Id_Curso: 'C003', Nombre_curso: 'HERRAMIENTAS DIGITALES PARA LA ENSEÑANZA', FechaVisible: '01/Ago - 15/Ago', Periodo: 'PERIODO_1', Horas: 30, Lugar: 'En línea', Horario: '10:00 a 12:00 hrs', Tipo: 'Docente', registrations: 5 },
  { Id_Curso: 'C004', Nombre_curso: 'METODOLOGÍAS ÁGILES (SCRUM)', FechaVisible: '16/Ago - 30/Ago', Periodo: 'PERIODO_2', Horas: 40, Lugar: 'Sala C', Horario: '09:00 a 13:00 hrs', Tipo: 'Profesional', registrations: 30 }, // Full course
  { Id_Curso: 'C005', Nombre_curso: 'CIBERSEGURIDAD PARA EDUCADORES', FechaVisible: '16/Ago - 30/Ago', Periodo: 'PERIODO_2', Horas: 30, Lugar: 'En línea', Horario: '15:00 a 17:00 hrs', Tipo: 'Docente', registrations: 10 },
  { Id_Curso: 'C006', Nombre_curso: 'DISEÑO DE INTERFACES DE USUARIO (UI/UX)', FechaVisible: '16/Ago - 30/Ago', Periodo: 'PERIODO_2', Horas: 40, Lugar: 'Sala A', Horario: '09:00 a 13:00 hrs', Tipo: 'Profesional', registrations: 22 },
  { Id_Curso: 'C007', Nombre_curso: 'BASE DE DATOS AVANZADAS', FechaVisible: '16/Ago - 30/Ago', Periodo: 'PERIODO_2', Horas: 40, Lugar: 'Sala B', Horario: '09:00 a 13:00 hrs', Tipo: 'Docente', registrations: 12 }, // Conflicts with C006
];

const mockDepartments: Department[] = [
    { NombreDepartamento: 'SISTEMAS Y COMPUTACION' },
    { NombreDepartamento: 'CIENCIAS BASICAS' },
    { NombreDepartamento: 'INGENIERIA INDUSTRIAL' },
    { NombreDepartamento: 'INGENIERIA QUIMICA Y BIOQUIMICA' },
    { NombreDepartamento: 'INGENIERIA ELECTRICA Y ELECTRONICA' },
    { NombreDepartamento: 'CIENCIAS ECONOMICO-ADMINISTRATIVAS' },
    { NombreDepartamento: 'METAL MECANICA' },
    { NombreDepartamento: 'POSGRADO' },
];

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));


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

// --- FUNCIONES DE API ---

export const getTeachers = async (): Promise<Teacher[]> => {
  if (USE_MOCK_DATA) {
    await delay(500);
    return mockTeachers;
  }
  const response = await fetch(`${SCRIPT_URL}?action=getTeachers`);
  const result = await response.json();
  if (!result.success) throw new Error(result.message);
  return result.data;
};

export const getCourses = async (): Promise<Course[]> => {
  if (USE_MOCK_DATA) {
    await delay(500);
    return mockCourses;
  }
  const response = await fetch(`${SCRIPT_URL}?action=getCourses`);
  const result = await response.json();
  if (!result.success) throw new Error(result.message);
  return result.data.map((course: any) => ({
      ...course,
      registrations: course.registrations || 0
  }));
};

export const getDepartments = async (): Promise<Department[]> => {
  if (USE_MOCK_DATA) {
    await delay(500);
    return mockDepartments;
  }
  const response = await fetch(`${SCRIPT_URL}?action=getDepartments`);
  const result = await response.json();
  if (!result.success) throw new Error(result.message);
  return result.data;
};

export const submitRegistration = async (data: RegistrationData): Promise<{ message: string }> => {
  if (USE_MOCK_DATA) {
    await delay(1500);
    console.log("Submitting mock data:", data);
    let successMessage;
    if (data.instructorDetails) {
        successMessage = '¡Registro como instructor exitoso! Sus documentos han sido enviados para revisión (Modo de prueba).';
    } else {
        successMessage = `¡Inscripción exitosa! Se ha registrado a ${data.selectedCourses.length} curso(s). Recibirá un correo de confirmación (Modo de prueba).`;
    }
    return { message: successMessage };
  }
  
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