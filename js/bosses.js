/* ConfQuest - 学会攻略モード Phase 3: ボス会話
 * Day 1: セッション座長 / Day 2: 大御所教授 / Day 3: 鋭いReviewer
 * ボス戦はダメージ1.5倍。Day 3は制限時間も短い。
 */
'use strict';

const BOSSES = [
  {
    day: 1,
    id: 'boss-chair', reward: { funds: 55, gems: 2 },
    title: '👑 セッション座長',
    partner: 'Prof. Han — あなたのセッションの座長。丁寧だが観察眼が鋭い',
    focus: ['network', 'confidence'],
    turns: [
      {
        situation: 'レセプションの終盤、座長のProf. Hanがグラスを持って近づいてきました。\n\n> "Ah, our invited speaker. Your session tomorrow — are you ready?"',
        limitSec: 13,
        choices: [
          { text: 'Almost — I\'m planning to finish 30 seconds early to leave room for questions. Anything you\'d like me to keep in mind as chair?', delta: 3, best: true,
            why: '準備状況を具体的に伝え、**座長の仕事を楽にする質問**を返しています。座長が最も信頼する登壇者の姿です。' },
          { text: 'Yes, no problem at all. I have given this exact talk many times before, so you really do not need to worry about anything.', delta: 0,
            why: '自信は良いのですが、「使い回しの講演」という印象を与えるリスクがあります。' },
          { text: 'Honestly, I\'m very nervous...', delta: 1,
            why: '正直さは悪くありませんが、座長は進行の不安材料と受け取るかもしれません。緊張は伝えても、準備は示しましょう。' },
          { text: 'Ready for what?', delta: -2,
            why: '自分のセッションの座長を認識していないと思われる返答です。名札と役割は事前に確認を。' }
        ]
      },
      {
        situation: '> "Good. By the way, your abstract mentions single-cell data, but the program says bulk Hi-C. Which will you present?"\n\n鋭い指摘。実はアブスト提出後に内容を少し変えていました。',
        limitSec: 14,
        choices: [
          { text: 'Sharp eye! The story evolved after submission — I\'ll present both, and I\'ll make the connection clear in the first slide.', delta: 3, best: true,
            why: '変更を認め、**聴衆への配慮(最初に整理する)**まで示しています。座長の心配は「聴衆が混乱しないか」です。' },
          { text: 'They are basically the same thing.', delta: -2,
            why: '専門家に対してごまかしは通用しません。信頼を失う返答です。' },
          { text: 'Oh no... I am so sorry... maybe I should write an apology email to the program committee tonight... is that necessary? I feel terrible.', delta: 0,
            why: '謝りすぎです。アブスト提出後の進展は普通のこと。堂々と説明すれば問題ありません。' },
          { text: 'The program is wrong. Someone made a mistake.', delta: -3,
            why: '運営側のミスにする返答は、座長(=運営側)への攻撃になります。事実でも言い方があります。' }
        ]
      },
      {
        situation: '> "One more thing — we have a student session tomorrow morning. Poor attendance every year. Will you come?"\n\n明朝は自分の講演の直前で、正直行きたくありません。',
        limitSec: 14,
        choices: [
          { text: 'My talk is right after, so I can\'t stay long — but I\'ll come for the first two student talks. They deserve an audience.', delta: 3, best: true,
            why: '制約を正直に伝えつつ、**できる範囲の貢献**を約束しています。全部やる必要はなく、少しやる人が信頼されます。' },
          { text: 'Of course! I will attend everything! Every single session, every single talk! I never skip anything at conferences, I promise you!', delta: 0,
            why: '安請け合いです。実際に行けなかったとき、座長は必ず覚えています。' },
          { text: 'Sorry, I need to prepare for my talk.', delta: 1,
            why: '正当な理由ですが、若手支援への関心ゼロという印象も残ります。一部だけでも顔を出す選択肢がありました。' },
          { text: 'Student talks are usually not so interesting, right?', delta: -3,
            why: '学生セッションを立ち上げた座長本人への最悪の返答です。' }
        ]
      },
      {
        situation: '別れ際、座長が言いました。\n\n> "Looking forward to tomorrow. Anything you need from me?"',
        limitSec: 12,
        choices: [
          { text: 'One thing — my last slide has a movie. If the video fails, I\'ll just talk over a still image, so no need to panic. Thank you for checking!', delta: 3, best: true,
            why: 'トラブル時の対処まで**先に共有**しておく。座長への最高の贈り物は「想定外をなくすこと」です。' },
          { text: 'No, nothing. Good night.', delta: 1,
            why: '問題はありませんが、せっかくの申し出をそのまま返しました。' },
          { text: 'Actually, one small request — if nobody raises a hand, could you please give me an easy first question? That would really help me relax up there.', delta: 2,
            why: '実は多くの登壇者がやっている賢い依頼です。ただ、もう少し丁寧な頼み方だとなお良い。' },
          { text: 'Can you make my talk 5 minutes longer? I have many slides.', delta: -2,
            why: 'プログラム全体を管理する座長に、前夜に時間延長を求めるのは無理筋です。スライドを削りましょう。' }
        ]
      }
    ]
  },

  {
    day: 2,
    id: 'boss-bigshot', reward: { funds: 65, gems: 2 },
    title: '👑 分野の大御所',
    partner: 'Prof. Weiss — この分野を作った一人。あなたの発表を最前列で聞いていた',
    focus: ['confidence', 'english'],
    turns: [
      {
        situation: 'バンケットで、Prof. Weissがあなたを手招きしました。周囲が少し静かになります。\n\n> "Your talk today. The condensin story. I\'ve seen similar claims fail three times in thirty years. Why is yours different?"',
        limitSec: 15,
        choices: [
          { text: 'Because this time we can watch it happen — live imaging plus Hi-C on the same cells. The old claims relied on snapshots. May I show you one figure?', delta: 3, best: true,
            why: '歴史への敬意を保ちながら、**技術的に何が新しいか**を一文で示し、データで話す土俵に誘っています。' },
          { text: 'With all due respect, Professor, I have to say that most of those classic studies were quite poorly designed by modern standards. Ours is different.', delta: -2,
            why: 'その「失敗した研究」の著者や友人が目の前の人物かもしれません。過去を貶して自分を上げるのは危険です。' },
          { text: 'Maybe you are right. It might fail too...', delta: -1,
            why: '大御所の前で自分の研究を先に諦めてはいけません。謙虚と自信喪失は別物です。' },
          { text: 'Different? I don\'t understand the question.', delta: -2,
            why: '質問の意図(過去の失敗と何が違うのか)は明確です。聞き返すにしても形があります。' }
        ]
      },
      {
        situation: 'データの説明を聞いたProf. Weissは腕を組みました。\n\n> "Hmm. And if I told you the effect disappears in primary cells? We tried something similar last year. Unpublished."',
        limitSec: 15,
        choices: [
          { text: 'Then I\'d want to see your conditions — that difference itself could be the interesting result. Could we compare protocols after the meeting?', delta: 3, best: true,
            why: '矛盾するデータを**脅威ではなく共同研究の種**として扱っています。大御所が若手に求める反応そのものです。' },
          { text: 'That can\'t be true, honestly. We repeated the experiment many times, and our data is very, very solid. Something must be wrong on your side.', delta: -2,
            why: '見てもいないデータを否定するのは科学的態度ではありません。相手の観察を尊重しつつ議論しましょう。' },
          { text: 'Oh no... then our paper is in trouble...', delta: -1,
            why: '動揺を見せすぎです。矛盾データは日常です。落ち着いて条件の違いを探るのが研究者の仕事です。' },
          { text: 'Why didn\'t you publish it?', delta: 1,
            why: '悪くない質問ですが、やや詰問調に聞こえるリスクがあります。まず興味を示してから聞きましょう。' }
        ]
      },
      {
        situation: '> "You remind me of myself, long ago. Too confident, but the data was honest."\n\n空気が少し緩みました。ここでどう返しますか。',
        limitSec: 13,
        choices: [
          { text: 'I\'ll take that as a compliment — the second half, at least. What was your field like back then?', delta: 3, best: true,
            why: 'ユーモアで受けて、**相手の昔話への扉**を開きました。大御所の思い出話は最高の関係構築の時間です。' },
          { text: 'Thank you! I am very confident, yes!', delta: 0,
            why: '皮肉が半分入った言葉を全部褒め言葉として受け取ってしまいました。' },
          { text: 'I am very sorry if I seemed arrogant in my talk. That was really not my intention at all. Please forgive me if I offended anyone.', delta: 1,
            why: '謝る場面ではありません。相手は好意的に言っています。' },
          { text: '(何と返していいか分からず、笑ってごまかす)', delta: 0,
            why: '致命傷ではありませんが、会話が続く絶好の機会を逃しました。' }
        ]
      },
      {
        situation: '> "Send me that preprint. And — are you looking for collaborators, or do you prefer to work alone?"\n\n重要な瞬間です。',
        limitSec: 14,
        choices: [
          { text: 'We\'re a small lab, so good collaborators decide what we can do. Your primary cell data could be exactly the missing piece. I\'ll email you tonight.', delta: 3, best: true,
            why: '**相手のデータと自分の研究の接点**を明示して具体的に動く。共同研究はこの一言から始まります。' },
          { text: 'I prefer to work alone, actually.', delta: -1,
            why: '正直ですが、扉を閉める返答です。単独主義でも「この件では」と限定する言い方がありました。' },
          { text: 'Yes! Anything! I will do anything you say!', delta: 0,
            why: '熱意が従属に見えてしまいます。対等な協力者として振る舞う方が敬意を持たれます。' },
          { text: 'Collaborators? Well... let me think about it carefully after the conference, and maybe I will contact you someday when the timing is right. Thank you anyway.', delta: 1,
            why: '「いつか」は学会では「二度とない」とほぼ同義です。その場で次の一歩を決めましょう。' }
        ]
      },
      {
        situation: '別れ際、Prof. Weissは握手を求めながら最後の一言。\n\n> "One advice, young man. What matters more — being right, or being useful?"',
        limitSec: 13,
        choices: [
          { text: 'Useful, I hope — being right is temporary anyway. Half of what we believe now will be revised in twenty years.', delta: 3, best: true,
            why: '問いの意図(科学観を試している)を受け止め、**自分の言葉で科学観**を返しました。長く記憶に残る別れ方です。' },
          { text: 'Being right, of course. In the end, science is all about finding the truth, so being right is the most important thing, I believe.', delta: 1,
            why: '一つの立場ではありますが、問いの含み(独善への警告)を受け取れていません。' },
          { text: 'I don\'t know. What do you think?', delta: 1,
            why: '聞き返し自体は許されますが、まず自分の考えを短く述べてからの方が対等な対話になります。' },
          { text: 'Sorry, my English... one more time please?', delta: 0,
            why: '聞き返しは普段は正解ですが、これは内容ではなく考えを問う質問でした。単語は全て簡単です。' }
        ]
      }
    ]
  },

  {
    day: 3,
    id: 'boss-reviewer', reward: { funds: 80, gems: 3 },
    title: '👑 鋭いReviewer',
    partner: 'Dr. Sato — シンポジウム後の質疑で最前列に座る、有名な辛口レビュアー',
    timeMult: 0.75,
    focus: ['english', 'topic'],
    turns: [
      {
        situation: 'シンポジウム発表が終わり、質疑応答。最前列のDr. Satoがマイクを取りました。\n\n> "Interesting talk. But your key figure shows correlation, not causation. Why should I believe condensin drives this?"',
        limitSec: 15,
        choices: [
          { text: 'Fair point. That\'s why we added the degron experiment — acute depletion, and the loops collapse within an hour. Causation is as direct as we can make it.', delta: 3, best: true,
            why: '批判を認めてから**因果を示す実験**を提示。Reviewer対応の王道は「認める→根拠→限界」の順です。' },
          { text: 'Correlation is enough in this field. Everyone does it this way.', delta: -3,
            why: '「みんなやっている」は科学的擁護として最弱です。相手の批判を裏付けてしまいました。' },
          { text: 'Please read our supplementary materials.', delta: -1,
            why: '公開の場で「補足を読め」は突き放した印象に。要点をその場で一文で言えるべきです。' },
          { text: 'That is... um... a very good question. A really, really good question. Yes. Thank you so much for that question... um... where should I start... let me think...', delta: -1,
            why: '時間稼ぎだけで中身がありません。考える時間が欲しいときは質問を言い換えましょう。' }
        ]
      },
      {
        situation: '> "The degron, yes. But acute depletion has off-target effects on transcription. How do you separate the two?"\n\n追撃が来ました。会場が静まり返っています。',
        limitSec: 15,
        choices: [
          { text: 'We can\'t fully separate them — that\'s a real limitation. But the loop collapse precedes transcription changes by 30 minutes, which constrains the direction.', delta: 3, best: true,
            why: '**限界を認めた上で時系列という制約**を示す。完全な答えより、誠実で論理的な部分回答が信頼されます。' },
          { text: 'There are no off-target effects in our system.', delta: -2,
            why: '「全くない」という主張は反証一つで崩れます。断言は自分の首を絞めます。' },
          { text: 'That particular experiment was actually done by my collaborator in another lab, so unfortunately I cannot really answer the details myself. Sorry about that.', delta: -2,
            why: '発表者は発表内容の全てに責任を持ちます。共同研究者への責任転嫁は信頼を大きく損ないます。' },
          { text: 'We plan to address that in future work.', delta: 0,
            why: '定番の逃げ文句ですが、今答えられる部分(時系列)があるのに使うのはもったいない。' }
        ]
      },
      {
        situation: '> "Hmm. Last question — if your model is right, what result would prove you wrong? What would you accept as falsification?"',
        limitSec: 15,
        choices: [
          { text: 'If loops persist after depletion in primary cells, the model dies. In fact — someone in this room may already have that data, and I\'d love to see it.', delta: 3, best: true,
            why: '反証条件を即答できるのは、モデルを深く考えている証拠です。昨日の大御所の話への言及は会場も沸きます。' },
          { text: 'Nothing can prove it wrong. The data is very strong.', delta: -3,
            why: '反証不可能な主張は科学ではない、というのがこの質問の罠でした。最も悪い返答です。' },
          { text: 'That is a philosophical question...', delta: -1,
            why: '反証可能性は哲学ではなく実験計画の話です。はぐらかしと受け取られます。' },
          { text: 'Maybe if the loops... um... did something different from what we expect... then... hmm... that would probably be a problem for the model, I guess...?', delta: 0,
            why: '方向は合っていますが曖昧すぎます。反証条件は具体的な実験結果として言えるように。' }
        ]
      },
      {
        situation: '質疑終了後、Dr. Satoが演台まで来ました。\n\n> "Good answers. I was the reviewer who rejected your last paper, by the way. Twice."\n\nまさかの告白です。',
        limitSec: 14,
        choices: [
          { text: 'Ha! Then I owe you — the paper got much stronger after round two. The degron experiment exists because of your report.', delta: 3, best: true,
            why: '**恨みではなく感謝**で返す度量。厳しい査読で論文が良くなったのは事実で、相手もそれを知っています。' },
          { text: 'I knew it! I always suspected that it was you! Your comments were so unfair — do you know how many extra months of experiments we had to do?', delta: -3,
            why: '本音でも、ここで爆発させて得るものは何もありません。' },
          { text: '(気まずくなって目をそらす)', delta: -1,
            why: '相手はわざわざ名乗り出ています。これは和解と敬意の申し出で、受け取るべき場面です。' },
          { text: 'Oh... I see. OK.', delta: 0,
            why: '衝撃は分かりますが、相手の告白の意図(対話の申し出)に応えられていません。' }
        ]
      },
      {
        situation: '> "Submit the new story to us. I can\'t promise anything — but I\'ll read it seriously. Fair?"\n\n最後の返答です。',
        limitSec: 12,
        choices: [
          { text: 'Fair. You\'ll have it within a month — and this time, I\'m looking forward to your report.', delta: 3, best: true,
            why: '期限を切って約束し、**最恐の査読者を味方**に変えました。学会でしか起こらない最高の結末です。' },
          { text: 'Only if you promise to accept it this time.', delta: -1,
            why: '冗談でも、査読の独立性を軽んじる発言はこの相手には響きません。' },
          { text: 'I will think very carefully about which journal would be the best fit for our story this time around.', delta: 1,
            why: '慎重さは正当ですが、せっかくの申し出への熱量としては少し冷たく響きます。' },
          { text: 'Thank you thank you thank you!!', delta: 1,
            why: '感謝は伝わりますが、対等な研究者としての締めの一言が欲しい場面でした。' }
        ]
      }
    ]
  },

  /* ===================================================================
   * v1.33.0 追加分 — 応用寄りの学会(ISSY39)と、大学院生中心のセミナー
   * (Chung-Ang大シンポジウム)で実際に起きる「山場」を想定したボス。
   * 名前は役どころ。他の学会でもそのまま使える形にしてある。
   * =================================================================== */
  {
    day: 1,
    id: 'boss-industry', reward: { funds: 60, gems: 2 },
    title: '👑 発酵メーカーの研究部長',
    partner: 'Dr. Park — 大手食品メーカーの研究部長。学会のスポンサーでもある',
    focus: ['topic', 'confidence'],
    turns: [
      {
        situation: '休憩時間。企業ブースの前を通りかかると、研究部長が声をかけてきました。\n\n> "You were the genome folding talk, right? I confess I understood maybe half."',
        limitSec: 13,
        choices: [
          { text: 'Half is more than I expected, honestly. The one-sentence version: chromosomes fold at three scales, and a different protein builds each one. Which half did I lose you on?', delta: 3, best: true,
            why: '**一文に圧縮してから、どこで失ったかを聞き返して**います。応用の聴衆に対して最初にすべきことは、要約と質問です。' },
          { text: 'That is normal. It is a very specialized field.', delta: -2,
            why: '相手の理解不足として片づけています。分からなかったのは話し手の設計の問題です。' },
          { text: 'Sorry. I will send you my paper, it explains everything in detail.', delta: 0,
            why: '論文は読まれません。目の前にいるうちに、口で言えることを言いましょう。' },
          { text: 'Which half? The first half is the important one, the second half is just controls anyway.', delta: -1,
            why: '自分の対照実験を「どうでもいい部分」と言ってしまいました。企業の人ほど対照を重視します。' }
        ]
      },
      {
        situation: '> "Here is my real question. We have a production strain that suddenly drops yield above 34 degrees. Could your method tell us why?"',
        limitSec: 15,
        choices: [
          { text: 'It could tell you whether the genome reorganizes at that temperature — that\'s a real observation, not an explanation. If it does, that narrows down where to look next.', delta: 3, best: true,
            why: '**できることとできないことを正確に線引き**しています。「観察はできるが原因は言えない」と言える人は、企業から最も信頼されます。' },
          { text: 'Yes. We could solve that for you.', delta: -2,
            why: '安請け合いです。相手は何年もこの問題を抱えており、簡単に解けるとは思っていません。' },
          { text: 'No, our method is only for basic research questions.', delta: -1,
            why: '実際には測れる問いです。可能性を自分で閉じてしまいました。' },
          { text: 'That sounds like a heat shock response problem. You should look at the chaperones first.', delta: 1,
            why: '妥当な助言ですが、相手はすでに試している可能性が高い。まず自分の手法で何が見えるかを答える場面です。' }
        ]
      },
      {
        situation: '> "We could fund a small joint project. But our lawyers will want the data to stay confidential for three years."\n\n公開データを前提に研究してきたあなたには、重い条件です。',
        limitSec: 15,
        choices: [
          { text: 'Three years is long for a student\'s thesis. Could we split it — your strain data confidential, and the method itself published? That way both sides get what they need.', delta: 3, best: true,
            why: '**分割して両立させる案**を出しています。断らず、丸呑みもせず、条件を設計し直すのが交渉です。' },
          { text: 'No problem at all. Three years is fine.', delta: 0,
            why: 'その場では喜ばれますが、学生の学位や自分の業績に直接響きます。持ち帰るべき条件です。' },
          { text: 'Sorry, I only work with open data. I cannot accept that.', delta: -2,
            why: '原則は立派ですが、交渉の余地を探る前に打ち切っています。' },
          { text: 'I need to ask my university\'s office before I can say anything about contracts. Let me get back to you.', delta: 2,
            why: '正しい手続きです。ただ、その場で方向性だけでも示せると、話が前に進みます。' }
        ]
      },
      {
        situation: '> "Last thing — our CEO reads one page before any decision. Could you write it? In plain language."',
        limitSec: 14,
        choices: [
          { text: 'I can. Let me write it as: the question, what we would measure, what a positive result would look like, and what it would cost. Send me your format if you have one.', delta: 3, best: true,
            why: '**中身の構成をその場で示し、相手の型を尋ねて**います。一枚紙を書けることは、基礎研究者の大きな武器です。' },
          { text: 'Of course. I will send you the introduction of my latest paper.', delta: -2,
            why: '論文の緒言は経営者向けの文章ではありません。相手の読者を想像していません。' },
          { text: 'Writing for non-scientists is difficult for me. Could someone in your company write it instead?', delta: -1,
            why: '自分の研究を説明する仕事を人任せにすると、意図が必ずずれます。' },
          { text: 'Yes, I will send something next month.', delta: 1,
            why: '引き受けたのは良いのですが、中身も期限もぼんやりしています。熱は冷めます。' }
        ]
      }
    ]
  },

  {
    day: 2,
    id: 'boss-organizer', reward: { funds: 70, gems: 3 },
    title: '👑 学会の実行委員長',
    partner: 'Prof. Kang — 今回の学会を自国に招致した張本人。忙しい合間にあなたを探しに来た',
    focus: ['network', 'confidence'],
    turns: [
      {
        situation: 'レセプション会場。あなたを招待した実行委員長が、人混みをかき分けて近づいてきました。\n\n> "You made it! Was the journey all right? I worried about your connection."',
        limitSec: 12,
        choices: [
          { text: 'Everything went smoothly, thank you — and the airport pickup you arranged made it easy. I know how much work this week must be for you.', delta: 3, best: true,
            why: '無事の報告に加え、**相手の手配と負担に触れて**います。主催者がいちばん言われたい一言です。' },
          { text: 'It was fine. (そのまま沈黙)', delta: 0,
            why: '嘘はありませんが、探しに来てくれた相手にはそっけない返しです。' },
          { text: 'Actually the flight was delayed, the hotel check-in was slow, and my room is very far from the venue.', delta: -2,
            why: '会った瞬間に不満を並べると、以後あなたは「手のかかる招待者」として記憶されます。' },
          { text: 'Yes. By the way, can I change my presentation slot to the afternoon?', delta: -3,
            why: '挨拶を飛ばして要求から入っています。プログラムは何ヶ月もかけて組まれています。' }
        ]
      },
      {
        situation: '> "Your session is the only basic-science block this year. Some of the committee thought it was too far from the theme."\n\n自分の枠の存在意義を、遠回しに問われています。',
        limitSec: 15,
        choices: [
          { text: 'Then let me earn the slot — I\'ll frame it as a principle that applies to any genome, not a fission yeast detail. If people leave with one sentence, that\'s the win.', delta: 3, best: true,
            why: '**批判を引き受けたうえで、具体的な設計方針**を返しています。委員長がほしかったのは反論ではなく、この保証です。' },
          { text: 'Basic science is the foundation of everything. The committee should understand that.', delta: -2,
            why: '正論で押し返しても、委員長を味方から敵に変えるだけです。' },
          { text: 'Should I change my talk? I can make it more applied if you want.', delta: 1,
            why: '柔軟さは良いのですが、招待されたのはあなたの研究です。軸は変えず、語り方を変えましょう。' },
          { text: 'I understand. I will keep it short so the applied talks have more time.', delta: 0,
            why: '譲りすぎです。枠を短くすることは、セッションの価値を自分で下げることになります。' }
        ]
      },
      {
        situation: '> "We are putting together a thematic issue from this meeting. Each session contributes one or two papers. Would you write something?"',
        limitSec: 14,
        choices: [
          { text: 'I\'d be glad to. A short review on how the three folding tiers are built would fit — when is the deadline, and how long?', delta: 3, best: true,
            why: '**中身の案・締切・分量**を一度に確認しています。編集する側にとって、いちばん扱いやすい返事です。' },
          { text: 'Yes, of course! I will write anything you need.', delta: 1,
            why: '前向きですが、何をいつまでに書くかが決まりません。あとで双方が困ります。' },
          { text: 'I am quite busy this year. Maybe someone else in my field would be better.', delta: -1,
            why: '断るのも選択ですが、招待講演者の寄稿はセッションの記録そのものです。断るなら代案を添えて。' },
          { text: 'Is it indexed? What is the impact factor?', delta: -3,
            why: '招致した本人の前で雑誌の格を値踏みするのは、最も失礼な反応のひとつです。' }
        ]
      },
      {
        situation: '> "One favor. A speaker cancelled tomorrow morning. Could you chair that session instead? It is not your field."',
        limitSec: 14,
        choices: [
          { text: 'Happy to help. I don\'t know the field, so I\'ll keep time strictly and ask one general question if the room is quiet — is that what you need?', delta: 3, best: true,
            why: '**自分にできる範囲を明示して引き受けて**います。分野外の座長に求められるのは、専門性ではなく進行です。' },
          { text: 'I would like to help, but I know nothing about that field. Sorry.', delta: 0,
            why: '誠実ですが、座長の仕事の大半は時間管理です。断る理由としては弱いところ。' },
          { text: 'Sure, no problem! I will prepare deep questions for every speaker tonight.', delta: 1,
            why: '意気込みは立派ですが、前夜に分野外を詰め込むより、進行に集中するほうが全員のためです。' },
          { text: 'Only if my own talk can be moved to a better time slot.', delta: -3,
            why: '困っている主催者に条件を突きつけています。この一言は長く記憶されます。' }
        ]
      }
    ]
  },

  {
    day: 3,
    id: 'boss-students', reward: { funds: 60, gems: 2 },
    title: '👑 大学院生の最前列',
    partner: '招待先の大学院生たち — 英語での質疑に慣れておらず、最初は誰も手を挙げない',
    focus: ['english', 'network'],
    turns: [
      {
        situation: '大学でのセミナーが終わりました。30人の大学院生。司会が質問を促しても、誰も手を挙げません。沈黙が10秒続きます。',
        limitSec: 13,
        choices: [
          { text: 'Let me start with a question for you instead — how many of you have used Hi-C data? …Two hands. OK, then let me explain what the axes mean.', delta: 3, best: true,
            why: '**自分から質問して、手を挙げる敷居を下げて**います。沈黙を破るのは聴衆ではなく演者の仕事です。' },
          { text: 'No questions? All right, thank you very much. (終了する)', delta: -1,
            why: '楽ですが、学生は聞きたいことを抱えたまま帰ります。この15秒が一日の価値を決めます。' },
          { text: 'Come on, somebody must have a question. Anyone? Really? Nobody?', delta: -2,
            why: '急かすほど手は挙がりません。プレッシャーは沈黙を固くします。' },
          { text: 'In Japan students are also quiet, so I understand. (笑って待つ)', delta: 1,
            why: '場は和みますが、まだ質問は出ません。次の一手が必要です。' }
        ]
      },
      {
        situation: '一人が勇気を出して質問しました。ところが緊張で英語が崩れ、内容が半分しか分かりません。',
        limitSec: 14,
        choices: [
          { text: 'Let me make sure I got it — you\'re asking whether the domains change when the cell is stressed? (学生がうなずく) Great question, and yes —', delta: 3, best: true,
            why: '**聞き取れた部分から言い換えて確認**しています。学生は「通じた」と感じ、会場の他の学生も続きやすくなります。' },
          { text: 'Sorry, I could not understand. Could you repeat the whole question?', delta: 0,
            why: '誠実ですが、繰り返すほど緊張は増します。こちらから半分を補いましょう。' },
          { text: 'Yes, exactly. Good question. (分からないまま一般論を話す)', delta: -3,
            why: '分かったふりは最悪です。的外れな回答は、勇気を出した学生を傷つけます。' },
          { text: 'Your English is very good! Don\'t worry. Now, what was the question again?', delta: -1,
            why: '善意でも、英語そのものに言及されると学生はかえって萎縮します。中身に反応しましょう。' }
        ]
      },
      {
        situation: '質疑が終わり、数人の学生が前に集まってきました。\n\n> "How did you decide to go abroad for your postdoc? I am scared to apply."',
        limitSec: 15,
        choices: [
          { text: 'I was scared too — I wrote to five labs and four never replied. The one that did changed my career. The reply rate is low for everyone, not just you.', delta: 3, best: true,
            why: '**自分の失敗を具体的な数字で**共有しています。成功談より、うまくいかなかった回数のほうが学生を動かします。' },
          { text: 'Just apply everywhere. If you work hard, it will work out.', delta: 0,
            why: '励ましですが、中身がありません。学生が知りたいのは実際の手順です。' },
          { text: 'Honestly, the job market is terrible now. Think carefully before leaving a stable position.', delta: -2,
            why: '現実を伝えるのは大切ですが、相談してきた学生への最初の一言としては重すぎます。' },
          { text: 'It was easy for me because my supervisor arranged everything.', delta: -1,
            why: '事実だとしても、参考にならないうえに距離を作ります。' }
        ]
      },
      {
        situation: '最後に一人の学生が、あなたの解析結果に対する反論を持ってきました。指摘はかなり的を射ています。',
        limitSec: 15,
        choices: [
          { text: 'You\'re right, and honestly that\'s the weakest part of the analysis. Could you send me your reasoning by email? I\'d like to test it properly.', delta: 3, best: true,
            why: '**学生の指摘を対等に受け止め、次につないで**います。これができる演者は、その研究室で長く語り継がれます。' },
          { text: 'That is a good point, but we already considered it. (詳細は説明しない)', delta: -1,
            why: '検討済みなら中身を説明すべきです。説明のない却下は、学生を黙らせるだけになります。' },
          { text: 'Well, when you have published a few papers yourself, you will see why we did it this way.', delta: -3,
            why: '経歴を盾にした反論です。指摘の正しさは経歴では決まりません。' },
          { text: 'Interesting! Let me think about it. Thank you. (そのまま会場を出る)', delta: 1,
            why: '悪くはありませんが、せっかくの鋭い指摘を持ち帰る形にできていません。' }
        ]
      }
    ]
  }
];


/* 1日を「午前のプログラム」「午後のプログラム」の2部に分けた。
 * 1部 = 1マップ = 8マスなので、午前だけで切り上げても1回の遊びとして完結する。 */
const SESSION_INFO = [
  { n: 1, icon: '🌅', name: '午前のプログラム',
    intro: '受付を済ませ、午前のセッションが始まる。' },
  { n: 2, icon: '🌇', name: '午後のプログラム',
    intro: '昼食をとって一息ついた。午後は人が増え、話す機会も増える。' }
];

/* 撃破したボスの記録(ランをまたいで残る)。
 * 1ラン1日制になり1体しか戦えないので、まだ倒していない相手が優先で出るようにする。 */
const BossLog = {
  KEY: 'lq_boss_beaten',
  list() {
    try {
      const v = JSON.parse(localStorage.getItem(this.KEY) || '[]');
      return Array.isArray(v) ? v : [];
    } catch (_) { return []; }
  },
  add(id) {
    const l = this.list();
    if (l.indexOf(id) < 0) {
      l.push(id);
      localStorage.setItem(this.KEY, JSON.stringify(l));
    }
  },
  allBeaten() {
    const l = this.list();
    return BOSSES.every((b) => l.indexOf(b.id) >= 0);
  }
};
