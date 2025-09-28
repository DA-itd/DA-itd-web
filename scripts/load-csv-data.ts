import Papa from 'papaparse';
import fs from 'fs';

interface DocenteCSV {
  NombreCompleto: string;
  Curp?: string;
  Email?: string;
}

interface DepartamentoCSV {
  NombreDepartamento: string;
}

interface CursoCSV {
  Id_Curso: string;
  Nombre_curso: string;
  FechaVisible: string;
  Periodo: string;
  Horas: string;
  Lugar: string;
  Horario: string;
  Tipo: string;
}

export async function loadCSVData(db: any) {
  try {
    // Load docentes
    const docentesCSV = fs.readFileSync('/tmp/docentes.csv', 'utf8');
    const docentesParsed = Papa.parse<DocenteCSV>(docentesCSV, {
      header: true,
      skipEmptyLines: true,
    });

    console.log(`Loading ${docentesParsed.data.length} docentes...`);
    
    for (const docente of docentesParsed.data) {
      if (docente.NombreCompleto?.trim()) {
        await db.prepare(`
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
    const departamentosCSV = fs.readFileSync('/tmp/departamentos.csv', 'utf8');
    const departamentosParsed = Papa.parse<DepartamentoCSV>(departamentosCSV, {
      header: true,
      skipEmptyLines: true,
    });

    console.log(`Loading ${departamentosParsed.data.length} departamentos...`);
    
    for (const departamento of departamentosParsed.data) {
      if (departamento.NombreDepartamento?.trim()) {
        await db.prepare(`
          INSERT OR REPLACE INTO departamentos (nombre_departamento)
          VALUES (?)
        `).bind(departamento.NombreDepartamento.trim()).run();
      }
    }

    // Load cursos
    const cursosCSV = fs.readFileSync('/tmp/cursos.csv', 'utf8');
    const cursosParsed = Papa.parse<CursoCSV>(cursosCSV, {
      header: true,
      skipEmptyLines: true,
    });

    console.log(`Loading ${cursosParsed.data.length} cursos...`);
    
    for (const curso of cursosParsed.data) {
      if (curso.Id_Curso?.trim()) {
        await db.prepare(`
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

    console.log('CSV data loaded successfully!');
    return { success: true, message: 'Data loaded successfully' };
  } catch (error) {
    console.error('Error loading CSV data:', error);
    return { success: false, error: 'Error loading CSV data' };
  }
}
