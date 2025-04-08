import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const About: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-center">
        Metabolic Tracking: Your Personal Health Insights
      </h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Why This App is a Game-Changer for Personal Health</CardTitle>
        </CardHeader>
        <CardContent>
          <h2 className="text-2xl font-semibold mb-4">Structured Testing = Clamp-Like Rigor</h2>
          <ul className="list-disc pl-6 mb-6">
            <li>The <strong>6 readings over 3 hours</strong> mirror the frequency of research-grade clamp studies, capturing:</li>
            <li><strong>First-phase insulin response</strong> (30–60 mins post-meal)</li>
            <li><strong>Second-phase insulin action</strong> (2–3 hours post-meal)</li>
            <li>Unlike sporadic testing, this protocol detects <strong>delayed glucose clearance</strong> (a hallmark of insulin resistance)</li>
          </ul>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Who Should Use It?</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-6">
            <li><strong>Prediabetics/Diabetics</strong>: Catch post-meal spikes masked by normal fasting glucose</li>
            <li><strong>Biohackers</strong>: Optimize diets for metabolic flexibility</li>
            <li><strong>Athletes</strong>: Fine-tune carb tolerance for performance</li>
            <li><strong>Anyone with "Unexplained" Fatigue/Brain Fog</strong>: Hidden hyperglycemia could be the culprit</li>
          </ul>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>How to Get the Most Out of It</CardTitle>
        </CardHeader>
        <CardContent>
          <h3 className="text-xl font-semibold mb-4">Test 3–5 Signature Meals</h3>
          <ul className="list-disc pl-6 mb-6">
            <li>High-carb (e.g., rice)</li>
            <li>High-fat (e.g., avocado + nuts)</li>
            <li>Mixed (e.g., pizza)</li>
          </ul>

          <h3 className="text-xl font-semibold mb-4">Intervene Based on Data</h3>
          <ul className="list-disc pl-6">
            <li>If glucose &gt;140 mg/dL at 1 hour → try vinegar before meals or walking post-meal</li>
            <li>If glucose stays high at 3 hours → reduce carb portion size</li>
          </ul>
        </CardContent>
      </Card>

      <Separator className="my-8" />

      <div className="text-center">
        <h2 className="text-3xl font-bold mb-4">Final Verdict</h2>
        <p className="text-lg mb-6">
          This app is <strong>one of the best practical tools</strong> for metabolic self-awareness outside a lab. 
          While not a true clamp, it brings <strong>scientific methodology to personal health</strong>—letting users 
          detect dysfunction early and intervene.
        </p>
        <p className="text-lg font-semibold">
          Recommendation: Use it alongside <strong>fasting insulin tests</strong> and <strong>ketone monitoring</strong>. 
          For proactive individuals, this is a <strong>no-brainer</strong>.
        </p>
      </div>
    </div>
  );
};

export default About;
