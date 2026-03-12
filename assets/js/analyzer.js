/**
 * ============================================================
 * 大野ヒロアキ流 記事チェック - analyzer.js
 * Copyright (c) 2024-2026 大野ヒロアキ (Hiroaki Ohno)
 * All Rights Reserved. 無断複製・転載・再配布を禁じます。
 * ============================================================
 * 全分析を統合するオーケストレーター
 */
const Analyzer = (() => {

  /**
   * 全分析を実行して結果オブジェクトを返す
   * @param {Object} article  ArticleLoader.load() の返却値
   * @returns {Object} analysisResult
   */
  function analyze(article) {
    // SEO診断
    const seo = ScoreCalculator.calcSEO(article);

    // CVR診断
    const cvr = ScoreCalculator.calcCVR(article);

    // ペルソナ推定
    const persona = ScoreCalculator.estimatePersona(article);

    // 感情分析
    const emotions = TextAnalyzer.analyzeEmotion(article.bodyText);

    // キーワード分析 TOP10
    const keywords = TextAnalyzer.keywordFrequency(article.bodyText, 10);

    // 改善提案
    const suggestions = ScoreCalculator.generateSuggestions(article, seo, cvr);

    return {
      article,
      seo,
      cvr,
      persona,
      emotions,
      keywords,
      suggestions
    };
  }

  /**
   * 結果をテキスト形式に変換（コピー用）
   */
  function resultToText(result) {
    const lines = [];
    lines.push('=== 大野ヒロアキ流 記事チェック 診断結果 ===');
    lines.push('');
    lines.push(`URL: ${result.article.url}`);
    lines.push(`タイトル: ${result.article.title}`);
    lines.push(`文字数: ${result.article.charCount}`);
    lines.push(`見出し数: ${result.article.headings.length}`);
    lines.push('');

    // SEO
    lines.push(`【SEOスコア】 ${result.seo.total}/100`);
    result.seo.details.forEach(d => {
      lines.push(`  ${d.name}: ${d.score}/${d.max}`);
    });
    lines.push('');

    // CVR
    lines.push(`【CVRスコア】 ${result.cvr.total}/100`);
    result.cvr.details.forEach(d => {
      lines.push(`  ${d.name}: ${d.score}/${d.max}`);
    });
    lines.push('');

    // ペルソナ
    lines.push('【ペルソナ推定】');
    lines.push(`  年齢層: ${result.persona.age}`);
    lines.push(`  性別傾向: ${result.persona.gender}`);
    lines.push(`  職業: ${result.persona.job}`);
    lines.push(`  悩み: ${result.persona.worry}`);
    lines.push(`  検索意図: ${result.persona.intent}`);
    lines.push(`  購買意欲: ${result.persona.buyIntent}`);
    lines.push('');

    // 感情
    lines.push('【感情分析】');
    lines.push(`  不安: ${result.emotions.anxiety}%`);
    lines.push(`  期待: ${result.emotions.expectation}%`);
    lines.push(`  安心: ${result.emotions.relief}%`);
    lines.push(`  興味: ${result.emotions.interest}%`);
    lines.push('');

    // キーワード
    lines.push('【キーワードTOP10】');
    result.keywords.forEach((kw, i) => {
      lines.push(`  ${i + 1}. ${kw.word} (${kw.count}回)`);
    });
    lines.push('');

    // 改善提案
    lines.push('【改善提案】');
    result.suggestions.forEach((s, i) => {
      const pr = s.priority === 'high' ? '★高' : s.priority === 'mid' ? '◆中' : '○低';
      lines.push(`  ${i + 1}. [${pr}] ${s.title} - ${s.desc}`);
    });

    return lines.join('\n');
  }

  /**
   * セクション別テキスト（個別コピー用）
   */
  function sectionToText(result, section) {
    switch (section) {
      case 'seo': {
        const lines = [`【SEOスコア】 ${result.seo.total}/100`];
        result.seo.details.forEach(d => lines.push(`  ${d.name}: ${d.score}/${d.max}`));
        return lines.join('\n');
      }
      case 'cvr': {
        const lines = [`【CVRスコア】 ${result.cvr.total}/100`];
        result.cvr.details.forEach(d => lines.push(`  ${d.name}: ${d.score}/${d.max}`));
        return lines.join('\n');
      }
      case 'persona':
        return PersonaCard.toText(result.persona);
      case 'emotion':
        return [
          '【感情分析】',
          `不安: ${result.emotions.anxiety}%`,
          `期待: ${result.emotions.expectation}%`,
          `安心: ${result.emotions.relief}%`,
          `興味: ${result.emotions.interest}%`
        ].join('\n');
      case 'keyword':
        return ['【キーワードTOP10】',
          ...result.keywords.map((kw, i) => `${i + 1}. ${kw.word} (${kw.count}回)`)
        ].join('\n');
      case 'suggest':
        return ['【改善提案】',
          ...result.suggestions.map((s, i) => `${i + 1}. ${s.title} - ${s.desc}`)
        ].join('\n');
      case 'comp':
        return '競合比較データ';
      default:
        return resultToText(result);
    }
  }

  return { analyze, resultToText, sectionToText };
})();
