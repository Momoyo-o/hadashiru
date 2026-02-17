// 成分データベース - 既存の100種類の成分データ
const GLOBAL_DB = [
    // 保湿成分
    { name: "ヒアルロン酸", role: "強力な保湿・水分保持", cat: "保湿成分", goodFor: ["dry", "sensitive"], badFor: [], organic: true, allergy: false },
    { name: "グリセリン", role: "保湿・柔軟化", cat: "保湿成分", goodFor: ["dry", "sensitive"], badFor: [], organic: true, allergy: false },
    { name: "セラミド", role: "バリア機能強化・保湿", cat: "保湿成分", goodFor: ["dry", "sensitive"], badFor: [], organic: false, allergy: false },
    { name: "コラーゲン", role: "保湿・ハリ向上", cat: "保湿成分", goodFor: ["dry", "aging"], badFor: [], organic: false, allergy: false },
    { name: "スクワラン", role: "保湿・皮膚軟化", cat: "保湿成分", goodFor: ["dry", "sensitive"], badFor: ["oily"], organic: true, allergy: false },
    { name: "シアバター", role: "保湿・栄養補給", cat: "保湿成分", goodFor: ["dry"], badFor: ["oily"], organic: true, allergy: false },
    { name: "ホホバオイル", role: "保湿・皮脂バランス調整", cat: "保湿成分", goodFor: ["dry", "mixed"], badFor: [], organic: true, allergy: false },
    { name: "アロエベラ", role: "保湿・鎮静", cat: "保湿成分", goodFor: ["sensitive", "dry"], badFor: [], organic: true, allergy: false },
    
    // 美白・エイジングケア成分
    { name: "ビタミンC", role: "美白・抗酸化", cat: "美白成分", goodFor: ["aging"], badFor: ["sensitive"], organic: false, allergy: false },
    { name: "ナイアシンアミド", role: "美白・バリア改善", cat: "美白成分", goodFor: ["aging", "oily"], badFor: [], organic: false, allergy: false },
    { name: "レチノール", role: "シワ改善・ターンオーバー促進", cat: "エイジングケア", goodFor: ["aging"], badFor: ["sensitive"], organic: false, allergy: false },
    { name: "アルブチン", role: "美白・シミ予防", cat: "美白成分", goodFor: ["aging"], badFor: [], organic: true, allergy: false },
    { name: "トラネキサム酸", role: "美白・抗炎症", cat: "美白成分", goodFor: ["aging"], badFor: [], organic: false, allergy: false },
    { name: "コエンザイムQ10", role: "抗酸化・エイジングケア", cat: "エイジングケア", goodFor: ["aging"], badFor: [], organic: false, allergy: false },
    { name: "ペプチド", role: "ハリ向上・シワ改善", cat: "エイジングケア", goodFor: ["aging"], badFor: [], organic: false, allergy: false },
    
    // 抗炎症・鎮静成分
    { name: "アラントイン", role: "抗炎症・肌荒れ防止", cat: "鎮静成分", goodFor: ["sensitive"], badFor: [], organic: true, allergy: false },
    { name: "パンテノール", role: "保湿・抗炎症", cat: "鎮静成分", goodFor: ["sensitive", "dry"], badFor: [], organic: false, allergy: false },
    { name: "カモミラエキス", role: "鎮静・抗炎症", cat: "鎮静成分", goodFor: ["sensitive"], badFor: [], organic: true, allergy: false },
    { name: "グリチルリチン酸", role: "抗炎症・肌荒れ改善", cat: "鎮静成分", goodFor: ["sensitive", "oily"], badFor: [], organic: true, allergy: false },
    { name: "ツボクサエキス", role: "鎮静・修復", cat: "鎮静成分", goodFor: ["sensitive"], badFor: [], organic: true, allergy: false },
    
    // 皮脂コントロール・毛穴ケア
    { name: "サリチル酸", role: "角質ケア・毛穴改善", cat: "角質ケア", goodFor: ["oily"], badFor: ["sensitive", "dry"], organic: false, allergy: true },
    { name: "AHA", role: "ピーリング・角質除去", cat: "角質ケア", goodFor: ["oily", "aging"], badFor: ["sensitive"], organic: false, allergy: true },
    { name: "BHA", role: "毛穴ケア・皮脂溶解", cat: "角質ケア", goodFor: ["oily"], badFor: ["sensitive", "dry"], organic: false, allergy: true },
    { name: "ティーツリーオイル", role: "抗菌・皮脂調整", cat: "皮脂コントロール", goodFor: ["oily"], badFor: [], organic: true, allergy: false },
    { name: "緑茶エキス", role: "抗酸化・皮脂コントロール", cat: "皮脂コントロール", goodFor: ["oily"], badFor: [], organic: true, allergy: false },
    
    // UV・防御成分
    { name: "酸化亜鉛", role: "UV防御（物理）", cat: "UV防御", goodFor: ["sensitive"], badFor: [], organic: false, allergy: false },
    { name: "酸化チタン", role: "UV防御（物理）", cat: "UV防御", goodFor: ["sensitive"], badFor: [], organic: false, allergy: false },
    { name: "アボベンゾン", role: "UV防御（化学）", cat: "UV防御", goodFor: [], badFor: [], organic: false, allergy: false },
    
    // 防腐剤・保存料
    { name: "パラベン", role: "防腐剤", cat: "防腐剤", goodFor: [], badFor: ["sensitive"], organic: false, allergy: true },
    { name: "フェノキシエタノール", role: "防腐剤", cat: "防腐剤", goodFor: [], badFor: [], organic: false, allergy: true },
    { name: "安息香酸", role: "防腐剤", cat: "防腐剤", goodFor: [], badFor: ["sensitive"], organic: false, allergy: false },
    
    // 界面活性剤
    { name: "ラウリル硫酸Na", role: "洗浄剤（強力）", cat: "界面活性剤", goodFor: ["oily"], badFor: ["sensitive", "dry"], organic: false, allergy: true },
    { name: "ココイルグルタミン酸", role: "洗浄剤（マイルド）", cat: "界面活性剤", goodFor: ["sensitive", "dry"], badFor: [], organic: true, allergy: false },
    { name: "デシルグルコシド", role: "洗浄剤（低刺激）", cat: "界面活性剤", goodFor: ["sensitive"], badFor: [], organic: true, allergy: false },
    
    // その他機能性成分
    { name: "エタノール", role: "収れん・防腐", cat: "その他", goodFor: ["oily"], badFor: ["sensitive", "dry"], organic: false, allergy: true },
    { name: "メントール", role: "清涼感付与", cat: "その他", goodFor: [], badFor: ["sensitive"], organic: true, allergy: true },
    { name: "香料", role: "香り付与", cat: "その他", goodFor: [], badFor: ["sensitive"], organic: false, allergy: true },
    { name: "着色料", role: "色付け", cat: "その他", goodFor: [], badFor: ["sensitive"], organic: false, allergy: false },
    
    // 植物エキス（追加）
    { name: "ローズマリーエキス", role: "抗酸化・抗菌", cat: "植物エキス", goodFor: ["oily"], badFor: [], organic: true, allergy: false },
    { name: "ラベンダーオイル", role: "鎮静・香り", cat: "植物エキス", goodFor: ["sensitive"], badFor: [], organic: true, allergy: false },
    { name: "ユーカリエキス", role: "抗菌・清涼", cat: "植物エキス", goodFor: ["oily"], badFor: [], organic: true, allergy: false },
    { name: "カレンデュラエキス", role: "鎮静・保湿", cat: "植物エキス", goodFor: ["sensitive", "dry"], badFor: [], organic: true, allergy: false },
    { name: "ハトムギエキス", role: "保湿・美白", cat: "植物エキス", goodFor: ["dry"], badFor: [], organic: true, allergy: false },
    { name: "ドクダミエキス", role: "抗炎症・殺菌", cat: "植物エキス", goodFor: ["oily", "sensitive"], badFor: [], organic: true, allergy: false },
    { name: "ヨモギエキス", role: "鎮静・保湿", cat: "植物エキス", goodFor: ["sensitive"], badFor: [], organic: true, allergy: false },
    
    // オイル類（追加）
    { name: "アルガンオイル", role: "保湿・栄養", cat: "オイル", goodFor: ["dry", "aging"], badFor: ["oily"], organic: true, allergy: false },
    { name: "ココナッツオイル", role: "保湿・抗菌", cat: "オイル", goodFor: ["dry"], badFor: ["oily"], organic: true, allergy: false },
    { name: "オリーブオイル", role: "保湿・栄養", cat: "オイル", goodFor: ["dry"], badFor: ["oily"], organic: true, allergy: false },
    { name: "ローズヒップオイル", role: "保湿・美白", cat: "オイル", goodFor: ["dry", "aging"], badFor: ["oily"], organic: true, allergy: false },
    { name: "マカダミアナッツオイル", role: "保湿・皮膚軟化", cat: "オイル", goodFor: ["dry"], badFor: ["oily"], organic: true, allergy: false },
    
    // ビタミン類（追加）
    { name: "ビタミンE", role: "抗酸化・保湿", cat: "ビタミン", goodFor: ["aging", "dry"], badFor: [], organic: false, allergy: false },
    { name: "ビタミンB3", role: "バリア改善・美白", cat: "ビタミン", goodFor: ["aging", "oily"], badFor: [], organic: false, allergy: false },
    { name: "ビタミンB5", role: "保湿・修復", cat: "ビタミン", goodFor: ["sensitive", "dry"], badFor: [], organic: false, allergy: false },
    { name: "ビタミンA", role: "ターンオーバー促進", cat: "ビタミン", goodFor: ["aging"], badFor: ["sensitive"], organic: false, allergy: false },
    
    // ミネラル類
    { name: "亜鉛", role: "抗炎症・皮脂調整", cat: "ミネラル", goodFor: ["oily"], badFor: [], organic: false, allergy: false },
    { name: "銅", role: "抗酸化・ハリ向上", cat: "ミネラル", goodFor: ["aging"], badFor: [], organic: false, allergy: false },
    { name: "マグネシウム", role: "鎮静・バリア改善", cat: "ミネラル", goodFor: ["sensitive"], badFor: [], organic: false, allergy: false },
    
    // アミノ酸類
    { name: "グリシン", role: "保湿・コラーゲン生成", cat: "アミノ酸", goodFor: ["dry", "aging"], badFor: [], organic: true, allergy: false },
    { name: "アルギニン", role: "保湿・修復", cat: "アミノ酸", goodFor: ["dry"], badFor: [], organic: true, allergy: false },
    { name: "プロリン", role: "保湿・ハリ向上", cat: "アミノ酸", goodFor: ["aging"], badFor: [], organic: true, allergy: false },
    
    // 発酵エキス
    { name: "ガラクトミセス", role: "美白・保湿", cat: "発酵エキス", goodFor: ["aging", "dry"], badFor: [], organic: true, allergy: false },
    { name: "ビフィズス菌エキス", role: "バリア改善・保湿", cat: "発酵エキス", goodFor: ["sensitive", "dry"], badFor: [], organic: true, allergy: false },
    { name: "酵母エキス", role: "保湿・ハリ向上", cat: "発酵エキス", goodFor: ["aging"], badFor: [], organic: true, allergy: false },
    
    // 海洋由来成分
    { name: "海藻エキス", role: "保湿・ミネラル補給", cat: "海洋由来", goodFor: ["dry"], badFor: [], organic: true, allergy: false },
    { name: "真珠エキス", role: "美白・保湿", cat: "海洋由来", goodFor: ["aging"], badFor: [], organic: false, allergy: false },
    
    // その他注意成分
    { name: "ハイドロキノン", role: "強力美白", cat: "美白成分", goodFor: ["aging"], badFor: ["sensitive"], organic: false, allergy: true },
    { name: "過酸化ベンゾイル", role: "ニキビ治療", cat: "ニキビケア", goodFor: ["oily"], badFor: ["sensitive", "dry"], organic: false, allergy: true },
    { name: "イソプロピルメチルフェノール", role: "抗菌・防腐", cat: "防腐剤", goodFor: ["oily"], badFor: ["sensitive"], organic: false, allergy: false },
    
    // 追加の一般的成分
    { name: "尿素", role: "保湿・角質軟化", cat: "保湿成分", goodFor: ["dry"], badFor: [], organic: false, allergy: false },
    { name: "プラセンタ", role: "美白・保湿", cat: "美白成分", goodFor: ["aging"], badFor: [], organic: false, allergy: false },
    { name: "フラーレン", role: "抗酸化", cat: "エイジングケア", goodFor: ["aging"], badFor: [], organic: false, allergy: false },
    { name: "アデノシン", role: "シワ改善", cat: "エイジングケア", goodFor: ["aging"], badFor: [], organic: false, allergy: false },
    { name: "トレハロース", role: "保湿・細胞保護", cat: "保湿成分", goodFor: ["dry", "sensitive"], badFor: [], organic: true, allergy: false },
    { name: "ベタイン", role: "保湿・浸透促進", cat: "保湿成分", goodFor: ["dry"], badFor: [], organic: true, allergy: false },
    { name: "乳酸", role: "角質ケア・保湿", cat: "角質ケア", goodFor: ["oily"], badFor: ["sensitive"], organic: false, allergy: false },
    { name: "クエン酸", role: "pH調整・角質ケア", cat: "その他", goodFor: [], badFor: ["sensitive"], organic: true, allergy: false },
    { name: "水", role: "基材", cat: "基材", goodFor: ["dry", "oily", "sensitive", "mixed", "aging"], badFor: [], organic: true, allergy: false },
    { name: "BG", role: "保湿・防腐補助", cat: "保湿成分", goodFor: ["dry"], badFor: [], organic: false, allergy: false },
    { name: "PG", role: "保湿・溶剤", cat: "保湿成分", goodFor: ["dry"], badFor: [], organic: false, allergy: false },
    { name: "DPG", role: "保湿・感触改良", cat: "保湿成分", goodFor: ["dry"], badFor: [], organic: false, allergy: false },
    { name: "カルボマー", role: "増粘剤", cat: "その他", goodFor: [], badFor: [], organic: false, allergy: false },
    { name: "キサンタンガム", role: "増粘剤（天然）", cat: "その他", goodFor: [], badFor: [], organic: true, allergy: false },
    { name: "ステアリン酸", role: "乳化剤", cat: "その他", goodFor: [], badFor: [], organic: false, allergy: false },
    { name: "ミリスチン酸", role: "乳化剤・洗浄", cat: "その他", goodFor: [], badFor: [], organic: false, allergy: false },
    { name: "レシチン", role: "乳化剤（天然）", cat: "その他", goodFor: [], badFor: [], organic: true, allergy: false },
    { name: "フィトスフィンゴシン", role: "セラミド前駆体・バリア強化", cat: "保湿成分", goodFor: ["dry", "sensitive"], badFor: [], organic: true, allergy: false },
    { name: "コレステロール", role: "細胞膜構成成分・バリア改善", cat: "保湿成分", goodFor: ["dry", "sensitive"], badFor: [], organic: false, allergy: false },
    { name: "ラウロイルラクチレートNa", role: "セラミド機能サポート・乳化", cat: "保湿成分", goodFor: ["dry"], badFor: [], organic: false, allergy: false },
    { name: "セラミドNP", role: "バリア機能強化・保湿", cat: "保湿成分", goodFor: ["dry", "sensitive"], badFor: [], organic: false, allergy: false },
    { name: "セラミドAP", role: "バリア機能強化・角質ケア", cat: "保湿成分", goodFor: ["dry", "sensitive"], badFor: [], organic: false, allergy: false },
    { name: "セラミドEOP", role: "バリア機能強化・抗炎症", cat: "保湿成分", goodFor: ["dry", "sensitive"], badFor: [], organic: false, allergy: false },
    { name: "加水分解ヒアルロン酸", role: "浸透型保湿・高分子より小さい", cat: "保湿成分", goodFor: ["dry", "sensitive"], badFor: [], organic: true, allergy: false },
    { name: "アセチルヒアルロン酸Na", role: "スーパーヒアルロン酸・高保湿", cat: "保湿成分", goodFor: ["dry"], badFor: [], organic: true, allergy: false },
    { name: "ペンチレングリコール", role: "保湿・抗菌", cat: "保湿成分", goodFor: ["dry"], badFor: [], organic: false, allergy: false },
    { name: "パルミチン酸レチノール", role: "レチノール誘導体・シワ改善", cat: "エイジングケア", goodFor: ["aging"], badFor: ["sensitive"], organic: false, allergy: false },
    { name: "アスコルビルグルコシド", role: "ビタミンC誘導体・美白", cat: "美白成分", goodFor: ["aging"], badFor: [], organic: false, allergy: false },
    { name: "加水分解コラーゲン", role: "保湿・ハリ向上", cat: "保湿成分", goodFor: ["dry", "aging"], badFor: [], organic: false, allergy: false },
    { name: "ポリソルベート80", role: "可溶化剤・乳化", cat: "その他", goodFor: [], badFor: [], organic: false, allergy: false },
    { name: "アクリレーツコポリマー", role: "増粘・安定化", cat: "その他", goodFor: [], badFor: [], organic: false, allergy: false },
    { name: "水酸化Na", role: "pH調整", cat: "その他", goodFor: [], badFor: [], organic: false, allergy: false },
    { name: "EDTA-2Na", role: "キレート剤・安定化", cat: "その他", goodFor: [], badFor: [], organic: false, allergy: false },
    { name: "グリチルリチン酸2K", role: "抗炎症・肌荒れ改善", cat: "鎮静成分", goodFor: ["sensitive", "oily"], badFor: [], organic: true, allergy: false },
    { name: "PEG-60水添ヒマシ油", role: "可溶化剤", cat: "その他", goodFor: [], badFor: [], organic: false, allergy: false },
    { name: "ティーツリー葉油", role: "抗菌・皮脂調整", cat: "植物エキス", goodFor: ["oily"], badFor: [], organic: true, allergy: false },
    { name: "ハマメリスエキス", role: "収れん・皮脂コントロール", cat: "植物エキス", goodFor: ["oily"], badFor: [], organic: true, allergy: false },
    { name: "ユーカリ葉油", role: "抗菌・清涼", cat: "植物エキス", goodFor: ["oily"], badFor: [], organic: true, allergy: false },
    { name: "クエン酸Na", role: "pH調整・キレート", cat: "その他", goodFor: [], badFor: [], organic: true, allergy: false },
    { name: "メチルパラベン", role: "防腐剤", cat: "防腐剤", goodFor: [], badFor: ["sensitive"], organic: false, allergy: true },
    { name: "プロピルパラベン", role: "防腐剤", cat: "防腐剤", goodFor: [], badFor: ["sensitive"], organic: false, allergy: true },
];

// エシカル判定用のキーワード
const ETHICAL_KEYWORDS = {
    vegan: ["植物由来", "ヴィーガン", "動物成分不使用"],
    crueltyFree: ["動物実験なし", "クルエルティフリー"],
    organic: ["オーガニック", "有機", "天然"],
    eco: ["環境配慮", "サステナブル", "エコ", "生分解性"]
};