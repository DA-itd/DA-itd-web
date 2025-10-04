
import React from 'react';

interface LoginScreenProps {
  onLogin: () => void;
}

const GoogleIcon: React.FC = () => (
    <svg className="w-5 h-5 mr-3" viewBox="0 0 48 48">
        <path fill="#4285F4" d="M24 9.5c3.23 0 6.13 1.11 8.4 3.29l6.39-6.39C34.81 2.97 29.83 1 24 1 14.89 1 7.21 6.35 4.38 14.39l7.84 6.07C13.84 14.12 18.52 9.5 24 9.5z"></path>
        <path fill="#34A853" d="M46.38 24.51c0-1.65-.15-3.25-.43-4.8H24v9.09h12.57c-.55 2.93-2.16 5.43-4.66 7.13l7.63 5.92C44.13 37.5 46.38 31.56 46.38 24.51z"></path>
        <path fill="#FBBC05" d="M12.22 20.46c-.53-1.6-1.02-3.3-1.02-5.06s.49-3.46 1.02-5.06l-7.84-6.07C2.97 7.21 1 11.97 1 17.4c0 5.43 1.97 10.19 5.38 13.87l7.84-6.81z"></path>
        <path fill="#EA4335" d="M24 47c5.83 0 10.81-1.97 14.39-5.38l-7.63-5.92c-1.92 1.29-4.38 2.06-7.14 2.06-5.48 0-10.16-4.62-11.78-10.84l-7.84 6.07C7.21 40.65 14.89 47 24 47z"></path>
        <path fill="none" d="M0 0h48v48H0z"></path>
    </svg>
);


const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  return (
    <div className="flex flex-col items-center justify-center mt-16">
      <div className="bg-white p-10 rounded-xl shadow-lg text-center max-w-md w-full">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Bienvenido</h2>
        <p className="text-gray-600 mb-6">
          Para continuar, por favor inicie sesión con su cuenta institucional
          (@itdurango.edu.mx) o Gmail.
        </p>
        <button
          onClick={onLogin}
          className="w-full flex items-center justify-center bg-white border border-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <GoogleIcon />
          Iniciar Sesión con Google
        </button>
      </div>
    </div>
  );
};

export default LoginScreen;
