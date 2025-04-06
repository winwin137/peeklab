import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { UserMeasurements } from '../../types/bodyFat';

interface BodyFatFormProps {
  onSubmit: (measurements: UserMeasurements) => void;
}

const BodyFatForm: React.FC<BodyFatFormProps> = ({ onSubmit }) => {
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [age, setAge] = useState<string>('');
  const [height, setHeight] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [unit, setUnit] = useState<'metric' | 'imperial'>('metric');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!age || isNaN(Number(age)) || Number(age) < 20 || Number(age) > 79) {
      newErrors.age = 'Please enter a valid age between 20 and 79';
    }

    if (!height || isNaN(Number(height)) || Number(height) <= 0) {
      newErrors.height = 'Please enter a valid height';
    }

    if (!weight || isNaN(Number(weight)) || Number(weight) <= 0) {
      newErrors.weight = 'Please enter a valid weight';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const measurements: UserMeasurements = {
      gender,
      age: Number(age),
      height: Number(height),
      weight: Number(weight),
      unit
    };

    onSubmit(measurements);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enter Your Measurements</CardTitle>
        <CardDescription>
          Please provide your details to calculate your body fat percentage
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label>Gender</Label>
            <RadioGroup
              value={gender}
              onValueChange={(value: 'male' | 'female') => setGender(value)}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="male" id="male" />
                <Label htmlFor="male">Male</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="female" id="female" />
                <Label htmlFor="female">Female</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>Unit System</Label>
            <Select
              value={unit}
              onValueChange={(value: 'metric' | 'imperial') => setUnit(value)}
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
            <Label htmlFor="age">Age</Label>
            <Input
              id="age"
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Enter your age (20-79)"
              min={20}
              max={79}
            />
            {errors.age && <p className="text-sm text-red-500">{errors.age}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="height">
              Height ({unit === 'metric' ? 'cm' : 'inches'})
            </Label>
            <Input
              id="height"
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder={`Enter your height in ${unit === 'metric' ? 'centimeters' : 'inches'}`}
              step="0.1"
            />
            {errors.height && <p className="text-sm text-red-500">{errors.height}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="weight">
              Weight ({unit === 'metric' ? 'kg' : 'lbs'})
            </Label>
            <Input
              id="weight"
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder={`Enter your weight in ${unit === 'metric' ? 'kilograms' : 'pounds'}`}
              step="0.1"
            />
            {errors.weight && <p className="text-sm text-red-500">{errors.weight}</p>}
          </div>

          <Button type="submit" className="w-full">
            Calculate Body Fat
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default BodyFatForm; 