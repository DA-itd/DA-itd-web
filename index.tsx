// =============================================================================
// SISTEMA DE INSCRIPCIÓN A CURSOS - INSTITUTO TECNOLÓGICO DE DURANGO
// Versión: 1.2.0 - CORREGIDO
// Última actualización: Enero 2024
// =============================================================================

// =============================================================================
// == DECLARACIÓN DE TIPOS GLOBALES
// =============================================================================

declare const React: any;
declare const ReactDOM: any;

declare global {
    interface Window {
        CONFIG?: {
            APPS_SCRIPT_URL?: string;
            APP_NAME?: string;
            INSTITUTION?: string;
            REQUEST_TIMEOUT?: number;
            MAX_COURSES_PER_STUDENT?: number;
            MIN_CURP_LENGTH?: number;
            MAX_CURP_LENGTH?: number;
        };
    }
}

// =============================================================================
// == INTERFACES Y TIPOS
// =============================================================================

interface IFormData {
    fullName: string;
    curp: string;
    email: string;
    gender: string;
    department: string;
    selectedCourses: Course[];
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

interface RegistrationResult {
    success: boolean;
    message: string;
    courseName?: string;
    registrationId?: string;
    folio?: string;
    dates?: string;
}

// =============================================================================
// == CONSTANTES Y CONFIGURACIÓN
// =============================================================================

const COURSES_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSAe4dmVN4CArjEy_lvI5qrXf16naxZLO1lAxGm2Pj4TrdnoebBg03Vv4-DCXciAkHJFiZaBMKletUs/pub?gid=0&single=true&output=csv';
const TEACHERS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSAe4dmVN4CArjEy_lvI5qrXf16naxZLO1lAxGm2Pj4TrdnoebBg03Vv4-DCXciAkHJFiZaBMKletUs/pub?gid=987931491&single=true&output=csv';

// AGREGADO: Regex para validación de CURP
const CURP_REGEX = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[0-9A-Z]\d$/;

const MOCK_DEPARTMENTS = [
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

// =============================================================================
// == FUNCIONES DE UTILIDAD CSV
// =============================================================================

const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current.trim());
    return result;
};

const cleanCSVValue = (val: string): string => {
    let cleaned = val.trim();
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
        cleaned = cleaned.substring(1, cleaned.length - 1).replace(/""/g, '"');
    }
    return cleaned;
};

// =============================================================================
// == API SERVICE
// =============================================================================

const getTeachers = async (): Promise<Teacher[]> => {
    try {
        const response = await fetch(`${TEACHERS_CSV_URL}&_=${Date.now()}`);
        if (!response.ok) throw new Error('Error al cargar docentes');
        
        const csvText = await response.text();
        const lines = csvText.trim().split(/\r?\n/);
        
        return lines.slice(1)
            .filter(line => line.trim())
            .map(line => {
                const values = parseCSVLine(line);
                if (values.length < 3) return null;
                return {
                    nombreCompleto: cleanCSVValue(values[0]),
                    curp: cleanCSVValue(values[1]),
                    email: cleanCSVValue(values[2])
                };
            })
            .filter((teacher): teacher is Teacher => teacher !== null);
    } catch (error) {
        console.error("Error al obtener docentes:", error);
        return [];
    }
};

const getCourses = async (): Promise<Course[]> => {
    try {
        const response = await fetch(`${COURSES_CSV_URL}&_=${Date.now()}`);
        if (!response.ok) throw new Error('Error al cargar cursos');
        
        const csvText = await response.text();
        const lines = csvText.trim().split(/\r?\n/);
        
        return lines.slice(1)
            .filter(line => line.trim())
            .map(line => {
                const values = parseCSVLine(line);
                if (values.length < 8) return null;
                
                const hours = parseInt(cleanCSVValue(values[4]), 10);
                
                return {
                    id: cleanCSVValue(values[0]),
                    name: cleanCSVValue(values[1]),
                    dates: cleanCSVValue(values[2]),
                    period: cleanCSVValue(values[3]),
                    hours: isNaN(hours) ? 30 : hours,
                    location: cleanCSVValue(values[5]),
                    schedule: cleanCSVValue(values[6]),
                    type: cleanCSVValue(values[7])
                };
            })
            .filter((course): course is Course => course !== null);
    } catch (error) {
        console.error("Error al obtener cursos:", error);
        return [];
    }
};

const getDepartments = (): Promise<string[]> => {
    return Promise.resolve(MOCK_DEPARTMENTS);
};

const getRegistrationByCurp = async (curp: string): Promise<string[]> => {
    const APPS_SCRIPT_URL = window.CONFIG?.APPS_SCRIPT_URL;
    if (!APPS_SCRIPT_URL) throw new Error("URL no configurada");
    
    try {
        const url = new URL(APPS_SCRIPT_URL);
        url.searchParams.append('action', 'lookupByCurp');
        url.searchParams.append('curp', curp.toUpperCase());
        url.searchParams.append('_', Date.now().toString());
        
        const response = await fetch(url.toString(), { method: 'GET', mode: 'cors' });
        const result = await response.json();

        if (result?.success && result.data?.registeredCourses) {
            return result.data.registeredCourses;
        }
        return [];
    } catch (error) {
        console.error("Error al buscar CURP:", error);
        return [];
    }
};

// CORREGIDO: Mejor manejo de errores del backend
const submitRegistration = async (submission: any): Promise<any> => {
    const APPS_SCRIPT_URL = window.CONFIG?.APPS_SCRIPT_URL;
    if (!APPS_SCRIPT_URL) throw new Error("URL de configuración no disponible");

    try {
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            mode: 'cors',
            redirect: 'follow',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(submission)
        });

        const result = await response.json();
        if (result?.success) {
            return result.data;
        } else {
            // Propagar el mensaje de error del backend
            throw new Error(result.message || 'Error en el servidor');
        }
    } catch (error) {
        console.error("Error al enviar registro:", error);
        
        // Si ya es un error con mensaje del backend, propagarlo
        if (error instanceof Error && error.message !== 'Failed to fetch') {
            throw error;
        }
        
        // Solo mostrar mensaje genérico para errores de red
        throw new Error(
            "No se pudo comunicar con el servidor.\n\n" +
            "Posibles causas:\n" +
            "1. URL del script incorrecta\n" +
            "2. Script sin permisos públicos\n" +
            "3. Problema de conexión"
        );
    }
};

const cancelSingleCourse = async (payload: any) => {
    const APPS_SCRIPT_URL = window.CONFIG?.APPS_SCRIPT_URL;
    if (!APPS_SCRIPT_URL) throw new Error("URL no disponible");

    try {
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            mode: 'cors',
            redirect: 'follow',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ ...payload, action: 'cancelSingle' })
        });

        const result = await response.json();
        if (!result?.success) {
            throw new Error(result.message || 'Error al cancelar');
        }
    } catch (error) {
        throw new Error("No se pudo cancelar el curso.");
    }
};

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

const submitInstructorProposal = async (data: any) => {
    const APPS_SCRIPT_URL = window.CONFIG?.APPS_SCRIPT_URL;
    if (!APPS_SCRIPT_URL) throw new Error("URL no disponible");
    
    try {
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            mode: 'cors',
            redirect: 'follow',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'submitInstructorProposal', ...data })
        });

        const result = await response.json();
        if (result?.success) {
            return result;
        } else {
            throw new Error(result.message || 'Error al enviar propuesta');
        }
    } catch (error) {
        throw new Error("No se pudo enviar la propuesta.");
    }
};

const submitEvidence = async (data: any) => {
    const APPS_SCRIPT_URL = window.CONFIG?.APPS_SCRIPT_URL;
    if (!APPS_SCRIPT_URL) throw new Error("URL no disponible");
    
    try {
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            mode: 'cors',
            redirect: 'follow',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'submitInstructorEvidence', ...data })
        });

        const result = await response.json();
        if (result?.success) {
            return result;
        } else {
            throw new Error(result.message || 'Error al enviar evidencia');
        }
    } catch (error) {
        throw new Error("No se pudo enviar la evidencia.");
    }
};

// =============================================================================
// == COMPONENTE PRINCIPAL APP
// =============================================================================

const App = () => {
    const { useState, useEffect } = React;
    
    const [currentStep, setCurrentStep] = useState(1);
    const [mode, setMode] = useState('student');
    const [formData, setFormData] = useState<IFormData>({
        fullName: '',
        curp: '',
        email: '',
        gender: 'Mujer',
        department: '',
        selectedCourses: [],
    });
    
    const [allCourses, setAllCourses] = useState<Course[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [departments, setDepartments] = useState<string[]>([]);
    const [selectedCourses, setSelectedCourses] = useState<Course[]>([]);
    const [originalSelectedCourses, setOriginalSelectedCourses] = useState<Course[]>([]);
    const [registrationResult, setRegistrationResult] = useState<RegistrationResult[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [submissionType, setSubmissionType] = useState<'enrollment' | 'cancellation'>('enrollment');
    const [emailSent, setEmailSent] = useState<boolean>(true);
    const [emailError, setEmailError] = useState<string | null>(null);

    useEffect(() => {
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
                setError("No se pudieron cargar los datos.");
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
        if (step > 0 && step <= studentSteps.length) setCurrentStep(step);
    };

    const handleStepClick = (stepIndex: number) => {
        const instructorStepIndex = studentSteps.length;
        if (stepIndex === instructorStepIndex) {
            setMode('instructor');
            setCurrentStep(5);
        } else if (stepIndex < currentStep - 1) {
            setMode('student');
            setCurrentStep(stepIndex + 1);
        }
    };
    
    const handleBackToStudentForm = () => {
        setMode('student');
        setCurrentStep(1);
    };

    const handleSubmit = async () => {
        setError(null);
        try {
            const isCancellation = selectedCourses.length === 0 && originalSelectedCourses.length > 0;
            setSubmissionType(isCancellation ? 'cancellation' : 'enrollment');

            const submissionData = {
                action: 'enrollStudent',
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
            const registrationResultsArray = result.results || [];

            const augmentedResult = registrationResultsArray.map((reg: any) => {
                const courseDetails = selectedCourses.find(c => c.id === reg.registrationId);
                return {
                    ...reg,
                    dates: courseDetails ? courseDetails.dates : 'Fechas no disponibles'
                };
            });
            
            setRegistrationResult(augmentedResult);
            setEmailSent(result.emailSent !== false);
            setEmailError(result.emailError);
            
            handleNext();

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Error desconocido";
            setError(errorMessage);
            setCurrentStep(3);
        }
    };
    
    const renderContent = () => {
        if (isLoading) {
            return React.createElement('div', { className: 'flex justify-center items-center h-64' },
                React.createElement('div', { className: 'animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-rose-800' })
            );
        }
        
        if (error && currentStep !== 3) {
            return React.createElement('div', { 
                className: 'bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mx-auto max-w-4xl', 
                role: 'alert' 
            },
                React.createElement('p', { className: 'font-bold' }, 'Error Crítico'),
                React.createElement('p', null, error)
            );
        }
        
        if (mode === 'instructor') {
            return React.createElement(InstructorForm, {
                onBack: handleBackToStudentForm,
                teachers: teachers,
                courses: allCourses
            });
        }

        switch (currentStep) {
            case 1:
                return React.createElement(Step1PersonalInfo, {
                    formData, setFormData, departments, teachers, allCourses,
                    setSelectedCourses, setOriginalSelectedCourses, onNext: handleNext, onGoToStep: goToStep
                });
            case 2:
                // MODIFICADO: Pasar originalSelectedCourses
                return React.createElement(Step2CourseSelection, {
                    courses: allCourses, 
                    selectedCourses, 
                    setSelectedCourses, 
                    originalSelectedCourses,
                    onNext: handleNext, 
                    onBack: handleBack
                });
            case 3:
                return React.createElement(Step3Confirmation, {
                    formData, courses: selectedCourses, originalCourses: originalSelectedCourses,
                    onBack: handleBack, onSubmit: handleSubmit
                });
            case 4:
                return React.createElement(Step4Success, {
                    registrationResult, applicantName: formData.fullName, selectedCourses, submissionType,
                    emailSent, emailError
                });
            default:
                return React.createElement('div', null, 'Paso desconocido');
        }
    };

    return React.createElement('div', { className: 'flex flex-col min-h-screen bg-gray-100' },
        React.createElement(Header),
        React.createElement('main', { className: 'flex-grow' },
            React.createElement(Stepper, { currentStep, steps: allSteps, mode, onStepClick: handleStepClick }),
            React.createElement('div', { className: 'container mx-auto px-4 sm:px-6 lg:px-8 pb-8' },
                error && currentStep === 3 && React.createElement('div', {
                    className: 'bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md w-full max-w-4xl mx-auto',
                    role: 'alert'
                },
                    React.createElement('p', { className: 'font-bold' }, 'Error al Enviar'),
                    React.createElement('p', { className: 'whitespace-pre-wrap' }, error)
                ),
                renderContent()
            )
        ),
        React.createElement(Footer)
    );
};

// =============================================================================
// == COMPONENTES UI - HEADER Y FOOTER
// =============================================================================

const Header = () => {
    return React.createElement('header', { className: 'bg-white shadow-md' },
        React.createElement('div', { className: 'container mx-auto px-4 sm:px-6 lg:px-8' },
            React.createElement('div', { className: 'flex items-center justify-between gap-4 py-4 min-h-[100px]' },
                React.createElement('div', { className: 'flex-shrink-0' },
                    React.createElement('img', {
                        className: 'h-16 md:h-20 lg:h-24',
                        src: 'https://raw.githubusercontent.com/DA-itd/web/main/TecNM_logo.jpg',
                        alt: 'Logo TecNM'
                    })
                ),
                React.createElement('div', { className: 'text-center flex-1 px-2' },
                    React.createElement('h1', { className: 'text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-blue-900' },
                        'SISTEMA DE INSCRIPCIÓN A CURSOS DE ACTUALIZACIÓN DOCENTE'
                    ),
                    React.createElement('h2', { className: 'text-sm sm:text-base md:text-lg text-blue-900 mt-1' },
                        'INSTITUTO TECNOLÓGICO DE DURANGO'
                    )
                ),
                React.createElement('div', { className: 'flex-shrink-0' },
                    React.createElement('img', {
                        className: 'h-16 md:h-20 lg:h-24',
                        src: 'https://raw.githubusercontent.com/DA-itd/web/main/logo_itdurango.png',
                        alt: 'Logo Instituto Tecnológico de Durango'
                    })
                )
            )
        )
    );
};

const Footer = () => {
    return React.createElement('footer', { className: 'bg-blue-800 text-white text-center p-4 mt-auto' },
        React.createElement('p', { className: 'font-semibold text-sm sm:text-base' },
            '© Coordinación de actualización docente - M.C. Alejandro Calderón Rentería.'
        ),
        React.createElement('p', { className: 'text-xs sm:text-sm' }, 'Todos los derechos reservados 2026.')
    );
};

// =============================================================================
// == COMPONENTE STEPPER (OPTIMIZADO PARA MÓVILES)
// =============================================================================

interface StepperProps {
    currentStep: number;
    steps: string[];
    mode: string;
    onStepClick: (index: number) => void;
}

const Stepper = ({ currentStep, steps, mode, onStepClick }: StepperProps) => {
    const instructorStepIndex = 4;

    return React.createElement('div', { className: 'w-full max-w-5xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8' },
        React.createElement('div', { className: 'flex items-start overflow-x-auto pb-2' },
            steps.map((step, index) => {
                const isStudentStep = index < instructorStepIndex;
                const isInstructorStep = index === instructorStepIndex;
                const isCompleted = isStudentStep && mode === 'student' && index < currentStep - 1;
                const isActive = (isStudentStep && mode === 'student' && index === currentStep - 1) || 
                                (isInstructorStep && mode === 'instructor');
                const isClickable = (isStudentStep && isCompleted) || isInstructorStep;

                return React.createElement(React.Fragment, { key: index },
                    React.createElement('button', {
                        type: 'button',
                        onClick: () => onStepClick(index),
                        disabled: !isClickable && !isActive,
                        'aria-current': isActive ? 'step' : undefined,
                        className: `flex flex-col items-center text-center group disabled:cursor-not-allowed ${isInstructorStep ? 'w-1/5 min-w-[80px]' : 'w-1/4 min-w-[70px]'}`
                    },
                        React.createElement('div', { className: 'relative flex items-center justify-center' },
                            React.createElement('div', {
                                className: `w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center z-10 rounded-full font-semibold text-white text-sm sm:text-base transition-colors duration-300 ${
                                    isInstructorStep 
                                        ? (isActive ? 'bg-indigo-600 ring-4 ring-indigo-300' : 'bg-gray-400 group-hover:bg-gray-500') 
                                        : (isCompleted ? 'bg-rose-800 group-hover:bg-rose-900' : (isActive ? 'bg-rose-800' : 'bg-gray-300'))
                                } group-disabled:bg-gray-300`
                            }, index + 1),
                            index < steps.length - 1 && React.createElement('div', {
                                className: `absolute w-full top-1/2 -translate-y-1/2 left-1/2 h-1 ${isCompleted ? 'bg-rose-800' : 'bg-gray-300'}`
                            })
                        ),
                        React.createElement('div', { className: 'mt-2' },
                            React.createElement('p', {
                                className: `text-xs sm:text-sm font-medium transition-colors duration-300 ${
                                    isInstructorStep 
                                        ? (isActive ? 'text-indigo-700' : 'text-gray-600 group-hover:text-gray-800') 
                                        : (isCompleted || isActive ? 'text-rose-800' : 'text-gray-500')
                                } group-disabled:text-gray-500`
                            }, step)
                        )
                    )
                );
            })
        )
    );
};

// =============================================================================
// == MODAL DE REGISTRO EXISTENTE
// =============================================================================

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
    const { useEffect } = React;
    
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
           if (event.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEsc);
        }
        return () => {
            window.removeEventListener('keydown', handleEsc);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return React.createElement('div', {
        className: 'fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4'
    },
        React.createElement('div', {
            role: 'dialog',
            'aria-modal': 'true',
            className: 'relative mx-auto p-6 sm:p-8 border w-full max-w-lg shadow-lg rounded-md bg-white'
        },
            React.createElement('h3', { className: 'text-xl sm:text-2xl font-bold text-gray-800' }, 
                'Ya Tienes un Registro Activo'
            ),
            React.createElement('div', { className: 'mt-4' },
                React.createElement('p', { className: 'text-sm sm:text-base text-gray-600' },
                    'Hemos detectado que ya estás inscrito en los siguientes cursos. ¿Qué te gustaría hacer?'
                ),
                React.createElement('div', { className: 'mt-4 space-y-2 bg-gray-50 p-4 rounded-md border' },
                    courses.length > 0 ? courses.map(course =>
                        React.createElement('div', {
                            key: course.id,
                            className: 'flex items-center justify-between py-1 gap-2'
                        },
                            React.createElement('span', { className: 'font-semibold text-sm sm:text-base text-gray-700 flex-1 pr-2' }, 
                                course.name
                            ),
                            React.createElement('button', {
                                onClick: () => onDeleteCourse(course.id),
                                disabled: !!deletingCourseId,
                                className: 'p-2 rounded-full text-gray-500 hover:bg-red-100 hover:text-red-700 transition-colors disabled:opacity-50 flex-shrink-0',
                                'aria-label': `Eliminar curso ${course.name}`
                            },
                                deletingCourseId === course.id ? '⏳' : '🗑️'
                            )
                        )
                    ) : React.createElement('p', { className: 'text-gray-500 italic text-sm' }, 
                        'No tiene cursos registrados.'
                    )
                ),
                React.createElement('p', { className: 'text-sm sm:text-base text-gray-600 mt-6' },
                    'Puede modificar su selección o cancelar toda su inscripción.'
                )
            ),
            React.createElement('div', { className: 'mt-8 flex flex-col sm:flex-row-reverse gap-3' },
                React.createElement('button', {
                    onClick: onModify,
                    className: 'w-full sm:w-auto bg-rose-800 text-white font-bold py-2 px-6 rounded-lg hover:bg-rose-900'
                }, 'Modificar Selección'),
                React.createElement('button', {
                    onClick: onCancelAll,
                    className: 'w-full sm:w-auto bg-red-700 text-white font-bold py-2 px-6 rounded-lg hover:bg-red-800'
                }, 'Cancelar Inscripción'),
                React.createElement('button', {
                    onClick: onClose,
                    className: 'w-full sm:w-auto bg-gray-200 text-gray-800 font-bold py-2 px-6 rounded-lg hover:bg-gray-300'
                }, 'Cerrar')
            )
        )
    );
};

// =============================================================================
// == COMPONENTE AUTOCOMPLETE
// =============================================================================

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
    const { useState, useEffect, useRef } = React;
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
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const currentValue = e.target.value;
        onChange(e);

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

    return React.createElement('div', { className: 'relative', ref: containerRef },
        React.createElement('input', {
            type: 'text',
            name: name,
            value: value,
            onChange: handleInputChange,
            onFocus: (e: React.FocusEvent<HTMLInputElement>) => {
                const val = e.target.value;
                if (val) {
                    const filtered = teachers.filter(t =>
                        t.nombreCompleto.toLowerCase().includes(val.toLowerCase())
                    ).slice(0, 5);
                    setSuggestions(filtered);
                    setShowSuggestions(filtered.length > 0);
                }
            },
            placeholder: placeholder || "Escriba su nombre",
            className: 'mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base',
            required: required,
            autoComplete: 'off'
        }),
        showSuggestions && suggestions.length > 0 && React.createElement('ul', {
            className: 'absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-60 overflow-auto'
        },
            suggestions.map((teacher) =>
                React.createElement('li', {
                    key: teacher.curp || teacher.nombreCompleto,
                    onMouseDown: (e: React.MouseEvent) => {
                        e.preventDefault();
                        handleSelect(teacher);
                    },
                    className: 'px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm sm:text-base'
                }, teacher.nombreCompleto)
            )
        )
    );
};

// =============================================================================
// == STEP 1: INFORMACIÓN PERSONAL
// =============================================================================

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
    const { useState, useEffect, useRef } = React;
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [isCheckingCurp, setIsCheckingCurp] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [existingCourses, setExistingCourses] = useState<Course[]>([]);
    const [deletingCourseId, setDeletingCourseId] = useState<string | null>(null);
    const lastCheckedCurp = useRef('');

    useEffect(() => {
        const checkForRegistration = async () => {
            setIsCheckingCurp(true);
            try {
                const registeredCourseIds = await getRegistrationByCurp(formData.curp);
                if (formData.curp === lastCheckedCurp.current) {
                    if (registeredCourseIds.length > 0) {
                        const preSelectedCourses = allCourses.filter(c => registeredCourseIds.includes(c.id));
                        if (preSelectedCourses.length > 0) {
                            setExistingCourses(preSelectedCourses);
                            setOriginalSelectedCourses(preSelectedCourses);
                            setIsModalOpen(true);
                        }
                    } else {
                        setExistingCourses([]);
                        setOriginalSelectedCourses([]);
                        setIsModalOpen(false);
                    }
                }
            } catch (error) {
                console.error("Error al verificar registro:", error);
            } finally {
                if (formData.curp === lastCheckedCurp.current) {
                    setIsCheckingCurp(false);
                }
            }
        };

        if (formData.curp.length === 18 && lastCheckedCurp.current !== formData.curp) {
            lastCheckedCurp.current = formData.curp;
            checkForRegistration();
        } else if (formData.curp.length !== 18) {
            lastCheckedCurp.current = '';
            setIsModalOpen(false);
        }
    }, [formData.curp, allCourses, setOriginalSelectedCourses]);

    const handleCloseModal = () => setIsModalOpen(false);
    const handleModifyRegistration = () => {
        setSelectedCourses(existingCourses);
        setOriginalSelectedCourses(existingCourses);
        setIsModalOpen(false);
        onNext();
    };
    const handleCancelAllRegistration = () => {
        setSelectedCourses([]);
        setOriginalSelectedCourses(existingCourses);
        setIsModalOpen(false);
        onGoToStep(3);
    };
    
    const handleDeleteCourse = async (courseIdToDelete: string) => {
        setDeletingCourseId(courseIdToDelete);
        try {
            const courseToDelete = existingCourses.find(c => c.id === courseIdToDelete);
            if (!courseToDelete) throw new Error("Curso no encontrado");
            
            await cancelSingleCourse({
                curp: formData.curp,
                email: formData.email,
                fullName: formData.fullName,
                courseToCancel: { id: courseToDelete.id, name: courseToDelete.name }
            });

            const updatedCourses = existingCourses.filter(c => c.id !== courseIdToDelete);
            setExistingCourses(updatedCourses);
            setOriginalSelectedCourses(updatedCourses);

            if (updatedCourses.length === 0) setIsModalOpen(false);
        } catch (error) {
            alert(`Error: ${error instanceof Error ? error.message : "Error al eliminar"}`);
        } finally {
            setDeletingCourseId(null);
        }
    };
    
    // CORREGIDO: Validación de CURP con regex
    const validate = () => {
        const newErrors: { [key: string]: string } = {};
        
        if (!formData.fullName) {
            newErrors.fullName = "Campo obligatorio";
        }
        
        if (!formData.curp) {
            newErrors.curp = "Campo obligatorio";
        } else if (formData.curp.length !== 18) {
            newErrors.curp = "CURP debe tener 18 caracteres";
        } else if (!CURP_REGEX.test(formData.curp.toUpperCase())) {
            newErrors.curp = "CURP inválido (formato incorrecto)";
        }
        
        if (!formData.email) {
            newErrors.email = "Campo obligatorio";
        } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
            newErrors.email = "Email inválido";
        }
        
        if (!formData.department) {
            newErrors.department = "Campo obligatorio";
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) onNext();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        let finalValue = value;

        if (name === 'email') finalValue = value.toLowerCase();
        else if (name === 'curp' || name === 'fullName') finalValue = value.toUpperCase();

        setFormData(prev => {
            const newState = { ...prev, [name]: finalValue };
            if (name === 'curp' && finalValue.length >= 11) {
                const genderChar = finalValue.charAt(10).toUpperCase();
                if (genderChar === 'H') newState.gender = 'Hombre';
                else if (genderChar === 'M') newState.gender = 'Mujer';
            }
            return newState;
        });
    };

    const handleTeacherSelect = (teacher: Teacher) => {
        const { nombreCompleto, curp, email } = teacher;
        const upperCurp = (curp || '').toUpperCase();
        
        let inferredGender = 'Mujer';
        if (upperCurp.length >= 11) {
            const genderChar = upperCurp.charAt(10).toUpperCase();
            if (genderChar === 'H') inferredGender = 'Hombre';
            else if (genderChar === 'M') inferredGender = 'Mujer';
            else inferredGender = 'Otro';
        }

        setFormData(prev => ({
            ...prev,
            fullName: (nombreCompleto || '').toUpperCase(),
            curp: upperCurp,
            email: (email || '').toLowerCase(),
            gender: inferredGender,
        }));
    };

    return React.createElement(React.Fragment, null,
        React.createElement(ExistingRegistrationModal, {
            isOpen: isModalOpen,
            courses: existingCourses,
            onModify: handleModifyRegistration,
            onClose: handleCloseModal,
            onDeleteCourse: handleDeleteCourse,
            deletingCourseId: deletingCourseId,
            onCancelAll: handleCancelAllRegistration
        }),
        React.createElement('div', { className: 'bg-white p-4 sm:p-6 lg:p-8 rounded-lg shadow-md w-full max-w-4xl mx-auto' },
            React.createElement('h2', { className: 'text-xl sm:text-2xl font-bold mb-6 text-gray-800' }, 
                'Información Personal'
            ),
            React.createElement('form', { onSubmit: handleSubmit, noValidate: true },
                React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6' },
                    React.createElement('div', null,
                        React.createElement('label', { className: 'block text-sm font-medium text-gray-700' }, 
                            'Nombre Completo *'
                        ),
                        React.createElement(AutocompleteInput, {
                            teachers, onSelect: handleTeacherSelect, value: formData.fullName,
                            onChange: handleChange, name: 'fullName', required: true
                        }),
                        errors.fullName && React.createElement('p', { className: 'text-red-500 text-xs mt-1' }, 
                            errors.fullName
                        )
                    ),
                    React.createElement('div', null,
                        React.createElement('label', { className: 'block text-sm font-medium text-gray-700' }, 
                            'CURP *'
                        ),
                        React.createElement('div', { className: 'relative' },
                            React.createElement('input', {
                                type: 'text', name: 'curp', value: formData.curp, onChange: handleChange,
                                className: 'mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base',
                                placeholder: '18 caracteres', maxLength: 18, required: true
                            }),
                            isCheckingCurp && React.createElement('div', {
                                className: 'absolute inset-y-0 right-0 flex items-center pr-3'
                            },
                                React.createElement('div', { className: 'animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900' })
                            )
                        ),
                        errors.curp && React.createElement('p', { className: 'text-red-500 text-xs mt-1' }, 
                            errors.curp
                        )
                    ),
                    React.createElement('div', null,
                        React.createElement('label', { className: 'block text-sm font-medium text-gray-700' }, 
                            'Email Institucional *'
                        ),
                        React.createElement('input', {
                            type: 'email', name: 'email', value: formData.email, onChange: handleChange,
                            className: 'mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base',
                            placeholder: 'email@itdurango.edu.mx', required: true
                        }),
                        errors.email && React.createElement('p', { className: 'text-red-500 text-xs mt-1' }, 
                            errors.email
                        )
                    ),
                    React.createElement('div', null,
                        React.createElement('label', { className: 'block text-sm font-medium text-gray-700' }, 
                            'Género *'
                        ),
                        React.createElement('select', {
                            name: 'gender', value: formData.gender, onChange: handleChange,
                            className: 'mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base',
                            required: true
                        },
                            React.createElement('option', null, 'Mujer'),
                            React.createElement('option', null, 'Hombre'),
                            React.createElement('option', null, 'Otro')
                        )
                    ),
                    React.createElement('div', { className: 'md:col-span-2' },
                        React.createElement('label', { className: 'block text-sm font-medium text-gray-700' }, 
                            'Departamento *'
                        ),
                        React.createElement('select', {
                            name: 'department', value: formData.department, onChange: handleChange,
                            className: 'mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base',
                            required: true
                        },
                            React.createElement('option', { value: '' }, 'Seleccione un departamento'),
                            departments.map(dep => React.createElement('option', { key: dep, value: dep }, dep))
                        ),
                        errors.department && React.createElement('p', { className: 'text-red-500 text-xs mt-1' }, 
                            errors.department
                        )
                    )
                ),
                React.createElement('div', { className: 'mt-8 flex justify-end' },
                    React.createElement('button', {
                        type: 'submit',
                        className: 'w-full sm:w-auto bg-rose-800 text-white font-bold py-2 px-6 rounded-lg hover:bg-rose-900'
                    }, 'Continuar')
                )
            )
        )
    );
};

// =============================================================================
// == STEP 2: SELECCIÓN DE CURSOS
// =============================================================================

interface Step2CourseSelectionProps {
    courses: Course[];
    selectedCourses: Course[];
    setSelectedCourses: React.Dispatch<React.SetStateAction<Course[]>>;
    originalSelectedCourses: Course[]; // AGREGADO
    onNext: () => void;
    onBack: () => void;
}

const Step2CourseSelection = ({ courses, selectedCourses, setSelectedCourses, originalSelectedCourses, onNext, onBack }: Step2CourseSelectionProps) => {
    const { useState } = React;
    const [error, setError] = useState<string | null>(null);

    const schedulesOverlap = (course1: Course, course2: Course) => {
        if (!course1.dates || !course2.dates || course1.dates !== course2.dates) return false;
        if (!course1.schedule || !course2.schedule) return false;

        const parseTime = (schedule: string) => {
            const matches = schedule.match(/(\d{1,2}:\d{2})/g);
            if (!matches || matches.length < 2) return null;
            return [
                parseInt(matches[0].replace(':', ''), 10),
                parseInt(matches[1].replace(':', ''), 10)
            ];
        };

        const time1 = parseTime(course1.schedule);
        const time2 = parseTime(course2.schedule);
        if (!time1 || !time2) return false;

        return time1[0] < time2[1] && time2[0] < time1[1];
    };

    const handleSelectCourse = (course: Course) => {
        const isSelected = selectedCourses.some(c => c.id === course.id);
        let newSelection = [...selectedCourses];
        setError(null);

        if (isSelected) {
            newSelection = newSelection.filter(c => c.id !== course.id);
        } else {
            if (selectedCourses.length >= 3) {
                setError("No puede seleccionar más de 3 cursos");
                return;
            }
            if (selectedCourses.some(selected => schedulesOverlap(selected, course))) {
                setError("Horario se solapa con otra selección");
                return;
            }
            newSelection.push(course);
        }
        
        setSelectedCourses(newSelection);
    };

    // CORREGIDO: Permitir cancelación total
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const isTotalCancellation = selectedCourses.length === 0 && 
                                   originalSelectedCourses && 
                                   originalSelectedCourses.length > 0;
        
        if (selectedCourses.length > 0 || isTotalCancellation) {
            onNext();
        } else {
            setError("Debe seleccionar al menos un curso o confirmar la cancelación total");
        }
    };

    return React.createElement('div', { className: 'bg-white p-4 sm:p-6 lg:p-8 rounded-lg shadow-md w-full max-w-4xl mx-auto' },
        React.createElement('h2', { className: 'text-xl sm:text-2xl font-bold mb-2 text-gray-800' }, 
            'Selección de Cursos'
        ),
        React.createElement('p', { className: 'text-sm sm:text-base text-gray-600 mb-6' }, 
            'Seleccione hasta 3 cursos. No puede seleccionar cursos con horarios que se solapen.'
        ),
        React.createElement('div', { className: 'bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-4 mb-6 rounded-md' },
            React.createElement('p', { className: 'font-bold text-sm sm:text-base' }, 
                `Cursos seleccionados: ${selectedCourses.length} / 3`
            )
        ),
        error && React.createElement('div', { 
            className: 'bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md', 
            role: 'alert' 
        },
            React.createElement('p', { className: 'text-sm sm:text-base' }, error)
        ),
        React.createElement('div', { className: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' },
            courses.map(course => {
                const isSelected = selectedCourses.some(c => c.id === course.id);
                const hasConflict = !isSelected && selectedCourses.some(selected => schedulesOverlap(selected, course));
                const hasReachedMax = !isSelected && selectedCourses.length >= 3;
                const isDisabled = hasConflict || hasReachedMax;

                const basePeriodStyles = course.period === 'PERIODO_1' 
                    ? 'border-t-4 border-teal-400 bg-teal-50 hover:shadow-md' 
                    : 'border-t-4 border-indigo-400 bg-indigo-50 hover:shadow-md';
                const selectedRing = course.period === 'PERIODO_1' 
                    ? 'peer-checked:ring-teal-500' 
                    : 'peer-checked:ring-indigo-500';
                const textColor = course.period === 'PERIODO_1' ? 'text-teal-800' : 'text-indigo-800';

                return React.createElement('div', { key: course.id, className: 'relative h-full' },
                    React.createElement('input', {
                        type: 'checkbox',
                        id: `course-${course.id}`,
                        checked: isSelected,
                        disabled: isDisabled,
                        onChange: () => handleSelectCourse(course),
                        className: 'sr-only peer'
                    }),
                    React.createElement('label', {
                        htmlFor: `course-${course.id}`,
                        className: `p-3 sm:p-4 rounded-lg border border-gray-200 transition-all duration-200 flex flex-col justify-between h-full ${basePeriodStyles} peer-disabled:opacity-60 peer-disabled:cursor-not-allowed peer-checked:ring-2 peer-checked:ring-offset-2 ${selectedRing} cursor-pointer`
                    },
                        React.createElement('div', null,
                            React.createElement('h3', { className: `font-bold text-xs sm:text-sm mb-2 ${textColor}` }, 
                                course.name
                            ),
                            React.createElement('div', { className: 'text-xs text-gray-600 space-y-1' },
                                React.createElement('p', null, React.createElement('strong', null, 'Fechas: '), course.dates),
                                React.createElement('p', null, React.createElement('strong', null, 'Horario: '), course.schedule),
                                React.createElement('p', null, React.createElement('strong', null, 'Lugar: '), course.location)
                            )
                        ),
                        React.createElement('div', { className: 'flex justify-end mt-3 h-5 w-5' },
                            React.createElement('div', {
                                className: `h-5 w-5 border-2 rounded-sm flex items-center justify-center transition-colors ${
                                    isSelected ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-400'
                                } ${isDisabled ? 'bg-gray-200 border-gray-300' : ''}`
                            },
                                isSelected && React.createElement('svg', {
                                    className: 'h-4 w-4 text-white',
                                    fill: 'none',
                                    viewBox: '0 0 24 24',
                                    stroke: 'currentColor'
                                },
                                    React.createElement('path', {
                                        strokeLinecap: 'round',
                                        strokeLinejoin: 'round',
                                        strokeWidth: '3',
                                        d: 'M5 13l4 4L19 7'
                                    })
                                )
                            )
                        )
                    )
                );
            })
        ),
        React.createElement('form', { onSubmit: handleSubmit },
            React.createElement('div', { className: 'mt-8 flex flex-col-reverse sm:flex-row justify-between gap-3' },
                React.createElement('button', {
                    type: 'button',
                    onClick: onBack,
                    className: 'w-full sm:w-auto bg-gray-300 text-gray-800 font-bold py-2 px-6 rounded-lg hover:bg-gray-400'
                }, 'Regresar'),
                React.createElement('button', {
                    type: 'submit',
                    className: 'w-full sm:w-auto bg-rose-800 text-white font-bold py-2 px-6 rounded-lg hover:bg-rose-900'
                }, 'Continuar')
            )
        )
    );
};

// =============================================================================
// == STEP 3: CONFIRMACIÓN
// =============================================================================

interface Step3ConfirmationProps {
    formData: IFormData;
    courses: Course[];
    originalCourses: Course[];
    onBack: () => void;
    onSubmit: () => Promise<void>;
}

const Step3Confirmation = ({ formData, courses, originalCourses, onBack, onSubmit }: Step3ConfirmationProps) => {
    const { useState } = React;
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isCancellation = courses.length === 0 && originalCourses.length > 0;

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            await onSubmit();
        } catch (error) {
            console.error("Error de envío:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return React.createElement('div', { className: 'bg-white p-4 sm:p-6 lg:p-8 rounded-lg shadow-md w-full max-w-4xl mx-auto' },
        React.createElement('h2', { className: 'text-xl sm:text-2xl font-bold mb-6 text-gray-800' }, 
            isCancellation ? 'Confirmar Cancelación' : 'Confirmación de Registro'
        ),
        React.createElement('div', { className: 'border border-gray-200 rounded-lg p-4 sm:p-6 mb-6' },
            React.createElement('h3', { className: 'text-base sm:text-lg font-semibold text-gray-700 mb-4' }, 
                'Resumen de su Registro'
            ),
            React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4 text-sm' },
                React.createElement('div', null,
                    React.createElement('p', null, React.createElement('strong', null, 'Nombre: '), formData.fullName),
                    React.createElement('p', null, React.createElement('strong', null, 'CURP: '), formData.curp),
                    React.createElement('p', null, React.createElement('strong', null, 'Género: '), formData.gender)
                ),
                React.createElement('div', null,
                    React.createElement('p', null, React.createElement('strong', null, 'Email: '), formData.email),
                    React.createElement('p', null, React.createElement('strong', null, 'Departamento: '), formData.department)
                )
            )
        ),
        React.createElement('div', { className: 'mt-6' },
            React.createElement('h3', { className: 'text-base sm:text-lg font-semibold text-gray-700 mb-4' }, 
                isCancellation ? "Cursos a Cancelar" : "Cursos Seleccionados"
            ),
            isCancellation ? React.createElement('div', { 
                className: 'border border-yellow-400 bg-yellow-50 text-yellow-800 rounded-lg p-4' 
            },
                React.createElement('p', { className: 'font-bold' }, 'Atención: Está a punto de cancelar su inscripción.'),
                React.createElement('p', { className: 'mt-2 text-sm' }, 
                    `Al confirmar, se eliminará su registro de ${originalCourses.length} curso(s).`
                ),
                React.createElement('ul', { className: 'list-disc list-inside mt-2 space-y-1 text-sm' },
                    originalCourses.map(course => 
                        React.createElement('li', { key: course.id }, course.name)
                    )
                )
            ) : courses.length > 0 ? React.createElement('div', { className: 'space-y-4' },
                courses.map(course =>
                    React.createElement('div', { 
                        key: course.id, 
                        className: 'border border-gray-200 rounded-lg p-4' 
                    },
                        React.createElement('h4', { className: 'font-bold text-sm sm:text-base text-gray-800' }, course.name),
                        React.createElement('div', { className: 'grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 mt-2 text-xs sm:text-sm text-gray-600' },
                            React.createElement('div', null, React.createElement('strong', null, 'Horario: '), course.schedule || 'N/A'),
                            React.createElement('div', null, React.createElement('strong', null, 'Lugar: '), course.location || 'N/A'),
                            React.createElement('div', null, React.createElement('strong', null, 'Fechas: '), course.dates),
                            React.createElement('div', null, React.createElement('strong', null, 'Horas: '), course.hours || 30)
                        )
                    )
                )
            ) : React.createElement('div', { className: 'border border-gray-200 rounded-lg p-4 bg-gray-50' },
                React.createElement('p', { className: 'text-gray-600 text-sm' }, 
                    'No ha seleccionado ningún curso.'
                )
            )
        ),
        React.createElement('div', { className: 'mt-8 flex flex-col-reverse sm:flex-row justify-between gap-3' },
            React.createElement('button', {
                onClick: onBack,
                disabled: isSubmitting,
                className: 'w-full sm:w-auto bg-gray-300 text-gray-800 font-bold py-2 px-6 rounded-lg hover:bg-gray-400 disabled:opacity-50'
            }, 'Regresar'),
            React.createElement('button', {
                onClick: handleSubmit,
                disabled: isSubmitting,
                className: 'w-full sm:w-auto bg-rose-800 text-white font-bold py-2 px-6 rounded-lg hover:bg-rose-900 flex items-center justify-center gap-2 disabled:opacity-50'
            },
                isSubmitting ? '⏳ Procesando...' : (isCancellation ? 'Confirmar Cancelación' : 'Confirmar Registro')
            )
        )
    );
};

// =============================================================================
// == STEP 4: ÉXITO
// =============================================================================

interface Step4SuccessProps {
    registrationResult: RegistrationResult[];
    applicantName: string;
    selectedCourses: Course[];
    submissionType: 'enrollment' | 'cancellation';
    emailSent?: boolean;
    emailError?: string | null;
}

const Step4Success = ({ registrationResult, applicantName, selectedCourses, submissionType, emailSent, emailError }: Step4SuccessProps) => {
    const isCancellation = submissionType === 'cancellation';
    const hasResult = registrationResult && registrationResult.length > 0;
    const coursesToDisplay = hasResult ? registrationResult : selectedCourses;

    return React.createElement('div', { className: 'bg-white p-4 sm:p-6 lg:p-8 rounded-lg shadow-md w-full max-w-4xl mx-auto text-center' },
        React.createElement('div', { className: 'mx-auto h-12 w-12 sm:h-16 sm:w-16 text-green-500 mb-4 text-5xl sm:text-6xl' }, '✅'),
        React.createElement('h2', { className: 'text-xl sm:text-2xl font-bold text-gray-800' },
            isCancellation ? "¡Cancelación Exitosa!" : "¡Registro Exitoso!"
        ),
        React.createElement('p', { className: 'mt-2 text-sm sm:text-base text-gray-600' },
            isCancellation 
                ? `Gracias, ${applicantName}. Tu cancelación ha sido procesada.`
                : `Gracias, ${applicantName}. Tu inscripción ha sido procesada.`
        ),
        
        !isCancellation && emailSent === false && React.createElement('div', {
            className: 'mt-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md text-left max-w-2xl mx-auto',
            role: 'alert'
        },
            React.createElement('p', { className: 'font-bold text-sm sm:text-base' }, '⚠️ Advertencia sobre el email'),
            React.createElement('p', { className: 'text-xs sm:text-sm mt-1' }, 
                emailError || 'No se pudo enviar el email de confirmación. Tu inscripción SÍ fue registrada exitosamente. Verifica tu bandeja de spam.'
            )
        ),
        
        !isCancellation && coursesToDisplay && coursesToDisplay.length > 0 && React.createElement('div', {
            className: 'mt-6 text-left border border-gray-200 rounded-lg p-4 sm:p-6'
        },
            React.createElement('h3', { className: 'text-base sm:text-lg font-semibold text-gray-700 mb-4' }, 
                'Detalles de la Inscripción:'
            ),
            React.createElement('ul', { className: 'space-y-3' },
                coursesToDisplay.map((result: any) =>
                    React.createElement('li', {
                        key: result.registrationId || result.id,
                        className: 'p-3 bg-gray-50 rounded-md border'
                    },
                        React.createElement('div', { className: 'flex flex-col sm:flex-row sm:justify-between gap-2' },
                            React.createElement('span', { className: 'font-semibold text-sm sm:text-base text-gray-800' },
                                (result.courseName || result.name),
                                result.dates && ` (${result.dates})`
                            ),
                            result.folio && React.createElement('span', { className: 'text-xs sm:text-sm' },
                                'Folio: ',
                                React.createElement('strong', { className: 'font-mono bg-gray-200 px-2 py-1 rounded' }, 
                                    result.folio
                                )
                            )
                        )
                    )
                )
            )
        ),
        React.createElement('div', { className: 'mt-8 border-t pt-6' },
            React.createElement('p', { className: 'text-xs sm:text-sm text-gray-500' },
                'El proceso ha finalizado. Puede cerrar esta ventana.'
            )
        )
    );
};

// =============================================================================
// == COMPONENTE FILE INPUT
// =============================================================================

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
    const { useState, useRef } = React;
    const [isDragging, setIsDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // CORREGIDO: Mejor validación de tipos de archivo incluyendo image/*
    const handleFileValidation = (file: File) => {
        const fileTypeParts = file.type.split('/');
        const fileTypeMajor = fileTypeParts[0];
        
        const isValidType = acceptedTypes.some(type => {
            if (type.endsWith('/*')) {
                const typeMajor = type.split('/')[0];
                return typeMajor === fileTypeMajor;
            }
            return type === file.type;
        });

        if (!isValidType) {
            onError(`Tipo de archivo no permitido: ${file.type}`);
            return false;
        }

        if (file.size > maxSizeMB * 1024 * 1024) {
            onError(`El archivo excede ${maxSizeMB} MB`);
            return false;
        }

        onError(null);
        onFileSelect(file);
        return true;
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
        if (inputRef.current) inputRef.current.value = "";
    };

    return React.createElement('div', null,
        React.createElement('label', {
            htmlFor: id,
            className: `relative flex flex-col items-center justify-center w-full h-28 sm:h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 ${isDragging ? 'border-indigo-500' : ''}`
        },
            React.createElement('input', {
                type: 'file',
                id: id,
                ref: inputRef,
                className: 'sr-only',
                accept: acceptedTypes.join(','),
                onChange: handleChange
            }),
            React.createElement('div', { className: 'flex flex-col items-center justify-center space-y-2 text-center px-4' },
                acceptedFile 
                    ? React.createElement('p', { className: 'text-xs sm:text-sm font-semibold text-green-700 break-all' }, 
                        `📄 ${acceptedFile.name}`
                    )
                    : React.createElement('p', { className: 'text-xs sm:text-sm text-gray-500' }, 
                        label
                    )
            )
        ),
        React.createElement('div', { className: 'flex justify-between items-center mt-1' },
            React.createElement('p', { className: 'text-xs text-gray-500' }, 
                `PDF. Máx ${maxSizeMB}MB`
            ),
            acceptedFile && React.createElement('button', {
                type: 'button',
                onClick: handleRemoveFile,
                className: 'text-xs text-red-600 hover:underline'
            }, 'Quitar')
        )
    );
};

// =============================================================================
// == FORMULARIO DE INSTRUCTOR (COMPLETO CON EVIDENCIAS)
// =============================================================================

const formatCourseDates = (dates: string) => {
    if (!dates) return '';
    return dates.split(',').map(d => d.trim()).join(' | ');
};

interface InstructorFormProps {
    onBack: () => void;
    teachers: Teacher[];
    courses: Course[];
}

const InstructorForm = ({ onBack, teachers, courses }: InstructorFormProps) => {
    const { useState } = React;
    const [activeTab, setActiveTab] = useState<'proposal' | 'evidence'>('proposal');

    const [proposalForm, setProposalForm] = useState({ instructorName: '', instructorEmail: '', courseName: '', courseId: '' });
    const [cvuFile, setCvuFile] = useState<File | null>(null);
    const [fichaFile, setFichaFile] = useState<File | null>(null);
    const [proposalStatus, setProposalStatus] = useState({ isSubmitting: false, error: null, success: null, progress: null });
    const [cvuError, setCvuError] = useState<string | null>(null);
    const [fichaError, setFichaError] = useState<string | null>(null);
    
    const [evidenceForm, setEvidenceForm] = useState({ instructorName: '', instructorEmail: '', courseName: '' });
    const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
    const [evidenceError, setEvidenceError] = useState<string | null>(null);
    const [evidenceStatus, setEvidenceStatus] = useState({ isSubmitting: false, error: null, success: null });

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
        setProposalStatus({ isSubmitting: true, error: null, success: null, progress: null });
        
        if (cvuError || fichaError) {
            setProposalStatus({ isSubmitting: false, error: 'Corrija los errores en los archivos', success: null, progress: null });
            return;
        }

        if (!proposalForm.instructorName || !proposalForm.instructorEmail || !proposalForm.courseName || !cvuFile || !fichaFile) {
            setProposalStatus({ isSubmitting: false, error: 'Todos los campos son obligatorios', success: null, progress: null });
            return;
        }

        try {
            setProposalStatus({ isSubmitting: true, error: null, success: null, progress: 'Convirtiendo archivos... ⏳' });
            const cvuFileBase64 = await fileToBase64(cvuFile);
            
            setProposalStatus({ isSubmitting: true, error: null, success: null, progress: 'Subiendo CVU... 📤' });
            const fichaFileBase64 = await fileToBase64(fichaFile);
            
            setProposalStatus({ isSubmitting: true, error: null, success: null, progress: 'Subiendo Ficha Técnica... 📤' });

            await submitInstructorProposal({
                instructorName: proposalForm.instructorName,
                instructorEmail: proposalForm.instructorEmail,
                courseName: proposalForm.courseName,
                courseId: proposalForm.courseId,
                cvuFile: cvuFileBase64,
                fichaFile: fichaFileBase64
            });

            setProposalStatus({ isSubmitting: false, error: null, success: '¡Propuesta enviada con éxito! ✅', progress: null });
        } catch (err) {
            setProposalStatus({ isSubmitting: false, error: err instanceof Error ? err.message : "Error al enviar", success: null, progress: null });
        }
    };

    const handleEvidenceSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setEvidenceStatus({ isSubmitting: true, error: null, success: null });

        if (evidenceFiles.length === 0) {
            setEvidenceStatus({ isSubmitting: false, error: 'Debe subir al menos un archivo', success: null });
            return;
        }

        if (!evidenceForm.instructorName || !evidenceForm.instructorEmail || !evidenceForm.courseName) {
            setEvidenceStatus({ isSubmitting: false, error: 'Todos los campos son obligatorios', success: null });
            return;
        }

        try {
            const evidenceFilesBase64 = await Promise.all(evidenceFiles.map(file => fileToBase64(file)));
            
            await submitEvidence({
                instructorName: evidenceForm.instructorName,
                instructorEmail: evidenceForm.instructorEmail,
                courseName: evidenceForm.courseName,
                evidenceFiles: evidenceFilesBase64
            });

            setEvidenceStatus({ isSubmitting: false, error: null, success: '¡Evidencias enviadas con éxito! ✅' });
        } catch (err) {
            setEvidenceStatus({ isSubmitting: false, error: err instanceof Error ? err.message : "Error al enviar", success: null });
        }
    };

    const groupedCourses = courses.reduce((acc, course) => {
        const period = course.period || 'Sin Periodo';
        if (!acc[period]) acc[period] = { courses: [], dates: '' };
        acc[period].courses.push(course);
        if (!acc[period].dates && course.dates) acc[period].dates = formatCourseDates(course.dates);
        return acc;
    }, {} as { [key: string]: { courses: Course[], dates: string } });

    const renderProposalForm = () => {
        if (proposalStatus.success) {
            return React.createElement('div', { className: 'text-center py-8' },
                React.createElement('div', { className: 'bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-8 rounded-md' },
                    React.createElement('p', { className: 'font-bold text-lg' }, proposalStatus.success)
                ),
                React.createElement('button', {
                    onClick: onBack,
                    className: 'bg-indigo-600 text-white font-bold py-2 px-8 rounded-lg hover:bg-indigo-700'
                }, 'Salir')
            );
        }

        return React.createElement('form', { onSubmit: handleProposalSubmit, noValidate: true },
            React.createElement('div', { className: 'bg-blue-700 text-white p-4 rounded-lg mb-6 text-xs sm:text-sm text-center' },
                React.createElement('p', null, 'Envíe CVU y ficha técnica en PDF genuinos (No fotos).')
            ),
            proposalStatus.error && React.createElement('div', { className: 'bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md' },
                React.createElement('p', { className: 'text-sm' }, proposalStatus.error)
            ),
            proposalStatus.progress && React.createElement('div', { className: 'bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-6 rounded-md' },
                React.createElement('p', { className: 'font-bold text-sm animate-pulse' }, proposalStatus.progress)
            ),
            React.createElement('div', { className: 'space-y-6' },
                React.createElement('div', null,
                    React.createElement('label', { className: 'block text-sm font-medium text-gray-700' }, 'Nombre Completo *'),
                    React.createElement(AutocompleteInput, {
                        teachers, onSelect: handleProposalTeacherSelect, value: proposalForm.instructorName,
                        onChange: (e: any) => setProposalForm(prev => ({ ...prev, instructorName: e.target.value.toUpperCase() })),
                        name: 'proposalInstructorName', required: true
                    })
                ),
                React.createElement('div', null,
                    React.createElement('label', { className: 'block text-sm font-medium text-gray-700' }, 'Email *'),
                    React.createElement('input', {
                        type: 'email', value: proposalForm.instructorEmail,
                        onChange: (e: any) => setProposalForm(prev => ({ ...prev, instructorEmail: e.target.value.toLowerCase() })),
                        className: 'mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm sm:text-base',
                        required: true, placeholder: 'email@itdurango.edu.mx'
                    })
                ),
                React.createElement('div', null,
                    React.createElement('fieldset', null,
                        React.createElement('legend', { className: 'block text-sm font-medium text-gray-700 mb-4' }, 'Curso a Ofrecer *'),
                        courses.length === 0 ? React.createElement('p', { className: 'text-red-500 text-sm' }, 
                            'No hay cursos disponibles.'
                        ) : Object.entries(groupedCourses).map(([period, data]) =>
                            React.createElement('div', { key: period, className: 'mb-6' },
                                React.createElement('h4', { className: 'text-sm sm:text-md font-semibold text-gray-600 border-b pb-2 mb-4' },
                                    data.dates ? `${period.replace(/_/g, ' ')} | ${data.dates}` : period.replace(/_/g, ' ')
                                ),
                                React.createElement('div', { className: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3' },
                                    data.courses.map(course => {
                                        const isSelected = proposalForm.courseName === course.name;
                                        return React.createElement('div', { key: course.id, className: 'relative' },
                                            React.createElement('input', {
                                                type: 'radio',
                                                id: `proposal-course-${course.id}`,
                                                name: 'course-selection',
                                                checked: isSelected,
                                                onChange: () => setProposalForm(prev => ({ ...prev, courseName: course.name, courseId: course.id })),
                                                className: 'sr-only peer'
                                            }),
                                            React.createElement('label', {
                                                htmlFor: `proposal-course-${course.id}`,
                                                className: `block p-3 rounded-lg border transition-all hover:shadow-md cursor-pointer ${
                                                    course.period === 'PERIODO_1' ? 'border-teal-400 bg-teal-50' : 'border-indigo-400 bg-indigo-50'
                                                } peer-checked:ring-2 peer-checked:ring-indigo-500`
                                            },
                                                React.createElement('h3', { className: 'font-bold text-xs sm:text-sm' }, course.name)
                                            )
                                        );
                                    })
                                )
                            )
                        )
                    )
                ),
                React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6' },
                    React.createElement('div', null,
                        React.createElement(FileInput, {
                            id: 'cvuFile', label: 'CVU', onFileSelect: setCvuFile, onError: setCvuError,
                            acceptedFile: cvuFile, acceptedTypes: ['application/pdf'], maxSizeMB: 1
                        }),
                        cvuError && React.createElement('p', { className: 'text-red-500 text-xs mt-1' }, cvuError)
                    ),
                    React.createElement('div', null,
                        React.createElement(FileInput, {
                            id: 'fichaFile', label: 'Ficha Técnica', onFileSelect: setFichaFile, onError: setFichaError,
                            acceptedFile: fichaFile, acceptedTypes: ['application/pdf'], maxSizeMB: 1
                        }),
                        fichaError && React.createElement('p', { className: 'text-red-500 text-xs mt-1' }, fichaError)
                    )
                )
            ),
            React.createElement('div', { className: 'mt-8 flex justify-end' },
                React.createElement('button', {
                    type: 'submit',
                    disabled: proposalStatus.isSubmitting,
                    className: 'w-full sm:w-auto bg-indigo-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-indigo-700 disabled:opacity-50'
                }, proposalStatus.isSubmitting ? 'Enviando...' : 'Enviar Documentación')
            )
        );
    };

    const renderEvidenceForm = () => {
        if (evidenceStatus.success) {
            return React.createElement('div', { className: 'text-center py-8' },
                React.createElement('div', { className: 'bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-8 rounded-md' },
                    React.createElement('p', { className: 'font-bold text-lg' }, evidenceStatus.success)
                ),
                React.createElement('button', {
                    onClick: onBack,
                    className: 'bg-indigo-600 text-white font-bold py-2 px-8 rounded-lg hover:bg-indigo-700'
                }, 'Salir')
            );
        }

        return React.createElement('form', { onSubmit: handleEvidenceSubmit },
            // CORREGIDO: Mensaje correcto sobre límites de archivos
            React.createElement('div', { className: 'bg-blue-50 border-l-4 border-blue-500 text-blue-800 p-4 rounded-lg mb-6 text-xs sm:text-sm' },
                React.createElement('p', null, 'Suba hasta 6 archivos (máx 5MB cada uno). Formatos: PDF o imágenes.')
            ),
            evidenceStatus.error && React.createElement('div', { className: 'bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md' },
                React.createElement('p', { className: 'text-sm' }, evidenceStatus.error)
            ),
            evidenceError && React.createElement('div', { className: 'bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md' },
                React.createElement('p', { className: 'text-sm' }, evidenceError)
            ),
            React.createElement('div', { className: 'space-y-6' },
                React.createElement('div', null,
                    React.createElement('label', { className: 'block text-sm font-medium text-gray-700' }, 'Nombre *'),
                    React.createElement(AutocompleteInput, {
                        teachers, onSelect: handleEvidenceTeacherSelect, value: evidenceForm.instructorName,
                        onChange: (e: any) => setEvidenceForm(prev => ({ ...prev, instructorName: e.target.value.toUpperCase() })),
                        name: 'evidenceInstructorName', required: true
                    })
                ),
                React.createElement('div', null,
                    React.createElement('label', { className: 'block text-sm font-medium text-gray-700' }, 'Email *'),
                    React.createElement('input', {
                        type: 'email', value: evidenceForm.instructorEmail,
                        onChange: (e: any) => setEvidenceForm(prev => ({ ...prev, instructorEmail: e.target.value.toLowerCase() })),
                        className: 'mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm sm:text-base',
                        required: true, placeholder: 'email@itdurango.edu.mx'
                    })
                ),
                React.createElement('div', null,
                    React.createElement('fieldset', null,
                        React.createElement('legend', { className: 'block text-sm font-medium text-gray-700 mb-4' }, 'Curso Impartido *'),
                        courses.length === 0 ? React.createElement('p', { className: 'text-red-500 text-sm' }, 
                            'No hay cursos disponibles.'
                        ) : Object.entries(groupedCourses).map(([period, data]) =>
                            React.createElement('div', { key: period, className: 'mb-6' },
                                React.createElement('h4', { className: 'text-sm sm:text-md font-semibold text-gray-600 border-b pb-2 mb-4' },
                                    data.dates ? `${period.replace(/_/g, ' ')} | ${data.dates}` : period.replace(/_/g, ' ')
                                ),
                                React.createElement('div', { className: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3' },
                                    data.courses.map(course => {
                                        const isSelected = evidenceForm.courseName === course.name;
                                        return React.createElement('div', { key: course.id, className: 'relative' },
                                            React.createElement('input', {
                                                type: 'radio',
                                                id: `evidence-course-${course.id}`,
                                                name: 'evidence-course-selection',
                                                checked: isSelected,
                                                onChange: () => setEvidenceForm(prev => ({ ...prev, courseName: course.name })),
                                                className: 'sr-only peer'
                                            }),
                                            React.createElement('label', {
                                                htmlFor: `evidence-course-${course.id}`,
                                                className: `block p-3 rounded-lg border transition-all hover:shadow-md cursor-pointer ${
                                                    course.period === 'PERIODO_1' ? 'border-teal-400 bg-teal-50' : 'border-indigo-400 bg-indigo-50'
                                                } peer-checked:ring-2 peer-checked:ring-indigo-500`
                                            },
                                                React.createElement('h3', { className: 'font-bold text-xs sm:text-sm' }, course.name)
                                            )
                                        );
                                    })
                                )
                            )
                        )
                    )
                ),
                React.createElement('div', null,
                    // CORREGIDO: Validación de límite de 6 archivos
                    React.createElement('input', {
                        type: 'file', 
                        multiple: true, 
                        accept: 'application/pdf,image/*',
                        onChange: (e: any) => { 
                            if (e.target.files) {
                                const filesArray = Array.from(e.target.files) as File[];
                                if (filesArray.length > 6) {
                                    setEvidenceError('No puede seleccionar más de 6 archivos');
                                    setEvidenceFiles([]);
                                    e.target.value = '';
                                } else {
                                    setEvidenceError(null);
                                    setEvidenceFiles(filesArray);
                                }
                            }
                        },
                        className: 'block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100'
                    }),
                    evidenceFiles.length > 0 && React.createElement('p', { className: 'text-sm text-green-600 mt-2' },
                        `${evidenceFiles.length} archivo(s) seleccionado(s)`
                    )
                )
            ),
            React.createElement('div', { className: 'mt-8 flex justify-end' },
                React.createElement('button', {
                    type: 'submit',
                    disabled: evidenceStatus.isSubmitting,
                    className: 'w-full sm:w-auto bg-indigo-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-indigo-700 disabled:opacity-50'
                }, evidenceStatus.isSubmitting ? 'Enviando...' : 'Enviar Evidencia')
            )
        );
    };

    return React.createElement('div', { className: 'bg-white p-4 sm:p-6 lg:p-8 rounded-lg shadow-md w-full max-w-4xl mx-auto' },
        React.createElement('button', {
            onClick: onBack,
            className: 'text-sm text-blue-600 hover:underline mb-4'
        }, '← Volver'),
        React.createElement('h2', { className: 'text-xl sm:text-2xl font-bold mb-4' }, 'Portal de Instructores'),
        React.createElement('div', { className: 'border-b mb-4 bg-gray-50 rounded-t-lg' },
            React.createElement('nav', { className: 'flex space-x-2 sm:space-x-4 px-2 sm:px-4' },
                React.createElement('button', {
                    onClick: () => setActiveTab('proposal'),
                    className: `px-4 sm:px-6 py-3 font-semibold text-sm sm:text-base rounded-t-lg transition-colors ${activeTab === 'proposal' ? 'bg-white text-indigo-700 border-b-2 border-indigo-500 -mb-px' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'}`
                }, 'Subir documentación'),
                React.createElement('button', {
                    onClick: () => setActiveTab('evidence'),
                    className: `px-4 sm:px-6 py-3 font-semibold text-sm sm:text-base rounded-t-lg transition-colors ${activeTab === 'evidence' ? 'bg-white text-indigo-700 border-b-2 border-indigo-500 -mb-px' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'}`
                }, 'Subir Evidencias')
            )
        ),
        React.createElement('div', { className: 'pt-6' },
            activeTab === 'proposal' ? renderProposalForm() : renderEvidenceForm()
        )
    );
};

// =============================================================================
// == RENDERIZADO DE LA APLICACIÓN
// =============================================================================

const rootElement = document.getElementById('root');
if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
        React.createElement(React.StrictMode, null,
            React.createElement(App, null)
        )
    );
} else {
    console.error('No se encontró el elemento root');
}
