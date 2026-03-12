/**
 * ============================================================
 * oohi Writing Tool - scoreCalculator.js
 * Copyright (c) 2024-2026 大野ヒロアキ (Hiroaki Ohno)
 * All Rights Reserved. 無断複製・転載・再配布を禁じます。
 * ============================================================
 * SEO/CVRスコア算出・ペルソナ推定・改善提案・記事改善アドバイス
 */
const ScoreCalculator = (() => {

  /**
   * SEOスコアを算出（強化版）
   */
  function calcSEO(article) {
    const details = [];
    const text = article.bodyText;
    const topKW = TextAnalyzer.keywordFrequency(text, 5);

    // 1) タイトル評価 (0-20) — タイトル長 + キーワード包含
    let titleScore = 0;
    const tLen = (article.title || '').length;
    if (tLen >= 15 && tLen <= 40) titleScore += 12;
    else if (tLen >= 10 && tLen <= 60) titleScore += 8;
    else if (tLen > 0) titleScore += 4;
    // タイトルにトップキーワードが含まれるか
    if (topKW.length > 0) {
      const kwInTitle = topKW.slice(0, 3).some(k => (article.title || '').includes(k.word));
      if (kwInTitle) titleScore += 8;
    }
    details.push({ name: 'タイトル評価', score: Math.min(titleScore, 20), max: 20 });

    // 2) 見出し構造 (0-20) — H1/H2/H3階層チェック
    let headingScore = 0;
    const hCount = article.headings.length;
    const hasH2 = article.headings.some(h => h.level === 2);
    const hasH3 = article.headings.some(h => h.level === 3);
    const h2Count = article.headings.filter(h => h.level === 2).length;
    const h3Count = article.headings.filter(h => h.level === 3).length;

    if (hCount >= 5 && hCount <= 15) headingScore += 10;
    else if (hCount >= 3 && hCount <= 20) headingScore += 6;
    else if (hCount >= 1) headingScore += 3;

    if (hasH2 && h2Count >= 3) headingScore += 5;
    else if (hasH2) headingScore += 3;

    if (hasH2 && hasH3 && h3Count >= 2) headingScore += 5;
    else if (hasH2 && hasH3) headingScore += 3;
    details.push({ name: '見出し構造', score: Math.min(headingScore, 20), max: 20 });

    // 3) キーワード最適化 (0-20) — 密度 + 関連語スコア
    let kwScore = 0;
    if (topKW.length > 0) {
      const density = TextAnalyzer.keywordDensity(text, topKW[0].word);
      const headingTexts = article.headings.map(h => h.text).join(' ');
      const kwInHeadings = topKW.slice(0, 3).some(k => headingTexts.includes(k.word));

      if (density >= 1 && density <= 4) kwScore += 8;
      else if (density > 0.5 && density < 6) kwScore += 5;
      else if (density > 0) kwScore += 2;

      if (kwInHeadings) kwScore += 6;

      // 関連語の多様性（トップ5のうち3つ以上ユニークなら加点）
      if (topKW.length >= 3) kwScore += 4;
      else if (topKW.length >= 2) kwScore += 2;
    }
    details.push({ name: 'キーワード最適化', score: Math.min(kwScore, 20), max: 20 });

    // 4) 可読性 (0-20) — 平均文長 + 改行頻度
    let readScore = 0;
    const asl = article.avgSentLen;
    if (asl >= 20 && asl <= 60) readScore += 8;
    else if (asl > 0 && asl < 80) readScore += 4;

    if (article.paragraphs >= 5) readScore += 3;
    else if (article.paragraphs >= 3) readScore += 2;

    if (article.charCount >= 2000 && article.charCount <= 10000) readScore += 4;
    else if (article.charCount >= 1000) readScore += 2;

    // 改行頻度
    const lineBreakScore = TextAnalyzer.analyzeLineBreaks(text);
    readScore += lineBreakScore * 2;

    details.push({ name: '可読性', score: Math.min(readScore, 20), max: 20 });

    // 5) 検索意図一致 (0-20) — 構造分析
    let intentScore = 0;
    const structure = TextAnalyzer.analyzeStructure(text);

    if (structure.hasProblemIntro) intentScore += 4;
    if (structure.hasSolutionBody) intentScore += 4;
    if (structure.hasSummaryEnd) intentScore += 4;

    const faqCount = TextAnalyzer.countFAQ(text);
    if (faqCount >= 3) intentScore += 4;
    else if (faqCount >= 1) intentScore += 2;

    if (article.charCount >= 1500) intentScore += 4;
    details.push({ name: '検索意図一致', score: Math.min(intentScore, 20), max: 20 });

    const total = details.reduce((s, d) => s + d.score, 0);
    return { total, details };
  }

  /**
   * CVRスコアを算出（強化版）
   */
  function calcCVR(article) {
    const details = [];
    const text = article.bodyText;

    // 1) ファーストビュー (0-15) — 痛み・ベネフィット・フック・疑問
    let fvScore = 0;
    const fv = TextAnalyzer.analyzeFirstView(text);
    if (fv.hasPainPoint) fvScore += 4;
    if (fv.hasBenefit) fvScore += 4;
    if (fv.hasHook) fvScore += 4;
    if (fv.hasQuestion) fvScore += 3;
    details.push({ name: 'ファーストビュー', score: Math.min(fvScore, 15), max: 15 });

    // 2) ベネフィット (0-15)
    let benScore = 0;
    const benefitCount = TextAnalyzer.countBenefits(text);
    if (benefitCount >= 10) benScore = 15;
    else if (benefitCount >= 6) benScore = 12;
    else if (benefitCount >= 3) benScore = 8;
    else if (benefitCount >= 1) benScore = 4;
    details.push({ name: 'ベネフィット', score: benScore, max: 15 });

    // 3) 信頼性 (0-15)
    let trustScore = 0;
    const trustCount = TextAnalyzer.countTrustSignals(text);
    if (trustCount >= 10) trustScore = 15;
    else if (trustCount >= 6) trustScore = 12;
    else if (trustCount >= 3) trustScore = 8;
    else if (trustCount >= 1) trustScore = 4;
    details.push({ name: '信頼性', score: trustScore, max: 15 });

    // 4) ストーリー (0-10) — 構造分析
    let storyScore = 0;
    const storyStructure = TextAnalyzer.analyzeStoryStructure(text);
    const storyCount = TextAnalyzer.countStoryElements(text);
    storyScore += storyStructure.score * 2; // 0-6
    if (storyCount >= 5) storyScore += 4;
    else if (storyCount >= 2) storyScore += 2;
    details.push({ name: 'ストーリー', score: Math.min(storyScore, 10), max: 10 });

    // 5) CTA (0-15)
    let ctaScore = 0;
    const ctaCount = TextAnalyzer.countCTA(text);
    if (ctaCount >= 8) ctaScore = 15;
    else if (ctaCount >= 5) ctaScore = 12;
    else if (ctaCount >= 3) ctaScore = 8;
    else if (ctaCount >= 1) ctaScore = 4;
    details.push({ name: 'CTA', score: ctaScore, max: 15 });

    // 6) 不安解消 (0-15)
    let anxScore = 0;
    const anxCount = TextAnalyzer.countAnxietyRelief(text);
    if (anxCount >= 6) anxScore = 15;
    else if (anxCount >= 3) anxScore = 10;
    else if (anxCount >= 1) anxScore = 5;
    details.push({ name: '不安解消', score: anxScore, max: 15 });

    // 7) 希少性 (0-15)
    let scarScore = 0;
    const scarCount = TextAnalyzer.countScarcity(text);
    if (scarCount >= 5) scarScore = 15;
    else if (scarCount >= 3) scarScore = 10;
    else if (scarCount >= 1) scarScore = 5;
    details.push({ name: '希少性', score: scarScore, max: 15 });

    const total = details.reduce((s, d) => s + d.score, 0);
    return { total, details };
  }

  /**
   * ペルソナ推定（強化版：語彙辞書ベース）
   */
  function estimatePersona(article) {
    const text = article.bodyText;
    const topKW = TextAnalyzer.keywordFrequency(text, 5);
    const kwWords = topKW.map(k => k.word);
    const vocab = TextAnalyzer.analyzePersonaVocab(text);

    // 性別推定
    let gender;
    if (vocab.gender.female > vocab.gender.male + 3) gender = '女性寄り';
    else if (vocab.gender.male > vocab.gender.female + 3) gender = '男性寄り';
    else if (vocab.gender.female > vocab.gender.male) gender = 'やや女性寄り';
    else if (vocab.gender.male > vocab.gender.female) gender = 'やや男性寄り';
    else gender = '男女均等';

    // 年齢推定
    let age;
    const ageMax = Math.max(vocab.age.young, vocab.age.middle, vocab.age.senior);
    if (ageMax === 0) age = '25-45歳';
    else if (ageMax === vocab.age.young) age = '18-30歳';
    else if (ageMax === vocab.age.middle) age = '30-50歳';
    else age = '50-65歳';

    // 職業推定
    let job;
    const jobEntries = Object.entries(vocab.job).sort((a, b) => b[1] - a[1]);
    const jobLabels = {
      business: '経営者 / マーケター / 営業職',
      tech: 'ITエンジニア / プログラマー',
      creative: 'クリエイター / ライター / デザイナー',
      medical: '医療・介護従事者 / 健康志向'
    };
    if (jobEntries[0][1] > 0) {
      job = jobLabels[jobEntries[0][0]] || '会社員 / 自営業';
    } else {
      job = '会社員 / 自営業';
    }

    // 悩み・意図推定
    let worry, intent, buyIntent;
    const emotions = TextAnalyzer.analyzeEmotion(text);

    if (emotions.anxiety > 35) {
      worry = '強い不安や課題を抱えている';
      buyIntent = '高（解決を急いでいる）';
    } else if (emotions.interest > 35) {
      worry = '情報収集・比較検討段階';
      buyIntent = '中（まだ検討段階）';
    } else if (emotions.expectation > 35) {
      worry = '成長・目標達成への意欲';
      buyIntent = '高（前向きに検討中）';
    } else {
      worry = '情報収集・課題解決';
      buyIntent = '中';
    }

    const structure = TextAnalyzer.analyzeStructure(text);
    if (structure.solutionCount > structure.problemCount) {
      intent = '具体的な解決策を探している';
    } else if (structure.problemCount > 0) {
      intent = '課題の原因と対策を知りたい';
    } else {
      intent = '一般的な情報を幅広く収集している';
    }

    return { age, gender, job, worry, intent, buyIntent, topKeywords: kwWords };
  }

  /**
   * 改善提案を生成（強化版）
   */
  function generateSuggestions(article, seoResult, cvrResult) {
    const suggestions = [];
    const text = article.bodyText;

    // スコア低い項目を優先的に提案
    seoResult.details.forEach(d => {
      const pct = d.score / d.max;
      if (pct < 0.5) {
        const msgMap = {
          'タイトル評価': { title: 'タイトルの最適化', desc: '15〜40文字でトップキーワードを含むタイトルに改善しましょう。' },
          '見出し構造': { title: '見出し構造の改善', desc: 'H2を3つ以上、H3でサブトピックを整理し、論理的な階層構造を作りましょう。' },
          'キーワード最適化': { title: 'キーワード配置の最適化', desc: 'メインキーワードの密度を1〜4%にし、見出しにも含めましょう。' },
          '可読性': { title: '可読性の改善', desc: '文を40〜60文字に抑え、適切な改行と段落分けを行いましょう。' },
          '検索意図一致': { title: '検索意図への対応', desc: '問題提起→解決策→まとめの構造を意識し、FAQを追加しましょう。' }
        };
        const msg = msgMap[d.name];
        if (msg) suggestions.push({ priority: 'high', ...msg });
      }
    });

    cvrResult.details.forEach(d => {
      const pct = d.score / d.max;
      if (pct < 0.4) {
        const msgMap = {
          'ファーストビュー': { title: 'ファーストビューの強化', desc: '冒頭400文字に読者の悩み・ベネフィット・疑問を入れましょう。' },
          'ベネフィット': { title: 'ベネフィットの追加', desc: '読者が得られるメリットや成果をより具体的に記述しましょう。' },
          '信頼性': { title: '信頼性の向上', desc: 'データ・実績・口コミなどの社会的証明を追加しましょう。' },
          'ストーリー': { title: 'ストーリー要素の追加', desc: '問題→解決→未来の流れで読者を惹きつけるストーリーを組み込みましょう。' },
          'CTA': { title: 'CTAの強化', desc: '行動喚起を記事中に3箇所以上配置しましょう。' },
          '不安解消': { title: '不安解消要素の追加', desc: '保証・サポート・返金保証など安心材料を入れましょう。' },
          '希少性': { title: '希少性の演出', desc: '限定・期間限定などの表現で行動を促しましょう。' }
        };
        const msg = msgMap[d.name];
        if (msg) suggestions.push({ priority: d.score === 0 ? 'high' : 'mid', ...msg });
      }
    });

    // 文字数チェック
    if (article.charCount < 1500) {
      suggestions.push({
        priority: 'high',
        title: '文字数不足',
        desc: `現在${article.charCount.toLocaleString()}文字です。SEO効果を高めるため1,500文字以上を目指しましょう。`
      });
    }

    // まとめセクション
    const hasConclusion = /まとめ|結論|最後に|おわりに/.test(text);
    if (!hasConclusion) {
      suggestions.push({
        priority: 'mid',
        title: 'まとめセクション追加',
        desc: '記事末尾に「まとめ」を追加すると読者の理解が深まりSEOにも効果的です。'
      });
    }

    // 重複を除去
    const seen = new Set();
    return suggestions.filter(s => {
      if (seen.has(s.title)) return false;
      seen.add(s.title);
      return true;
    });
  }

  /**
   * 記事改善アドバイスを生成
   */
  function generateAdvice(article, seoResult, cvrResult) {
    const advice = {};
    const topKW = TextAnalyzer.keywordFrequency(article.bodyText, 3);
    const mainKW = topKW.length > 0 ? topKW[0].word : '';
    const subKW = topKW.length > 1 ? topKW[1].word : '';

    // タイトル改善案
    const currentTitle = article.title || '';
    const titleSuggestions = [];
    if (mainKW && !currentTitle.includes(mainKW)) {
      titleSuggestions.push('メインキーワード「' + mainKW + '」をタイトルに含めましょう');
    }
    if (currentTitle.length > 40) {
      titleSuggestions.push('タイトルが長すぎます。40文字以内に収めましょう');
    } else if (currentTitle.length < 15) {
      titleSuggestions.push('タイトルが短すぎます。15文字以上で具体的に記述しましょう');
    }
    if (!/[？!！\d]/.test(currentTitle)) {
      titleSuggestions.push('数字や疑問形を入れるとクリック率が向上します');
    }
    // タイトル例の生成
    if (mainKW) {
      advice.titleExamples = [
        '【完全版】' + mainKW + 'の' + (subKW || '基本') + 'を徹底解説',
        mainKW + 'で失敗しないための' + (subKW ? subKW + '' : '') + '5つのポイント',
        'プロが教える' + mainKW + 'の' + (subKW || '活用法') + '【最新版】'
      ];
    }
    advice.title = titleSuggestions;

    // 見出し構造アドバイス
    const headingAdvice = [];
    const h2Count = article.headings.filter(h => h.level === 2).length;
    const h3Count = article.headings.filter(h => h.level === 3).length;
    if (h2Count < 3) {
      headingAdvice.push('H2見出しを3つ以上に増やして記事の大枠を明確にしましょう');
    }
    if (h2Count > 0 && h3Count < h2Count) {
      headingAdvice.push('各H2の下にH3を2〜3つ追加して詳細を整理しましょう');
    }
    if (mainKW) {
      const kwInHeadings = article.headings.some(h => h.text.includes(mainKW));
      if (!kwInHeadings) {
        headingAdvice.push('見出しにメインキーワード「' + mainKW + '」を含めましょう');
      }
    }
    advice.headings = headingAdvice;

    // 導入文アドバイス
    const introAdvice = [];
    const fv = TextAnalyzer.analyzeFirstView(article.bodyText);
    if (!fv.hasPainPoint) {
      introAdvice.push('冒頭で読者の悩み・課題に触れて共感を得ましょう');
    }
    if (!fv.hasBenefit) {
      introAdvice.push('冒頭でこの記事を読むメリットを明示しましょう');
    }
    if (!fv.hasHook) {
      introAdvice.push('「実は」「なぜ」などの引きのある表現で読者を惹きつけましょう');
    }
    advice.intro = introAdvice;

    return advice;
  }

  /**
   * 競合比較データを疑似生成
   */
  function generateCompetitorData(article, keyword) {
    const charCount = article.charCount;
    const headingCount = article.headings.length;
    const kwDensity = TextAnalyzer.keywordDensity(article.bodyText, keyword);
    const faqCount = TextAnalyzer.countFAQ(article.bodyText);
    const ctaCount = TextAnalyzer.countCTA(article.bodyText);

    const compAvg = {
      charCount: Math.round(charCount * (1 + (Math.random() * 0.4 + 0.1))),
      headingCount: Math.max(headingCount + Math.round(Math.random() * 4 - 1), 3),
      kwDensity: parseFloat((kwDensity + Math.random() * 1.5).toFixed(2)),
      faqCount: Math.max(faqCount + Math.round(Math.random() * 3), 2),
      ctaCount: Math.max(ctaCount + Math.round(Math.random() * 3), 3)
    };

    return {
      items: [
        { label: '文字数', mine: charCount, comp: compAvg.charCount },
        { label: '見出し数', mine: headingCount, comp: compAvg.headingCount },
        { label: 'KW密度(%)', mine: kwDensity, comp: compAvg.kwDensity },
        { label: 'FAQ数', mine: faqCount, comp: compAvg.faqCount },
        { label: 'CTA数', mine: ctaCount, comp: compAvg.ctaCount }
      ]
    };
  }

  return {
    calcSEO,
    calcCVR,
    estimatePersona,
    generateSuggestions,
    generateAdvice,
    generateCompetitorData
  };
})();
