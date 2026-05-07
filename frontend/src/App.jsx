import { useState } from 'react';
import { SetupPage } from '@/components/setup-page';
import { LabelingApp } from '@/components/labeling-app';

export default function App() {
  const [setupData, setSetupData] = useState(null);

  if (!setupData) {
    return <SetupPage onContinue={setSetupData} />;
  }

  return (
    <LabelingApp
      initialFiles={setupData.files}
      selectedModel={setupData.model}
      onBack={() => setSetupData(null)}
    />
  );
}
