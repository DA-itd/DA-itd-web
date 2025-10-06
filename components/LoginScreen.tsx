// Fix: Import React for module-based TSX file.
import React from 'react';

// Declaramos 'google' para que TypeScript no se queje, ya que se carga desde un script externo.
declare const google: any;

interface LoginScreenProps {
  onLoginSuccess: (credential: string) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const googleButtonRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!google) {
      console.error("Google's script did not load.");
      return;
    }

    const handleCredentialResponse = (response: any) => {
      onLoginSuccess(response.credential);
    };

    // Inicializamos la API de identidad de Google
    google.accounts.id.initialize({
      // ¡IMPORTANTE! Reemplaza este Client ID con el tuyo propio desde la Consola de Google Cloud.
      // Puedes usar el que me mencionaste: '524996225715-5l95j3lces5hi4c19rfgotdrfo2seq1.apps.googleusercontent.com'
      client_id: "524996225715-5l95j3lces5hi4c19rfgotdrfo2seq1.apps.googleusercontent.com",
      callback: handleCredentialResponse,
    });

    // Renderizamos el botón de Google en nuestro div
    if (googleButtonRef.current) {
      google.accounts.id.renderButton(
        googleButtonRef.current,
        { theme: "outline", size: "large", text: "signin_with", shape: "rectangular" }
      );
    }
    
    // Opcional: muestra el prompt de "One Tap" para un inicio de sesión más rápido
    // google.accounts.id.prompt();

  }, [onLoginSuccess]);

  return (
    <div className="flex flex-col items-center justify-center mt-16">
      <div className="bg-white p-10 rounded-xl shadow-lg text-center max-w-md w-full">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Bienvenido</h2>
        <p className="text-gray-600 mb-6">
          Para continuar, por favor inicie sesión con su cuenta institucional
          (@itdurango.edu.mx) o Gmail.
        </p>
        {/* Este div será reemplazado por el botón real de Google */}
        <div ref={googleButtonRef} className="flex justify-center"></div>
      </div>
    </div>
  );
};

export default LoginScreen;