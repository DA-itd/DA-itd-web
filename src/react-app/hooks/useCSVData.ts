import { useState, useEffect } from 'react';
import type { DocenteType, DepartamentoType, CursoType } from '@/shared/types';
import { docentesData, departamentosData, cursosData } from '@/react-app/data/csvData';

export function useCSVData() {
  const [docentes, setDocentes] = useState<DocenteType[]>([]);
  const [departamentos, setDepartamentos] = useState<DepartamentoType[]>([]);
  const [cursos, setCursos] = useState<CursoType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadLocalData = () => {
      try {
        setLoading(true);
        
        // Cargar datos inmediatamente
        setDocentes(docentesData);
        setDepartamentos(departamentosData);
        setCursos(cursosData);
        setLoading(false);
        
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err instanceof Error ? err.message : 'Error loading data');
        setLoading(false);
      }
    };

    loadLocalData();
  }, []);

  return { docentes, departamentos, cursos, loading, error };
}
