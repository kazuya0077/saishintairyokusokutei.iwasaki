
export type Gender = 'male' | 'female';
export type AgeGroup = 'young' | 'middle' | 'senior'; // young: 20-39, middle: 40-59, senior: 60+

export interface PatientInfo {
  company: string; // 企業名（必須）
  id: string;      // 社員ID（任意）
  name: string;
  age: number;
  gender: Gender;
}

// 測定値（2回分記録）
export interface MeasurementRecord {
  first: number | null;
  second: number | null;
}

// 握力は左右それぞれ2回
export interface GripRecord {
  right: MeasurementRecord;
  left: MeasurementRecord;
}

export interface AssessmentData {
  patient: PatientInfo;
  gripStrength: GripRecord; 
  cs30: MeasurementRecord; // 回数
  balanceTime: MeasurementRecord; // 秒数 (閉眼片脚立位)
  ffd: MeasurementRecord; // cm (+値:床に届かず, -値:床越え)
}

export const INITIAL_DATA: AssessmentData = {
  patient: { company: '', id: '', name: '', age: 40, gender: 'male' },
  gripStrength: { right: { first: null, second: null }, left: { first: null, second: null } },
  cs30: { first: null, second: null },
  balanceTime: { first: null, second: null },
  ffd: { first: null, second: null },
};

// 判定結果用
export interface RiskResult {
  // 医学的スクリーニングフラグ
  isSarcopeniaRisk: boolean; // サルコペニア疑い (AWGS/CS-30基準)
  isLocomoRisk: boolean;     // ロコモ疑い
  isFallRisk: boolean;       // 転倒リスク (CS-30 <= 14 or Balance < 5s)
  isFlexibilityLow: boolean; // 柔軟性低下
  
  // 各項目ごとの警告フラグ（テーブル赤字表示用）
  itemRisks: {
    grip: boolean;
    cs30: boolean;
    balance: boolean;
    ffd: boolean;
  };

  messages: string[]; // 詳細なアドバイス
  
  // レーダーチャート用データ (0-100点)
  radarData: { 
    subject: string; 
    score: number;      // 本人のスコア
    average: number;    // 年代平均基準(通常60-80点付近に設定)
    fullMark: number;   // グラフ上限(100)
  }[];
  
  ageGroupLabel: string; // 表示用年代ラベル
  
  // 採用された記録（最大値など）
  bestRecord: {
    grip: number;      // 左右合わせた最大値（判定用）
    gripRight: number; // 右手の最大値（表示用）
    gripLeft: number;  // 左手の最大値（表示用）
    cs30: number;
    balance: number;
    ffd: number;
  };
}
