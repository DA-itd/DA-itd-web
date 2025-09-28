import { useState } from 'react';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useCSVData } from '@/react-app/hooks/useCSVData';
import { useGoogleSheets } from '@/react-app/hooks/useGoogleSheets';
import Header from '@/react-app/components/Header';
import Footer from '@/react-app/components/Footer';
import AutocompleteInput from '@/react-app/components/AutocompleteInput';
import CourseCard from '@/react-app/components/CourseCard';
import type { DocenteType, InscripcionType } from '@/shared/types';

export default function Home() {
  const { docentes, departamentos, cursos, loading, error } = useCSVData();
  const { submitRegistration } = useGoogleSheets();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<InscripcionType>>({
    nombre: '',
    curp: '',
    email: '',
    genero: undefined,
    departamento: '',
    cursos: [],
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const generateUniqueId = () => {
    const courseCount = formData.cursos?.length || 0;
    const consecutivo = Math.floor(Math.random() * 30) + 1;
    return `TNM-054-${courseCount.toString().padStart(2, '0')}-2026-${consecutivo.toString().padStart(2, '0')}`;
  };

  const handleDocenteSelect = (docente: DocenteType) => {
    setFormData(prev => ({
      ...prev,
      nombre: docente.NombreCompleto,
      curp: docente.Curp || prev.curp,
      email: docente.Email || prev.email,
    }));
  };

  const validateStep1 = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.nombre?.trim()) errors.nombre = 'Nombre es requerido';
    if (!formData.curp?.trim()) errors.curp = 'CURP es requerido';
    else if (formData.curp.length !== 18) errors.curp = 'CURP debe tener 18 caracteres';
    
    if (!formData.email?.trim()) errors.email = 'Email es requerido';
    else if (!formData.email.endsWith('@itdurango.edu.mx') && !formData.email.endsWith('@gmail.com')) {
      errors.email = 'Email debe ser del dominio @itdurango.edu.mx o @gmail.com';
    }
    
    if (!formData.genero) errors.genero = 'Género es requerido';
    if (!formData.departamento) errors.departamento = 'Departamento es requerido';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Check for date and time conflicts between courses
  const hasConflict = (curso1: any, curso2: any) => {
    // If different periods, no conflict
    if (curso1.Periodo !== curso2.Periodo) {
      return false;
    }
    
    // Check if dates overlap
    const dates1 = curso1.FechaVisible.toLowerCase();
    const dates2 = curso2.FechaVisible.toLowerCase();
    
    // Extract date ranges from strings like "13 al 17 de enero" or "20 al 24 de enero"
    const extractDateRange = (dateStr: string) => {
      const match = dateStr.match(/(\d+)\s*al\s*(\d+)/);
      if (match) {
        return {
          start: parseInt(match[1]),
          end: parseInt(match[2])
        };
      }
      return null;
    };
    
    const range1 = extractDateRange(dates1);
    const range2 = extractDateRange(dates2);
    
    if (range1 && range2) {
      // Check if date ranges overlap
      const datesOverlap = !(range1.end < range2.start || range2.end < range1.start);
      
      if (datesOverlap) {
        // Check if times overlap
        const time1 = curso1.Horario.toLowerCase();
        const time2 = curso2.Horario.toLowerCase();
        
        // Extract time ranges from strings like "8:00 a 12:00" or "14:00 a 18:00"
        const extractTimeRange = (timeStr: string) => {
          const match = timeStr.match(/(\d+):?(\d*)\s*a\s*(\d+):?(\d*)/);
          if (match) {
            const startHour = parseInt(match[1]);
            const startMin = parseInt(match[2] || '0');
            const endHour = parseInt(match[3]);
            const endMin = parseInt(match[4] || '0');
            
            return {
              start: startHour * 60 + startMin,
              end: endHour * 60 + endMin
            };
          }
          return null;
        };
        
        const timeRange1 = extractTimeRange(time1);
        const timeRange2 = extractTimeRange(time2);
        
        if (timeRange1 && timeRange2) {
          // Check if time ranges overlap
          return !(timeRange1.end <= timeRange2.start || timeRange2.end <= timeRange1.start);
        }
      }
    }
    
    return false;
  };

  const handleCourseToggle = (cursoId: string) => {
    const currentCursos = formData.cursos || [];
    const isSelected = currentCursos.includes(cursoId);
    
    if (isSelected) {
      setFormData(prev => ({
        ...prev,
        cursos: currentCursos.filter(id => id !== cursoId)
      }));
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.courseConflict;
        return newErrors;
      });
    } else if (currentCursos.length < 3) {
      // Check for conflicts with already selected courses
      const newCourse = cursos.find(c => c.Id_Curso === cursoId);
      const selectedCourses = currentCursos.map(id => cursos.find(c => c.Id_Curso === id)).filter(Boolean);
      
      const conflictingCourse = selectedCourses.find(selectedCourse => 
        newCourse && hasConflict(newCourse, selectedCourse)
      );
      
      if (conflictingCourse) {
        setFormErrors(prev => ({
          ...prev,
          courseConflict: `No se puede seleccionar "${newCourse?.Nombre_curso}" porque tiene conflicto de horario/fecha con "${conflictingCourse.Nombre_curso}"`
        }));
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        cursos: [...currentCursos, cursoId]
      }));
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.courseConflict;
        return newErrors;
      });
    }
  };

  const sortedCursos = [...cursos].sort((a, b) => {
    if (a.Periodo === 'PERIODO_1' && b.Periodo === 'PERIODO_2') return -1;
    if (a.Periodo === 'PERIODO_2' && b.Periodo === 'PERIODO_1') return 1;
    return a.Id_Curso.localeCompare(b.Id_Curso);
  });

  const proceedToStep2 = () => {
    if (validateStep1()) {
      setCurrentStep(2);
    }
  };

  const proceedToConfirmation = () => {
    if ((formData.cursos?.length || 0) >= 1) {
      setFormData(prev => ({ ...prev, id: generateUniqueId() }));
      setCurrentStep(3);
    }
  };

  const handleSubmit = async () => {
    if (!formData.cursos || formData.cursos.length === 0) return;
    
    try {
      // Crear el registro con todos los cursos seleccionados
      const selectedCourses = formData.cursos.map(cursoId => {
        const curso = cursos.find(c => c.Id_Curso === cursoId);
        return curso ? {
          id_curso: curso.Id_Curso,
          nombre_curso: curso.Nombre_curso,
          fecha_visible: curso.FechaVisible,
          lugar: curso.Lugar,
          horario: curso.Horario,
          periodo: curso.Periodo,
          tipo: curso.Tipo,
          horas: curso.Horas
        } : null;
      }).filter(Boolean) as any[];

      const registrationData = {
        nombre_completo: formData.nombre || '',
        curp: formData.curp || '',
        email: formData.email || '',
        genero: formData.genero || '',
        departamento_seleccionado: formData.departamento || '',
        cursos: selectedCourses
      };

      const result = await submitRegistration(registrationData);
      setFormData(prev => ({ ...prev, id: result.id }));
      setCurrentStep(4);
    } catch (error) {
      console.error('Error submitting registration:', error);
      alert('Error al enviar la inscripción. Por favor intente de nuevo.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          <p className="text-lg text-gray-600">Cargando datos del sistema...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4 text-center">
          <AlertCircle className="w-12 h-12 text-red-600" />
          <p className="text-lg text-red-600">Error al cargar los datos</p>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-bold
                  ${currentStep >= step 
                    ? 'bg-red-800 text-white' 
                    : 'bg-gray-300 text-gray-600'}
                `}>
                  {step}
                </div>
                {step < 4 && (
                  <div className={`
                    w-16 h-1 mx-2
                    ${currentStep > step ? 'bg-red-800' : 'bg-gray-300'}
                  `} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-4">
            <p className="text-sm text-gray-600">
              {currentStep === 1 && "Información Personal"}
              {currentStep === 2 && "Selección de Cursos"}
              {currentStep === 3 && "Confirmación"}
              {currentStep === 4 && "Registro Completo"}
            </p>
          </div>
        </div>

        {/* Step 1: Personal Information */}
        {currentStep === 1 && (
          <div className="bg-white rounded-lg shadow-lg p-6 lg:p-8">
            <h2 className="text-2xl font-bold text-navy-900 mb-6">Información Personal</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre Completo *
                </label>
                <AutocompleteInput
                  value={formData.nombre || ''}
                  onChange={(value) => setFormData(prev => ({ ...prev, nombre: value }))}
                  onDocenteSelect={handleDocenteSelect}
                  docentes={docentes}
                  placeholder="Escriba su nombre completo"
                  className={formErrors.nombre ? 'border-red-500' : ''}
                />
                {formErrors.nombre && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.nombre}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CURP *
                </label>
                <input
                  type="text"
                  value={formData.curp || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, curp: e.target.value.toUpperCase() }))}
                  placeholder="18 caracteres"
                  maxLength={18}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.curp ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {formErrors.curp && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.curp}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Institucional *
                </label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="nombre@itdurango.edu.mx o nombre@gmail.com"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {formErrors.email && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Género *
                </label>
                <select
                  value={formData.genero || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, genero: e.target.value as any }))}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.genero ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Seleccione una opción</option>
                  <option value="Mujer">Mujer</option>
                  <option value="Hombre">Hombre</option>
                  <option value="Otro">Otro</option>
                </select>
                {formErrors.genero && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.genero}</p>
                )}
              </div>

              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Departamento *
                </label>
                <select
                  value={formData.departamento || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, departamento: e.target.value }))}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.departamento ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Seleccione un departamento</option>
                  {departamentos.map((dept, index) => (
                    <option key={index} value={dept.NombreDepartamento}>
                      {dept.NombreDepartamento}
                    </option>
                  ))}
                </select>
                {formErrors.departamento && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.departamento}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end mt-8">
              <button
                onClick={proceedToStep2}
                className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Course Selection */}
        {currentStep === 2 && (
          <div className="bg-white rounded-lg shadow-lg p-6 lg:p-8">
            <h2 className="text-2xl font-bold text-navy-900 mb-6">Selección de Cursos</h2>
            <p className="text-gray-600 mb-6">
              Seleccione hasta 3 cursos de actualización. Los cursos están organizados por periodo.
            </p>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Cursos seleccionados: {formData.cursos?.length || 0} / 3
              </p>
              {formErrors.courseConflict && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">
                    <strong>Conflicto de horarios:</strong> {formErrors.courseConflict}
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedCursos.map((curso) => {
                const isSelected = formData.cursos?.includes(curso.Id_Curso) || false;
                const currentCursos = formData.cursos || [];
                const selectedCourses = currentCursos.map(id => cursos.find(c => c.Id_Curso === id)).filter(Boolean);
                
                // Check if this course conflicts with any selected course
                const hasConflictWithSelected = !isSelected && selectedCourses.some(selectedCourse => 
                  hasConflict(curso, selectedCourse)
                );
                
                const isDisabled = !isSelected && (
                  (formData.cursos?.length || 0) >= 3 || hasConflictWithSelected
                );
                
                return (
                  <CourseCard
                    key={curso.Id_Curso}
                    curso={curso}
                    isSelected={isSelected}
                    onToggle={handleCourseToggle}
                    disabled={isDisabled}
                    simplified={true}
                  />
                );
              })}
            </div>

            <div className="flex justify-between mt-8">
              <button
                onClick={() => setCurrentStep(1)}
                className="px-8 py-3 bg-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-400 transition-colors"
              >
                Regresar
              </button>
              <button
                onClick={proceedToConfirmation}
                disabled={(formData.cursos?.length || 0) === 0}
                className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirmar Selección
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {currentStep === 3 && (
          <div className="bg-white rounded-lg shadow-lg p-6 lg:p-8">
            <h2 className="text-2xl font-bold text-navy-900 mb-6">Confirmación de Registro</h2>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-lg text-blue-900 mb-4">Resumen de su Registro</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div><strong>ID de Registro:</strong> {formData.id}</div>
                <div><strong>Nombre:</strong> {formData.nombre}</div>
                <div><strong>CURP:</strong> {formData.curp}</div>
                <div><strong>Email:</strong> {formData.email}</div>
                <div><strong>Género:</strong> {formData.genero}</div>
                <div><strong>Departamento:</strong> {formData.departamento}</div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-lg text-gray-900 mb-4">Cursos Seleccionados</h3>
              <div className="space-y-3">
                {formData.cursos?.map(cursoId => {
                  const curso = cursos.find(c => c.Id_Curso === cursoId);
                  if (!curso) return null;
                  
                  return (
                    <div key={cursoId} className="bg-gray-50 rounded-lg p-4 relative">
                      <button
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            cursos: prev.cursos?.filter(id => id !== cursoId) || []
                          }));
                        }}
                        className="absolute top-2 right-2 text-red-600 hover:text-red-800 transition-colors"
                        title="Eliminar curso"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <h4 className="font-medium pr-8">{curso.Nombre_curso}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 text-sm text-gray-600">
                        <p><span className="font-medium">Horario:</span> {curso.Horario}</p>
                        <p><span className="font-medium">Periodo:</span> {curso.Periodo.replace('_', ' ')}</p>
                        <p><span className="font-medium">Fechas:</span> {curso.FechaVisible}</p>
                        <p><span className="font-medium">Lugar:</span> {curso.Lugar}</p>
                        <p><span className="font-medium">Tipo:</span> {curso.Tipo}</p>
                        <p><span className="font-medium">Horas:</span> {curso.Horas}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              {(formData.cursos?.length || 0) < 3 && (
                <button
                  onClick={() => setCurrentStep(2)}
                  className="mt-4 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                >
                  + Agregar más cursos
                </button>
              )}
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setCurrentStep(2)}
                className="px-8 py-3 bg-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-400 transition-colors"
              >
                Regresar
              </button>
              <button
                onClick={handleSubmit}
                className="px-8 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
              >
                Confirmar Registro
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Success */}
        {currentStep === 4 && (
          <div className="bg-white rounded-lg shadow-lg p-6 lg:p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-green-600 mb-4">¡Registro Exitoso!</h2>
            <p className="text-gray-600 mb-6">
              Su registro ha sido procesado correctamente. Recibirá un correo de confirmación 
              con los detalles de sus cursos seleccionados.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600">
                <strong>ID de Registro:</strong> {formData.id}
              </p>
            </div>
            
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
