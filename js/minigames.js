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
  },
  {
    q: '発表中に座長が1回目のベルを鳴らしました。その意味は?',
    choices: ['発表を今すぐ終了せよ', '残り時間わずかの予告', '音響トラブルの合図', '質疑応答の開始'],
    correct: 1,
    note: '多くの学会で1回目のベルは「残り数分」の予告、2回目が終了の合図です。1回目が鳴ったらまとめに入りましょう。'
  },
  {
    q: '名札(ネームバッジ)を付ける位置として理にかなっているとされるのは?',
    choices: ['左胸', '右胸', 'ベルトの位置', '背中'],
    correct: 1,
    note: '握手のとき相手の視線は伸ばした右手の延長線上、つまりあなたの右胸に自然に流れます。名前を覚えてもらいやすい位置です。'
  },
  {
    q: '英語で質問するとき、最初に添えると丁寧なのは?',
    choices: ['Listen carefully.', 'I have a problem with your data.', 'Thank you for the interesting talk.', 'My question is very important.'],
    correct: 2,
    note: '一言の感謝から始めると、その後の鋭い質問も攻撃ではなく対話として受け取られます。'
  },
  {
    q: '韓国の食事マナーとして正しいのは?',
    choices: ['ご飯茶碗はテーブルに置いたまま食べる', '器を持ち上げて食べる', '目上より先に食べ始める', '箸でご飯を食べるのが正式'],
    correct: 0,
    note: '日本と逆で、韓国では器を持ち上げるのは行儀が悪いとされます。ご飯はスッカラ(スプーン)で食べるのが正式です。'
  },
  {
    q: '懇親会で会話を自然に切り上げる一言として良いのは?',
    choices: ['(黙ってその場を離れる)', 'It was great talking with you — I need to catch someone before they leave.', '(スマホを見始める)', 'This conversation is finished.'],
    correct: 1,
    note: '感謝+移動の理由をセットにすれば、失礼なく次の出会いに向かえます。立食パーティーでは移動するのが前提です。'
  },
  {
    q: '国際学会のコーヒーブレイクの一番の目的とされるのは?',
    choices: ['眠気覚まし', '参加者同士のネットワーキング', 'スポンサーの宣伝', 'プログラムの時間調整'],
    correct: 1,
    note: '「本会議より廊下(corridor)の方が重要」と言われるほど。共同研究の多くは休憩時間の立ち話から始まります。'
  },
  {
    q: '発表スライド1枚あたりの目安時間はおよそ?',
    choices: ['10秒', '1分', '3分', '5分'],
    correct: 1,
    note: '「1枚1分」が定番の目安。12分の発表ならスライドは12枚前後に絞ると時間内に収まりやすくなります。'
  },
  {
    q: '招待講演を終えた後、主催者に送ると特に喜ばれるのは?',
    choices: ['講演料の請求書だけ', '短いお礼のメール', '次回も呼んでほしいという依頼', '運営への改善要望リスト'],
    correct: 1,
    note: '開催直後の短いお礼は強く印象に残ります。次の招待や共同研究につながる、費用ゼロの最強の投資です。'
  },
  {
    q: '学会でもらう「プロシーディングス」とは?',
    choices: ['参加費の領収書', '発表要旨をまとめた冊子・データ', '会場周辺の観光マップ', 'スポンサー企業のカタログ'],
    correct: 1,
    note: '発表内容の要旨集です。気になる発表に事前に印を付けておくと、当日の動きが格段に効率的になります。'
  },
  {
    q: '欧米の研究者コミュニティに多い呼び方の文化は?',
    choices: ['役職名で呼び合う', '初対面でもファーストネームで呼び合う', '苗字を呼び捨てにする', '名前は呼ばないのが礼儀'],
    correct: 1,
    note: '"Call me David" と言われたら遠慮なくファーストネームで。かたくなに Professor と呼び続けると、むしろ距離を感じさせることも。'
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

/* ---------- 共通ヘルパー ---------- */
/** 配列をシャッフルした新しい配列を返す */
function mgShuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ==========================================================
 * 🎴 話題トーク(話題の手札バトル)
 *   手札から話題カードを選び、相手との距離を縮める。
 *   「どの話題を・どのタイミングで」がテーマ。
 * ========================================================== */
const TOPIC_CARDS = [
  { id: 'weather',  icon: '🌤️', label: '天気の話',        tag: 'weather',  base: 1,
    desc: '無難な入り口。盛り上がりはしないが外さない' },
  { id: 'food',     icon: '🍜', label: '現地の食べ物',    tag: 'food',     base: 2,
    desc: '万国共通の安全で盛り上がる話題' },
  { id: 'travel',   icon: '✈️', label: '旅・観光',        tag: 'travel',   base: 2,
    desc: '学会出張の定番。おすすめを聞くと会話が続く' },
  { id: 'research', icon: '🧬', label: '相手の研究の話',  tag: 'research', base: 2,
    desc: '相手の仕事への関心は最高の敬意' },
  { id: 'ownwork',  icon: '📊', label: '自分の研究の近況', tag: 'ownwork',  base: 1,
    desc: '相手の話を聞いた後に出すと効果的' },
  { id: 'sports',   icon: '⚽', label: 'スポーツ',        tag: 'sports',   base: 1,
    desc: '好きな人にはとことん刺さる' },
  { id: 'family',   icon: '👨‍👩‍👧', label: '家族の話',        tag: 'family',   base: 1,
    desc: '距離が縮まるが、人を選ぶ' },
  { id: 'hobby',    icon: '♟️', label: '趣味の話',        tag: 'hobby',    base: 1,
    desc: '意外な共通点が見つかることも' },
  { id: 'drink',    icon: '🍺', label: 'お酒・バーの話',  tag: 'drink',    base: 1,
    desc: '懇親会では鉄板。飲まない人には注意' },
  { id: 'gossip',   icon: '🗣️', label: '同業者のうわさ話', tag: 'risky',    base: -1,
    desc: '打ち解けてからなら盛り上がる…かも' },
  { id: 'complaint', icon: '😮‍💨', label: '学会運営への愚痴', tag: 'risky',   base: -1,
    desc: '軽い愚痴は仲良くなってからなら共感になる' },
  { id: 'politics', icon: '🗳️', label: '政治',            tag: 'taboo',    base: -3,
    desc: '国際的な場では地雷。避けるが吉' },
  { id: 'religion', icon: '⛪', label: '宗教',            tag: 'taboo',    base: -3,
    desc: '文化を問わずリスクの高い話題' },
  { id: 'salary',   icon: '💴', label: '給料・収入',      tag: 'taboo',    base: -3,
    desc: '聞くのも話すのもNGな定番地雷' }
];

const TOPIC_PARTNERS = [
  {
    id: 'kr-prof', icon: '🍻', name: '韓国の教授',
    situation: '懇親会。料理のテーブルの前で、ビール片手に上機嫌な韓国の教授と隣り合わせた。',
    hint: '料理の皿を何度もおかわりしている。グラスはもう2杯目だ。',
    likes: ['food', 'drink', 'research'], dislikes: ['sports']
  },
  {
    id: 'de-pi', icon: '⏱️', name: 'ドイツのPI',
    situation: 'コーヒースタンドの列。前に並んだドイツのPIが軽く会釈してきた。',
    hint: '腕時計をちらりと確認した。世間話より中身のある話を好みそうだ。',
    likes: ['research', 'travel'], dislikes: ['weather', 'risky']
  },
  {
    id: 'us-postdoc', icon: '🚌', name: 'アメリカのポスドク',
    situation: '会場行きのシャトルバス。隣の席のポスドクが「Hi!」と話しかけてきた。',
    hint: 'ノートPCに野球チームとボードゲームのステッカーが貼ってある。',
    likes: ['sports', 'hobby', 'ownwork'], dislikes: []
  },
  {
    id: 'jp-prof', icon: '🗾', name: '日本の他分野の教授',
    situation: 'ポスター会場の隅。手持ち無沙汰そうな日本の教授と目が合った。',
    hint: '手に現地の観光ガイドブックを持っている。明日は市内観光をするらしい。',
    likes: ['travel', 'food', 'family'], dislikes: ['research']
  },
  {
    id: 'it-student', icon: '🍕', name: 'イタリアの大学院生',
    situation: 'ランチボックスの列。イタリアから来た大学院生が気さくに話しかけてきた。',
    hint: '配られた弁当を見て、少し複雑な表情をしている。食には一家言ありそうだ。',
    likes: ['food', 'travel', 'ownwork'], dislikes: []
  },
  {
    id: 'uk-editor', icon: '☂️', name: 'イギリスの編集者',
    situation: 'ロビーのソファ。有力誌のロゴ入り名札を付けた編集者が隣に座った。',
    hint: '折りたたみ傘を持っている。天気の話は彼らの国民的スポーツだ。',
    likes: ['weather', 'research', 'hobby'], dislikes: ['risky']
  }
];

const Topic = {
  /** 手札6枚: 相手の好み2枚以上+スパイス(危険札)1枚以上を保証 */
  dealHand(partner) {
    const deck = mgShuffle(TOPIC_CARDS);
    const hand = [];
    const isLike = (c) => partner.likes.includes(c.tag);
    const isSpice = (c) => c.tag === 'taboo' || c.tag === 'risky';
    for (const c of deck) if (hand.length < 2 && isLike(c)) hand.push(c);
    for (const c of deck) if (isSpice(c) && !hand.includes(c)) { hand.push(c); break; }
    for (const c of deck) if (hand.length < 6 && !hand.includes(c)) hand.push(c);
    return mgShuffle(hand);
  },

  /** 1枚出したときの評価(純粋関数)。{delta, dmg, line} を返す */
  evalCard(card, partner, mood, playedTags) {
    if (card.tag === 'taboo') {
      return {
        delta: -3, dmg: 8,
        line: '一瞬、空気が凍りついた。相手は視線をそらし、グラスの中を見つめている…'
      };
    }
    let delta = card.base;
    let line = '';
    if (card.tag === 'risky') {
      if (mood >= 7) {
        delta = 2;
        line = '打ち解けた空気の中で、軽い本音が共感を呼んだ。「わかります!実はうちも…」';
      } else {
        delta = -1;
        line = 'まだその話をする関係ではなかったようだ。微妙な間が流れる…';
      }
    } else if (card.id === 'ownwork') {
      if (playedTags.includes('research')) {
        delta = 2;
        line = '相手の話を聞いた後だからこそ、あなたの近況にも身を乗り出してくれた。';
      } else {
        delta = 0;
        line = '自分の話を切り出したが、相手はまだ様子見のようだ。まず相手の話を聞くのが先だったか。';
      }
    }
    if (partner.likes.includes(card.tag)) {
      delta += 1;
      line = '「それ、いいですね!」目に見えて相手の表情が明るくなった。';
    } else if ((partner.dislikes || []).includes(card.tag)) {
      delta -= 1;
      line = '相槌が薄い…この話題はあまり響いていないようだ。';
    }
    if (!line) line = delta > 0 ? '会話は穏やかに続いている。' : '会話が少し途切れがちだ。';
    delta = Math.max(-3, Math.min(3, delta));
    return { delta, dmg: delta < 0 ? Math.abs(delta) * 3 : 0, line };
  }
};

/* ==========================================================
 * 🚶 コーヒーブレイク(動線パズル)
 *   15分の休憩時間で、誰にどの順で会いに行くかを考える。
 * ========================================================== */
const STROLL_POOL = [
  { id: 'bigshot',  icon: '🎓', name: '分野の大御所',
    desc: '囲まれる前に挨拶したい', cost: 6,
    reward: { funds: 15, xp: { confidence: 15, network: 10 } },
    rewardLabel: '💰15・🦁自信/🤝人脈XP' },
  { id: 'editor',   icon: '📔', name: 'ジャーナル編集者',
    desc: '論文の投稿先の話ができるかも', cost: 5,
    reward: { funds: 30 }, rewardLabel: '💰30' },
  { id: 'friend',   icon: '👋', name: '昔の同僚',
    desc: '近況報告で元気が出る', cost: 4,
    reward: { hp: 8 }, rewardLabel: '🧠+8' },
  { id: 'poster',   icon: '📊', name: '気になるポスター発表者',
    desc: '午後のセッション前に質問したい', cost: 3,
    reward: { funds: 10, xp: { topic: 10 } }, rewardLabel: '💰10・💡話題XP' },
  { id: 'sponsor',  icon: '🎁', name: 'スポンサーブース',
    desc: 'ノベルティを配っている', cost: 3,
    reward: { item: 'drink' }, rewardLabel: 'ドリンク1個' },
  { id: 'coffee',   icon: '☕', name: 'コーヒースタンド',
    desc: '一杯飲んでひと息', cost: 2,
    reward: { hp: 5 }, rewardLabel: '🧠+5' },
  { id: 'students', icon: '🧑‍🎓', name: '学生グループ',
    desc: 'あなたのポスターを読んでくれたらしい', cost: 3,
    reward: { funds: 8, xp: { network: 10 } }, rewardLabel: '💰8・🤝人脈XP' },
  { id: 'collab',   icon: '🤝', name: '共同研究者候補',
    desc: 'メールだけの相手と初対面', cost: 5,
    reward: { funds: 20, xp: { network: 15 } }, rewardLabel: '💰20・🤝人脈XP' },
  { id: 'famouspi', icon: '🔬', name: '有名ラボのPI',
    desc: 'あなたの分野の論文をよく出している', cost: 5,
    reward: { funds: 15, xp: { confidence: 15 } }, rewardLabel: '💰15・🦁自信XP' }
];

const Stroll = {
  TIME_BUDGET: 15,
  /** その日の休憩時間の登場人物5人を生成。leaveBy=その時刻までに会話を始める必要 */
  gen() {
    const picks = mgShuffle(STROLL_POOL).slice(0, 5);
    const leaves = mgShuffle([6, 9, 12, this.TIME_BUDGET, this.TIME_BUDGET]);
    const spots = picks.map((p, i) => Object.assign({}, p, {
      cost: Math.max(2, p.cost + Math.floor(Math.random() * 3) - 1),
      leaveBy: leaves[i]
    }));
    // 「全員には会えない」パズルを保証: 合計コストが時間内に収まるなら少し重くする
    let total = spots.reduce((a, s) => a + s.cost, 0);
    while (total <= this.TIME_BUDGET + 1) {
      const s = spots[Math.floor(Math.random() * spots.length)];
      if (s.cost < 8) { s.cost++; total++; }
    }
    return spots;
  },
  /** いま(elapsed分経過)このスポットを訪ねられるか */
  canVisit(spot, elapsed) {
    return elapsed < spot.leaveBy && elapsed + spot.cost <= this.TIME_BUDGET;
  }
};

/* ==========================================================
 * 🛡️ 質疑応答ディフェンス(ボス前の関門)
 *   飛んでくる質問を「答える/言い換えて確認/持ち帰る」で捌く。
 * ========================================================== */
const QA_ACTIONS = {
  answer:  { icon: '💬', label: '答える' },
  clarify: { icon: '🔁', label: '言い換えて確認する' },
  defer:   { icon: '📝', label: '持ち帰る' }
};

const QA_QUESTIONS = [
  { id: 'qa-cellline', speaker: '最前列の学生',
    q: 'Which cell line did you use, and why did you choose it?',
    a: 'answer',
    why: '実験の基本情報を聞くシンプルな質問。知っていることは簡潔に即答するのが一番好印象です。' },
  { id: 'qa-vague-mech', speaker: '後方の教授',
    q: 'I was wondering... this could relate to phase separation, or maybe transcription factories, or chromatin loops in general...?',
    a: 'clarify',
    why: '論点が複数で曖昧。"If I understand correctly, you are asking about..." と言い換えれば、論点が絞れて考える時間も稼げます。' },
  { id: 'qa-invivo', speaker: '同分野のPI',
    q: 'Have you looked at this in primary cells? What happens in vivo?',
    a: 'defer',
    why: 'まだやっていない実験は正直に持ち帰るのが誠実。"Great point — that is exactly our next step." で前向きに返せます。' },
  { id: 'qa-comment', speaker: '白髪の大御所',
    q: 'This is more of a comment than a question, but we saw something similar in yeast twenty years ago.',
    a: 'answer',
    why: 'コメントには短い感謝と関心を返すのが正解。"Thank you — I would love to hear more after the session." で十分です。' },
  { id: 'qa-stats', speaker: '腕組みをした研究者',
    q: 'I am not convinced by your statistics. The effect looks marginal at best.',
    a: 'clarify',
    why: '攻撃的な質問ほど、まず「どの解析のことか」を落ち着いて確認。冷静な言い換えは、ムキになった反論より強い武器です。' },
  { id: 'qa-antibody', speaker: '隣のセッションから来た人',
    q: 'What antibody did you use for the ChIP experiments?',
    a: 'answer',
    why: '実験手法の確認は即答できる質問。Materials & Methods レベルの質問は自分の庭です。' },
  { id: 'qa-disease', speaker: '製薬企業の研究者',
    q: 'Do you have any data on whether this works in disease models?',
    a: 'defer',
    why: '持っていないデータを推測で答えるのは危険。"We have not tested that yet, but I would be happy to discuss." が安全で誠実です。' },
  { id: 'qa-two-questions', speaker: 'マイクを持った若手',
    q: 'So my question is... actually two questions. First about the mechanism, and, well, the second one is more philosophical...',
    a: 'clarify',
    why: '複数の質問は「まず1つ目から確認しましょう」と整理してあげると、会場全体も助かります。' },
  { id: 'qa-protocol', speaker: '共同研究者候補',
    q: 'How long does the whole protocol take? We might want to try it in our lab.',
    a: 'answer',
    why: '興味を持ってくれた実務的な質問。簡潔に答えて「後で詳しくお話ししましょう」につなげるチャンスです。' },
  { id: 'qa-fdr', speaker: '統計の専門家',
    q: 'What was the exact FDR threshold you used in Figure 3?',
    a: 'defer',
    why: '細かい数値をうろ覚えで答えるのは危険。"Let me check and give you the exact number after the talk." の方が信頼されます。' },
  { id: 'qa-bigpicture', speaker: '通路側の教授',
    q: 'Interesting. But what does it all mean for the bigger picture of nuclear organization?',
    a: 'clarify',
    why: '抽象的な質問は具体に引き戻します。"Are you asking about the functional consequences, or the mechanism?" と確認を。' },
  { id: 'qa-slide12', speaker: '熱心な学生',
    q: 'Could you go back to slide 12? I did not catch the color code.',
    a: 'answer',
    why: 'その場で解決できるお願いは落ち着いて対応するだけ。慌てずスライドを戻して説明すればOKです。' },
  { id: 'qa-chair', speaker: 'セッション座長',
    q: 'We are running short on time — maybe a quick one-sentence answer?',
    a: 'answer',
    why: '座長の時間管理には従うのが鉄則。どんな質問にも「一文で答える版」を用意しておく価値があります。' },
  { id: 'qa-rna', speaker: '別分野の研究者',
    q: 'Could your method work for RNA instead of DNA?',
    a: 'defer',
    why: '試していない応用への安請け合いは後で苦しくなります。"Interesting idea — let us discuss it after the session." が正解。' },
  { id: 'qa-fast', speaker: '早口の質問者',
    q: '(早口すぎて後半が聞き取れなかった) ...and how does that affect your conclusion?',
    a: 'clarify',
    why: '聞き取れないまま答え始めるのが最悪の一手。"Sorry, could you repeat the last part?" は恥ではなく誠実さです。' }
];

/* ==========================================================
 * 👥 名刺交換(名札記憶ゲーム)
 *   序盤に3人と名刺交換 → 後日・後半に「名前どれだっけ?」
 * ========================================================== */
const BADGE_PEOPLE = [
  { name: 'Prof. Minji Park',  affil: 'ソウル大学',            topic: 'クロマチン構造' },
  { name: 'Dr. Lars Jensen',   affil: 'コペンハーゲン大学',    topic: '一細胞解析' },
  { name: 'Dr. Sofia Rossi',   affil: 'ミラノ大学',            topic: '核ラミナ' },
  { name: 'Prof. David Chen',  affil: 'スタンフォード大学',    topic: 'エンハンサー制御' },
  { name: 'Dr. Aisha Okafor',  affil: 'オックスフォード大学',  topic: 'DNA複製' },
  { name: 'Prof. Jun Tanaka',  affil: '京都大学',              topic: '相分離' },
  { name: 'Dr. Marie Dubois',  affil: 'パスツール研究所',      topic: 'エピジェネティクス' },
  { name: 'Dr. Carlos Silva',  affil: 'サンパウロ大学',        topic: 'ゲノム進化' },
  { name: 'Prof. Hana Kim',    affil: 'KAIST',                 topic: 'イメージング技術' },
  { name: 'Dr. Tom Becker',    affil: 'マックスプランク研究所', topic: 'Hi-C解析' }
];
