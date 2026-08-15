/* ConfQuest - Korea Route (Language Quest Phase 2)
 * 11月の旅程を先取りする路線図型ステージモード。
 * 各駅 = フレーズユニット + 小ボス会話バトル(習得カードが選択肢=武器になる)。
 * 進行状態は localStorage('lq_route')。
 */
'use strict';

/* 駅の定義。boss.turns の choices は phrases.js のカードIDを参照する */
const KOREA_ROUTE = [
  {
    id: 'st-airport', icon: '✈️', title: '空港到着',
    desc: '仁川に降り立った。まずは挨拶と移動を使えるように',
    units: ['ko1', 'ko7'],
    boss: {
      title: 'タクシーで会場へ', partner: 'タクシーの運転手さん',
      intro: '空港のタクシー乗り場。ドアが開き、運転手さんがこちらを見た。学んだフレーズで乗り切ろう!',
      turns: [
        { s: '運転手さんが目的地を尋ねてきた。',
          line: { t: '어디 가세요?', ja: 'どちらまで行きますか?' },
          choices: [
            { card: 'ko7-3', d: 3, best: true, why: '「◯◯까지 가 주세요」=◯◯まで行ってください。ホテル名を添えれば完璧です。' },
            { card: 'ko7-2', d: 0, why: '「いくらですか?」— まだ乗ってもいないのに値段の話は早すぎます。' },
            { card: 'ko1-2', d: -1, why: '「さようなら(去る人へ)」— これから乗るのにお別れしてしまいました。' },
            { card: 'ko3-5', d: -1, why: '「これをください」— 食堂の注文フレーズ。運転手さんが困惑しています。' }
          ] },
        { s: '車内。運転手さんが早口の韓国語で何か話しかけてきた。まったく聞き取れない…',
          line: { t: '(早口の韓国語)', ja: '(聞き取れない…)' },
          choices: [
            { card: 'ko6-3', d: 3, best: true, why: '「韓国語は少ししかできません」— 正直に伝えるのが最善。相手も笑ってゆっくり話してくれます。' },
            { card: 'ko6-1', d: 2, why: '「もう一度おっしゃってください」— 聞き返しも立派な会話。ただ全部は聞き取れないかも。' },
            { card: 'ko1-4', d: -1, why: '分かっていないのに「はい」は危険。変な約束をしているかもしれません。' },
            { card: 'ko1-7', d: 0, why: '謝る場面ではありません。悪いことはしていませんよ。' }
          ] },
        { s: 'ホテルに到着。料金を払って降りるとき、最後にひとこと。',
          line: { t: '다 왔습니다!', ja: '着きましたよ!' },
          choices: [
            { card: 'ko7-5', d: 3, best: true, why: '「수고하세요」=お疲れさまです。働く人への去り際の定番で、言えるとかなり上級者に見えます。' },
            { card: 'ko1-6', d: 2, why: '「ありがとうございます」— もちろん良い挨拶。수고하세요ならさらに韓国らしい別れ際に。' },
            { card: 'ko1-3', d: 1, why: '「さようなら(残る人へ)」— 意味は通じますが、タクシーには수고하세요が定番です。' },
            { card: 'ko1-5', d: -1, why: '「いいえ」— 何を否定したのでしょうか。運転手さんが心配しています。' }
          ] }
      ]
    }
  },
  {
    id: 'st-venue', icon: '🏛️', title: '学会会場・初対面',
    desc: 'ホストのKim教授にご挨拶。第一印象を決める駅',
    units: ['ko2'],
    boss: {
      title: 'Kim教授にご挨拶', partner: 'ホストのKim教授',
      intro: '受付の向こうに、招待してくれたKim教授の姿。最初の挨拶で信頼を作ろう。',
      turns: [
        { s: 'Kim教授と目が合った。歩み寄って、最初のひとこと。',
          line: { t: '오, 안녕하세요!', ja: 'おお、こんにちは!' },
          choices: [
            { card: 'ko2-1', d: 3, best: true, why: '「처음 뵙겠습니다」=はじめまして。初対面の丁寧な定番で、招待への敬意が伝わります。' },
            { card: 'ko2-6', d: 1, why: '「よろしくお願いします」— 悪くないですが、まず「はじめまして」と名乗るのが先です。' },
            { card: 'ko1-2', d: -2, why: '会った瞬間に「さようなら」。教授の目が点になっています。' },
            { card: 'ko3-1', d: -1, why: '「おいしいです」— まだ何も食べていません。' }
          ] },
        { s: '教授が笑顔で握手を求めてきた。',
          line: { t: '만나서 반갑습니다!', ja: 'お会いできて嬉しいです!' },
          choices: [
            { card: 'ko2-3', d: 3, best: true, why: '同じ挨拶をそのまま返すのが定番。「저도(チョド)=私も」を頭に付けられたら満点です。' },
            { card: 'ko2-2', d: 2, why: '名乗りは大事。ただ、まず相手の挨拶に応えてから名乗るとより自然です。' },
            { card: 'ko6-4', d: 0, why: '「英語でもいいですか?」— まだ挨拶の段階。せっかくの韓国語チャンスです。' },
            { card: 'ko1-5', d: -2, why: '「いいえ」— 会えて嬉しくない…? 教授がショックを受けています。' }
          ] },
        { s: '교수「어디에서 오셨어요?」— どこから来たか聞かれた。',
          line: { t: '어디에서 오셨어요?', ja: 'どちらからいらしたのですか?' },
          choices: [
            { card: 'ko2-4', d: 3, best: true, why: '「日本から来ました」— 質問にまっすぐ答えるのが会話の基本。ここから日本の話に広がります。' },
            { card: 'ko2-2', d: 1, why: '名前を答えました。聞かれたのは出身ですが、自己紹介として悪くはありません。' },
            { card: 'ko2-5', d: 0, why: '「研究者です」— 職業は聞かれていません。会話が少しずれました。' },
            { card: 'ko1-8', d: -1, why: '「大丈夫です」— 何が大丈夫なのでしょうか。' }
          ] }
      ]
    }
  },
  {
    id: 'st-lunch', icon: '🍽️', title: '昼食の食堂',
    desc: '会場近くの食堂へ。注文と食事の駅',
    units: ['ko3'],
    boss: {
      title: '食堂で注文', partner: '食堂のお姉さんとKim教授',
      intro: 'Kim教授おすすめの食堂。メニューはハングルだらけ。でも学んだフレーズがあれば大丈夫。',
      turns: [
        { s: '注文したいが、店員さんは忙しそうに動き回っている。まず呼ぼう。',
          line: { t: '(店内のざわめき)', ja: '' },
          choices: [
            { card: 'ko3-4', d: 3, best: true, why: '「저기요」=すみません。店員さんを呼ぶ万能フレーズです。' },
            { card: 'ko1-1', d: 1, why: '「こんにちは」— 呼びかけとしては弱いですが、感じは良いです。' },
            { card: 'ko3-2', d: 0, why: '「いただきます」— まだ料理が来ていません。気が早い!' },
            { card: 'ko1-6', d: -1, why: '「ありがとうございます」— まだ何もしてもらっていません。' }
          ] },
        { s: '店員さんが来た。メニューの写真を指差して…',
          line: { t: '뭐 드릴까요?', ja: '何になさいますか?' },
          choices: [
            { card: 'ko3-5', d: 3, best: true, why: '「これをください」+指差し。世界中で通じる最強の注文術です。' },
            { card: 'ko3-8', d: 2, why: '「これは何ですか?」— 質問してから注文するのも良い流れ。会話も生まれます。' },
            { card: 'ko7-2', d: 1, why: '「いくらですか?」— 値段も大事ですが、まず注文を。' },
            { card: 'ko3-7', d: -1, why: '「お腹いっぱいです」— まだ食べていないのに満腹宣言。' }
          ] },
        { s: '完食。会計を終えて、ごちそうしてくれたKim教授にひとこと。',
          line: { t: '입에 맞았어요?', ja: 'お口に合いましたか?' },
          choices: [
            { card: 'ko3-3', d: 3, best: true, why: '「잘 먹었습니다」=ごちそうさまでした。おごってくれた人への感謝が一言で伝わります。' },
            { card: 'ko3-1', d: 2, why: '「おいしいです」— 気持ちは伝わります。食後なら잘 먹었습니다がベストです。' },
            { card: 'ko3-6', d: 0, why: '「お水をください」— 感想を聞かれたのにおかわり要求。' },
            { card: 'ko1-7', d: -1, why: '謝る場面ではありません。おいしかったなら胸を張って感謝を。' }
          ] }
      ]
    }
  },
  {
    id: 'st-banquet', icon: '🍻', title: '懇親会',
    desc: '本番の山場。乾杯・お酒の席・切り抜けの総合戦',
    units: ['ko4', 'ko6'],
    boss: {
      title: '乾杯の席', partner: '教授たちと学生たち',
      intro: '懇親会が始まった。グラスが配られ、みんながこちらを見ている。4ターンの長丁場、学んだ全てを使おう。',
      turns: [
        { s: '乾杯の音頭を振られた!グラスを掲げて…',
          line: { t: '건배사 부탁드려요!', ja: '乾杯のご発声をお願いします!' },
          choices: [
            { card: 'ko4-1', d: 3, best: true, why: '「건배!」— 迷ったらこれ。日本語の乾杯と似ていて、場も一気に和みます。' },
            { card: 'ko4-2', d: 2, why: '「짠!」はカジュアルな乾杯。教授もいる席なら건배がより無難です。' },
            { card: 'ko5-1', d: 0, why: '「発表拝聴しました」— 乾杯の音頭としては渋すぎます。' },
            { card: 'ko1-4', d: -1, why: '「はい」— 乾杯の発声が「はい」だけでは場が締まりません。' }
          ] },
        { s: '隣の教授がボトルを傾けてお酒を注ごうとしてくれる。実はあまり飲めない…',
          line: { t: '한 잔 받으세요!', ja: 'さあ一杯どうぞ!' },
          choices: [
            { card: 'ko4-3', d: 3, best: true, why: '「お酒はあまり飲めません」— 無理は禁物。韓国でも体質は尊重されます。断り方を知っているのが大人です。' },
            { card: 'ko4-4', d: 2, why: '「少しだけください」— 場の空気を保つ大人の折衷案。飲みすぎ注意!' },
            { card: 'ko1-5', d: -1, why: '「いいえ」だけではぶっきらぼう。理由を添えるのが円満の秘訣です。' },
            { card: 'ko6-5', d: -1, why: '「よく分かりません」— お酒を注がれて出る言葉ではありません。' }
          ] },
        { s: '場が温まってきた。会話が途切れたところで、こちらから一言。',
          line: { t: '(和やかな歓談)', ja: '' },
          choices: [
            { card: 'ko4-5', d: 3, best: true, why: '「今日は本当に楽しいです」— 場全体を温める魔法の一言。ホストが最も喜ぶ言葉です。' },
            { card: 'ko4-6', d: 2, why: '「韓国料理は本当においしいです」— 食文化を褒めるのも鉄板です。' },
            { card: 'ko2-1', d: -1, why: '「はじめまして」— もう乾杯まで済ませた仲です。' },
            { card: 'ko6-1', d: -1, why: '「もう一度おっしゃってください」— 誰も何も言っていません。' }
          ] },
        { s: '向かいの学生が興奮気味に早口で研究の話をしてきた。半分も聞き取れない!',
          line: { t: '(熱のこもった早口の韓国語)', ja: '(すごい勢いだ…)' },
          choices: [
            { card: 'ko6-2', d: 3, best: true, why: '「ゆっくり話してください」— 会話の生命線。相手はハッとして、ちゃんと伝わる速度にしてくれます。' },
            { card: 'ko6-4', d: 2, why: '「英語でもいいですか?」— 研究の話なら英語切り替えも自然な選択です。' },
            { card: 'ko6-6', d: 1, why: '「韓国語を勉強しています」— 話はずれますが、相手は喜んでくれます。' },
            { card: 'ko1-4', d: -1, why: '分からないまま「はい」の連発は、あとで困る典型パターンです。' }
          ] }
      ]
    }
  },
  {
    id: 'st-symposium', icon: '🔬', title: 'シンポジウム',
    desc: '元同僚の大学へ。研究の話の入口を使う駅',
    units: ['ko5'],
    boss: {
      title: '発表後の廊下で', partner: 'Kim研の大学院生',
      intro: 'シンポジウムの休憩時間。さっき良い発表をしていた学生が廊下にいる。声をかけてみよう。',
      turns: [
        { s: '学生と目が合った。発表の感想を伝えたい。',
          line: { t: '아, 안녕하세요.', ja: 'あ、こんにちは。' },
          choices: [
            { card: 'ko5-1', d: 3, best: true, why: '「発表、拝聴しました」— 発表者が最も嬉しい一言。これだけで距離が縮まります。' },
            { card: 'ko5-2', d: 2, why: '「とても印象的でした」— 褒め言葉として満点。발표 잘 들었습니다とセットなら最強です。' },
            { card: 'ko1-1', d: 1, why: '挨拶としては正解ですが、せっかくなら発表に触れたいところ。' },
            { card: 'ko3-3', d: -1, why: '「ごちそうさまでした」— 発表は食事ではありません。' }
          ] },
        { s: '学生がはにかんで喜んでいる。手法について詳しく聞きたい。',
          line: { t: '감사합니다!', ja: 'ありがとうございます!' },
          choices: [
            { card: 'ko5-3', d: 3, best: true, why: '「質問してもいいですか?」— 許可を取ってから踏み込む。学問の世界共通の礼儀です。' },
            { card: 'ko5-4', d: 2, why: '「私もその分野に興味があります」— 共通の関心を示すのも良い入口です。' },
            { card: 'ko7-1', d: -2, why: '「トイレはどこですか?」— 今ですか!? 会話が強制終了しました。' },
            { card: 'ko6-5', d: -1, why: '「よく分かりません」— まだ何も始まっていません。' }
          ] },
        { s: '議論が盛り上がった。このつながりを次に残したい。',
          line: { t: '재미있네요!', ja: '面白いですね!' },
          choices: [
            { card: 'ko5-5', d: 3, best: true, why: '「後でメールを送ってもいいですか?」— その場で終わらせず次につなげる、学会の必須テクニックです。' },
            { card: 'ko5-6', d: 2, why: '「一緒に写真を撮ってもいいですか?」— 記念にもなり、連絡のきっかけにもなります。' },
            { card: 'ko8-4', d: 1, why: '「連絡しますね」— 連絡先を交換してから言うとより確実です。' },
            { card: 'ko1-2', d: 0, why: 'まだ別れるには早い。もうひと押しでつながりが作れたのに。' }
          ] }
      ]
    }
  },
  {
    id: 'st-farewell', icon: '🤝', title: '帰国の朝',
    desc: '最終日。お世話になった人たちへの別れ際の駅',
    units: ['ko8'],
    boss: {
      title: 'お見送り', partner: 'Kim教授(ホテルの前で)',
      intro: '帰国の朝。Kim教授がわざわざホテルまで見送りに来てくれた。最後の会話を締めくくろう。',
      turns: [
        { s: '教授が「楽しかったですね」と笑っている。まず伝えるべきは…',
          line: { t: '와 주셔서 정말 좋았어요.', ja: '来てくれて本当に良かったです。' },
          choices: [
            { card: 'ko8-1', d: 3, best: true, why: '「오늘 감사했습니다」— 滞在全体への感謝。ホストに最も伝えたい一言です。' },
            { card: 'ko8-6', d: 2, why: '「お疲れさまでした」— 準備をしてくれた教授へのねぎらいとして良い選択です。' },
            { card: 'ko1-1', d: 0, why: '「こんにちは」— 挨拶をやり直してしまいました。' },
            { card: 'ko3-2', d: -1, why: '「いただきます」— 朝食はもう済ませました。' }
          ] },
        { s: '「また会いたいですね」という空気。こちらから誘うなら…',
          line: { t: '다음에 또 봐요.', ja: 'また今度会いましょう。' },
          choices: [
            { card: 'ko8-3', d: 3, best: true, why: '「今度は日本に来てください」— 招待を返すと関係が対等になります。本当に来たら全力で案内しましょう。' },
            { card: 'ko8-2', d: 2, why: '「また会いましょう」— 温かい定番。日本への招待まで言えたら満点でした。' },
            { card: 'ko8-4', d: 1, why: '「連絡しますね」— 誠実ですが、もう一歩踏み込むチャンスでした。' },
            { card: 'ko6-3', d: 0, why: '「韓国語は少しだけです」— 謙遜のタイミングではありません。' }
          ] },
        { s: 'タクシーが来た。乗り込む直前、残る教授への最後のひとこと。',
          line: { t: '조심히 가세요!', ja: '気をつけて帰ってくださいね!' },
          choices: [
            { card: 'ko1-3', d: 3, best: true, why: '「안녕히 계세요」=さようなら(残る人へ)。去るのは自分、残るのは教授。最初の駅で学んだ使い分けがここで光ります!' },
            { card: 'ko8-2', d: 2, why: '「また会いましょう」— 良い言葉ですが、去り際の挨拶としては안녕히 계세요が完璧でした。' },
            { card: 'ko1-2', d: -1, why: '「さようなら(去る人へ)」— 惜しい!去るのは自分なので계세요です。この使い分けが韓国語の第一関門。' },
            { card: 'ko8-5', d: -1, why: '「気をつけて帰ってください」— それは教授があなたに言う言葉。教授は帰りません。' }
          ] }
      ]
    }
  }
];

/* 💒 Hong Kong Route (Wedding Quest) — 2027年1月の結婚式を先取りする */
const HK_ROUTE = [
  {
    id: 'hk-meet', icon: '💼', title: '初対面のご挨拶',
    desc: 'ご両親との顔合わせ。第一印象を決める駅',
    units: ['yue1', 'yue2'],
    boss: {
      title: 'ご両親との顔合わせ', partner: 'お義父さんとお義母さん',
      intro: 'ドアの向こうに、パートナーのご両親。隣にはパートナーがいてくれる。深呼吸して、最初のひとことを。',
      turns: [
        { s: 'ドアが開いた。ご両親がこちらを見ている。第一声は…',
          line: { t: '(ドアが開く)', ja: '' },
          choices: [
            { card: 'yue1-1', d: 3, best: true, why: '最初のひとことはシンプルに「你好」+笑顔が最強。気負わないのがいちばんです。' },
            { card: 'yue2-1', d: 2, why: '名乗りは大事ですが、まず挨拶をしてからのほうが自然な流れです。' },
            { card: 'yue3-1', d: -1, why: '「おいしい!」— まだ何も食べていません。緊張が伝わってきます。' },
            { card: 'yue1-7', d: -2, why: '会った瞬間に「バイバイ」。お義父さんが固まっています。' }
          ] },
        { s: 'お義母さんが笑顔で招き入れてくれた。自己紹介をしよう。',
          line: { t: '入嚟坐啦!', ja: 'お入りなさい、座って!' },
          choices: [
            { card: 'yue2-1', d: 3, best: true, why: '「我叫英樹」— 自分の名前を広東語で名乗る。この一言の準備がご両親への何よりの敬意です。' },
            { card: 'yue2-3', d: 2, why: '「請多多指教」— 良い言葉ですが、名乗ってから言うとさらに丁寧です。' },
            { card: 'yue2-2', d: 1, why: '「日本人です」— 事実ですが、まず名前から。' },
            { card: 'yue6-5', d: -1, why: '「分かりません」— まだ何も聞かれていません。' }
          ] },
        { s: 'お義父さんが何か尋ねてきた。早口でまったく聞き取れない…!',
          line: { t: '(早口の広東語)', ja: '(何を聞かれたんだろう…)' },
          choices: [
            { card: 'yue6-4', d: 3, best: true, why: '「広東語は少しだけ分かります」— 正直さと努力が同時に伝わる魔法の一言。ご両親の表情が緩みます。' },
            { card: 'yue6-2', d: 2, why: '「もう一度言ってください」— 聞き返しは誠実な対応です。' },
            { card: 'yue6-6', d: 1, why: '「彼女が通訳してくれます」— 切り札ですが、まず自分で応えようとする姿勢を見せてから。' },
            { card: 'yue1-4', d: -1, why: '質問に「ありがとう」で返してしまいました。会話が噛み合っていません。' }
          ] }
      ]
    }
  },
  {
    id: 'hk-yumcha', icon: '🥟', title: '飲茶の朝',
    desc: '家族の定番行事、飲茶デビューの駅',
    units: ['yue3'],
    boss: {
      title: '飲茶デビュー', partner: 'ご両親と親戚のみなさん',
      intro: '週末の飲茶に招かれた。回るワゴン、飛び交う広東語。ここは家族の社交場だ。',
      turns: [
        { s: '席に着くと、お義父さんがお茶を注いでくれた。',
          line: { t: '飲茶啦!', ja: 'さあ、飲茶だ!' },
          choices: [
            { card: 'yue1-5', d: 3, best: true, why: '注いでもらったら「唔該」。指をトントンと曲げて感謝を表す仕草も添えられたら完璧です。' },
            { card: 'yue1-4', d: 2, why: '「多謝」は贈り物向けの感謝ですが、気持ちは十分伝わります。' },
            { card: 'yue3-4', d: -1, why: '「お腹いっぱいです」— まだ一口も食べていません。' },
            { card: 'yue1-7', d: -2, why: '「バイバイ」— 飲茶はこれからです!' }
          ] },
        { s: '点心が次々運ばれてくる。お義母さんが「お口に合う?」という顔でこちらを見た。',
          line: { t: '合唔合口味呀?', ja: 'お口に合うかしら?' },
          choices: [
            { card: 'yue3-2', d: 3, best: true, why: '「好好味!」— お義母さんが一番聞きたかった言葉。テーブル全体が笑顔になります。' },
            { card: 'yue3-1', d: 2, why: '「好食!」も十分伝わります。好好味だとさらに気持ちがこもります。' },
            { card: 'yue3-7', d: 1, why: '「これは何ですか?」— 興味を示すのも良い返しです。' },
            { card: 'yue6-5', d: -1, why: '「分かりません」— 味の感想を聞かれただけですよ。' }
          ] },
        { s: 'お義父さんがどんどん取り分けてくれる。おいしいけれど、もう限界…',
          line: { t: '食多啲啦!', ja: 'もっと食べなさい!' },
          choices: [
            { card: 'yue3-4', d: 3, best: true, why: '「我食飽喇」— 満腹はおもてなしへの最高の賛辞。笑顔で言えば角は立ちません。' },
            { card: 'yue3-3', d: 1, why: '「点心が好きです」— 嬉しい言葉ですが、さらに取り分けられてしまいます!' },
            { card: 'yue3-5', d: 0, why: '「飲茶」— 単語だけ言ってもここでは伝わりません。' },
            { card: 'yue1-6', d: -1, why: '「どういたしまして」— お礼を言われたわけではないので、少しずれています。' }
          ] }
      ]
    }
  },
  {
    id: 'hk-home', icon: '🏠', title: '家族の食卓',
    desc: 'お宅にお呼ばれ。褒め言葉と感謝の駅',
    units: ['yue4'],
    boss: {
      title: 'お宅にお呼ばれ', partner: 'ご両親(ご自宅で)',
      intro: 'ついにご実家へ。お義母さんの手料理が並ぶ。家族の思い出話に混ぜてもらおう。',
      turns: [
        { s: '玄関を入った。まず伝えたいのは…',
          line: { t: '歡迎歡迎!', ja: 'ようこそ、いらっしゃい!' },
          choices: [
            { card: 'yue4-2', d: 3, best: true, why: '「屋企好靚」=お家が素敵ですね。お宅に招かれたら最初に伝えたい褒め言葉です。' },
            { card: 'yue4-4', d: 2, why: '「伯父・伯母」と呼びかけるのも礼儀正しい入り方です。' },
            { card: 'yue4-5', d: 1, why: '「香港はきれいですね」— 悪くないですが、今はお家を褒める場面です。' },
            { card: 'yue2-2', d: 0, why: '「日本人です」— それはもうご存じです。' }
          ] },
        { s: '手料理が並ぶ食卓。「たくさん食べてね」とお義母さん。食事が進んだところで、ひとこと。',
          line: { t: '唔好客氣,食啦!', ja: '遠慮しないで、食べて!' },
          choices: [
            { card: 'yue4-1', d: 3, best: true, why: '「你哋好好人」=お二人はとても優しいですね。料理だけでなく人柄への感謝が伝わる、距離が縮まる一言です。' },
            { card: 'yue3-2', d: 2, why: '「とてもおいしいです」— 手料理への定番の賛辞です。' },
            { card: 'yue3-4', d: 1, why: '「お腹いっぱい」— 素直ですが、先に感謝を伝えたい場面です。' },
            { card: 'yue6-5', d: -1, why: '「分かりません」— 会話が止まってしまいました。' }
          ] },
        { s: 'パートナーの子供の頃のアルバムで大盛り上がり。帰り際、締めの挨拶を。',
          line: { t: '下次再嚟啦!', ja: 'また来てね!' },
          choices: [
            { card: 'yue4-3', d: 3, best: true, why: '「多謝你哋咁好」=良くしてくださってありがとうございます。滞在の締めくくりに最も心に届く感謝です。' },
            { card: 'yue4-6', d: 2, why: '「香港が大好きです」— パートナーの故郷を好きだと伝えるのは家族への敬意です。' },
            { card: 'yue1-7', d: 1, why: '「バイバイ」— 感謝を言ってからなら完璧でした。' },
            { card: 'yue1-3', d: -1, why: '「皆さんお元気ですか?」— 帰り際に挨拶をやり直してしまいました。' }
          ] }
      ]
    }
  },
  {
    id: 'hk-street', icon: '🏙️', title: '香港の街歩き',
    desc: 'パートナーと街へ。切り抜けフレーズの実戦の駅',
    units: ['yue6'],
    boss: {
      title: '屋台のおばちゃん', partner: '早口な屋台の店主(パートナーは隣でニヤニヤ)',
      intro: '二人で街歩き。屋台で買い食いに挑戦だ。「自分で注文してみなよ」とパートナー。よし、やってみよう。',
      turns: [
        { s: '屋台のおばちゃんが、ものすごい早口で話しかけてきた!',
          line: { t: '(嵐のような早口の広東語)', ja: '(は、速い…!)' },
          choices: [
            { card: 'yue6-3', d: 3, best: true, why: '「唔該,講慢啲」— 唔該を先に付けた丁寧な減速リクエスト。監修で学んだ形がそのまま実戦で使えます。' },
            { card: 'yue6-2', d: 2, why: '「もう一度言ってください」— こちらも立派な切り抜けです。' },
            { card: 'yue6-5', d: 1, why: '「分かりません」— 正直ですが、次につながる一言があるとより良いです。' },
            { card: 'yue1-4', d: -1, why: '「ありがとう」— まだ何ももらっていません。おばちゃんが首をかしげています。' }
          ] },
        { s: '気になる食べ物を発見。指差して聞いてみよう。',
          line: { t: '要咩呀?', ja: '何にする?' },
          choices: [
            { card: 'yue3-7', d: 3, best: true, why: '「呢個係咩嚟㗎?」=これは何ですか? 指差し+この一言で世界中どこでも買い物ができます。' },
            { card: 'yue1-5', d: 2, why: '「唔該」— 呼びかけとしては正解。そのあと指差しで乗り切れます。' },
            { card: 'yue2-4', d: 1, why: '「広東語を勉強しています」— おばちゃんが喜んで話が広がりそうですが、注文はまだです。' },
            { card: 'yue3-6', d: -1, why: '「お茶をください」— ここは屋台、飲茶ではありません。' }
          ] },
        { s: 'アツアツの一品を受け取った。おばちゃんが笑っている。最後に…',
          line: { t: '好食㗎!', ja: 'おいしいよ!' },
          choices: [
            { card: 'yue1-4', d: 3, best: true, why: '「多謝」— 品物を受け取ったときの感謝はこちら。唔該との使い分けが決まると本物です。' },
            { card: 'yue1-5', d: 2, why: '「唔該」— 通じますが、物をもらった感謝は多謝がぴったりです。' },
            { card: 'yue1-7', d: 1, why: '「バイバイ」— 感謝のあとに言えたら満点でした。' },
            { card: 'yue6-6', d: -1, why: '「彼女が通訳してくれます」— もう買えました!自力で乗り切った勝利です。' }
          ] }
      ]
    }
  },
  {
    id: 'hk-wedding', icon: '💒', title: '結婚式当日',
    desc: 'ラスボス。ご両親への感謝と誓いの駅',
    units: ['yue5'],
    boss: {
      title: 'ご両親への誓い', partner: 'ご両親と、すべてのゲスト',
      intro: 'ついにこの日が来た。会場にはご両親とゲストのみなさん。隣にはパートナー。練習してきた言葉を、心を込めて。',
      turns: [
        { s: '開宴。グラスを掲げて、乾杯の音頭を。',
          line: { t: '(会場の視線がこちらに)', ja: '' },
          choices: [
            { card: 'yue5-3', d: 3, best: true, why: '「乾杯!(ゴンブイ)」— 監修で学んだ今の言い方。会場全体が一つになります。' },
            { card: 'yue5-2', d: 2, why: '「今日はとても幸せです」— 乾杯の前置きとして素敵な一言です。' },
            { card: 'yue5-4', d: -1, why: '「おめでとう」— 今日は祝われる側です!' },
            { card: 'yue3-5', d: -1, why: '「飲茶」— お茶会ではありません。' }
          ] },
        { s: 'マイクを持ってスピーチ。まずゲストのみなさんへ。',
          line: { t: '(ステージの上から)', ja: '' },
          choices: [
            { card: 'yue5-1', d: 3, best: true, why: '「多謝你哋嚟我哋婚禮」— 私たちの結婚式に来てくださってありがとう。パートナー直伝のネイティブな言い方です。' },
            { card: 'yue1-3', d: 2, why: '「你哋好嗎?」— ステージから皆さんへの呼びかけ。監修メモにあった使い方がここで活きます。' },
            { card: 'yue4-3', d: 1, why: '「良くしてくださってありがとう」— 気持ちは伝わりますが、式への感謝はもう一歩踏み込めます。' },
            { card: 'yue1-1', d: 0, why: '「你好」— スピーチの始まりとしては少し軽すぎます。' }
          ] },
        { s: 'ご両親の前へ。お義母さんの目が潤んでいる。育ててくれたことへの感謝を。',
          line: { t: '(言葉にならない表情)', ja: '' },
          choices: [
            { card: 'yue5-6', d: 3, best: true, why: '「多謝你哋養大佢」=彼女を育ててくださってありがとうございます。式で最も心に届く言葉。ご両親の涙腺は決壊です。' },
            { card: 'yue4-1', d: 2, why: '「お二人はとても優しいですね」— 温かい言葉ですが、今日はもう一段深い感謝を。' },
            { card: 'yue5-2', d: 1, why: '「今日はとても幸せです」— 自分の気持ちの前に、ご両親への感謝を。' },
            { card: 'yue6-6', d: -1, why: '「彼女が通訳してくれます」— ここだけは、自分の言葉で。' }
          ] },
        { s: '最後に、ご両親の目を見て、誓いの言葉を。',
          line: { t: '(会場が静まり返る)', ja: '' },
          choices: [
            { card: 'yue5-5', d: 3, best: true, why: '「我會好好照顧佢」=彼女を大切にします。この一言のために、このアプリはありました。おめでとうございます!' },
            { card: 'yue5-2', d: 2, why: '「今日はとても幸せです」— 素敵ですが、誓いの言葉はただ一つです。' },
            { card: 'yue2-3', d: 1, why: '「よろしくご指導ください」— 家族になる挨拶として悪くありませんが、今日は誓いを。' },
            { card: 'yue1-7', d: -2, why: '「バイバイ」— 人生最大の場面での最悪の一言。パートナーヘルプの出番だったかも…' }
          ] }
      ]
    }
  }
];

/* 路線の定義 */
const ROUTES = {
  korea: {
    key: 'korea', title: '🚄 Korea Route', lang: 'ko', list: KOREA_ROUTE,
    goal: '🏁 ISSY39 本番', clearAch: 'route-clear', clearGems: 10, help: false,
    note: '11月の旅程を先取りして進む路線図。各駅のフレーズを学びきると、小ボス「会話バトル」に挑めます。学んだフレーズだけが正解の選択肢に現れます。'
  },
  hk: {
    key: 'hk', title: '💒 Hong Kong Route', lang: 'yue', list: HK_ROUTE,
    goal: '💒 結婚式 本番', clearAch: 'wedding-clear', clearGems: 15, help: true,
    note: '結婚式までの物語を進むWedding Quest。困ったときは💗パートナーヘルプ(1戦闘3回)が使えます — 本番でも隣にいてくれる人です。'
  }
};

/* ---------- Route エンジン(複数路線対応) ---------- */
const Route = {
  KEY: 'lq_route',
  CLEAR_AFFINITY: 60,
  routeKey: localStorage.getItem('lq_route_sel') || 'korea',

  setRoute(key) {
    if (!ROUTES[key]) return;
    this.routeKey = key;
    localStorage.setItem('lq_route_sel', key);
  },
  route() { return ROUTES[this.routeKey] || ROUTES.korea; },
  list() { return this.route().list; },

  data() {
    try {
      const d = JSON.parse(localStorage.getItem(this.KEY) || 'null');
      if (d && d.cleared) return d;
    } catch (_) { /* fallthrough */ }
    return { cleared: {} };
  },
  save(d) { localStorage.setItem(this.KEY, JSON.stringify(d)); },
  isCleared(id) { return !!this.data().cleared[id]; },
  /** 指定路線(省略時は現在の路線)のクリア駅数 */
  clearedCount(key) {
    const list = (ROUTES[key] || this.route()).list;
    const d = this.data();
    return list.filter((st) => d.cleared[st.id]).length;
  },
  isUnlocked(index) {
    return index === 0 || this.isCleared(this.list()[index - 1].id);
  },

  /** 駅のユニット進捗(⚠️修正待ちは分母から除外) */
  stationCards(st) {
    return st.units.flatMap((uid) => Phrases.unit(uid).cards)
      .filter((c) => ReviewFlags.get(c.id) !== 'fix');
  },
  stationProgress(st) {
    const cards = this.stationCards(st);
    const done = cards.filter((c) => SRS.isIntroduced(c.id)).length;
    return { done, total: cards.length };
  },
  bossReady(st) {
    const p = this.stationProgress(st);
    return p.total > 0 && p.done >= p.total;
  },

  /* ----- 路線図 ----- */
  renderMap() {
    const route = this.route();
    const header = document.querySelector('#screen-route h2');
    if (header) header.textContent = route.title;
    const el = document.getElementById('route-content');
    el.innerHTML = `
      <div class="countdown-row">${EventDates.chip(route.lang)}</div>
      <p class="field-note" style="margin-bottom:12px">${route.note}</p>
      <div class="route-line">
        ${route.list.map((st, i) => {
          const unlocked = this.isUnlocked(i);
          const cleared = this.isCleared(st.id);
          const p = this.stationProgress(st);
          const ready = this.bossReady(st);
          const state = cleared ? 'cleared' : (unlocked ? (ready ? 'ready' : 'open') : 'locked');
          return `
          <button class="route-station ${state}" data-station="${i}" ${unlocked ? '' : 'disabled'}>
            <span class="route-node">${cleared ? '✅' : (unlocked ? st.icon : '🔒')}</span>
            <span class="route-body">
              <span class="route-title">${escapeHtml(st.title)}</span>
              <span class="field-note">${cleared ? 'クリア済み — もう一度挑戦できます'
                : unlocked ? escapeHtml(st.desc) : '前の駅をクリアすると開通'}</span>
              ${unlocked && !cleared ? `
                <span class="unit-track"><span class="unit-fill" style="width:${Math.round(p.done / p.total * 100)}%"></span></span>
                <span class="field-note">フレーズ ${p.done}/${p.total}${ready ? ' ・ ⚔️ ボスに挑戦できます!' : ''}</span>` : ''}
            </span>
          </button>`;
        }).join('')}
        <div class="route-goal ${this.clearedCount() >= route.list.length ? 'reached' : ''}">
          ${route.goal} ${this.clearedCount() >= route.list.length ? '— 準備完了!🎉' : ''}
        </div>
      </div>`;

    el.querySelectorAll('[data-station]').forEach((b) =>
      b.addEventListener('click', () => this.renderStation(Number(b.dataset.station))));
  },

  /* ----- 駅の詳細 ----- */
  renderStation(index) {
    const st = this.list()[index];
    const p = this.stationProgress(st);
    const ready = this.bossReady(st);
    const cleared = this.isCleared(st.id);
    const el = document.getElementById('route-content');
    el.innerHTML = `
      <button class="subnav-btn" id="btn-route-back">← 路線図に戻る</button>
      <div class="card" style="text-align:center">
        <div style="font-size:2.2rem">${st.icon}</div>
        <h3 style="margin:4px 0">${escapeHtml(st.title)}</h3>
        <p class="field-note">${escapeHtml(st.desc)}</p>
      </div>
      <h3 class="about-section">この駅で使うフレーズ</h3>
      ${st.units.map((uid) => {
        const u = Phrases.unit(uid);
        const up = SRS.unitProgress(uid);
        return `<button class="unit-row" data-route-unit="${uid}">
          <span class="unit-icon">${u.icon}</span>
          <span class="unit-body">
            <span class="unit-title">${escapeHtml(u.title)}</span>
            <span class="unit-track"><span class="unit-fill" style="width:${Math.round(up.introduced / up.total * 100)}%"></span></span>
          </span>
          <span class="unit-count">${up.introduced}/${up.total}</span>
        </button>`;
      }).join('')}
      <h3 class="about-section">⚔️ 小ボス: ${escapeHtml(st.boss.title)}</h3>
      <p class="field-note" style="margin-bottom:10px">相手: ${escapeHtml(st.boss.partner)} ・ ${st.boss.turns.length}ターン ・ 好感度${this.CLEAR_AFFINITY}以上でクリア</p>
      ${ready
        ? `<button class="btn-large primary" id="btn-route-boss">⚔️ ${cleared ? 'もう一度挑戦する' : '会話バトルに挑む'}</button>`
        : `<button class="btn-large" disabled>🔒 フレーズをあと${p.total - p.done}枚学ぶと挑戦できます</button>`}
    `;
    document.getElementById('btn-route-back').addEventListener('click', () => this.renderMap());
    el.querySelectorAll('[data-route-unit]').forEach((b) =>
      b.addEventListener('click', () => Learn.startUnit(b.dataset.routeUnit)));
    const bossBtn = document.getElementById('btn-route-boss');
    if (bossBtn) bossBtn.addEventListener('click', () => this.startBoss(index));
  },

  /* ----- ボス会話バトル ----- */
  battle: null,
  timeScale() { return parseFloat(localStorage.getItem('lq_time_scale') || '1.5') || 1.5; },

  startBoss(index) {
    const st = this.list()[index];
    this.battle = {
      index, turn: 0, affinity: 50, best: 0, timerId: null, locked: false,
      helps: this.route().help ? 3 : 0, startedAt: 0, limitMs: 0
    };
    const el = document.getElementById('route-content');
    el.innerHTML = `
      <div class="convo-intro">
        <div class="convo-icon">${st.icon}</div>
        <h3>⚔️ ${escapeHtml(st.boss.title)}</h3>
        <p class="convo-setting">${escapeHtml(st.boss.intro)}</p>
        <div class="convo-partner">
          <span class="partner-name">${escapeHtml(st.boss.partner)}</span>
        </div>
        <button class="btn-large primary" id="btn-boss-begin">会話を始める</button>
      </div>`;
    document.getElementById('btn-boss-begin').addEventListener('click', () => this.renderTurn());
  },

  renderTurn() {
    const b = this.battle;
    const st = this.list()[b.index];
    const turn = st.boss.turns[b.turn];
    b.locked = false;
    const pct = Math.max(0, Math.min(100, b.affinity));

    // 選択肢をシャッフル
    const order = turn.choices.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }

    const el = document.getElementById('route-content');
    el.innerHTML = `
      <div class="convo-hud">
        <div class="affinity-row">
          <span class="affinity-label">好感度</span>
          <div class="affinity-track"><div class="affinity-bar ${pct >= 70 ? 'high' : (pct < 40 ? 'low' : '')}" style="width:${pct}%"></div></div>
          <span class="affinity-value">${Math.round(pct)}</span>
        </div>
        <span class="convo-progress">${b.turn + 1} / ${st.boss.turns.length}</span>
      </div>
      ${this.route().help ? `
        <button class="partner-help-btn" id="btn-partner-help" ${b.helps > 0 ? '' : 'disabled'}>
          💗 パートナーに助けてもらう(残り${b.helps})
        </button>` : ''}
      <div class="situation">${escapeHtml(turn.s)}</div>
      ${turn.line.t && !turn.line.t.startsWith('(') ? `
        <div class="boss-line card">
          <p class="phrase-target small">「${escapeHtml(turn.line.t)}」</p>
          ${turn.line.ja ? `<p class="field-note">${escapeHtml(turn.line.ja)}</p>` : ''}
          <button class="tts-btn" id="btn-boss-line">🔊</button>
        </div>` : (turn.line.ja ? `<p class="field-note" style="text-align:center;margin-bottom:8px">${escapeHtml(turn.line.ja)}</p>` : '')}
      <div class="timer-wrap"><div class="timer-bar" id="boss-timer"></div></div>
      <div class="choices">
        ${order.map((i) => {
          const c = Phrases.byId(turn.choices[i].card);
          return `<button class="choice-btn learn-choice" data-boss-choice="${i}">
            ${escapeHtml(c.t)}<span class="choice-kana">${escapeHtml(c.k)}</span>
          </button>`;
        }).join('')}
      </div>`;

    const lang = this.route().lang;
    const lineBtn = document.getElementById('btn-boss-line');
    if (lineBtn) {
      const play = () => Speech.speak(turn.line.t, lang, 0.85);
      lineBtn.addEventListener('click', play);
      if (Speech.canSpeak(lang)) setTimeout(play, 400);
    }
    el.querySelectorAll('[data-boss-choice]').forEach((btn) =>
      btn.addEventListener('click', () => this.answer(Number(btn.dataset.bossChoice), btn)));

    // 💗 パートナーヘルプ: 一番まずい選択肢を消して、時間をリセット
    const helpBtn = document.getElementById('btn-partner-help');
    if (helpBtn) {
      helpBtn.addEventListener('click', () => {
        if (b.helps <= 0 || b.locked) return;
        const btns = [...el.querySelectorAll('[data-boss-choice]')].filter((x) => !x.disabled);
        if (btns.length <= 2) { showToast('もう十分絞れているよ、と隣で微笑んでいる'); return; }
        const worst = btns.reduce((a, x) =>
          turn.choices[Number(x.dataset.bossChoice)].d < turn.choices[Number(a.dataset.bossChoice)].d ? x : a);
        worst.disabled = true;
        worst.classList.add('helped-out');
        b.helps--;
        b.startedAt = Date.now();  // 時間もリセット
        helpBtn.textContent = `💗 パートナーに助けてもらう(残り${b.helps})`;
        if (b.helps <= 0) helpBtn.disabled = true;
        showToast('💗「それは違うよ」と小声で教えてくれた(時間もリセット!)');
      });
    }

    // 制限時間(倍率設定を反映)
    clearInterval(b.timerId);
    b.limitMs = 14 * 1000 * this.timeScale();
    b.startedAt = Date.now();
    const bar = document.getElementById('boss-timer');
    b.timerId = setInterval(() => {
      const left = b.limitMs - (Date.now() - b.startedAt);
      const frac = Math.max(0, left / b.limitMs);
      if (bar) {
        bar.style.width = `${frac * 100}%`;
        bar.className = 'timer-bar' + (frac < 0.3 ? ' urgent' : '');
      }
      if (left <= 0) {
        clearInterval(b.timerId);
        if (!b.locked) this.answer(-1, null);
      }
    }, 100);
  },

  answer(choiceIndex, btn) {
    const b = this.battle;
    if (b.locked) return;
    b.locked = true;
    clearInterval(b.timerId);

    const st = this.list()[b.index];
    const turn = st.boss.turns[b.turn];
    const timedOut = choiceIndex < 0;
    const choice = timedOut ? null : turn.choices[choiceIndex];
    const delta = timedOut ? -2 : choice.d;
    b.affinity = Math.max(0, Math.min(100, b.affinity + delta * 6));
    if (!timedOut && choice.best) b.best++;
    if (btn) btn.classList.add(delta > 0 ? 'correct' : 'wrong');

    const bestChoice = turn.choices.find((c) => c.best);
    const bestCard = Phrases.byId(bestChoice.card);
    const chosenCard = choice ? Phrases.byId(choice.card) : null;
    const cls = delta > 0 ? 'good' : (delta < 0 ? 'bad' : 'neutral');
    const sign = delta > 0 ? '+' : '';

    const el = document.getElementById('route-content');
    const fb = document.createElement('div');
    fb.className = `feedback ${cls}`;
    fb.innerHTML = `
      <div class="fb-head">
        <span class="fb-delta">好感度 ${sign}${delta * 6}</span>
        ${!timedOut && choice.best ? '<span class="fb-best">★ ベスト</span>' : ''}
      </div>
      <p class="fb-chosen">${timedOut ? '(時間切れ — 何も言えませんでした)' : `「${escapeHtml(chosenCard.t)}」(${escapeHtml(chosenCard.ja)})`}</p>
      <div class="md-body fb-why">${timedOut
        ? '沈黙が続いてしまいました。会話は完璧さより「返すこと」。次のターンで挽回を!'
        : escapeHtml(choice.why)}</div>
      ${(timedOut || !choice.best) ? `
        <div class="fb-best-box">
          <p class="fb-best-label">この場面のベスト</p>
          <p class="fb-best-text">${escapeHtml(bestCard.t)}(${escapeHtml(bestCard.k)})</p>
        </div>` : ''}
      <button class="btn-large primary" id="btn-boss-next">
        ${b.turn < st.boss.turns.length - 1 ? '次へ' : '結果を見る'}
      </button>`;
    el.appendChild(fb);
    el.querySelectorAll('.learn-choice').forEach((x) => { x.disabled = true; });
    fb.scrollIntoView({ behavior: 'smooth', block: 'end' });

    document.getElementById('btn-boss-next').addEventListener('click', () => {
      if (b.turn < st.boss.turns.length - 1) {
        b.turn++;
        this.renderTurn();
      } else {
        this.finishBoss();
      }
    });
  },

  finishBoss() {
    const b = this.battle;
    const route = this.route();
    const st = this.list()[b.index];
    const cleared = b.affinity >= this.CLEAR_AFFINITY;
    const firstClear = cleared && !this.isCleared(st.id);
    let earned = 0;

    if (cleared) {
      const d = this.data();
      if (firstClear) {
        d.cleared[st.id] = new Date().toISOString();
        this.save(d);
        earned = 30;
        if (typeof Gems !== 'undefined') Gems.add(3, `${st.title} クリア`);
        if (typeof Achievements !== 'undefined') {
          Achievements.unlock('route-first');
          if (this.clearedCount() >= route.list.length) {
            Achievements.unlock(route.clearAch);
            Gems.add(route.clearGems, `${route.title}全駅制覇`);
          }
        }
      } else {
        earned = 10;
      }
      if (typeof Gami !== 'undefined') Gami.addPoints(earned);
      if (typeof Quests !== 'undefined') Quests.tryComplete('study');
    }

    const allDone = this.clearedCount() >= route.list.length;
    const el = document.getElementById('route-content');
    el.innerHTML = `
      <div class="convo-result">
        <div class="learn-result-icon">${cleared ? (allDone ? '🏁' : '🎉') : '💪'}</div>
        <h3>${cleared ? (firstClear ? `${st.icon} ${escapeHtml(st.title)} クリア!` : 'クリア(再挑戦)') : 'もう少し!'}</h3>
        <p class="field-note">好感度 ${Math.round(b.affinity)} / 100(クリアライン ${this.CLEAR_AFFINITY}) ・ ベスト選択 ${b.best}/${st.boss.turns.length}</p>
        ${cleared ? `
          <div class="xp-gains">
            <span class="xp-chip points">⭐ +${earned} pt</span>
            ${firstClear ? '<span class="xp-chip">💎 +3</span>' : ''}
          </div>` : `
          <p class="field-note" style="margin-top:8px">フレーズの復習をしてから再挑戦すると勝てるはず。ボスは何度でも挑めます。</p>`}
        ${allDone && firstClear ? (route.key === 'hk'
          ? `<p class="fb-levelup">💒 Wedding Quest 制覇!ご両親に伝える言葉は、もうあなたのものです。💎+${route.clearGems}</p>`
          : `<p class="fb-levelup">🏁 Korea Route 全駅制覇!11月の準備は整いました。💎+${route.clearGems}</p>`) : ''}
      </div>
      <div class="results-actions">
        ${!cleared ? `<button class="btn-large primary" id="btn-boss-retry">⚔️ もう一度挑戦</button>` : ''}
        <button class="btn-large ${cleared ? 'primary' : ''}" id="btn-boss-map">🗺️ 路線図へ</button>
        <button class="btn-large" data-nav="learn">Language Questへ</button>
      </div>`;

    const retry = document.getElementById('btn-boss-retry');
    if (retry) retry.addEventListener('click', () => this.startBoss(b.index));
    document.getElementById('btn-boss-map').addEventListener('click', () => this.renderMap());
    el.querySelectorAll('[data-nav]').forEach((x) =>
      x.addEventListener('click', () => showScreen(x.dataset.nav)));
  }
};
