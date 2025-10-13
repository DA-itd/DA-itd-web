// Fix: Import React for module-based TSX file.
import React from 'react';
import { UserPlusIcon, PresentationIcon } from './icons';

interface RoleSelectionScreenProps {
  onSelectRole: (role: 'participant' | 'instructor') => void;
}

const RoleSelectionScreen: React.FC<RoleSelectionScreenProps> = ({ onSelectRole }) => {
  return (
    <div className="text-center">
      <h2 className="text-3xl font-bold text-gray-800 mb-4">Bienvenido al Sistema de Inscripción</h2>
      <p className="text-lg text-gray-600 mb-10">Por favor, seleccione el motivo de su visita.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Participant Card */}
        <button
          onClick={() => onSelectRole('participant')}
          className="group flex flex-col items-center justify-center p-8 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-all duration-300 transform hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-blue-300"
          aria-label="Inscribirme a cursos de actualización docente"
        >
          <UserPlusIcon className="w-20 h-20 mb-4 transition-transform duration-300 group-hover:scale-110" />
          <h3 className="text-2xl font-bold">Inscripción a Cursos</h3>
          <p className="mt-2 text-blue-100">Seleccione esta opción para registrarse en los cursos de actualización docente.</p>
        </button>

        {/* Instructor Card */}
        <button
          onClick={() => onSelectRole('instructor')}
          className="group flex flex-col items-center justify-center p-8 bg-rose-800 text-white rounded-xl shadow-lg hover:bg-rose-900 transition-all duration-300 transform hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-rose-300"
          aria-label="Registrarme como instructor de un curso"
        >
          <PresentationIcon className="w-20 h-20 mb-4 transition-transform duration-300 group-hover:scale-110" />
          <h3 className="text-2xl font-bold">Soy Instructor</h3>
          <p className="mt-2 text-rose-100">Seleccione esta opción para registrarse como instructor y subir su documentación.</p>
        </button>
      </div>
    </div>
  );
};

export default RoleSelectionScreen;