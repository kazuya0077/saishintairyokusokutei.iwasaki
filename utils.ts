
import { AssessmentData, RiskResult, AgeGroup } from './types';

// GASのWebアプリURLを設定してください
const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbwvXbtzKjGnF6Xy3LWsRVm8Uswa97OR7ixdGhNer_3D5TOK9ntUqj-hmeDq9VLKnOTeQw/exec'; 

// ■ 年代区分判定
const getAgeGroup = (age: number): AgeGroup => {
  if (age < 40) return 'young';
  if (age < 60) return 'middle';
  return 'senior';
};

const getAgeLabel = (age: number): string => {
  const g = getAgeGroup(age);
  switch(g) {
    case 'young': return '20-30代';
    case 'middle': return '40-50代';
    case 'senior': return '60代以上';
  }
};

// ■ 1. CS-30 評価基準 (中谷ら, 20-80+)
// 性別 -> 年代(5歳刻み想定だが簡略化のため大枠で定義) -> 5段階評価(1:劣, 3:普, 5:優)
// ここでは戻り値を「スコア(0-100)」に変換して返す
const getCS30Score = (count: number, age: number, gender: 'male' | 'female'): number => {
  // 基準テーブル (中谷らの表を参考に補間)
  // [年齢下限, 評価1上限, 評価3下限-上限, 評価5下限]
  // 評価1以下=20点, 評価2=40点, 評価3=60点, 評価4=80点, 評価5以上=100点
  let criteria: number[]; // [v1, v3_min, v3_max, v5]
  
  if (gender === 'male') {
    if (age < 60) criteria = [17, 22, 27, 32]; // 50-59歳基準
    else if (age < 70) criteria = [13, 18, 21, 26]; // 65-69歳基準
    else if (age < 80) criteria = [11, 16, 20, 25]; // 70-74歳基準
    else criteria = [9, 14, 16, 20]; // 80+
  } else {
    if (age < 60) criteria = [15, 20, 24, 30];
    else if (age < 70) criteria = [11, 17, 21, 27];
    else if (age < 80) criteria = [9, 15, 19, 24];
    else criteria = [8, 13, 16, 20];
  }

  if (count <= criteria[0]) return 20; // 劣っている
  if (count < criteria[1]) return 40;  // やや劣っている
  if (count <= criteria[2]) return 60; // 普通
  if (count < criteria[3]) return 80;  // やや優れている
  return 100; // 優れている
};

// ■ 2. 握力基準 (スポーツ庁 R5年度 体力運動能力調査 平均値参照)
// スコア化: 平均の80%未満=20点, 80-99%=40-50点, 平均=60点, 120%以上=100点
const getGripScore = (kg: number, age: number, gender: 'male' | 'female'): number => {
  let avg: number;
  if (gender === 'male') {
    if (age < 40) avg = 47;
    else if (age < 60) avg = 44;
    else if (age < 65) avg = 41.9;
    else if (age < 70) avg = 39.4;
    else if (age < 75) avg = 37.5;
    else avg = 35.1;
  } else {
    if (age < 40) avg = 28;
    else if (age < 60) avg = 27;
    else if (age < 65) avg = 26.1;
    else if (age < 70) avg = 25.1;
    else if (age < 75) avg = 23.8;
    else avg = 22.8;
  }
  
  const ratio = kg / avg;
  if (ratio < 0.8) return 20 + (ratio * 10); // 低い
  if (ratio < 1.0) return 40 + ((ratio - 0.8) * 100); // 40-60
  if (ratio < 1.2) return 60 + ((ratio - 1.0) * 100); // 60-80
  return Math.min(100, 80 + ((ratio - 1.2) * 50)); 
};

// ■ 3. 閉眼片脚立位 (中谷研究室 20-64歳基準)
// 65歳以上は参考値扱いだが、同一ロジックで評価しつつUIで警告
const getBalanceScore = (sec: number, age: number, gender: 'male' | 'female'): number => {
  // 高齢者は安全のため開眼で行うことが多いが、アプリ仕様上閉眼とする
  // 60-64歳基準を使用
  // 男性: 1秒以下(20), 2-4(40), 5-10(60), 11-24(80), 25+(100)
  // 女性: 1秒以下(20), 2-4(40), 5-11(60), 12-28(80), 29+(100)
  
  if (sec < 2) return 20; // 評価1
  if (sec < 5) return 40; // 評価2
  
  if (gender === 'male') {
    if (sec <= 10) return 60;
    if (sec <= 24) return 80;
    return 100;
  } else {
    if (sec <= 11) return 60;
    if (sec <= 28) return 80;
    return 100;
  }
};

// ■ 4. FFD (独自基準 - 四分位想定)
// 0以下(床につく)=80-100点, 0-5cm=60点, 15cm以上=20点
const getFFDScore = (cm: number): number => {
  if (cm <= -10) return 100;
  if (cm <= 0) return 80;
  if (cm <= 5) return 60;
  if (cm <= 15) return 40;
  return 20;
};

// メイン計算関数
export const calculateRisk = (data: AssessmentData): RiskResult => {
  const { age, gender } = data.patient;
  const messages: string[] = [];
  
  // 採用値の決定 (Max or Best)
  const bestGripRight = Math.max(data.gripStrength.right.first ?? 0, data.gripStrength.right.second ?? 0);
  const bestGripLeft = Math.max(data.gripStrength.left.first ?? 0, data.gripStrength.left.second ?? 0);
  const bestGrip = Math.max(bestGripRight, bestGripLeft); // AWGS準拠: 左右の最大値
  
  const bestCS30 = Math.max(data.cs30.first ?? 0, data.cs30.second ?? 0);
  const bestBalance = Math.max(data.balanceTime.first ?? 0, data.balanceTime.second ?? 0);
  
  // FFDは「値が小さいほど良い」。入力がない場合は Infinity 扱いして無視
  const validFFD1 = data.ffd.first !== null ? data.ffd.first : 999;
  const validFFD2 = data.ffd.second !== null ? data.ffd.second : 999;
  let bestFFD = Math.min(validFFD1, validFFD2);
  if (bestFFD === 999) bestFFD = 0; // データなし

  // --- 1. 医学的スクリーニング判定 ---
  
  // A. サルコペニア疑い (AWGS 2019 + CS-30)
  // 握力: 男 < 28kg, 女 < 18kg
  // CS-30: 男 < 17回, 女 < 15回
  const gripCutoff = gender === 'male' ? 28 : 18;
  const cs30CutoffSarcopenia = gender === 'male' ? 17 : 15;
  
  const isLowMuscle = bestGrip < gripCutoff;
  const isLowPerformance = bestCS30 < cs30CutoffSarcopenia;
  const isSarcopeniaRisk = isLowMuscle && isLowPerformance;

  if (isSarcopeniaRisk) {
    messages.push('【サルコペニア疑い】筋力と身体機能の低下が見られます。専門家の指導下での運動をお勧めします。');
  } else if (isLowMuscle) {
    messages.push('【筋力低下】握力が基準値を下回っています。タンパク質摂取と筋力トレーニングを意識してください。');
  }

  // B. 転倒リスク
  // CS-30 <= 14 or 閉眼片脚立位 < 2秒(評価1)
  const isFallRisk = bestCS30 <= 14 || bestBalance < 2;
  if (isFallRisk) {
    messages.push('【転倒高リスク】バランス能力または下肢筋力が低下しています。転倒に十分注意してください。');
  } else if (bestCS30 <= 19) {
    messages.push('【転倒注意】下肢筋力がやや低下傾向です。');
  }

  // C. ロコモ疑い (スクリーニングレベル)
  // CS-30が評価1(劣っている) または 握力がAWGS基準未満
  const cs30Score = getCS30Score(bestCS30, age, gender);
  const isLocomoRisk = cs30Score <= 20 || isLowMuscle;
  if (isLocomoRisk && !isSarcopeniaRisk) { // 重複表示防止
    messages.push('【ロコモ疑い】移動機能の低下が始まっている可能性があります。');
  }

  // D. 柔軟性
  const isFlexibilityLow = bestFFD > 5;
  if (isFlexibilityLow) {
    messages.push('【柔軟性低下】体が硬くなっています。腰痛予防のために毎日のストレッチを推奨します。');
  }

  // --- 項目ごとの赤字判定フラグ ---
  const itemRisks = {
    grip: isLowMuscle, // 握力が基準未満なら赤
    cs30: bestCS30 <= 14, // 転倒リスクライン(14回)以下なら赤
    balance: bestBalance < 5, // 5秒未満(評価2以下)なら赤
    ffd: isFlexibilityLow, // +5cm超なら赤
  };

  // --- 2. レーダーチャート用スコア算出 (0-100) ---
  const gripScore = getGripScore(bestGrip, age, gender);
  const balanceScore = getBalanceScore(bestBalance, age, gender);
  const ffdScore = getFFDScore(bestFFD);

  // 平均ライン (チャートのグレーの線) は60点付近に設定して比較させる
  const radarData = [
    { subject: '全身筋力(握力)', score: gripScore, average: 60, fullMark: 100 },
    { subject: '下肢筋力(CS-30)', score: cs30Score, average: 60, fullMark: 100 },
    { subject: 'バランス(片脚)', score: balanceScore, average: 60, fullMark: 100 },
    { subject: '柔軟性(FFD)', score: ffdScore, average: 60, fullMark: 100 },
  ];

  return {
    isSarcopeniaRisk,
    isLocomoRisk,
    isFallRisk,
    isFlexibilityLow,
    itemRisks,
    messages,
    radarData,
    ageGroupLabel: getAgeLabel(age),
    bestRecord: {
      grip: bestGrip,
      gripRight: bestGripRight, // 右手最大値
      gripLeft: bestGripLeft,   // 左手最大値
      cs30: bestCS30,
      balance: bestBalance,
      ffd: bestFFD === 999 ? 0 : bestFFD
    }
  };
};

export const submitToGAS = async (data: AssessmentData, riskResult: RiskResult, pdfBase64?: string | null): Promise<boolean> => {
  if (GAS_API_URL.includes('YOUR_GAS')) {
    console.warn('GAS URL not configured');
    return false;
  }

  // 送信ペイロードの作成
  const payload = {
    date: new Date().toISOString(),
    company: data.patient.company,
    id: data.patient.id,
    name: data.patient.name,
    age: data.patient.age,
    gender: data.patient.gender,
    bestGrip: riskResult.bestRecord.grip,
    bestCS30: riskResult.bestRecord.cs30,
    bestBalance: riskResult.bestRecord.balance,
    bestFFD: riskResult.bestRecord.ffd,
    flags: riskResult.messages.join(' | '),
    pdfData: pdfBase64 || "" // PDFデータ(Base64)を追加
  };

  try {
    await fetch(GAS_API_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return true;
  } catch (error) {
    console.error('GAS Error', error);
    return false;
  }
};
