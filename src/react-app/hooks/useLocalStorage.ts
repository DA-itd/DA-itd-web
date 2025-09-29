import { useState } from 'react';

// Hook para manejar localStorage de forma reactiva
export function useLocalStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const setStoredValue = (newValue: T | ((prev: T) => T)) => {
    try {
      const valueToStore = newValue instanceof Function ? newValue(value) : newValue;
      setValue(valueToStore);
      localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error saving to localStorage:`, error);
    }
  };

  return [value, setStoredValue] as const;
}

// Tipos para el almacenamiento local
export interface StoredRegistration {
  id: string;
  timestamp: string;
  nombre_completo: string;
  curp: string;
  email: string;
  genero: string;
  departamento_seleccionado: string;
  cursos: Array<{
    id_curso: string;
    nombre_curso: string;
    fecha_visible: string;
    lugar: string;
    horario: string;
    periodo: string;
    tipo: string;
    horas: string;
  }>;
  created_at: string;
}

// Hook específico para registraciones
export function useRegistrations() {
  const [registrations, setRegistrations] = useLocalStorage<StoredRegistration[]>('inscripciones', []);

  const addRegistration = (registration: Omit<StoredRegistration, 'id' | 'created_at'>) => {
    const newRegistration: StoredRegistration = {
      ...registration,
      id: Date.now().toString(),
      created_at: new Date().toISOString()
    };
    
    setRegistrations(prev => [newRegistration, ...prev]);
    return newRegistration;
  };

  const clearRegistrations = () => {
    setRegistrations([]);
  };

  return {
    registrations,
    addRegistration,
    clearRegistrations
  };
}
