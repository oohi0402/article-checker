/**
 * ============================================================
 * oohi Writing Tool - textAnalyzer.js
 * Copyright (c) 2024-2026 大野ヒロアキ (Hiroaki Ohno)
 * All Rights Reserved. 無断複製・転載・再配布を禁じます。
 * ============================================================
 * テキスト解析ユーティリティ（TF-IDF / 感情辞書拡張 / ペルソナ語彙 / 構造分析）
 */
const TextAnalyzer = (() => {

  // ─── ストップワード ───
  const STOP_WORDS = new Set([
    'の','に','は','を','た','が','で','て','と','し','れ','さ','ある','いる',
    'も','する','から','な','こと','として','い','や','れる','など','なっ',
    'ない','この','ため','その','あっ','よう','また','もの','という','あり',
    'まで','られ','なる','へ','か','だ','これ','によって','により','おり',
    'より','による','ず','なり','られる','において','ば','なかっ','なく',
    'しかし','について','せ','だっ','それ','ほど','ながら','うち','そして',
    'とも','ただ','その他','それぞれ','ただし','です','ます','でした',
    'ました','でしょう','ましょう','ません','ですが','ですから','ですので',
    'ところ','あと','それから','そこで','だから','ところが','けれども',
    'ちょっと','ちゃん','さん','くん','さま','よね','かな','わね','だね',
    'って','じゃ','けど','だけど','とか','なんか','みたい','そう','どう',
    'こう','ああ','おお','えっ','ここ','そこ','あそこ','どこ','いつ',
    'なぜ','どれ','もう','まだ','いえ','はい'
  ]);

  // ─── 感情辞書（各カテゴリ40語） ───
  const EMOTION_DICT = {
    anxiety: [
      '不安','心配','リスク','危険','失敗','損','問題','悩み','困','怖',
      '注意','警告','トラブル','デメリット','落とし穴','難しい','厳しい','苦しい',
      '辛い','恐ろしい','危機','脅威','欠点','弱点','崩壊','後悔','迷い','焦り',
      '混乱','障害','被害','損害','マイナス','ネガティブ','ストレス','プレッシャー',
      '不満','疲弊','破綻','暴落'
    ],
    expectation: [
      '期待','楽しみ','ワクワク','チャンス','可能性','成長','成功','夢','目標','希望',
      'メリット','効果','理想','未来','飛躍','変革','革新','画期的','躍進','進化',
      '上昇','拡大','発展','前進','ブレイクスルー','ポテンシャル','伸び','高まる',
      '勝利','達成','突破','躍動','飛躍的','急成長','将来性','ビジョン','展望',
      '明るい','素晴らしい','最高'
    ],
    relief: [
      '安心','安全','保証','サポート','実績','信頼','確実','返金','無料','簡単',
      '手軽','便利','万全','充実','丁寧','親切','誠実','堅実','着実','安定',
      '穏やか','守る','支える','寄り添う','バックアップ','フォロー','ケア','対応',
      '解消','払拭','クリア','問題なし','心強い','頼もしい','大丈夫','確かな',
      '万が一','補償','保険','リスクフリー'
    ],
    interest: [
      'おすすめ','人気','話題','最新','注目','ランキング','比較','方法','コツ','秘訣',
      'ポイント','裏技','必見','徹底','完全','究極','厳選','選び方','使い方','活用',
      '攻略','まとめ','一覧','特集','トレンド','旬','ホット','バズ','プロ','専門家',
      '本音','暴露','独自','限定公開','初公開','驚き','衝撃','意外','実態','真実'
    ]
  };

  // ─── ペルソナ語彙辞書 ───
  const PERSONA_VOCAB = {
    gender: {
      female: [
        '美容','コスメ','スキンケア','ネイル','ヘア','メイク','ダイエット',
        'ヨガ','ピラティス','おしゃれ','カフェ','スイーツ','ママ','子育て',
        '女性','彼氏','恋愛','婚活','ウェディング','インテリア','収納',
        'ハンドメイド','アロマ','オーガニック','ナチュラル'
      ],
      male: [
        '筋トレ','ガジェット','車','バイク','釣り','キャンプ','投資','株',
        'FX','仮想通貨','ビジネス','起業','副業','転職','プログラミング',
        'エンジニア','サーバー','ゲーム','スポーツ','筋肉','トレーニング',
        '年収','独立','フリーランス','テック'
      ]
    },
    age: {
      young: [
        'バイト','就活','新卒','大学','サークル','Z世代','TikTok','インスタ',
        'SNS','推し','エモい','ヤバい','マジ','ガチ','映え','ストーリー',
        'リール','サブスク','コスパ','タイパ'
      ],
      middle: [
        '昇進','管理職','部下','マネジメント','住宅ローン','マイホーム',
        '保険','老後','年金','子供の教育','中学受験','PTA','共働き',
        'ワークライフバランス','キャリアアップ','転職','リスキリング',
        '資産運用','NISA','iDeCo'
      ],
      senior: [
        '定年','退職','老後','介護','健康','シニア','年金','相続',
        '終活','セカンドライフ','孫','還暦','趣味','散歩','園芸',
        '旅行','温泉','和食','伝統','文化'
      ]
    },
    job: {
      business: [
        'マーケティング','営業','売上','KPI','ROI','コンバージョン','広告',
        '集客','ブランディング','PR','戦略','企画','プレゼン','商談',
        'クライアント','見込み客','リード','ファネル','CRM','MA'
      ],
      tech: [
        'プログラミング','コード','API','データベース','クラウド','AWS',
        'Docker','React','Python','JavaScript','Git','CI/CD','テスト',
        'デプロイ','インフラ','セキュリティ','AI','機械学習','SaaS','DX'
      ],
      creative: [
        'デザイン','UI','UX','Figma','Photoshop','イラスト','写真',
        '動画','YouTube','編集','クリエイター','コンテンツ','ブログ',
        'ライティング','コピーライティング','SNS運用','インフルエンサー',
        'ブランド','ポートフォリオ','作品'
      ],
      medical: [
        '医療','看護','介護','薬','病院','クリニック','健康','予防',
        '治療','診断','症状','リハビリ','メンタルヘルス','うつ','自律神経',
        '免疫','栄養','サプリ','漢方','アレルギー'
      ]
    }
  };

  // ─── CTA / 信頼 / ベネフィット / 不安解消 / 希少性 / ストーリー パターン ───
  const CTA_PATTERNS = [
    /今すぐ/g, /お申し込み/g, /お問い合わせ/g, /無料/g, /ダウンロード/g,
    /登録/g, /購入/g, /クリック/g, /詳しくは/g, /こちら/g, /始め/g, /試し/g,
    /限定/g, /特別/g, /キャンペーン/g, /申込/g, /お試し/g, /体験/g,
    /資料請求/g, /予約/g, /エントリー/g, /参加/g, /手に入れ/g, /今なら/g,
    /チェック/g, /公式サイト/g, /申し込む/g, /購入する/g
  ];
  const TRUST_PATTERNS = [
    /実績/g, /万人/g, /件以上/g, /お客様の声/g, /レビュー/g, /口コミ/g,
    /評価/g, /受賞/g, /認定/g, /資格/g, /専門/g, /監修/g, /証明/g,
    /データ/g, /調査/g, /研究/g, /論文/g, /統計/g, /公式/g, /認証/g,
    /導入実績/g, /満足度/g, /顧客満足/g, /信頼性/g, /権威/g
  ];
  const BENEFIT_PATTERNS = [
    /できる/g, /なれる/g, /手に入/g, /解決/g, /改善/g, /アップ/g,
    /向上/g, /節約/g, /時短/g, /効率/g, /メリット/g, /効果/g, /結果/g,
    /成果/g, /利益/g, /得する/g, /お得/g, /便利/g, /快適/g, /楽になる/g
  ];
  const ANXIETY_RELIEF_PATTERNS = [
    /安心/g, /安全/g, /保証/g, /返金/g, /サポート/g, /リスクなし/g,
    /大丈夫/g, /心配.*ない/g, /問題.*ない/g, /万全/g, /フォロー/g,
    /バックアップ/g, /リスクフリー/g, /不安.*解消/g
  ];
  const SCARCITY_PATTERNS = [
    /限定/g, /先着/g, /残り/g, /今だけ/g, /期間限定/g, /数量限定/g,
    /特別/g, /プレミアム/g, /希少/g, /レア/g, /締め切り/g, /あと.*日/g,
    /在庫わずか/g, /売り切れ/g, /最終/g
  ];
  const STORY_PATTERNS = [
    /体験/g, /経験/g, /実は/g, /きっかけ/g, /ストーリー/g, /エピソード/g,
    /私は/g, /僕は/g, /始め/g, /以前/g, /当時/g, /最初/g, /その後/g,
    /結局/g, /ある日/g, /振り返/g, /思い出/g, /出会い/g, /転機/g, /変わ/g
  ];

  // ─── 基礎計測 ───
  function countChars(text) {
    return text.replace(/\s/g, '').length;
  }

  function countParagraphs(text) {
    return text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length || 1;
  }

  function avgSentenceLength(text) {
    const sentences = text.split(/[。！？!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length === 0) return 0;
    const totalChars = sentences.reduce((sum, s) => sum + s.replace(/\s/g, '').length, 0);
    return Math.round(totalChars / sentences.length);
  }

  // ─── トークナイズ ───
  function tokenize(text) {
    const cleaned = text.replace(/[^\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\uFF00-\uFFEFa-zA-Z0-9ー]/g, ' ');
    const pattern = /[\u4E00-\u9FFF]{2,}|[\u30A0-\u30FF\uFF00-\uFFEFー]{2,}|[\u3040-\u309F]{2,}|[a-zA-Z]{3,}/g;
    const matches = cleaned.match(pattern) || [];
    return matches.filter(w => !STOP_WORDS.has(w) && w.length >= 2);
  }

  // ─── TF-IDF ───
  function calcTF(tokens) {
    const freq = {};
    tokens.forEach(t => { freq[t] = (freq[t] || 0) + 1; });
    const total = tokens.length;
    const tf = {};
    Object.entries(freq).forEach(([word, count]) => {
      tf[word] = count / total;
    });
    return { tf, freq };
  }

  function calcPseudoIDF(word, sentences) {
    const docCount = sentences.filter(s => s.includes(word)).length;
    if (docCount === 0) return 0;
    return Math.log(sentences.length / docCount) + 1;
  }

  function keywordFrequencyTFIDF(text, topN) {
    const tokens = tokenize(text);
    const { tf, freq } = calcTF(tokens);
    const sentences = text.split(/[。！？!?\n]+/).filter(s => s.trim().length > 0);
    const scored = Object.entries(tf).map(([word, tfVal]) => {
      const idf = calcPseudoIDF(word, sentences);
      return { word, count: freq[word], tfidf: tfVal * idf };
    });
    scored.sort((a, b) => b.tfidf - a.tfidf);
    return scored.slice(0, topN);
  }

  function keywordFrequency(text, topN) {
    if (!topN) topN = 10;
    return keywordFrequencyTFIDF(text, topN);
  }

  function keywordDensity(text, keyword) {
    if (!keyword) return 0;
    const total = countChars(text);
    if (total === 0) return 0;
    const regex = new RegExp(keyword, 'gi');
    const matches = text.match(regex) || [];
    return parseFloat(((matches.length * keyword.length) / total * 100).toFixed(2));
  }

  // ─── パターンカウント汎用 ───
  function countPatterns(text, patterns) {
    let count = 0;
    patterns.forEach(p => {
      const m = text.match(p);
      if (m) count += m.length;
    });
    return count;
  }

  function countCTA(text)           { return countPatterns(text, CTA_PATTERNS); }
  function countTrustSignals(text)  { return countPatterns(text, TRUST_PATTERNS); }
  function countBenefits(text)      { return countPatterns(text, BENEFIT_PATTERNS); }
  function countAnxietyRelief(text) { return countPatterns(text, ANXIETY_RELIEF_PATTERNS); }
  function countScarcity(text)      { return countPatterns(text, SCARCITY_PATTERNS); }
  function countStoryElements(text) { return countPatterns(text, STORY_PATTERNS); }

  function countFAQ(text) {
    const patterns = [/[?？]/g, /よくある質問/g, /FAQ/gi, /Ｑ＆Ａ/g, /Q&A/gi, /質問/g];
    return Math.min(countPatterns(text, patterns), 30);
  }

  // ─── 感情分析（拡張辞書） ───
  function analyzeEmotion(text) {
    const scores = {};
    let total = 0;
    Object.entries(EMOTION_DICT).forEach(([emotion, words]) => {
      let count = 0;
      words.forEach(w => {
        const regex = new RegExp(w, 'g');
        const m = text.match(regex);
        if (m) count += m.length;
      });
      scores[emotion] = count;
      total += count;
    });
    if (total === 0) {
      return { anxiety: 25, expectation: 25, relief: 25, interest: 25 };
    }
    Object.keys(scores).forEach(k => {
      scores[k] = Math.round((scores[k] / total) * 100);
    });
    return scores;
  }

  // ─── ペルソナ語彙分析 ───
  function analyzePersonaVocab(text) {
    const result = { gender: {}, age: {}, job: {} };

    Object.entries(PERSONA_VOCAB.gender).forEach(([key, words]) => {
      let count = 0;
      words.forEach(w => { if (text.includes(w)) count++; });
      result.gender[key] = count;
    });

    Object.entries(PERSONA_VOCAB.age).forEach(([key, words]) => {
      let count = 0;
      words.forEach(w => { if (text.includes(w)) count++; });
      result.age[key] = count;
    });

    Object.entries(PERSONA_VOCAB.job).forEach(([key, words]) => {
      let count = 0;
      words.forEach(w => { if (text.includes(w)) count++; });
      result.job[key] = count;
    });

    return result;
  }

  // ─── 構造分析 ───
  function analyzeStructure(text) {
    const len = text.length;
    const third = Math.floor(len / 3);
    const firstThird = text.slice(0, third);
    const midThird = text.slice(third, third * 2);
    const lastThird = text.slice(third * 2);

    const problemPatterns = [/悩み/g, /問題/g, /課題/g, /困/g, /不安/g, /なぜ/g, /どうして/g, /原因/g];
    const solutionPatterns = [/解決/g, /方法/g, /対策/g, /コツ/g, /ポイント/g, /やり方/g, /手順/g, /ステップ/g];
    const summaryPatterns = [/まとめ/g, /結論/g, /最後に/g, /おわりに/g, /総括/g, /振り返/g, /ポイント/g];

    return {
      hasProblemIntro: countPatterns(firstThird, problemPatterns) >= 2,
      hasSolutionBody: countPatterns(midThird, solutionPatterns) >= 2,
      hasSummaryEnd: countPatterns(lastThird, summaryPatterns) >= 1,
      problemCount: countPatterns(text, problemPatterns),
      solutionCount: countPatterns(text, solutionPatterns)
    };
  }

  // ─── ファーストビュー分析 ───
  function analyzeFirstView(text) {
    const fv = text.slice(0, 400);
    return {
      hasPainPoint: /悩み|問題|困|課題|不安|辛い|苦しい|ストレス/.test(fv),
      hasBenefit: /メリット|効果|解決|できる|成果|結果|改善/.test(fv),
      hasHook: /なぜ|どう|実は|驚き|秘密|知らない|意外/.test(fv),
      hasQuestion: /[?？]/.test(fv),
      length: fv.length
    };
  }

  // ─── ストーリー構造分析（問題→解決→未来） ───
  function analyzeStoryStructure(text) {
    const len = text.length;
    const third = Math.floor(len / 3);
    const parts = [text.slice(0, third), text.slice(third, third * 2), text.slice(third * 2)];

    const problemInFirst = countPatterns(parts[0], [/悩み/g, /問題/g, /困/g, /課題/g, /辛い/g]) >= 1;
    const solutionInMid = countPatterns(parts[1], [/解決/g, /方法/g, /実践/g, /やり方/g, /手順/g]) >= 1;
    const futureInLast = countPatterns(parts[2], [/未来/g, /これから/g, /まとめ/g, /成功/g, /結果/g, /変わ/g]) >= 1;

    let score = 0;
    if (problemInFirst) score++;
    if (solutionInMid) score++;
    if (futureInLast) score++;

    return { problemInFirst, solutionInMid, futureInLast, score };
  }

  // ─── 改行頻度分析 ───
  function analyzeLineBreaks(text) {
    const lines = text.split(/\n/).filter(l => l.trim().length > 0);
    if (lines.length <= 1) return 0;
    const avgLineLen = text.replace(/\s/g, '').length / lines.length;
    if (avgLineLen >= 80 && avgLineLen <= 250) return 2;
    if (avgLineLen >= 50 && avgLineLen <= 400) return 1;
    return 0;
  }

  return {
    countChars,
    countParagraphs,
    avgSentenceLength,
    tokenize,
    keywordFrequency,
    keywordDensity,
    countCTA,
    countFAQ,
    analyzeEmotion,
    countTrustSignals,
    countBenefits,
    countAnxietyRelief,
    countScarcity,
    countStoryElements,
    analyzePersonaVocab,
    analyzeStructure,
    analyzeFirstView,
    analyzeStoryStructure,
    analyzeLineBreaks
  };
})();
