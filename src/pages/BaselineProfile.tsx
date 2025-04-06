import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserCog, Edit2, Save } from 'lucide-react';
import { useToast } from '../components/ui/use-toast';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

interface BaselineProfileData {
  height: number;
  weight: number;
  age: number;
  gender: 'male' | 'female';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goal: 'weight_loss' | 'maintenance' | 'muscle_gain';
  unit: 'metric' | 'imperial';
}

const BaselineProfile: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [originalProfile, setOriginalProfile] = useState<BaselineProfileData>({
    height: 0,
    weight: 0,
    age: 0,
    gender: 'male',
    activityLevel: 'moderate',
    goal: 'maintenance',
    unit: 'metric'
  });
  const [profile, setProfile] = useState<BaselineProfileData>({ ...originalProfile });

  // Load profile data on mount
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      
      try {
        const profileRef = doc(db, 'users', user.uid);
        const profileSnap = await getDoc(profileRef);
        
        if (profileSnap.exists()) {
          const data = profileSnap.data() as BaselineProfileData;
          setOriginalProfile(data);
          setProfile(data);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [user, toast]);

  // Check for changes whenever profile is updated
  useEffect(() => {
    const hasChanged = Object.keys(profile).some(
      key => profile[key as keyof BaselineProfileData] !== originalProfile[key as keyof BaselineProfileData]
    );
    setHasChanges(hasChanged);
  }, [profile, originalProfile]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setProfile({ ...originalProfile });
    setIsEditing(false);
    setHasChanges(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const profileRef = doc(db, 'users', user.uid);
      await setDoc(profileRef, profile, { merge: true });
      
      setOriginalProfile({ ...profile });
      setIsEditing(false);
      setHasChanges(false);
      
      toast({
        title: "Profile Saved",
        description: "Your baseline profile has been successfully saved.",
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to save profile data",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            <CardTitle>Baseline Profile</CardTitle>
          </div>
          {!isEditing ? (
            <Button variant="outline" size="sm" onClick={handleEdit}>
              <Edit2 className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={handleCancel}>
              Cancel
            </Button>
          )}
        </CardHeader>
        <CardDescription className="px-6">
          Set up your baseline health metrics and goals
        </CardDescription>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label>Measurement Units</Label>
              <Select
                value={profile.unit}
                onValueChange={(value: 'metric' | 'imperial') => 
                  setProfile({ ...profile, unit: value })
                }
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select unit system" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="metric">Metric (cm, kg)</SelectItem>
                  <SelectItem value="imperial">Imperial (inches, lbs)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Gender</Label>
              <Select
                value={profile.gender}
                onValueChange={(value: 'male' | 'female') => 
                  setProfile({ ...profile, gender: value })
                }
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                value={profile.age || ''}
                onChange={(e) => setProfile({ ...profile, age: Number(e.target.value) })}
                placeholder="Enter your age"
                min={18}
                max={120}
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="height">
                Height ({profile.unit === 'metric' ? 'cm' : 'inches'})
              </Label>
              <Input
                id="height"
                type="number"
                value={profile.height || ''}
                onChange={(e) => setProfile({ ...profile, height: Number(e.target.value) })}
                placeholder={`Enter your height in ${profile.unit === 'metric' ? 'centimeters' : 'inches'}`}
                step="0.1"
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">
                Weight ({profile.unit === 'metric' ? 'kg' : 'lbs'})
              </Label>
              <Input
                id="weight"
                type="number"
                value={profile.weight || ''}
                onChange={(e) => setProfile({ ...profile, weight: Number(e.target.value) })}
                placeholder={`Enter your weight in ${profile.unit === 'metric' ? 'kilograms' : 'pounds'}`}
                step="0.1"
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label>Activity Level</Label>
              <Select
                value={profile.activityLevel}
                onValueChange={(value: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active') => 
                  setProfile({ ...profile, activityLevel: value })
                }
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select activity level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sedentary">Sedentary (little or no exercise)</SelectItem>
                  <SelectItem value="light">Light (1-3 days/week)</SelectItem>
                  <SelectItem value="moderate">Moderate (3-5 days/week)</SelectItem>
                  <SelectItem value="active">Active (6-7 days/week)</SelectItem>
                  <SelectItem value="very_active">Very Active (twice per day)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Goal</Label>
              <Select
                value={profile.goal}
                onValueChange={(value: 'weight_loss' | 'maintenance' | 'muscle_gain') => 
                  setProfile({ ...profile, goal: value })
                }
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your goal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weight_loss">Weight Loss</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="muscle_gain">Muscle Gain</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isEditing && (
              <Button 
                type="submit" 
                className="w-full"
                disabled={!hasChanges}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default BaselineProfile; 