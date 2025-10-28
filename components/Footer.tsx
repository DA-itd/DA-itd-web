import React from 'react';

const Footer = () => (
  <footer className="w-full bg-white shadow-sm mt-auto">
    <div className="container mx-auto px-6 py-4 text-center text-gray-600 text-sm">
      <p>&copy; {new Date().getFullYear()} Instituto Tecnológico de Durango. Todos los derechos reservados.</p>
      <p className="mt-1">
        Desarrollado por el Departamento de Sistemas y Computación. Ver 3.4
      </p>
    </div>
  </footer>
);

export default Footer;