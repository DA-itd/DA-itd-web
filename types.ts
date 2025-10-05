export interface User {
  name: string;
  email: string;
  picture?: string;
}

export interface Teacher {
  NombreCompleto: string;
  Curp: string;
  Email: string;
}

export interface Course {
  Id_Curso: string;
  Nombre_curso: string;
  FechaVisible: string;
  Periodo: string;
  Horas: number;
  Lugar: string;
  Horario: string;
  Tipo: 'Docente' | 'Profesional';
  registrations?: number;
}

export interface Department {
  NombreDepartamento: string;
}

export interface RegistrationData {
  user: User;
  teacherInfo: {
    NombreCompleto: string;
    Curp: string;
    Email: string;
    Genero: string;
    Departamento: string;
  };
  selectedCourses: Course[];
  instructorDetails?: {
    teachingCourseId: string;
    cv: File | null;
    ficha: File | null;
  };
}