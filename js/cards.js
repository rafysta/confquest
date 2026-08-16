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
  }
];
