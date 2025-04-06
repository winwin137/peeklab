import React, { useState } from 'react';
import BodyFatForm from '@/components/onboarding/BodyFatForm';
import BodyFatResults from '@/components/onboarding/BodyFatResults';
import { BodyFatResult, UserMeasurements } from '@/types/bodyFat';
import { calculateBodyFat } from '@/utils/bodyFat';

const BodyFatOnboarding: React.FC = () => {
  const [showResults, setShowResults] = useState(false);
  const [measurements, setMeasurements] = useState<UserMeasurements | null>(null);
  const [result, setResult] = useState<BodyFatResult | null>(null);

  const handleFormSubmit = (userMeasurements: UserMeasurements) => {
    const bodyFatResult = calculateBodyFat(userMeasurements);
    setMeasurements(userMeasurements);
    setResult(bodyFatResult);
    setShowResults(true);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Body Fat Calculator</h1>
          <p className="text-muted-foreground">
            Calculate your body fat percentage and understand your health metrics
          </p>
        </div>

        {!showResults ? (
          <BodyFatForm onSubmit={handleFormSubmit} />
        ) : (
          <div className="space-y-8">
            {measurements && result && (
              <BodyFatResults measurements={measurements} result={result} />
            )}
            <div className="text-center">
              <button
                onClick={() => setShowResults(false)}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Calculate Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BodyFatOnboarding; 