import React, { useState, useCallback } from 'react';
import { User } from './types.ts';
import Header from './components/Header.tsx';
import LoginScreen from './components/LoginScreen.tsx';
import RegistrationWorkflow from './components/RegistrationWorkflow.tsx';
import RoleSelectionScreen from './components/RoleSelectionScreen.tsx';

type Role = 'participant' | 'instructor';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);

  const handleLogin = useCallback(() => {
    // This is a mock login. In a real app, this would involve an OAuth flow.
    setUser({
      name: 'Usuario de Prueba',
      email: 'test.user@itdurango.edu.mx',
      imageUrl: `https://picsum.photos/seed/testuser/100/100`,
    });
  }, []);

  const handleLogout = useCallback(() => {
    setUser(null);
    setRole(null);
  }, []);

  const handleRoleSelection = (selectedRole: Role) => {
    setRole(selectedRole);
  }

  const handleReturnToRoleSelection = () => {
    setRole(null);
  }

  const renderContent = () => {
    if (!user) {
      return <LoginScreen onLogin={handleLogin} />;
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