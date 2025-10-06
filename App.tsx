import React from "react";

export default function App() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center p-6">
      <h1 className="text-3xl font-bold text-blue-600 mb-4">
        Sistema de Inscripción a Cursos
      </h1>
      <p className="text-gray-700 mb-6 max-w-xl">
        Bienvenido(a) al sistema de inscripción. Inicia sesión con tu cuenta institucional para consultar y registrarte en los cursos disponibles.
      </p>

      {/* Componente de Google Sign-In */}
      <div
        id="g_id_onload"
        data-client_id="524996225715-5l95j3lces5hi49c19rfgotdrfo2seq1.apps.googleusercontent.com"
        data-login_uri="/login"
        data-auto_prompt="false"
      ></div>

      <div
        className="g_id_signin"
        data-type="standard"
        data-shape="rectangular"
        data-theme="outline"
        data-text="sign_in_with"
        data-size="large"
        data-logo_alignment="left"
      ></div>
    </div>
  );
}
