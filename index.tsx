// FIX: Import React and ReactDOM to provide proper typings and fix module errors.
import React from 'react';
import ReactDOM from 'react-dom/client';

// FIX: Add type definition for configuration injected from index.html
declare global {
    interface Window {
        CONFIG?: {
            APPS_SCRIPT_URL?: string;
        };
    }
}


// =============================================================================
// == TYPES
// =============================================================================
interface IFormData {
    fullName: string;
    curp: string;
    email: string;
    gender: string;
    department: string;
    selectedCourses: any[];
}

interface Course {
    id: string;
    name: string;
    dates: string;
    period: string;
    hours: number;
    location: string;
    schedule: string;
    type: string;
}

interface Teacher {
    nombreCompleto: string;
    curp: string;
    email: string;
}


// =============================================================================
// == MAIN APP COMPONENT
// =============================================================================

const App = () => {
    const [currentStep, setCurrentStep] = React.useState(1);
    const [mode, setMode] = React.useState('student');
    // FIX: Use IFormData interface for strong typing.
    const [formData, setFormData] = React.useState<IFormData>({
        fullName: '',
        curp: '',
        email: '',
        gender: 'Mujer',
        department: '',
        selectedCourses: [],
    });
    // FIX: Add explicit types for all state variables.
    const [allCourses, setAllCourses] = React.useState<Course[]>([]);
    const [teachers, setTeachers] = React.useState<Teacher[]>([]);
    const [departments, setDepartments] = React.useState<string[]>([]);
    const [selectedCourses, setSelectedCourses] = React.useState<Course[]>([]);
    const [originalSelectedCourses, setOriginalSelectedCourses] = React.useState<Course[]>([]);
    const [registrationResult, setRegistrationResult] = React.useState<any[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [coursesData, teachersData, departmentsData] = await Promise.all([
                    getCourses(),
                    getTeachers(),
                    getDepartments()
                ]);
                setAllCourses(coursesData);
                setTeachers(teachersData);
                setDepartments(departmentsData);
            } catch (err) {
                setError("No se pudieron cargar los datos iniciales. Verifique la conexión y la configuración de las hojas de cálculo.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);
    
    const studentSteps = ["Información", "Cursos", "Confirmar", "Finalizado"];
    const instructorStep = "Portal Instructor";
    const allSteps = [...studentSteps, instructorStep];
    
    const handleNext = () => setCurrentStep(prev => prev < 4 ? prev + 1 : prev);
    const handleBack = () => setCurrentStep(prev => prev > 1 ? prev - 1 : prev);
    const goToStep = (step: number) => {
        if (step > 0 && step <= studentSteps.length) {
            setCurrentStep(step);
        }
    };


    const handleStepClick = (stepIndex: number) => {
        const instructorStepIndex = studentSteps.length; // 4
        if (stepIndex === instructorStepIndex) {
            setMode('instructor');
            setCurrentStep(5); // Go to instructor step
        } else {
            // Allow navigation back to previous steps in student mode
            if (stepIndex < currentStep - 1) {
                setMode('student');
                setCurrentStep(stepIndex + 1);
            }
        }
    };
    
    const handleBackToStudentForm = () => {
        setMode('student');
        setCurrentStep(1); // Reset to the first step of the student form
    };

    const handleSubmit = async () => {
        setError(null);
        try {
            const submissionData = {
                action: 'enrollStudent', // Action for the backend router
                timestamp: new Date().toISOString(),
                fullName: formData.fullName,
                curp: formData.curp,
                email: formData.email,
                gender: formData.gender,
                DepartamentoSeleccionado: formData.department,
                selectedCourses: selectedCourses.map(c => ({
                    id: c.id,
                    name: c.name,
                    dates: c.dates,
                    location: c.location,
                    schedule: c.schedule,
                })),
                previousRegistrationIds: originalSelectedCourses.map(c => c.id)
            };

            const result = await submitRegistration(submissionData);
            
            // The backend returns an object with a 'results' property which is an array.
            const registrationResultsArray = result.results || [];

            // Augment the result with course dates for display on the success screen
            const augmentedResult = registrationResultsArray.map((reg: any) => {
                const courseDetails = selectedCourses.find(c => c.id === reg.registrationId);
                return {
                    ...reg,
                    dates: courseDetails ? courseDetails.dates : 'Fechas no disponibles'
                };
            });
            setRegistrationResult(augmentedResult);

            handleNext();

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Ocurrió un error desconocido durante el envío.";
            setError(errorMessage);
            // Optionally, stay on the confirmation step to show the error
            setCurrentStep(3);
        }
    };
    
    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-rose-800"></div>
                </div>
            );
        }
        
        if (error && currentStep !== 3) {
            return (
                 <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mx-auto max-w-4xl" role="alert">
                    <p className="font-bold">Error Crítico</p>
                    <p>{error}</p>
                </div>
            )
        }
        
        if (mode === 'instructor') {
             return <InstructorForm onBack={handleBackToStudentForm} teachers={teachers} courses={allCourses} />;
        }

        switch (currentStep) {
            case 1:
                return <Step1PersonalInfo 
                            formData={formData} 
                            setFormData={setFormData} 
                            departments={departments} 
                            teachers={teachers}
                            allCourses={allCourses}
                            setSelectedCourses={setSelectedCourses}
                            setOriginalSelectedCourses={setOriginalSelectedCourses}
                            onNext={handleNext}
                            onGoToStep={goToStep} />;
            case 2:
                return <Step2CourseSelection 
                            courses={allCourses} 
                            selectedCourses={selectedCourses} 
                            setSelectedCourses={setSelectedCourses} 
                            onNext={handleNext} 
                            onBack={handleBack} />;
            case 3:
                return <Step3Confirmation 
                            formData={formData} 
                            courses={selectedCourses}
                            originalCourses={originalSelectedCourses} 
                            onBack={handleBack} 
                            onSubmit={handleSubmit} />;
            case 4:
                return <Step4Success 
                            registrationResult={registrationResult} 
                            applicantName={formData.fullName} 
                            selectedCourses={selectedCourses} 
                        />;
            default:
                return <div>Paso desconocido</div>;
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-100">
            <Header />
            <main className="flex-grow">
                <Stepper currentStep={currentStep} steps={allSteps} mode={mode} onStepClick={handleStepClick} />
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-8">
                     {error && currentStep === 3 && (
                        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md w-full max-w-4xl mx-auto" role="alert">
                            <p className="font-bold">Error al Enviar</p>
                            <p className="whitespace-pre-wrap">{error}</p>
                        </div>
                    )}
                    {renderContent()}
                </div>
            </main>
            <Footer />
        </div>
    );
};

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
        
        const cleanValue = (val: string | undefined) => {
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

        const cleanValue = (val: string | undefined) => {
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

const mockDepartments = [
    "DEPARTAMENTO DE SISTEMAS Y COMPUTACION",
    "DEPARTAMENTO DE INGENIERÍA ELÉCTRICA Y ELECTRÓNICA",
    "DEPARTamento DE CIENCIAS ECONOMICO-ADMINISTRATIVAS",
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
    const APPS_SCRIPT_URL = window.CONFIG?.APPS_SCRIPT_URL;
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

        if (result && result.success && result.data.registeredCourses) {
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


const submitRegistration = async (submission: any): Promise<any> => {
    console.log("Submitting registration to backend:", submission);
    
    const APPS_SCRIPT_URL = window.CONFIG?.APPS_SCRIPT_URL;
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

        if (result && result.success) {
            console.log("Submission successful, received results:", result.data);
            return result.data;
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

const cancelSingleCourse = async (payload: any) => {
    const APPS_SCRIPT_URL = window.CONFIG?.APPS_SCRIPT_URL;
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
        if (!result || !result.success) {
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

// Helper to convert a file to a Base64 string
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            // The backend's Utilities.base64Decode expects the data URL prefix.
            resolve(result);
        };
        reader.onerror = error => reject(error);
    });
};

const submitInstructorProposal = async (data: any) => {
    const APPS_SCRIPT_URL = window.CONFIG?.APPS_SCRIPT_URL;
    if (!APPS_SCRIPT_URL) {
        throw new Error("La URL de configuración no está disponible. Revise el archivo index.html.");
    }
    
    const payload = {
        action: 'submitInstructorProposal',
        ...data
    };

    try {
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            mode: 'cors',
            redirect: 'follow',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        if (result && result.success) {
            return result;
        } else {
            throw new Error(result.message || 'Ocurrió un error en el servidor al enviar la propuesta.');
        }
    } catch (error) {
        console.error("Error submitting instructor proposal:", error);
        throw new Error("La comunicación con el servidor falló. Verifique la URL de configuración y los permisos del script.");
    }
};


const submitEvidence = async (data: any) => {
    const APPS_SCRIPT_URL = window.CONFIG?.APPS_SCRIPT_URL;
    if (!APPS_SCRIPT_URL) {
        throw new Error("La URL de configuración no está disponible. Revise el archivo index.html.");
    }
    
    const payload = {
        action: 'submitInstructorEvidence',
        ...data
    };

    try {
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            mode: 'cors',
            redirect: 'follow',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        if (result && result.success) {
            return result;
        } else {
            throw new Error(result.message || 'Ocurrió un error en el servidor al enviar la evidencia.');
        }
    } catch (error) {
        console.error("Error submitting evidence:", error);
        throw new Error("La comunicación con el servidor falló. Verifique la URL de configuración, los permisos del script y la lógica del backend.");
    }
};


// =============================================================================
// == COMPONENTS
// =============================================================================

const Header = () => {
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

const Footer = () => {
    return (
        <footer className="bg-blue-800 text-white text-center p-4 mt-auto">
            <p className="font-semibold">&copy; Coordinación de actualización docente - M.C. Alejandro Calderón Rentería.</p>
            <p className="text-sm">Todos los derechos reservados 2026.</p>
        </footer>
    );
};

interface StepperProps {
    currentStep: number;
    steps: string[];
    mode: string;
    onStepClick: (index: number) => void;
}

const Stepper = ({ currentStep, steps, mode, onStepClick }: StepperProps) => {
    const instructorStepIndex = 4;

    return (
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-start">
                {steps.map((step, index) => {
                    const isStudentStep = index < instructorStepIndex;
                    const isInstructorStep = index === instructorStepIndex;
                    
                    const isCompleted = isStudentStep && mode === 'student' && index < currentStep - 1;
                    const isActive = (isStudentStep && mode === 'student' && index === currentStep - 1) || (isInstructorStep && mode === 'instructor');
                    
                    // A student step can be clicked if it's already completed. The instructor step is always clickable.
                    const isClickable = (isStudentStep && isCompleted) || isInstructorStep;

                    return (
                        <React.Fragment key={index}>
                             <button
                                type="button"
                                onClick={() => onStepClick(index)}
                                disabled={!isClickable && !isActive}
                                aria-current={isActive ? 'step' : undefined}
                                className={`flex flex-col items-center text-center group disabled:cursor-not-allowed ${isInstructorStep ? 'w-1/5' : 'w-1/4'}`}
                             >
                                <div className="relative flex items-center justify-center">
                                    <div className={`w-10 h-10 flex items-center justify-center z-10 rounded-full font-semibold text-white transition-colors duration-300
                                        ${isInstructorStep 
                                            ? (isActive ? 'bg-indigo-600 ring-4 ring-indigo-300' : 'bg-gray-400 group-hover:bg-gray-500') 
                                            : (isCompleted ? 'bg-rose-800 group-hover:bg-rose-900' : (isActive ? 'bg-rose-800' : 'bg-gray-300'))}
                                        group-disabled:bg-gray-300 group-disabled:group-hover:bg-gray-300`}
                                    >
                                        {index + 1}
                                    </div>
                                    {index < steps.length - 1 && (
                                        <div className={`absolute w-full top-1/2 -translate-y-1/2 left-1/2 h-1 ${isCompleted ? 'bg-rose-800' : 'bg-gray-300'}`} />
                                    )}
                                </div>
                                <div className="mt-2">
                                    <p className={`text-sm font-medium transition-colors duration-300
                                      ${isInstructorStep 
                                        ? (isActive ? 'text-indigo-700' : 'text-gray-600 group-hover:text-gray-800') 
                                        : (isCompleted || isActive ? 'text-rose-800' : 'text-gray-500')}
                                      group-disabled:text-gray-500 group-disabled:group-hover:text-gray-500`}
                                    >
                                        {step}
                                    </p>
                                </div>
                            </button>
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
};

interface ExistingRegistrationModalProps {
    isOpen: boolean;
    courses: Course[];
    onModify: () => void;
    onClose: () => void;
    onDeleteCourse: (courseId: string) => void;
    deletingCourseId: string | null;
    onCancelAll: () => void;
}

const ExistingRegistrationModal = ({ isOpen, courses, onModify, onClose, onDeleteCourse, deletingCourseId, onCancelAll }: ExistingRegistrationModalProps) => {
    React.useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
           if (event.key === 'Escape') {
              onClose();
           }
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEsc);
        }
        return () => {
            window.removeEventListener('keydown', handleEsc);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div 
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
                className="relative mx-auto p-8 border w-full max-w-lg shadow-lg rounded-md bg-white"
            >
                <h3 id="modal-title" className="text-2xl font-bold text-gray-800">Ya Tienes un Registro Activo</h3>
                <div className="mt-4">
                    <p className="text-gray-600">Hemos detectado que ya estás inscrito en los siguientes cursos. ¿Qué te gustaría hacer?</p>
                    <div className="mt-4 space-y-2 bg-gray-50 p-4 rounded-md border">
                        {courses.length > 0 ? (
                            courses.map(course => (
                                <div key={course.id} className="flex items-center justify-between py-1">
                                    <span className="font-semibold text-gray-700 flex-1 pr-4">{course.name}</span>
                                    <button
                                        onClick={() => onDeleteCourse(course.id)}
                                        disabled={!!deletingCourseId}
                                        className="p-2 rounded-full text-gray-500 hover:bg-red-100 hover:text-red-700 transition-colors disabled:opacity-50 disabled:cursor-wait flex items-center justify-center"
                                        aria-label={`Eliminar curso ${course.name}`}
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
                    <p className="text-gray-600 mt-6">Puede modificar su selección actual, o cancelar toda su inscripción para empezar de nuevo.</p>
                </div>
                <div className="mt-8 flex flex-col sm:flex-row-reverse gap-3">
                    <button
                        onClick={onModify}
                        className="w-full sm:w-auto bg-rose-800 text-white font-bold py-2 px-6 rounded-lg hover:bg-rose-900"
                    >
                        Modificar Selección
                    </button>
                     <button
                        onClick={onCancelAll}
                        className="w-full sm:w-auto bg-red-700 text-white font-bold py-2 px-6 rounded-lg hover:bg-red-800"
                    >
                        Cancelar Inscripción
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

interface AutocompleteInputProps {
    teachers: Teacher[];
    onSelect: (teacher: Teacher) => void;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    name: string;
    placeholder?: string;
    required?: boolean;
}

const AutocompleteInput = ({ teachers, onSelect, value, onChange, name, placeholder, required = false }: AutocompleteInputProps) => {
    const [suggestions, setSuggestions] = React.useState<Teacher[]>([]);
    const [showSuggestions, setShowSuggestions] = React.useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
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
                required={required}
                autoComplete="off"
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={showSuggestions}
            />
            {showSuggestions && suggestions.length > 0 && (
                <ul role="listbox" className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-60 overflow-auto">
                    {suggestions.map((teacher) => (
                        <li
                            key={teacher.curp || teacher.nombreCompleto}
                            role="option"
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

interface Step1PersonalInfoProps {
    formData: IFormData;
    setFormData: React.Dispatch<React.SetStateAction<IFormData>>;
    departments: string[];
    teachers: Teacher[];
    allCourses: Course[];
    setSelectedCourses: React.Dispatch<React.SetStateAction<Course[]>>;
    setOriginalSelectedCourses: React.Dispatch<React.SetStateAction<Course[]>>;
    onNext: () => void;
    onGoToStep: (step: number) => void;
}

const Step1PersonalInfo = ({ formData, setFormData, departments, teachers, allCourses, setSelectedCourses, setOriginalSelectedCourses, onNext, onGoToStep }: Step1PersonalInfoProps) => {
    // FIX: Add explicit type for the errors state object.
    const [errors, setErrors] = React.useState<{ [key: string]: string }>({});
    const [isCheckingCurp, setIsCheckingCurp] = React.useState(false);
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [existingCourses, setExistingCourses] = React.useState<Course[]>([]);
    const [deletingCourseId, setDeletingCourseId] = React.useState<string | null>(null);
    const lookupTriggered = React.useRef(false);

    React.useEffect(() => {
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

    const handleCancelAllRegistration = () => {
        setSelectedCourses([]); // Clear current selection
        setOriginalSelectedCourses(existingCourses); // Preserve original list for cancellation logic in Step 3
        setIsModalOpen(false);
        onGoToStep(3); // Go directly to confirmation step
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
        // FIX: Add explicit type for newErrors to prevent "property does not exist on type '{}'" errors.
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
        <React.Fragment>
            <ExistingRegistrationModal
                isOpen={isModalOpen}
                courses={existingCourses}
                onModify={handleModifyRegistration}
                onClose={handleCloseModal}
                onDeleteCourse={handleDeleteCourse}
                deletingCourseId={deletingCourseId}
                onCancelAll={handleCancelAllRegistration}
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
                                required={true}
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
        </React.Fragment>
    );
};

interface Step2CourseSelectionProps {
    courses: Course[];
    selectedCourses: Course[];
    setSelectedCourses: React.Dispatch<React.SetStateAction<Course[]>>;
    onNext: () => void;
    onBack: () => void;
}

const Step2CourseSelection = ({ courses, selectedCourses, setSelectedCourses, onNext, onBack }: Step2CourseSelectionProps) => {
    const [error, setError] = React.useState<string | null>(null);

    const schedulesOverlap = (course1: Course, course2: Course) => {
        if (!course1.dates || !course2.dates || course1.dates !== course2.dates) return false;
        if (!course1.schedule || !course2.schedule) return false;

        const parseTime = (schedule: string) => {
            const matches = schedule.match(/(\d{1,2}:\d{2})/g);
            if (!matches || matches.length < 2) return null;
            const startTime = parseInt(matches[0].replace(':', ''), 10);
            const endTime = parseInt(matches[1].replace(':', ''), 10);
            return [startTime, endTime];
        };

        const time1 = parseTime(course1.schedule);
        const time2 = parseTime(course2.schedule);

        if (!time1 || !time2) return false;

        const [start1, end1] = time1;
        const [start2, end2] = time2;

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
            
            <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-4 mb-6 rounded-md" role="status">
                <p className="font-bold">Cursos seleccionados: {selectedCourses.length} / 3</p>
            </div>
            
            {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md" role="alert">
                    <p>{error}</p>
                </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map(course => {
                    const isSelected = selectedCourses.some(c => c.id === course.id);
                    const hasConflict = !isSelected && selectedCourses.some(selected => schedulesOverlap(selected, course));
                    const hasReachedMax = !isSelected && selectedCourses.length >= 3;
                    const isDisabled = hasConflict || hasReachedMax;

                    const period1Styles = "border-t-4 border-teal-400 bg-teal-50 hover:shadow-md";
                    const period2Styles = "border-t-4 border-indigo-400 bg-indigo-50 hover:shadow-md";
                    const basePeriodStyles = course.period === 'PERIODO_1' ? period1Styles : period2Styles;
                    const selectedRing = course.period === 'PERIODO_1' ? 'peer-checked:ring-teal-500' : 'peer-checked:ring-indigo-500';
                    const textColor = course.period === 'PERIODO_1' ? 'text-teal-800' : 'text-indigo-800';

                    return (
                        <div key={course.id} className="relative h-full">
                            <input
                                type="checkbox"
                                id={`course-${course.id}`}
                                checked={isSelected}
                                disabled={isDisabled}
                                onChange={() => handleSelectCourse(course)}
                                className="sr-only peer"
                            />
                            <label
                                htmlFor={`course-${course.id}`}
                                className={`p-4 rounded-lg border border-gray-200 transition-all duration-200 flex flex-col justify-between h-full 
                                            ${basePeriodStyles} 
                                            peer-disabled:opacity-60 peer-disabled:cursor-not-allowed peer-disabled:bg-gray-100 peer-disabled:hover:shadow-none peer-disabled:border-gray-300
                                            peer-checked:ring-2 peer-checked:ring-offset-2 ${selectedRing}
                                            cursor-pointer`}
                            >
                                <div>
                                    <h3 className={`font-bold text-sm mb-2 ${textColor}`}>{course.name}</h3>
                                    <div className="text-xs text-gray-600 space-y-1">
                                        <p><strong>Fechas:</strong> {course.dates}</p>
                                        <p><strong>Horario:</strong> {course.schedule}</p>
                                        <p><strong>Lugar:</strong> {course.location}</p>
                                    </div>
                                </div>
                                <div className="flex justify-end mt-3 h-5 w-5" aria-hidden="true">
                                    {/* Visual indicator for checkbox */}
                                    <div className={`h-5 w-5 border-2 rounded-sm flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-400'} ${isDisabled ? 'bg-gray-200 border-gray-300' : ''}`}>
                                        {isSelected && <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                                    </div>
                                </div>
                            </label>
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

interface Step3ConfirmationProps {
    formData: IFormData;
    courses: Course[];
    originalCourses: Course[];
    onBack: () => void;
    onSubmit: () => Promise<void>;
}

const Step3Confirmation = ({ formData, courses, originalCourses, onBack, onSubmit }: Step3ConfirmationProps) => {
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const isCancellation = courses.length === 0 && originalCourses.length > 0;


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
            <h2 className="text-2xl font-bold mb-6 text-gray-800">{isCancellation ? 'Confirmar Cancelación' : 'Confirmación de Registro'}</h2>

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
                <h3 className="text-lg font-semibold text-gray-700 mb-4">{isCancellation ? "Cursos a Cancelar" : "Cursos Seleccionados"}</h3>
                 {isCancellation ? (
                    <div className="border border-yellow-400 bg-yellow-50 text-yellow-800 rounded-lg p-4">
                        <p className="font-bold">Atención: Está a punto de cancelar su inscripción.</p>
                        <p className="mt-2">Al confirmar, se eliminará su registro de los siguientes {originalCourses.length} cursos:</p>
                        <ul className="list-disc list-inside mt-2 space-y-1">
                            {originalCourses.map(course => <li key={course.id}>{course.name}</li>)}
                        </ul>
                        <p className="mt-2">¿Desea continuar?</p>
                    </div>
                ) : courses.length > 0 ? (
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
                 ) : (
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <p className="text-gray-600">No ha seleccionado ningún curso para inscribir.</p>
                    </div>
                )}
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
                    {isSubmitting ? 'Procesando...' : isCancellation ? 'Confirmar Cancelación' : 'Confirmar Registro'}
                </button>
            </div>
        </div>
    );
};

interface Step4SuccessProps {
    registrationResult: any[];
    applicantName: string;
    selectedCourses: Course[];
}

const Step4Success = ({ registrationResult, applicantName, selectedCourses }: Step4SuccessProps) => {
    const hasRegistrationResult = registrationResult && Array.isArray(registrationResult) && registrationResult.length > 0;
    
    // Use registrationResult if it has data, otherwise fallback to selectedCourses from the previous step.
    const coursesToDisplay = hasRegistrationResult ? registrationResult : selectedCourses;

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
            
            {coursesToDisplay && coursesToDisplay.length > 0 ? (
                <div className="mt-6 text-left border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">Detalles de la Inscripción:</h3>
                    <ul className="space-y-3">
                        {coursesToDisplay.map((result) => (
                            <li key={result.registrationId || result.id} className="p-3 bg-gray-50 rounded-md border border-gray-100">
                                <div className="flex justify-between items-center flex-wrap gap-2">
                                    <span className="font-semibold text-gray-800">
                                        {/* Data can come from registrationResult (courseName) or selectedCourses (name) */}
                                        {(result.courseName || result.name)}
                                        {result.dates && ` (${result.dates})`}
                                    </span>
                                    {result.folio && (
                                        <span className="text-sm">
                                            Folio temporal: <strong className="font-mono bg-gray-200 text-gray-800 py-1 px-2 rounded">{result.folio}</strong>
                                        </span>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            ) : (
                <div className="mt-6 text-left border border-gray-200 rounded-lg p-6 bg-gray-50">
                     <p className="text-sm text-gray-600">
                        Los detalles específicos y folios temporales de tu inscripción se encuentran en el correo electrónico que te hemos enviado.
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

interface FileInputProps {
    id: string;
    label: string;
    onFileSelect: (file: File | null) => void;
    onError: (error: string | null) => void;
    acceptedFile: File | null;
    acceptedTypes: string[];
    maxSizeMB: number;
}

const FileInput = ({ id, label, onFileSelect, onError, acceptedFile, acceptedTypes, maxSizeMB }: FileInputProps) => {
    const [isDragging, setIsDragging] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);

    const handleFileValidation = (file: File) => {
        const fileTypeMajor = file.type.split('/')[0];
        const isValidType = acceptedTypes.some(type => 
            type.endsWith('/*') ? type.startsWith(fileTypeMajor) : type === file.type
        );

        if (!isValidType) {
            onError(`El archivo debe ser de tipo: ${acceptedTypes.join(', ')}.`);
            return false;
        }

        if (file.size > maxSizeMB * 1024 * 1024) {
            onError(`El archivo no debe exceder ${maxSizeMB} MB.`);
            return false;
        }

        onError(null);
        onFileSelect(file);
        return true;
    };

    const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => { e.preventDefault(); setIsDragging(false); };
    const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => { e.preventDefault(); };
    const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileValidation(e.dataTransfer.files[0]);
        }
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFileValidation(e.target.files[0]);
        } else {
             onFileSelect(null);
        }
    };

    const handleRemoveFile = () => {
        onFileSelect(null);
        if (inputRef.current) {
            inputRef.current.value = "";
        }
    };
    
    const fileTypeString = acceptedTypes.includes('application/pdf') ? 'application/pdf' : 'PDF, JPG, PNG';

    return (
        <div>
            <label 
                htmlFor={id} 
                className={`relative flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors
                ${isDragging ? 'border-indigo-500' : ''}`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                <input
                    type="file"
                    id={id}
                    ref={inputRef}
                    className="sr-only"
                    accept={acceptedTypes.join(',')}
                    onChange={handleChange}
                />
                 <div className="flex flex-col items-center justify-center space-y-2 text-center">
                    <svg className="w-8 h-8 text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/></svg>
                    {acceptedFile ? (
                        <div className="text-sm font-semibold text-green-700">
                           <p>Archivo: {acceptedFile.name}</p>
                        </div>
                    ) : (
                         <p className="text-sm text-gray-500 px-2">
                            {label} <span className="text-blue-600 font-semibold">o arrastra y suelta</span>
                         </p>
                    )}
                 </div>
            </label>
             <div className="flex justify-between items-center mt-1">
                 <p className="text-xs text-gray-500">{fileTypeString}. Máx {maxSizeMB}MB.</p>
                 {acceptedFile && (
                    <button type="button" onClick={handleRemoveFile} className="text-xs text-red-600 hover:underline">
                        Quitar archivo
                    </button>
                )}
            </div>
        </div>
    );
};

const formatCourseDates = (dates: string) => {
    if (!dates) return '';
    return dates.split(',')
                .map(date => date.trim())
                .join(' | ');
};

interface InstructorFormProps {
    onBack: () => void;
    teachers: Teacher[];
    courses: Course[];
}

const InstructorForm = ({ onBack, teachers, courses }: InstructorFormProps) => {
    const [activeTab, setActiveTab] = React.useState<'proposal' | 'evidence'>('proposal');

    // State for Proposal Form
    const [proposalForm, setProposalForm] = React.useState({
        instructorName: '',
        instructorEmail: '',
        courseName: '',
    });
    const [cvuFile, setCvuFile] = React.useState<File | null>(null);
    const [fichaFile, setFichaFile] = React.useState<File | null>(null);
    const [proposalStatus, setProposalStatus] = React.useState<{isSubmitting: boolean, error: string | null, success: string | null}>({ isSubmitting: false, error: null, success: null });
    const [cvuError, setCvuError] = React.useState<string | null>(null);
    const [fichaError, setFichaError] = React.useState<string | null>(null);
    
    // State for Evidence Form
    const [evidenceForm, setEvidenceForm] = React.useState({
        instructorName: '',
        instructorEmail: '',
        courseName: '',
    });
    const [evidenceFiles, setEvidenceFiles] = React.useState<File[]>([]);
    const [evidenceError, setEvidenceError] = React.useState<string | null>(null);
    const [evidenceStatus, setEvidenceStatus] = React.useState<{isSubmitting: boolean, error: string | null, success: string | null}>({ isSubmitting: false, error: null, success: null });


    const handleProposalTeacherSelect = (teacher: Teacher) => {
        setProposalForm(prev => ({
            ...prev,
            instructorName: teacher.nombreCompleto.toUpperCase(),
            instructorEmail: (teacher.email || '').toLowerCase()
        }));
    };
    
    const handleEvidenceTeacherSelect = (teacher: Teacher) => {
        setEvidenceForm(prev => ({
            ...prev,
            instructorName: teacher.nombreCompleto.toUpperCase(),
            instructorEmail: (teacher.email || '').toLowerCase()
        }));
    };

    const handleProposalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProposalStatus({ isSubmitting: true, error: null, success: null });
        
        if (cvuError || fichaError) {
            setProposalStatus({ isSubmitting: false, error: 'Por favor, corrija los errores en los archivos.', success: null });
            return;
        }

        if (!proposalForm.instructorName || !proposalForm.instructorEmail || !proposalForm.courseName || !cvuFile || !fichaFile) {
            setProposalStatus({ isSubmitting: false, error: 'Todos los campos y archivos son obligatorios.', success: null });
            return;
        }

        try {
            const cvuFileBase64 = await fileToBase64(cvuFile);
            const fichaFileBase64 = await fileToBase64(fichaFile);

            await submitInstructorProposal({
                instructorName: proposalForm.instructorName,
                instructorEmail: proposalForm.instructorEmail,
                courseName: proposalForm.courseName,
                cvuFile: cvuFileBase64,
                fichaFile: fichaFileBase64
            });

            setProposalStatus({ isSubmitting: false, error: null, success: '¡Propuesta enviada con éxito! Gracias por tu contribución.' });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Hubo un error al enviar la propuesta.";
            setProposalStatus({ isSubmitting: false, error: errorMessage, success: null });
        }
    };

    const handleEvidenceSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setEvidenceStatus({ isSubmitting: true, error: null, success: null });
        setEvidenceError(null);

        if (evidenceFiles.length === 0) {
            setEvidenceStatus({ isSubmitting: false, error: 'Debe subir al menos un archivo de evidencia.', success: null });
            return;
        }

        if (!evidenceForm.instructorName || !evidenceForm.instructorEmail || !evidenceForm.courseName) {
            setEvidenceStatus({ isSubmitting: false, error: 'Todos los campos de información del instructor y del curso son obligatorios.', success: null });
            return;
        }

        try {
            const evidenceFilesBase64 = await Promise.all(
                evidenceFiles.map(file => fileToBase64(file))
            );
            
            await submitEvidence({
                instructorName: evidenceForm.instructorName,
                instructorEmail: evidenceForm.instructorEmail,
                courseName: evidenceForm.courseName,
                evidenceFiles: evidenceFilesBase64
            });

            setEvidenceStatus({ isSubmitting: false, error: null, success: '¡Evidencia enviada con éxito!' });
            // Clear form on success
            setEvidenceForm({ instructorName: '', instructorEmail: '', courseName: '' });
            setEvidenceFiles([]);

        } catch (err) {
             const errorMessage = err instanceof Error ? err.message : "Hubo un error al enviar la evidencia.";
            setEvidenceStatus({ isSubmitting: false, error: errorMessage, success: null });
        }
    };

    const groupedCourses = courses.reduce((acc, course) => {
        const period = course.period || 'Sin Periodo';
        if (!acc[period]) {
            acc[period] = { courses: [], dates: '' };
        }
        acc[period].courses.push(course);
        if (!acc[period].dates && course.dates) {
            acc[period].dates = formatCourseDates(course.dates);
        }
        return acc;
    }, {} as { [key: string]: { courses: Course[], dates: string } });
    
    const renderProposalForm = () => (
         <React.Fragment>
            {proposalStatus.success ? (
                <div className="text-center py-8">
                     <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-8 rounded-md" role="alert">
                         <p>{proposalStatus.success}</p>
                     </div>
                     <button onClick={onBack} className="bg-indigo-600 text-white font-bold py-2 px-8 rounded-lg hover:bg-indigo-700 transition-colors">Salir</button>
                </div>
            ) : (
                 <form onSubmit={handleProposalSubmit} noValidate>
                    <div className="bg-blue-700 text-white p-4 rounded-lg mb-6 text-sm text-center">
                        <p>Es necesario que envíes el CVU y la ficha técnica en <strong>PDF genuinos, No Fotos.</strong> Puedes descargar las plantillas aquí.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <a href="https://raw.githubusercontent.com/DA-itd/DA-itd-web/main/TecNM-AC-PO-005-11%20CVU%20curriculum%20del%20instructor%20(1).doc" className="flex items-center p-3 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-colors" target="_blank" rel="noopener noreferrer" download>
                            <svg className="h-8 w-8 mr-4 flex-shrink-0 text-blue-600" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 2C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2H6Z" fill="#2962FF" /><path d="M14 2V8H20L14 2Z" fill="#E3F2FD" fillOpacity="0.7" /><path d="M8.5 16.5L10.5 12L12 16.5L13.5 12L15.5 16.5H14L13 14L12 16.5L11 14L10 16.5H8.5Z" fill="#FFFFFF" /></svg>
                            <div><span className="font-semibold text-indigo-700">CVU (TecNM-AC-PO-005-11)</span><span className="block text-xs text-gray-500">Descargar plantilla .doc</span></div>
                        </a> 
                        <a href="https://raw.githubusercontent.com/DA-itd/DA-itd-web/main/TecNM-AC-PO-005-12%20FICHA%20TECNICA%20(1).doc" className="flex items-center p-3 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-colors" target="_blank" rel="noopener noreferrer" download>
                             <svg className="h-8 w-8 mr-4 flex-shrink-0 text-blue-600" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 2C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2H6Z" fill="#2962FF" /><path d="M14 2V8H20L14 2Z" fill="#E3F2FD" fillOpacity="0.7" /><path d="M8.5 16.5L10.5 12L12 16.5L13.5 12L15.5 16.5H14L13 14L12 16.5L11 14L10 16.5H8.5Z" fill="#FFFFFF" /></svg>
                            <div><span className="font-semibold text-indigo-700">Ficha Técnica (TecNM-AC-PO-005-12)</span><span className="block text-xs text-gray-500">Descargar plantilla .doc</span></div>
                        </a>
                    </div>
                    {proposalStatus.error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md" role="alert"><p>{proposalStatus.error}</p></div>}
                    <div className="space-y-6">
                        <div>
                            <label htmlFor="proposalInstructorName" className="block text-sm font-medium text-gray-700">Nombre Completo del Instructor *</label>
                            <AutocompleteInput teachers={teachers} onSelect={handleProposalTeacherSelect} value={proposalForm.instructorName} onChange={(e) => setProposalForm(prev => ({ ...prev, instructorName: e.target.value.toUpperCase() }))} name="proposalInstructorName" placeholder="Escriba un nombre para buscar" required />
                        </div>
                        <div>
                             <label htmlFor="proposalInstructorEmail" className="block text-sm font-medium text-gray-700">Email del Instructor *</label>
                            <input id="proposalInstructorEmail" type="email" value={proposalForm.instructorEmail} onChange={(e) => setProposalForm(prev => ({ ...prev, instructorEmail: e.target.value.toLowerCase() }))} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="email@itdurango.edu.mx" required />
                        </div>
                        <div>
                            <fieldset>
                                <legend className="block text-sm font-medium text-gray-700 mb-4">Nombre del Curso a Ofrecer *</legend>
                                {Object.entries(groupedCourses).map(([period, data]) => (
                                    <div key={period} className="mb-8">
                                        <h4 className="text-md font-semibold text-gray-600 border-b pb-2 mb-4">{data.dates ? `${period.replace(/_/g, ' ')} | ${data.dates}` : period.replace(/_/g, ' ')}</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {data.courses.map(course => {
                                                const isSelected = proposalForm.courseName === course.name;
                                                const baseStyles = course.period === 'PERIODO_1' ? "border-t-4 border-teal-400 bg-teal-50" : "border-t-4 border-indigo-400 bg-indigo-50";
                                                const ringStyle = course.period === 'PERIODO_1' ? 'peer-checked:ring-teal-500' : 'peer-checked:ring-indigo-500';
                                                const textStyle = course.period === 'PERIODO_1' ? 'text-teal-800' : 'text-indigo-800';
                                                const courseId = `proposal-course-${course.id}`;

                                                return (
                                                    <div key={course.id} className="relative h-full">
                                                        <input 
                                                            type="radio"
                                                            id={courseId}
                                                            name="course-selection"
                                                            value={course.name}
                                                            checked={isSelected}
                                                            onChange={() => setProposalForm(prev => ({ ...prev, courseName: course.name }))}
                                                            className="sr-only peer"
                                                        />
                                                        <label htmlFor={courseId} className={`p-4 rounded-lg border border-gray-200 transition-all duration-200 flex flex-col justify-between h-full hover:shadow-md cursor-pointer ${baseStyles} peer-checked:ring-2 peer-checked:ring-offset-2 ${ringStyle}`}>
                                                            <h3 className={`font-bold text-sm mb-2 ${textStyle}`}>{course.name}</h3>
                                                            <div className="flex justify-end mt-3 h-5 w-5" aria-hidden="true">
                                                                <div className={`h-5 w-5 border-2 rounded-full flex items-center justify-center transition-colors ${isSelected ? 'border-indigo-600' : 'border-gray-400'}`}>
                                                                    {isSelected && <div className="h-2.5 w-2.5 bg-indigo-600 rounded-full"></div>}
                                                                </div>
                                                            </div>
                                                        </label>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </fieldset>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <FileInput id="cvuFile" label="Haz clic para subir tu CVU" onFileSelect={setCvuFile} onError={setCvuError} acceptedFile={cvuFile} acceptedTypes={['application/pdf']} maxSizeMB={1} />
                                {cvuError && <p className="text-red-500 text-xs mt-1">{cvuError}</p>}
                            </div>
                            <div>
                                <FileInput id="fichaFile" label="Haz clic para subir la Ficha Técnica" onFileSelect={setFichaFile} onError={setFichaError} acceptedFile={fichaFile} acceptedTypes={['application/pdf']} maxSizeMB={1} />
                                {fichaError && <p className="text-red-500 text-xs mt-1">{fichaError}</p>}
                            </div>
                        </div>
                    </div>
                    <div className="mt-8 flex justify-end">
                        <button type="submit" className="bg-indigo-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-indigo-700 flex items-center justify-center disabled:opacity-50" disabled={proposalStatus.isSubmitting}>
                            {proposalStatus.isSubmitting && <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                            {proposalStatus.isSubmitting ? 'Enviando...' : 'Enviar Propuesta'}
                        </button>
                    </div>
                 </form>
            )}
         </React.Fragment>
    );

    const renderEvidenceForm = () => {
        const MAX_TOTAL_FILES = 6;
        const MAX_TOTAL_SIZE_MB = 3;

        const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
            const newFiles = e.target.files ? Array.from(e.target.files) : [];
            if (!newFiles.length) return;

            setEvidenceError(null);

            if (evidenceFiles.length + newFiles.length > MAX_TOTAL_FILES) {
                setEvidenceError(`No puede subir más de ${MAX_TOTAL_FILES} archivos en total.`);
                return;
            }

            const MAX_TOTAL_SIZE_BYTES = MAX_TOTAL_SIZE_MB * 1024 * 1024;
            const existingSize = evidenceFiles.reduce((acc, file) => acc + file.size, 0);
            const newSize = newFiles.reduce((acc, file) => acc + file.size, 0);

            if (existingSize + newSize > MAX_TOTAL_SIZE_BYTES) {
                 setEvidenceError(`El tamaño total de los archivos no puede exceder los ${MAX_TOTAL_SIZE_MB} MB.`);
                return;
            }

            const validatedFiles: File[] = [];
            for (const file of newFiles) {
                const currentFile = file as File;
                const acceptedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
                
                if (!acceptedTypes.includes(currentFile.type)) {
                    setEvidenceError(`Tipo de archivo no válido: ${currentFile.name}. Solo se aceptan PDF, JPG, PNG.`);
                    return;
                }
                validatedFiles.push(currentFile);
            }

            setEvidenceFiles(prev => [...prev, ...validatedFiles]);
            e.target.value = '';
        };

        const handleRemoveFile = (indexToRemove: number) => {
            setEvidenceFiles(prev => prev.filter((_, index) => index !== indexToRemove));
        };

        return (
            <React.Fragment>
                {evidenceStatus.success && <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-md" role="alert"><p>{evidenceStatus.success}</p></div>}
                <form onSubmit={handleEvidenceSubmit} noValidate>
                    <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-800 p-4 rounded-lg mb-6 text-sm">
                        <p>En esta sección puede subir las evidencias (hasta {MAX_TOTAL_FILES} archivos) del curso que impartió. El tamaño total no debe exceder {MAX_TOTAL_SIZE_MB}MB.</p>
                    </div>

                    {evidenceStatus.error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md" role="alert"><p>{evidenceStatus.error}</p></div>}
                    
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Su Nombre Completo *</label>
                            <AutocompleteInput teachers={teachers} onSelect={handleEvidenceTeacherSelect} value={evidenceForm.instructorName} onChange={(e) => setEvidenceForm(prev => ({...prev, instructorName: e.target.value.toUpperCase()}))} name="evidenceInstructorName" placeholder="Escriba su nombre para buscar" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Su Email *</label>
                            <input type="email" value={evidenceForm.instructorEmail} onChange={(e) => setEvidenceForm(prev => ({...prev, instructorEmail: e.target.value.toLowerCase()}))} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="email@itdurango.edu.mx" required />
                        </div>
                        <div>
                            <fieldset>
                                <legend className="block text-sm font-medium text-gray-700 mb-4">Curso que Impartió *</legend>
                                {Object.entries(groupedCourses).map(([period, data]) => (
                                    <div key={period} className="mb-8">
                                        <h4 className="text-md font-semibold text-gray-600 border-b pb-2 mb-4">{data.dates ? `${period.replace(/_/g, ' ')} | ${data.dates}` : period.replace(/_/g, ' ')}</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {data.courses.map(course => {
                                                const isSelected = evidenceForm.courseName === course.name;
                                                const baseStyles = course.period === 'PERIODO_1' ? "border-t-4 border-teal-400 bg-teal-50" : "border-t-4 border-indigo-400 bg-indigo-50";
                                                const ringStyle = course.period === 'PERIODO_1' ? 'peer-checked:ring-teal-500' : 'peer-checked:ring-indigo-500';
                                                const textStyle = course.period === 'PERIODO_1' ? 'text-teal-800' : 'text-indigo-800';
                                                const courseId = `evidence-course-${course.id}`;

                                                return (
                                                    <div key={course.id} className="relative h-full">
                                                        <input 
                                                            type="radio"
                                                            id={courseId}
                                                            name="evidence-course-selection"
                                                            value={course.name}
                                                            checked={isSelected}
                                                            onChange={() => setEvidenceForm(prev => ({ ...prev, courseName: course.name }))}
                                                            className="sr-only peer"
                                                        />
                                                        <label htmlFor={courseId} className={`p-4 rounded-lg border border-gray-200 transition-all duration-200 flex flex-col justify-between h-full hover:shadow-md cursor-pointer ${baseStyles} peer-checked:ring-2 peer-checked:ring-offset-2 ${ringStyle}`}>
                                                            <h3 className={`font-bold text-sm mb-2 ${textStyle}`}>{course.name}</h3>
                                                            <div className="flex justify-end mt-3 h-5 w-5" aria-hidden="true">
                                                                <div className={`h-5 w-5 border-2 rounded-full flex items-center justify-center transition-colors ${isSelected ? 'border-indigo-600' : 'border-gray-400'}`}>
                                                                    {isSelected && <div className="h-2.5 w-2.5 bg-indigo-600 rounded-full"></div>}
                                                                </div>
                                                            </div>
                                                        </label>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </fieldset>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Archivos de Evidencia *</label>
                            <div className="mt-2">
                                <label
                                    htmlFor="evidence-files-input"
                                    className="relative flex justify-center w-full px-6 py-4 text-center bg-white border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:border-indigo-500 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                                >
                                    <div className="text-sm text-gray-600">
                                        <svg className="w-8 h-8 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M12 15l-3-3m0 0l3-3m-3 3h12"></path></svg>
                                        <span className="font-semibold text-indigo-600">Haga clic para subir</span> o arrastre y suelte
                                        <p className="text-xs text-gray-500">PDF, PNG, JPG. Total máx: {MAX_TOTAL_SIZE_MB}MB</p>
                                    </div>
                                    <input
                                        id="evidence-files-input"
                                        name="evidence-files-input"
                                        type="file"
                                        multiple
                                        className="sr-only"
                                        onChange={handleFileSelect}
                                        accept="application/pdf,image/png,image/jpeg"
                                    />
                                </label>
                            </div>
                            {evidenceError && <p className="mt-2 text-sm text-red-600">{evidenceError}</p>}

                             {evidenceFiles.length > 0 && (
                                <div className="mt-6">
                                    <h4 className="text-sm font-medium text-gray-700">
                                        Archivos para subir ({evidenceFiles.length}/{MAX_TOTAL_FILES})
                                    </h4>
                                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {evidenceFiles.map((file, index) => (
                                            <div key={index} className="relative p-3 border-2 border-dashed border-gray-300 rounded-lg flex items-center space-x-3 bg-gray-50">
                                                <svg className="flex-shrink-0 h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a3 3 0 003 3h4a3 3 0 003-3V7a3 3 0 00-3-3H8zM6 7a1 1 0 011-1h4a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h4a1 1 0 100-2H7z" clipRule="evenodd" /></svg>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                                                    <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveFile(index)}
                                                    className="absolute -top-2 -right-2 p-0.5 bg-white rounded-full text-gray-500 hover:text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500"
                                                >
                                                    <span className="sr-only">Quitar archivo</span>
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="mt-8 flex justify-end">
                        <button type="submit" className="bg-indigo-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-indigo-700 flex items-center justify-center disabled:opacity-50" disabled={evidenceStatus.isSubmitting}>
                            {evidenceStatus.isSubmitting && <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                            {evidenceStatus.isSubmitting ? 'Enviando...' : 'Enviar Evidencia'}
                        </button>
                    </div>
                </form>
            </React.Fragment>
        );
    };

    return (
        <div className="bg-white p-4 sm:p-8 rounded-lg shadow-md w-full max-w-4xl mx-auto">
             <button onClick={onBack} className="text-sm text-blue-600 hover:underline mb-4">&larr; Volver a Inscripción de Cursos</button>
             <h2 className="text-2xl font-bold mb-4 text-gray-800">Portal de Instructores</h2>
            
             <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-4" aria-label="Tabs" role="tablist">
                    <button
                        role="tab"
                        id="proposal-tab"
                        aria-selected={activeTab === 'proposal'}
                        aria-controls="proposal-panel"
                        onClick={() => setActiveTab('proposal')}
                        className={`px-6 py-3 font-semibold text-sm rounded-t-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-colors duration-200 ${
                            activeTab === 'proposal'
                                ? 'bg-white text-indigo-700 border-b-2 border-indigo-500'
                                : 'bg-transparent text-gray-500 hover:bg-gray-200 hover:text-gray-700'
                        }`}
                    >
                        Proponer Curso
                    </button>
                     <button
                        role="tab"
                        id="evidence-tab"
                        aria-selected={activeTab === 'evidence'}
                        aria-controls="evidence-panel"
                        onClick={() => setActiveTab('evidence')}
                        className={`px-6 py-3 font-semibold text-sm rounded-t-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-colors duration-200 ${
                            activeTab === 'evidence'
                                ? 'bg-white text-indigo-700 border-b-2 border-indigo-500'
                                : 'bg-transparent text-gray-500 hover:bg-gray-200 hover:text-gray-700'
                        }`}
                    >
                        Subir Evidencias
                    </button>
                </nav>
            </div>

            <div className="pt-6">
                <div id="proposal-panel" role="tabpanel" tabIndex={0} aria-labelledby="proposal-tab" hidden={activeTab !== 'proposal'}>
                    {renderProposalForm()}
                </div>
                 <div id="evidence-panel" role="tabpanel" tabIndex={0} aria-labelledby="evidence-tab" hidden={activeTab !== 'evidence'}>
                    {renderEvidenceForm()}
                </div>
            </div>
        </div>
    );
};

// =============================================================================
// == RENDER APPLICATION
// =============================================================================
const rootElement = document.getElementById('root');
if (rootElement) {
    // FIX: Use imported ReactDOM instead of window global.
    const root = ReactDOM.createRoot(rootElement);
    root.render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
} else {
    console.error('Failed to find the root element. The application cannot be mounted.');
}