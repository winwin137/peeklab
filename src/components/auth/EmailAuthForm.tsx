
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { X } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

type AuthMode = 'login' | 'register';

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

const registerSchema = loginSchema.extend({
  displayName: z.string().min(2, { message: "Display name must be at least 2 characters" }),
  confirmPassword: z.string().min(6, { message: "Password must be at least 6 characters" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const EmailAuthForm: React.FC = () => {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const { signInWithEmail, registerWithEmail, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      displayName: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onLoginSubmit = async (values: z.infer<typeof loginSchema>) => {
    try {
      setError(null);
      console.log("Login attempt with email:", values.email);
      await signInWithEmail(values.email, values.password);
    } catch (error) {
      console.error("Login error:", error);
      
      if (error instanceof Error) {
        // Handle specific Firebase auth errors
        if (error.message.includes('auth/user-not-found') || error.message.includes('auth/wrong-password')) {
          setError("Invalid email or password. Please try again.");
        } else if (error.message.includes('auth/too-many-requests')) {
          setError("Too many unsuccessful login attempts. Please try again later or reset your password.");
        } else {
          setError(`Login error: ${error.message}`);
        }
      } else {
        setError("An unknown error occurred. Please try again later.");
      }
    }
  };

  const onRegisterSubmit = async (values: z.infer<typeof registerSchema>) => {
    try {
      setError(null);
      console.log("Registration attempt with email:", values.email);
      await registerWithEmail(values.email, values.password, values.displayName);
    } catch (error) {
      console.error("Registration error:", error);
      
      if (error instanceof Error) {
        // Handle specific Firebase auth errors
        if (error.message.includes('auth/email-already-in-use')) {
          setError("This email is already in use. Please try a different email or sign in.");
        } else if (error.message.includes('auth/invalid-email')) {
          setError("Invalid email address. Please check and try again.");
        } else if (error.message.includes('auth/weak-password')) {
          setError("Password is too weak. Please choose a stronger password.");
        } else {
          setError(`Registration error: ${error.message}`);
        }
      } else {
        setError("An unknown error occurred. Please try again later.");
      }
    }
  };

  const toggleAuthMode = () => {
    setError(null);
    setAuthMode(authMode === 'login' ? 'register' : 'login');
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-center border-b pb-2">
        <Mail className="mr-2 h-5 w-5" />
        <span>{authMode === 'login' ? 'Sign in with Email' : 'Create an Account'}</span>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-2">
          <AlertDescription className="flex justify-between items-center">
            <span>{error}</span>
            <X className="h-4 w-4 cursor-pointer" onClick={() => setError(null)} />
          </AlertDescription>
        </Alert>
      )}

      {authMode === 'login' ? (
        <Form {...loginForm}>
          <form onSubmit={(e) => {
            e.preventDefault();
            loginForm.handleSubmit(onLoginSubmit)(e);
          }} className="space-y-4">
            <FormField
              control={loginForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="email@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={loginForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              Sign In
            </Button>
          </form>
        </Form>
      ) : (
        <Form {...registerForm}>
          <form onSubmit={(e) => {
            e.preventDefault();
            registerForm.handleSubmit(onRegisterSubmit)(e);
          }} className="space-y-4">
            <FormField
              control={registerForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="email@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={registerForm.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={registerForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={registerForm.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              Create Account
            </Button>
          </form>
        </Form>
      )}

      <div className="text-center">
        <Button variant="link" onClick={toggleAuthMode} className="text-xs">
          {authMode === 'login'
            ? "Don't have an account? Sign up"
            : "Already have an account? Sign in"}
        </Button>
      </div>
    </div>
  );
};

export default EmailAuthForm;
