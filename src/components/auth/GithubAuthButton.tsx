
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Github } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { X } from 'lucide-react';

const GithubAuthButton: React.FC = () => {
  const { signInWithGithub, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const handleGithubSignIn = async () => {
    try {
      setError(null);
      await signInWithGithub();
    } catch (error) {
      console.error("Failed to sign in with GitHub:", error);
      
      // Display user-friendly error message
      if (error instanceof Error) {
        if (error.message.includes('auth/unauthorized-domain')) {
          setError("This domain is not authorized for GitHub sign-in. Please add it to your Firebase authentication settings.");
        } else if (error.message.includes('auth/popup-closed-by-user')) {
          setError("Sign-in popup was closed. Please try again.");
        } else if (error.message.includes('auth/popup-blocked')) {
          setError("Sign-in popup was blocked by your browser. Please allow popups for this site.");
        } else {
          setError(`Authentication error: ${error.message}`);
        }
      } else {
        setError("An unknown error occurred. Please try again later.");
      }
    }
  };

  return (
    <div className="space-y-2 w-full">
      {error && (
        <Alert variant="destructive" className="mb-2">
          <AlertDescription className="flex justify-between items-center">
            <span>{error}</span>
            <X className="h-4 w-4 cursor-pointer" onClick={() => setError(null)} />
          </AlertDescription>
        </Alert>
      )}
      <Button 
        variant="outline" 
        onClick={handleGithubSignIn} 
        disabled={loading}
        className="w-full flex items-center gap-2"
      >
        <Github className="h-5 w-5" />
        Sign in with GitHub
      </Button>
    </div>
  );
};

export default GithubAuthButton;
