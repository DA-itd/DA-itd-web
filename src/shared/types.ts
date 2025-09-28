import z from "zod";

export const DocenteSchema = z.object({
  NombreCompleto: z.string(),
  Curp: z.string().optional(),
  Email: z.string().email().optional(),
});

export const DepartamentoSchema = z.object({
  NombreDepartamento: z.string(),
});

export const CursoSchema = z.object({
  Id_Curso: z.string(),
  Nombre_curso: z.string(),
  FechaVisible: z.string(),
  Periodo: z.string(),
  Horas: z.string(),
  Lugar: z.string(),
  Horario: z.string(),
  Tipo: z.string(),
});

export const InscripcionSchema = z.object({
  id: z.string(),
  nombre: z.string().min(1, "Nombre es requerido"),
  curp: z.string().length(18, "CURP debe tener 18 caracteres"),
  email: z.string().email("Email inválido").refine(
    (email) => email.endsWith("@itdurango.edu.mx") || email.endsWith("@gmail.com"),
    "Email debe ser del dominio @itdurango.edu.mx o @gmail.com"
  ),
  genero: z.enum(["Mujer", "Hombre", "Otro"]),
  departamento: z.string().min(1, "Departamento es requerido"),
  cursos: z.array(z.string()).max(3, "Máximo 3 cursos permitidos").min(1, "Debe seleccionar al menos 1 curso"),
});

export type DocenteType = z.infer<typeof DocenteSchema>;
export type DepartamentoType = z.infer<typeof DepartamentoSchema>;
export type CursoType = z.infer<typeof CursoSchema>;
export type InscripcionType = z.infer<typeof InscripcionSchema>;
