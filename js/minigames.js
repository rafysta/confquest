/* ConfQuest - 学会攻略モード Phase 2 データ
 * 豆知識クイズ・語学クイズ・エレベーター会話・紛らわしい選択肢
 */
'use strict';

/* 学会・研究文化の豆知識クイズ */
const TRIVIA = [
  {
    q: '国際学会の懇親会で、一般的に避けるべきとされる話題は?',
    choices: ['相手の国の食べ物', '政治と宗教', '研究の失敗談', '天気'],
    correct: 1,
    note: '政治・宗教・収入は文化を問わずリスクの高い話題です。食や旅の話は安全で盛り上がります。'
  },
  {
    q: '韓国で目上の人とお酒を飲むときのマナーとして正しいのは?',
    choices: ['先に一人で飲み始める', '顔を横に向けて飲む', '手酌で自分に注ぐ', '乾杯を断る'],
    correct: 1,
    note: '韓国では目上の人の前でお酒を飲むとき、顔を少し横に向けて飲むのが伝統的な礼儀とされています。'
  },
  {
    q: 'ポスター発表で発表者が最も嬉しい聴衆の行動は?',
    choices: ['黙って写真を撮る', '要旨だけ持ち帰る', '質問やコメントをする', '遠くから眺める'],
    correct: 2,
    note: '質問は関心の証です。一言のコメントでも発表者にとって大きな励みになります。'
  },
  {
    q: '英語の発表で理想的とされる話速はおよそ?',
    choices: ['毎分90語', '毎分130語', '毎分180語', '毎分220語'],
    correct: 1,
    note: '非ネイティブ聴衆も多い国際学会では120〜140WPMが聞き取りやすいとされます。'
  },
  {
    q: '名刺を両手で受け取るのが特に重視される文化圏は?',
    choices: ['北米', '東アジア', '北欧', '南米'],
    correct: 1,
    note: '日本・韓国・中国では名刺を両手で扱い、すぐにしまわないのが敬意の表現です。'
  },
  {
    q: '招待講演者が主催者に対してすべきこととして最も大切なのは?',
    choices: ['謝礼の交渉', '締切より早めのスライド提出と返信', '長めの発表', '観光の要望'],
    correct: 1,
    note: '主催者の一番の心配は進行です。連絡への素早い返信は最高の礼儀になります。'
  },
  {
    q: '欧米圏の立食パーティーで、会話の輪に入る合図として自然なのは?',
    choices: ['輪の外で目を合わせて微笑む', '大声で名乗る', '肩を叩く', '輪の中央に立つ'],
    correct: 0,
    note: 'アイコンタクトと微笑みが「入ってもいい?」の国際共通サインです。輪は原則オープンです。'
  },
  {
    q: '発表後の質疑で、質問の意図が分からなかったときの最善の対応は?',
    choices: ['とりあえず答え始める', '質問を言い換えて確認する', '「次の質問を」と流す', '共著者を見る'],
    correct: 1,
    note: '"If I understand correctly, you are asking..." と言い換えれば、考える時間も稼げます。'
  }
];

/* 語学クイズ(韓国語 = 2026年11月 ISSY39向け / 広東語 = 2027年1月向け) */
const LANG_QUIZ = [
  { lang: '韓国語', q: '「こんにちは」は?',
    choices: ['アンニョンハセヨ (안녕하세요)', 'カムサハムニダ (감사합니다)', 'チュカヘヨ (축하해요)', 'チャルガヨ (잘 가요)'],
    correct: 0, note: '안녕하세요(アンニョンハセヨ)。学会会場での万能の挨拶です。' },
  { lang: '韓国語', q: '「ありがとうございます」は?',
    choices: ['チョギヨ (저기요)', 'ケンチャナヨ (괜찮아요)', 'カムサハムニダ (감사합니다)', 'ミアネヨ (미안해요)'],
    correct: 2, note: '감사합니다(カムサハムニダ)。丁寧な感謝の定番です。' },
  { lang: '韓国語', q: '「乾杯!」は?',
    choices: ['コンベ (건배)', 'マシッソヨ (맛있어요)', 'チュセヨ (주세요)', 'アニエヨ (아니에요)'],
    correct: 0, note: '건배(コンベ)! 懇親会で必ず使えます。日本語の「乾杯」と似ていて覚えやすい。' },
  { lang: '韓国語', q: '「お会いできて嬉しいです」は?',
    choices: ['チャルモッケッスムニダ', 'マンナソ パンガプスムニダ (만나서 반갑습니다)', 'スゴハセヨ', 'オディエヨ'],
    correct: 1, note: '만나서 반갑습니다(マンナソ パンガプスムニダ)。初対面の挨拶に添えると喜ばれます。' },
  { lang: '韓国語', q: '「おいしいです」は?',
    choices: ['ピゴネヨ (피곤해요)', 'マシッソヨ (맛있어요)', 'モルラヨ (몰라요)', 'チョアヨ (좋아요)'],
    correct: 1, note: '맛있어요(マシッソヨ)。食事に招かれたら使う機会が必ず来ます。' },
  { lang: '韓国語', q: '「すみません(店員さんを呼ぶとき)」は?',
    choices: ['チョギヨ (저기요)', 'アンニョン (안녕)', 'イゴ (이거)', 'ネ (네)'],
    correct: 0, note: '저기요(チョギヨ)。食堂やお店で人を呼ぶときの定番です。' },
  { lang: '韓国語', q: '「はい」は?',
    choices: ['アニヨ (아니요)', 'ネ (네)', 'ウン (응)', 'モッラ (몰라)'],
    correct: 1, note: '네(ネ)。「いいえ」は아니요(アニヨ)。会話の基本です。' },
  { lang: '韓国語', q: '「よろしくお願いします」に近い表現は?',
    choices: ['チャル プタカムニダ (잘 부탁합니다)', 'オソオセヨ (어서 오세요)', 'コマウォ (고마워)', 'カジャ (가자)'],
    correct: 0, note: '잘 부탁합니다(チャル プタカムニダ)。共同研究の話が出たらぜひ。' },
  { lang: '広東語', q: '「こんにちは」は?',
    choices: ['ネイホウ (你好 nei5 hou2)', 'ムゴイ (唔該 m4 goi1)', 'ドーチェ (多謝 do1 ze6)', 'ホウセッ (好食 hou2 sik6)'],
    correct: 0, note: '你好(ネイホウ)。ご両親への最初の一言に。北京語の「ニーハオ」と字は同じでも発音が違います。' },
  { lang: '広東語', q: '「ありがとう(贈り物やもてなしに)」は?',
    choices: ['ムゴイ (唔該)', 'ドーチェ (多謝 do1 ze6)', 'チョウサン (早晨)', 'ネイホウ (你好)'],
    correct: 1, note: '多謝(ドーチェ)は贈り物やご馳走への感謝。唔該(ムゴイ)は頼み事や軽いお礼に使い分けます。' },
  { lang: '広東語', q: '「おいしいです」は?',
    choices: ['ホウセッ (好食 hou2 sik6)', 'ムサイ (唔使)', 'ホウマー (好嗎)', 'サイクゥ (細路)'],
    correct: 0, note: '好食(ホウセッ)! ご両親の手料理や飲茶の席で最も喜ばれる一言です。' },
  { lang: '広東語', q: '「おはようございます」は?',
    choices: ['マンオン (晚安)', 'チョウサン (早晨 zou2 san4)', 'ドーチェ (多謝)', 'ヤムチャ (飲茶)'],
    correct: 1, note: '早晨(チョウサン)。朝の挨拶。結婚式の朝、ご両親にぜひ。' }
];

/* エレベーターイベント用の1ターン高難度会話 */
const ELEVATOR_CARDS = [
  {
    id: 'elev-bigshot',
    title: 'エレベーターの30秒',
    partner: '分野の大御所教授(2人きり)',
    focus: ['confidence', 'network'],
    turns: [{
      situation: 'ホテルのエレベーターで、あなたの分野の大御所教授と2人きりになりました。相手はあなたの名札をちらっと見ました。降りるまで約30秒。',
      limitSec: 12,
      choices: [
        { text: 'Professor, I\'m Hideki — your enhancer paper inspired my current project. May I ask you one quick question?', delta: 3, best: true,
          why: '名乗り+相手の仕事への言及+**許可を取ってから質問**。30秒で信頼を作る完璧な型です。' },
        { text: '(黙って階数表示を見つめる)', delta: -2,
          why: '二度と来ないチャンスでした。エレベーターの30秒は伝説的なネットワーキングの場です。' },
        { text: 'You are Professor Smith! I have all your papers! Please look at my poster, number 42, tomorrow, and also...', delta: -1,
          why: '熱意は伝わりますが、30秒で要求を詰め込みすぎです。まず一つの印象に絞りましょう。' },
        { text: 'Nice weather today.', delta: 0,
          why: '沈黙よりましですが、学会で大御所と2人きりという文脈を活かせていません。' }
      ]
    }]
  },
  {
    id: 'elev-editor',
    title: 'ジャーナル編集者と遭遇',
    partner: '有力誌の編集者',
    focus: ['confidence', 'english'],
    turns: [{
      situation: 'コーヒースタンドの列で、名札に有力誌のロゴ。編集者が「What\'s your field?」と気さくに聞いてきました。',
      limitSec: 12,
      choices: [
        { text: 'Genome organization — actually, we\'re wrapping up a story on how chromatin folding changes with age. Still looking for the right home for it.', delta: 3, best: true,
          why: '一言で分野+**投稿先を探している論文がある**ことをさりげなく。編集者は良い論文を探しに学会へ来ています。' },
        { text: 'Oh, um, just... biology.', delta: -1,
          why: '謙遜しすぎです。編集者への一言は準備しておく価値があります。' },
        { text: 'Will you publish my paper if I submit it?', delta: -2,
          why: '直球すぎます。編集者は約束できない立場で、答えに困らせてしまいます。' },
        { text: 'Chromosome biology. And you? How is the journal side of this conference?', delta: 2,
          why: '会話としては良い形です。自分の研究の売り込みまで届けば満点でした。' }
      ]
    }]
  }
];

/* 分厚いプロシーディングスが混ぜてくる「紛らわしい選択肢」 */
const DECOY_CHOICES = [
  { text: 'Well... you know... science is really something, isn\'t it?', delta: -1, decoy: true,
    why: '📚 紛らわしい選択肢でした。それらしく見えて、実は何も言っていません。' },
  { text: 'That is very interesting and I think it is very important and interesting.', delta: -1, decoy: true,
    why: '📚 紛らわしい選択肢でした。同じ言葉の繰り返しで中身がありません。' },
  { text: 'In conclusion, as I mentioned before, let me summarize the summary.', delta: -1, decoy: true,
    why: '📚 紛らわしい選択肢でした。要約の要約をまとめ直しても何も伝わりません。' },
  { text: 'Yes. No. I mean, maybe. It depends. Probably.', delta: -1, decoy: true,
    why: '📚 紛らわしい選択肢でした。全方向に頷くのは何も答えていないのと同じです。' }
];
