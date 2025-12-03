
/*
 * =================================================================
 * Google Apps Script (GAS) コード
 * =================================================================
 * 
 * 【手順】
 * 1. Google スプレッドシートを開く
 * 2. 拡張機能 > Apps Script を開く
 * 3. 以下のコードを全てコピーして、Code.gs に上書き貼り付けする
 * 4. 右上の「デプロイ」 > 「新しいデプロイ」
 * 5. 「種類の選択」 > 「ウェブアプリ」
 * 6. 「アクセスできるユーザー」を『全員』にする (超重要)
 * 7. デプロイして発行された「ウェブアプリのURL」をコピーする
 * 8. 本アプリの utils.ts の `GAS_API_URL` にそのURLを貼り付ける
 */

function doPost(e) {
  // 1. スプレッドシートとシートの取得
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetName = "測定結果";
  var sheet = ss.getSheetByName(sheetName);

  // シートがなければ作成
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    // ヘッダー行を追加
    sheet.appendRow([
      "日時", 
      "企業名", 
      "社員ID", 
      "氏名", 
      "年齢", 
      "性別", 
      "握力(kg)", 
      "CS-30(回)", 
      "バランス(秒)", 
      "FFD(cm)", 
      "判定フラグ"
    ]);
  }

  // 2. データのパース
  try {
    // データが送られてこない場合の安全策
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("No data received");
    }

    var rawData = e.postData.contents;
    var data = JSON.parse(rawData);

    // 3. 行データの作成 (utils.ts の submitToGAS で送る項目と順番を合わせる)
    var row = [
      data.date,          // 日時
      data.company,       // 企業名
      data.id,            // 社員ID (任意)
      data.name,          // 氏名
      data.age,           // 年齢
      data.gender,        // 性別
      data.bestGrip,      // 握力(最大値)
      data.bestCS30,      // CS-30
      data.bestBalance,   // バランス
      data.bestFFD,       // FFD
      data.flags          // フラグ・メッセージ
    ];

    // 4. シートに追加
    sheet.appendRow(row);

    // 5. レスポンス作成
    var result = { status: "success", message: "Data appended" };
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    var errorResult = { status: "error", message: error.toString() };
    return ContentService.createTextOutput(JSON.stringify(errorResult))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// CORS対策のOPTIONSリクエストハンドリング（念のため）
function doOptions(e) {
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.JSON)
    .append("Access-Control-Allow-Origin: *")
    .append("Access-Control-Allow-Methods: POST, OPTIONS")
    .append("Access-Control-Allow-Headers: Content-Type");
}
