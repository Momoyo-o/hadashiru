// オンボーディング機能

const onboardingSteps = [
    {
        id: 'welcome',
        type: 'welcome',
        title: 'ハダシルへようこそ！',
        message: 'まずは、あなたの肌について教えてください。',
        button: '始める'
    },
    {
        id: 'skin-concern',
        type: 'question',
        question: '肌の悩みを教えてください',
        subtitle: '複数選択可能です',
        options: [
            { text: '乾燥する', icon: '💧', value: 'dry' },
            { text: 'テカリ・ニキビ', icon: '✨', value: 'oily' },
            { text: '敏感・赤み', icon: '🌸', value: 'sensitive' },
            { text: '特になし', icon: '😊', value: 'none' }
        ],
        multiSelect: true
    },
    {
        id: 'avoid-explain',
        type: 'explanation',
        title: '避けたい成分について',
        message: `化粧品には様々な成分が含まれています。
        
        特定の成分が肌に合わない場合、避けたい成分として設定できます。
        
        次のページで、よくある注意成分についてご説明します。`,
        button: '次へ'
    },
    {
        id: 'avoid-ingredients',
        type: 'question',
        question: '避けたい成分はありますか？',
        subtitle: '複数選択可能です',
        options: [
            { 
                text: 'アルコール', 
                icon: '🚫', 
                value: 'alcohol',
                explain: '乾燥肌や敏感肌には刺激になることがあります'
            },
            { 
                text: '香料', 
                icon: '🌹', 
                value: 'fragrance',
                explain: '敏感肌の方は刺激を感じることがあります'
            },
            { 
                text: 'パラベン', 
                icon: '⚠️', 
                value: 'parabens',
                explain: '防腐剤の一種。稀にアレルギー反応が出ることがあります'
            },
            { 
                text: '硫酸塩', 
                icon: '🧴', 
                value: 'sulfate',
                explain: '強い洗浄成分。乾燥を引き起こすことがあります'
            },
            { 
                text: 'わからない', 
                icon: '❓', 
                value: 'none'
            }
        ],
        multiSelect: true
    },
    {
        id: 'values-explain',
        type: 'explanation',
        title: '価値観について',
        message: `化粧品選びでは、成分の効果だけでなく、
        環境や動物への配慮も大切な視点です。
        
        あなたが重視する価値観を教えてください。`,
        button: '次へ'
    },
    {
        id: 'values',
        type: 'question',
        question: '重視する価値観は？',
        subtitle: '複数選択可能です',
        options: [
            { 
                text: '植物由来成分', 
                icon: '🌿', 
                value: 'plant-based',
                explain: '植物由来の成分を重視します'
            },
            { 
                text: '動物由来成分なし', 
                icon: '💔', 
                value: 'no-animal',
                explain: 'コラーゲンなど動物由来の成分を避けます'
            },
            { 
                text: '天然・自然由来', 
                icon: '🍃', 
                value: 'natural',
                explain: '化学合成された成分を避けます'
            },
            { 
                text: 'シンプル処方', 
                icon: '✨', 
                value: 'minimal',
                explain: '成分数の少ない製品を好みます'
            },
            { 
                text: '特になし', 
                icon: '😊', 
                value: 'none'
            }
        ],
        multiSelect: true
    },
    {
        id: 'complete',
        type: 'complete',
        title: '設定完了！',
        message: '準備ができました。\n早速、成分表をスキャンしてみましょう！',
        button: 'ハダシルを始める'
    }
];

let currentStepIndex = 0;
let onboardingData = {
    skinTypes: [],
    avoidIngredients: [],
    ethicalValues: []
};

// オンボーディング開始
function startOnboarding() {
    // 既にプロフィール設定済みかチェック
    const hasProfile = localStorage.getItem('hadashiru_profile_completed');
    if (hasProfile) {
        return; // スキップ
    }
    
    currentStepIndex = 0;
    onboardingData = {
        skinTypes: [],
        avoidIngredients: [],
        ethicalValues: []
    };
    
    document.getElementById('onboarding-overlay').style.display = 'block';
    
    renderStep();
}

// ステップをレンダリング
function renderStep() {
    const step = onboardingSteps[currentStepIndex];
    const container = document.getElementById('onboarding-content');
    
    if (step.type === 'welcome') {
        container.innerHTML = `
            <div style="text-align: center;">
                <div style="font-size: 4rem; margin-bottom: 20px;">🌿</div>
                <h2 style="font-size: 1.5rem; margin-bottom: 15px; color: var(--primary);">${step.title}</h2>
                <p style="color: #666; font-size: 1rem; line-height: 1.8; margin-bottom: 30px;">${step.message}</p>
                <button onclick="nextStep()" style="background: var(--primary); color: white; border: none; padding: 15px 40px; border-radius: 25px; font-size: 1rem; font-weight: bold; cursor: pointer; box-shadow: 0 4px 12px rgba(118, 186, 153, 0.3);">
                    ${step.button}
                </button>
            </div>
        `;
    } else if (step.type === 'explanation') {
        container.innerHTML = `
            <div>
                <h2 style="font-size: 1.3rem; margin-bottom: 15px; color: var(--primary);">${step.title}</h2>
                <p style="color: #666; font-size: 0.95rem; line-height: 1.8; white-space: pre-line; margin-bottom: 30px;">${step.message}</p>
                <div style="display: flex; gap: 10px;">
                    <button onclick="prevStep()" style="flex: 1; background: #e0e0e0; color: #666; border: none; padding: 12px; border-radius: 10px; font-size: 0.95rem; cursor: pointer;">
                        ← 戻る
                    </button>
                    <button onclick="nextStep()" style="flex: 2; background: var(--primary); color: white; border: none; padding: 12px; border-radius: 10px; font-size: 0.95rem; font-weight: bold; cursor: pointer;">
                        ${step.button}
                    </button>
                </div>
            </div>
        `;
    } else if (step.type === 'question') {
        const selectedValues = getSelectedValues(step.id);
        
        let optionsHtml = step.options.map(opt => {
            const isSelected = selectedValues.includes(opt.value);
            return `
                <div class="onboarding-option ${isSelected ? 'selected' : ''}" onclick="toggleOption('${step.id}', '${opt.value}', ${step.multiSelect})" style="border: 2px solid ${isSelected ? 'var(--primary)' : '#e0e0e0'}; background: ${isSelected ? '#f0f7f3' : 'white'}; padding: 15px; border-radius: 12px; margin-bottom: 12px; cursor: pointer; transition: all 0.3s;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="font-size: 1.8rem;">${opt.icon}</div>
                        <div style="flex: 1;">
                            <div style="font-weight: bold; margin-bottom: ${opt.explain ? '4px' : '0'};">${opt.text}</div>
                            ${opt.explain ? `<div style="font-size: 0.85rem; color: #666;">${opt.explain}</div>` : ''}
                        </div>
                        ${isSelected ? '<div style="color: var(--primary); font-size: 1.5rem;">✓</div>' : ''}
                    </div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = `
            <div>
                <h2 style="font-size: 1.3rem; margin-bottom: 8px; color: var(--primary);">${step.question}</h2>
                ${step.subtitle ? `<p style="color: #999; font-size: 0.85rem; margin-bottom: 20px;">${step.subtitle}</p>` : ''}
                <div style="margin-bottom: 20px;">
                    ${optionsHtml}
                </div>
                <div style="display: flex; gap: 10px;">
                    <button onclick="prevStep()" style="flex: 1; background: #e0e0e0; color: #666; border: none; padding: 12px; border-radius: 10px; font-size: 0.95rem; cursor: pointer;">
                        ← 戻る
                    </button>
                    <button onclick="nextStep()" style="flex: 2; background: var(--primary); color: white; border: none; padding: 12px; border-radius: 10px; font-size: 0.95rem; font-weight: bold; cursor: pointer;">
                        次へ →
                    </button>
                </div>
            </div>
        `;
    } else if (step.type === 'complete') {
        container.innerHTML = `
            <div style="text-align: center;">
                <div style="font-size: 4rem; margin-bottom: 20px;">✨</div>
                <h2 style="font-size: 1.5rem; margin-bottom: 15px; color: var(--primary);">${step.title}</h2>
                <p style="color: #666; font-size: 1rem; line-height: 1.8; white-space: pre-line; margin-bottom: 30px;">${step.message}</p>
                <button onclick="completeOnboarding()" style="background: var(--primary); color: white; border: none; padding: 15px 40px; border-radius: 25px; font-size: 1rem; font-weight: bold; cursor: pointer; box-shadow: 0 4px 12px rgba(118, 186, 153, 0.3);">
                    ${step.button}
                </button>
            </div>
        `;
    }
    
    // プログレスバー更新
    updateProgressBar();
}

function getSelectedValues(stepId) {
    if (stepId === 'skin-concern') return onboardingData.skinTypes;
    if (stepId === 'avoid-ingredients') return onboardingData.avoidIngredients;
    if (stepId === 'values') return onboardingData.ethicalValues;
    return [];
}

function toggleOption(stepId, value, multiSelect) {
    const step = onboardingSteps[currentStepIndex];
    let selectedValues = getSelectedValues(stepId);
    
    if (value === 'none') {
        // 「特になし」を選択した場合、他の選択をクリア
        selectedValues.length = 0;
        selectedValues.push('none');
    } else {
        // 通常の選択
        const index = selectedValues.indexOf(value);
        if (index > -1) {
            selectedValues.splice(index, 1);
        } else {
            if (multiSelect) {
                // 「特になし」を削除
                const noneIndex = selectedValues.indexOf('none');
                if (noneIndex > -1) selectedValues.splice(noneIndex, 1);
                selectedValues.push(value);
            } else {
                selectedValues.length = 0;
                selectedValues.push(value);
            }
        }
    }
    
    renderStep();
}

function nextStep() {
    if (currentStepIndex < onboardingSteps.length - 1) {
        currentStepIndex++;
        renderStep();
    }
}

function prevStep() {
    if (currentStepIndex > 0) {
        currentStepIndex--;
        renderStep();
    }
}

function updateProgressBar() {
    // プログレスバーは省略（シンプルに）
}

function completeOnboarding() {
    // 'none'を除外
    const finalData = {
        skinTypes: onboardingData.skinTypes.filter(v => v !== 'none'),
        avoidIngredients: onboardingData.avoidIngredients.filter(v => v !== 'none'),
        ethicalValues: onboardingData.ethicalValues.filter(v => v !== 'none')
    };
    
    // プロフィールに反映
    userProfile = finalData;
    
    // ローカルストレージに保存
    localStorage.setItem('ecoskin_user_profile', JSON.stringify(userProfile));
    localStorage.setItem('hadashiru_profile_completed', 'true');
    
    // UIに反映
    document.querySelectorAll('#skin-type-group .checkbox-item').forEach(item => {
        if (finalData.skinTypes.includes(item.dataset.value)) {
            item.classList.add('active');
        }
    });
    
    document.querySelectorAll('#avoid-ingredients .checkbox-item').forEach(item => {
        if (finalData.avoidIngredients.includes(item.dataset.value)) {
            item.classList.add('active');
        }
    });
    
    document.querySelectorAll('#ethical-values .checkbox-item').forEach(item => {
        if (finalData.ethicalValues.includes(item.dataset.value)) {
            item.classList.add('active');
        }
    });
    
    // オンボーディング画面を非表示
    document.getElementById('onboarding-overlay').style.display = 'none';
    
    alert('✨ 設定完了！早速、成分表をスキャンしてみましょう！');
}

// ページロード時にオンボーディングチェック
document.addEventListener('DOMContentLoaded', () => {
    // startOnboarding();

});
