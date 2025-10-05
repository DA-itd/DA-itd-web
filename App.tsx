import { User } from './types.ts';
import Header from './components/Header.tsx';
import LoginScreen from './components/LoginScreen.tsx';
import RegistrationWorkflow from './components/RegistrationWorkflow.tsx';
import RoleSelectionScreen from './components/RoleSelectionScreen.tsx';

type Role = 'participant' | 'instructor';

// Helper function to decode JWT
const decodeJwt = (token: string) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    console.error("Error decoding JWT:", e);
    return null;
  }
};

// @ts-ignore - React is a global variable from the script in index.html
const App: React.FC = () => {
  // @ts-ignore - React is a global variable from the script in index.html
  const [user, setUser] = React.useState<User | null>(null);
  // @ts-ignore - React is a global variable from the script in index.html
  const [role, setRole] = React.useState<Role | null>(null);

  // @ts-ignore - React is a global variable from the script in index.html
  const handleLoginSuccess = React.useCallback((credential: string) => {
    const payload = decodeJwt(credential);
    if (payload) {
      setUser({
        name: payload.name,
        email: payload.email,
        picture: payload.picture,
      });
    } else {
      // Handle login error, maybe show a notification
      alert("Error al iniciar sesión. Por favor, intente de nuevo.");
    }
  }, []);

  // @ts-ignore - React is a global variable from the script in index.html
  const handleLogout = React.useCallback(() => {
    setUser(null);
    setRole(null);
    // In a real app with Google Sign-In, you might also want to revoke the session
    // google.accounts.id.disableAutoSelect();
  }, []);

  const handleRoleSelection = (selectedRole: Role) => {
    setRole(selectedRole);
  }

  const handleReturnToRoleSelection = () => {
    setRole(null);
  }

  const renderContent = () => {
    if (!user) {
      return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
    }
    if (!role) {
      return <RoleSelectionScreen onSelectRole={handleRoleSelection} />;
    }
    return <RegistrationWorkflow user={user} role={role} onLogout={handleLogout} onReturnToRoleSelection={handleReturnToRoleSelection} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      <Header user={user} onLogout={handleLogout} />
      <main className="container mx-auto p-4 md:p-8">
        {renderContent()}
      </main>
      <footer className="text-center py-4 text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} Instituto Tecnológico de Durango. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};

export default App;
