// Fix: Import React to support JSX.
import React from 'react';
import { User } from '../types.ts';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <img 
            src="https://raw.githubusercontent.com/DA-itd/DA-itd-web/main/logo_itdurango.png" 
            alt="Logo ITD" 
            className="h-12 md:h-16" 
          />
          <div>
            <h1 className="text-xl md:text-3xl font-bold text-blue-800">
              Sistema de Inscripción a Cursos de Actualización Docente
            </h1>
            <p className="text-sm md:text-md text-gray-600">
              Instituto Tecnológico de Durango, Coordinación de Actualización Docente
            </p>
          </div>
        </div>
        {user && (
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="font-semibold text-sm">{user.name}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
            {user.picture && <img src={user.picture} alt="User" className="w-10 h-10 rounded-full" />}
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