
import React, { useState, useEffect } from 'react';
import { AssessmentData, Gender } from '../types';
import { Play, Pause, RotateCcw, AlertTriangle, Info, ArrowRight } from 'lucide-react';

interface StepProps {
  data: AssessmentData;
  updateData: (key: keyof AssessmentData | 'patient' | string, value: any) => void;
  onNext: () => void;
  onBack: () => void;
}

// ヘルパー：深い階層のデータ更新用
const updateNested = (data: AssessmentData, path: string[], value: any) => {
  const newData = { ...data };
  let current: any = newData;
  for (let i = 0; i < path.length - 1; i++) {
    current = current[path[i]];
  }
  current[path[path.length - 1]] = value;
  return newData;
};

// 1. 基本情報入力
export const PatientStep: React.FC<StepProps> = ({ data, updateData, onNext }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    updateData('patient', { ...data.patient, [e.target.name]: e.target.value });
  };

  const isFormValid = data.patient.company && data.patient.name && data.patient.age;

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-slate-800 border-b pb-2">基本情報入力</h2>
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">企業名 <span className="text-red-500">*</span></label>
          <input type="text" name="company" value={data.patient.company} onChange={handleChange} className="w-full p-2 border rounded bg-white text-slate-900" placeholder="例: 株式会社〇〇" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">社員番号 (任意)</label>
            <input type="text" name="id" value={data.patient.id} onChange={handleChange} className="w-full p-2 border rounded bg-white text-slate-900" placeholder="例: 1001" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">氏名 <span className="text-red-500">*</span></label>
            <input type="text" name="name" value={data.patient.name} onChange={handleChange} className="w-full p-2 border rounded bg-white text-slate-900" placeholder="例: 山田 太郎" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">年齢 <span className="text-red-500">*</span></label>
            <input type="number" name="age" value={data.patient.age} onChange={handleChange} className="w-full p-2 border rounded bg-white text-slate-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">性別</label>
            <select name="gender" value={data.patient.gender} onChange={handleChange} className="w-full p-2 border rounded bg-white text-slate-900">
              <option value="male">男性</option>
              <option value="female">女性</option>
            </select>
          </div>
        </div>
      </div>
      <button onClick={onNext} disabled={!isFormValid} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition shadow-md disabled:bg-slate-300">次へ進む</button>
    </div>
  );
};

// 2. 握力測定 (左右 × 2回)
export const GripStep: React.FC<StepProps> = ({ data, updateData, onNext, onBack }) => {
  const updateGrip = (side: 'right' | 'left', attempt: 'first' | 'second', val: string) => {
    const num = val === '' ? null : parseFloat(val);
    const newData = JSON.parse(JSON.stringify(data)); // Deep copy
    newData.gripStrength[side][attempt] = num;
    // updateData prop cannot handle deep merge easily, so pass full object logic needs to be in App.tsx 
    // BUT here we can use a wrapper or just expect updateData to accept full replace if key is empty?
    // Let's assume updateData can handle 'gripStrength' key with full object.
    updateData('gripStrength', newData.gripStrength);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800 border-b pb-2">1. 握力 (Grip Strength)</h2>
      
      <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
        <h3 className="font-bold flex items-center gap-2"><Info size={18}/> 測定プロトコル</h3>
        <ul className="list-disc ml-5 mt-1 space-y-1">
          <li>直立姿勢で、腕を自然に下げて測定します。</li>
          <li>左右それぞれ2回ずつ測定し、最も良い値を記録として採用します。</li>
        </ul>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* 右手 */}
        <div className="bg-white p-4 rounded border shadow-sm">
          <h3 className="font-bold text-center mb-3 text-slate-700">右手 (kg)</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-500">1回目</label>
              <input 
                type="number" step="0.1"
                value={data.gripStrength.right.first ?? ''} 
                onChange={(e) => updateGrip('right', 'first', e.target.value)} 
                className="w-full p-2 border rounded bg-white text-slate-900 text-center text-lg" placeholder="0.0"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">2回目</label>
              <input 
                type="number" step="0.1"
                value={data.gripStrength.right.second ?? ''} 
                onChange={(e) => updateGrip('right', 'second', e.target.value)} 
                className="w-full p-2 border rounded bg-white text-slate-900 text-center text-lg" placeholder="0.0"
              />
            </div>
          </div>
        </div>
        {/* 左手 */}
        <div className="bg-white p-4 rounded border shadow-sm">
          <h3 className="font-bold text-center mb-3 text-slate-700">左手 (kg)</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-500">1回目</label>
              <input 
                type="number" step="0.1"
                value={data.gripStrength.left.first ?? ''} 
                onChange={(e) => updateGrip('left', 'first', e.target.value)} 
                className="w-full p-2 border rounded bg-white text-slate-900 text-center text-lg" placeholder="0.0"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">2回目</label>
              <input 
                type="number" step="0.1"
                value={data.gripStrength.left.second ?? ''} 
                onChange={(e) => updateGrip('left', 'second', e.target.value)} 
                className="w-full p-2 border rounded bg-white text-slate-900 text-center text-lg" placeholder="0.0"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <button onClick={onBack} className="flex-1 bg-slate-200 text-slate-700 py-3 rounded-lg font-bold hover:bg-slate-300">戻る</button>
        <button onClick={onNext} className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 shadow-md">次へ</button>
      </div>
    </div>
  );
};

// 3. CS-30 (2回測定対応)
export const CS30Step: React.FC<StepProps> = ({ data, updateData, onNext, onBack }) => {
  const updateRecord = (attempt: 'first' | 'second', val: string) => {
    const num = val === '' ? null : parseFloat(val); // 小数点も許容する要望対応
    const newData = JSON.parse(JSON.stringify(data.cs30));
    newData[attempt] = num;
    updateData('cs30', newData);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800 border-b pb-2">2. CS-30 (立ち上がりテスト)</h2>
      
      <div className="bg-slate-100 p-4 rounded-lg text-sm text-slate-800 border border-slate-200">
        <h3 className="font-bold flex items-center gap-2"><Info size={18}/> 測定プロトコル</h3>
        <ul className="list-disc ml-5 mt-1 space-y-1">
          <li>椅子（高さ40cm）に座り、胸の前で腕組みをします。</li>
          <li>30秒間で「完全に立つ」「完全に座る」を繰り返した回数を測定します。</li>
          <li><span className="font-bold text-red-600">基本測定は2回行い</span>、良い方の記録を採用します。</li>
        </ul>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 border rounded bg-white">
          <label className="block text-sm font-bold text-slate-700 mb-2">1回目 (回)</label>
          <input 
            type="number" step="1"
            value={data.cs30.first ?? ''} 
            onChange={(e) => updateRecord('first', e.target.value)} 
            className="w-full p-3 text-2xl text-center border rounded bg-white text-slate-900" placeholder="0"
          />
        </div>
        <div className="p-4 border rounded bg-white">
          <label className="block text-sm font-bold text-slate-700 mb-2">2回目 (回)</label>
          <input 
            type="number" step="1"
            value={data.cs30.second ?? ''} 
            onChange={(e) => updateRecord('second', e.target.value)} 
            className="w-full p-3 text-2xl text-center border rounded bg-white text-slate-900" placeholder="0"
          />
        </div>
      </div>

      <div className="flex gap-4">
        <button onClick={onBack} className="flex-1 bg-slate-200 text-slate-700 py-3 rounded-lg font-bold hover:bg-slate-300">戻る</button>
        <button onClick={onNext} className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 shadow-md">次へ</button>
      </div>
    </div>
  );
};

// 4. 閉眼片脚立位 (2回測定、小数入力)
export const BalanceStep: React.FC<StepProps> = ({ data, updateData, onNext, onBack }) => {
  const updateRecord = (attempt: 'first' | 'second', val: string) => {
    const num = val === '' ? null : parseFloat(val);
    const newData = JSON.parse(JSON.stringify(data.balanceTime));
    newData[attempt] = num;
    updateData('balanceTime', newData);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800 border-b pb-2">3. 閉眼片脚立位 (バランス)</h2>
      
      <div className="bg-red-50 p-4 rounded-lg text-sm text-red-800 border border-red-200">
        <h3 className="font-bold flex items-center gap-2"><AlertTriangle size={18}/> 安全管理徹底</h3>
        <p className="mt-1">
          必ず壁や手すりの近くで実施し、いつでも支えられる状態で測定してください。転倒リスクが高い場合は開眼で実施し、その旨を記録してください。
        </p>
      </div>

      <div className="bg-blue-50 p-3 rounded text-sm text-blue-900 mb-2">
        <Info size={16} className="inline mr-1"/>
        <span className="font-bold">秒数は「10.0」のように小数点第1位まで</span>入力してください。
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 border rounded bg-white">
          <label className="block text-sm font-bold text-slate-700 mb-2">1回目 (秒)</label>
          <input 
            type="number" step="0.1"
            value={data.balanceTime.first ?? ''} 
            onChange={(e) => updateRecord('first', e.target.value)} 
            className="w-full p-3 text-2xl text-center border rounded bg-white text-slate-900" placeholder="0.0"
          />
        </div>
        <div className="p-4 border rounded bg-white">
          <label className="block text-sm font-bold text-slate-700 mb-2">2回目 (秒)</label>
          <input 
            type="number" step="0.1"
            value={data.balanceTime.second ?? ''} 
            onChange={(e) => updateRecord('second', e.target.value)} 
            className="w-full p-3 text-2xl text-center border rounded bg-white text-slate-900" placeholder="0.0"
          />
        </div>
      </div>

      <div className="flex gap-4">
        <button onClick={onBack} className="flex-1 bg-slate-200 text-slate-700 py-3 rounded-lg font-bold hover:bg-slate-300">戻る</button>
        <button onClick={onNext} className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 shadow-md">次へ</button>
      </div>
    </div>
  );
};

// 5. FFD (2回測定、小数入力)
export const FFDStep: React.FC<StepProps> = ({ data, updateData, onNext, onBack }) => {
  const updateRecord = (attempt: 'first' | 'second', val: string) => {
    const num = val === '' ? null : parseFloat(val);
    const newData = JSON.parse(JSON.stringify(data.ffd));
    newData[attempt] = num;
    updateData('ffd', newData);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800 border-b pb-2">4. 指床間距離 (FFD)</h2>
      
      <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
        <h3 className="font-bold flex items-center gap-2"><Info size={18}/> 測定プロトコル</h3>
        <ul className="list-disc ml-5 mt-1 space-y-1">
          <li>30cm程度の台上で立位体前屈を行います。</li>
          <li>指先が床に届かない場合をプラス(+)、通り越した場合をマイナス(-)で記録します。</li>
          <li>2回実施し、良い方（値が小さい方）を採用します。</li>
        </ul>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 border rounded bg-white">
          <label className="block text-sm font-bold text-slate-700 mb-2">1回目 (cm)</label>
          <input 
            type="number" step="0.1"
            value={data.ffd.first ?? ''} 
            onChange={(e) => updateRecord('first', e.target.value)} 
            className="w-full p-3 text-2xl text-center border rounded bg-white text-slate-900" placeholder="+5.5 / -2.0"
          />
        </div>
        <div className="p-4 border rounded bg-white">
          <label className="block text-sm font-bold text-slate-700 mb-2">2回目 (cm)</label>
          <input 
            type="number" step="0.1"
            value={data.ffd.second ?? ''} 
            onChange={(e) => updateRecord('second', e.target.value)} 
            className="w-full p-3 text-2xl text-center border rounded bg-white text-slate-900" placeholder="+5.5 / -2.0"
          />
        </div>
      </div>

      <div className="flex gap-4">
        <button onClick={onBack} className="flex-1 bg-slate-200 text-slate-700 py-3 rounded-lg font-bold hover:bg-slate-300">戻る</button>
        <button onClick={onNext} className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 shadow-lg">結果を見る</button>
      </div>
    </div>
  );
};
