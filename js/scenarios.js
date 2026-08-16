/* ConfQuest - 会話トレーニングのシナリオデータ(懇親会・レセプション編)
 *
 * delta: 好感度の変化 (-3 〜 +3)
 * why:   なぜ良い/悪いかの解説(日本語)
 * tag:   身につく力 (network / english / confidence / topic)
 */
'use strict';

const SCENARIOS = [
  {
    id: 'first-contact',
    title: '初対面の研究者に話しかける',
    icon: '🥂',
    level: 1,
    setting: 'ISSY39のウェルカムレセプション。あなたは招待講演者です。午後のセッションで見かけた研究者が、ドリンク片手に一人で立っています。',
    partner: { name: 'Dr. Park', desc: '韓国の大学の准教授。クロマチン分野。' },
    focus: ['network', 'confidence'],
    turns: [
      {
        situation: '目が合いました。相手も少し手持ち無沙汰な様子です。最初の一言は?',
        limitSec: 14,
        choices: [
          {
            text: 'Hi, I saw you in the afternoon session. I\'m Hideki, from Japan.',
            delta: 3, best: true,
            why: '最良。**共有した経験**(同じセッション)を起点にすると、初対面でも自然に始まります。名前と所属を短く添えるのも親切です。'
          },
          {
            text: 'Hello. Nice weather today, isn\'t it?',
            delta: 0,
            why: '無難ですが、学会という共通の話題があるのに天気を選ぶのはもったいない。会話が続きにくくなります。'
          },
          {
            text: 'Hello. Excuse me. What is your research topic? Please tell me about your research topic in detail.',
            delta: 1,
            why: '悪くはありませんが、いきなり本題だと面接のような印象に。まず自己紹介を挟むと柔らかくなります。'
          },
          {
            text: '(会釈だけして、飲み物を取りに行く)',
            delta: -2,
            why: '目が合った瞬間は最も話しかけやすいタイミングです。ここを逃すと、後から声をかけるハードルが上がります。'
          }
        ]
      },
      {
        situation: 'Dr. Parkが答えました。\n\n> "Oh yes, your talk was very interesting. I work on chromatin remodeling in plants."\n\n次の一手は?',
        limitSec: 14,
        choices: [
          {
            text: 'Plants! That\'s interesting — is the compartment structure similar to what we see in animal cells?',
            delta: 3, best: true,
            why: '最良。相手の分野に**具体的な興味**を示しつつ、自分の知識ともつなげています。相手が語りやすい問いです。'
          },
          {
            text: 'Thank you. Actually, in my lab we also found something similar last year — let me explain our data first...',
            delta: -1,
            why: '相手が自分の話を始めた直後に話題を自分に引き戻すと、「聞いてくれない人」という印象になります。**自分の話は一往復待つ**のが基本です。'
          },
          {
            text: 'I see. That sounds difficult.',
            delta: 0,
            why: '会話が止まります。相槌だけでは相手が次に何を話せばいいか分からなくなります。'
          },
          {
            text: 'Plants? I don\'t know much about plants.',
            delta: -1,
            why: '正直ですが、会話を閉じてしまいます。知らないことは「だから聞きたい」という形にすると前に進みます。'
          }
        ]
      },
      {
        situation: '会話が弾んできました。Dr. Parkが聞いてきます。\n\n> "Is this your first time in Korea?"',
        limitSec: 12,
        choices: [
          {
            text: 'Yes, first time! I arrived yesterday. Any place you\'d recommend near here?',
            delta: 3, best: true,
            why: '最良。答えるだけでなく**質問を返して**います。しかも相手が答えやすく、話が広がる質問です。'
          },
          {
            text: 'Yes, it is.',
            delta: -1,
            why: '会話のキャッチボールが止まります。Yes/Noで終わる答えには、必ず一言足すか質問を返しましょう。'
          },
          {
            text: 'Yes. I\'ve been studying Korean a little. 안녕하세요!',
            delta: 3,
            why: '相手の言語で一言添えるのは非常に効果的です。発音が完璧でなくても、努力そのものが好意的に受け取られます。'
          },
          {
            text: 'No, I came here for a conference three years ago, but I only saw the hotel.',
            delta: 2,
            why: '正直で、少しユーモアもあります。研究者あるあるとして共感を得やすい返しです。'
          }
        ]
      },
      {
        situation: '10分ほど話しました。相手の同僚が近づいてきて、話しかけたそうにしています。どう締めますか?',
        limitSec: 12,
        choices: [
          {
            text: 'I should let you catch up with your colleague. It was great talking with you — I\'d love to continue tomorrow.',
            delta: 3, best: true,
            why: '最良。**相手の状況を察して**自分から切り上げつつ、次につなげています。良い引き際は良い第一印象と同じくらい重要です。'
          },
          {
            text: '(気づかないふりをして話し続ける)',
            delta: -3,
            why: '相手を板挟みにしてしまいます。周囲の動きに気づけるかどうかは、懇親会では会話の中身と同じくらい大事です。'
          },
          {
            text: 'OK, bye.',
            delta: -1,
            why: '唐突すぎて、話がつまらなかったのかと思われかねません。締めの一言があるだけで印象が変わります。'
          },
          {
            text: 'It was so nice to meet you. Can I have your email address? I want to send you all of my papers and preprints tonight.',
            delta: 0,
            why: '連絡先を交換すること自体は良いのですが、いきなり論文を送る前提だと押しが強い印象に。まず「また話したい」と伝える方が自然です。'
          }
        ]
      }
    ]
  },

  {
    id: 'keep-it-going',
    title: '会話が途切れたときの立て直し',
    icon: '💬',
    level: 2,
    setting: 'ビュッフェの前。話していた相手との会話が一段落し、少し沈黙が流れています。',
    partner: { name: 'Dr. Lee', desc: '同世代の研究者。少し寡黙。' },
    focus: ['topic', 'confidence'],
    turns: [
      {
        situation: '3秒ほどの沈黙。相手も何か言おうか迷っている様子です。',
        limitSec: 10,
        choices: [
          {
            text: 'By the way, have you tried this? I have no idea what it is, but it\'s good.',
            delta: 3, best: true,
            why: '最良。**目の前にあるもの**を話題にするのは、沈黙を破る最も簡単で自然な方法です。少しのユーモアも効いています。'
          },
          {
            text: '(スマートフォンを取り出して確認する)',
            delta: -3,
            why: '会話終了の合図と受け取られます。懇親会でスマホを見るのは、最も避けたい行動のひとつです。'
          },
          {
            text: 'So... yes. Interesting conference.',
            delta: 0,
            why: '間は埋まりますが、中身がないので次の沈黙がすぐ来ます。'
          },
          {
            text: 'By the way, what did you think about the keynote presentation this morning? I heard mixed opinions about it.',
            delta: 2,
            why: '共通体験に戻る良い方法です。ただし相手が朝のセッションにいなかった可能性もあるので、少し確認を挟むとより安全です。'
          }
        ]
      },
      {
        situation: 'Dr. Leeが答えました。\n\n> "Yeah... it was okay."\n\n反応が薄いです。',
        limitSec: 12,
        choices: [
          {
            text: 'Just okay? I felt the last part was a bit rushed. What did you think was missing?',
            delta: 3, best: true,
            why: '最良。**相手の言葉を拾って**掘り下げています。自分の意見を先に少し出すと、相手も本音を言いやすくなります。'
          },
          {
            text: 'I see. So, where are you from?',
            delta: 0,
            why: '話題を変えるのは選択肢ですが、毎回変えていると表面的な会話に終始します。一度は掘り下げてみましょう。'
          },
          {
            text: 'Really? I thought it was excellent! Especially the imaging part — that was beautiful, was it not?',
            delta: 1,
            why: '意見が違うこと自体は良いのですが、否定から入ると相手が萎縮します。「どこが気になった?」と聞く方が会話が続きます。'
          },
          {
            text: '(うなずいて、また沈黙を待つ)',
            delta: -2,
            why: '寡黙な相手の場合、こちらが動かないと会話は止まったままになります。'
          }
        ]
      },
      {
        situation: '相手が少し話し始めました。あなたはその分野に詳しくありません。',
        limitSec: 12,
        choices: [
          {
            text: 'I don\'t work on that, so this might be a naive question — why is that hard to measure?',
            delta: 3, best: true,
            why: '最良。**知らないことを認めた上で質問する**のは、研究者同士では非常に好まれます。相手も説明しやすくなります。'
          },
          {
            text: 'Yes, yes, I know exactly what you mean. We have exactly the same problem in our lab too, actually.',
            delta: -2,
            why: '知ったかぶりは高い確率で見抜かれます。次の質問で答えられず気まずくなるリスクもあります。'
          },
          {
            text: 'Hmm, that\'s complicated.',
            delta: 0,
            why: '会話が止まります。分からないなら質問に変えましょう。'
          },
          {
            text: 'Sorry, I\'m not familiar with that field.',
            delta: 1,
            why: '正直なのは良いのですが、そこで止まると相手は話題を変えざるを得ません。「だから教えて」まで言い切りましょう。'
          }
        ]
      },
      {
        situation: '会話が温まってきました。相手が明日のあなたの予定を聞いてきました。',
        limitSec: 12,
        choices: [
          {
            text: 'I\'m free after 3 pm. Would you like to grab a coffee and continue this?',
            delta: 3, best: true,
            why: '最良。**具体的な提案**にすると実現します。「またいつか」で終わる関係との分かれ道です。'
          },
          {
            text: 'Nothing special. Maybe I\'ll just rest.',
            delta: 0,
            why: '相手はおそらく誘おうとしていました。せっかくの機会を逃しています。'
          },
          {
            text: 'I do have some plans in the evening, but I could probably change them around if it is really necessary.',
            delta: 1,
            why: '前向きですが曖昧です。相手に判断を委ねると、結局流れてしまうことが多いです。'
          },
          {
            text: 'Why do you ask?',
            delta: -2,
            why: '警戒しているように聞こえます。好意的な誘いを拒む形になりかねません。'
          }
        ]
      }
    ]
  },

  {
    id: 'talk-about-yourself',
    title: '自分の研究をいつ、どう出すか',
    icon: '🔬',
    level: 2,
    setting: '立食のテーブル。相手はあなたの研究をまだ知りません。うまく伝われば共同研究の可能性もあります。',
    partner: { name: 'Prof. Choi', desc: 'シニアの研究者。分野は近いが専門は違う。' },
    focus: ['english', 'network'],
    turns: [
      {
        situation: '> "So, what do you work on?"\n\n定番の質問が来ました。',
        limitSec: 14,
        choices: [
          {
            text: 'I study how chromosomes are folded inside the nucleus, and how that changes when cells stop dividing.',
            delta: 3, best: true,
            why: '最良。**専門用語なしの一文**で全体像を伝えています。相手が興味を持てば、そこから深掘りできます。'
          },
          {
            text: 'I work on Hi-C analysis of condensin-mediated long-range interactions during senescence in S. pombe.',
            delta: 0,
            why: '正確ですが、専門が少し違う相手には情報密度が高すぎます。最初の一文は**中学生にも分かる粒度**が理想です。'
          },
          {
            text: 'Chromatin. It\'s complicated.',
            delta: -1,
            why: '謙遜のつもりでも、話す気がないと受け取られます。相手は興味を持って聞いてくれています。'
          },
          {
            text: 'Well, it depends. What is your background? Then I can explain properly.',
            delta: 2,
            why: '相手に合わせる姿勢は良いのですが、いきなり聞き返されると身構えられます。まず一言で答えてから調整しましょう。'
          }
        ]
      },
      {
        situation: '> "Interesting. Why does it matter if chromosomes are folded differently?"\n\n核心を突く質問です。',
        limitSec: 14,
        choices: [
          {
            text: 'Because the folding decides which genes can be switched on. In aging cells, that switching goes wrong.',
            delta: 3, best: true,
            why: '最良。**なぜ重要か**を、身近な言葉と結果に結びつけて説明しています。相手が次を聞きたくなる答えです。'
          },
          {
            text: 'That\'s a very good question. Actually, it\'s still quite controversial in the field, and researchers disagree a lot.',
            delta: 1,
            why: '誠実ですが、聞き手は「で、あなたはどう考えるのか」を知りたいはずです。議論を紹介した後に自分の立場も述べましょう。'
          },
          {
            text: 'Because TADs and compartments regulate enhancer-promoter contacts.',
            delta: 1,
            why: '正しいですが、また専門用語に戻っています。相手の質問は「素人にも分かる意義」を求めていました。'
          },
          {
            text: 'Honestly, we don\'t know yet.',
            delta: -1,
            why: '謙虚さは美徳ですが、これだけでは自分の研究の価値を自ら下げてしまいます。分かっていることから話しましょう。'
          }
        ]
      },
      {
        situation: '相手が興味を示しています。\n\n> "We have a similar problem in our system. Maybe we should talk more."',
        limitSec: 12,
        choices: [
          {
            text: 'I\'d like that. Do you have data on that already, or is it still an idea?',
            delta: 3, best: true,
            why: '最良。前向きに応じつつ、**具体的な次の一歩**を探っています。共同研究はここから始まります。'
          },
          {
            text: 'Yes, that would be nice. (それ以上言わない)',
            delta: 0,
            why: '社交辞令で終わってしまいます。相手は具体的な話をする準備がありました。'
          },
          {
            text: 'Sure, of course! I can send you all of our raw data and all of our protocols tonight if you want them.',
            delta: 1,
            why: '積極的なのは良いのですが、話す前にデータを渡す約束をするのは早すぎます。まず内容をすり合わせましょう。'
          },
          {
            text: 'Actually, our approach might be too different from yours.',
            delta: -2,
            why: '相手の申し出を自分から閉じています。違いこそが共同研究の理由になり得ます。'
          }
        ]
      },
      {
        situation: '別れ際です。連絡先を交換したい。',
        limitSec: 12,
        choices: [
          {
            text: 'Let me give you my card. I\'ll email you next week with a short summary of what we discussed.',
            delta: 3, best: true,
            why: '最良。**自分から動く約束**をしています。学会後に実際に連絡が来る人は多くありません。ここで差がつきます。'
          },
          {
            text: 'Please email me if you\'re interested.',
            delta: 0,
            why: '相手にボールを渡すと、忙しさに紛れて流れます。自分から送る方が確実です。'
          },
          {
            text: 'Well, we can probably find each other on ResearchGate or Google Scholar somehow, so it should be fine.',
            delta: 1,
            why: '悪くありませんが、その場で確実に残す方法(名刺・メール)の方が確実です。'
          },
          {
            text: '(何も言わずに別れる)',
            delta: -3,
            why: '良い会話も、連絡手段がなければ次につながりません。'
          }
        ]
      }
    ]
  },

  {
    id: 'small-talk-korea',
    title: '研究以外の雑談を広げる',
    icon: '🇰🇷',
    level: 3,
    setting: '懇親会の後半。研究の話は一段落し、リラックスした雰囲気です。ここで人としての距離が縮まります。',
    partner: { name: 'Dr. Park', desc: '先ほど話した研究者。打ち解けてきた。' },
    focus: ['topic', 'network'],
    turns: [
      {
        situation: '研究の話が一段落しました。話題を変えるなら?',
        limitSec: 12,
        choices: [
          {
            text: 'I have two more days here. I want to eat something I can\'t get in Japan — what would you pick?',
            delta: 3, best: true,
            why: '最良。**相手が専門家になれる話題**(地元のこと)を選び、しかも自分の状況を添えています。誰でも答えたくなる質問です。'
          },
          {
            text: 'Do you have children?',
            delta: 0,
            why: '初対面に近い関係では、家族構成は踏み込みすぎることがあります。相手から話し始めるのを待つ方が安全です。'
          },
          {
            text: 'How much do professors earn in Korea?',
            delta: -3,
            why: '収入・政治・宗教は、国際的な場では避けるのが基本です。関係が浅い段階では特に危険です。'
          },
          {
            text: 'By the way, honestly, what do you think about the political situation in this country these days?',
            delta: -2,
            why: '同様に避けるべき話題です。相手の立場が分からない状態で持ち出すと、気まずくなるリスクが高いです。'
          }
        ]
      },
      {
        situation: '> "You should try 감자탕 — pork bone soup. But it\'s a bit spicy for most Japanese people."',
        limitSec: 12,
        choices: [
          {
            text: 'I like spicy food, but I might regret saying that. How spicy are we talking?',
            delta: 3, best: true,
            why: '最良。**自分を少し落として笑いを作り**、さらに質問を返しています。会話が明るく続きます。'
          },
          {
            text: 'Actually, you know, Japanese people can eat spicy food too. Please do not underestimate us like that.',
            delta: -1,
            why: '軽い一般化に真面目に反論すると、場の空気が固くなります。冗談には冗談で返すのが安全です。'
          },
          {
            text: 'OK. I will try it.',
            delta: 0,
            why: '会話が終わってしまいます。相手はもう少し話したがっています。'
          },
          {
            text: 'How do you write that? Could you show me on your phone?',
            delta: 2,
            why: '学ぶ姿勢は好感を持たれます。ハングルに興味を示すのは効果的です。'
          }
        ]
      },
      {
        situation: '打ち解けてきました。相手が日本について聞いてきます。\n\n> "I want to visit Japan next year. Where should I go?"',
        limitSec: 12,
        choices: [
          {
            text: 'Depends on what you like — temples, food, or nature? If you come for a conference, I can show you around.',
            delta: 3, best: true,
            why: '最良。相手の好みを確認しつつ、**次に会う理由**まで作っています。関係が学会限りで終わりません。'
          },
          {
            text: 'Kyoto. Everyone likes Kyoto.',
            delta: 1,
            why: '間違いではありませんが、会話としては平坦です。一言足すだけで印象が変わります。'
          },
          {
            text: 'Japan has many nice places.',
            delta: 0,
            why: '中身がなく、相手は次に何を言えばいいか困ります。'
          },
          {
            text: 'Honestly, Japan is quite expensive now because of the exchange rate, so maybe it is not the best time to visit.',
            delta: -1,
            why: '相手の前向きな話を否定から受けています。まず歓迎の姿勢を示しましょう。'
          }
        ]
      },
      {
        situation: '懇親会が終わりに近づいています。明後日、あなたはこの人の同僚の車で2時間かけて大学へ向かいます。',
        limitSec: 14,
        choices: [
          {
            text: 'By the way, I\'m visiting Prof. Kim\'s lab on Thursday. Do you know him well?',
            delta: 3, best: true,
            why: '最良。**次の予定につながる情報**を集めています。車中2時間の会話の準備として非常に有効です。'
          },
          {
            text: 'Thank you very much for tonight — it was really fun. See you tomorrow at the venue, same time as today.',
            delta: 2,
            why: '丁寧で良い締めです。ただ、もう一歩踏み込む余地がありました。'
          },
          {
            text: 'I\'m tired. Good night.',
            delta: 0,
            why: '正直ですが、最後の印象としては弱いです。'
          },
          {
            text: '(挨拶せずに退出する)',
            delta: -3,
            why: '最後の挨拶は、次に会ったときの入りやすさを決めます。'
          }
        ]
      }
    ]
  }
];

/** 好感度から評価ランクを返す */
function affinityRank(score) {
  if (score >= 90) return { rank: 'S', label: '意気投合', color: 'var(--success)' };
  if (score >= 75) return { rank: 'A', label: '好印象', color: 'var(--success)' };
  if (score >= 60) return { rank: 'B', label: '悪くない', color: 'var(--accent)' };
  if (score >= 45) return { rank: 'C', label: '普通', color: 'var(--warn)' };
  return { rank: 'D', label: '気まずい', color: 'var(--danger)' };
}

/* ============================================================
 * 🚗 雑談シナリオ(Phase B)— docs/smalltalk-design.md
 * 実在の予定(ISSY39翌日の送迎・懇親会・Chung-Ang Dinner)に基づく実戦練習。
 * 会話トレーニング一覧の専用セクションに表示される。
 * ※学会攻略のエリート戦の抽選(SCENARIOS)には混ぜないこと。
 * ============================================================ */
const SMALLTALK_SCENARIOS = [
  {
    id: 'drive-seoul',
    title: '🚗 ソウルからの2時間',
    icon: '🚗',
    level: 3,
    setting: 'ISSY39翌朝。Koreana Hotelの前にKyoung-Dongの車が着きました。これからChung-Ang Universityまで約2時間のドライブ。車にはClaireと、初対面のDr. Son(ISSY39参加者)も同乗します。',
    partner: { name: 'Kyoung-Dong', desc: 'Wistar時代の元同僚。気さくな旧友。運転中。' },
    focus: ['network', 'topic'],
    turns: [
      {
        situation: 'ホテルの車寄せ。Kyoung-Dongが車から降りて手を振っています。**再会の第一声**は?',
        limitSec: 15,
        choices: [
          { text: 'Kyoung-Dong! Great to see you — thank you so much for driving all this way to pick us up.',
            delta: 3, best: true,
            why: '再会の喜び+**送迎への感謝**を最初に。ソウルまで迎えに来るのは大きな手間です。ここで感謝を言葉にすると、2時間の空気が決まります。' },
          { text: 'Hello, Professor Kim. I am honored to see you again. Thank you for your kind invitation to the symposium.',
            delta: 1,
            why: '丁寧すぎて他人行儀。10年来の友人に「Professor Kim」は距離を作ります。旧友には旧友の距離感で。' },
          { text: 'Sorry we\'re late! The hotel elevator was so slow, and then Claire couldn\'t find her jacket, and...',
            delta: -1,
            why: '遅刻の言い訳から始めると、感謝より先に謝罪の空気に。遅れたなら一言謝り、すぐ再会の喜びに切り替えましょう。' },
          { text: 'Hi. Which way is the campus?',
            delta: -2,
            why: '10年ぶりの再会の第一声が事務連絡。運転手扱いに聞こえてしまいます。' }
        ]
      },
      {
        situation: '車に乗り込みます。Kyoung-Dongが後部座席のClaireに気づきました。**Claireを紹介**しましょう。',
        limitSec: 16,
        choices: [
          { text: 'This is Claire, my partner — we\'re getting married in January. Claire, this is the man who did all the experiments while I hid behind a computer.',
            delta: 3, best: true,
            why: '**両方向の紹介**が鉄則。相手にClaireを、ClaireにKyoung-Dongを、それぞれ一言の物語付きで。実験/解析の分業ネタは2人の関係を1文で伝えます(ネタ帳💑基本の紹介)。' },
          { text: 'This is Claire. Claire, this is Kyoung-Dong, my former colleague at the Wistar Institute in Philadelphia, where we worked together on genome organization.',
            delta: 2,
            why: '正確で丁寧ですが、経歴の説明が長くて講義調。ユーモアか物語をひとつ入れると場が温まります。' },
          { text: 'Oh, this is Claire.',
            delta: 0,
            why: '紹介が一方向で終わっています。ClaireにKyoung-Dongが何者かを伝えないと、彼女が会話に入れません。' },
          { text: '(Claireが自分で挨拶するのに任せる)',
            delta: -2,
            why: '同行者の紹介はホスト側(あなた)の役目。任せきりはClaireにもKyoung-Dongにも負担です。' }
        ]
      },
      {
        situation: '助手席にはもう1人、初対面のDr. Sonが。Kyoung-Dongが "This is Dr. Son, he presented yesterday too." と紹介してくれました。',
        limitSec: 15,
        choices: [
          { text: 'Nice to meet you! Which session was your talk in? I\'m sorry if I missed it — the parallel sessions were brutal.',
            delta: 3, best: true,
            why: '初対面には**相手の発表への関心**が最高の挨拶。「見逃したかも」の正直さ+パラレルセッションの共感で、責めのない聞き方になっています。' },
          { text: 'Nice to meet you, Dr. Son. I am Hideki. I gave an invited talk yesterday about the three-dimensional organization of the fission yeast genome.',
            delta: 0,
            why: '相手に聞く前に自分の発表の宣伝から入っています。招待講演者と名乗るのは、聞かれてからで十分。' },
          { text: 'Hello.',
            delta: -1,
            why: '2時間同乗する相手への挨拶としては素っ気なさすぎ。ここでの一言が車内の居心地を決めます。' },
          { text: '(KyoungとDr. Sonが韓国語で話し始めたので、黙ってスマホを見る)',
            delta: -2,
            why: '韓国語の会話が始まっても、切れ目で英語の質問を投げれば輪に入れます。スマホは「入る気がない」のサインに見えます。' }
        ]
      },
      {
        situation: '高速に乗りました。Kyoung-Dongが "So how have you been? It\'s been so long." と。**Wistarの思い出**につなげるチャンスです。',
        limitSec: 16,
        choices: [
          { text: 'I was thinking on the flight — it\'s been almost ten years since our condensin-cohesin days. Those were good papers, and better times.',
            delta: 3, best: true,
            why: '共通の過去は2人だけの資産(ネタ帳🔬)。「いい論文だった、それ以上にいい時間だった」は、研究者同士の最高の褒め言葉です。' },
          { text: 'I\'m fine. Very busy with grant applications and committee meetings, as usual. You know how it is in Japan — the paperwork never ends, and this year we also had to...',
            delta: 0,
            why: '近況が愚痴の羅列に。忙しい話は共感は得ますが、再会の冒頭では思い出や明るい話から始めるほうが会話が伸びます。' },
          { text: 'Fine, thank you. And you?',
            delta: -1,
            why: '教科書の返事。10年分の「どうしてた?」に3語では、会話のボールを相手に投げ返しただけです。' },
          { text: 'Actually, my talk went really well yesterday. Many people asked questions and the chair said it was one of the best talks of the session.',
            delta: -1,
            why: '聞かれてもいない自慢から入ると、旧友との再会が成果報告会になります。発表の話は相手に聞かれてから。' }
        ]
      },
      {
        situation: 'Kyoung-Dongが "I saw your abstract — sub-domain structures? Tell me about it." と発表内容に興味を示しました。',
        limitSec: 16,
        choices: [
          { text: 'It\'s actually a direct sequel to our old work — I\'m going below the condensin and cohesin domains, down to structures of just a few genes.',
            delta: 3, best: true,
            why: '「**私たちの仕事の続編**」というフレーミングは相手への最大の敬意(ネタ帳🧬)。専門的な内容を、2人の物語として語れています。' },
          { text: 'Well, we performed high-resolution Hi-C at restriction-fragment resolution and identified chromatin domains of two to five genes that are independent of both condensin and cohesin binding sites.',
            delta: 1,
            why: '内容は正確ですが、車内の雑談としては学会発表そのまま。まず1文の物語で興味を掴んでから詳細へ。' },
          { text: 'You\'ll see it tomorrow at the symposium. I don\'t want to spoil it!',
            delta: 0,
            why: 'じらしは1回なら冗談になりますが、興味を示してくれた旧友への返答としてはもったいない。概要だけでも話すと議論が始まります。' },
          { text: 'It\'s a bit complicated to explain...',
            delta: -2,
            why: '専門が同じ相手に「説明が難しい」は禁句。相手の理解力を低く見た形になってしまいます。' }
        ]
      },
      {
        situation: '**会話が途切れました。**5分間、誰も話していません。窓の外には巨大な団地群が流れていきます。ここで一手。',
        limitSec: 17,
        choices: [
          { text: 'Is this area still Seoul, or are we already outside the city? The scale of these apartment complexes is amazing.',
            delta: 3, best: true,
            why: '**車内最強の話題は窓の外**(ネタ帳🚗)。目に見えるものから入ると自然で、相手の出身地の話にもつながります。沈黙は「立て直せる」と知っていれば怖くありません。' },
          { text: 'By the way, everyone says Kyoto, and Kyoto is great — but if you\'ve already seen it, my personal pick is Kanazawa. You should all visit Japan again soon.',
            delta: 1,
            why: 'ネタ帳の日本紹介ですが、文脈なしに突然出すと唐突。窓の外→韓国の話→「日本では…」の順なら自然でした。' },
          { text: '(沈黙は気まずいが、何も思いつかないので寝たふりをする)',
            delta: -2,
            why: '寝たふりは楽ですが、残り90分の空気が固まります。ネタ帳の武器を1つでも出せば流れは戻ります。' },
          { text: 'So... yes. Nice highway. Very smooth.',
            delta: 0,
            why: '沈黙よりマシですが、高速道路の舗装は広がらない話題の代表。相手が答えやすい質問の形にしましょう。' }
        ]
      },
      {
        situation: 'Kyoung-Dongが笑って「英樹の韓国語、聞かせてよ」と。**練習してきた韓国語を披露するチャンス**です。',
        limitSec: 15,
        choices: [
          { text: '감사합니다! ...OK, please be honest about my pronunciation. I\'ve been studying with an app for months.',
            delta: 3, best: true,
            why: '**実戦投入の瞬間**。完璧である必要はなく、「正直に評価して」と添えるとミニレッスンが始まり、車内に共通のゲームが生まれます(ネタ帳📝)。' },
          { text: 'Ah, no no, my Korean is really not good enough yet. Maybe next time, after I study more. I would be too embarrassed in front of Dr. Son.',
            delta: -1,
            why: '謙遜のつもりが機会損失。下手だから面白く、下手だから距離が縮まります。振られたら乗るが正解。' },
          { text: '(急に緊張して、覚えていたはずのフレーズが全部飛ぶ)',
            delta: 0,
            why: '飛んだら飛んだで "See, this is why I need you as my teacher!" と笑いに変えられます。失敗も台本にしておきましょう。' },
          { text: 'Sure — I learned "annyeonghaseyo" and "kamsahamnida" and also "sugohasyeossseumnida" which means you worked hard, and also how to order food...',
            delta: 1,
            why: '知識の列挙より、1フレーズを**実際に発音してみせる**ほうが100倍伝わります。' }
        ]
      },
      {
        situation: '休憩所でコーヒーを買って再出発。**また沈黙が来ました。**今度はあなたから話題を出す番です。',
        limitSec: 17,
        choices: [
          { text: 'Let me describe Japan\'s grant system — we call it KAKENHI, success rate around 25 percent. How does Korea compare, better or worse?',
            delta: 3, best: true,
            why: '**グラントの愚痴は世界共通のアイスブレイカー**(ネタ帳💰)。数字を1つ添えると具体的な比較talkになり、研究者2人が一気に乗ってきます。' },
          { text: 'Confession: half of my analysis scripts are now written with AI. My coding didn\'t get better — my prompting did.',
            delta: 2,
            why: 'AIネタも良い選択(ネタ帳💻)。自己開示から入る形が上手。ベストとの差は、グラントの話のほうが同乗のDr. Sonも巻き込みやすい点だけです。' },
          { text: 'The coffee at the rest stop was interesting. In Japan, rest stop coffee is also getting better these days. Vending machines have improved a lot too.',
            delta: 0,
            why: 'コーヒー→自販機と話が小さくなっています。せっかくの沈黙リカバリー、もう少し大きな話題の入口を。' },
          { text: '(今度はClaireが何か話してくれるのを待つ)',
            delta: -1,
            why: '2度目の沈黙で他人任せは、ホスト役の放棄。ネタ帳の持ちネタはこの瞬間のためにあります。' }
        ]
      },
      {
        situation: 'グラント談義が盛り上がった流れで、Kyoung-Dongが "By the way, are you still doing collaborations?" と。**次の共同研究への布石**のチャンス。',
        limitSec: 16,
        choices: [
          { text: 'The Malassezia Hi-C work reminded me how well our skills still fit together. If you have another dataset gathering dust, I\'m interested.',
            delta: 3, best: true,
            why: '実績(mBio 2025)を根拠に次を誘う、**この車中で最も価値ある一手**(ネタ帳🤝)。「データが眠っているなら」という軽い形なので、相手も断りやすく誘いやすい。' },
          { text: 'Yes, and actually — before you bring it up — I still owe you the EBV analysis. It\'s the longest-running item on my to-do list. Let\'s talk about how to finally do it.',
            delta: 2,
            why: 'EBVの宿題を自分から出す誠実な選択(ネタ帳🙇)。素晴らしい一手ですが、まず新しい共同研究の話で前向きな流れを作ってから出すと、さらに効きます。' },
          { text: 'Yes, I have many collaborations now. With groups in Tokyo, Osaka, Singapore, and also two companies. I am very busy managing all of them.',
            delta: -1,
            why: '共同研究の数の自慢になっています。相手が聞きたいのは「自分との」続きがあるかどうか。' },
          { text: 'Collaborations are difficult these days. Everyone is busy.',
            delta: 0,
            why: '一般論で流してしまいました。10年前の名コンビ相手に、これほど誘いやすい流れはもう来ないかもしれません。' }
        ]
      },
      {
        situation: '「まもなく到着」の案内。キャンパスの門が見えてきました。**2時間の締めくくり**の一言を。',
        limitSec: 16,
        choices: [
          { text: 'That went by fast — good conversation does that. Thank you for the ride, and next time you\'re in Japan, I\'m taking your family to a ryokan. My treat, no negotiation.',
            delta: 3, best: true,
            why: '「あっという間だった=楽しかった」の伝え方が上品。**具体的なお返しの約束**(ネタ帳🤝)で、この2時間を次につなげています。' },
          { text: 'Thank you for driving.',
            delta: 1,
            why: '感謝はあるものの、2時間の中身に触れていません。「何が楽しかったか」を一言足すだけで温度が変わります。' },
          { text: 'Finally! My back hurts from sitting so long. Korean highways are quite bumpy compared to Japanese ones, aren\'t they?',
            delta: -2,
            why: '到着の第一声が体の不調+道路の批判。2時間運転してくれた人への締めくくりとしては最悪の部類です。' },
          { text: 'What time is my talk again? And is there Wi-Fi in the symposium room? I need to check my slides one more time before we start.',
            delta: 0,
            why: '実務モードへの切り替えが早すぎます。まず2時間への感謝、実務はそのあと30秒で足ります。' }
        ]
      }
    ]
  },
  {
    id: 'banquet-issy',
    title: '🍻 ISSY39懇親会を泳ぎ切る',
    icon: '🍻',
    level: 2,
    setting: 'ISSY39の懇親会。立食形式で、知り合いはまだ少ない。ビュッフェの列、テーブルの輪、帰り際 — 短い会話の連続を泳ぎ切りましょう。',
    partner: { name: 'ISSY39の参加者たち', desc: '初対面中心。隣に並んだ人、テーブルの輪、主催の先生。' },
    focus: ['network', 'confidence'],
    turns: [
      {
        situation: 'ビュッフェの列。隣の参加者と目が合いました。皿には見たことのない料理が並んでいます。',
        limitSec: 15,
        choices: [
          { text: 'Excuse me — do you know what this one is? I want to try everything but I\'d like to know what I\'m committing to.',
            delta: 3, best: true,
            why: '**目の前の料理は懇親会最強の入口**。教えを乞う形は誰でも答えやすく、"committing to"の軽いユーモアが場を和ませます。' },
          { text: '(黙って全部少しずつ取る)',
            delta: 0,
            why: '安全ですが機会損失。列に並ぶ2分は、リスクゼロで会話を始められる貴重な時間です。' },
          { text: 'The food at Korean conferences is always so much better than at European ones, don\'t you think? Last year in Vienna the banquet was really disappointing.',
            delta: -1,
            why: '比較で他を下げる入り方は、初対面では危険。ウィーンの主催者の知り合いかもしれません。' },
          { text: 'Hello. I am Hideki Tanizawa from Japan. I gave an invited talk this morning in Session 2. What is your name and affiliation?',
            delta: 1,
            why: 'ビュッフェの列でフルの自己紹介は重い。まず料理の話で1往復、名乗るのはそのあとで十分です。' }
        ]
      },
      {
        situation: '相手が「それはホンオフェ(発酵エイ)、韓国でも上級者向けですよ」と笑いました。**深掘りのチャンス**。',
        limitSec: 15,
        choices: [
          { text: 'Now I have to try it — if I disappear from the conference tomorrow, you\'ll know why. Is it something locals actually eat, or is it a test for foreigners?',
            delta: 3, best: true,
            why: 'リアクション(挑戦宣言+軽い自虐)→**深掘り質問**の理想形。ネタ帳🍜の「地元の人が本当に食べるもの?」がそのまま使えています。' },
          { text: 'I see. Thank you for the information.',
            delta: -1,
            why: 'せっかく相手が笑いながら投げてくれたボールを、真顔で置きました。会話終了のサインに聞こえます。' },
          { text: 'Ah, fermented food! Japan also has many fermented foods. Natto, for example, is fermented soybeans, and kusaya is a fermented fish which smells very strong, and funazushi is...',
            delta: 1,
            why: '発酵つながりは良い連想ですが、列挙が始まって講義に。1つ挙げて「あなたはホンオフェ平気?」と返すのが会話です。' },
          { text: '(勇気を出して一口食べ、無言で涙目になる)',
            delta: 2,
            why: '実は悪くない!体を張った笑いは言葉より雄弁です。あとで "You warned me" と一言返せば完璧でした。' }
        ]
      },
      {
        situation: '皿を持って会場へ。3〜4人の輪が楽しそうに話しています。中に、昼のセッションの座長がいます。',
        limitSec: 15,
        choices: [
          { text: '(輪の少し外に立ち、座長と目が合ったタイミングで) Mind if I join? I promised myself I wouldn\'t eat alone in the corner tonight.',
            delta: 3, best: true,
            why: '輪への入り方の教科書(既習の「輪に入る」の応用)。**目が合ってから+一言の自虐**で、輪の全員があなたを歓迎する空気になります。' },
          { text: '(いきなり輪の中心に入って) Hello everyone! What are we all talking about today? Anything interesting?',
            delta: -1,
            why: '会話の途中に正面から割り込む形。輪のリズムを一度壊してしまいます。まず外周で聞く姿勢から。' },
          { text: '(知り合いがいないので、壁際で一人で食べる)',
            delta: -2,
            why: '懇親会の壁際は一番安全で、一番もったいない場所。今夜の目的は食事ではなく人です。' },
          { text: '(輪の外から座長にだけ小声で) Excuse me, Professor, may I ask a question about the session this afternoon? I was wondering about the second speaker\'s data.',
            delta: 0,
            why: '座長個人への質問は良いのですが、楽しく話している輪を止めて仕事の話に引き戻す形に。質問は輪に入ってから流れで。' }
        ]
      },
      {
        situation: '輪に入れました。座長が "So you\'re the invited speaker from Japan — tell us about yourself!" と話を振ってきました。**30秒の自己紹介**。',
        limitSec: 17,
        choices: [
          { text: 'I study how chromosome folding changes as cells age — I\'m presenting tomorrow at 9 if you\'re curious. More importantly, someone just made me eat fermented stingray, so this is already the best conference of my year.',
            delta: 3, best: true,
            why: '研究1文+宣伝1文+**その場のネタで笑い**の30秒構成(ネタ帳の自己紹介+実体験の融合)。懇親会の自己紹介は「面白い人」と覚えてもらえれば勝ちです。' },
          { text: 'My name is Hideki Tanizawa. I received my PhD in 2008, then worked at the Wistar Institute in Philadelphia for eight years, and now I am an associate professor in Japan, where my laboratory focuses on...',
            delta: 0,
            why: '履歴書の朗読が始まりました。懇親会の輪では、経歴より「何が面白いか」1つのほうが記憶に残ります。' },
          { text: 'Oh, I\'m not that interesting. Please, continue your conversation!',
            delta: -1,
            why: 'せっかくのスポットライトを自分で消しました。謙遜は、日本の外では「話したくない」に翻訳されます。' },
          { text: 'Yes, I am the invited speaker. My talk is tomorrow at 9 am in the main hall. The title is on page 12 of the program. I hope many of you will come.',
            delta: 1,
            why: '宣伝としては正しいのですが、宣伝**だけ**になっています。人柄が見える一言がないと、聴衆は増えても友人は増えません。' }
        ]
      },
      {
        situation: '楽しく話しましたが、他の人とも話したい頃合い。**輪からの切り上げ方**は?',
        limitSec: 15,
        choices: [
          { text: 'I promised myself I\'d meet five new people tonight, so I should keep moving — but I really enjoyed this. See you at my talk tomorrow?',
            delta: 3, best: true,
            why: '**去る理由をポジティブに宣言**する切り上げの定型。「5人と話すと決めた」は誰も傷つけず、最後の一言で再会の約束まで作っています。' },
          { text: '(飲み物を取りに行くふりをして、そのまま戻らない)',
            delta: -1,
            why: '一番よくあるやり方ですが、輪の人たちは気づいています。堂々と切り上げるほうが印象は良いのです。' },
          { text: 'Excuse me, I need to check my slides for tomorrow.',
            delta: 0,
            why: '嘘ではないにせよ「この場より仕事」のメッセージに。もう少し温度のある去り方を。' },
          { text: '(切り上げられず、結局2時間同じ輪で過ごす)',
            delta: 1,
            why: '深い関係が1つできるのは良いこと。ただ懇親会は「浅く広く」も目的。座長との会話が弾んでいるなら悪くない選択ですが、今夜の5人目標は未達です。' }
        ]
      },
      {
        situation: '帰り際、最初にホンオフェを教えてくれた参加者と再びすれ違いました。**re-connectのチャンス**。',
        limitSec: 15,
        choices: [
          { text: 'Hey — I survived the stingray! I owe you one. I\'m Hideki, by the way. If you\'re at the sessions tomorrow, come say hi.',
            delta: 3, best: true,
            why: '**同じ相手との2度目の接触は1度目の10倍濃い**。共有した小さな事件(ホンオフェ)を回収し、今度こそ名乗り、明日につなげる — 完璧なre-connectです。' },
          { text: '(会釈だけして通り過ぎる)',
            delta: 0,
            why: '礼儀としては十分ですが、せっかく「共通の話題」を持つ相手。一言で知り合いに変わるチャンスでした。' },
          { text: 'Good night. The banquet was very nice.',
            delta: 1,
            why: '感じは良いのですが、誰にでも言える挨拶。2人だけの文脈(ホンオフェ)を使えば、特別な一言になりました。' },
          { text: 'Excuse me, could you tell me your name and email? I want to add you to my professional network and send you information about my research and future papers.',
            delta: -1,
            why: '連絡先の回収が目的化しています。人間関係が先、名刺は後。まず「ホンオフェの人」として再会を楽しみましょう。' }
        ]
      }
    ]
  },
  {
    id: 'dinner-cau',
    title: '🍽️ シンポジウム後のDinner',
    icon: '🍽️',
    level: 3,
    setting: 'Chung-Ang Universityのシンポジウムが無事終了。Kyoung-Dongとホストの先生方、学生数人、そしてClaireとの会食に招待されました。着席の韓国料理店。約2時間の長丁場です。',
    partner: { name: 'Chung-Angのホスト陣', desc: 'Kyoung-Dong、学科の教授たち、大学院生。' },
    focus: ['topic', 'english'],
    turns: [
      {
        situation: '席に着き、ホストの教授が "Thank you for coming all the way to our symposium." と。**冒頭の返し**は?',
        limitSec: 16,
        choices: [
          { text: 'Thank you for having us — the symposium had a great atmosphere. Your students\' questions were sharper than some reviewers I know.',
            delta: 3, best: true,
            why: 'ホストの労をねぎらい、**学生を褒める**(ネタ帳🎤)。教授にとって学生への賛辞は自分への賛辞より嬉しいもの。Reviewerジョークで研究者の共通言語も入っています。' },
          { text: 'Thank you. It was a nice symposium.',
            delta: 1,
            why: '悪くないのですが「nice」1語では社交辞令止まり。何が良かったかを1つ挙げるだけで、本心の感想に変わります。' },
          { text: 'Thank you for inviting me. I visited Korea for the first time in 2019, and this is my third visit. Korean universities always have very good facilities, much newer than Japanese ones, because...',
            delta: 0,
            why: '感謝から始まったのに、話が自分の訪韓史に。冒頭の主役はホストと今日のシンポジウムです。' },
          { text: '(緊張して、隣のKyoung-Dongに小声で「何て言えばいい?」と聞く)',
            delta: -1,
            why: '冒頭の挨拶はネタ帳で仕込んだ型がそのまま使える場面。ここは自力で言えるはずです。' }
        ]
      },
      {
        situation: 'ホストが "How did you find the symposium? Any talk that caught your attention?" と感想を求めてきました。',
        limitSec: 17,
        choices: [
          { text: 'The imaging talk in the afternoon started the best discussion, I thought — and honestly, I took notes during your student\'s presentation. The degron design was clever.',
            delta: 3, best: true,
            why: '**具体的な発表名を挙げる**のが最高の感想(ネタ帳🎤)。「学生の発表でメモを取った」は、その学生と指導教員の両方に届く一言です。' },
          { text: 'Everything was excellent. All the talks were very interesting and the organization was perfect. The venue was also very comfortable and the coffee break was well arranged.',
            delta: 0,
            why: '全部を褒めると、何も褒めていないのと同じに聞こえます。1つに絞って具体的に。' },
          { text: 'To be honest, I think the morning session had some problems. The second talk\'s statistics were questionable, and I noticed several people were checking their phones.',
            delta: -2,
            why: '正直な批評は査読でどうぞ。ホストの晩餐で運営や発表の欠点を挙げるのは、招待への返礼として最悪です。' },
          { text: 'It was good. My own talk went well too, I think. Did you like my talk?',
            delta: -1,
            why: '感想を聞かれて自分の発表の評価を聞き返す形に。自分の話は相手が振ってくれるまで待ちましょう。' }
        ]
      },
      {
        situation: '大皿料理が次々運ばれてきます。学生が「これはカンジャンケジャン(醤油漬けの生ワタリガニ)です」と教えてくれました。',
        limitSec: 15,
        choices: [
          { text: 'I\'ve heard about this one — they call it "rice thief" right? Because you can\'t stop eating rice with it. Let\'s test that claim.',
            delta: 3, best: true,
            why: '「밥도둑(ご飯泥棒)」の知識を軽く出して**その場で検証する遊び**に。仕込んだ知識は、クイズの答えではなく遊びの提案として出すと粋です。' },
          { text: 'Thank you. It looks delicious.',
            delta: 1,
            why: '丁寧ですが、学生がせっかく英語で説明してくれた勇気に、もう1往復返してあげたい場面です。' },
          { text: 'Raw crab? Is it safe? I have a slightly sensitive stomach, and tomorrow I have to travel, so maybe I should not risk it. Do you have something cooked?',
            delta: -1,
            why: '安全性への懸念を長々と。無理に食べる必要はありませんが、まず一口の敬意か、せめて短く明るく辞退を。' },
          { text: '(黙って写真を撮る)',
            delta: 0,
            why: '写真は万国共通ですが、無言だと会話が止まります。「Claireに自慢する用」など一言添えれば、それ自体がネタに。' }
        ]
      },
      {
        situation: '教授の1人が "I\'m planning to visit Japan next spring with my family. Any recommendations?" と。**日本紹介の鉄板**の出番。',
        limitSec: 17,
        choices: [
          { text: 'Everyone says Kyoto, and Kyoto is great — but if you\'ve seen it already, my pick is Kanazawa: Kyoto\'s atmosphere, one-tenth of the crowds. Are you a food traveler or a temple traveler?',
            delta: 3, best: true,
            why: 'ネタ帳🗾の鉄板がフルで機能する場面。「定番+自分だけの一押し+**逆質問**」の3点セットで、おすすめが会話に変わります。' },
          { text: 'Kyoto is the most famous. Tokyo is also good. Osaka has good food. Hokkaido is nice in summer and Okinawa is nice in winter. It depends on what you like.',
            delta: 1,
            why: '網羅的なガイドブック回答。情報は正しいのに、どこにも「あなた」がいません。1つに絞って理由を語るほうが記憶に残ります。' },
          { text: 'Japan is expensive now because of the exchange rate, so maybe it is not the best time to visit. Prices in Kyoto hotels have almost doubled since the pandemic.',
            delta: -1,
            why: '行きたいと言っている人に「今は時期が悪い」から入るのは水の差しすぎ。円安はむしろ「今は韓国の方から見ればお得ですよ」と逆に使えます。' },
          { text: 'Please come to my university! I will show you around the campus and we can also discuss possible collaborations between our departments while you are there.',
            delta: 0,
            why: '招待自体は素敵ですが、家族旅行の相談に仕事の話を重ねてしまいました。まず旅の話に答え、招待はその後で。' }
        ]
      },
      {
        situation: 'ふと気づくと、Claireがしばらく会話に入れていません。韓国語と専門用語が飛び交っています。',
        limitSec: 16,
        choices: [
          { text: 'Claire actually knows more about Korean culture than I do — she\'s the reason our home has better kimchi than most restaurants in Japan. Claire, tell them about your kimchi source.',
            delta: 3, best: true,
            why: '**同行者を長く黙らせないのがゲストの器**(ネタ帳🎤)。具体的な話題(キムチ)付きでバトンを渡しているので、Claireも話しやすい。' },
          { text: '(Claireに小声で日本語で「大丈夫?」と聞く)',
            delta: 1,
            why: '優しさは伝わりますが、2人だけの内緒話は輪を分断します。彼女を輪の中に連れてくるのがベストの優しさ。' },
          { text: '(気づいているが、教授との専門の話が面白いのでそのまま続ける)',
            delta: -2,
            why: '専門talk に夢中で同行者を放置 — 本番で一番起きやすい事故です。この画面を思い出してください。' },
          { text: 'Sorry everyone, can we speak English so Claire can join? She cannot understand Korean at all and she has been sitting quietly for a long time.',
            delta: 0,
            why: '意図は正しいのですが「彼女は全然分からないので」は本人の前で言うと角が立ちます。話題を振る形なら、言語は自然に英語に切り替わります。' }
        ]
      },
      {
        situation: 'ホストがグラスを掲げて乾杯の音頭を。全員のグラスが上がりました。**あなたも一言返す流れ**です。',
        limitSec: 15,
        choices: [
          { text: '건배! ...That\'s half of my Korean vocabulary, so please treasure it. To new collaborations between our labs!',
            delta: 3, best: true,
            why: '**韓国語の乾杯+自虐+未来への一言**の完璧な返杯。覚えた건배をここで使うために練習してきたのです。' },
          { text: 'Cheers!',
            delta: 1,
            why: '十分ですが、覚えたはずの건배を使わなかったのは惜しい。1単語の現地語が、100語の英語より場を沸かせます。' },
          { text: '(グラスを上げて微笑むだけ)',
            delta: 0,
            why: '失礼ではありませんが、返杯の機会はホストへの敬意を示す数少ない公式な瞬間。一言だけでも声を出しましょう。' },
          { text: 'In Japan we say kanpai! The kanji characters are actually the same as geonbae in Korean — 乾杯, meaning "dry the cup". It is interesting that our languages share so much vocabulary through Chinese characters.',
            delta: 2,
            why: '漢字の共通性は素晴らしいネタ...ですが乾杯の瞬間は全員がグラスを掲げて待っています。語源talkは飲んだ後で!' }
        ]
      },
      {
        situation: '食事も後半。隣の教授が "Your kids will grow up with AI — as a scientist, does that worry you?" と話を振ってきました。',
        limitSec: 17,
        choices: [
          { text: 'We don\'t have kids yet — wedding is in January — but I tell my students the truth: AI can\'t attend faculty meetings for me, so some human jobs are safe.',
            delta: 3, best: true,
            why: '前提(子どもはまだ)をさらっと訂正しつつ結婚式の話題も置き、**教授会ジョーク**(ネタ帳😅)で笑いに着地。教授陣に一番刺さる型です。' },
          { text: 'That is a very important question. AI safety and education policy are being discussed in many countries now. In Japan, the ministry of education published guidelines in 2024, which say that...',
            delta: 0,
            why: '政策レポートの引用が始まりました。晩餐のAI談義に必要なのは正確さより、あなた自身の実感と少しの笑いです。' },
          { text: 'I don\'t have children, so I don\'t know.',
            delta: -1,
            why: '事実ですが、会話のボールを床に置きました。「子どもはいないが学生なら…」と、自分の土俵に引き込めば続きます。' },
          { text: 'Actually I use AI every day. I built a conversation training app with AI — in fact, I practiced for this exact dinner with it.',
            delta: 2,
            why: '最強の実話ネタ(ネタ帳📱)であり、ここで出す勇気も見事。ベストとの差は、質問(子どもとAI)に一度答えてから出すとさらに自然だった点です。' }
        ]
      },
      {
        situation: 'お開きの気配。ホストの教授が席を立ち、あなたに握手を求めてきました。**締めの挨拶**です。',
        limitSec: 16,
        choices: [
          { text: 'Thank you for tonight — the symposium, this dinner, everything. Next time, Japan: we\'ll do a seminar, and then I\'m taking you all to a ryokan. 감사합니다!',
            delta: 3, best: true,
            why: '感謝の総括+**具体的な招待返し**+最後にもう一度韓国語。今日一日の完璧な締めくくりです。パートナーの隣で、この一言が言えれば本番は成功です。' },
          { text: 'Thank you very much. Please email me about the collaboration we discussed, and I will send you the papers I mentioned, and also the protocol for the Hi-C analysis, and my student will contact your student about...',
            delta: 1,
            why: '実務の引き継ぎが長い!約束の確認は1文で十分、詳細は明日のメールで。締めの挨拶は感謝と余韻のためにあります。' },
          { text: 'Thank you. Good night.',
            delta: 0,
            why: '今日一日の招待への締めとしては軽すぎます。もらったもてなしの分だけ、言葉を返しましょう。' },
          { text: '(お辞儀を3回して、握手のタイミングを逃す)',
            delta: -1,
            why: '深いお辞儀は誠意ですが、差し出された手は握りましょう。お辞儀と握手は両立します — 手を握りながら軽く一礼が国際標準です。' }
        ]
      }
    ]
  }
];
