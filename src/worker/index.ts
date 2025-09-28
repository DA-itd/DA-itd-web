import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import Papa from 'papaparse';

const app = new Hono<{ Bindings: Env }>();

const RegistrationSchema = z.object({
  timestamp: z.string(),
  id_curso: z.string(),
  nombre_completo: z.string(),
  curp: z.string(),
  email: z.string().email(),
  genero: z.string(),
  curso_seleccionado: z.string(),
  departamento_seleccionado: z.string(),
  fecha_visible: z.string(),
  lugar: z.string(),
});

app.post("/api/registrations", zValidator("json", RegistrationSchema), async (c) => {
  const data = c.req.valid("json");
  
  try {
    const result = await c.env.DB.prepare(`
      INSERT INTO inscripciones (
        timestamp, id_curso, nombre_completo, curp, email, genero,
        curso_seleccionado, departamento_seleccionado, fecha_visible, lugar
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.timestamp,
      data.id_curso,
      data.nombre_completo,
      data.curp,
      data.email,
      data.genero,
      data.curso_seleccionado,
      data.departamento_seleccionado,
      data.fecha_visible,
      data.lugar
    ).run();

    return c.json({ 
      success: true, 
      id: result.meta.last_row_id,
      message: "Registro guardado exitosamente" 
    });
  } catch (error) {
    console.error("Error saving registration:", error);
    return c.json({ 
      success: false, 
      error: "Error al guardar el registro" 
    }, 500);
  }
});

app.get("/api/registrations", async (c) => {
  try {
    const result = await c.env.DB.prepare(`
      SELECT * FROM inscripciones ORDER BY created_at DESC
    `).all();

    return c.json({ 
      success: true, 
      data: result.results 
    });
  } catch (error) {
    console.error("Error fetching registrations:", error);
    return c.json({ 
      success: false, 
      error: "Error al obtener los registros" 
    }, 500);
  }
});

// API endpoints for CSV data
app.get("/api/docentes", async (c) => {
  try {
    const result = await c.env.DB.prepare(`
      SELECT nombre_completo as NombreCompleto, curp as Curp, email as Email 
      FROM docentes ORDER BY nombre_completo
    `).all();

    return c.json({ 
      success: true, 
      data: result.results 
    });
  } catch (error) {
    console.error("Error fetching docentes:", error);
    return c.json({ 
      success: false, 
      error: "Error al obtener los docentes" 
    }, 500);
  }
});

app.get("/api/departamentos", async (c) => {
  try {
    const result = await c.env.DB.prepare(`
      SELECT nombre_departamento as NombreDepartamento 
      FROM departamentos ORDER BY nombre_departamento
    `).all();

    return c.json({ 
      success: true, 
      data: result.results 
    });
  } catch (error) {
    console.error("Error fetching departamentos:", error);
    return c.json({ 
      success: false, 
      error: "Error al obtener los departamentos" 
    }, 500);
  }
});

app.get("/api/cursos", async (c) => {
  try {
    const result = await c.env.DB.prepare(`
      SELECT 
        id_curso as Id_Curso,
        nombre_curso as Nombre_curso,
        fecha_visible as FechaVisible,
        periodo as Periodo,
        horas as Horas,
        lugar as Lugar,
        horario as Horario,
        tipo as Tipo
      FROM cursos ORDER BY periodo, id_curso
    `).all();

    return c.json({ 
      success: true, 
      data: result.results 
    });
  } catch (error) {
    console.error("Error fetching cursos:", error);
    return c.json({ 
      success: false, 
      error: "Error al obtener los cursos" 
    }, 500);
  }
});

// Load initial data from CSV (admin only)
app.post("/api/load-csv-data", async (c) => {
  try {
    // Load docentes
    const docentesRes = await fetch('https://raw.githubusercontent.com/DA-itd/web/main/docentes.csv');
    const docentesText = await docentesRes.text();
    const docentesParsed = Papa.parse(docentesText, {
      header: true,
      skipEmptyLines: true,
    });

    for (const docente of docentesParsed.data as any[]) {
      if (docente.NombreCompleto?.trim()) {
        await c.env.DB.prepare(`
          INSERT OR REPLACE INTO docentes (nombre_completo, curp, email)
          VALUES (?, ?, ?)
        `).bind(
          docente.NombreCompleto.trim(),
          docente.Curp?.trim() || null,
          docente.Email?.trim() || null
        ).run();
      }
    }

    // Load departamentos
    const departamentosRes = await fetch('https://raw.githubusercontent.com/DA-itd/web/main/departamentos.csv');
    const departamentosText = await departamentosRes.text();
    const departamentosParsed = Papa.parse(departamentosText, {
      header: true,
      skipEmptyLines: true,
    });

    for (const departamento of departamentosParsed.data as any[]) {
      if (departamento.NombreDepartamento?.trim()) {
        await c.env.DB.prepare(`
          INSERT OR REPLACE INTO departamentos (nombre_departamento)
          VALUES (?)
        `).bind(departamento.NombreDepartamento.trim()).run();
      }
    }

    // Load cursos
    const cursosRes = await fetch('https://raw.githubusercontent.com/DA-itd/web/main/cursos.csv');
    const cursosText = await cursosRes.text();
    const cursosParsed = Papa.parse(cursosText, {
      header: true,
      skipEmptyLines: true,
    });

    for (const curso of cursosParsed.data as any[]) {
      if (curso.Id_Curso?.trim()) {
        await c.env.DB.prepare(`
          INSERT OR REPLACE INTO cursos (
            id_curso, nombre_curso, fecha_visible, periodo, 
            horas, lugar, horario, tipo
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          curso.Id_Curso.trim(),
          curso.Nombre_curso?.trim() || '',
          curso.FechaVisible?.trim() || '',
          curso.Periodo?.trim() || '',
          curso.Horas?.trim() || '',
          curso.Lugar?.trim() || '',
          curso.Horario?.trim() || '',
          curso.Tipo?.trim() || ''
        ).run();
      }
    }

    return c.json({ 
      success: true, 
      message: 'Datos CSV cargados exitosamente' 
    });
  } catch (error) {
    console.error("Error loading CSV data:", error);
    return c.json({ 
      success: false, 
      error: "Error al cargar los datos CSV" 
    }, 500);
  }
});

export default app;
