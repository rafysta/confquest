/* ConfQuest - 🚗 雑談クエスト Phase A: ネタ帳(Topic Deck)
 * 設計: docs/smalltalk-design.md
 * 各カードは「話題」ではなく「会話の設計図」: opener(切り出し)+follow(深掘り)+note(なぜ効くか)。
 * 実在の文脈(Kyoung-Dong / Wistar / Claire / ISSY39)に合わせて執筆。
 * 時事カードは2026-08時点のリサーチに基づく。古くなったら書き換えること。
 */
'use strict';

const TOPIC_CATS = {
  korea:    { icon: '🇰🇷', label: '韓国' },
  japan:    { icon: '🇯🇵', label: '日本紹介' },
  usa:      { icon: '🇺🇸', label: 'アメリカ・Wistar' },
  academia: { icon: '🎓', label: 'アカデミア' },
  ai:       { icon: '🤖', label: 'AI' },
  humor:    { icon: '😄', label: '笑い' },
  news:     { icon: '📰', label: '時事' },
  claire:   { icon: '💑', label: 'Claire紹介' }
};

const TOPIC_DECK = [
  /* ================= 🇰🇷 韓国 (8) ================= */
  { id: 'kr-food', cat: 'korea', icon: '🍜', title: 'ソウルで何を食べるべき?',
    opener: "I have one free evening in Seoul — what's the one thing I absolutely have to eat?",
    openerJa: 'ソウルで自由な夜が1回だけあるんです — 絶対食べるべきものを1つだけ挙げるなら?',
    follow: ["Is that something locals actually eat, or is it more for tourists?",
             "How spicy are we talking — on a scale from one to crying?"],
    followJa: ['それは地元の人が本当に食べるもの?それとも観光客向け?', '辛さはどのくらい?「1〜泣くレベル」で言うと?'],
    note: '「1つだけ」と絞ると相手が真剣に選んでくれて、理由まで話してくれる。返答には必ずリアクション+追い質問。',
    ko: { t: '맛있겠다!', k: 'マシッケッタ!', ja: 'おいしそう!' } },
  { id: 'kr-drive', cat: 'korea', icon: '🚗', title: '車窓の風景から',
    opener: "Is this area still Seoul, or are we already outside the city? The scale of these apartment complexes is amazing.",
    openerJa: 'ここはまだソウルですか?それとももう郊外?この団地のスケールはすごいですね。',
    follow: ["Did you grow up in Seoul, or somewhere else?",
             "If I came back with more time, which region would you send me to?"],
    followJa: ['キュンドンはソウル育ちですか?それとも別の街?', 'もし時間をとってまた来るなら、どの地方に行くべきですか?'],
    note: '車内最強の話題は窓の外。目に見えるものから入ると自然で、相手の出身地の話につながる。運転の邪魔をしない軽さも◎。' },
  { id: 'kr-conference', cat: 'korea', icon: '🎪', title: '韓国の学会文化',
    opener: "I noticed Korean conferences feel more energetic than Japanese ones — people actually ask questions! Is that a cultural thing?",
    openerJa: '韓国の学会は日本より熱気がありますね — みんな本当に質問する!文化の違いですか?',
    follow: ["How do Korean students learn to be so confident in Q&A?",
             "Japanese audiences are famous for being silent. Any advice for me?"],
    followJa: ['韓国の学生はどうやって質疑応答の度胸をつけるんですか?', '日本の聴衆は静かなことで有名です。私に助言があれば?'],
    note: '直前のISSY39の実体験を使える鉄板。日韓比較は「どちらも下げない」形なら盛り上がる。' },
  { id: 'kr-hangul', cat: 'korea', icon: '📝', title: '韓国語を勉強してみた',
    opener: "I've been studying Korean with an app for a few months. Hangul is genius — I learned to read it in a week. Speaking is another story.",
    openerJa: '数ヶ月アプリで韓国語を勉強してるんです。ハングルは天才的な文字ですね — 読みは1週間で覚えました。話すのは別問題ですが。',
    follow: ["Can I try a phrase on you? Please be honest about my pronunciation.",
             "What Korean word do foreigners always get wrong?"],
    followJa: ['ひとつ試していいですか?発音は正直に評価してください。', '外国人がいつも間違える韓国語の単語って何ですか?'],
    note: '相手の母語を学んでいる話は最高の敬意表現。ここから実際に수고하셨습니다などを披露するチャンスを作れる。',
    ko: { t: '한국어를 조금밖에 못해요', k: 'ハングゴルル チョグムバッケ モテヨ', ja: '韓国語は少ししかできません' } },
  { id: 'kr-seoul-change', cat: 'korea', icon: '🏙️', title: 'ソウルの変化',
    opener: "Kyoung-Dong, when you moved back from the US, did Korea feel different? People say Seoul changes every five years.",
    openerJa: 'アメリカから戻ったとき、韓国は変わって見えましたか?ソウルは5年ごとに別の街になると言いますよね。',
    follow: ["What did you miss most about Korea when you were in Philadelphia?",
             "Was it hard for your family to re-adjust?"],
    followJa: ['フィラデルフィアにいた頃、韓国の何が一番恋しかったですか?', 'ご家族が再適応するのは大変でしたか?'],
    note: '「帰国後の逆カルチャーショック」は海外経験者同士の鉄板。相手の人生を主役にする質問。' },
  { id: 'kr-kculture', cat: 'korea', icon: '🎬', title: 'K-カルチャー(相手が乗ってきたら)',
    opener: "Claire watches a lot of Korean dramas, so I arrived with very specific expectations about Korea. So far the food lives up to the shows.",
    openerJa: 'Claireが韓国ドラマをよく観るので、韓国にはかなり具体的な予習をして来ました。今のところ食べ物はドラマ通りです。',
    follow: ["Do Koreans actually watch the dramas that are famous overseas?",
             "What show would you recommend to understand real Korean life?"],
    followJa: ['海外で有名な韓国ドラマを、韓国の人は実際に観てるんですか?', 'リアルな韓国の生活が分かる作品を1つ薦めるなら?'],
    note: 'Claireを会話に巻き込む入口としても使える二刀流カード。自分が詳しくなくても「Claire経由」で自然に振れる。' },
  { id: 'kr-work', cat: 'korea', icon: '💼', title: '韓国の働き方',
    opener: "Honest question — is work-life balance in Korean universities getting better? Japan talks about reform a lot, but change is slow.",
    openerJa: '正直な質問ですが — 韓国の大学のワークライフバランスは良くなってますか?日本は改革の話は多いけど変化が遅くて。',
    follow: ["Do your students still work weekends?", "What time does your lab actually go home?"],
    followJa: ['学生さんは今でも週末に研究してますか?', 'キュンドンのラボは実際、何時に帰るんですか?'],
    note: '「うちもダメで…」と自分側の弱みから入ると、相手も本音を話しやすい。説教にならないよう軽く。',
    caution: '相手の労働環境を批判しない。あくまで「お互い大変ですよね」の共感軸で。' },
  { id: 'kr-taboo', cat: 'korea', icon: '⚠️', title: '触れない話題(地雷メモ)',
    opener: "(これは切り出さないためのカード)",
    openerJa: '(これは「話すため」ではなく「避けるため」のカード)',
    follow: ["That's a complicated topic — what do people around you think?",
             "I don't know enough to have an opinion, but I'd love to hear how you see it."],
    followJa: ['(出されたら)難しい問題ですよね — 周りの方はどう考えているんですか?', '意見を持てるほど知らないのですが、あなたの見方をぜひ聞きたいです。'],
    note: '日韓の歴史問題・兵役・南北関係・国内政治は自分からは出さない。相手が出したら「意見を言う」のではなく「聞き役」に回るのがこの2文。',
    caution: '⚠️ 自分から出さない: 歴史問題 / 兵役 / 南北関係 / 韓国の国内政治' },

  /* ================= 🇯🇵 日本紹介 (8) ================= */
  { id: 'jp-recommend', cat: 'japan', icon: '🗾', title: '「日本のおすすめは?」への鉄板回答',
    opener: "Everyone says Kyoto, and Kyoto is great — but if you've already seen it, my personal pick is Kanazawa: Kyoto's atmosphere, one-tenth of the crowds.",
    openerJa: 'みんな京都と言うし京都は素晴らしい — でももう行ったなら、私のおすすめは金沢です。京都の風情で、人混みは10分の1。',
    follow: ["Are you a food traveler or a temple traveler? The answer changes my recommendation.",
             "When your family visited Japan, what did your kids like most?"],
    followJa: ['旅では食べ物派?お寺派?答えでおすすめが変わります。', '(キュンドンに)ご家族で日本に来たとき、お子さんは何が一番気に入ってました?'],
    note: '「定番+自分だけの一押し」の2段構えが会話を生む。キュンドンは1-2年前に家族で来日済みなので、その思い出に接続できる。' },
  { id: 'jp-onsen', cat: 'japan', icon: '♨️', title: '温泉を布教する',
    opener: "You haven't experienced Japan until a monkey has watched you take a bath in the snow. I'm only half joking — snow-monkey onsens exist.",
    openerJa: '雪の中で猿に入浴を見られて初めて日本を体験したと言えます。半分冗談ですが — 実際、野生の猿が来る雪見温泉があるんです。',
    follow: ["Is public bathing culture a thing in Korea too? I heard jjimjilbang is similar.",
             "Would your kids find it fun or terrifying?"],
    followJa: ['韓国にも銭湯文化はありますよね?チムジルバンが近いと聞きました。', 'お子さんは喜びそう?それとも怖がりそう?'],
    note: '絵が浮かぶ話は強い。「猿が見てる」で笑いを取り、チムジルバンで相手の文化に返す往復ができる。',
    ko: { t: '찜질방', k: 'チムジルバン', ja: '(韓国式サウナ)' } },
  { id: 'jp-seasons', cat: 'japan', icon: '🍁', title: '季節で誘う',
    opener: "If you visit our lab again, come in late November — the campus turns completely red and gold. I'll schedule the seminar around the maple trees.",
    openerJa: 'またうちの研究室に来るなら11月末がいいですよ — キャンパスが紅葉で真っ赤になります。セミナーの日程は紅葉に合わせて組みます。',
    follow: ["Which season did you get when your family visited?",
             "Korea's autumn is famous too, right? Where should I see it?"],
    followJa: ['ご家族で来たときはどの季節でした?', '韓国の秋も有名ですよね?どこで見るべきですか?'],
    note: '「また来て」の招待+具体的な絵+ジョークの三点セット。前回の来日の思い出→次回の約束、という未来の話に進める。' },
  { id: 'jp-lab-culture', cat: 'japan', icon: '🧪', title: '日本の研究室文化を面白く',
    opener: "In my lab, the most sacred equipment is the rice cooker. Officially it's for making media. Unofficially... well.",
    openerJa: 'うちのラボで一番神聖な装置は炊飯器です。公式には培地用。非公式には…まあ。',
    follow: ["What's the one thing in a Korean lab that would surprise me?",
             "Do your students also disappear during conference lunch talks?"],
    followJa: ['韓国のラボで私が驚くとしたら何ですか?', 'そちらの学生も、学会のランチセミナーになると消えます?'],
    note: 'ラボあるあるは研究者同士の世界共通語。小さな秘密を明かす形の自虐は距離を縮める。' },
  { id: 'jp-claire-life', cat: 'japan', icon: '🏠', title: 'Claireとの日本生活',
    opener: "Claire is learning to live in Japan while I'm learning Cantonese for our wedding — our kitchen conversations are a linguistic experiment.",
    openerJa: 'Claireは日本での暮らしを学び、私は結婚式のために広東語を学んでいて — わが家の台所の会話は言語学の実験場です。',
    follow: ["Your wife moved countries too — what helped her settle in the US back then?",
             "What language do your kids prefer now, Korean or English?"],
    followJa: ['奥様も国を移った経験がありますよね — 当時アメリカに馴染むのに何が助けになりました?', 'お子さんたちは今、韓国語と英語どちらが楽なんですか?'],
    note: '自分の家庭を少し開くと、相手も家族の話をしやすくなる。キュンドン一家の渡米・帰国経験と自然に響き合う。' },
  { id: 'jp-food-secret', cat: 'japan', icon: '🍣', title: '日本の食の「本当のところ」',
    opener: "Here's a secret: Japanese people don't eat sushi every week. My actual soul food is curry rice — Japanese curry, which would horrify anyone from India.",
    openerJa: '秘密を教えますね。日本人は毎週寿司なんて食べません。私のソウルフードはカレーライス — インドの人が卒倒する日本式カレーです。',
    follow: ["What's the Korean equivalent — the food you actually eat on a random Tuesday?",
             "What Japanese food disappointed you when you finally tried it?"],
    followJa: ['韓国での「何でもない火曜日に食べるもの」は何ですか?', '実際に食べてがっかりした日本食ってあります?'],
    note: '観光イメージを自分で裏切ると本音トークの空気になる。「がっかりした日本食」は笑いが起きやすい勇気ある質問。' },
  { id: 'jp-transport', cat: 'japan', icon: '🚄', title: '新幹線と定時文化',
    opener: "You know the famous story — a Japanese railway once apologized publicly because a train left 25 seconds early. We have... issues.",
    openerJa: '有名な話ですが — 日本の鉄道会社は電車が25秒早く出発したことを公式謝罪したことがあります。我々には…こだわりがあるんです。',
    follow: ["How do people in Korea feel about the KTX? Is it a source of pride like the Shinkansen?",
             "What's the most 'Korean' thing about how people commute here?"],
    followJa: ['韓国の人はKTXをどう思ってます?新幹線みたいに誇りの対象ですか?', '韓国の通勤で一番「韓国らしい」ところは?'],
    note: '自国の几帳面さを笑いにする自虐は安全で強い。乗り物の話は車中との相性も抜群。' },
  { id: 'jp-invite', cat: 'japan', icon: '🤝', title: '具体的に招待する',
    opener: "I owe you a proper visit. Next time you come, we'll do a real seminar, and then I'm taking your family to a ryokan — my treat, no negotiation.",
    openerJa: '前回のお返しをちゃんとさせてください。次に来るときは正式なセミナーをやって、そのあとご家族を旅館にお連れします — 私のおごり、交渉の余地なしで。',
    follow: ["Do your kids have school holidays in summer or winter? I'll plan around them.",
             "Should I invite Paul too, if he's ever in Asia?"],
    followJa: ['お子さんの学校の休みは夏?冬?それに合わせて計画します。', 'Paulがアジアに来ることがあれば、彼も誘うべきですかね?'],
    note: '"my treat, no negotiation" は角の立たない強い招待の定型。社交辞令で終わらせず日程の話に落とすのがコツ。' },

  /* ================= 🇺🇸 アメリカ・Wistar (6) ================= */
  { id: 'us-wistar-days', cat: 'usa', icon: '🔬', title: 'Wistarの思い出の切り出し',
    opener: "I was thinking on the flight — it's been almost ten years since our condensin-cohesin days at Wistar. Those were good papers, and better times.",
    openerJa: 'フライトで考えてたんですが — Wistarでコンデンシンとコヒーシンをやっていた頃から、もう10年近いんですね。いい論文だったし、それ以上にいい時間でした。',
    follow: ["Do you remember the week we were racing to finish the ChIA-PET analysis? I still have nightmares about it.",
             "What do you miss most about Philadelphia? For me it's the cheesesteaks I said I hated but secretly liked."],
    followJa: ['ChIA-PET解析の追い込みの週を覚えてます?今でも夢に見ますよ。', 'フィラデルフィアで一番恋しいものは?私は「嫌いと言いつつ実は好きだった」チーズステーキです。'],
    note: '共通の過去は最強の資産。「あなたはChIA-PETと実験、私はHi-Cと解析」という分業の思い出は2人だけの物語。Nat Genet 2016とNSMB 2017は誇っていい成果。' },
  { id: 'us-science-now', cat: 'usa', icon: '🧬', title: '研究のいま(発表内容への橋)',
    opener: "My talk tomorrow is actually a direct sequel to our old work — I'm going below the condensin and cohesin domains, down to structures of just a few genes.",
    openerJa: '明日の発表は、実は私たちの昔の仕事の直接の続編なんです — コンデンシン・コヒーシンのドメインよりさらに下、遺伝子数個ぶんの構造まで潜ります。',
    follow: ["When I was preparing it, I kept wondering what you'd say. You always found the weak point in my analysis.",
             "Is your talk related to the Malassezia work? I really enjoyed doing the Hi-C analysis for that one."],
    followJa: ['準備しながら、あなたなら何と言うかずっと考えてました。私の解析の弱点をいつも見つける人だったから。', 'あなたの発表はMalasseziaの続きですか?あのHi-C解析は本当に楽しい仕事でした。'],
    note: '「私たちの仕事の続編」というフレーミングは相手への最大の敬意。mBio 2025(酢酸とクロマチン)を「楽しかった」と言えば共同研究の続きの話にもつながる。' },
  { id: 'us-ebv', cat: 'usa', icon: '🙇', title: 'EBV解析の「宿題」を自分から',
    opener: "Before you bring it up — yes, I still owe you the EBV analysis. It's the longest-running item on my to-do list, and I'm genuinely sorry. Let's talk about how to finally do it.",
    openerJa: 'あなたが切り出す前に言います — ええ、EBV解析の宿題はまだ残ってます。私のToDoリスト最長老です。本当にすみません。どう決着させるか話しましょう。',
    follow: ["Is the project still alive on your side, or did the field move on?",
             "If it's still useful, give me a real deadline this time — I work better with fear."],
    followJa: ['そちらではあのプロジェクトはまだ生きてます?それとも分野が先に進んでしまった?', 'まだ意味があるなら、今度は本物の締切をください — 恐怖があったほうが仕事が早いので。'],
    note: '気まずい借りは相手に触れさせる前に自分から出すと、誠実さ+笑いに変わる。放置ではなく「どう決着させるか」を前向きに提案するのが大人の返し。',
    caution: '謝りすぎて重くしない。1回謝ったら前向きな相談へ。' },
  { id: 'us-move-story', cat: 'usa', icon: '📦', title: '渡米の思い出(相手の物語)',
    opener: "I still remember hearing that you sold everything in Korea and brought your whole life to Philadelphia. Looking back, was that the hardest part, or was it something else?",
    openerJa: '韓国の家を全部処分して、人生ごとフィラデルフィアに持ってきたと聞いたのを今でも覚えています。振り返って、あれが一番大変でした?それとも別の何かが?',
    follow: ["Your wife was a teacher in Korea, right? How did she experience those years?",
             "And then you moved everything back again. Twice in one life is impressive."],
    followJa: ['奥様は韓国で先生をされてたんですよね?あの数年をどう過ごされたんですか?', 'そしてまた全部持って帰った。人生で2回は立派です。'],
    note: '相手の人生の決断を「覚えている」ことを伝えるのは、どんな質問より深い敬意。家族の話は相手が広げたぶんだけ付いていく。' },
  { id: 'us-paul-lab', cat: 'usa', icon: '🏛️', title: 'Paulラボ時代とキャリアの話',
    opener: "Moving to Paul's lab turned out to be a great move for you — from where I sit, it looks like it set up everything you're doing at Chung-Ang now. Do you see it that way too?",
    openerJa: 'Paulのラボへの移籍は結果的に大正解でしたね — 私から見ると、それが今の中央大学での研究全部の土台になったように見えます。ご自身でもそう思います?',
    follow: ["What did you learn from Paul that you now pass to your own students?",
             "Do you two still collaborate?"],
    followJa: ['Paulから学んだことで、いま自分の学生に伝えていることは?', 'Paulとは今も共同研究を?'],
    note: '当時は予算難からの移籍という微妙な経緯 — だからこそ「結果的に良かった」と現在からの肯定で語るのが正解。相手のキャリアを物語として敬う。',
    caution: '移籍の「原因」(予算難)には自分から触れない。触れられたら「あの頃はどこも大変だった」と一般化。' },
  { id: 'us-philly', cat: 'usa', icon: '🔔', title: 'フィラデルフィアあるある',
    opener: "Sometimes I miss Philly — and then I remember trying to park near the Wistar on a Monday morning, and the feeling passes.",
    openerJa: 'たまにフィラデルフィアが恋しくなります — で、月曜朝にWistarの近くに駐車しようとした記憶が蘇って、恋しさが消えます。',
    follow: ["Did you ever take your family to the Rocky steps, or is that tourists-only?",
             "If we both went back for a week, what's the first thing you'd eat?"],
    followJa: ['ご家族をロッキーの階段に連れて行きました?あれは観光客専用?', 'もし2人で1週間戻れるなら、最初に食べるものは?'],
    note: '「恋しい→現実を思い出して終了」の落差ジョークは万国共通。土地の記憶は2人の共有財産。' },

  /* ================= 🎓 アカデミア (6) ================= */
  { id: 'ac-grants', cat: 'academia', icon: '💰', title: '科研費 vs 韓国のグラント',
    opener: "Let me describe Japan's grant system: we call it KAKENHI, the success rate is around 25 percent, and we submit in November to hear back in April. How does Korea compare — better or worse?",
    openerJa: '日本のグラント事情をお話しすると: 科研費といって採択率25%前後、11月に出して結果は4月です。韓国は — マシですか?もっと厳しい?',
    follow: ["Does Korea also have the problem where everyone writes 'AI' in the title to get funded?",
             "How much of your time goes to writing proposals versus actual science?"],
    followJa: ['韓国でも「タイトルにAIと書けば通りやすい」問題はあります?', '提案書書きと実際の研究、時間の配分はどのくらいですか?'],
    note: '数字を2〜3個持っておくと具体的な比較talk になる。グラントの愚痴は世界共通のアイスブレイカー。' },
  { id: 'ac-students', cat: 'academia', icon: '👨‍🎓', title: '学生指導の悩み',
    opener: "Now that you run your own lab — what's harder than you expected? For me, the science was never the hard part. The humans are.",
    openerJa: '自分のラボを持ってみて — 想像より大変だったことは何ですか?私の場合、大変なのは科学ではなくて。人間でした。',
    follow: ["How do you motivate a student who's lost confidence?",
             "Are Korean students changing, like Japanese students are? Less crazy hours, more life?"],
    followJa: ['自信を失った学生をどう立て直します?', '韓国の学生も日本と同じように変わってきてます?無茶をしない、生活を大事にする方向に。'],
    note: 'PI同士の「本音の悩み」相談は一気に距離が縮まる。自分の失敗談を1つ用意しておくと深くなる。' },
  { id: 'ac-publish', cat: 'academia', icon: '📄', title: '論文・査読あるある',
    opener: "I recently got a review that said 'the analysis is sound but the story is not exciting.' I wanted to reply: neither is Reviewer 2, but here we are.",
    openerJa: '最近「解析は正しいがストーリーが面白くない」という査読コメントをもらいました。「Reviewer 2、あなたもです」と返信したかった。',
    follow: ["What's the worst review you've ever received?",
             "Where do you send papers first these days? The journal landscape feels chaotic."],
    followJa: ['今まで受けた最悪の査読コメントは?', '最近、論文はまずどこに出します?ジャーナル情勢が混沌としてきて。'],
    note: 'Reviewer 2ジョークは研究者の世界共通言語。「最悪の査読」は誰もが1つは持っていて必ず盛り上がる。' },
  { id: 'ac-collab', cat: 'academia', icon: '🤝', title: '次の共同研究への布石',
    opener: "The Malassezia Hi-C work reminded me how well our skills still fit together. If you have another dataset like that gathering dust, I'm interested.",
    openerJa: 'MalasseziaのHi-C解析をやって、私たちのスキルが今でも噛み合うことを再確認しました。ああいうデータが眠っているなら、また興味あります。',
    follow: ["What's the project you want to do but can't find the right collaborator for?",
             "Could we co-supervise a student remotely? Japan-Korea is only two hours."],
    followJa: ['「やりたいけど適切な共同研究者がいない」プロジェクトはありますか?', '学生の共同指導をリモートでやれませんかね?日韓は2時間ですし。'],
    note: '実績(mBio 2025)を根拠に次を誘う、車中で最も価値ある10分になりうるカード。EBVの宿題を片付ける宣言とセットだと誠実。' },
  { id: 'ac-jpkr-univ', cat: 'academia', icon: '🏫', title: '日韓の大学比較',
    opener: "Here's something that surprised me: in Japan, professors almost never move between universities. I heard Korean academia is much more mobile. True?",
    openerJa: '驚かれるかもしれませんが、日本では教授はほとんど大学間を移動しないんです。韓国のアカデミアはもっと流動的だと聞きました。本当ですか?',
    follow: ["Is that mobility good for science, or just stressful?",
             "How does Chung-Ang recruit? Could a Japanese researcher realistically get a position in Korea?"],
    followJa: ['その流動性は科学にとって良いこと?それとも単にストレス?', '中央大学の採用はどんな感じですか?日本人研究者が韓国でポジションを得るのは現実的?'],
    note: 'システム比較は知的で安全な鉄板。最後の質問は半分冗談・半分本気の距離感で。' },
  { id: 'ac-symposium', cat: 'academia', icon: '🎤', title: 'Dinnerでホストに(シンポの感想)',
    opener: "Thank you again for today — the symposium had a great atmosphere. Your students' questions were sharper than some reviewers I know.",
    openerJa: '今日は改めてありがとうございました — 素晴らしい雰囲気のシンポジウムでした。学生さんたちの質問、そのへんの査読者より鋭かったですよ。',
    follow: ["How long has this symposium series been running?",
             "Which talk today started the best discussion afterwards?"],
    followJa: ['このシンポジウムシリーズはいつから続いているんですか?', '今日の発表で、そのあと一番議論が盛り上がったのはどれでした?'],
    note: 'Dinner冒頭の定型。ホストの労をねぎらい、学生を褒め、主役を相手に渡す。具体的な発表名を1つ挙げられれば完璧。' },

  /* ================= 🤖 AI (5) ================= */
  { id: 'ai-daily', cat: 'ai', icon: '💻', title: '研究でのAI活用',
    opener: "Confession: half of my analysis scripts are now written with AI. My coding didn't get better — my prompting did. How deep is AI in your lab's workflow?",
    openerJa: '告白すると、私の解析スクリプトの半分は今やAIと書いています。コーディングは上達してません — プロンプトが上達しました。そちらのラボではAIはどこまで浸透してます?',
    follow: ["Do you let students use AI for writing papers? Where do you draw the line?",
             "Has it actually changed what projects you can attempt?"],
    followJa: ['学生に論文執筆でのAI使用を認めてます?線引きはどこに?', '「挑戦できるプロジェクトの幅」自体は変わりました?'],
    note: '自分の使用実態を先に開示すると、ポリシー論ではなく実務の本音トークになる。まさにこのアプリもAIと作った、という鉄板ネタに接続可能。' },
  { id: 'ai-thisapp', cat: 'ai', icon: '📱', title: 'このアプリ自体をネタにする',
    opener: "Fun fact: I practiced this exact conversation with an app I built together with an AI. It has a mode where a virtual you picks me up at the hotel.",
    openerJa: '面白い話をひとつ: 実はこの会話、AIと一緒に作った自作アプリで練習してきました。バーチャルなあなたがホテルに迎えに来るモードがあるんです。',
    follow: ["Want to see it? Your virtual self is a safer driver.",
             "I made it to learn Korean and Cantonese for the wedding — language apps never fit my exact life, so I built one that does."],
    followJa: ['見ます?バーチャルなあなたのほうが運転は安全ですよ。', '結婚式のために韓国語と広東語を学ぼうと作りました — 既製の語学アプリは自分の人生に合わないので、合うものを作ったんです。'],
    note: '最強の実話ネタ。自己開示+笑い+AI時代の生き方の話が一度にできる。実物を見せれば10分は持つ。',
    caution: '練習してきたことを明かすのは相手への好意が伝わる範囲で。やりすぎると準備魔に見えるので軽く。' },
  { id: 'ai-alphafold', cat: 'ai', icon: '🧬', title: 'AIは生物学をどう変えるか',
    opener: "Structure prediction fell to AI. Sometimes I wonder what falls next — will genome architecture be predictable from sequence before we retire?",
    openerJa: '構造予測はAIに陥落しました。次は何が落ちるのか — 我々が引退する前に、ゲノムの立体構造も配列から予測できるようになりますかね?',
    follow: ["If AI could predict your Hi-C maps, what would you do instead?",
             "What part of our work do you think is safe for another twenty years?"],
    followJa: ['もしAIがHi-Cマップを予測できたら、代わりに何をします?', '私たちの仕事のうち、あと20年は安泰な部分はどこだと思います?'],
    note: '専門(3Dゲノム)とAIを重ねた2人専用の未来talk。悲観ではなく「次に何をやるか」のワクワク方向へ。' },
  { id: 'ai-fear', cat: 'ai', icon: '😅', title: 'AIジョーク(仕事を取られる?)',
    opener: "My students asked if AI will take their jobs. I told them the truth: AI can't attend faculty meetings for me yet, so I'm keeping mine.",
    openerJa: '学生に「AIに仕事を取られますか」と聞かれました。真実を答えましたよ: AIはまだ私の代わりに教授会に出られない。だから私の職は安泰だと。',
    follow: ["What's the most useless meeting you're required to attend?",
             "Which would you automate first: grant writing, reviewing, or committees?"],
    followJa: ['出席必須の会議で一番不毛なのは?', 'グラント書き・査読・委員会 — 最初に自動化するなら?'],
    note: '教授会ジョークは全世界のPIに刺さる。愚痴を笑いに変換する安全な形。' },
  { id: 'ai-kids', cat: 'ai', icon: '👶', title: 'AI時代の子育て・教育',
    opener: "Your kids are growing up with AI the way we grew up with the internet. Do you push them toward it, or protect them from it?",
    openerJa: 'お子さんたちは、私たちがインターネットと育ったようにAIと育ちますね。積極的に触れさせてます?それとも遠ざけてます?',
    follow: ["Do their schools in Korea have a policy on AI homework?",
             "What skill do you tell them will still matter in twenty years?"],
    followJa: ['韓国の学校はAI宿題のポリシーってあるんですか?', '「20年後も価値がある力」として、何を教えてます?'],
    note: '親としてのキュンドンに話を渡せるカード。教育熱の高い韓国では特に乗ってきやすいテーマ。' },

  /* ================= 😄 笑い (4) ================= */
  { id: 'hu-korean-fail', cat: 'humor', icon: '🙃', title: '韓国語の失敗談(自虐)',
    opener: "My Korean has already caused one incident: I meant to say 'thank you' to a taxi driver and apparently wished him a good harvest. He was very confused.",
    openerJa: '私の韓国語はすでに1件の事故を起こしています。タクシーの運転手さんに「ありがとう」と言ったつもりが、どうやら豊作を祈っていたらしく。ものすごく困惑されました。',
    follow: ["Please teach me one phrase that's impossible for foreigners to get wrong.",
             "What's the funniest Korean mistake you've heard a foreigner make?"],
    followJa: ['外国人でも絶対に間違えようがないフレーズを1つ教えてください。', '外国人の韓国語で、今まで聞いた一番面白い間違いは?'],
    note: '語学の失敗自虐は100%安全な笑い。実際の失敗が起きたら、その場でこの型に流し込めば事故がネタに変わる。' },
  { id: 'hu-jetlag', cat: 'humor', icon: '😪', title: '学会あるある(自虐)',
    opener: "Conference rule number one: the quality of my questions is inversely proportional to how good the banquet was the night before. Today I may only nod.",
    openerJa: '学会の法則その1: 私の質問の質は、前夜の懇親会の充実度に反比例します。今日はうなずくだけかもしれません。',
    follow: ["What's your survival strategy for afternoon sessions?",
             "Have you ever fallen asleep in a talk and woken up to applause?"],
    followJa: ['午後のセッションを生き延びる戦略は?', '講演中に寝落ちして、拍手で目が覚めたことあります?'],
    note: '誰も傷つかない学会自虐。車中の朝(懇親会翌日!)に使うと状況とシンクロして効く。' },
  { id: 'hu-quiet-jp', cat: 'humor', icon: '🤫', title: '「日本人は静かすぎる」を先回り',
    opener: "I'll apologize in advance: I'm Japanese, so if I go quiet, I'm not bored — I'm composing a grammatically perfect English sentence. It should be ready in about four minutes.",
    openerJa: '先に謝っておきます。私は日本人なので、静かになっても退屈しているわけではありません — 文法的に完璧な英文を組み立て中なんです。あと4分ほどで完成します。',
    follow: ["Is there a Korean equivalent of this? Some habit foreigners misread?",
             "Feel free to interrupt my sentence-construction anytime."],
    followJa: ['韓国にも、外国人に誤解されがちな習慣ってあります?', '文章組み立て中でも遠慮なく割り込んでください。'],
    note: '自分の弱点(沈黙)を先にネタ化しておくと、実際に沈黙が起きたときに全員が笑って済む保険になる。雑談モードの思想そのもの。' },
  { id: 'hu-navigation', cat: 'humor', icon: '🗺️', title: '車内の小ネタ(ナビ・運転)',
    opener: "Your navigation speaks Korean faster than anyone I've met. I caught exactly one word — I think it was 'right'. Or possibly 'rice'.",
    openerJa: 'このカーナビ、私が出会った誰よりも速い韓国語を話しますね。聞き取れた単語はちょうど1つ — たぶん「右」。もしかすると「ご飯」。',
    follow: ["How do you say 'turn right' in Korean? Let me be your backup navigator.",
             "Does the GPS ever lose to your local shortcuts?"],
    followJa: ['「右に曲がる」は韓国語で何て言うんですか?予備ナビを務めます。', 'GPSがあなたの地元の抜け道に負けることは?'],
    note: '車内の「いま起きていること」から拾う即席ネタの型。聞き間違い自虐+ミニ韓国語レッスン誘発の二段構え。' },

  /* ================= 📰 時事 (5) — 2026年8月リサーチ。古くなったら更新 ================= */
  { id: 'nw-us-science', cat: 'news', icon: '🏛️', title: '米国の科学予算の混乱',
    opener: "We've all been watching the US funding situation — the proposed NIH cuts, courts pushing back. You have friends in Paul's lab still. How are they holding up?",
    openerJa: '米国の研究費情勢はみんな注視してますよね — NIH予算の大幅削減案、司法の差し戻し。Paulのラボにまだ友人がいるでしょう。皆さんどうしてます?',
    follow: ["Is Korea seeing more applicants from US-based researchers now?",
             "Would you go back to the US in this climate, or is that chapter closed?"],
    followJa: ['いま韓国には、米国からの研究者の応募が増えてたりします?', 'この情勢でもアメリカに戻ります?それとももう閉じた章?'],
    note: '2026年: トランプ政権のNIH/NSF大幅削減案は議会・裁判所が概ね阻止したが混乱は続く。政治論ではなく「共通の友人の安否」から入るのが安全で温かい。',
    caution: 'トランプ個人の評価は言わない。「研究への影響」と「人」の話に限定。' },
  { id: 'nw-naphtha', cat: 'news', icon: '🛢️', title: 'ナフサ危機と日韓の産業',
    opener: "Japan's chemical industry is having a rough year — the naphtha crisis after the Hormuz disruption hit us hard. Korea's petrochemical sector was already restructuring, right? How is it looking from your side?",
    openerJa: '日本の化学産業は今年苦しくて — ホルムズ海峡の混乱以来のナフサ危機が直撃です。韓国の石油化学はもともと構造改革中でしたよね?そちらから見てどうですか?',
    follow: ["Does this reach everyday life in Korea — prices, plastics — or is it still an industry story?",
             "Funny how two neighbors both import almost everything and never coordinate. Should we?"],
    followJa: ['これは韓国の日常 — 物価やプラ製品 — まで届いてます?まだ産業界の話?', '隣国同士どちらも輸入頼みなのに連携しないのは不思議ですね。すべきでは?'],
    note: '2026年: 2月のホルムズ海峡封鎖で中東ナフサが途絶、価格が約2倍、日本は代替調達を米国に拡大中。数字を1つ(「価格ほぼ倍」)言えると具体的。意見ではなく「そちらではどう?」の型。' },
  { id: 'nw-kr-invest', cat: 'news', icon: '💎', title: '韓国の産業政策(明るい時事)',
    opener: "I read Korea just unlocked a few billion dollars for semiconductors and biotech. As a scientist, do you actually feel that money, or does it evaporate before reaching the bench?",
    openerJa: '韓国が半導体・バイオに数十億ドル規模の投資を解禁したと読みました。研究者として、そのお金は実感できるものですか?それともベンチに届く前に蒸発します?',
    follow: ["Which field in Korea feels the momentum right now?",
             "Japan announces similar packages — and we joke that the paperwork costs half the budget."],
    followJa: ['いま韓国で勢いを感じる分野はどこですか?', '日本も似た政策を発表しますが「書類仕事で予算の半分が消える」というジョークがあります。'],
    note: '2026年8月: 韓国政府が半導体・電池・バイオ向け大型投資の規制緩和を発表。明るい時事は安全。「現場に届くか」という研究者目線の問いが会話を本音にする。' },
  { id: 'nw-exchange', cat: 'news', icon: '💱', title: '円安・物価(旅行者の実感)',
    opener: "The weak yen makes me a cheap date abroad — everything in Seoul feels expensive to me now. Is Korea feeling inflation too, or is that just my Japanese wallet?",
    openerJa: '円安のせいで海外では安上がりな人間になりました — 今やソウルの物価が全部高く感じます。韓国もインフレを実感してます?それとも私の日本人財布だけの問題?',
    follow: ["What do Koreans complain about most — food prices, housing, or something else?",
             "Where do Koreans travel now that everything is expensive? Japan, ironically?"],
    followJa: ['韓国の人が一番こぼしてるのは何ですか — 食品価格?住宅?別のもの?', '物価高のいま、韓国の人はどこへ旅行してるんです?皮肉にも日本?'],
    note: '自分の財布の自虐から入る経済talk は誰も傷つけない。「韓国人の日本旅行ブーム」に落ちると日本紹介ネタに接続できる。' },
  { id: 'nw-fresh', cat: 'news', icon: '📲', title: '当日の鮮度はAIで(運用メモ)',
    opener: "(前日の夜にやること) 生成AIに「明日、韓国人研究者との雑談で使える今週のニュース3つ。安全で明るいもの。英語の切り出し文つき」と頼む。",
    openerJa: '(これはカードではなく運用メモ)',
    follow: ["I saw an interesting piece of news this morning — can I test my understanding on you?",
             "You probably know more about this than the article did."],
    followJa: ['(入手したネタの使い方)今朝面白いニュースを見たんですが — 私の理解が合ってるか試させてください。', 'この件、記事よりあなたのほうが詳しいでしょう。'],
    note: '時事カードは仕込み時点で必ず古くなる。本番前夜にAIで3つ補充するのが正しい運用。「教えてもらう」型なら知識が浅くても会話になる。' },

  /* ================= 💑 Claire紹介 (3) ================= */
  { id: 'cl-intro', cat: 'claire', icon: '💑', title: '基本の紹介',
    opener: "Kyoung-Dong, this is Claire, my partner — we're getting married in January. Claire, this is the man who did all the experiments while I hid behind a computer.",
    openerJa: 'キュンドン、こちらClaire、私のパートナーです — 1月に結婚します。Claire、こちらが「私がコンピュータの後ろに隠れている間に実験を全部やってくれた」人です。',
    follow: ["She's from Hong Kong — so between us we have Japanese, Korean, Cantonese and English in one car.",
             "Claire has heard all my Wistar stories, so please correct my exaggerations."],
    followJa: ['彼女は香港出身 — つまりこの車には日本語・韓国語・広東語・英語が揃ってます。', 'ClaireはWistar話を全部聞かされているので、私の誇張を訂正してやってください。'],
    note: '紹介は「両方向」が鉄則: 相手にClaireを、Claireに相手を、それぞれ一言の物語付きで。実験/解析の分業ネタは2人の関係を1文で伝える。' },
  { id: 'cl-involve', cat: 'claire', icon: '🎤', title: '会話に巻き込む',
    opener: "Claire actually knows more about Korean culture than I do — she's the reason our home has better kimchi than most restaurants in Japan.",
    openerJa: '韓国文化については実はClaireのほうが詳しいんです — わが家のキムチが日本の大抵の店より旨いのは彼女のおかげです。',
    follow: ["Claire, tell them what you thought when I started practicing Korean at home.",
             "She's the strict judge of my Cantonese — Kyoung-Dong, you can be the judge of my Korean."],
    followJa: ['Claire、私が家で韓国語の練習を始めたときの感想をどうぞ。', '広東語の審査員はClaire — キュンドン、韓国語の審査員はあなたでお願いします。'],
    note: '同乗者が長時間黙る状況を作らないのがホストの器。「Claireに話を振る一文」を最低3回は使う意識で。審査員ジョークは車内の共通ゲームになる。' },
  { id: 'cl-wedding', cat: 'claire', icon: '💒', title: '結婚式の話でつなぐ',
    opener: "The wedding is in Hong Kong in January. I'm giving a short speech in Cantonese — my third language attempt this year. Pray for me.",
    openerJa: '式は1月に香港で挙げます。私は広東語で短いスピーチをする予定 — 今年3つ目の言語挑戦です。祈っていてください。',
    follow: ["How were weddings in Korea when you got married? I hear the whole thing takes thirty minutes.",
             "Any advice from a married man of many years? Claire is taking notes."],
    followJa: ['キュンドンが結婚した頃の韓国の式はどうでした?全部で30分と聞きますが本当?', '結婚の先輩として助言があれば。Claireがメモを取ります。'],
    note: '結婚報告は相手の結婚式・家族の話への最高のパス。「先輩として助言を」は年上の既婚者が最も気持ちよく話せる振り。' }
];

/* ---------- ネタ帳UI ---------- */
const Topics = {
  FAV_KEY: 'lq_topic_favs',
  favs() {
    try { return new Set(JSON.parse(localStorage.getItem(this.FAV_KEY) || '[]')); }
    catch (_) { return new Set(); }
  },
  saveFavs(set) { localStorage.setItem(this.FAV_KEY, JSON.stringify([...set])); },
  isFav(id) { return this.favs().has(id); },
  toggleFav(id) {
    const f = this.favs();
    if (f.has(id)) f.delete(id); else f.add(id);
    this.saveFavs(f);
    return f.has(id);
  },

  /** 今日の3ネタ: 日付から決定的に選ぶ(同じ日は同じ3枚) */
  todaysPicks(now) {
    const key = (typeof localDayKey === 'function') ? localDayKey(now) : String(now || '');
    let seed = 0;
    for (const ch of key) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
    const pool = TOPIC_DECK.filter((c) => c.cat !== 'claire' && !c.caution);
    const picks = [];
    const used = new Set();
    while (picks.length < Math.min(3, pool.length)) {
      seed = (seed * 1103515245 + 12345) >>> 0;
      const i = seed % pool.length;
      if (used.has(i)) continue;
      used.add(i);
      picks.push(pool[i]);
    }
    return picks;
  },

  READ_KEY: 'lq_topic_read',
  reads() {
    try { return new Set(JSON.parse(localStorage.getItem(this.READ_KEY) || '[]')); }
    catch (_) { return new Set(); }
  },
  isRead(id) { return this.reads().has(id); },
  markRead(id) {
    const r = this.reads();
    if (r.has(id)) return false;
    r.add(id);
    localStorage.setItem(this.READ_KEY, JSON.stringify([...r]));
    return true;
  },

  /** 今日のクエスト対象カードID(なければnull) */
  questTarget() {
    if (typeof Quests === 'undefined') return null;
    const d = Quests.data();
    if (d.done['topic-read'] || d.ready['topic-read']) return null;   // 達成済みなら強調しない
    return (d.vary || {}).topic || null;
  },

  /** カードを開いたときの処理: 読了記録+クエスト判定 */
  onCardOpened(id) {
    this.markRead(id);
    if (typeof Quests !== 'undefined') {
      const v = Quests.data().vary || {};
      if (v.topic === id) Quests.tryComplete('topic-read');
    }
  },

  /** クエスト画面などから特定カードへジャンプして開く */
  focusCard(id) {
    this.cat = 'all';
    this.render();
    const card = document.querySelector(`[data-topic-id="${id}"]`);
    if (!card) return;
    card.open = true;
    this.onCardOpened(id);
    try { card.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (_) { /* 古い端末 */ }
  },

  cat: 'all',   // 表示中カテゴリ('all' | 'fav' | catキー)

  render() {
    const el = document.getElementById('topics-content');
    if (!el) return;
    const favs = this.favs();
    const cards = this.cat === 'fav'
      ? TOPIC_DECK.filter((c) => favs.has(c.id))
      : this.cat === 'all' ? TOPIC_DECK
      : TOPIC_DECK.filter((c) => c.cat === this.cat);

    const picks = this.todaysPicks();
    const readCount = this.reads().size;
    el.innerHTML = `
      <p class="field-note" style="margin-bottom:10px">
        各ネタは「切り出し(opener)→深掘り(follow)」の会話設計図です。🔊で発音を確認、⭐で持ちネタに追加。
        <span class="topic-progress">📖 読了 ${readCount}/${TOPIC_DECK.length}</span>
      </p>
      ${this.cat === 'all' && typeof SMALLTALK_SCENARIOS !== 'undefined' ? `
        <button class="btn-large" id="btn-topics-scenarios" style="margin-bottom:12px">
          🎭 シナリオで実戦練習(車中2時間・懇親会・Dinner)
        </button>` : ''}
      ${this.cat === 'all' ? `
        <h3 class="about-section">🎲 今日の3ネタ</h3>
        <p class="field-note" style="margin-bottom:8px">毎日変わります。1日1ネタ、音読してから出かけましょう</p>
        ${picks.map((c) => this.cardHtml(c, favs)).join('')}
        <h3 class="about-section">📚 すべてのネタ</h3>` : ''}
      ${this.cat === 'fav' && !cards.length
        ? '<p class="field-note">まだ持ちネタがありません。カードの⭐を押して集めましょう。当日の朝はこのリストだけ見返せばOK。</p>' : ''}
      ${cards.map((c) => this.cardHtml(c, favs)).join('')}`;

    // タブ
    const tabs = document.getElementById('topics-tabs');
    if (tabs) {
      const favCount = favs.size;
      tabs.innerHTML = `
        <button class="learn-tab ${this.cat === 'all' ? 'active' : ''}" data-topic-cat="all">🚗 全部</button>
        <button class="learn-tab ${this.cat === 'fav' ? 'active' : ''}" data-topic-cat="fav">⭐ 持ちネタ${favCount ? `(${favCount})` : ''}</button>
        ${Object.entries(TOPIC_CATS).map(([k, m]) =>
          `<button class="learn-tab ${this.cat === k ? 'active' : ''}" data-topic-cat="${k}">${m.icon} ${m.label}</button>`).join('')}`;
      tabs.querySelectorAll('[data-topic-cat]').forEach((b) =>
        b.addEventListener('click', () => { this.cat = b.dataset.topicCat; this.render(); }));
    }

    // カード内のボタン
    el.querySelectorAll('[data-topic-fav]').forEach((b) =>
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        const on = this.toggleFav(b.dataset.topicFav);
        b.textContent = on ? '⭐' : '☆';
        if (typeof showToast === 'function') showToast(on ? '⭐ 持ちネタに追加しました' : '持ちネタから外しました');
        if (this.cat === 'fav' && !on) this.render();
      }));
    el.querySelectorAll('details.topic-card[data-topic-id]').forEach((dt) =>
      dt.addEventListener('toggle', () => {
        if (dt.open) this.onCardOpened(dt.dataset.topicId);
      }));
    const scenBtn = el.querySelector('#btn-topics-scenarios');
    if (scenBtn) scenBtn.addEventListener('click', () => {
      if (typeof showScreen === 'function') showScreen('convo-list');
    });
    el.querySelectorAll('[data-topic-say]').forEach((b) =>
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        if (typeof LangHelp !== 'undefined') LangHelp.speakMany([b.dataset.topicSay]);
      }));
  },

  cardHtml(c, favs) {
    const cat = TOPIC_CATS[c.cat];
    const fav = favs.has(c.id);
    const read = this.isRead(c.id);
    const isQuest = this.questTarget() === c.id;
    return `
      <details class="topic-card ${isQuest ? 'quest-target' : ''}" data-topic-id="${c.id}">
        <summary>
          <span class="topic-icon">${c.icon}</span>
          <span class="topic-title"><strong>${read ? '✓ ' : ''}${c.title}</strong>
            <span class="field-note">${isQuest ? '🎯 今日のクエスト対象! ・ ' : ''}${cat.icon} ${cat.label}${c.caution ? ' ・ ⚠️注意あり' : ''}</span></span>
          <button class="topic-fav" data-topic-fav="${c.id}">${fav ? '⭐' : '☆'}</button>
        </summary>
        <div class="topic-body">
          <div class="topic-opener">
            <p class="topic-en">${c.opener}</p>
            <p class="topic-ja">${c.openerJa}</p>
            ${c.opener.startsWith('(') ? '' : `<button class="btn-control" data-topic-say="${c.opener.replace(/"/g, '&quot;')}">🔊 切り出しを聞く</button>`}
          </div>
          <p class="topic-label">↳ 深掘り(相手が答えたら)</p>
          ${c.follow.map((f, i) => `
            <div class="topic-follow">
              <p class="topic-en">${f}</p>
              <p class="topic-ja">${c.followJa[i] || ''}</p>
            </div>`).join('')}
          ${c.ko ? `
            <div class="topic-ko">
              <span>🇰🇷 混ぜるならこの一言: <strong>${c.ko.t}</strong>(${c.ko.k})= ${c.ko.ja}</span>
              <button class="btn-control" data-topic-say="${c.ko.t}">🔊</button>
            </div>` : ''}
          <p class="topic-note">💡 ${c.note}</p>
          ${c.caution ? `<p class="topic-caution">⚠️ ${c.caution}</p>` : ''}
        </div>
      </details>`;
  }
};
