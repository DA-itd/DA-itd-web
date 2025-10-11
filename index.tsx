// FIX: Import React and ReactDOM to resolve UMD global errors for React.StrictMode and ReactDOM.createRoot.
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';

// =============================================================================
// == TYPES (from types.ts)
// =============================================================================
interface Teacher {
  nombreCompleto: string;
  curp: string;
  email: string;
}

interface Course {
  id: string;
  name: string;
  dates: string;
  period: string;
  // FIX: Made 'hours' property required to match implementation in getCourses and fix type predicate error.
  hours: number;
  location: string;
  schedule: string;
  type: string;
}

interface FormData {
  fullName: string;
  curp: string;
  email: string;
  gender: string;
  department: string;
  selectedCourses: string[];
}

interface RegistrationResult {
  courseName: string;
  registrationId: string;
}

// FIX: Remapped 'department' to 'DepartamentoSeleccionado' to match the backend sheet column.
interface SubmissionData extends Omit<FormData, 'selectedCourses' | 'department'> {
  DepartamentoSeleccionado: string;
  timestamp: string;
  selectedCourses: {
    id: string;
    name: string;
    dates: string;
    location: string;
    schedule: string;
  }[];
  previousRegistrationIds?: string[];
}

// =============================================================================
// == API SERVICE (from services/api.ts)
// =============================================================================

// URLs for fetching data from Google Sheets
const COURSES_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSAe4dmVN4CArjEy_lvI5qrXf16naxZLO1lAxGm2Pj4TrdnoebBg03Vv4-DCXciAkHJFiZaBMKletUs/pub?gid=0&single=true&output=csv';
const TEACHERS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSAe4dmVN4CArjEy_lvI5qrXf16naxZLO1lAxGm2Pj4TrdnoebBg03Vv4-DCXciAkHJFiZaBMKletUs/pub?gid=987931491&single=true&output=csv';


const getTeachers = async (): Promise<Teacher[]> => {
    try {
        // Add cache-busting query parameter to ensure fresh data
        const response = await fetch(`${TEACHERS_CSV_URL}&_=${new Date().getTime()}`);
        if (!response.ok) {
            throw new Error('Network response was not ok for teachers.');
        }
        const csvText = await response.text();
        // **FIX**: Use a robust, index-based parser instead of a generic one.
        const lines = csvText.trim().replace(/\r\n?|\r/g, '\n').split('\n');
        
        const cleanValue = (val: string) => {
            let v = (val || '').trim();
            if (v.startsWith('"') && v.endsWith('"')) {
                v = v.substring(1, v.length - 1).replace(/""/g, '"');
            }
            return v;
        };

        return lines.slice(1) // Skip header
            .map(line => {
                if (!line.trim()) return null;
                // Regex handles commas within quoted fields
                const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
                if (values.length < 3) return null; // Needs at least 3 columns
                return {
                    nombreCompleto: cleanValue(values[0]),
                    curp: cleanValue(values[1]),
                    email: cleanValue(values[2]),
                };
            })
            .filter((teacher): teacher is Teacher => teacher !== null);

    } catch (error) {
        console.error("Error fetching or parsing teachers CSV:", error);
        return []; // Return empty array on failure to prevent app crash
    }
};

const getCourses = async (): Promise<Course[]> => {
    try {
        // Add cache-busting query parameter to ensure fresh data
        const response = await fetch(`${COURSES_CSV_URL}&_=${new Date().getTime()}`);
        if (!response.ok) {
            throw new Error('Network response was not ok for courses.');
        }
        const csvText = await response.text();
        // **FIX**: Use a robust, index-based parser instead of a generic one.
        const lines = csvText.trim().replace(/\r\n?|\r/g, '\n').split('\n');

        const cleanValue = (val: string) => {
            let v = (val || '').trim();
            if (v.startsWith('"') && v.endsWith('"')) {
                v = v.substring(1, v.length - 1).replace(/""/g, '"');
            }
            return v;
        };

        return lines.slice(1) // Skip header
            .map(line => {
                if (!line.trim()) return null;
                // Regex handles commas within quoted fields
                const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
                if (values.length < 8) return null; // Needs at least 8 columns

                const parsedHours = parseInt(cleanValue(values[4]), 10);

                // Direct mapping based on column index
                return {
                    id: cleanValue(values[0]),
                    name: cleanValue(values[1]),
                    dates: cleanValue(values[2]),
                    period: cleanValue(values[3]),
                    hours: isNaN(parsedHours) ? 30 : parsedHours,
                    location: cleanValue(values[5]),
                    schedule: cleanValue(values[6]),
                    type: cleanValue(values[7]),
                };
            })
            .filter((course): course is Course => course !== null);
            
    } catch (error) {
        console.error("Error fetching or parsing courses CSV:", error);
        return []; // Return empty array on failure
    }
};

const mockDepartments: string[] = [
    "DEPARTAMENTO DE SISTEMAS Y COMPUTACION",
    "DEPARTAMENTO DE INGENIERÍA ELÉCTRICA Y ELECTRÓNICA",
    "DEPARTAMENTO DE CIENCIAS ECONOMICO-ADMINISTRATIVAS",
    "DEPARTAMENTO DE INGENIERÍA QUÍMICA-BIOQUÍMICA",
    "DEPARTAMENTO DE CIENCIAS DE LA TIERRA",
    "DEPARTAMENTO DE CIENCIAS BASICAS",
    "DEPARTAMENTO DE METAL-MECÁNICA",
    "DEPARTAMENTO DE INGENIERÍA INDUSTRIAL",
    "DIVISION DE ESTUDIOS DE POSGRADO E INVESTIGACION",
    "ADMINISTRATIVO",
    "EXTERNO"
];

const getDepartments = (): Promise<string[]> => {
    return new Promise(resolve => setTimeout(() => resolve(mockDepartments), 100));
};

const getRegistrationByCurp = async (curp: string): Promise<string[]> => {
    const APPS_SCRIPT_URL = (window as any).CONFIG?.APPS_SCRIPT_URL;
    if (!APPS_SCRIPT_URL) {
        throw new Error("Google Apps Script URL is not configured.");
    }
    
    try {
        const url = new URL(APPS_SCRIPT_URL);
        url.searchParams.append('action', 'lookupByCurp');
        url.searchParams.append('curp', curp);
        url.searchParams.append('_', new Date().getTime().toString()); // Cache-busting parameter
        
        const response = await fetch(url.toString(), {
            method: 'GET',
            mode: 'cors'
        });
        
        const result = await response.json();

        if (result && result.status === 'success' && result.data.registeredCourses) {
            return result.data.registeredCourses;
        } else {
            // No registration found or an error occurred on backend, return empty array.
            return [];
        }
    } catch (error) {
        console.error("Error fetching registration by CURP:", error);
        return [];
    }
};


const submitRegistration = async (submission: SubmissionData): Promise<RegistrationResult[]> => {
    console.log("Submitting registration to backend:", submission);
    
    const APPS_SCRIPT_URL = (window as any).CONFIG?.APPS_SCRIPT_URL;
    if (!APPS_SCRIPT_URL) {
        console.error("Google Apps Script URL is not configured in index.html.");
        throw new Error("La URL de configuración no está disponible. Revise el archivo index.html.");
    }

    try {
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            mode: 'cors',
            redirect: 'follow',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify(submission)
        });

        const result = await response.json();

        if (result && result.status === 'success') {
            console.log("Submission successful, received results:", result.data);
            return result.data as RegistrationResult[];
        } else {
            throw new Error(result.message || 'Ocurrió un error en el servidor de registro.');
        }

    } catch (error) {
        console.error("Error submitting registration to Google Apps Script:", error);
        // This catch block handles fetch failures (network, CORS) or JSON parsing errors.
        throw new Error(
            "La comunicación con el servidor falló. Esto puede ocurrir por varias razones:\n\n" +
            "1. **URL del Script Incorrecta:** La URL en `index.html` puede ser errónea o estar desactualizada. Si actualizó el script, debe crear una 'Nueva implementación' y usar la nueva URL generada.\n\n" +
            "2. **Permisos del Script:** El script debe estar implementado con acceso para 'Cualquier persona'.\n\n" +
            "3. **Conexión a Internet:** Verifique su conexión.\n\n" +
            "Por favor, revise estos puntos o contacte al administrador del sistema."
        );
    }
};

const cancelSingleCourse = async (payload: { curp: string; email: string; fullName: string; courseToCancel: { id: string; name: string } }): Promise<void> => {
    const APPS_SCRIPT_URL = (window as any).CONFIG?.APPS_SCRIPT_URL;
    if (!APPS_SCRIPT_URL) {
        throw new Error("La URL de configuración de Google Apps Script no está disponible.");
    }

    // Add an 'action' property to the payload so the backend knows how to handle this request
    const body = { ...payload, action: 'cancelSingle' };

    try {
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            mode: 'cors',
            redirect: 'follow',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(body)
        });

        const result = await response.json();
        if (!result || result.status !== 'success') {
            throw new Error(result.message || 'Ocurrió un error en el servidor al cancelar el curso.');
        }
    } catch (error) {
        console.error("Error cancelling single course via Google Apps Script:", error);
        throw new Error(
            "La comunicación con el servidor falló al intentar cancelar el curso. Esto puede ocurrir por varias razones:\n\n" +
            "1. **URL del Script Incorrecta:** La URL en `index.html` puede ser errónea o estar desactualizada. Si actualizó el script, debe crear una 'Nueva implementación' y usar la nueva URL generada.\n\n" +
            "2. **Permisos del Script:** El script debe estar implementado con acceso para 'Cualquier persona'.\n\n" +
            "3. **Conexión a Internet:** Verifique su conexión.\n\n" +
            "Por favor, revise estos puntos o contacte al administrador del sistema."
        );
    }
};


// =============================================================================
// == COMPONENTS
// =============================================================================

const Header: React.FC = () => {
    return (
        <header className="bg-white shadow-md">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-24">
                    <div className="flex-shrink-0">
                        <img className="h-16 md:h-20" src="https://raw.githubusercontent.com/DA-itd/web/main/logo_itdurango.png" alt="Logo Instituto Tecnológico de Durango" />
                    </div>
                    <div className="text-center">
                        <h1 className="text-xl md:text-2xl font-bold text-blue-900">SISTEMA DE INSCRIPCIÓN A CURSOS DE ACTUALIZACIÓN DOCENTE</h1>
                        <h2 className="text-md md:text-lg text-blue-900">INSTITUTO TECNOLÓGICO DE DURANGO</h2>
                    </div>
                </div>
            </div>
        </header>
    );
};

const Footer: React.FC = () => {
    return (
        <footer className="bg-blue-800 text-white text-center p-4 mt-auto">
            <p className="font-semibold">COORDINACIÓN DE ACTUALIZACIÓN DOCENTE - Desarrollo Académico</p>
            <p className="text-sm">Todos los derechos reservados {new Date().getFullYear()}.</p>
        </footer>
    );
};

interface StepperProps {
    currentStep: number;
    steps: string[];
}
const Stepper: React.FC<StepperProps> = ({ currentStep, steps }) => {
    return (
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-start">
                {steps.map((step, index) => {
                    const isCompleted = index < currentStep;
                    const isActive = index === currentStep - 1;

                    return (
                        <React.Fragment key={index}>
                            <div className="flex flex-col items-center w-1/4">
                                <div className="relative flex items-center justify-center">
                                    <div className={`w-10 h-10 flex items-center justify-center z-10 rounded-full font-semibold text-white ${isCompleted ? 'bg-rose-800' : 'bg-gray-300'} ${isActive && 'ring-4 ring-rose-300'}`}>
                                        {index + 1}
                                    </div>
                                    {index < steps.length - 1 && (
                                        <div className={`absolute w-full top-1/2 -translate-y-1/2 left-1/2 h-1 ${index < currentStep -1 ? 'bg-rose-800' : 'bg-gray-300'}`} />
                                    )}
                                </div>
                                <div className="mt-2 text-center">
                                    <p className={`text-sm font-medium ${isCompleted ? 'text-rose-800' : 'text-gray-500'}`}>
                                        {step}
                                    </p>
                                </div>
                            </div>
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
};

const ExistingRegistrationModal: React.FC<{
    isOpen: boolean;
    courses: Course[];
    onModify: () => void;
    onClose: () => void;
    onDeleteCourse: (courseId: string) => Promise<void>;
    deletingCourseId: string | null;
}> = ({ isOpen, courses, onModify, onClose, onDeleteCourse, deletingCourseId }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative mx-auto p-8 border w-full max-w-lg shadow-lg rounded-md bg-white">
                <h3 className="text-2xl font-bold text-gray-800">Registro Encontrado</h3>
                <div className="mt-4">
                    <p className="text-gray-600">Hemos detectado que ya tiene cursos registrados con este CURP. Puede eliminar cursos individualmente o modificar su selección completa.</p>
                    <div className="mt-4 space-y-2 bg-gray-50 p-4 rounded-md border">
                        {courses.length > 0 ? (
                            courses.map(course => (
                                <div key={course.id} className="flex items-center justify-between py-1">
                                    <span className="font-semibold text-gray-700 flex-1 pr-4">{course.name}</span>
                                    <button
                                        onClick={() => onDeleteCourse(course.id)}
                                        disabled={!!deletingCourseId}
                                        className="p-2 rounded-full text-gray-500 hover:bg-red-100 hover:text-red-700 transition-colors disabled:opacity-50 disabled:cursor-wait flex items-center justify-center"
                                        aria-label="Eliminar curso"
                                    >
                                        {deletingCourseId === course.id ? (
                                            <svg className="animate-spin h-5 w-5 text-red-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            ))
                        ) : (
                             <p className="text-gray-500 italic">No tiene cursos registrados actualmente.</p>
                        )}
                    </div>
                    <p className="text-gray-600 mt-6">¿Qué desea hacer?</p>
                </div>
                <div className="mt-8 flex flex-col sm:flex-row-reverse gap-3">
                    <button
                        onClick={onModify}
                        className="w-full sm:w-auto bg-rose-800 text-white font-bold py-2 px-6 rounded-lg hover:bg-rose-900"
                    >
                        Modificar Selección
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full sm:w-auto bg-gray-200 text-gray-800 font-bold py-2 px-6 rounded-lg hover:bg-gray-300 mt-2 sm:mt-0 sm:mr-auto"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

interface AutocompleteProps {
    teachers: Teacher[];
    onSelect: (teacher: Teacher) => void;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    name?: string;
    placeholder?: string;
}

const AutocompleteInput: React.FC<AutocompleteProps> = ({ teachers, onSelect, value, onChange, name, placeholder }) => {
    const [suggestions, setSuggestions] = useState<Teacher[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const currentValue = e.target.value;
        onChange(e); // Propagate change to parent immediately

        if (currentValue && currentValue.length > 0) {
            const filtered = teachers.filter(teacher =>
                teacher.nombreCompleto.toLowerCase().includes(currentValue.toLowerCase())
            ).slice(0, 5);
            setSuggestions(filtered);
            setShowSuggestions(filtered.length > 0);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const handleSelect = (teacher: Teacher) => {
        onSelect(teacher);
        setShowSuggestions(false);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        const currentValue = e.target.value;
        if (currentValue && currentValue.length > 0) {
            const filtered = teachers.filter(teacher =>
                teacher.nombreCompleto.toLowerCase().includes(currentValue.toLowerCase())
            ).slice(0, 5);
            setSuggestions(filtered);
            setShowSuggestions(filtered.length > 0);
        }
    }

    return (
        <div className="relative" ref={containerRef}>
            <input
                type="text"
                name={name}
                value={value}
                onChange={handleInputChange}
                onFocus={handleFocus}
                placeholder={placeholder || "Escriba su nombre completo"}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
                autoComplete="off"
            />
            {showSuggestions && suggestions.length > 0 && (
                <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-60 overflow-auto">
                    {suggestions.map((teacher) => (
                        <li
                            key={teacher.curp || teacher.nombreCompleto}
                            onMouseDown={(e) => {
                                e.preventDefault(); // Prevent input from losing focus
                                handleSelect(teacher);
                            }}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        >
                            {teacher.nombreCompleto}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

interface Step1Props {
    formData: FormData;
    setFormData: React.Dispatch<React.SetStateAction<FormData>>;
    departments: string[];
    teachers: Teacher[];
    allCourses: Course[];
    setSelectedCourses: (courses: Course[]) => void;
    setOriginalSelectedCourses: (courses: Course[]) => void;
    onNext: () => void;
}

const Step1PersonalInfo: React.FC<Step1Props> = ({ formData, setFormData, departments, teachers, allCourses, setSelectedCourses, setOriginalSelectedCourses, onNext }) => {
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [isCheckingCurp, setIsCheckingCurp] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [existingCourses, setExistingCourses] = useState<Course[]>([]);
    const [deletingCourseId, setDeletingCourseId] = useState<string | null>(null);
    const lookupTriggered = useRef(false);

    useEffect(() => {
        if (formData.curp.length === 18 && !lookupTriggered.current) {
            const checkForRegistration = async () => {
                setIsCheckingCurp(true);
                lookupTriggered.current = true;
                const registeredCourseIds = await getRegistrationByCurp(formData.curp);
                setIsCheckingCurp(false);

                if (registeredCourseIds.length > 0) {
                    const preSelectedCourses = allCourses.filter(c => registeredCourseIds.includes(c.id));
                    if (preSelectedCourses.length > 0) {
                        setExistingCourses(preSelectedCourses);
                        setOriginalSelectedCourses(preSelectedCourses);
                        setIsModalOpen(true);
                    }
                }
            };
            checkForRegistration();
        }
        if (formData.curp.length !== 18) {
            lookupTriggered.current = false;
        }
    }, [formData.curp, allCourses, setOriginalSelectedCourses]);

    const handleCloseModal = () => setIsModalOpen(false);

    const handleModifyRegistration = () => {
        setSelectedCourses(existingCourses);
        // Ensure original courses are set for comparison on submission
        setOriginalSelectedCourses(existingCourses);
        setIsModalOpen(false);
        onNext();
    };
    
    const handleDeleteCourse = async (courseIdToDelete: string) => {
        setDeletingCourseId(courseIdToDelete);
        try {
            const courseToDelete = existingCourses.find(c => c.id === courseIdToDelete);
            if (!courseToDelete) {
                throw new Error("No se encontró el curso para eliminar.");
            }
            
            await cancelSingleCourse({
                curp: formData.curp,
                email: formData.email,
                fullName: formData.fullName,
                courseToCancel: {
                    id: courseToDelete.id,
                    name: courseToDelete.name,
                }
            });

            const updatedCourses = existingCourses.filter(c => c.id !== courseIdToDelete);
            setExistingCourses(updatedCourses);
            setOriginalSelectedCourses(updatedCourses);

            if (updatedCourses.length === 0) {
                setIsModalOpen(false);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Hubo un error al eliminar el curso.";
            alert(`Error: ${errorMessage}`);
        } finally {
            setDeletingCourseId(null);
        }
    };
    
    const validate = () => {
        const newErrors: { [key: string]: string } = {};
        if (!formData.fullName) newErrors.fullName = "Este campo es obligatorio.";
        if (!formData.curp) newErrors.curp = "Este campo es obligatorio.";
        if (formData.curp.length !== 18) newErrors.curp = "El CURP debe tener 18 caracteres.";
        if (!formData.email) newErrors.email = "Este campo es obligatorio.";
        if (!/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = "El formato del email no es válido.";
        if (!formData.department) newErrors.department = "Este campo es obligatorio.";
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            onNext();
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        let finalValue = value;

        if (name === 'email') {
            finalValue = value.toLowerCase();
        } else if (name === 'curp' || name === 'fullName') {
            finalValue = value.toUpperCase();
        }

        setFormData(prev => {
            const newState = { ...prev, [name]: finalValue };

            if (name === 'curp' && finalValue.length >= 11) {
                const genderChar = finalValue.charAt(10).toUpperCase();
                if (genderChar === 'H') {
                    newState.gender = 'Hombre';
                } else if (genderChar === 'M') {
                    newState.gender = 'Mujer';
                }
            }
            return newState;
        });
    };

    const handleTeacherSelect = (teacher: Teacher) => {
        const { nombreCompleto, curp, email } = teacher;
        const upperCurp = (curp || '').toUpperCase();
        
        let inferredGender = 'Mujer'; // Start with default
        if (upperCurp.length >= 11) {
            const genderChar = upperCurp.charAt(10).toUpperCase();
            if (genderChar === 'H') {
                inferredGender = 'Hombre';
            } else if (genderChar === 'M') {
                inferredGender = 'Mujer';
            } else {
                inferredGender = 'Otro';
            }
        }

        setFormData(prev => ({
            ...prev,
            fullName: (nombreCompleto || '').toUpperCase(),
            curp: upperCurp,
            email: (email || '').toLowerCase(),
            gender: inferredGender,
        }));
    };

    return (
        <>
            <ExistingRegistrationModal
                isOpen={isModalOpen}
                courses={existingCourses}
                onModify={handleModifyRegistration}
                onClose={handleCloseModal}
                onDeleteCourse={handleDeleteCourse}
                deletingCourseId={deletingCourseId}
            />
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold mb-6 text-gray-800">Información Personal</h2>
                <form onSubmit={handleSubmit} noValidate>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Nombre Completo *</label>
                            <AutocompleteInput 
                                teachers={teachers} 
                                onSelect={handleTeacherSelect} 
                                value={formData.fullName}
                                onChange={handleChange}
                                name="fullName"
                                placeholder="Escriba su nombre completo"
                            />
                            {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
                        </div>
                        <div>
                            <label htmlFor="curp" className="block text-sm font-medium text-gray-700">CURP *</label>
                            <div className="relative">
                                <input type="text" name="curp" id="curp" value={formData.curp} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="18 caracteres" maxLength={18} required />
                                {isCheckingCurp && <div className="absolute inset-y-0 right-0 flex items-center pr-3"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div></div>}
                            </div>
                            {errors.curp && <p className="text-red-500 text-xs mt-1">{errors.curp}</p>}
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Institucional *</label>
                            <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="nombre@itdurango.edu.mx" required />
                            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                        </div>
                        <div>
                            <label htmlFor="gender" className="block text-sm font-medium text-gray-700">Género *</label>
                            <select name="gender" id="gender" value={formData.gender} onChange={handleChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md" required>
                                <option>Mujer</option>
                                <option>Hombre</option>
                                <option>Otro</option>
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label htmlFor="department" className="block text-sm font-medium text-gray-700">Departamento *</label>
                            <select name="department" id="department" value={formData.department} onChange={handleChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md" required>
                                <option value="">Seleccione un departamento</option>
                                {departments.map(dep => <option key={dep} value={dep}>{dep}</option>)}
                            </select>
                            {errors.department && <p className="text-red-500 text-xs mt-1">{errors.department}</p>}
                        </div>
                    </div>
                    <div className="mt-8 flex justify-end">
                        <button type="submit" className="bg-rose-800 text-white font-bold py-2 px-6 rounded-lg hover:bg-rose-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-700">Continuar</button>
                    </div>
                </form>
            </div>
        </>
    );
};

interface Step2Props {
    courses: Course[];
    selectedCourses: Course[];
    setSelectedCourses: (courses: Course[]) => void;
    onNext: () => void;
    onBack: () => void;
}

const Step2CourseSelection: React.FC<Step2Props> = ({ courses, selectedCourses, setSelectedCourses, onNext, onBack }) => {
    const [error, setError] = useState<string | null>(null);

    // **FIX**: Fail-safe helper function to check for schedule conflicts.
    const schedulesOverlap = (course1: Course, course2: Course): boolean => {
        // If dates are missing, different, or invalid, assume no conflict to prevent false positives.
        if (!course1.dates || !course2.dates || course1.dates !== course2.dates) {
            return false;
        }
        // If schedules are missing, assume no conflict.
        if (!course1.schedule || !course2.schedule) {
            return false;
        }

        const parseTime = (schedule: string): [number, number] | null => {
            const matches = schedule.match(/(\d{1,2}:\d{2})/g);
            if (!matches || matches.length < 2) return null;
            const startTime = parseInt(matches[0].replace(':', ''), 10);
            const endTime = parseInt(matches[1].replace(':', ''), 10);
            return [startTime, endTime];
        };

        const time1 = parseTime(course1.schedule);
        const time2 = parseTime(course2.schedule);

        if (!time1 || !time2) return false; // Cannot determine overlap

        const [start1, end1] = time1;
        const [start2, end2] = time2;

        // Overlap exists if one starts before the other ends, and vice-versa
        return start1 < end2 && start2 < end1;
    };

    const handleSelectCourse = (course: Course) => {
        const isSelected = selectedCourses.some(c => c.id === course.id);
        let newSelection = [...selectedCourses];
        setError(null);

        if (isSelected) {
            newSelection = newSelection.filter(c => c.id !== course.id);
        } else {
            if (selectedCourses.length >= 3) {
                setError("No puede seleccionar más de 3 cursos.");
                return;
            }
            const hasConflict = selectedCourses.some(selected => schedulesOverlap(selected, course));
            if (hasConflict) {
                setError("El horario de este curso se solapa con otra selección.");
                return;
            }
            newSelection.push(course);
        }
        
        setSelectedCourses(newSelection);
    };
    
    const getCourseCardStatus = (course: Course): { isDisabled: boolean; classNames: string } => {
        const isSelected = selectedCourses.some(c => c.id === course.id);

        if (isSelected) {
            return {
                isDisabled: false,
                classNames: `ring-2 ring-offset-2 ${course.period === 'PERIODO_1' ? 'ring-teal-500' : 'ring-indigo-500'}`
            };
        }

        const hasReachedMax = selectedCourses.length >= 3;
        const hasConflict = selectedCourses.some(selected => schedulesOverlap(selected, course));

        if (hasReachedMax || hasConflict) {
            return {
                isDisabled: true,
                classNames: "opacity-50 bg-gray-200 cursor-not-allowed"
            };
        }

        return { isDisabled: false, classNames: "bg-white" };
    };


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedCourses.length > 0) {
            onNext();
        } else {
            setError("Debe seleccionar al menos un curso.");
        }
    };

    return (
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-2 text-gray-800">Selección de Cursos</h2>
            <p className="text-gray-600 mb-6">Seleccione hasta 3 cursos. No puede seleccionar cursos con horarios que se solapen.</p>
            
            <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-4 mb-6 rounded-md" role="alert">
                <p className="font-bold">Cursos seleccionados: {selectedCourses.length} / 3</p>
            </div>
            
            {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md" role="alert">
                    <p>{error}</p>
                </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map(course => {
                    const { isDisabled, classNames } = getCourseCardStatus(course);
                    return (
                        <div
                            key={course.id}
                            onClick={() => {
                                if (!isDisabled) {
                                    handleSelectCourse(course);
                                }
                            }}
                            className={`p-4 rounded-lg border transition-all duration-200 flex flex-col justify-between h-full ${classNames} ${course.period === 'PERIODO_1' ? 'border-teal-300 hover:border-teal-500 bg-teal-50' : 'border-indigo-300 hover:border-indigo-500 bg-indigo-50'} ${isDisabled ? '' : 'cursor-pointer'}`}
                        >
                            <div>
                                <h3 className="font-bold text-sm text-gray-800 mb-2">{course.name}</h3>
                                <div className="text-xs text-gray-600 space-y-1">
                                    <p><strong>Fechas:</strong> {course.dates}</p>
                                    <p><strong>Horario:</strong> {course.schedule}</p>
                                    <p><strong>Lugar:</strong> {course.location}</p>
                                </div>
                            </div>
                            <div className="flex justify-end mt-3">
                                <input
                                    type="checkbox"
                                    checked={selectedCourses.some(c => c.id === course.id)}
                                    readOnly
                                    disabled={isDisabled}
                                    className="form-checkbox h-5 w-5 text-blue-600 rounded pointer-events-none"
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            <form onSubmit={handleSubmit}>
                <div className="mt-8 flex justify-between">
                    <button type="button" onClick={onBack} className="bg-gray-300 text-gray-800 font-bold py-2 px-6 rounded-lg hover:bg-gray-400">Regresar</button>
                    <button type="submit" className="bg-rose-800 text-white font-bold py-2 px-6 rounded-lg hover:bg-rose-900">Continuar</button>
                </div>
            </form>
        </div>
    );
};

interface Step3Props {
    formData: FormData;
    courses: Course[];
    onBack: () => void;
    onSubmit: () => Promise<void>;
}

const Step3Confirmation: React.FC<Step3Props> = ({ formData, courses, onBack, onSubmit }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            await onSubmit();
        } catch (error) {
            console.error("Submission error:", error);
            // Error is now handled and displayed by the main App component
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Confirmación de Registro</h2>

            <div className="border border-gray-200 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Resumen de su Registro</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                        <p><strong>Nombre: </strong>{formData.fullName}</p>
                        <p><strong>CURP: </strong>{formData.curp}</p>
                        <p><strong>Género: </strong>{formData.gender}</p>
                    </div>
                    <div>
                        <p><strong>Email: </strong>{formData.email}</p>
                        <p><strong>Departamento: </strong>{formData.department}</p>
                    </div>
                </div>
            </div>

            <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Cursos Seleccionados</h3>
                <div className="space-y-4">
                    {courses.map(course => {
                        return (
                            <div key={course.id} className="border border-gray-200 rounded-lg p-4">
                                <h4 className="font-bold text-gray-800">{course.name}</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 mt-2 text-sm text-gray-600">
                                    <div><strong>Horario: </strong>{course.schedule || 'N/A'}</div>
                                    <div><strong>Lugar: </strong>{course.location || 'N/A'}</div>
                                    <div><strong>Fechas: </strong>{course.dates}</div>
                                    <div><strong>Horas: </strong>{course.hours || 30}</div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            <div className="mt-8 flex justify-between">
                <button onClick={onBack} className="bg-gray-300 text-gray-800 font-bold py-2 px-6 rounded-lg hover:bg-gray-400" disabled={isSubmitting}>
                    Regresar
                </button>
                <button onClick={handleSubmit} className="bg-rose-800 text-white font-bold py-2 px-6 rounded-lg hover:bg-rose-900 flex items-center justify-center" disabled={isSubmitting}>
                    {isSubmitting && (
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    )}
                    {isSubmitting ? 'Procesando...' : 'Confirmar Registro'}
                </button>
            </div>
        </div>
    );
};

interface Step4Props {
    registrationResult: RegistrationResult[];
    applicantName: string;
}

const Step4Success: React.FC<Step4Props> = ({ registrationResult, applicantName }) => {
    const formatRegistrationId = (id: string): string => {
        // Fix for duplicated prefix, e.g., "TNM-054-TNM-054..." becomes "TNM-054..."
        let formattedId = id.replace(/^([A-Z0-9-]+)-\1-/, '$1');
        
        // Also keep the fix for a duplicated year, just in case.
        formattedId = formattedId.replace(/(\d{4})-\1/g, '$1');
        
        return formattedId;
    };

    return (
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-4xl mx-auto text-center">
            <svg className="mx-auto h-16 w-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="mt-4 text-2xl font-bold text-gray-800">¡Registro Exitoso!</h2>
            <p className="mt-2 text-gray-600">
                Gracias, <strong>{applicantName}</strong>. Tu solicitud de inscripción ha sido procesada correctamente.
                Se ha enviado un correo electrónico de confirmación con los detalles.
            </p>
            
            {/* **FIX**: Add defensive check to prevent crash if registrationResult is not a valid array */}
            {registrationResult && registrationResult.length > 0 ? (
                <div className="mt-6 text-left border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">Detalles de la Inscripción:</h3>
                    <ul className="space-y-3">
                        {registrationResult.map((result) => (
                            <li key={result.registrationId} className="p-3 bg-gray-50 rounded-md border border-gray-100">
                                <p className="font-semibold text-gray-800">{result.courseName}</p>
                                <p className="text-sm text-gray-500">Folio: <span className="font-mono bg-gray-200 text-gray-700 px-2 py-1 rounded">{formatRegistrationId(result.registrationId)}</span></p>
                            </li>
                        ))}
                    </ul>
                </div>
            ) : (
                <div className="mt-6 text-left border border-gray-200 rounded-lg p-6 bg-gray-50">
                     <p className="text-sm text-gray-600">
                        Los detalles específicos y folios de tu inscripción se encuentran en el correo electrónico que te hemos enviado.
                    </p>
                </div>
            )}

            <div className="mt-8 border-t pt-6">
                <p className="text-sm text-gray-500">
                    El proceso ha finalizado. Puede cerrar esta ventana de forma segura.
                </p>
            </div>
        </div>
    );
};

// =============================================================================
// == MAIN APP COMPONENT (from App.tsx)
// =============================================================================
const initialFormData: FormData = {
    fullName: '',
    curp: '',
    email: '',
    gender: 'Mujer',
    department: '',
    selectedCourses: []
};

const App: React.FC = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState<FormData>(initialFormData);
    const [selectedCourses, setSelectedCourses] = useState<Course[]>([]);
    const [originalSelectedCourses, setOriginalSelectedCourses] = useState<Course[]>([]);
    const [registrationResult, setRegistrationResult] = useState<RegistrationResult[]>([]);

    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [departments, setDepartments] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const [teachersData, coursesData, departmentsData] = await Promise.all([
                    getTeachers(),
                    getCourses(),
                    getDepartments()
                ]);

                if (coursesData.length === 0) {
                     throw new Error("No se pudieron cargar los datos de los cursos.");
                }

                setTeachers(teachersData);
                setCourses(coursesData);
                setDepartments(departmentsData);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "Error desconocido";
                setError(`No se pudieron cargar los datos necesarios para la inscripción. Causa: ${errorMessage}. Por favor, intente de nuevo más tarde.`);
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const steps = ["Información Personal", "Selección de Cursos", "Confirmación", "Registro Exitoso"];

    const handleNext = () => setCurrentStep(prev => prev + 1);
    const handleBack = () => {
        // Clear submission error when going back
        if(error && currentStep === 3) {
            setError(null);
        }
        setCurrentStep(prev => prev - 1)
    };
    
    // Function to handle starting over
    const handleStartOver = () => {
        setFormData(initialFormData);
        setSelectedCourses([]);
        setOriginalSelectedCourses([]);
        setRegistrationResult([]);
        setError(null);
        setCurrentStep(1);
    };

    const handleSubmit = async () => {
        // Clear previous errors before submitting
        setError(null);

        const { department, ...restOfFormData } = formData;

        const submissionData: SubmissionData = {
            ...restOfFormData,
            DepartamentoSeleccionado: department,
            timestamp: new Date().toISOString(),
            selectedCourses: selectedCourses.map(c => ({
                id: c.id,
                name: c.name,
                dates: c.dates,
                location: c.location,
                schedule: c.schedule,
            })),
        };
        
        // If this is a modification, include the original course IDs
        if (originalSelectedCourses.length > 0) {
            submissionData.previousRegistrationIds = originalSelectedCourses.map(c => c.id);
        }

        const updatedFormData = { ...formData, selectedCourses: selectedCourses.map(c => c.id) };
        setFormData(updatedFormData);

        try {
            const result = await submitRegistration(submissionData);
            setRegistrationResult(result);
            handleNext();
        } catch (error) {
            console.error("Error submitting registration:", error);
            const errorMessage = error instanceof Error ? error.message : "Hubo un error al procesar su registro. Intente de nuevo.";
            setError(errorMessage);
            // Stay on step 3 to show the error
            setCurrentStep(3);
        }
    };

    const handleCancelRegistration = async () => {
        const { department, ...restOfFormData } = formData;
        const submissionData: SubmissionData = {
            ...restOfFormData,
            DepartamentoSeleccionado: department,
            timestamp: new Date().toISOString(),
            selectedCourses: [], // Empty array signifies cancellation
            previousRegistrationIds: originalSelectedCourses.map(c => c.id),
        };

        try {
            await submitRegistration(submissionData);
            alert('Su inscripción ha sido cancelada exitosamente.');
            handleStartOver();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Hubo un error al cancelar su registro.";
            alert(`Error: ${errorMessage}`);
            setError(errorMessage);
        }
    };


    const renderStep = () => {
        // Centralized error display for submission errors on Step 3
        if (error && currentStep === 3) {
             return (
                <div className="w-full max-w-4xl mx-auto">
                     <div className="text-center bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
                         <strong className="font-bold">Error de envío: </strong>
                         <span className="block sm:inline whitespace-pre-wrap">{error}</span>
                     </div>
                     <Step3Confirmation formData={formData} courses={selectedCourses} onBack={handleBack} onSubmit={handleSubmit} />
                </div>
            );
        }
        
        switch (currentStep) {
            case 1:
                return <Step1PersonalInfo formData={formData} setFormData={setFormData} departments={departments} teachers={teachers} allCourses={courses} setSelectedCourses={setSelectedCourses} setOriginalSelectedCourses={setOriginalSelectedCourses} onNext={handleNext} />;
            case 2:
                return <Step2CourseSelection courses={courses} selectedCourses={selectedCourses} setSelectedCourses={setSelectedCourses} onNext={handleNext} onBack={handleBack} />;
            case 3:
                return <Step3Confirmation formData={formData} courses={selectedCourses} onBack={handleBack} onSubmit={handleSubmit} />;
            case 4:
                return <Step4Success registrationResult={registrationResult} applicantName={formData.fullName} />;
            default:
                return null;
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <Header />
            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Stepper currentStep={currentStep} steps={steps} />
                <div className="mt-8">
                    {isLoading ? (
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-800 mx-auto"></div>
                            <p className="text-lg font-semibold text-gray-700 mt-4">Cargando datos...</p>
                        </div>
                    ) : error && currentStep < 3 ? ( // Show initial loading error
                        <div className="text-center bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative max-w-4xl mx-auto" role="alert">
                            <strong className="font-bold">Error Crítico: </strong>
                            <span className="block sm:inline">{error}</span>
                        </div>
                    ) : (
                        renderStep()
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
};

// =============================================================================
// == RENDER APP (from original index.tsx)
// =============================================================================
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount the app");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);