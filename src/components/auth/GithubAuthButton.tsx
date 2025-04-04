
import React from 'react';
import { Button } from '@/components/ui/button';
import { Github } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const GithubAuthButton: React.FC = () => {
  const { signInWithGithub, loading } = useAuth();

  return (
    <Button 
      variant="outline" 
      onClick={signInWithGithub} 
      disabled={loading}
      className="w-full flex items-center gap-2"
    >
      <Github className="h-5 w-5" />
      Sign in with GitHub
    </Button>
  );
};

export default GithubAuthButton;
