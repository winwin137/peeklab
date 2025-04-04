
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import AuthScreen from '@/components/auth/AuthScreen';
import Dashboard from './Dashboard';
import { CloudOff } from 'lucide-react';

const Index: React.FC = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 rounded-full bg-peekdiet-secondary"></div>
          <div className="mt-4 h-4 w-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <AuthScreen />;
  }
  
  return <Dashboard />;
};

export default Index;
