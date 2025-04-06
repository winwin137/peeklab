import React from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { GlucoseReading } from '../../types';

interface AdHocReadingCardProps {
  reading: GlucoseReading;
}

const AdHocReadingCard: React.FC<AdHocReadingCardProps> = ({ reading }) => {
  return (
    <Card className="opacity-90">
      <CardHeader>
        <CardTitle>
          {format(reading.timestamp, 'PPP p')}
        </CardTitle>
        <CardDescription>
          Ad Hoc Reading
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-1 text-xs">
          <div className="text-muted-foreground text-right">Value:</div>
          <div className="font-semibold">
            {reading.value} mg/dL
          </div>
          
          <div className="text-muted-foreground text-right">Type:</div>
          <div className="font-semibold capitalize">
            {reading.type}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdHocReadingCard; 