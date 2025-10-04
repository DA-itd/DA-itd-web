
import React from 'react';
import { User } from '../types';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl md:text-3xl font-bold text-blue-800">
            Sistema de Inscripción a Cursos de Actualización Docente
          </h1>
          <p className="text-sm md:text-md text-gray-600">
            Instituto Tecnológico de Durango, Coordinación de Actualización Docente
          </p>
        </div>
        {user && (
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="font-semibold text-sm">{user.name}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
            {user.imageUrl && <img src={user.imageUrl} alt="User" className="w-10 h-10 rounded-full" />}
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              Salir
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
