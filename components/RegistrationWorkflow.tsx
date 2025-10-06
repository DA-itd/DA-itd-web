// Fix: Import React for module-based TSX file.
import React from 'react';
import { User, Teacher, Course, Department, RegistrationData } from '../types.ts';
import { getTeachers, getCourses, getDepartments, submitRegistration } from '../services/api.ts';
import { CheckIcon, XIcon, UploadIcon, DocumentIcon, LoadingIcon } from './icons.tsx';

const MAX_COURSES = 3;
const MAX_REGISTRATIONS_PER_COURSE = 30;
const MAX_FILE_SIZE_MB = 2;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const RegistrationWorkflow: React.FC<{ user: User; role: 'participant' | 'instructor'; onLogout: () => void; onReturnToRoleSelection: () => void; }> = ({ user, role, onLogout, onReturnToRoleSelection }) => {
    const [teachers, setTeachers] = React.useState<Teacher[]>([]);
    const [courses, setCourses] = React.useState<Course[]>([]);
    const [departments, setDepartments] = React.useState<Department[]>([]);
    
    // Form states
    const [name, setName] = React.useState('');
    const [curp, setCurp] = React.useState('');
    const [email, setEmail] = React.useState('');
    const [gender, setGender] = React.useState('');
    const [department, setDepartment] = React.useState('');
    
    const [autocompleteSuggestions, setAutocompleteSuggestions] = React.useState<Teacher[]>([]);
    const [isAutocompleteOpen, setIsAutocompleteOpen] = React.useState(false);
    const [isNewTeacher, setIsNewTeacher] = React.useState(false);

    const [selectedCourses, setSelectedCourses] = React.useState<Course[]>([]);
    const [selectedPeriod, setSelectedPeriod] = React.useState<string | null>(null);
    
    // UI states
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [submitting, setSubmitting] = React.useState(false);
    const [submitSuccess, setSubmitSuccess] = React.useState<string | null>(null);
    const [submitError, setSubmitError] = React.useState<string | null>(null);
    const [registrationComplete, setRegistrationComplete] = React.useState(false);

    // Instructor states
    const [instructorCourseId, setInstructorCourseId] = React.useState<string>('');
    const [cvFile, setCvFile] = React.useState<File | null>(null);
    const [fichaFile, setFichaFile] = React.useState<File | null>(null);
    const [fileErrors, setFileErrors] = React.useState<{ cv?: string; ficha?: string }>({});
    
    const isInstructorMode = React.useMemo(() => role === 'instructor', [role]);

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [teachersData, coursesData, departmentsData] = await Promise.all([
                    getTeachers(),
                    getCourses(),
                    getDepartments(),
                ]);
                setTeachers(teachersData);
                setCourses(coursesData);
                setDepartments(departmentsData);
            } catch (err) {
                setError('No se pudieron cargar los datos. Por favor, intente de nuevo más tarde.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.toUpperCase();
        setName(value);
        if (value.length > 2) {
            const filtered = teachers.filter(t => t.NombreCompleto.toUpperCase().includes(value));
            setAutocompleteSuggestions(filtered);
            setIsAutocompleteOpen(true);
        } else {
            setAutocompleteSuggestions([]);
            setIsAutocompleteOpen(false);
        }
        setIsNewTeacher(true); 
        setCurp('');
        setEmail('');
    };

    const handleSelectTeacher = (teacher: Teacher) => {
        setName(teacher.NombreCompleto);
        setCurp(teacher.Curp);
        setEmail(teacher.Email);
        setIsAutocompleteOpen(false);
        setAutocompleteSuggestions([]);
        setIsNewTeacher(false);
    };

    const handleAddNewTeacher = () => {
        setCurp('');
        setEmail('');
        setIsNewTeacher(true);
        setIsAutocompleteOpen(false);
    }
    
    const checkConflict = (newCourse: Course, existingCourses: Course[]): boolean => {
        for (const existingCourse of existingCourses) {
            if (existingCourse.Periodo === newCourse.Periodo) {
                const [start1, end1] = existingCourse.Horario.replace(' hrs', '').split(' a ');
                const [start2, end2] = newCourse.Horario.replace(' hrs', '').split(' a ');
                if (Math.max(parseFloat(start1), parseFloat(start2)) < Math.min(parseFloat(end1), parseFloat(end2))) {
                    return true; // Conflict detected
                }
            }
        }
        return false;
    };
    
    const handleSelectCourse = (course: Course) => {
        if (selectedCourses.length >= MAX_COURSES) {
            alert(`No puede seleccionar más de ${MAX_COURSES} cursos.`);
            return;
        }
        if (selectedCourses.find(c => c.Id_Curso === course.Id_Curso)) {
            alert('Este curso ya ha sido seleccionado.');
            return;
        }
        if (checkConflict(course, selectedCourses)) {
            alert('El horario de este curso se empalma con otro curso seleccionado.');
            return;
        }
        
        if (selectedCourses.length === 0) {
            setSelectedPeriod(course.Periodo);
        }
        setSelectedCourses(prev => [...prev, course]);
    };

    const handleRemoveCourse = (courseId: string) => {
        setSelectedCourses(prev => {
            const newSelected = prev.filter(c => c.Id_Curso !== courseId);
            if (newSelected.length === 0) {
                setSelectedPeriod(null);
            }
            return newSelected;
        });
    };

    const isCourseFull = (course: Course) => {
        return (course.registrations || 0) >= MAX_REGISTRATIONS_PER_COURSE;
    }

    const filteredCourses = React.useMemo(() => {
        return courses;
    }, [courses]);
    
    const isFormValid = React.useMemo(() => {
        const teacherInfoValid = name && curp && email && gender && department;
        if (!teacherInfoValid) return false;

        if (isInstructorMode) {
            return !!instructorCourseId;
        } else {
            return selectedCourses.length > 0;
        }
    }, [name, curp, email, gender, department, selectedCourses, isInstructorMode, instructorCourseId]);

    const getValidationMessage = () => {
        const messages = [];
        if (!name || !curp || !email || !gender || !department) {
            messages.push('información del docente');
        }
        
        if (isInstructorMode) {
            if (!instructorCourseId) {
                messages.push('seleccionar el curso que impartirá');
            }
        } else {
            if (selectedCourses.length === 0) {
                messages.push('seleccionar al menos un curso para tomar');
            }
        }

        if (messages.length === 0) return null;
        return `Por favor, complete los siguientes campos: ${messages.join(', ')}.`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isFormValid) {
            setSubmitError(getValidationMessage() || 'Por favor, complete todos los campos requeridos.');
            return;
        }
        setSubmitting(true);
        setSubmitError(null);
        setSubmitSuccess(null);

        const registrationData: RegistrationData = {
            user,
            teacherInfo: {
                NombreCompleto: name,
                Curp: curp,
                Email: email,
                Genero: gender,
                Departamento: department
            },
            selectedCourses,
            ...(isInstructorMode && {
                instructorDetails: {
                    teachingCourseId: instructorCourseId,
                    cv: cvFile,
                    ficha: fichaFile
                }
            })
        };
        
        try {
            const response = await submitRegistration(registrationData);
            setSubmitSuccess(response.message);
            setRegistrationComplete(true);
        } catch (error: any) {
            setSubmitError(error.message || 'Ocurrió un error al enviar la inscripción.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="flex justify-center items-center h-64"><LoadingIcon className="w-12 h-12 text-blue-600" /> <span className="ml-4 text-xl">Cargando datos...</span></div>;
    if (error) return <div className="text-center text-red-600 bg-red-100 p-4 rounded-lg">{error}</div>;

    if (registrationComplete) {
        return (
            <div className="p-8 bg-white rounded-xl shadow-lg text-center max-w-2xl mx-auto">
                <CheckIcon className="w-16 h-16 text-green-500 mx-auto" />
                <h2 className="text-2xl font-bold text-gray-900 mt-4">¡Operación Exitosa!</h2>
                <p className="text-gray-600 mt-2">{submitSuccess}</p>
                 <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
                    <button onClick={onReturnToRoleSelection} className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors">
                        Volver al Menú
                    </button>
                    <button onClick={onLogout} className="px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:bg-gray-700 transition-colors">
                        Salir
                    </button>
                </div>
            </div>
        )
    }

    const FileInput: React.FC<{
        label: string; file: File | null; setFile: (file: File | null) => void; accept: string;
        error?: string; setError: (error: string | null) => void;
    }> = ({ label, file, setFile, accept, error, setError }) => {
        const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const selectedFile = e.target.files ? e.target.files[0] : null;
            e.target.value = ''; // Reset input to allow re-uploading the same file if needed after an error
            if (selectedFile) {
                if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
                    setError(`El archivo excede el tamaño máximo de ${MAX_FILE_SIZE_MB}MB.`);
                    setFile(null);
                } else if (!accept.includes(selectedFile.type)) {
                    setError('Tipo de archivo no válido. Solo se permiten PDF.');
                    setFile(null);
                } else {
                    setError(null);
                    setFile(selectedFile);
                }
            }
        };

        return (
            <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">{label}</label>
                <div className={`mt-1 flex items-center justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md ${error ? 'border-red-500' : 'border-gray-300'}`}>
                    {file ? (
                        <div className="text-center">
                            <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <p className="mt-2 text-sm text-gray-600">{file.name}</p>
                            <button onClick={() => { setFile(null); setError(null); }} className="text-xs text-red-500 hover:underline mt-1">Quitar</button>
                        </div>
                    ) : (
                        <div className="space-y-1 text-center">
                            <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <div className="flex text-sm text-gray-600">
                                <label htmlFor={`file-upload-${label}`} className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                                    <span>Subir un archivo</span>
                                    <input id={`file-upload-${label}`} name={`file-upload-${label}`} type="file" className="sr-only" accept={accept} onChange={handleFileChange} />
                                </label>
                                <p className="pl-1">o arrastrar y soltar</p>
                            </div>
                            <p className="text-xs text-gray-500">PDF (no imágenes escaneadas) hasta {MAX_FILE_SIZE_MB}MB</p>
                        </div>
                    )}
                </div>
                {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            </div>
        );
    };

    const validationMessage = getValidationMessage();
    const submitButtonText = isInstructorMode ? 'Finalizar Registro de Instructor' : 'Finalizar Inscripción';
    const formTitle = isInstructorMode ? 'Registro para Instructores' : 'Inscripción a Cursos';

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <h2 className="text-3xl font-bold text-gray-800 text-center">{formTitle}</h2>

            {/* Instructor-specific section */}
            {isInstructorMode && (
                 <div className="p-8 bg-white rounded-xl shadow-lg">
                    <h3 className="text-xl font-bold text-gray-900 border-b pb-4 mb-6">1. Curso a Impartir y Documentación</h3>
                    <div className="space-y-6">
                        <div>
                            <label htmlFor="instructorCourse" className="block text-sm font-medium text-gray-700">Seleccione el curso que impartirá</label>
                            <select id="instructorCourse" value={instructorCourseId} onChange={e => setInstructorCourseId(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" required>
                                <option value="">Seleccione un curso...</option>
                                {courses.map(course => (
                                    <option key={course.Id_Curso} value={course.Id_Curso}>{course.Nombre_curso}</option>
                                ))}
                            </select>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <FileInput label="Curriculum Vitae (PDF)" file={cvFile} setFile={setCvFile} accept="application/pdf" error={fileErrors.cv} setError={err => setFileErrors(prev => ({...prev, cv: err || undefined}))} />
                           <FileInput label="Ficha Técnica (PDF)" file={fichaFile} setFile={setFichaFile} accept="application/pdf" error={fileErrors.ficha} setError={err => setFileErrors(prev => ({...prev, ficha: err || undefined}))} />
                        </div>
                        <div className="mt-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 rounded-r-lg">
                            <p className="font-bold">Nota Importante:</p>
                            <p className="text-sm">Solo se aceptan archivos en formato PDF que no sean imágenes escaneadas. Sus documentos serán revisados; si se encuentra alguna inconsistencia, se le contactará por correo electrónico con las indicaciones correspondientes.</p>
                        </div>
                    </div>
                </div>
            )}
           
            {/* Teacher Information Section */}
            <div className="p-8 bg-white rounded-xl shadow-lg">
                <h2 className="text-xl font-bold text-gray-900 border-b pb-4 mb-6">{isInstructorMode ? '2.' : '1.'} Información del Docente</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="relative">
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nombre Completo</label>
                        <input type="text" id="name" value={name} onChange={handleNameChange} onFocus={() => { if(name.length > 2) setIsAutocompleteOpen(true); }} onBlur={() => setTimeout(() => setIsAutocompleteOpen(false), 200)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" placeholder="Escriba su nombre para buscar..." required />
                        {isAutocompleteOpen && (autocompleteSuggestions.length > 0 || name.length > 2) && (
                             <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                                {autocompleteSuggestions.map(teacher => (
                                    <div key={teacher.Curp} onMouseDown={() => handleSelectTeacher(teacher)} className="px-4 py-2 hover:bg-gray-100 cursor-pointer">{teacher.NombreCompleto}</div>
                                ))}
                                <div onMouseDown={handleAddNewTeacher} className="px-4 py-3 bg-gray-50 text-sm text-blue-600 hover:bg-gray-100 cursor-pointer font-semibold">+ No estoy en la lista, registrar nuevo.</div>
                            </div>
                        )}
                    </div>
                    <div>
                        <label htmlFor="curp" className="block text-sm font-medium text-gray-700">CURP</label>
                        <input type="text" id="curp" value={curp} onChange={e => setCurp(e.target.value.toUpperCase())} readOnly={!isNewTeacher} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm read-only:bg-gray-100" required />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                        <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} readOnly={!isNewTeacher} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm read-only:bg-gray-100" required />
                    </div>
                     <div>
                        <label htmlFor="gender" className="block text-sm font-medium text-gray-700">Género</label>
                        <select id="gender" value={gender} onChange={e => setGender(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" required>
                            <option value="">Seleccione...</option>
                            <option value="Masculino">Masculino</option>
                            <option value="Femenino">Femenino</option>
                            <option value="Otro">Otro</option>
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="department" className="block text-sm font-medium text-gray-700">Departamento de Adscripción</label>
                        <select id="department" value={department} onChange={e => setDepartment(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" required>
                            <option value="">Seleccione un departamento...</option>
                            {departments.map(d => (
                                <option key={d.NombreDepartamento} value={d.NombreDepartamento}>{d.NombreDepartamento}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Course Selection Section (for participants only) */}
            {!isInstructorMode && (
                <div className="p-8 bg-white rounded-xl shadow-lg">
                     <h2 className="text-xl font-bold text-gray-900 border-b pb-4 mb-6">2. Selección de Cursos</h2>
                     <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                            <h3 className="font-semibold text-lg mb-4">Cursos Disponibles</h3>
                            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                               {filteredCourses.map(course => {
                                    const isSelected = selectedCourses.some(c => c.Id_Curso === course.Id_Curso);
                                    const isFull = isCourseFull(course);
                                    const isPeriodLocked = selectedPeriod && course.Periodo !== selectedPeriod;
                                    const isDisabled = isSelected || isFull || isPeriodLocked;
                                    const periodColorClass = course.Periodo === 'PERIODO_1' ? 'border-l-4 border-l-teal-400' : 'border-l-4 border-l-indigo-400';

                                    return (
                                    <div key={course.Id_Curso} className={`p-4 border rounded-lg transition-all ${periodColorClass} ${isSelected ? 'bg-blue-50 border-blue-300' : 'bg-white'} ${isPeriodLocked ? 'bg-gray-100 opacity-60' : ''} ${isFull ? 'bg-gray-200 opacity-60' : ''}`}>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-bold text-blue-800">{course.Nombre_curso}</p>
                                                <p className="text-xs text-gray-500">{course.Id_Curso}</p>
                                                <div className="text-sm text-gray-700 mt-2 space-y-1">
                                                    <p><strong>Periodo:</strong> {course.FechaVisible}</p>
                                                    <p><strong>Horario:</strong> {course.Horario}</p>
                                                    <p><strong>Lugar:</strong> {course.Lugar} | <strong>Horas:</strong> {course.Horas} | <strong>Tipo:</strong> {course.Tipo}</p>
                                                </div>
                                            </div>
                                            <button type="button" onClick={() => !isDisabled && handleSelectCourse(course)} disabled={isDisabled} className={`ml-4 px-4 py-2 text-sm font-medium rounded-md transition-colors w-24 flex-shrink-0 ${isSelected ? 'bg-green-500 text-white cursor-default' : 'bg-green-500 text-white'} ${!isSelected && 'bg-blue-600 hover:bg-blue-700'} disabled:bg-gray-400 disabled:cursor-not-allowed`}>
                                                {isSelected ? 
                                                <><CheckIcon className="w-5 h-5 inline-block mr-1" /><span>Añadido</span></> : (isFull ? 'Lleno' : (isPeriodLocked ? 'Otro Periodo' : 'Añadir'))}
                                            </button>
                                        </div>
                                    </div>
                                    )
                                })}
                            </div>
                        </div>
                        <div className="lg:col-span-1">
                            <div className="sticky top-8 bg-gray-50 p-6 rounded-lg border">
                                <h3 className="font-semibold text-lg mb-4 text-center">Mis Cursos ({selectedCourses.length}/{MAX_COURSES})</h3>
                                {selectedCourses.length === 0 ? (
                                    <p className="text-center text-gray-500">Aún no ha seleccionado cursos.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {selectedCourses.map(course => (
                                            <div key={course.Id_Curso} className="p-3 bg-white rounded-md shadow-sm flex justify-between items-center">
                                                <div>
                                                    <p className="font-semibold text-sm">{course.Nombre_curso}</p>
                                                    <p className="text-xs text-gray-500">{course.Horario}</p>
                                                </div>
                                                <button type="button" onClick={() => handleRemoveCourse(course.Id_Curso)} className="text-red-500 hover:text-red-700">
                                                    <XIcon className="w-5 h-5"/>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                 <div className="mt-6 pt-4 border-t font-bold text-center">
                                    Total de Horas: {selectedCourses.reduce((acc, c) => acc + c.Horas, 0)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Submission Section */}
            <div className="flex flex-col items-center justify-center pt-4">
                {submitError && <div className="mb-4 p-4 text-center text-red-800 bg-red-100 rounded-lg w-full max-w-2xl">{submitError}</div>}
                <button type="submit" disabled={!isFormValid || submitting} className="w-full max-w-md px-8 py-4 bg-green-600 text-white font-bold text-lg rounded-lg shadow-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center">
                    {submitting ? 
                    <><LoadingIcon className="w-6 h-6 mr-3" /> Procesando...</> : submitButtonText}
                </button>
                 {!isFormValid && validationMessage && <p className="text-sm text-red-500 mt-2 text-center font-semibold">{validationMessage}</p>}
            </div>
        </form>
    );
};

export default RegistrationWorkflow;