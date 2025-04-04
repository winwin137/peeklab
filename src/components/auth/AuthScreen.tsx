
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import GithubAuthButton from './GithubAuthButton';

const AuthScreen: React.FC = () => {
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
          <GithubAuthButton />
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-center text-muted-foreground">
            <p>By signing in, you agree to our terms of service and privacy policy.</p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AuthScreen;
