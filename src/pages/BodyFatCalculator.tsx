import React, { useState } from 'react';
import BodyFatForm from '../components/onboarding/BodyFatForm';
import BodyFatResults from '../components/onboarding/BodyFatResults';
import { UserMeasurements, BodyFatResult } from '../types/bodyFat';
import { calculateBodyFat } from '../utils/bodyFat';

const BodyFatCalculator: React.FC = () => {
  const [showResults, setShowResults] = useState(false);
  const [measurements, setMeasurements] = useState<UserMeasurements | null>(null);
  const [result, setResult] = useState<BodyFatResult | null>(null);

  const handleFormSubmit = (userMeasurements: UserMeasurements) => {
    const bodyFatResult = calculateBodyFat(userMeasurements);
    setMeasurements(userMeasurements);
    setResult(bodyFatResult);
    setShowResults(true);
  };

  const handleBack = () => {
    setShowResults(false);
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Body Fat Calculator</h1>
      <div className="max-w-2xl mx-auto">
        {!showResults ? (
          <BodyFatForm onSubmit={handleFormSubmit} />
        ) : (
          result && <BodyFatResults result={result} onBack={handleBack} />
        )}
      </div>
    </div>
  );
};

export default BodyFatCalculator; 