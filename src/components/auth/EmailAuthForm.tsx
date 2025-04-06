import React, { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { X } from 'lucide-react';
import { useToast } from '../../components/ui/use-toast';

const EmailAuthForm: React.FC = () => {
  const { signIn, signUp, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      if (isSignUp) {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
    } catch (error) {
      console.error("Authentication error:", error);
      
      // Display user-friendly error message
      if (error instanceof Error) {
        if (error.message.includes('auth/invalid-email')) {
          setError("Please enter a valid email address.");
        } else if (error.message.includes('auth/user-not-found')) {
          setError("No account found with this email address.");
        } else if (error.message.includes('auth/wrong-password')) {
          setError("Incorrect password. Please try again.");
        } else if (error.message.includes('auth/email-already-in-use')) {
          setError("This email is already registered. Please sign in instead.");
        } else if (error.message.includes('auth/weak-password')) {
          setError("Password should be at least 6 characters long.");
        } else {
          setError(`Authentication error: ${error.message}`);
        }
      } else {
        setError("An unknown error occurred. Please try again later.");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription className="flex justify-between items-center">
            <span>{error}</span>
            <X className="h-4 w-4 cursor-pointer" onClick={() => setError(null)} />
          </AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {isSignUp ? 'Sign Up' : 'Sign In'}
      </Button>

      <div className="text-center">
        <button
          type="button"
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-sm text-muted-foreground hover:text-primary"
        >
          {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
        </button>
      </div>
    </form>
  );
};

export default EmailAuthForm;
