// ========================================
// ハダシル - フル機能版（検証機能搭載）
// ========================================

// 🔑 ここにあなたのGemini APIキーを貼り付けてください
const GEMINI_API_KEY = prompt('Gemini APIキーを入力してください:');

// 🌐 Gemini API呼び出し（ローカル開発用）
async function callGeminiAPI(requestBody) {
    // ローカル開発時は直接APIを呼ぶ
    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        }
    );
    
    if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
    }
    
    return await response.json();
}

// === グローバル変数 ===
let userProfile = {
    skinTypes: [],
    avoidIngredients: [],
    ethicalValues: []
};

let currentImageData = null;
let currentAnalysisData = null;
let aiLogs = {
    ocrPrompt: '',
    analysisPrompt: '',
    ocrResponse: '',
    analysisResponse: ''
};

// Myアイテムリスト
let myItems = JSON.parse(localStorage.getItem('hadashiru_my_items') || '[]');

// === 初期化 ===
document.addEventListener('DOMContentLoaded', () => {
    initCamera();
    initProfileSelectors();
    loadSavedProductsList();
    updateMyItemsList();
    checkFirstLaunch();
});

// カメラ初期化
async function initCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: "environment" } 
        });
        document.getElementById('video').srcObject = stream;
    } catch (err) {
        console.error('カメラアクセスエラー:', err);
        document.getElementById('status').innerText = 'カメラが使用できません（ファイルアップロードは可能）';
    }
}

// プロフィール選択の初期化
function initProfileSelectors() {
    loadSavedProfile();
    
    document.querySelectorAll('#skin-type-group .checkbox-item').forEach(item => {
        item.addEventListener('click', () => {
            item.classList.toggle('active');
            updateUserProfile();
            saveProfile();
        });
    });
    
    document.querySelectorAll('#avoid-ingredients .checkbox-item').forEach(item => {
        item.addEventListener('click', () => {
            item.classList.toggle('active');
            updateUserProfile();
            saveProfile();
        });
    });
    
    document.querySelectorAll('#ethical-values .checkbox-item').forEach(item => {
        item.addEventListener('click', () => {
            item.classList.toggle('active');
            updateUserProfile();
            saveProfile();
        });
    });
}

function saveProfile() {
    localStorage.setItem('ecoskin_user_profile', JSON.stringify(userProfile));
}

function loadSavedProfile() {
    const saved = localStorage.getItem('ecoskin_user_profile');
    if (!saved) return;
    
    try {
        const profile = JSON.parse(saved);
        userProfile = profile;
        
        profile.skinTypes.forEach(type => {
            const item = document.querySelector(`#skin-type-group .checkbox-item[data-value="${type}"]`);
            if (item) item.classList.add('active');
        });
        
        profile.avoidIngredients.forEach(avoid => {
            const item = document.querySelector(`#avoid-ingredients .checkbox-item[data-value="${avoid}"]`);
            if (item) item.classList.add('active');
        });
        
        profile.ethicalValues.forEach(value => {
            const item = document.querySelector(`#ethical-values .checkbox-item[data-value="${value}"]`);
            if (item) item.classList.add('active');
        });
    } catch (error) {
        console.error('プロフィール読み込みエラー:', error);
    }
}

function updateUserProfile() {
    userProfile.skinTypes = Array.from(
        document.querySelectorAll('#skin-type-group .checkbox-item.active')
    ).map(el => el.dataset.value);
    
    userProfile.avoidIngredients = Array.from(
        document.querySelectorAll('#avoid-ingredients .checkbox-item.active')
    ).map(el => el.dataset.value);
    
    userProfile.ethicalValues = Array.from(
        document.querySelectorAll('#ethical-values .checkbox-item.active')
    ).map(el => el.dataset.value);
}

// === 画像処理 ===
function loadImageFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = document.getElementById('image-preview');
        const video = document.getElementById('video');
        
        img.src = e.target.result;
        img.style.display = 'block';
        video.style.display = 'none';
        
        currentImageData = e.target.result;
        document.getElementById('reset-btn').style.display = 'block';
        
        analyzeWithGemini();
    };
    reader.readAsDataURL(file);
}

function captureAndAnalyze() {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    
    currentImageData = canvas.toDataURL('image/jpeg', 0.8);
    
    const img = document.getElementById('image-preview');
    img.src = currentImageData;
    img.style.display = 'block';
    video.style.display = 'none';
    
    document.getElementById('reset-btn').style.display = 'block';
    analyzeWithGemini();
}

function resetCamera() {
    const video = document.getElementById('video');
    const img = document.getElementById('image-preview');
    
    img.style.display = 'none';
    video.style.display = 'block';
    document.getElementById('reset-btn').style.display = 'none';
    
    const fileInput = document.getElementById('file-input');
    if (fileInput) fileInput.value = '';
    
    document.getElementById('result-area').style.display = 'none';
    document.getElementById('status').innerText = '準備完了';
    currentImageData = null;
}

// === Gemini API連携 ===
async function extractTextWithGemini(imageData) {
    const base64Image = imageData.split(',')[1];
    
    const prompt = `あなたは文字認識(OCR)ロボットです。画像から文字を読み取り、そのまま出力してください。

【あなたの役割】
文字を読むだけ。意味を理解したり、知識を使ったりしないでください。

【絶対禁止】
✗ 文字の意味を解釈する
✗ 別名・通称に言い換える
✗ 画像にない文字を追加する
✗ 成分の知識を使う

【出力形式】
読み取った文字をそのまま、カンマ区切りで出力してください。`;

    aiLogs.ocrPrompt = prompt;
    
    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: prompt },
                        {
                            inline_data: {
                                mime_type: "image/jpeg",
                                data: base64Image
                            }
                        }
                    ]
                }],
                generationConfig: {
                    temperature: 0.0,
                    candidateCount: 1
                }
            })
        }
    );
    
    if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Gemini API error:', response.status, errorText);
        throw new Error(`Gemini API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ OCR Response:', data);
    aiLogs.ocrResponse = JSON.stringify(data, null, 2);
    
    const extractedText = data.candidates[0].content.parts[0].text.trim();
    console.log('✅ Extracted text:', extractedText);
    return extractedText;
}

async function analyzeWithGemini() {
    if (!currentImageData) {
        alert('画像を選択してください');
        return;
    }
    
    document.getElementById('status').innerText = '🔄 解析中...';
    
    try {
        // 1. OCRで成分抽出
        const extractedText = await extractTextWithGemini(currentImageData);
        console.log('OCR Result:', extractedText);
        
        // 2. データベースで成分マッチング
        const matchedIngredients = matchIngredients(extractedText);
        console.log('Matched Ingredients:', matchedIngredients);
        
        // 3. 未登録成分を抽出
        const unknownIngredients = extractUnknownIngredients(extractedText, matchedIngredients);
        console.log('Unknown Ingredients:', unknownIngredients);
        
        // 4. 未登録成分の情報を取得してデータベースに追加
        if (unknownIngredients.length > 0) {
            document.getElementById('status').innerText = '未登録成分を学習中...';
            const unknownInfo = await fetchUnknownIngredientsInfo(unknownIngredients);
            addToDatabase(unknownInfo);
            matchedIngredients.push(...unknownInfo);
        }
        
        // 5. 成分情報を分析
        const analysisResult = await analyzeIngredientsWithGemini(
            matchedIngredients.map(i => i.name),
            extractedText
        );
        
        // 6. 結果表示
        await displayResults(matchedIngredients, analysisResult, extractedText);
        
        document.getElementById('status').innerText = '✅ 解析完了';
        
        // AI活用ログ更新
        document.getElementById('ocr-prompt-log').innerText = aiLogs.ocrPrompt;
        document.getElementById('analysis-prompt-log').innerText = aiLogs.analysisPrompt;
        
    } catch (error) {
        console.error('Analysis error:', error);
        alert('解析エラー: ' + error.message);
        document.getElementById('status').innerText = '❌ エラー';
    }
}

function matchIngredients(text) {
    const cleanText = text.replace(/[\s\/\(\)\-－\.\,、。]/g, "").toLowerCase();
    const matched = [];
    
    GLOBAL_DB.forEach(item => {
        const target = item.name.replace(/[\s\/\(\)\-－]/g, "").toLowerCase();
        if (cleanText.includes(target) || 
            (target.length >= 3 && cleanText.includes(target.substring(0, 3)))) {
            matched.push(item);
        }
    });
    
    return matched;
}

function extractUnknownIngredients(text, matchedIngredients) {
    const allIngredients = text.split(/[、,，]\s*/).filter(s => s.trim().length > 0);
    
    const unknown = allIngredients.filter(name => {
        const trimmed = name.trim();
        return !matchedIngredients.some(matched => 
            matched.name === trimmed || 
            matched.name.includes(trimmed) || 
            trimmed.includes(matched.name) ||
            trimmed.replace(/[\s\/\(\)\-－]/g, "").toLowerCase().includes(
                matched.name.replace(/[\s\/\(\)\-－]/g, "").toLowerCase()
            )
        );
    });
    
    return unknown;
}

async function fetchUnknownIngredientsInfo(unknownIngredients) {
    const prompt = `以下の化粧品成分について、各成分の情報をJSON形式で回答してください。

成分リスト: ${unknownIngredients.join('、')}

【出力形式】JSON配列のみを出力（説明文不要）
[
  {
    "name": "成分名（そのまま）",
    "role": "効果・役割（15文字以内）",
    "category": "カテゴリ（保湿成分/美白成分/鎮静成分/皮脂コントロール/植物エキス/オイル/ビタミン/防腐剤/界面活性剤/その他）",
    "organic": true/false,
    "allergy": true/false
  }
]`;

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }],
                    generationConfig: {
                        temperature: 0.3
                    }
                })
            }
        );
        
        const data = await response.json();
        let jsonText = data.candidates[0].content.parts[0].text;
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        
        const ingredientsInfo = JSON.parse(jsonText);
        
        return ingredientsInfo.map(info => ({
            name: info.name,
            role: info.role || '（情報なし）',
            cat: info.category || 'その他',
            goodFor: [],
            badFor: [],
            organic: info.organic || false,
            allergy: info.allergy || false
        }));
        
    } catch (error) {
        console.error('未登録成分取得エラー:', error);
        return unknownIngredients.map(name => ({
            name: name,
            role: '（取得失敗）',
            cat: 'その他',
            goodFor: [],
            badFor: [],
            organic: false,
            allergy: false
        }));
    }
}

function addToDatabase(newIngredients) {
    newIngredients.forEach(ingredient => {
        const exists = GLOBAL_DB.some(item => item.name === ingredient.name);
        if (!exists) {
            GLOBAL_DB.push(ingredient);
        }
    });
    
    try {
        localStorage.setItem('hadashiru_custom_db', JSON.stringify(GLOBAL_DB));
        console.log(`✅ ${newIngredients.length}件の成分を学習しました`);
    } catch (error) {
        console.error('DB保存エラー:', error);
    }
}

// === AIによる総合評価（詳細評価用） ===
async function analyzeIngredientsWithGemini(ingredients, rawText) {
    const profileInfo = `
ユーザープロフィール:
- 肌質: ${userProfile.skinTypes.length > 0 ? userProfile.skinTypes.map(t => {
    const map = {dry: '乾燥肌', oily: '脂性肌', sensitive: '敏感肌', mixed: '混合肌', aging: 'エイジングケア'};
    return map[t];
}).join('、') : '未設定'}
- 避けたい成分: ${userProfile.avoidIngredients.length > 0 ? userProfile.avoidIngredients.map(a => {
    const map = {alcohol: 'アルコール', fragrance: '香料', parabens: 'パラベン', sulfate: '硫酸塩'};
    return map[a];
}).join('、') : '未設定'}
- 重視する価値観: ${userProfile.ethicalValues.length > 0 ? userProfile.ethicalValues.map(e => {
    const map = {'plant-based': '植物由来成分重視', 'no-animal': '動物由来成分なし', 'natural': '天然・自然由来', 'minimal': 'シンプル処方'};
    return map[e];
}).join('、') : '未設定'}
`;

    const prompt = `あなたは、検出された成分のみを厳格に査定する化粧品成分鑑定士です。

${profileInfo}

検出された成分:
${rawText}

【絶対ルール】
分析の根拠は、以上の【検出された成分】に含まれる文字列のみに限定してください。
リストに存在しない成分を、あなたの推測や一般的な知識で追加して解説することは、
ユーザーの健康に関わるため「重大な規約違反」と見なします。

【分析タスク】
1. 総合適合度を0〜100%で評価
2. 適合する理由を50文字以内で説明
3. 詳細評価を150文字以内で記述

【出力形式】
適合度: XX%
理由: [50文字以内]
詳細: [150文字以内]`;

    try {
        const data = await callGeminiAPI({
            contents: [{
                parts: [{ text: prompt }]
            }],
            generationConfig: {
                temperature: 0.3
            }
        });
        
        const analysisText = data.candidates[0].content.parts[0].text;
        console.log('🤖 AI生出力:', analysisText);
        
        const matchScore = analysisText.match(/適合度[：:]\s*(\d+)%/);
        const matchReason = analysisText.match(/理由[：:]\s*(.+?)(?:\n|$)/);
        const matchDetail = analysisText.match(/詳細[：:]\s*([\s\S]+?)(?:\n\n|$)/);
        
        console.log('matchDetail:', matchDetail);
        
        return {
            score: matchScore ? parseInt(matchScore[1]) : 75,
            reason: matchReason ? matchReason[1].trim() : '',
            detail: matchDetail ? matchDetail[1].trim() : analysisText,
            raw: analysisText
        };
    } catch(e) {
        console.error('❌ AI総合評価取得失敗:', e);
        console.error('エラー詳細:', e.message, e.stack);
        return {
            score: 0,
            reason: '',
            detail: `AI分析を取得できませんでした。エラー: ${e.message}`,
            raw: ''
        };
    }
}
async function displayResults(ingredients, aiAnalysis, rawText) {
    document.getElementById('result-area').style.display = 'block';
    
    currentAnalysisData = {
        rawText: rawText,
        matchedIngredients: ingredients,
        aiAnalysis: aiAnalysis
    };
    
    const ingredientNames = ingredients.map(i => i.name);
    const conflicts = checkCompatibility(ingredientNames);
    displayCompatibilityWarnings(conflicts);
    
    resetChatHistory();
    document.getElementById('result-area').scrollIntoView({ behavior: 'smooth' });

    const validatedIngredients = ingredients.filter(i => rawText.includes(i.name));

    // 🔍 総合適合度を数式で計算（awaitでAI理由を取得）
    const scores = calculateScores(validatedIngredients);
    const formulaBasedScore = await calculateFormulaBasedOverallScore(scores, validatedIngredients, rawText);
    
    displayOverallMatch(formulaBasedScore);
    displayScores(scores);
    
    // 🔍 検証用：計算過程を記録
    logOverallMatchCalculation(aiAnalysis, validatedIngredients);
    logSkinScoreCalculation(scores, validatedIngredients);
    
    const hasAllergy = validatedIngredients.some(i => i.allergy);
    const hasAvoidIngredient = checkAvoidIngredients(validatedIngredients);
    
    if (hasAllergy || hasAvoidIngredient) {
        document.getElementById('allergy-alert').style.display = 'block';
        document.getElementById('success-alert').style.display = 'none';
    } else {
        document.getElementById('allergy-alert').style.display = 'none';
        document.getElementById('success-alert').style.display = 'block';
    }
    
    displayBadges(validatedIngredients);
    
    // 🤖 AIによる総合評価（詳細な文章説明）
    console.log('aiAnalysis:', aiAnalysis);
    const detailText = aiAnalysis.detail || aiAnalysis.raw || 'AI分析を取得できませんでした。';
    console.log('表示するdetail:', detailText);
    document.getElementById('ai-summary').innerText = detailText;
    
    displayIngredientList(ingredients, rawText);
}

function displayOverallMatch(formulaBasedScore) {
    const matchContainer = document.getElementById('overall-match');
    const scoreElement = document.getElementById('match-score');
    const reasonElement = document.getElementById('match-reason');
    
    matchContainer.style.display = 'block';
    
    const score = formulaBasedScore.score || 70;
    scoreElement.innerText = score + '%';
    
    // 計算過程を表示（改行を<br>に変換）
    const detailText = formulaBasedScore.detail || '';
    reasonElement.innerHTML = detailText.replace(/\n/g, '<br>');
    
    if (score >= 80) {
        matchContainer.style.background = 'linear-gradient(135deg, #27ae60, #2ecc71)';
    } else if (score >= 60) {
        matchContainer.style.background = 'linear-gradient(135deg, var(--primary), var(--secondary))';
    } else if (score >= 40) {
        matchContainer.style.background = 'linear-gradient(135deg, #f39c12, #e67e22)';
    } else {
        matchContainer.style.background = 'linear-gradient(135deg, #e74c3c, #c0392b)';
    }
}

function calculateScores(ingredients) {
    const scores = { dry: 50, oily: 50, sensitive: 50, mixed: 50, aging: 50 };
    
    ingredients.forEach(item => {
        if (item.goodFor) {
            item.goodFor.forEach(type => {
                scores[type] = Math.min(100, scores[type] + 12);
            });
        }
        if (item.badFor) {
            item.badFor.forEach(type => {
                scores[type] = Math.max(0, scores[type] - 18);
            });
        }
    });
    
    return scores;
}

function displayScores(scores) {
    const scoreLabels = {
        dry: '乾燥肌',
        oily: '脂性肌',
        sensitive: '敏感肌',
        mixed: '混合肌',
        aging: 'エイジングケア'
    };
    
    function convertToStars(score) {
        if (score >= 85) return '★★★★★';
        if (score >= 70) return '★★★★☆';
        if (score >= 55) return '★★★☆☆';
        if (score >= 40) return '★★☆☆☆';
        if (score >= 25) return '★☆☆☆☆';
        return '☆☆☆☆☆';
    }
    
    function getScoreText(score) {
        if (score >= 85) return '非常に適合';
        if (score >= 70) return '適合';
        if (score >= 55) return 'やや適合';
        if (score >= 40) return 'やや不適';
        if (score >= 25) return '不適';
        return '非常に不適';
    }
    
    let html = '';
    for (let type in scores) {
        const score = scores[type];
        const stars = convertToStars(score);
        const text = getScoreText(score);
        const color = score >= 70 ? 'var(--success)' : score >= 55 ? 'var(--primary)' : score >= 40 ? '#ff9800' : 'var(--warn)';
        
        html += `
            <div class="score-item">
                <div class="score-label">${scoreLabels[type]}</div>
                <div class="score-value" style="color: ${color}; font-size: 1.3rem;">${stars}</div>
                <div style="font-size: 0.75rem; color: #999; margin-top: 4px;">${text}</div>
            </div>
        `;
    }
    
    document.getElementById('score-grid').innerHTML = html;
}

function checkAvoidIngredients(ingredients) {
    const avoidMap = {
        'alcohol': ['エタノール', 'アルコール'],
        'fragrance': ['香料'],
        'parabens': ['パラベン'],
        'sulfate': ['硫酸', 'ラウリル硫酸']
    };
    
    for (let avoid of userProfile.avoidIngredients) {
        const keywords = avoidMap[avoid] || [];
        for (let ing of ingredients) {
            for (let keyword of keywords) {
                if (ing.name.includes(keyword)) {
                    return true;
                }
            }
        }
    }
    return false;
}

function displayBadges(ingredients) {
    const badgeArea = document.getElementById('badge-area');
    let badges = '<div class="badge active" style="background:var(--info)">🤖 AI分析完了</div>';
    
    const plantBasedCount = ingredients.filter(i => i.organic).length;
    if (plantBasedCount >= 3) {
        badges += '<div class="badge eco">🌿 植物由来豊富</div>';
    }
    
    const animalIngredients = ['コラーゲン', 'プラセンタ', 'ハチミツ', 'ミツロウ', '真珠'];
    const hasAnimal = ingredients.some(i => 
        animalIngredients.some(a => i.name.includes(a))
    );
    if (!hasAnimal && userProfile.ethicalValues.includes('no-animal')) {
        badges += '<div class="badge eco">🐰 動物由来成分なし</div>';
    }
    
    const naturalCategories = ['植物エキス', 'オイル', '発酵エキス', '海洋由来'];
    const naturalCount = ingredients.filter(i => 
        naturalCategories.includes(i.cat)
    ).length;
    if (naturalCount >= 3 && userProfile.ethicalValues.includes('natural')) {
        badges += '<div class="badge eco">🍃 天然由来成分中心</div>';
    }
    
    if (ingredients.length <= 15 && userProfile.ethicalValues.includes('minimal')) {
        badges += '<div class="badge">✨ シンプル処方</div>';
    }
    
    badgeArea.innerHTML = badges;
}

function displayIngredientList(ingredients, rawText) {
    const allIngredients = rawText.split(/[、,，]\s*/).filter(name => name.trim().length > 0);
    
    if (allIngredients.length === 0) {
        document.getElementById('ingredient-list').innerHTML = '<p style="text-align:center; color:#999;">成分が検出されませんでした</p>';
        return;
    }
    
    const categorized = {
        '保湿成分': [],
        '美白・エイジングケア': [],
        '鎮静・抗炎症': [],
        '皮脂コントロール・角質ケア': [],
        '植物エキス・オイル': [],
        'ビタミン・ミネラル': [],
        'UV・防御': [],
        '防腐剤・界面活性剤': [],
        '基材・その他': []
    };
    
    const alertCounts = {};
    const valueCounts = {};
    Object.keys(categorized).forEach(cat => {
        alertCounts[cat] = 0;
        valueCounts[cat] = 0;
    });
    
    allIngredients.forEach(name => {
        const trimmedName = name.trim();
        
        const matchedItem = ingredients.find(i => 
            i.name === trimmedName || 
            i.name.includes(trimmedName) || 
            trimmedName.includes(i.name)
        );
        
        const conflictsWithValues = checkValueConflict(trimmedName);
        
        const itemData = {
            name: trimmedName,
            matched: matchedItem,
            role: matchedItem ? matchedItem.role : '（データベースに情報なし）',
            organic: matchedItem ? matchedItem.organic : false,
            allergy: matchedItem ? matchedItem.allergy : false,
            valueConflict: conflictsWithValues
        };
        
        let targetCategory = '基材・その他';
        if (matchedItem) {
            const cat = matchedItem.cat;
            if (cat === '保湿成分') {
                targetCategory = '保湿成分';
            } else if (cat === '美白成分' || cat === 'エイジングケア') {
                targetCategory = '美白・エイジングケア';
            } else if (cat === '鎮静成分') {
                targetCategory = '鎮静・抗炎症';
            } else if (cat === '皮脂コントロール' || cat === '角質ケア') {
                targetCategory = '皮脂コントロール・角質ケア';
            } else if (cat === '植物エキス' || cat === 'オイル' || cat === '発酵エキス' || cat === '海洋由来') {
                targetCategory = '植物エキス・オイル';
            } else if (cat === 'ビタミン' || cat === 'ミネラル' || cat === 'アミノ酸') {
                targetCategory = 'ビタミン・ミネラル';
            } else if (cat === 'UV防御') {
                targetCategory = 'UV・防御';
            } else if (cat === '防腐剤' || cat === '界面活性剤') {
                targetCategory = '防腐剤・界面活性剤';
            }
        }
        
        categorized[targetCategory].push(itemData);
        
        if (itemData.allergy) {
            alertCounts[targetCategory]++;
        }
        if (itemData.valueConflict) {
            valueCounts[targetCategory]++;
        }
    });
    
    let html = `<div style="text-align:center; color:#666; margin-bottom:15px; font-size:0.9rem;">
        検出された全成分：${allIngredients.length}個
    </div>`;
    
    Object.keys(categorized).forEach((category, index) => {
        const items = categorized[category];
        if (items.length === 0) return;
        
        const categoryId = 'cat-' + index;
        const isExpanded = index === 0;
        const hasAlert = alertCounts[category] > 0;
        const hasValueConflict = valueCounts[category] > 0;
        
        // ── カテゴリーヘッダーのスタイル分岐 ──
        let sectionStyle, headerStyle, iconText, badgeHtml;
        
        if (hasAlert) {
            // 🔴 アレルギー・刺激 → 赤
            sectionStyle = 'border: 2px solid #e53935; border-radius: 10px; margin-bottom: 10px; overflow: hidden;';
            headerStyle  = 'background: linear-gradient(90deg, #ffebee, #ffcdd2); padding: 12px 15px; cursor: pointer; display: flex; align-items: center; gap: 6px;';
            iconText     = '⚠️';
            badgeHtml    = `<span style="background:#e53935;color:white;padding:2px 8px;border-radius:10px;font-size:0.7rem;">⚠️ ${alertCounts[category]}</span>`;
        } else if (hasValueConflict) {
            // 🟠 価値観に反する成分あり → オレンジ
            sectionStyle = 'border: 2px solid #fb8c00; border-radius: 10px; margin-bottom: 10px; overflow: hidden;';
            headerStyle  = 'background: linear-gradient(90deg, #fff3e0, #ffe0b2); padding: 12px 15px; cursor: pointer; display: flex; align-items: center; gap: 6px;';
            iconText     = '💔';
            badgeHtml    = `<span style="background:#fb8c00;color:white;padding:2px 8px;border-radius:10px;font-size:0.7rem;">💔 ${valueCounts[category]}</span>`;
        } else {
            // ⬜ 通常 → グレー
            sectionStyle = 'border: 1px solid #e0e0e0; border-radius: 10px; margin-bottom: 10px; overflow: hidden;';
            headerStyle  = 'background: #f5f5f5; padding: 12px 15px; cursor: pointer; display: flex; align-items: center; gap: 6px;';
            iconText     = '';
            badgeHtml    = '';
        }
        
        html += `
            <div class="category-section" style="${sectionStyle}">
                <div onclick="toggleCategory('${categoryId}')" style="${headerStyle}">
                    <span id="${categoryId}-icon" style="font-size:0.8rem;">${isExpanded ? '▼' : '▶'}</span>
                    <span style="font-weight:bold; flex:1;">${iconText ? iconText + ' ' : ''}${category}</span>
                    ${badgeHtml}
                    <span style="font-size:0.8rem; color:#999;">${items.length}個</span>
                </div>
                <div id="${categoryId}" style="display:${isExpanded ? 'block' : 'none'};">
        `;
        
        items.forEach(item => {
            // ── 成分ごとのスタイル分岐 ──
            let rowStyle, nameStyle, rightBadge;
            
            if (item.allergy) {
                // ⚠️ アレルギー・刺激成分
                rowStyle   = 'display:flex; align-items:center; padding:10px 15px; border-top:1px solid #ffcdd2; background:#fff8f8;';
                nameStyle  = 'font-weight:bold; color:#c62828;';
                rightBadge = `<span style="background:#ffebee;color:#c62828;border:1px solid #e53935;padding:2px 8px;border-radius:12px;font-size:0.75rem;white-space:nowrap;">⚠️ 注意</span>`;
            } else if (item.valueConflict) {
                // 💔 価値観に反する成分
                const conflictText = getValueConflictText(item.name);
                rowStyle   = 'display:flex; align-items:center; padding:10px 15px; border-top:1px solid #ffe0b2; background:#fffbf0;';
                nameStyle  = 'font-weight:bold; color:#e65100;';
                rightBadge = `<span style="background:#fff3e0;color:#e65100;border:1px solid #fb8c00;padding:2px 8px;border-radius:12px;font-size:0.75rem;white-space:nowrap;">💔 ${conflictText}</span>`;
            } else if (item.organic) {
                // 🌿 天然・植物由来成分
                rowStyle   = 'display:flex; align-items:center; padding:10px 15px; border-top:1px solid #e0e0e0; background:#f9fdf9;';
                nameStyle  = 'color:#2e7d32;';
                rightBadge = `<span style="background:#e8f5e9;color:#2e7d32;border:1px solid #81c784;padding:2px 8px;border-radius:12px;font-size:0.75rem;white-space:nowrap;">🌿 天然</span>`;
            } else {
                // 通常成分
                rowStyle   = 'display:flex; align-items:center; padding:10px 15px; border-top:1px solid #e0e0e0;';
                nameStyle  = 'color:#333;';
                rightBadge = '';
            }
            
            html += `
                <div style="${rowStyle}">
                    <div style="flex:1;">
                        <div style="${nameStyle} font-size:0.95rem;">${item.name}</div>
                        <div style="font-size:0.78rem; color:#999; margin-top:2px;">${item.role}</div>
                    </div>
                    ${rightBadge}
                </div>
            `;
        });
        
        html += `</div></div>`;
    });
    
    document.getElementById('ingredient-list').innerHTML = html;
}

function checkValueConflict(ingredientName) {
    // 動物由来チェック
    if (userProfile.ethicalValues.includes('no-animal')) {
        const animalIngredients = [
            'コラーゲン', 'プラセンタ', 'ハチミツ', 'ミツロウ', '真珠', 'シルク',
            'ケラチン', 'カゼイン', 'ラノリン', 'コレステロール', 'スクワラン',
            'エラスチン', 'フィブロイン', 'セリシン'
        ];
        if (animalIngredients.some(a => ingredientName.includes(a))) {
            return 'animal';
        }
    }
    return false;
}

function getValueConflictText(ingredientName) {
    const animalIngredients = {
        'コラーゲン': '動物由来', 'プラセンタ': '動物由来', 'ハチミツ': '動物由来',
        'ミツロウ': '動物由来', '真珠': '動物由来', 'シルク': '動物由来',
        'ケラチン': '動物由来', 'カゼイン': '動物由来', 'ラノリン': '動物由来',
        'コレステロール': '動物由来', 'スクワラン': '動物由来（サメ由来の場合）',
        'エラスチン': '動物由来', 'フィブロイン': '動物由来（シルク）',
        'セリシン': '動物由来（シルク）'
    };
    for (const [key, text] of Object.entries(animalIngredients)) {
        if (ingredientName.includes(key)) return text;
    }
    return '価値観に反する可能性';
}

function toggleCategory(categoryId) {
    const content = document.getElementById(categoryId);
    const icon = document.getElementById(categoryId + '-icon');
    
    if (content.style.display === 'none') {
        content.style.display = 'block';
        icon.innerText = '▼';
    } else {
        content.style.display = 'none';
        icon.innerText = '▶';
    }
}

// === タブ切り替え ===
function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    const activeBtn = document.querySelector(`[onclick="switchTab('${tabName}')"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    const activeContent = document.getElementById('tab-' + tabName);
    if (activeContent) {
        activeContent.classList.add('active');
    }
}

// 以降、AIチャット、製品管理、相性チェック、検証機能のコードが続きます...
// （文字数制限のため、次のファイルに続けます）

// === AIチャット機能 ===
function resetChatHistory() {
    const messagesContainer = document.getElementById('chat-messages');
    messagesContainer.innerHTML = `
        <div class="chat-message assistant-message">
            <div class="message-content">
                こんにちは！この製品の成分について、何でもお聞きください。
            </div>
        </div>
    `;
}

function toggleChat() {
    const container = document.getElementById('chat-container');
    const btn = document.getElementById('chat-toggle-btn');
    
    if (container.style.display === 'none') {
        container.style.display = 'block';
        btn.innerText = '🔽 閉じる';
    } else {
        container.style.display = 'none';
        btn.innerText = '💬 開く';
    }
}

function askQuickQuestion(question) {
    document.getElementById('chat-input').value = question;
    sendChatMessage();
}

async function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    if (!currentAnalysisData) {
        alert('先に成分を解析してください');
        return;
    }
    
    addChatMessage(message, 'user');
    input.value = '';
    
    const thinkingId = addThinkingMessage();
    
    const sendBtn = document.getElementById('chat-send-btn');
    sendBtn.disabled = true;
    sendBtn.innerText = '考え中...';
    
    try {
        const response = await askAIConcierge(message);
        removeThinkingMessage(thinkingId);
        addChatMessage(response, 'assistant');
    } catch (error) {
        removeThinkingMessage(thinkingId);
        addChatMessage('申し訳ございません。エラーが発生しました。', 'assistant');
        console.error('チャットエラー:', error);
    }
    
    sendBtn.disabled = false;
    sendBtn.innerText = '送信';
}

function addChatMessage(text, role) {
    const messagesContainer = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${role}-message`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.innerHTML = text.replace(/\n/g, '<br>');
    
    messageDiv.appendChild(contentDiv);
    messagesContainer.appendChild(messageDiv);
    
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function addThinkingMessage() {
    const messagesContainer = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message assistant-message thinking-message';
    messageDiv.id = 'thinking-' + Date.now();
    messageDiv.innerHTML = '<div class="message-content">考え中...</div>';
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    return messageDiv.id;
}

function removeThinkingMessage(id) {
    const thinkingMsg = document.getElementById(id);
    if (thinkingMsg) thinkingMsg.remove();
}

async function askAIConcierge(userQuestion) {
    const profileInfo = `
ユーザープロフィール:
- 肌質: ${userProfile.skinTypes.length > 0 ? userProfile.skinTypes.map(t => {
    const map = {dry: '乾燥肌', oily: '脂性肌', sensitive: '敏感肌', mixed: '混合肌'};
    return map[t];
}).join('、') : '未設定'}
`;

    const prompt = `あなたは化粧品成分の専門コンシェルジュです。

${profileInfo}

この製品に含まれる成分:
${currentAnalysisData.rawText}

【絶対ルール】
1. 回答の根拠は、上記の成分リストのみ
2. リストにない成分について推測で語らない
3. 200文字以内で簡潔に
4. 挨拶、自己紹介、締めの言葉は不要

【ユーザーの質問】
${userQuestion}`;

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    temperature: 0.7
                }
            })
        }
    );
    
    const data = await response.json();
    let aiResponse = data.candidates[0].content.parts[0].text;
    
    aiResponse = aiResponse.replace(/\*\*/g, '');
    aiResponse = aiResponse.replace(/^#+\s/gm, '');
    aiResponse = aiResponse.replace(/^こんにちは！?.*/m, '');
    aiResponse = aiResponse.replace(/^ご質問ありがとうございます！?\s*/i, '');
    aiResponse = aiResponse.trim();
    
    return aiResponse;
}

// === 製品管理機能 ===
function loadSavedProductsList() {
    const saved = getSavedProducts();
    const select = document.getElementById('saved-product-select');
    
    select.innerHTML = '<option value="">-- 新しく撮影する --</option>';
    
    saved.forEach((product, index) => {
        const option = document.createElement('option');
        option.value = index;
        const star = product.favorite ? '⭐ ' : '';
        option.textContent = star + (product.brand ? `${product.brand} - ${product.name}` : product.name);
        select.appendChild(option);
    });
}

function getSavedProducts() {
    const saved = localStorage.getItem('ecoskin_saved_products');
    return saved ? JSON.parse(saved) : [];
}

function loadSavedProduct() {
    const select = document.getElementById('saved-product-select');
    const index = select.value;
    
    if (index === '') return;
    
    const saved = getSavedProducts();
    const product = saved[index];
    
    if (!product) return;
    
    analyzeFromText(product.ingredients, product.name, product.brand);
}

async function analyzeFromText(ingredientsText, productName, brandName) {
    document.getElementById('status').innerText = '🔄 分析中...';
    
    try {
        const matchedIngredients = matchIngredients(ingredientsText);
        const aiAnalysis = await analyzeIngredientsWithGemini(matchedIngredients, ingredientsText);
        
        await displayResults(matchedIngredients, aiAnalysis, ingredientsText);
        
        document.getElementById('product-name-input').value = productName;
        if (brandName) {
            document.getElementById('brand-name-input').value = brandName;
        }
        
        currentAnalysisData = {
            rawText: ingredientsText,
            matchedIngredients: matchedIngredients,
            aiAnalysis: aiAnalysis
        };
        
        document.getElementById('status').innerText = '✅ 解析完了（保存済み製品）';
        
    } catch (error) {
        console.error('分析エラー:', error);
        alert('分析に失敗しました: ' + error.message);
        document.getElementById('status').innerText = '❌ エラーが発生しました';
    }
}

function saveProduct() {
    const productName = document.getElementById('product-name-input').value.trim();
    const brandName = document.getElementById('brand-name-input').value.trim();
    
    if (!productName) {
        alert('製品名を入力してください');
        return;
    }
    
    if (!currentAnalysisData) {
        alert('分析結果がありません');
        return;
    }
    
    // 重複チェック
    const saved = getSavedProducts();
    const isDuplicate = saved.some(p => p.name === productName);
    if (isDuplicate) {
        if (!confirm(`「${productName}」は既に保存されています。上書きしますか？`)) {
            return;
        }
        // 既存のものを削除
        const filtered = saved.filter(p => p.name !== productName);
        localStorage.setItem('ecoskin_saved_products', JSON.stringify(filtered));
    }
    
    const product = {
        name: productName,
        brand: brandName,
        ingredients: currentAnalysisData.rawText,
        favorite: false,
        savedAt: new Date().toISOString(),
        timestamp: Date.now()
    };
    
    const updatedSaved = getSavedProducts();
    updatedSaved.push(product);
    localStorage.setItem('ecoskin_saved_products', JSON.stringify(updatedSaved));
    
    document.getElementById('save-message').style.display = 'block';
    setTimeout(() => {
        document.getElementById('save-message').style.display = 'none';
    }, 3000);
    
    loadSavedProductsList();
}

function saveAndAddToMyItems() {
    saveProduct();
    addToMyItems();
}

// === 相性チェック機能 ===
const INCOMPATIBLE_PAIRS = [
    {
        ingredients1: ['レチノール', 'パルミチン酸レチノール'],
        ingredients2: ['AHA', 'BHA', 'グリコール酸', 'サリチル酸'],
        reason: '角質ケアが重なりすぎて、肌が薄くなる可能性があります',
        severity: 'high',
        recommendation: '使用日を分けてください'
    },
    {
        ingredients1: ['ビタミンC', 'アスコルビン酸'],
        ingredients2: ['ナイアシンアミド'],
        reason: '反応してニコチン酸に変化し、赤みが出ることがあります',
        severity: 'medium',
        recommendation: '赤みが出たら使用を控えてください'
    }
];

function updateMyItemsList() {
    const listContainer = document.getElementById('my-items-list');
    if (myItems.length === 0) {
        listContainer.innerHTML = '登録なし';
        return;
    }
    
    const html = myItems.map(item => 
        `<div style="padding: 4px 0;">• ${item.name}</div>`
    ).join('');
    listContainer.innerHTML = html;
}

function checkCompatibility(newProductIngredients) {
    if (myItems.length === 0) return [];
    
    const conflicts = [];
    const seen = new Set(); // 重複チェック用
    
    newProductIngredients.forEach(newIng => {
        myItems.forEach(item => {
            item.ingredients.forEach(existingIng => {
                const conflict = findIncompatiblePair(newIng, existingIng);
                if (conflict) {
                    // 重複チェック：製品名 + 理由 でユニークキーを作る
                    const key = `${item.name}::${conflict.reason}`;
                    if (!seen.has(key)) {
                        seen.add(key);
                        conflicts.push({
                            newIngredient: newIng,
                            existingProduct: item.name,
                            existingIngredient: existingIng,
                            reason: conflict.reason,
                            severity: conflict.severity,
                            recommendation: conflict.recommendation
                        });
                    }
                }
            });
        });
    });
    
    console.log('相性チェック結果:', conflicts); // デバッグ用
    return conflicts;
}

function findIncompatiblePair(ingredient1, ingredient2) {
    for (const pair of INCOMPATIBLE_PAIRS) {
        // 両方向でチェック
        const match1to2 = pair.ingredients1.some(i => ingredient1.includes(i) || i.includes(ingredient1)) &&
                          pair.ingredients2.some(i => ingredient2.includes(i) || i.includes(ingredient2));
        const match2to1 = pair.ingredients2.some(i => ingredient1.includes(i) || i.includes(ingredient1)) &&
                          pair.ingredients1.some(i => ingredient2.includes(i) || i.includes(ingredient2));
        
        if (match1to2 || match2to1) {
            console.log(`相性問題発見: ${ingredient1} × ${ingredient2}`); // デバッグ用
            return pair;
        }
    }
    return null;
}

function displayCompatibilityWarnings(conflicts) {
    const alertDiv = document.getElementById('compatibility-alert');
    const detailsDiv = document.getElementById('compatibility-details');
    
    if (conflicts.length === 0) {
        alertDiv.style.display = 'none';
        return;
    }
    
    alertDiv.style.display = 'block';
    
    let html = '';
    conflicts.forEach((conflict, index) => {
        const severityIcon = conflict.severity === 'high' ? '🔴' : '🟡';
        const severityText = conflict.severity === 'high' ? '高' : '中';
        html += `
            <div style="margin-bottom: ${index < conflicts.length - 1 ? '12px' : '0'}; padding: 12px; background: #fff3e0; border-left: 4px solid #ff9800; border-radius: 4px;">
                <div style="font-weight: bold; color: #e65100; margin-bottom: 6px;">
                    ${severityIcon} 使用中の「${conflict.existingProduct}」と相性注意（重大度: ${severityText}）
                </div>
                <div style="margin-bottom: 6px; color: #333;">${conflict.reason}</div>
                <div style="font-size: 0.85rem; color: #666;">
                    💡 ${conflict.recommendation}
                </div>
            </div>
        `;
    });
    
    detailsDiv.innerHTML = html;
}

function openMyItemsManager() {
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:10000;display:flex;align-items:center;justify-content:center;';
    
    const content = document.createElement('div');
    content.style.cssText = 'background:white;border-radius:12px;padding:24px;max-width:500px;width:90%;max-height:80vh;overflow-y:auto;';
    
    let html = '<h2 style="margin:0 0 16px 0;color:#2E86AB;">Myアイテム管理</h2>';
    
    if (myItems.length === 0) {
        html += '<p style="color:#999;text-align:center;padding:40px 0;">登録されたアイテムはありません</p>';
    } else {
        html += '<div style="margin-bottom:16px;">';
        myItems.forEach((item, index) => {
            const ingredientCount = Array.isArray(item.ingredients) ? item.ingredients.length : item.ingredients.split(/[、,，]/).length;
            html += `
                <div style="padding:12px;border:1px solid #ddd;border-radius:8px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;">
                    <div>
                        <div style="font-weight:bold;color:#333;">${item.name}</div>
                        <div style="font-size:0.85rem;color:#666;margin-top:4px;">${ingredientCount}成分</div>
                    </div>
                    <button onclick="removeFromMyItems(${index});document.body.removeChild(document.querySelector('[data-modal]'));" 
                            style="background:#e74c3c;color:white;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-size:0.9rem;">
                        削除
                    </button>
                </div>
            `;
        });
        html += '</div>';
    }
    
    html += '<button onclick="document.body.removeChild(document.querySelector(\'[data-modal]\'))" style="width:100%;padding:12px;background:#95a5a6;color:white;border:none;border-radius:8px;cursor:pointer;font-size:1rem;">閉じる</button>';
    
    content.innerHTML = html;
    modal.setAttribute('data-modal', 'true');
    modal.appendChild(content);
    document.body.appendChild(modal);
}

function removeFromMyItems(index) {
    myItems.splice(index, 1);
    localStorage.setItem('hadashiru_my_items', JSON.stringify(myItems));
    updateMyItemsList();
}

function addToMyItems() {
    const productName = document.getElementById('product-name-input').value.trim();
    
    if (!productName) {
        alert('製品名を入力してください');
        return;
    }
    
    if (!currentAnalysisData) {
        alert('分析結果がありません');
        return;
    }
    
    const ingredientNames = currentAnalysisData.rawText.split(/[、,，]\s*/).filter(s => s.trim());
    
    const item = {
        name: productName,
        ingredients: ingredientNames
    };
    
    myItems.push(item);
    localStorage.setItem('hadashiru_my_items', JSON.stringify(myItems));
    updateMyItemsList();
    
    console.log('Myアイテムに追加:', item);
    console.log('現在のMyアイテム:', myItems);
    
    alert(`「${productName}」をMyアイテムに追加しました（${ingredientNames.length}成分）`);
}

function openProductManager() {
    const saved = getSavedProducts();
    
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:10000;display:flex;align-items:center;justify-content:center;';
    
    const content = document.createElement('div');
    content.style.cssText = 'background:white;border-radius:12px;padding:24px;max-width:500px;width:90%;max-height:80vh;overflow-y:auto;';
    
    let html = '<h2 style="margin:0 0 16px 0;color:#2E86AB;">保存済み製品管理</h2>';
    
    if (saved.length === 0) {
        html += '<p style="color:#999;text-align:center;padding:40px 0;">保存された製品はありません</p>';
    } else {
        html += '<div style="margin-bottom:16px;">';
        saved.forEach((product, index) => {
            html += `
                <div style="padding:12px;border:1px solid #ddd;border-radius:8px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;">
                    <div>
                        <div style="font-weight:bold;color:#333;">${product.name}</div>
                        ${product.brand ? `<div style="font-size:0.8rem;color:#999;">${product.brand}</div>` : ''}
                        <div style="font-size:0.85rem;color:#666;margin-top:4px;">${new Date(product.savedAt).toLocaleDateString('ja-JP')}</div>
                    </div>
                    <button onclick="deleteProduct('${product.name}');document.body.removeChild(document.querySelector('[data-modal-products]'));" 
                            style="background:#e74c3c;color:white;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-size:0.9rem;">
                        削除
                    </button>
                </div>
            `;
        });
        html += '</div>';
    }
    
    html += '<button onclick="document.body.removeChild(document.querySelector(\'[data-modal-products]\'))" style="width:100%;padding:12px;background:#95a5a6;color:white;border:none;border-radius:8px;cursor:pointer;font-size:1rem;">閉じる</button>';
    
    content.innerHTML = html;
    modal.setAttribute('data-modal-products', 'true');
    modal.appendChild(content);
    document.body.appendChild(modal);
}

function deleteProduct(productName) {
    const saved = getSavedProducts();
    const filtered = saved.filter(p => p.name !== productName);
    localStorage.setItem('ecoskin_saved_products', JSON.stringify(filtered));
    loadSavedProductsList();
    alert(`「${productName}」を削除しました`);
}

// === 🔍 検証機能 ===
function logOverallMatchCalculation(aiAnalysis, ingredients) {
    const logElement = document.getElementById('match-calculation-log');
    if (logElement) {
        // 各項目をaiAnalysisから取得
        const score = aiAnalysis.score || "不明";
        const reason = aiAnalysis.reason || "（理由を取得できませんでした）";
        const detail = aiAnalysis.detail || "（詳細を取得できませんでした）";

        logElement.innerHTML = `
<pre style="white-space: pre-wrap; font-family: 'Courier New', monospace; font-size: 0.75rem; line-height: 1.5; padding: 10px; background: #fff; border: 1px solid #eee;">
<strong>【AI鑑定スコア】</strong>
<code style="background: #f0f0f0; padding: 2px 6px; border-radius: 3px; font-weight: bold;">適合度: ${score}%</code>

<strong>【鑑定理由】</strong>
${reason}

<strong>【分析詳細】</strong>
${detail}

<hr style="border: none; border-top: 1px dashed #ccc; margin: 10px 0;">
<em style="font-size: 0.65rem;">記録日時: ${new Date().toLocaleString('ja-JP')}</em>
</pre>
        `;
    }
}

function logSkinScoreCalculation(scores, ingredients) {
    const skinTypes = {
        dry: '乾燥肌',
        oily: '脂性肌',
        sensitive: '敏感肌',
        mixed: '混合肌',
        aging: 'エイジングケア'
    };
    
    const calculations = {};
    
    for (let type in skinTypes) {
        const goodIngredients = ingredients.filter(i => i.goodFor && i.goodFor.includes(type));
        const badIngredients = ingredients.filter(i => i.badFor && i.badFor.includes(type));
        
        const goodPoints = goodIngredients.length * 12;
        const badPoints = badIngredients.length * 18;
        const rawScore = 50 + goodPoints - badPoints;
        const finalScore = Math.max(0, Math.min(100, rawScore));
        
        calculations[skinTypes[type]] = {
            baseScore: 50,
            goodIngredients: goodIngredients.map(i => i.name),
            goodCount: goodIngredients.length,
            goodPoints: goodPoints,
            badIngredients: badIngredients.map(i => i.name),
            badCount: badIngredients.length,
            badPoints: badPoints,
            rawScore: rawScore,
            finalScore: finalScore,
            formula: `50 + (${goodIngredients.length} × 12) - (${badIngredients.length} × 18) = ${rawScore} → ${finalScore}`
        };
    }
    
    const log = {
        timestamp: new Date().toLocaleString('ja-JP'),
        method: 'データベース照合 + 固定スコアリング式',
        formula: '基準点50 + (goodFor成分数 × 12点) - (badFor成分数 × 18点)',
        range: '0-100点（上限・下限でクリップ）',
        calculations: calculations
    };
    
    const logElement = document.getElementById('score-calculation-log');
    if (logElement) {
        let html = `
<pre style="white-space: pre-wrap; font-family: 'Courier New', monospace; font-size: 0.75rem;">
<strong>【計算方法】</strong>
${log.method}

<strong>【計算式】</strong>
<code style="background: #f0f0f0; padding: 2px 6px; border-radius: 3px;">${log.formula}</code>

<strong>【各肌質の計算詳細】</strong>
`;
        
        for (let skinType in log.calculations) {
            const calc = log.calculations[skinType];
            html += `
─────────────────────────
<strong>■ ${skinType}</strong>

【計算式】
${calc.formula}

【詳細】
・基準点: ${calc.baseScore}点
・適合成分: ${calc.goodCount}個 → +${calc.goodPoints}点
・不適成分: ${calc.badCount}個 → -${calc.badPoints}点

【最終スコア】
<span style="color: var(--primary); font-weight: bold;">${calc.finalScore}点</span>
`;
        }
        
        html += `
<em>記録日時: ${log.timestamp}</em>
</pre>
        `;
        
        logElement.innerHTML = html;
    }
    
    return log;
}

function copyVerificationData() {
    if (!currentAnalysisData) {
        alert('⚠️ 先に成分表を解析してください');
        return;
    }
    
    const productName = document.getElementById('product-name-input')?.value || '（製品名未入力）';
    
    // 🔍 OCR抽出結果（rawText）
    const ocrIngredients = currentAnalysisData.rawText.split(/[、,，]\s*/).filter(s => s.trim());
    
    // 🔍 実際に画面表示されている成分（カテゴリー別表示の元データ）
    // displayIngredientList関数と同じロジックで取得
    const displayedIngredients = currentAnalysisData.rawText.split(/[、,，]\s*/).filter(name => name.trim().length > 0);
    
    // 🔍 ハルシネーションチェック
    // データベースマッチした成分のうち、displayedIngredientsに含まれないもの
    const hallucinations = [];
    currentAnalysisData.matchedIngredients.forEach(matched => {
        const foundInDisplayed = displayedIngredients.some(displayed => 
            displayed.trim() === matched.name || 
            displayed.trim().includes(matched.name) || 
            matched.name.includes(displayed.trim())
        );
        
        if (!foundInDisplayed) {
            hallucinations.push(matched.name);
        }
    });
    
    const timestamp = new Date().toLocaleString('ja-JP');
    
    // スプレッドシート用TSVデータ（タブ区切り）
    const tsvData = `${productName}\t${ocrIngredients.length}\t${ocrIngredients.join('、')}\t${displayedIngredients.length}\t${hallucinations.join('、') || 'なし'}\t${timestamp}`;
    
    // 表示用データ
    const displayData = {
        '製品名': productName,
        '検証日時': timestamp,
        '【①OCR精度】': {
            '説明': '目で数えた成分数と、OCR抽出数を比較してください',
            'OCR抽出数': ocrIngredients.length,
            'OCR抽出成分': ocrIngredients.join('、')
        },
        '【②AI分析精度】': {
            '説明': '目で数えた成分数と、画面表示された成分数を比較してください',
            '画面表示された成分数': displayedIngredients.length,
            '画面表示された成分': displayedIngredients.join('、'),
            'ハルシネーション成分': hallucinations.length > 0 ? hallucinations : 'なし',
            '注意': 'データベースマッチ数は無視してOK。画面に表示された成分のみカウントします。'
        },
        '【スプレッドシート用TSVデータ】': {
            '説明': '以下をコピーしてExcelの該当行に貼り付け',
            '列順': '製品名 | OCR抽出数 | OCR抽出成分 | 画面表示数 | ハルシネーション成分 | 検証日時',
            'データ': tsvData
        }
    };
    
    // 画面表示
    const output = document.getElementById('verification-data-output');
    if (output) {
        output.innerHTML = `
<pre style="white-space: pre-wrap; font-family: 'Courier New', monospace; font-size: 0.75rem;">${JSON.stringify(displayData, null, 2)}</pre>

<div style="margin-top: 15px; padding: 10px; background: #f0f7ff; border-radius: 8px;">
    <strong>📋 スプレッドシート用データ（Excelに貼り付け）</strong>
    <div style="margin: 10px 0; padding: 8px; background: white; border: 1px solid #ddd; border-radius: 4px;">
        <code style="font-size: 0.75rem; word-break: break-all;">${tsvData}</code>
    </div>
    <button onclick="navigator.clipboard.writeText('${tsvData.replace(/'/g, "\\'")}'); alert('✅ コピーしました');" style="background: var(--primary); color: white; border: none; padding: 8px 15px; border-radius: 6px; cursor: pointer; font-size: 0.9rem;">
        📋 TSVデータをコピー
    </button>
</div>

<div style="margin-top: 15px; padding: 10px; background: #fff3cd; border-radius: 8px;">
    <strong>💡 記録方法</strong>
    <ol style="margin: 8px 0; padding-left: 20px; font-size: 0.85rem;">
        <li>Excelを開く</li>
        <li>①OCR精度シート → 該当製品の行 → 「実際の成分数(A)」列に目で数えた数を入力</li>
        <li>「OCR抽出数(B)」列に上記のOCR抽出数をコピー</li>
        <li>②AI分析精度シート → 該当製品の行 → 「実際の成分数(A)」列に目で数えた数を入力</li>
        <li>「画面表示数(B)」列に上記の画面表示された成分数をコピー</li>
    </ol>
</div>
        `;
    }
    
    // クリップボードにコピー
    navigator.clipboard.writeText(tsvData).then(() => {
        alert('✅ TSVデータをコピーしました！\nExcelの該当行に貼り付けてください。');
    }).catch(err => {
        console.error('コピー失敗:', err);
    });
}

// 初回起動チェック（onboarding.jsで実装）
function checkFirstLaunch() {
    // この関数はonboarding.jsで上書きされる
}

// === 🔢 数式ベースの総合適合度計算（スコアは数式、理由はAI） ===
async function calculateFormulaBasedOverallScore(scores, ingredients, rawText) {
    const skinLabels = {dry: '乾燥肌', oily: '脂性肌', sensitive: '敏感肌', mixed: '混合肌', aging: 'エイジングケア'};
    const userSkinTypes = userProfile.skinTypes;
    const details = [];

    // ════════════════════════════════════════
    // 1. 肌質スコア（60点満点）
    //    DB の goodFor/badFor で計算した肌質スコア(0-100)を
    //    0-60点にスケール変換
    //    未設定 → 30点（中立）
    // ════════════════════════════════════════
    let skinPoints;
    if (userSkinTypes.length === 0) {
        skinPoints = 30;
        details.push('肌質スコア: 30点（未設定・中立）');
    } else {
        const relevantScores = userSkinTypes.map(t => scores[t] || 50);
        const avgSkinScore = relevantScores.reduce((a, b) => a + b, 0) / relevantScores.length;
        skinPoints = Math.round(avgSkinScore * 0.6);
        const typeNames = userSkinTypes.map(t => skinLabels[t]).join('・');
        details.push(`肌質スコア(${typeNames}): 平均${Math.round(avgSkinScore)}点 × 0.6 = ${skinPoints}点 / 60点満点`);
    }

    // ════════════════════════════════════════
    // 2. 避けたい成分（30点満点）
    //    未設定 → 30点（満点・関係なし）
    //    0種類含まれる → 30点
    //    1種類含まれる → 15点
    //    2種類含まれる →  5点
    //    3種類以上     →  0点
    // ════════════════════════════════════════
    let avoidPoints;
    const avoidKeywordMap = {
        'alcohol':   ['エタノール', 'アルコール'],
        'fragrance': ['香料'],
        'parabens':  ['パラベン', 'パラオキシ安息香酸'],
        'sulfate':   ['ラウリル硫酸', 'ラウレス硫酸']
    };

    if (userProfile.avoidIngredients.length === 0) {
        avoidPoints = 30;
        details.push('避けたい成分: 30点（未設定・関係なし）');
    } else {
        const ocrList = rawText.split(/[、,，]\s*/).map(s => s.trim());
        const foundList = [];

        for (const avoid of userProfile.avoidIngredients) {
            for (const kw of (avoidKeywordMap[avoid] || [])) {
                const hit = ocrList.find(name => name === kw || name.startsWith(kw));
                if (hit && !foundList.includes(hit)) {
                    foundList.push(hit);
                    break;
                }
            }
        }

        const hitCount = foundList.length;
        if      (hitCount === 0) { avoidPoints = 30; }
        else if (hitCount === 1) { avoidPoints = 15; }
        else if (hitCount === 2) { avoidPoints =  5; }
        else                     { avoidPoints =  0; }

        const hitText = hitCount === 0 ? 'なし' : foundList.join('、');
        details.push(`避けたい成分: ${hitCount}種類検出(${hitText}) → ${avoidPoints}点 / 30点満点`);
    }

    // ════════════════════════════════════════
    // 3. 価値観（10点満点）
    //    未設定 → 10点（満点・関係なし）
    //    違反0件 → 10点  / 1件 → 5点  / 2件以上 → 0点
    //    ※ minimal(シンプル処方)は設定した人にだけ適用
    // ════════════════════════════════════════
    let valuePoints;

    if (userProfile.ethicalValues.length === 0) {
        valuePoints = 10;
        details.push('価値観: 10点（未設定・関係なし）');
    } else {
        const ingredientCount = rawText.split(/[、,，]\s*/).filter(s => s.trim()).length;
        const wantsMinimal = userProfile.ethicalValues.includes('minimal');
        const minimalFail  = wantsMinimal && ingredientCount > 15;
        const valueConflicts = ingredients.filter(i => checkValueConflict(i.name));
        const violationCount = valueConflicts.length + (minimalFail ? 1 : 0);

        if      (violationCount === 0) { valuePoints = 10; }
        else if (violationCount === 1) { valuePoints =  5; }
        else                           { valuePoints =  0; }

        const vd = [];
        if (valueConflicts.length > 0) vd.push(`価値観に反する成分: ${valueConflicts.map(i=>i.name).join('、')}`);
        if (minimalFail) vd.push(`シンプル処方希望だが${ingredientCount}個（16個以上）`);
        const violationText = vd.length > 0 ? vd.join(' / ') : 'なし';
        details.push(`価値観: 違反${violationCount}件(${violationText}) → ${valuePoints}点 / 10点満点`);
    }

    // ════════════════════════════════════════
    // 合計
    // ════════════════════════════════════════
    const totalScore = Math.max(0, Math.min(100, skinPoints + avoidPoints + valuePoints));
    details.push(`─\n合計: ${skinPoints} + ${avoidPoints} + ${valuePoints} = ${totalScore}点`);
    const formulaText = details.join('\n');

    // ── AIが「なぜこの点数か」を日本語で説明 ──
    let aiReason = details.join('、');
    try {
        const resp = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    contents: [{parts: [{text:
                        `化粧品成分コンシェルジュとして、以下の計算結果を踏まえてユーザーへ一言コメントをください。
計算過程:
${formulaText}
総合適合度: ${totalScore}%

【ルール】
・50文字以内
・計算過程の数字をもとに具体的に
・「〜ため${totalScore}%です」のような形で締める
・挨拶・前置き不要`
                    }]}],
                    generationConfig: {temperature: 0.3}
                })
            }
        );
        if (resp.ok) {
            const d = await resp.json();
            aiReason = d.candidates[0].content.parts[0].text.trim();
        }
    } catch(e) {
        console.warn('AI理由取得失敗:', e);
    }

    // AI活用ログに計算過程を表示
    const logEl = document.getElementById('match-calculation-log');
    if (logEl) {
        logEl.innerHTML = `<pre style="white-space:pre-wrap;font-family:'Courier New',monospace;font-size:0.75rem;margin:0;"><strong>【配点設計】肌質60点 ＋ 避けたい成分30点 ＋ 価値観10点 ＝ 100点満点</strong>

${formulaText}
</pre>`;
    }

    return {
        score: totalScore,
        reason: aiReason,
        detail: formulaText,
        raw: `総合適合度: ${totalScore}%\n${formulaText}`,
        formula: true
    };
}