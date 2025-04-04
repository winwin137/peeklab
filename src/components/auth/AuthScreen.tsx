
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GithubAuthButton from './GithubAuthButton';
import GoogleAuthButton from './GoogleAuthButton';
import EmailAuthForm from './EmailAuthForm';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

// This version number should be updated whenever significant changes are made
const APP_VERSION = '1.6.0';

const AuthScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('social');
  const { createTestAccount, loading } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-peekdiet-light to-background">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">
            <span className="text-peekdiet-primary">Peek</span>
            <span className="text-peekdiet-accent">Diet</span>
          </CardTitle>
          <CardDescription className="text-center">
            Track your glucose response to meals with precision
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-center">
            <h3 className="text-xl font-semibold">Sign in to your account</h3>
            <p className="text-sm text-muted-foreground">
              Monitor your blood glucose levels and take control of your health
            </p>
          </div>

          <Tabs defaultValue="social" onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="social">Social</TabsTrigger>
              <TabsTrigger value="email">Email</TabsTrigger>
            </TabsList>
            <TabsContent value="social" className="space-y-4 pt-4">
              <GoogleAuthButton />
              <GithubAuthButton />
            </TabsContent>
            <TabsContent value="email" className="pt-4">
              <EmailAuthForm />
            </TabsContent>
          </Tabs>
          
          {/* Test Account Button */}
          <div className="pt-4 border-t">
            <Button 
              variant="outline" 
              className="w-full text-sm"
              onClick={createTestAccount}
              disabled={loading}
            >
              Use Test Account (test@peekdiet.com / Asdf1234!)
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-center text-muted-foreground">
            <p>By signing in, you agree to our terms of service and privacy policy.</p>
            <p className="mt-1 text-xs">Version {APP_VERSION}</p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AuthScreen;
