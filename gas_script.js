
/*
 * =================================================================
 * Google Apps Script (GAS) コード (PDF保存機能付き)
 * =================================================================
 * 
 * 【重要】
 * このコードには Google Drive へのアクセス権限が必要です。
 * 更新後、デプロイ時に権限の再承認画面が出たら必ず「許可」してください。
 *
 * 【手順】
 * 1. 以下のコードを全て Code.gs に上書きコピーする
 * 2. 「デプロイ」 > 「新しいデプロイ」
 * 3. 種類の選択: 「ウェブアプリ」
 * 4. アクセスできるユーザー: 「全員」
 * 5. デプロイを実行し、権限を承認する
 */

function doPost(e) {
  // 1. スプレッドシートとシートの取得
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetName = "測定結果";
  var sheet = ss.getSheetByName(sheetName);

  // シートがなければ作成
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    // ヘッダー行を追加 (PDFリンク列を追加)
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
      "判定フラグ",
      "PDFリンク" 
    ]);
  }

  try {
    // 2. データのパース
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("No data received");
    }

    var rawData = e.postData.contents;
    var data = JSON.parse(rawData);

    // 3. PDFの保存処理 (pdfDataがある場合のみ)
    var fileUrl = "";
    if (data.pdfData && data.pdfData.length > 0) {
      try {
        var folderName = "CorpPhysioCheck_PDFs";
        var folder;
        var folders = DriveApp.getFoldersByName(folderName);
        
        if (folders.hasNext()) {
          folder = folders.next();
        } else {
          folder = DriveApp.createFolder(folderName);
        }
        
        // Base64をデコードしてBlob作成
        var decoded = Utilities.base64Decode(data.pdfData);
        var fileName = data.company + "_" + data.name + "_" + Utilities.formatDate(new Date(), "Asia/Tokyo", "yyyyMMdd_HHmmss") + ".pdf";
        var blob = Utilities.newBlob(decoded, "application/pdf", fileName);
        
        // ファイル作成
        var file = folder.createFile(blob);
        
        // 誰でも閲覧可能にする設定 (必要に応じてコメントアウト解除)
        // file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        
        fileUrl = file.getUrl();
        
      } catch (driveError) {
        // PDF保存に失敗してもデータ記録は継続する
        fileUrl = "Error: " + driveError.toString();
      }
    }

    // 4. 行データの作成
    var row = [
      data.date,          // 日時
      data.company,       // 企業名
      data.id,            // 社員ID
      data.name,          // 氏名
      data.age,           // 年齢
      data.gender,        // 性別
      data.bestGrip,      // 握力
      data.bestCS30,      // CS-30
      data.bestBalance,   // バランス
      data.bestFFD,       // FFD
      data.flags,         // フラグ
      fileUrl             // PDFリンク (一番右に追加)
    ];

    // 5. シートに追加
    sheet.appendRow(row);

    var result = { status: "success", message: "Data and PDF saved", pdfUrl: fileUrl };
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    var errorResult = { status: "error", message: error.toString() };
    return ContentService.createTextOutput(JSON.stringify(errorResult))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doOptions(e) {
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.JSON)
    .append("Access-Control-Allow-Origin: *")
    .append("Access-Control-Allow-Methods: POST, OPTIONS")
    .append("Access-Control-Allow-Headers: Content-Type");
}
