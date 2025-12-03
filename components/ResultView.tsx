import React, { useState, useEffect } from 'react';
import { AssessmentData } from '../types';
import { calculateRisk, submitToGAS } from '../utils';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';
import { Download, Save, CheckCircle, XCircle, Building, Loader2, AlertTriangle, TrendingUp, RotateCcw, Smartphone, ExternalLink } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';

interface Props {
  data: AssessmentData;
  onReset: () => void;
}

export const ResultView: React.FC<Props> = ({ data, onReset }) => {
  const risk = calculateRisk(data);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [pdfStatus, setPdfStatus] = useState<'idle' | 'generating'>('idle');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  
  const today = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
  const YOUTUBE_URL = 'https://www.youtube.com/watch?v=8sQw_Ybq7r4';

  // QRコード生成
  useEffect(() => {
    QRCode.toDataURL(YOUTUBE_URL, { margin: 1, width: 128 })
      .then(url => setQrCodeUrl(url))
      .catch(err => console.error('QR Code Error', err));
  }, []);

  // 1回目、2回目の表示用ヘルパー
  const formatVal = (v: number | null, unit: string) => v !== null ? `${v} ${unit}` : '-';

  // 画面表示用：採用値のスタイル決定関数 (リスクありなら赤太字)
  const getBestValueStyle = (isRisk: boolean, baseBg: string) => {
    return `border border-slate-300 p-2 text-center font-bold ${baseBg} ${isRisk ? 'text-red-600 text-lg' : 'text-slate-900'}`;
  };

  // PDF用採用値スタイル（クラス指定用）
  const getPdfBestValueStyle = (baseBg: string) => {
    return `border border-slate-300 p-3 text-center font-bold text-lg ${baseBg}`;
  };

  // PDF生成の共通処理
  // mode: 'save' (ダウンロード) | 'preview' (別タブ表示)
  const handleGeneratePDF = async (mode: 'save' | 'preview') => {
    const input = document.getElementById('print-template');
    if (!input) return;

    setPdfStatus('generating');

    try {
      // 1. 隠し原稿をCanvas化
      // iOS Safari等のメモリ制限対策として、scaleを少し調整する手もあるが今回は2で維持
      const canvas = await html2canvas(input, {
        scale: 2, 
        logging: false,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      // 2. 画像データ取得
      const imgData = canvas.toDataURL('image/png');

      // 3. PDF作成 (A4縦)
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

      if (mode === 'save') {
        // PC向け：直接ダウンロード
        pdf.save(`体力測定結果_${data.patient.name}様.pdf`);
      } else {
        // スマホ向け：BlobURLを生成して別タブで開く
        const blob = pdf.output('blob');
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      }

    } catch (error) {
      console.error('PDF generation failed', error);
      alert('PDFの作成に失敗しました。');
    } finally {
      setPdfStatus('idle');
    }
  };

  const handleSaveGAS = async () => {
    setSaveStatus('saving');
    const success = await submitToGAS(data, risk);
    setSaveStatus(success ? 'success' : 'error');
  };

  return (
    <div className="animate-fade-in text-slate-900">
      
      {/* --- A. 画面操作エリア --- */}
      <div className="space-y-8">
        <div className="flex flex-col gap-4 mb-4">
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            {/* スマホ向け：プレビューボタン */}
            <button 
              onClick={() => handleGeneratePDF('preview')} 
              disabled={pdfStatus === 'generating'}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-100 text-slate-700 border border-slate-300 px-4 py-3 rounded-lg shadow-sm hover:bg-slate-200 transition font-bold disabled:bg-slate-50"
            >
              {pdfStatus === 'generating' ? <Loader2 className="animate-spin"/> : <Smartphone size={20}/>}
              PDFプレビュー<span className="text-xs font-normal">(スマホ保存用)</span>
            </button>

            {/* PC向け：ダウンロードボタン */}
            <button 
              onClick={() => handleGeneratePDF('save')} 
              disabled={pdfStatus === 'generating'}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-800 text-white px-6 py-3 rounded-lg shadow hover:bg-slate-900 transition font-bold disabled:bg-slate-500"
            >
              {pdfStatus === 'generating' ? <Loader2 className="animate-spin"/> : <Download size={20}/>}
              PDF保存<span className="text-xs font-normal">(PC用)</span>
            </button>

            {/* GAS送信ボタン */}
            <button 
              onClick={handleSaveGAS} 
              disabled={saveStatus === 'saving' || saveStatus === 'success'}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-lg shadow text-white font-bold transition ${saveStatus === 'success' ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {saveStatus === 'saving' && <><Loader2 className="animate-spin"/> 送信中...</>}
              {saveStatus === 'success' && <><CheckCircle size={20}/> 送信完了</>}
              {saveStatus === 'error' && <><XCircle size={20}/> エラー</>}
              {saveStatus === 'idle' && <><Save size={20}/> データ記録</>}
            </button>
          </div>
          <p className="text-right text-xs text-slate-500">
            ※スマホの方は「PDFプレビュー」を開き、ブラウザの共有メニューから保存やLINE送信を行ってください。
          </p>
        </div>

        {/* 画面上のリッチプレビュー (PDFテンプレートと同等の情報) */}
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg border">
          <div className="border-b-2 border-slate-200 pb-4 mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">測定結果レポート</h2>
              <div className="text-slate-600 mt-2 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm">
                <span className="flex items-center gap-1 font-bold"><Building size={16}/> {data.patient.company}</span>
                <span>氏名: <span className="font-bold">{data.patient.name} 様</span></span>
                <span>{data.patient.age}歳 / {data.patient.gender === 'male' ? '男性' : '女性'}</span>
                <span className="text-blue-600 font-bold bg-blue-50 px-2 rounded">基準: {risk.ageGroupLabel}</span>
              </div>
            </div>
            <div className="text-right hidden md:block">
              <p className="text-xs text-slate-500">実施日</p>
              <p className="font-bold text-slate-800">{today}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* レーダーチャート */}
            <div className="flex flex-col items-center justify-center p-4 border rounded-xl bg-slate-50">
              <h3 className="font-bold text-lg mb-4 text-slate-700 border-b pb-2 w-full text-center">身体機能バランス</h3>
              <div style={{ width: '100%', height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart outerRadius="70%" data={risk.radarData}>
                    <PolarGrid stroke="#cbd5e1" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#334155', fontSize: 12, fontWeight: 'bold' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="あなた" dataKey="score" stroke="#2563eb" fill="#3b82f6" fillOpacity={0.6} strokeWidth={3} />
                    <Radar name="平均基準" dataKey="average" stroke="#ef4444" fill="#fee2e2" fillOpacity={0.4} strokeDasharray="4 4"/>
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 測定詳細テーブル */}
            <div className="flex flex-col">
              <h3 className="font-bold text-lg mb-4 text-slate-700 border-b pb-2">測定結果詳細</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse border border-slate-300 rounded-lg">
                  <thead>
                    <tr className="bg-slate-200 text-slate-900">
                      <th className="border border-slate-400 p-2 text-left">項目</th>
                      <th className="border border-slate-400 p-2 text-center">1回目</th>
                      <th className="border border-slate-400 p-2 text-center">2回目</th>
                      <th className="border border-slate-400 p-2 text-center bg-blue-100 font-bold text-slate-900">採用値</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-white">
                      <td className="border border-slate-300 p-2 font-bold text-slate-700">握力 (右)</td>
                      <td className="border border-slate-300 p-2 text-center text-slate-900">{formatVal(data.gripStrength.right.first, 'kg')}</td>
                      <td className="border border-slate-300 p-2 text-center text-slate-900">{formatVal(data.gripStrength.right.second, 'kg')}</td>
                      <td className={getBestValueStyle(risk.itemRisks.grip, 'bg-blue-50')}>
                        {risk.bestRecord.gripRight} <span className="text-xs font-normal text-slate-900">kg</span>
                      </td>
                    </tr>
                    <tr className="bg-white">
                      <td className="border border-slate-300 p-2 font-bold text-slate-700">握力 (左)</td>
                      <td className="border border-slate-300 p-2 text-center text-slate-900">{formatVal(data.gripStrength.left.first, 'kg')}</td>
                      <td className="border border-slate-300 p-2 text-center text-slate-900">{formatVal(data.gripStrength.left.second, 'kg')}</td>
                      <td className={getBestValueStyle(risk.itemRisks.grip, 'bg-blue-50')}>
                        {risk.bestRecord.gripLeft} <span className="text-xs font-normal text-slate-900">kg</span>
                      </td>
                    </tr>
                    <tr className="bg-slate-50">
                      <td className="border border-slate-300 p-2 font-bold text-slate-700">CS-30</td>
                      <td className="border border-slate-300 p-2 text-center text-slate-900">{formatVal(data.cs30.first, '回')}</td>
                      <td className="border border-slate-300 p-2 text-center text-slate-900">{formatVal(data.cs30.second, '回')}</td>
                      <td className={getBestValueStyle(risk.itemRisks.cs30, 'bg-blue-100')}>
                        {risk.bestRecord.cs30} <span className="text-xs font-normal text-slate-900">回</span>
                      </td>
                    </tr>
                    <tr className="bg-white">
                      <td className="border border-slate-300 p-2 font-bold text-slate-700">バランス</td>
                      <td className="border border-slate-300 p-2 text-center text-slate-900">{formatVal(data.balanceTime.first, '秒')}</td>
                      <td className="border border-slate-300 p-2 text-center text-slate-900">{formatVal(data.balanceTime.second, '秒')}</td>
                      <td className={getBestValueStyle(risk.itemRisks.balance, 'bg-blue-50')}>
                        {risk.bestRecord.balance} <span className="text-xs font-normal text-slate-900">秒</span>
                      </td>
                    </tr>
                    <tr className="bg-slate-50">
                      <td className="border border-slate-300 p-2 font-bold text-slate-700">FFD</td>
                      <td className="border border-slate-300 p-2 text-center text-slate-900">{formatVal(data.ffd.first, 'cm')}</td>
                      <td className="border border-slate-300 p-2 text-center text-slate-900">{formatVal(data.ffd.second, 'cm')}</td>
                      <td className={getBestValueStyle(risk.itemRisks.ffd, 'bg-blue-100')}>
                        {risk.bestRecord.ffd} <span className="text-xs font-normal text-slate-900">cm</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 判定バッジエリア */}
              <div className="mt-4 p-4 border border-slate-200 rounded-lg bg-slate-50">
                <h4 className="font-bold text-slate-700 mb-2 text-xs uppercase tracking-wide">判定サマリ</h4>
                <div className="flex flex-col gap-2">
                  <div className={risk.isSarcopeniaRisk ? 'text-red-600 font-bold flex items-center gap-2' : 'text-slate-400 flex items-center gap-2 text-sm'}>
                     <AlertTriangle size={16} className={risk.isSarcopeniaRisk ? 'block' : 'hidden'}/> 
                     <span className={!risk.isSarcopeniaRisk ? 'line-through opacity-50' : ''}>サルコペニア疑い</span>
                  </div>
                  <div className={risk.isLocomoRisk ? 'text-orange-600 font-bold flex items-center gap-2' : 'text-slate-400 flex items-center gap-2 text-sm'}>
                     <AlertTriangle size={16} className={risk.isLocomoRisk ? 'block' : 'hidden'}/> 
                     <span className={!risk.isLocomoRisk ? 'line-through opacity-50' : ''}>ロコモティブシンドローム疑い</span>
                  </div>
                  <div className={risk.isFallRisk ? 'text-red-600 font-bold flex items-center gap-2' : 'text-slate-400 flex items-center gap-2 text-sm'}>
                     <AlertTriangle size={16} className={risk.isFallRisk ? 'block' : 'hidden'}/> 
                     <span className={!risk.isFallRisk ? 'line-through opacity-50' : ''}>転倒高リスク群</span>
                  </div>
                  <div className={risk.isFlexibilityLow ? 'text-blue-600 font-bold flex items-center gap-2' : 'text-slate-400 flex items-center gap-2 text-sm'}>
                     <AlertTriangle size={16} className={risk.isFlexibilityLow ? 'block' : 'hidden'}/> 
                     <span className={!risk.isFlexibilityLow ? 'line-through opacity-50' : ''}>柔軟性低下</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2 text-slate-800">
              <TrendingUp size={20}/> フィードバック・推奨プログラム
            </h3>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              {risk.messages.length > 0 ? (
                <ul className="list-disc ml-5 space-y-2">
                  {risk.messages.map((msg, i) => (
                    <li key={i} className="text-slate-800 font-medium text-sm leading-relaxed">{msg}</li>
                  ))}
                </ul>
              ) : (
                 <p className="text-sm text-slate-800 font-medium">全ての項目において良好な状態です。現在の生活習慣を維持し、定期的な運動を継続してください。</p>
              )}
            </div>

            {/* 画面上の動画リンク表示 */}
            <div className="mt-4 flex items-center gap-2 text-sm">
              <ExternalLink size={16} className="text-blue-600"/>
              <span className="font-bold">おすすめ動画:</span>
              <a href={YOUTUBE_URL} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">
                健康運動プログラムを見る (YouTube)
              </a>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-100 flex justify-center">
            <button onClick={onReset} className="text-slate-500 flex items-center gap-2 text-sm hover:text-blue-600 hover:underline px-4 py-2">
              <RotateCcw size={14}/> 新しい測定を開始する
            </button>
          </div>
        </div>
      </div>


      {/* --- B. PDF生成用 隠しテンプレート (レイアウトは変更なし) --- */}
      {/* 画面外に配置し、html2canvasでキャプチャする */}
      <div 
        id="print-template" 
        style={{
          position: 'fixed',
          left: '-10000px',
          top: 0,
          width: '210mm',
          minHeight: '297mm',
          padding: '15mm',
          backgroundColor: '#ffffff',
          color: '#000000', // 強制的に黒 (#000000)
          boxSizing: 'border-box',
          fontFamily: '"Noto Sans JP", sans-serif',
        }}
      >
        
        {/* レポートヘッダー */}
        <div className="border-b-4 border-slate-800 pb-4 mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-wider">体力測定結果報告書</h1>
            <p className="text-slate-600 mt-2 flex items-center gap-2 text-lg">
              <Building size={20}/> {data.patient.company}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500">実施日</p>
            <p className="text-xl font-bold">{today}</p>
          </div>
        </div>

        {/* 受診者情報 */}
        <div className="flex gap-10 mb-10 border p-6 bg-slate-50 rounded-lg">
          <div><span className="text-xs text-slate-500 block mb-1">社員ID</span><span className="font-mono font-bold text-xl">{data.patient.id || '-'}</span></div>
          <div><span className="text-xs text-slate-500 block mb-1">氏名</span><span className="font-bold text-xl">{data.patient.name} 様</span></div>
          <div><span className="text-xs text-slate-500 block mb-1">属性</span><span className="text-xl">{data.patient.age}歳 / {data.patient.gender === 'male' ? '男性' : '女性'}</span></div>
          <div className="ml-auto text-right"><span className="text-xs text-slate-500 block mb-1">比較基準</span><span className="text-xl font-bold text-blue-700">{risk.ageGroupLabel} 平均</span></div>
        </div>

        <div className="grid grid-cols-2 gap-10 mb-8">
          {/* レーダーチャートエリア */}
          <div className="flex flex-col items-center justify-center p-4 border rounded-xl bg-white shadow-sm">
            <h3 className="font-bold text-lg mb-4 w-full text-center text-slate-700 border-b pb-2">身体機能バランス</h3>
            <div style={{ width: '100%', height: '320px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart outerRadius={110} data={risk.radarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#334155', fontSize: 13, fontWeight: 'bold' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="あなた" dataKey="score" stroke="#2563eb" fill="#3b82f6" fillOpacity={0.5} strokeWidth={3} />
                  <Radar name="平均基準" dataKey="average" stroke="#ef4444" fill="#fee2e2" fillOpacity={0.4} strokeDasharray="4 4"/>
                  <Legend iconType="circle" />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-slate-400 mt-2">※平均基準(赤)より外側に広がっている項目が強みです。</p>
          </div>

          {/* 測定詳細テーブル */}
          <div>
            <h3 className="font-bold text-lg mb-4 text-slate-700 border-b pb-2">測定結果詳細</h3>
            <table className="w-full text-sm border-collapse border border-slate-300 rounded-lg overflow-hidden shadow-sm">
              <thead>
                <tr className="bg-slate-200 text-slate-900 border-b border-slate-400">
                  <th className="border border-slate-400 p-3 text-left">項目</th>
                  <th className="border border-slate-400 p-3 text-center w-20">1回目</th>
                  <th className="border border-slate-400 p-3 text-center w-20">2回目</th>
                  <th className="border border-slate-400 p-3 text-center w-24 font-bold bg-blue-100 text-slate-900">採用値</th>
                </tr>
              </thead>
              <tbody>
                {/* 握力(右) */}
                <tr className="bg-white">
                  <td className="border border-slate-300 p-3 font-bold text-slate-700">握力 (右)</td>
                  <td className="border border-slate-300 p-3 text-center text-slate-900">{formatVal(data.gripStrength.right.first, 'kg')}</td>
                  <td className="border border-slate-300 p-3 text-center text-slate-900">{formatVal(data.gripStrength.right.second, 'kg')}</td>
                  <td 
                    className={getPdfBestValueStyle('bg-blue-50')} 
                    style={{ 
                      backgroundColor: '#eff6ff', 
                      color: risk.itemRisks.grip ? '#dc2626' : '#000000' 
                    }}
                  >
                    {risk.bestRecord.gripRight} <span className="text-xs font-normal" style={{ color: '#000000' }}>kg</span>
                  </td>
                </tr>
                {/* 握力(左) */}
                <tr className="bg-white">
                  <td className="border border-slate-300 p-3 font-bold text-slate-700">握力 (左)</td>
                  <td className="border border-slate-300 p-3 text-center text-slate-900">{formatVal(data.gripStrength.left.first, 'kg')}</td>
                  <td className="border border-slate-300 p-3 text-center text-slate-900">{formatVal(data.gripStrength.left.second, 'kg')}</td>
                  <td 
                    className={getPdfBestValueStyle('bg-blue-50')} 
                    style={{ 
                      backgroundColor: '#eff6ff', 
                      color: risk.itemRisks.grip ? '#dc2626' : '#000000' 
                    }}
                  >
                    {risk.bestRecord.gripLeft} <span className="text-xs font-normal" style={{ color: '#000000' }}>kg</span>
                  </td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="border border-slate-300 p-3 font-bold text-slate-700">CS-30 (立ち上がり)</td>
                  <td className="border border-slate-300 p-3 text-center text-slate-900">{formatVal(data.cs30.first, '回')}</td>
                  <td className="border border-slate-300 p-3 text-center text-slate-900">{formatVal(data.cs30.second, '回')}</td>
                  <td 
                    className={getPdfBestValueStyle('bg-blue-100')}
                    style={{ 
                      backgroundColor: '#dbeafe', 
                      color: risk.itemRisks.cs30 ? '#dc2626' : '#000000' 
                    }}
                  >
                    {risk.bestRecord.cs30} <span className="text-xs font-normal" style={{ color: '#000000' }}>回</span>
                  </td>
                </tr>
                <tr className="bg-white">
                  <td className="border border-slate-300 p-3 font-bold text-slate-700">閉眼片脚立位</td>
                  <td className="border border-slate-300 p-3 text-center text-slate-900">{formatVal(data.balanceTime.first, '秒')}</td>
                  <td className="border border-slate-300 p-3 text-center text-slate-900">{formatVal(data.balanceTime.second, '秒')}</td>
                  <td 
                    className={getPdfBestValueStyle('bg-blue-50')}
                    style={{ 
                      backgroundColor: '#eff6ff', 
                      color: risk.itemRisks.balance ? '#dc2626' : '#000000' 
                    }}
                  >
                    {risk.bestRecord.balance} <span className="text-xs font-normal" style={{ color: '#000000' }}>秒</span>
                  </td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="border border-slate-300 p-3 font-bold text-slate-700">FFD (柔軟性)</td>
                  <td className="border border-slate-300 p-3 text-center text-slate-900">{formatVal(data.ffd.first, 'cm')}</td>
                  <td className="border border-slate-300 p-3 text-center text-slate-900">{formatVal(data.ffd.second, 'cm')}</td>
                  <td 
                    className={getPdfBestValueStyle('bg-blue-100')}
                    style={{ 
                      backgroundColor: '#dbeafe', 
                      color: risk.itemRisks.ffd ? '#dc2626' : '#000000' 
                    }}
                  >
                    {risk.bestRecord.ffd} <span className="text-xs font-normal" style={{ color: '#000000' }}>cm</span>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* 医学的リスク判定 */}
            <div className="mt-6 p-4 border-2 border-slate-200 rounded-lg bg-white">
              <h4 className="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wide">スクリーニング判定</h4>
              <div className="grid grid-cols-1 gap-2 text-sm font-bold">
                <div className={risk.isSarcopeniaRisk ? 'text-red-600 flex items-center gap-2' : 'text-slate-300 flex items-center gap-2'}>
                  {risk.isSarcopeniaRisk ? <CheckCircle size={18} fill="currentColor" className="text-white"/> : <div className="w-4 h-4 border-2 rounded-full border-slate-300"></div>}
                  サルコペニア疑い
                </div>
                <div className={risk.isLocomoRisk ? 'text-orange-600 flex items-center gap-2' : 'text-slate-300 flex items-center gap-2'}>
                  {risk.isLocomoRisk ? <CheckCircle size={18} fill="currentColor" className="text-white"/> : <div className="w-4 h-4 border-2 rounded-full border-slate-300"></div>}
                  ロコモティブシンドローム疑い
                </div>
                <div className={risk.isFallRisk ? 'text-red-600 flex items-center gap-2' : 'text-slate-300 flex items-center gap-2'}>
                  {risk.isFallRisk ? <CheckCircle size={18} fill="currentColor" className="text-white"/> : <div className="w-4 h-4 border-2 rounded-full border-slate-300"></div>}
                  転倒高リスク群
                </div>
                <div className={risk.isFlexibilityLow ? 'text-blue-600 flex items-center gap-2' : 'text-slate-300 flex items-center gap-2'}>
                  {risk.isFlexibilityLow ? <CheckCircle size={18} fill="currentColor" className="text-white"/> : <div className="w-4 h-4 border-2 rounded-full border-slate-300"></div>}
                  柔軟性低下
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 総合アドバイス + 動画リンク */}
        <div className="border-t-2 border-slate-800 pt-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <TrendingUp size={24}/> フィードバック・推奨プログラム
          </h3>
          <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 min-h-[100px] mb-4">
            {risk.messages.length > 0 ? (
              <ul className="list-disc ml-5 space-y-3">
                {risk.messages.map((msg, i) => (
                  <li key={i} className="text-slate-800 font-medium text-base leading-relaxed">{msg}</li>
                ))}
              </ul>
            ) : (
               <p className="text-base text-slate-800 font-medium">全ての項目において良好な状態です。現在の生活習慣を維持し、定期的な運動を継続してください。</p>
            )}
          </div>
          
          {/* 追加: YouTube QRコードエリア */}
          <div className="flex items-center gap-6 border-t border-dashed border-slate-300 pt-4">
            <div className="w-24 h-24 flex-shrink-0 bg-white p-1 border border-slate-200">
               {qrCodeUrl && <img src={qrCodeUrl} alt="QR Code" style={{width: '100%', height: '100%'}} />}
            </div>
            <div>
              <h4 className="font-bold text-lg mb-1" style={{color: '#000000'}}>おすすめ運動動画 (YouTube)</h4>
              <p className="text-sm mb-1" style={{color: '#334155'}}>ご自宅でできる簡単な運動プログラムを紹介しています。QRコードを読み取るか、以下のリンクにアクセスしてください。</p>
              <div style={{color: '#2563eb', textDecoration: 'underline', fontSize: '14px', fontWeight: 'bold'}}>
                {YOUTUBE_URL}
              </div>
            </div>
          </div>

          <div className="mt-8 text-xs text-slate-500 text-right">
            <p>判定基準: CS-30(中谷ら), 握力(AWGS2019/スポーツ庁), バランス(中谷研究室)等の統計データに基づくスクリーニング。</p>
            <p>本レポートは医学的診断ではありません。身体に異常を感じる場合は医療機関を受診してください。</p>
          </div>
        </div>
      </div>

    </div>
  );
};