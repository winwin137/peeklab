import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { User, LogOut } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [glucoseUnit, setGlucoseUnit] = useState<'mg/dL' | 'mmol/L'>('mg/dL');

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Settings
          </CardTitle>
          <CardDescription>
            Manage your account settings and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={user.email || ''}
              disabled
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              type="text"
              value={user.displayName || ''}
              disabled
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notifications</Label>
              <p className="text-sm text-gray-500">
                Receive alerts for meal cycle readings
              </p>
            </div>
            <Switch
              checked={notificationsEnabled}
              onCheckedChange={setNotificationsEnabled}
            />
          </div>

          <div className="space-y-2">
            <Label>Glucose Unit</Label>
            <div className="flex gap-4">
              <Button
                variant={glucoseUnit === 'mg/dL' ? 'default' : 'outline'}
                onClick={() => setGlucoseUnit('mg/dL')}
              >
                mg/dL
              </Button>
              <Button
                variant={glucoseUnit === 'mmol/L' ? 'default' : 'outline'}
                onClick={() => setGlucoseUnit('mmol/L')}
              >
                mmol/L
              </Button>
            </div>
          </div>

          <div className="pt-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Log Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile; 