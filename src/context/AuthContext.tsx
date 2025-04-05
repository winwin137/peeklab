import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  AuthError
} from 'firebase/auth';
import { auth, githubProvider, googleProvider } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGithub: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  createTestAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log("Auth state changed:", currentUser ? `User: ${currentUser.displayName}` : "No user");
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGithub = async () => {
    try {
      setLoading(true);
      console.log("Starting GitHub sign-in process");
      const result = await signInWithPopup(auth, githubProvider);
      console.log("GitHub sign-in successful", result.user.displayName);
      toast({
        title: "Success",
        description: "You are now signed in!",
      });
    } catch (error) {
      console.error("GitHub sign-in error:", error);
      const authError = error as AuthError;
      toast({
        title: "Error signing in with GitHub",
        description: authError.code || (error instanceof Error ? error.message : "Unknown error"),
        variant: "destructive",
      });
      throw error; // Rethrow for component level handling
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      console.log("Starting Google sign-in process");
      const result = await signInWithPopup(auth, googleProvider);
      console.log("Google sign-in successful", result.user.displayName);
      toast({
        title: "Success",
        description: "You are now signed in with Google!",
      });
    } catch (error) {
      console.error("Google sign-in error:", error);
      const authError = error as AuthError;
      toast({
        title: "Error signing in with Google",
        description: authError.code || (error instanceof Error ? error.message : "Unknown error"),
        variant: "destructive",
      });
      throw error; // Rethrow for component level handling
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log("Starting email sign-in for:", email);
      await signInWithEmailAndPassword(auth, email, password);
      console.log("Email sign-in successful");
      toast({
        title: "Success",
        description: "You are now signed in!",
      });
    } catch (error) {
      console.error("Email sign-in error:", error);
      const authError = error as AuthError;
      toast({
        title: "Error signing in",
        description: authError.code || (error instanceof Error ? error.message : "Unknown error"),
        variant: "destructive",
      });
      throw error; // Rethrow for component level handling
    } finally {
      setLoading(false);
    }
  };

  const registerWithEmail = async (email: string, password: string, displayName: string) => {
    try {
      setLoading(true);
      console.log("Starting email registration for:", email);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update the user's profile with display name
      if (userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: displayName
        });
        console.log("User profile updated with display name:", displayName);
      }
      
      toast({
        title: "Account created",
        description: "Your account has been created successfully!",
      });
    } catch (error) {
      console.error("Email registration error:", error);
      const authError = error as AuthError;
      toast({
        title: "Error creating account",
        description: authError.code || (error instanceof Error ? error.message : "Unknown error"),
        variant: "destructive",
      });
      throw error; // Rethrow for component level handling
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      console.log("Signing out user");
      await firebaseSignOut(auth);
      console.log("User signed out successfully");
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
    } catch (error) {
      console.error("Sign out error:", error);
      toast({
        title: "Error signing out",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  // Function to create a test account with predefined credentials
  const createTestAccount = async () => {
    try {
      setLoading(true);
      const testEmail = "test@peekdiet.com";
      const testPassword = "Asdf1234!";
      const testDisplayName = "Test User";
      
      console.log("Creating test account with:", testEmail);
      
      try {
        // Try to create a new user
        const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
        
        // Update the user's profile with display name
        if (userCredential.user) {
          await updateProfile(userCredential.user, {
            displayName: testDisplayName
          });
          console.log("Test account created successfully:", testDisplayName);
          
          toast({
            title: "Test Account Created",
            description: `Email: ${testEmail}, Password: ${testPassword}`,
          });
        }
      } catch (createError: any) {
        // If the user already exists, just try to sign in
        if (createError.code === 'auth/email-already-in-use') {
          console.log("Test account already exists, signing in...");
          await signInWithEmail(testEmail, testPassword);
          toast({
            title: "Using Existing Test Account",
            description: `Signed in with Email: ${testEmail}, Password: ${testPassword}`,
          });
        } else {
          throw createError;
        }
      }
    } catch (error) {
      console.error("Test account error:", error);
      const authError = error as AuthError;
      toast({
        title: "Error creating test account",
        description: authError.code || (error instanceof Error ? error.message : "Unknown error"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGithub,
        signInWithGoogle,
        signInWithEmail,
        registerWithEmail,
        signOut,
        createTestAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
