
import React, { useState } from 'react';
import { INITIAL_DATA, AssessmentData } from './types';
import { PatientStep, GripStep, CS30Step, BalanceStep, FFDStep } from './components/StepWizard';
import { ResultView } from './components/ResultView';
import { Activity } from 'lucide-react';

const App: React.FC = () => {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<AssessmentData>(INITIAL_DATA);

  // 汎用データ更新ハンドラ
  const updateData = (key: string, value: any) => {
    setData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const nextStep = () => setStep((p) => p + 1);
  const prevStep = () => setStep((p) => p - 1);
  const resetApp = () => {
    setData(INITIAL_DATA);
    setStep(0);
  };

  const renderStep = () => {
    switch (step) {
      case 0: return <PatientStep data={data} updateData={updateData} onNext={nextStep} onBack={prevStep} />;
      case 1: return <GripStep data={data} updateData={updateData} onNext={nextStep} onBack={prevStep} />;
      case 2: return <CS30Step data={data} updateData={updateData} onNext={nextStep} onBack={prevStep} />;
      case 3: return <BalanceStep data={data} updateData={updateData} onNext={nextStep} onBack={prevStep} />;
      case 4: return <FFDStep data={data} updateData={updateData} onNext={nextStep} onBack={prevStep} />;
      case 5: return <ResultView data={data} onReset={resetApp} />;
      default: return <div>Error</div>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 print:bg-white print:pb-0">
      {/* Navbar (印刷時は非表示) */}
      <nav className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50 no-print">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-700 font-bold text-xl">
            <Activity />
            <span>CorpPhysioCheck</span>
          </div>
          <div className="text-xs text-slate-500">
            {step < 5 ? `Step ${step + 1} / 5` : 'Result'}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-8 print:p-0 print:max-w-none">
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-10 min-h-[500px] transition-all print:shadow-none print:p-0 print:min-h-0">
          {renderStep()}
        </div>
      </main>

      {/* Footer (No Print) */}
      <footer className="text-center text-slate-400 text-sm py-8 no-print">
        <p>企業向け体力測定システム Ver 3.0</p>
      </footer>
    </div>
  );
};

export default App;
