/* ConfQuest - バージョン情報と更新履歴 */
'use strict';

const APP_VERSION = '0.5.0';
const APP_BUILD = '2026-08-15';

/**
 * 更新履歴(新しい順)
 * type: 'new' 新機能 / 'fix' 修正 / 'change' 変更
 */
const CHANGELOG = [
  {
    version: '0.5.0',
    date: '2026-08-15',
    items: [
      { type: 'new', text: '「講演を録音・要約」を追加。学会で聴いた発表を録音し、AIが構造化した要約を作成します' },
      { type: 'new', text: '録音中の「ここは重要」ボタン。押した前後が要約で重点的に扱われます' },
      { type: 'new', text: '共有ボタンからNextcloud・Gmailなど端末のアプリに送信可能。ファイル保存とコピーにも対応' },
      { type: 'new', text: '「聴講した講演」で保存した要約を後から見返して再送信できます' }
    ]
  },
  {
    version: '0.4.0',
    date: '2026-08-15',
    items: [
      { type: 'new', text: 'このアプリ情報画面を追加。バージョンと更新履歴を確認できます' },
      { type: 'fix', text: '更新してもアプリが古いままになる問題を修正(常に最新を読み込む方式に変更)' },
      { type: 'new', text: '「更新を確認」ボタンでキャッシュを消して再読み込みできます' }
    ]
  },
  {
    version: '0.3.0',
    date: '2026-08-15',
    items: [
      { type: 'new', text: 'AIフィードバックをMarkdown整形で表示(見出し・箇条書き・引用・コード)' },
      { type: 'new', text: '表(テーブル)の表示に対応。列の寄せと横スクロールに対応' },
      { type: 'change', text: 'AIへの指示を更新し、決まった見出し構成で返すように' }
    ]
  },
  {
    version: '0.2.0',
    date: '2026-08-15',
    items: [
      { type: 'new', text: 'AIプロバイダをClaude / OpenAI GPTから選択可能に' },
      { type: 'new', text: '文字起こしモデルを3種類から選択可能に(最安で約0.45円/分)' }
    ]
  },
  {
    version: '0.1.1',
    date: '2026-08-15',
    items: [
      { type: 'fix', text: '録音中に鳴っていた機械音を解消(リアルタイム音声認識を廃止)' },
      { type: 'change', text: '文字起こしを録音終了後の一括処理に変更し精度が向上' },
      { type: 'fix', text: 'タップしてもスライドが進まない問題を修正。タップ範囲も拡大' }
    ]
  },
  {
    version: '0.1.0',
    date: '2026-08-14',
    items: [
      { type: 'new', text: '発表練習モジュール公開: PDFスライド練習・時間管理・録音・文字起こし・AIフィードバック・Q&Aシミュレータ・練習履歴' }
    ]
  }
];
