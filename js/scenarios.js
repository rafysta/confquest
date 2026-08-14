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
            text: 'Hello. What is your research topic?',
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
            text: 'Thank you. Actually, in my lab we also found something similar...',
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
            text: 'Nice to meet you. Can I have your email? I want to send you my papers.',
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
            text: 'What do you think about the keynote this morning?',
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
            text: 'Really? I thought it was excellent!',
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
            text: 'Yes, yes, I know. We have the same problem.',
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
            text: 'I have some plans, but I could change them.',
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
            text: 'That\'s a good question. Actually, it\'s still controversial in the field.',
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
            text: 'Sure! I can send you all our data and protocols tonight.',
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
            text: 'We can find each other on ResearchGate.',
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
            text: 'What do you think about the political situation here?',
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
            text: 'Actually, Japanese people can eat spicy food too.',
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
            text: 'It\'s expensive now, so maybe not the best time.',
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
            text: 'Thank you for tonight. See you tomorrow.',
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
