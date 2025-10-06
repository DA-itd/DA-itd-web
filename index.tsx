import React from "react";
import { createRoot } from "react-dom/client";

/**
 * Componente principal de la aplicación
 */
function App() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-center p-6">
      <h1 className="text-3xl font-bold text-blue-600 mb-4">
        Sistema de Inscripción a Cursos
      </h1>
      <p className="text-gray-700 mb-6">
        Bienvenido(a). Inicia sesión con tu cuenta institucional para continuar.
      </p>

      {/* Botón de inicio de sesión de Google */}
      <div id="g_id_onload"
        data-client_id="TU_CLIENT_ID_DE_GOOGLE.apps.googleusercontent.com"
        data-login_uri="/login"
        data-auto_prompt="false">
      </div>
      <div className="g_id_signin"
        data-type="standard"
        data-shape="rectangular"
        data-theme="outline"
        data-text="sign_in_with"
        data-size="large"
        data-logo_alignment="left">
      </div>
    </div>
  );
}

/**
 * Renderizado de la app
 */
const rootElement = document.getElementById("root");
const root = createRoot(rootElement!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
