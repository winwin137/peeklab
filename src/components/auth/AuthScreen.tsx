import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GoogleAuthButton from './GoogleAuthButton';
import EmailAuthForm from './EmailAuthForm';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useDynamicHeight } from '@/hooks/useDynamicHeight';

// This version number should be updated whenever significant changes are made
const APP_VERSION = '1.6.0';

const AuthScreen: React.FC = () => {
  useDynamicHeight(); // Add dynamic height hook
  const [activeTab, setActiveTab] = useState<string>('email');
  const { createTestAccount, loading } = useAuth();
  const navigate = useNavigate();

  return (
    <div id="auth-container" className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-peekdiet-light to-background">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">
            {/* Removed PeekDiet text */}
          </CardTitle>
        </CardHeader>
        <div className="w-full flex justify-center mb-4">
          <iframe 
            width="560" 
            height="315" 
            src="https://www.youtube.com/embed/Q5liSXgmMF4?rel=0&loop=1&playlist=Q5liSXgmMF4&modestbranding=1&controls=1" 
            title="YouTube video player" 
            frameBorder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
            referrerPolicy="strict-origin-when-cross-origin" 
            allowFullScreen
            className="max-w-full"
          />
        </div>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="email">SCIENTIFIC METHODOLOGY FOR PERSONAL HEALTH</TabsTrigger>
            </TabsList>
            <TabsContent value="email">
              <EmailAuthForm />
            </TabsContent>
          </Tabs>

          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-center">
              <GoogleAuthButton />
            </div>

            <div className="text-center">
              <Button 
                variant="outline" 
                className="w-full text-sm"
                onClick={createTestAccount}
                disabled={loading}
              >
                Use Test Account (test@peekdiet.com / Asdf1234!)
              </Button>
            </div>
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
