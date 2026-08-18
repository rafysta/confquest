/* ConfQuest - 学会攻略モード用 会話カード(通常戦闘プール)
 * 1〜2ターンの短い会話。1テーマ1カード。
 * delta: -3〜+3 / best: その場面の最適解(各ターン1つ) / why: 解説
 * focus: 獲得XPの配分先 (network / english / confidence / topic)
 */
'use strict';

const RUN_CARDS = [
  {
    id: 'morning-greet',
    title: '朝の挨拶',
    partner: '昨日少し話した研究者',
    focus: ['network'],
    turns: [{
      situation: '会場のエントランスで、昨日の懇親会で少し話した研究者と目が合いました。',
      limitSec: 10,
      choices: [
        { text: 'Good morning! Ready for another long day?', delta: 3, best: true,
          why: '挨拶+軽い一言で「また話せる人」になれます。昨日の関係を今日につなげる一言です。' },
        { text: 'Good morning.', delta: 1,
          why: '悪くありませんが、一言足すだけで会話が生まれるチャンスでした。' },
        { text: '(目をそらして通り過ぎる)', delta: -2,
          why: '一度話した相手を無視すると、昨日作った関係がリセットされてしまいます。' },
        { text: 'You look really tired today. Did you sleep at all? Your eyes are quite red, you know.', delta: -1,
          why: '外見への指摘は、たとえ事実でもネガティブに響きやすい入り方です。' }
      ]
    }]
  },
  {
    id: 'praise-talk',
    title: '発表を褒める',
    partner: '直前のセッションの発表者',
    focus: ['network', 'topic'],
    turns: [{
      situation: '休憩時間。さっき良い発表をした人が近くにいます。',
      limitSec: 12,
      choices: [
        { text: 'I enjoyed your talk — especially the part about the mutant data. How long did that take?', delta: 3, best: true,
          why: '**具体的にどこが**良かったかを言うと、社交辞令でなく本当に聴いた人だと伝わります。質問を足せば会話になります。' },
        { text: 'Nice talk.', delta: 1,
          why: '言わないよりずっと良いですが、具体性がないと会話はそこで終わります。' },
        { text: 'Your talk was OK overall, but to be honest, I think you missed an important control in the second half.', delta: -2,
          why: '指摘は質疑か、関係ができてから。初手の批判は身構えられます。' },
        { text: '(話しかけたいが、迷っているうちに相手が行ってしまう)', delta: -1,
          why: '褒め言葉は鮮度が命です。「さっきの発表」のうちに伝えましょう。' }
      ]
    }]
  },
  {
    id: 'didnt-catch',
    title: '聞き取れなかったとき',
    partner: '早口の研究者',
    focus: ['english', 'confidence'],
    turns: [{
      situation: '相手の英語が速くて、直前の文が聞き取れませんでした。相手はあなたの返事を待っています。',
      limitSec: 10,
      choices: [
        { text: 'Sorry, could you say that last part again? You mean the second experiment?', delta: 3, best: true,
          why: '聞き返しは恥ではなく、**どこまで理解したか**を添えると誠実さが伝わります。分かったふりが一番危険です。' },
        { text: 'Yes, yes, exactly.', delta: -3,
          why: '分かったふりです。次の質問で矛盾が露呈し、それまでの会話まで疑われます。' },
        { text: 'Sorry, my English is not so good... I probably did not understand most of what you just said. Sorry.', delta: -1,
          why: '謝りすぎると相手が話しにくくなります。聞き返せば十分で、卑下は不要です。' },
        { text: 'Could you speak more slowly, please?', delta: 2,
          why: '有効です。ただ具体的にどこを聞き返すかまで言えると、会話が止まりません。' }
      ]
    }]
  },
  {
    id: 'forgot-name',
    title: '名前を忘れた',
    partner: '顔は覚えている参加者',
    focus: ['network', 'confidence'],
    turns: [{
      situation: '向こうから「Hideki! Good to see you again!」と声をかけられました。顔は覚えていますが名前が出てきません。',
      limitSec: 12,
      choices: [
        { text: 'Great to see you too! Sorry — remind me your name again? Last night I met twenty people.', delta: 3, best: true,
          why: '早い段階で**理由を添えて**聞き直すのが最善です。後になるほど聞きにくくなります。軽い言い訳で場も和みます。' },
        { text: 'Heyyy... good to see you, my friend! How are you? How is... everything... going these days?', delta: 0,
          why: 'その場はしのげますが、名前が必要になる瞬間(紹介など)に詰みます。' },
        { text: '(名札をじっと見る)', delta: 1,
          why: '実用的ですが、見ていることは相手に分かります。堂々と聞く方が印象は良いです。' },
        { text: 'Sorry, do I know you?', delta: -3,
          why: '相手は覚えていてくれたのに、関係自体を否定する返しです。' }
      ]
    }]
  },
  {
    id: 'poster-visit',
    title: 'ポスターの前で',
    partner: 'ポスター発表中の大学院生',
    focus: ['topic', 'network'],
    turns: [{
      situation: '面白そうなポスターの前で、発表者の学生が期待の目でこちらを見ています。時間は少ししかありません。',
      limitSec: 12,
      choices: [
        { text: 'I have five minutes — can you give me the short version?', delta: 3, best: true,
          why: '時間を正直に伝えて要約を頼むのは、発表者への礼儀でもあります。学生は喜んで話してくれます。' },
        { text: '(黙って全部読み、黙って去る)', delta: -2,
          why: 'ポスター発表者にとって、無言で去られるのは最もつらい対応です。一言で良いので声をかけましょう。' },
        { text: 'Excuse me, I was looking at this figure for a while, and it seems wrong to me. It is wrong, isn\'t it?', delta: -1,
          why: '間違いの指摘は、まず説明を聞いてから。初手だと攻撃に聞こえます。' },
        { text: 'Interesting poster. Good luck!', delta: 1,
          why: '感じは良いですが、内容に触れていないので発表者には社交辞令に聞こえます。' }
      ]
    }]
  },
  {
    id: 'coffee-line',
    title: 'コーヒーの列で',
    partner: '隣に並んだ知らない参加者',
    focus: ['confidence', 'network'],
    turns: [{
      situation: 'コーヒーの列。隣の人の名札に、あなたも使っている実験手法のラボ名が見えます。',
      limitSec: 12,
      choices: [
        { text: 'Excuse me — are you from the Tanaka lab? I use your Hi-C protocol all the time.', delta: 3, best: true,
          why: '名札は話しかけるための情報源です。**相手のラボの仕事を使っている**ことは最高の入り口になります。' },
        { text: '(何も言わずコーヒーを待つ)', delta: 0,
          why: '失点はありませんが、学会の列は世界で一番話しかけやすい場所です。もったいない。' },
        { text: 'The coffee here is terrible, right?', delta: 1,
          why: '軽い不満の共有は距離を縮めることもありますが、初手のネガティブは外れることもあります。' },
        { text: 'You are from the Tanaka lab, correct? Good. Give me all the details of your Hi-C protocol right now.', delta: -2,
          why: '要求から入ると、警戒されます。まず自分が誰で、なぜ興味があるかを伝えましょう。' }
      ]
    }]
  },
  {
    id: 'hard-question',
    title: '答えられない質問',
    partner: '鋭い質問をしてきた研究者',
    focus: ['confidence', 'english'],
    turns: [{
      situation: '立ち話であなたの研究の話に。相手が、あなたがまだ検証していない点を突く質問をしてきました。',
      limitSec: 14,
      choices: [
        { text: 'Good question — we haven\'t tested that yet. My guess is the boundary changes first, but I\'d love your take.', delta: 3, best: true,
          why: '「未検証」と認めた上で**仮説と逆質問**を返す。研究者同士の会話で最も信頼される型です。' },
        { text: 'To be honest, that is not an important question for our study, so we did not spend any time on it at all.', delta: -3,
          why: '相手の質問の価値を否定しています。防御的な態度は議論を殺します。' },
        { text: 'We tested it. It was fine.', delta: -2,
          why: '事実でないなら最悪の選択です。深掘りされたら答えられません。' },
        { text: 'I don\'t know.', delta: 0,
          why: '正直ですが、そこで止まると会話も止まります。考えを添えましょう。' }
      ]
    }]
  },
  {
    id: 'decline-invite',
    title: '誘いを断る',
    partner: '二次会に誘ってくれた研究者',
    focus: ['network', 'english'],
    turns: [{
      situation: '「この後みんなで飲みに行くけど来る?」と誘われました。明日は朝一であなたの招待講演。今日は休みたい。',
      limitSec: 12,
      choices: [
        { text: 'I\'d love to, but my talk is at 9 am. Rain check? I\'m free tomorrow night.', delta: 3, best: true,
          why: '理由+**代案**が断り方の基本形です。「行きたい気持ち」を先に伝えると角が立ちません。' },
        { text: 'No, I can\'t.', delta: -1,
          why: '断ること自体は正当ですが、理由も代案もないと拒絶に聞こえます。' },
        { text: 'OK... I will go. My talk is early tomorrow morning, but... it should be fine... probably... I hope.', delta: 0,
          why: '関係のためでも、明日の講演を犠牲にするのは本末転倒です。断る勇気も社交スキルです。' },
        { text: '(曖昧に笑ってその場を離れる)', delta: -2,
          why: '返事をしないのは、はっきり断るより印象が悪くなります。' }
      ]
    }]
  },
  {
    id: 'active-listening',
    title: '興味を示す相槌',
    partner: '自分の研究を熱く語る研究者',
    focus: ['topic', 'network'],
    turns: [{
      situation: '相手が自分の実験について熱心に話しています。あなたは聞き役です。どう反応しますか。',
      limitSec: 10,
      choices: [
        { text: 'Wait, so the effect disappeared? Then what did you do?', delta: 3, best: true,
          why: '内容に反応した**続きを促す質問**は最強の相槌です。相手は「ちゃんと聴いてくれる人」と感じます。' },
        { text: 'Uh-huh. Uh-huh. Uh-huh.', delta: 0,
          why: '同じ相槌の連打は「聞き流している」ように見えます。' },
        { text: 'That reminds me of my own experiment — let me tell you about it. So, about three years ago, we...', delta: -1,
          why: '相手の熱が最高潮のときに話題を奪うのは避けましょう。話し終えるまで待つ方が得です。' },
        { text: '(時計をちらっと見る)', delta: -2,
          why: '熱く話している相手への時計チラ見は、確実に気づかれます。' }
      ]
    }]
  },
  {
    id: 'short-intro',
    title: '30秒の自己紹介',
    partner: 'セッション前に隣に座った教授',
    focus: ['english', 'confidence'],
    turns: [{
      situation: 'セッション開始前の隙間時間。隣の教授に「What do you do?」と聞かれました。開始まで30秒。',
      limitSec: 14,
      choices: [
        { text: 'I study how chromosome folding changes as cells age — I\'m presenting tomorrow at 9 if you\'re curious.', delta: 3, best: true,
          why: '一文で研究+**自分の発表への招待**。短い時間の自己紹介は「続きがある形」で終えるのが理想です。' },
        { text: 'I\'m a researcher from Japan.', delta: 0,
          why: '国と職業だけでは、相手の記憶に残りません。何を研究しているかを一言で。' },
        { text: 'Well, my background is a little complicated — I started in yeast genetics, then moved to imaging, then...', delta: -1,
          why: '30秒しかない場面で長い説明を始めると、セッション開始で強制終了します。時間に合わせた圧縮を。' },
        { text: 'It\'s hard to explain...', delta: -2,
          why: '説明の放棄です。どんな研究も一文には圧縮できます。事前に用意しておきましょう。' }
      ]
    }]
  },
  {
    id: 'exit-politely',
    title: '会話から抜ける',
    partner: '話が長い参加者',
    focus: ['network', 'confidence'],
    turns: [{
      situation: '20分話し続けられています。次のセッションで聴きたい発表があります。',
      limitSec: 12,
      choices: [
        { text: 'I want to catch the next session — but this was fun. Let\'s continue at the banquet!', delta: 3, best: true,
          why: '理由+ポジティブな締め+次の約束。抜けたいときは**正直に、明るく**が一番きれいです。' },
        { text: '(相槌を減らして気づいてもらうのを待つ)', delta: -1,
          why: '察してもらう作戦は長引くだけです。気まずさも増えます。' },
        { text: 'Sorry, I need to go to the bathroom. Maybe I will see you later somewhere... enjoy the rest of the conference.', delta: 0,
          why: '定番の脱出ですが、その後会場で会うと少し気まずい。正面から理由を言う方が上策です。' },
        { text: '(スマホを見て「あっ」という顔をする)', delta: -2,
          why: '演技は見抜かれがちで、見抜かれたときの失点が大きいです。' }
      ]
    }]
  },
  {
    id: 'food-topic',
    title: '食事の話題',
    partner: 'バンケットで同じテーブルの研究者',
    focus: ['topic'],
    turns: [{
      situation: 'バンケットで隣の韓国人研究者が「日本食は好きでよく食べる」と言いました。',
      limitSec: 12,
      choices: [
        { text: 'Oh nice — what\'s your favorite? I\'m still hunting for the best 삼겹살 here.', delta: 3, best: true,
          why: '相手の話題を受けて、**こちらも現地の食を楽しんでいる**ことを返す。food talkは万国共通の安全で豊かな話題です。' },
        { text: 'Japanese food is the best in the world.', delta: -1,
          why: '自国自慢は、相手が褒めてくれた直後でも degrees が過ぎると鼻につきます。' },
        { text: 'I see.', delta: 0,
          why: 'せっかく相手が出してくれた話題を受け取っていません。' },
        { text: 'Actually, to be completely honest, most Korean food is a little too spicy for me to really enjoy properly.', delta: 1,
          why: '正直で会話にはなりますが、相手の文化の否定形から入るより、楽しんでいる形の方が広がります。' }
      ]
    }]
  },
  {
    id: 'introduced',
    title: '紹介される',
    partner: '共同研究者が連れてきた大御所',
    focus: ['network', 'confidence'],
    turns: [{
      situation: '知人が「紹介したい人がいる」と、あなたの分野の著名な教授を連れてきました。「This is Hideki, the one I told you about.」',
      limitSec: 12,
      choices: [
        { text: 'A pleasure — I\'ve cited your 2019 paper more times than I can count. It shaped our approach.', delta: 3, best: true,
          why: '相手の仕事を**具体的に**知っていることを最初に伝える。著名人への最良の挨拶は称号ではなく内容への言及です。' },
        { text: 'Nice to meet you.', delta: 1,
          why: '礼儀正しいですが、せっかくの紹介の価値を活かしきれていません。' },
        { text: 'Oh! I know you! You are very famous! I have seen your name many, many times! This is really amazing!', delta: 0,
          why: '悪意はなくても「有名」としか言えないと、仕事を知らないことが伝わってしまいます。' },
        { text: '(緊張して知人の後ろに半歩下がる)', delta: -2,
          why: '紹介してくれた知人の顔も立ちません。緊張しても一歩前へ。' }
      ]
    }]
  },
  {
    id: 'weekend-plan',
    title: '週末の予定',
    partner: '打ち解けてきた同世代の研究者',
    focus: ['topic', 'network'],
    turns: [{
      situation: '「学会が終わったら少し観光するの?」と聞かれました。実際は疲れていて、ホテルで寝ようと思っています。',
      limitSec: 12,
      choices: [
        { text: 'Honestly? My big plan is sleeping. But if you know one place worth dragging myself to, I\'m listening.', delta: 3, best: true,
          why: '正直+自虐+相手への質問。**取り繕わない答え**は親近感を生み、質問で会話も続きます。' },
        { text: 'Yes, many places.', delta: 0,
          why: '中身のない答えは、興味を持って聞いてくれた相手に対してもったいない返しです。' },
        { text: 'No. I will sleep.', delta: 1,
          why: '正直で悪くありませんが、ぶっきらぼうに聞こえます。一言足すと印象が変わります。' },
        { text: 'Why do you want to know my schedule? That seems like a strange question to ask someone you only just met.', delta: -3,
          why: '雑談の定番質問を尋問と受け取る返しです。相手は好意で聞いています。' }
      ]
    }]
  },
  {
    id: 'thank-question',
    title: '質問への感謝',
    partner: 'あなたの発表に質問をくれた人',
    focus: ['network'],
    turns: [{
      situation: '廊下で、今朝あなたの発表に鋭い質問をくれた研究者とすれ違いました。',
      limitSec: 12,
      choices: [
        { text: 'Hey — thanks for that question this morning. It made me realize we need another control. Do you have a minute?', delta: 3, best: true,
          why: '質問者への後追いの感謝は**ほぼ確実に喜ばれ**、そのまま議論の続きが始まります。質疑は懇親会の入場券です。' },
        { text: '(会釈だけする)', delta: 0,
          why: '礼儀としては十分ですが、向こうはあなたの研究に興味がある人です。もったいない。' },
        { text: 'Your question this morning was honestly a little too harsh, you know. Everyone in the room felt sorry for me.', delta: -2,
          why: '冗談のつもりでも、質問を非難と受け取ったと思われます。質問は貢献です。' },
        { text: 'Hello. Nice conference.', delta: 1,
          why: '感じは良いですが、朝の接点に触れないのは機会損失です。' }
      ]
    }]
  },
  {
    id: 'name-pronounce',
    title: '名前の発音',
    partner: '初対面の韓国人研究者',
    focus: ['english', 'network'],
    turns: [{
      situation: '相手の名前「Hyeon-woo」がうまく発音できる自信がありません。',
      limitSec: 12,
      choices: [
        { text: 'Hyeon-woo — did I say that right? I want to get it right.', delta: 3, best: true,
          why: '発音を**確認する姿勢そのもの**が敬意として伝わります。名前を大切にする人は信頼されます。' },
        { text: '(名前を呼ぶのを避けて会話する)', delta: -1,
          why: '呼びかけを避け続けると、距離が縮まりません。相手も気づきます。' },
        { text: 'Hmm, your name is a little bit hard for me to pronounce — can I just call you Woo instead? Much easier.', delta: 0,
          why: '勝手に短縮形を提案するより、まず本人の名前を試みてから。相手が提案してくれることも多いです。' },
        { text: 'Your name is difficult.', delta: -2,
          why: '名前を「難しい」と評するのは、本人にはあまり気持ちの良いものではありません。' }
      ]
    }]
  },
  {
    id: 'contact-exchange',
    title: '連絡先の交換',
    partner: '議論が盛り上がった研究者',
    focus: ['network'],
    turns: [{
      situation: '良い議論ができました。相手が「もっと詳しく聞きたい」と言っています。',
      limitSec: 12,
      choices: [
        { text: 'Let\'s exchange emails — I\'ll send you the preprint tonight while it\'s fresh.', delta: 3, best: true,
          why: '**いつ何を送るか**まで約束すると、交換した連絡先が実際に使われます。「今夜」という期限が効きます。' },
        { text: 'You can find my paper on Google.', delta: -1,
          why: '検索させるのは相手任せです。9割は検索されずに終わります。' },
        { text: 'Sure, here is my email.', delta: 1,
          why: '交換はできましたが、次のアクションが決まっていないと自然消滅しがちです。' },
        { text: 'Well, maybe we will meet again at another conference somewhere, someday. The world is small, right?', delta: 0,
          why: '偶然の再会に賭けるより、確実な一手(連絡先+約束)を打ちましょう。' }
      ]
    }]
  },
  {
    id: 'session-neighbor',
    title: '発表直前の隣席',
    partner: '次の発表者らしき人',
    focus: ['confidence', 'network'],
    turns: [{
      situation: '隣の席の人がスライドを最終確認しています。緊張している様子。どうやら次の発表者のようです。',
      limitSec: 12,
      choices: [
        { text: 'Are you up next? Good luck — I\'m looking forward to it.', delta: 3, best: true,
          why: '発表直前の人への短い応援は、負担にならない長さなら**ほぼ確実に感謝されます**。発表後に話す糸口にもなります。' },
        { text: '(そっとしておく)', delta: 1,
          why: '思いやりのある判断で、悪くありません。ただ短い一言なら邪魔にはなりません。' },
        { text: 'Your slides have too much text, in my opinion.', delta: -3,
          why: '本番直前のダメ出しは、どれほど正しくても害しかありません。' },
        { text: 'Are you nervous? You look very nervous. Your hands are shaking a little bit. Are you really OK?', delta: -1,
          why: '緊張の指摘は緊張を増やします。応援の形に変えましょう。' }
      ]
    }]
  },
  {
    id: 'group-join',
    title: '輪に入る',
    partner: '談笑している3人組',
    focus: ['confidence', 'network'],
    turns: [{
      situation: '知り合いが1人いる3人組が談笑しています。輪に入りたい。',
      limitSec: 12,
      choices: [
        { text: '(輪の少し外に立ち、知り合いと目が合ったタイミングで) Mind if I join?', delta: 3, best: true,
          why: '**視線が合ってから**入るのが輪への入り方の定石です。知り合いが「彼はHideki、〜の研究をしてる」と紹介までしてくれます。' },
        { text: '(いきなり輪の中心に入って) Hello everyone! What are we all talking about today? Anything interesting?', delta: 0,
          why: '勢いはありますが、進行中の話題を折ってしまいます。一呼吸置くのが上策です。' },
        { text: '(遠くから知り合いに大声で) Hey! Come here!', delta: -2,
          why: '知り合いを輪から引き抜くのは、他の2人への礼を欠きます。' },
        { text: '(入りたかったが、諦めて壁際に戻る)', delta: -1,
          why: '輪は入ってよい場所です。学会の談笑は原則オープンなもの。一歩だけ近づいてみましょう。' }
      ]
    }]
  },
  {
    id: 'disagree-politely',
    title: '意見が違うとき',
    partner: '断定的に話す研究者',
    focus: ['english', 'confidence'],
    turns: [{
      situation: '相手が「この手法はもう時代遅れだ」と断言しました。あなたはまさにその手法を使っており、有効だと考えています。',
      limitSec: 14,
      choices: [
        { text: 'Interesting — we still get a lot from it, actually. What would you use instead?', delta: 3, best: true,
          why: '反論を**自分のデータ+逆質問**の形にすると、対立ではなく議論になります。相手の主張も聞き出せます。' },
        { text: 'You are wrong.', delta: -2,
          why: '正面からの否定は議論ではなく対決を生みます。内容以前に態度で損をします。' },
        { text: '(内心反対だが) Yes, you are right.', delta: -1,
          why: '摩擦は避けられますが、自分の研究の立場を放棄しています。相手もあなたの本音に興味があります。' },
        { text: 'Well, you know, every method has its own pros and cons, so it is difficult to say anything definite, really.', delta: 1,
          why: '安全ですが一般論すぎて、議論が深まりません。' }
      ]
    }]
  },
  {
    id: 'poster-own-visitor',
    title: '自分のポスターに人が来た',
    partner: 'ポスターを覗きに来た研究者',
    focus: ['confidence', 'english'],
    turns: [{
      situation: 'あなたのポスターの前に、一人の研究者が立ち止まって図を眺めています。まだ何も言ってきません。',
      limitSec: 12,
      choices: [
        { text: 'Hi! Would you like me to walk you through it? It takes about two minutes.', delta: 3, best: true,
          why: '**こちらから声をかけ、所要時間を先に伝える**のが最強です。相手は「長く捕まらない」と分かって安心して聞けます。' },
        { text: 'Hello. Any questions?', delta: 1,
          why: '悪くありませんが、相手はまだ内容を把握していないので「質問は?」は答えにくい問いです。' },
        { text: '(相手が読み終わるまで黙って待つ)', delta: -1,
          why: '遠慮しすぎです。ポスターは「話しかけてもらう場」ではなく「話しかける場」。黙っていると通り過ぎられます。' },
        { text: 'This is my poster. I am Hideki from Japan. I study chromatin. It is very interesting research and I have many data.', delta: -2,
          why: '前置きが長く、相手が知りたい「何が分かったのか」に届きません。自己紹介より先に中身を1文で。' }
      ]
    }]
  },
  {
    id: 'one-minute-pitch',
    title: '「1分で説明して」',
    partner: '足早に回っている大御所',
    focus: ['confidence', 'topic'],
    turns: [{
      situation: '「I only have a minute — what\'s the main finding?」 大御所が腕時計を見ながら聞いてきました。',
      limitSec: 12,
      choices: [
        { text: 'We found that X controls Y. Before, people thought Z — this changes that.', delta: 3, best: true,
          why: '**結論 → これまでの常識 → 何が変わるか**の3文。1分しかない相手には、背景ではなく結論から渡します。' },
        { text: 'So, first let me explain the background of this field. In 2015, a group reported...', delta: -3,
          why: '「1分で」と言われて背景から始めるのは最悪の返しです。相手は途中で離れてしまいます。' },
        { text: 'We found that X controls Y.', delta: 2,
          why: '結論から入れたのは正解。もう一言「だから何が新しいか」を添えると、相手の記憶に残ります。' },
        { text: 'It\'s a bit complicated to explain in a minute...', delta: -2,
          why: '「1分では説明できない」は、要点を掴めていないと受け取られます。どんな研究も1文には縮められます。' }
      ]
    }]
  },
  {
    id: 'qa-self-intro',
    title: '質問の前の名乗り',
    partner: 'セッションの発表者',
    focus: ['confidence', 'english'],
    turns: [{
      situation: '質疑応答。マイクの前に立ちました。会場全員が聞いています。',
      limitSec: 12,
      choices: [
        { text: 'Hideki Yamada, from Kyoto. Thank you for the talk — I have one question about Figure 3.', delta: 3, best: true,
          why: '**名前と所属 → 短い感謝 → 質問箇所の明示**。国際学会の質疑の標準形で、これだけで「慣れている人」に見えます。' },
        { text: '(いきなり)In Figure 3, why did you use that control?', delta: 0,
          why: '内容は良いのですが、名乗りがないと座長も発表者も誰の質問か分かりません。ひと呼吸で名乗りましょう。' },
        { text: 'Hello, my name is Hideki Yamada and I am a postdoc at the Institute of... and I work on chromatin, and today I really enjoyed...', delta: -2,
          why: '自己紹介が長すぎます。質疑の時間は発表者と会場のものです。名乗りは10秒以内に。' },
        { text: 'Sorry, my English is not good, but...', delta: -1,
          why: '謝罪から入ると、聞き手の注意が内容ではなくあなたの英語に向いてしまいます。堂々と質問だけ言えば十分です。' }
      ]
    }]
  },
  {
    id: 'cant-answer',
    title: '答えられない質問',
    partner: '鋭い質問をした参加者',
    focus: ['confidence', 'english'],
    turns: [{
      situation: '質疑で「そのデータの統計処理は?」と聞かれましたが、共同研究者が担当した部分で即答できません。',
      limitSec: 12,
      choices: [
        { text: 'Good question — that part was done by my collaborator. Could I check and get back to you after the session?', delta: 3, best: true,
          why: '**分からないと認める + 誰が知っているか + いつ答えるか**。これは弱さではなく誠実さで、むしろ信頼されます。' },
        { text: 'I think it was probably a t-test... maybe.', delta: -2,
          why: '曖昧な推測は最も危険です。あとで違っていたら、その研究全体の信頼が揺らぎます。' },
        { text: 'I don\'t know.', delta: 0,
          why: '正直なのは良いのですが、そこで会話が終わります。「調べて後で答える」まで言えると印象が変わります。' },
        { text: 'That\'s not really important for the main conclusion.', delta: -3,
          why: '質問をはねつける返しです。会場全体に「都合の悪い指摘を避けた」と伝わってしまいます。' }
      ]
    }]
  },
  {
    id: 'chair-greeting',
    title: '発表前、座長への挨拶',
    partner: 'あなたのセッションの座長',
    focus: ['network', 'confidence'],
    turns: [{
      situation: 'セッション開始15分前。会場に座長らしき人がいます。あなたはこのセッションの発表者です。',
      limitSec: 12,
      choices: [
        { text: 'Excuse me, are you Prof. Han? I\'m Hideki Yamada — I\'m giving the third talk. Nice to meet you.', delta: 3, best: true,
          why: '**発表前に座長へ名乗る**のは国際学会の礼儀です。名前の読み方も伝わり、紹介がスムーズになります。' },
        { text: '(何も言わず自分の席に座る)', delta: -1,
          why: '悪いことではありませんが、大きな機会損失です。座長は分野の要人であることが多く、この30秒が人脈になります。' },
        { text: 'Hello! Could you please introduce me with my full title and mention my funding agency?', delta: -2,
          why: '紹介の注文をつけるのは越権です。座長には名乗るだけで十分。' },
        { text: 'Hi, I am the third speaker.', delta: 1,
          why: '必要な情報は伝わりますが、名前を言わないと座長が困ります。名乗りはセットで。' }
      ]
    }]
  },
  {
    id: 'late-entry',
    title: '遅れて入室',
    partner: '満席の会場',
    focus: ['confidence'],
    turns: [{
      situation: '聞きたい発表に5分遅れました。会場は暗く、前の方にしか空席が見えません。',
      limitSec: 10,
      choices: [
        { text: '(静かに入り、後方の壁際に立って聞く)', delta: 3, best: true,
          why: '**発表を妨げないのが最優先**。前の空席へ横切るより、壁際に立つほうがずっと印象が良い選択です。' },
        { text: '(前方の空席まで通路を歩いて座る)', delta: -1,
          why: '暗い会場を横切ると視線を集め、発表者の集中を切ってしまいます。' },
        { text: '(諦めて外で待つ)', delta: 0,
          why: '迷惑はかけませんが、聞きたかった発表を丸ごと逃します。静かに入れば大丈夫です。' },
        { text: '(隣の人に「What did I miss?」と小声で聞く)', delta: -2,
          why: '発表中の私語は、周囲にとって最も気になる迷惑です。あとで聞きましょう。' }
      ]
    }]
  },
  {
    id: 'badge-recognized',
    title: '名札を見られた',
    partner: '名札を覗き込んだ研究者',
    focus: ['network', 'confidence'],
    turns: [{
      situation: '相手があなたの名札をちらりと見て、「Oh — you\'re the one who published that paper on chromatin?」と言いました。',
      limitSec: 12,
      choices: [
        { text: 'Yes, that\'s me! Are you working on something related?', delta: 3, best: true,
          why: '**素直に認めて、すぐ相手に話を振り返す**。相手はあなたの論文を知っているので、共通の話題がすでにあります。' },
        { text: 'Oh, it\'s nothing special, really. Just a small paper.', delta: -2,
          why: '日本的な謙遜ですが、国際的な場では「本当に大したことがない」と受け取られます。せっかくの評価を自分で下げないこと。' },
        { text: 'Yes, that\'s me.', delta: 1,
          why: '認めたのは正解。ただ会話がそこで止まります。ひとこと質問を返せば関係が始まります。' },
        { text: 'Yes! Did you read it? What did you think of the third figure? Actually there were four more experiments we could not include...', delta: -1,
          why: '嬉しさが先走っています。相手はまだ挨拶の段階なので、一気に詳細へ行くと引かれます。' }
      ]
    }]
  },
  {
    id: 'lunch-seat',
    title: 'ランチの相席',
    partner: '同じテーブルの見知らぬ参加者',
    focus: ['network', 'english'],
    turns: [{
      situation: 'ランチ会場。ほぼ満席で、4人掛けのテーブルに1つだけ空きがあります。3人は知らない人です。',
      limitSec: 10,
      choices: [
        { text: 'Excuse me, is this seat taken? — Thanks. I\'m Hideki, from Japan.', delta: 3, best: true,
          why: '**一言断って座り、そのまま名乗る**。学会のランチは人脈作りの最高の場で、黙って座ると気まずいまま終わります。' },
        { text: '(空席を避けて、一人で立って食べる)', delta: -2,
          why: '一番もったいない選択です。ランチの相席は「話しかけていい」場として全員が了解しています。' },
        { text: '(黙って座り、スマホを見ながら食べる)', delta: -1,
          why: '座れたのは良いのですが、スマホを見た瞬間に「話しかけないで」の合図になります。' },
        { text: 'Is this seat taken?', delta: 1,
          why: '礼儀としては十分。名乗りを足すだけで、そこから会話が始まります。' }
      ]
    }]
  },
  {
    id: 'shuttle-bus',
    title: 'シャトルバスの隣席',
    partner: '隣に座った参加者',
    focus: ['network', 'topic'],
    turns: [{
      situation: '会場行きのバス。隣に座った人と目が合いました。移動は20分ほどあります。',
      limitSec: 12,
      choices: [
        { text: 'Morning. Is this your first time at this conference?', delta: 3, best: true,
          why: '**誰にでも答えられて、そこから話が広がる質問**。「初めて」でも「10回目」でも次の話題が生まれます。' },
        { text: 'Hello. Nice weather today.', delta: 1,
          why: '無難な入り口です。ただ天気の話は続きにくいので、もう一歩踏み込む問いがあると良いでしょう。' },
        { text: '(会釈だけしてイヤホンをつける)', delta: -1,
          why: '疲れているときは仕方ありませんが、20分の相席は貴重な機会です。' },
        { text: 'What is your h-index?', delta: -3,
          why: '業績を数字で聞くのは、初対面ではかなり失礼にあたります。給料を聞くのと同じ感覚です。' }
      ]
    }]
  },
  {
    id: 'photo-permission',
    title: 'ポスターの写真',
    partner: 'ポスター発表者',
    focus: ['english', 'network'],
    turns: [{
      situation: '興味深いポスターを見つけました。あとで読み返したいので写真を撮りたいのですが、発表者が横にいます。',
      limitSec: 12,
      choices: [
        { text: 'This is really interesting — would it be OK if I took a photo for my own reference?', delta: 3, best: true,
          why: '**必ず一言断る**のが鉄則です。未発表データが含まれることも多く、無断撮影はトラブルのもとになります。' },
        { text: '(黙ってスマホで撮る)', delta: -3,
          why: '学会によっては規約違反です。未発表データの流出を心配させ、相手を強く不快にさせます。' },
        { text: 'Can I take a photo?', delta: 2,
          why: '断っているので問題ありません。「for my own reference(自分用に)」を足すと、相手はより安心します。' },
        { text: 'Could you send me the PDF of this poster by email?', delta: 0,
          why: '悪くはありませんが、相手に手間をかけます。まずその場で撮らせてもらうほうが自然です。' }
      ]
    }]
  },
  {
    id: 'out-of-cards',
    title: '名刺を切らした',
    partner: '名刺を差し出した研究者',
    focus: ['confidence', 'network'],
    turns: [{
      situation: '相手が名刺を差し出しました。しかし、あなたの名刺入れはもう空です。',
      limitSec: 12,
      choices: [
        { text: 'Thank you! I\'m out of cards — may I email you right now so you have my address?', delta: 3, best: true,
          why: '**その場で解決策を出す**のが最善。目の前でメールを送れば、名刺以上に確実に連絡先が残ります。' },
        { text: 'Sorry, I have no card.', delta: 0,
          why: '正直ですが、そこで連絡先の交換が終わってしまいます。代わりの手段を出しましょう。' },
        { text: '(受け取るだけで何も言わない)', delta: -2,
          why: '一方的に受け取るだけになり、関係が片道で終わります。' },
        { text: 'I\'m so sorry, that\'s very rude of me, I should have prepared more, I apologize...', delta: -1,
          why: '謝りすぎです。名刺切れはよくあることで、相手も気にしていません。' }
      ]
    }]
  },
  {
    id: 'collab-offer',
    title: '共同研究の打診',
    partner: '同じ手法を使っているPI',
    focus: ['network', 'confidence'],
    turns: [{
      situation: '「We should collaborate — we have the mouse line you need.」 その場で共同研究を持ちかけられました。',
      limitSec: 14,
      choices: [
        { text: 'That sounds great. Let me talk to my PI, and I\'ll email you this week — is that OK?', delta: 3, best: true,
          why: '**乗り気を示しつつ、持ち帰る**。ボスに確認が必要なのは相手も分かっています。期限を切ると本気度が伝わります。' },
        { text: 'Yes! Let\'s do it. I\'ll send you the samples next month.', delta: -1,
          why: '前のめりすぎます。試料の送付は所属機関の合意(MTA)が要ることが多く、独断で約束すると後で困ります。' },
        { text: 'Hmm, I need to think about it.', delta: 0,
          why: '慎重なのは良いのですが、次のアクションがないと話は自然消滅します。' },
        { text: 'Sorry, we are already doing that ourselves.', delta: -2,
          why: '事実でも、扉を閉じる言い方です。「今はこう進めているが、この部分なら一緒にできるかも」と余地を残しましょう。' }
      ]
    }]
  },
  {
    id: 'ask-slides',
    title: 'スライドをもらいたい',
    partner: '参考になる発表をした人',
    focus: ['english', 'network'],
    turns: [{
      situation: '発表の一枚のスライドが自分の研究にそのまま役立ちそうです。発表後、本人に話しかけました。',
      limitSec: 12,
      choices: [
        { text: 'Your slide on the workflow was really useful. Is there a paper I could cite, or could I ask you for that figure?', delta: 3, best: true,
          why: '**まず論文を尋ねる**のが礼儀です。未発表なら図をお願いする、という順番なら相手も断りやすく、頼みやすくなります。' },
        { text: 'Could you send me all your slides?', delta: -2,
          why: '未発表データを含む全スライドの要求は重いお願いです。ほぼ断られ、気まずくなります。' },
        { text: 'Where can I find that data?', delta: 1,
          why: '悪くありませんが、少し素っ気なく聞こえます。何が良かったかを先に言うと印象が変わります。' },
        { text: '(あとでメールしようと思い、その場では何も言わない)', delta: 0,
          why: 'メールは届きますが、顔を合わせた今のほうが圧倒的に返事をもらいやすいです。' }
      ]
    }]
  },
  {
    id: 'join-busy-pair',
    title: '話し中の2人',
    partner: '立ち話をしている2人',
    focus: ['network', 'confidence'],
    turns: [{
      situation: '話したかった研究者が、別の人と真剣な様子で立ち話をしています。もうすぐ次のセッションが始まります。',
      limitSec: 12,
      choices: [
        { text: '(近くで待ち、会話が途切れた瞬間に)Sorry to interrupt — do you have two minutes later today?', delta: 3, best: true,
          why: '**割り込まず、区切りで、短い時間だけ**を求める。相手も断りにくく、あなたも確実に時間を取れます。' },
        { text: '(2人の会話に入って自己紹介を始める)', delta: -2,
          why: '真剣な話の途中で割り込むと、相手にも一緒にいる人にも失礼になります。' },
        { text: '(諦めて立ち去る)', delta: -1,
          why: '安全ですが、学会の残り時間は限られています。「あとで2分だけ」なら十分頼めます。' },
        { text: '(2人の横にずっと立って、じっと見つめて待つ)', delta: -1,
          why: '待つ姿勢は正しいのですが、至近距離で見つめると相手が話しづらくなります。少し離れて待ちましょう。' }
      ]
    }]
  },
  {
    id: 'receive-praise',
    title: '褒められたときの返し',
    partner: '発表を褒めてくれた参加者',
    focus: ['confidence', 'english'],
    turns: [{
      situation: '「That was a very clear presentation. I really liked it.」 発表後に声をかけられました。',
      limitSec: 10,
      choices: [
        { text: 'Thank you, that means a lot. Which part was most useful for you?', delta: 3, best: true,
          why: '**素直に受け取り、質問で返す**。日本語では謙遜が礼儀ですが、英語では受け取ることが礼儀です。質問を足せば会話が続きます。' },
        { text: 'No no, my English is terrible and the slides were messy.', delta: -2,
          why: '強い否定は、褒めた相手の判断を否定することになります。国際的な場では受け取るのが礼儀です。' },
        { text: 'Thank you.', delta: 1,
          why: '十分に礼儀正しい返しです。ただ会話はそこで終わってしまいます。' },
        { text: 'I know, I practiced a lot.', delta: -1,
          why: '事実でも自慢に聞こえます。まず感謝を伝えてから、努力の話をしましょう。' }
      ]
    }]
  },
  {
    id: 'banquet-toast',
    title: '突然の乾杯の音頭',
    partner: '同じテーブルの参加者たち',
    focus: ['confidence', 'english'],
    turns: [{
      situation: '懇親会。テーブルの誰かが「Let\'s have someone from Japan say a few words!」とあなたを指名しました。',
      limitSec: 14,
      choices: [
        { text: '(立ち上がって)Thank you! To a great conference, and to new collaborations — cheers!', delta: 3, best: true,
          why: '**短く・明るく・全員に関係のあること**。乾杯の挨拶は10秒で十分で、長さより即答できることが評価されます。' },
        { text: 'Oh no, no, please ask someone else.', delta: -2,
          why: '断ると場の空気が止まり、指名した人も気まずくなります。一言でいいので受けましょう。' },
        { text: 'Cheers!', delta: 1,
          why: '受けたこと自体が正解です。ひとこと足すだけで、ぐっと場が温まります。' },
        { text: 'Well, first I would like to thank the organizers, the sponsors, my supervisor, and everyone who...', delta: -1,
          why: '謝辞の長いスピーチは懇親会の乾杯には重すぎます。グラスを持った全員が待っています。' }
      ]
    }]
  },
  {
    id: 'slow-down',
    title: 'ゆっくり話してほしい',
    partner: '早口のネイティブスピーカー',
    focus: ['english', 'confidence'],
    turns: [{
      situation: '相手の英語がとても速く、話の半分ほどしか掴めていません。会話はまだ続きそうです。',
      limitSec: 12,
      choices: [
        { text: 'Sorry — could you speak a little more slowly? English isn\'t my first language.', delta: 3, best: true,
          why: '**はっきり頼む**のが最善です。ほとんどの人は快く応じます。言わなければ相手は速さに気づけません。' },
        { text: '(分かったふりをして相槌を打ち続ける)', delta: -3,
          why: '最も危険です。話が進むほどズレが大きくなり、あとで取り返しがつかなくなります。' },
        { text: 'Sorry, what?', delta: 0,
          why: 'その一文は聞き返せますが、次の文もまた速いままです。速度そのものを頼みましょう。' },
        { text: 'Sorry, my English is very bad.', delta: -1,
          why: '自分を下げるだけで、状況は変わりません。求めているのは謝罪ではなく「ゆっくり」です。' }
      ]
    }]
  },
  {
    id: 'student-asks',
    title: '学生からの質問',
    partner: '緊張した様子の大学院生',
    focus: ['network', 'confidence'],
    turns: [{
      situation: 'ポスターの前で、学生が緊張しながら「Sorry, this may be a basic question, but...」と切り出しました。',
      limitSec: 12,
      choices: [
        { text: 'Not basic at all — that\'s exactly the point people ask most. So, ...', delta: 3, best: true,
          why: '**まず質問を肯定する**。学生は勇気を出して聞いています。ここで安心させられる人は、必ず覚えてもらえます。' },
        { text: 'Yes, that is quite basic. It\'s in any textbook.', delta: -3,
          why: '相手を萎縮させ、周囲で聞いている人にも冷たい印象を与えます。' },
        { text: '(質問に淡々と答える)', delta: 1,
          why: '答えとしては十分ですが、相手の緊張をほぐす一言があると、関係の質が変わります。' },
        { text: 'Let me explain from the very beginning of the field, in 1998...', delta: -1,
          why: '親切のつもりでも、聞かれていないことまで話すと相手は逃げ場を失います。まず質問に答えましょう。' }
      ]
    }]
  },
  {
    id: 'awkward-silence',
    title: '会話が途切れた',
    partner: '話していた研究者',
    focus: ['topic', 'confidence'],
    turns: [{
      situation: '数分話しましたが、話題が尽きて沈黙が流れました。相手もどうしようか探っている様子です。',
      limitSec: 10,
      choices: [
        { text: 'By the way, are you going to the session on single-cell after this?', delta: 3, best: true,
          why: '**その場で共有している話題(プログラム)に戻す**のが最も自然な立て直しです。相手も答えやすい問いです。' },
        { text: '(沈黙に耐えられず、その場を離れる)', delta: -1,
          why: '沈黙は失敗ではありません。数秒の間は普通のことで、一言あれば会話は戻ります。' },
        { text: 'So... yeah.', delta: 0,
          why: '沈黙は埋まりますが、話題は戻りません。次の一手を用意しておきましょう。' },
        { text: 'It was nice talking to you. Enjoy the rest of the conference!', delta: 2,
          why: '**きれいに切り上げるのも正解**です。無理に続けるより、良い印象のまま終われます。' }
      ]
    }]
  },
  {
    id: 'last-day-farewell',
    title: '最終日の別れ際',
    partner: '何度か話した研究者',
    focus: ['network', 'english'],
    turns: [{
      situation: '学会最終日。何度か話した相手と、会場の出口で最後に顔を合わせました。',
      limitSec: 12,
      choices: [
        { text: 'It was really good to meet you. I\'ll send you that paper we talked about — see you at the next meeting.', delta: 3, best: true,
          why: '**具体的な約束を1つ残す**と、帰国後のメールが自然になります。「また会いましょう」だけでは連絡は途切れます。' },
        { text: 'Bye! See you!', delta: 1,
          why: '明るくて良いのですが、これだけだと次につながりません。' },
        { text: 'Thank you for everything. I hope we can keep in touch someday if possible.', delta: 0,
          why: '丁寧ですが曖昧で、社交辞令に聞こえます。何を・いつ、が入ると本物になります。' },
        { text: '(気づかないふりをして出口へ向かう)', delta: -2,
          why: '数日かけて作った関係を、最後の10秒で手放すことになります。' }
      ]
    }]
  },
  {
    id: 'talk-overlap',
    title: '同時に喋ってしまった',
    partner: '会話中の研究者',
    focus: ['english', 'confidence'],
    turns: [{
      situation: '相手と同時に話し始めてしまい、お互いに言葉が止まりました。',
      limitSec: 10,
      choices: [
        { text: 'Sorry — please, go ahead.', delta: 3, best: true,
          why: '**先を譲る**のが最もスマートです。一瞬で場が整い、相手も気持ちよく話せます。英語圏では定番のやり取りです。' },
        { text: '(構わず自分の話を続ける)', delta: -2,
          why: '相手の話を押しのける形になり、会話の主導権を奪った印象を与えます。' },
        { text: '(気まずくなって黙り込む)', delta: -1,
          why: 'どちらも黙ると沈黙が長引きます。一言譲れば済む場面です。' },
        { text: 'Sorry, sorry, what were you saying? Sorry.', delta: 0,
          why: '謝罪の繰り返しは、かえって気まずさを長引かせます。一度で十分です。' }
      ]
    }]
  },
  {
    id: 'wrong-assumption',
    title: '勘違いされた',
    partner: '別の研究者と間違えた相手',
    focus: ['english', 'confidence'],
    turns: [{
      situation: '「You\'re the one working on the zebrafish model, right?」— 別の研究者と勘違いされています。',
      limitSec: 12,
      choices: [
        { text: 'Ah, that\'s someone else — I work on chromatin in mouse cells. But I\'d love to hear about the zebrafish work.', delta: 3, best: true,
          why: '**訂正 → 自分の説明 → 相手の話へ**。誤解を正しつつ会話を切らさない、いちばん良い流れです。' },
        { text: 'Yes, that\'s right.', delta: -3,
          why: '話を合わせると、あとで必ず矛盾します。学会は狭い世界なので、誤解は早く解くほど安全です。' },
        { text: 'No, that\'s not me.', delta: 0,
          why: '正しい訂正ですが、そこで会話が止まります。自分が何をしているかを続けて言いましょう。' },
        { text: 'No. Do I look like that person?', delta: -2,
          why: '相手を責める響きになります。名札の多い会場では、取り違えは誰にでも起こります。' }
      ]
    }]
  },
  {
    id: 'gift-exchange',
    title: '日本からのお土産',
    partner: '世話になった現地の研究者',
    focus: ['network', 'confidence'],
    turns: [{
      situation: '会場を案内してくれた現地の研究者に、日本から持ってきた小さなお土産を渡したい場面です。',
      limitSec: 12,
      choices: [
        { text: 'This is a small thing from Japan — thank you for showing me around today.', delta: 3, best: true,
          why: '**小さいと添えて、理由を言って渡す**。相手が受け取りやすく、お返しの負担も感じさせません。' },
        { text: '(黙って袋を差し出す)', delta: 0,
          why: '気持ちは伝わりますが、なぜ渡すのかが分からないと相手は戸惑います。' },
        { text: 'This is just a cheap thing, it\'s nothing, sorry it\'s so small.', delta: -1,
          why: '過度な謙遜は、贈り物自体の価値を下げてしまいます。「small」の一言で十分です。' },
        { text: 'I brought this for you. Please give me your feedback on my manuscript later.', delta: -3,
          why: '見返りを条件にすると、贈り物ではなく取引になります。相手を強く困らせます。' }
      ]
    }]
  }
];
