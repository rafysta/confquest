/* ConfQuest - 🤖 AI自由会話シミュレータ (雑談クエスト Phase 3)
 * AIが実在の場面の相手を演じ、自由な英語入力で会話を練習する。3場面:
 *   🚗 ドライブ(Kyoung-Dongの車でソウル→安城) / 🍻 ISSY39懇親会(初対面) / 🍽️ シンポ後のDinner(ホスト陣)
 * 依存: AI.chat(ai.js) / TOPIC_DECK・Topics(topics.js) / Stats(convo.js) / Gami(app.js)
 *       renderMarkdown・escapeHtml・showScreen・showToast・aiErrorText(app.js) / Achievements(progress.js)
 * APIキー(設定画面)が必要。会話履歴はセッション内のみ、完走記録はlq_drive_historyに保存。
 */
'use strict';

/** 🚗 ドライブの行程。progress(0〜1)がatを超えると次のステージに進む */
const DRIVE_STAGES = [
  { at: 0.00, icon: '🏨', label: 'Koreana Hotel 出発',
    scene: 'Just leaving Koreana Hotel in central Seoul. Morning traffic near Gwanghwamun; palace walls and glass towers.' },
  { at: 0.15, icon: '🌉', label: '漢江を渡る',
    scene: 'Crossing the Han River on a big bridge. Wide water, rows of high-rise apartment complexes on both banks.' },
  { at: 0.30, icon: '🛣️', label: '京釜高速道路',
    scene: 'On the Gyeongbu Expressway heading south. Endless apartment blocks thinning out, big green road signs (Suwon / Daejeon).' },
  { at: 0.50, icon: '☕', label: '휴게소(休憩所)',
    scene: 'Stopping briefly at a highway rest area (hyugeso). Famous snacks: hotteok, walnut cakes, fish cake skewers, coffee.' },
  { at: 0.70, icon: '🌾', label: '京畿道の田園',
    scene: 'Back on the road. Rice fields, greenhouses and low hills of rural Gyeonggi-do. The drive is calm now.' },
  { at: 0.90, icon: '🏫', label: '安城市内',
    scene: 'Entering Anseong. Local streets, almost at Chung-Ang University\'s Anseong campus.' },
  { at: 1.00, icon: '🎓', label: 'Chung-Ang University 到着', scene: 'Arriving at the campus parking lot.' }
];

/** 🍻 懇親会の流れ */
const BANQUET_STAGES = [
  { at: 0.00, icon: '🥂', label: '開宴・乾杯',
    scene: 'The ISSY39 banquet has just started in a hotel ballroom in Seoul. The opening toast is done; people pick up plates and start mingling.' },
  { at: 0.25, icon: '🍽️', label: '料理コーナー',
    scene: 'At the buffet line. Korean dishes: japchae, bulgogi, tteok — and hongeo-hoe (fermented skate), the famous dare among foreign guests.' },
  { at: 0.50, icon: '👥', label: '歓談の輪',
    scene: 'Small circles of researchers chatting. A nearby group is discussing yeast genomics and tomorrow\'s sessions.' },
  { at: 0.75, icon: '🍰', label: 'デザート',
    scene: 'Dessert and coffee. The mood is relaxed; people start exchanging contacts.' },
  { at: 1.00, icon: '👋', label: 'おひらき', scene: 'The banquet is wrapping up.' }
];

/** 🍽️ Dinnerの流れ */
const DINNER_STAGES = [
  { at: 0.00, icon: '🥂', label: '着席・乾杯',
    scene: 'A private dinner room near Chung-Ang University, right after the symposium. Prof. Lee welcomes everyone with a short toast (건배!).' },
  { at: 0.25, icon: '🦀', label: '前菜',
    scene: 'Ganjang-gejang (soy-marinated raw crab) is served — the famous "rice thief" (밥도둑).' },
  { at: 0.50, icon: '🍲', label: 'メイン',
    scene: 'Main dishes arrive: grilled fish, bulgogi and a table full of banchan.' },
  { at: 0.75, icon: '☕', label: '食後',
    scene: 'Tea and fruit. The conversation becomes more personal and relaxed.' },
  { at: 1.00, icon: '🙇', label: 'お見送り', scene: 'The dinner is ending; the hosts walk you out.' }
];

/** 場面の定義。ペルソナ本文は Drive.personaFor() にある */
const SIM_SCENES = {
  drive: {
    icon: '🚗', name: 'ソウルからの2時間ドライブ',
    desc: 'Kyoung-Dongの車でソウル→安城。旧交を温めつつ、沈黙を自分の話題で立て直す',
    partner: 'KD', partnerJa: '元同僚のKyoung-Dong',
    stages: DRIVE_STAGES,
    goals: { short: 10, full: 20 },
    passengerOption: true,
    focus: ['network', 'english'],
    sceneJa: '韓国人の元同僚Kyoung-Dong(KD)の車で、ソウルから安城まで約2時間のドライブ',
    arriveText: 'You are NOW ARRIVING at Chung-Ang University: in THIS reply, wrap up warmly (thank them for the great conversation, say you\'re looking forward to the symposium and dinner). End the drive.'
  },
  banquet: {
    icon: '🍻', name: 'ISSY39懇親会',
    desc: '立食パーティで初対面のDr. Novakと。切り出し→深掘り→締めくくりの練習',
    partner: 'Dr. Novak', partnerJa: '初対面のDr. Novak',
    stages: BANQUET_STAGES,
    goals: { short: 6, full: 12 },
    passengerOption: false,
    focus: ['network', 'confidence'],
    sceneJa: 'ISSY39の懇親会(立食)で、初対面の研究者Dr. Novakとの雑談',
    arriveText: 'The banquet is NOW ENDING: in THIS reply, wrap up warmly — say you really enjoyed the conversation, suggest exchanging contacts, and mention seeing him at tomorrow\'s session.'
  },
  dinner: {
    icon: '🍽️', name: 'シンポ後のDinner',
    desc: 'ホストのProf. LeeとKyoung-Dongに囲まれた着席の会食。感謝と話題の持続',
    partner: 'Prof. Lee', partnerJa: 'ホストのProf. Lee',
    stages: DINNER_STAGES,
    goals: { short: 8, full: 14 },
    passengerOption: false,
    focus: ['topic', 'english'],
    sceneJa: 'シンポジウム後、ホストのProf. LeeとKyoung-Dongを交えた会食',
    arriveText: 'The dinner is NOW ENDING: in THIS reply, give a warm closing — thank Hideki for his talk and for coming all the way, propose a final short toast, and see them off.'
  }
};

const Drive = {
  state: null,          // { scene, mode, goal, passenger, userTurns, messages, over, busy }
  _newsCache: null,     // 📰時事ネタ(セッション内キャッシュ)
  _pickScene: 'drive',  // セットアップ画面で選択中の場面

  /* ================= 画面 ================= */

  render() {
    const el = document.getElementById('drive-content');
    if (!el) return;
    if (this.state && !this.state.over) { this.renderPlay(false); return; }
    this.renderSetup();
  },

  renderSetup() {
    const el = document.getElementById('drive-content');
    const hist = this.history();
    const sc = SIM_SCENES[this._pickScene] || SIM_SCENES.drive;
    el.innerHTML = `
      <div class="drive-setup">
        <p class="field-note" style="margin-bottom:10px">
          AIが相手役になります。英語で自由に話して、実際の場面を乗り切りましょう。
          詰まったら🆘でネタ帳を開けます。
        </p>
        <div class="sim-scene-list">
          ${Object.entries(SIM_SCENES).map(([id, s]) => {
            const done = hist.filter((h) => (h.scene || 'drive') === id && h.completed).length;
            return `<button class="drive-topic-row sim-scene ${id === this._pickScene ? 'selected' : ''}" data-sim-scene="${id}">
              <span>${s.icon} ${escapeHtml(s.name)}${done ? ` <span class="sim-done">✓完走${done}</span>` : ''}</span>
              <span class="field-note">${escapeHtml(s.desc)}</span>
            </button>`;
          }).join('')}
        </div>
        <div class="field">
          <span>会話の長さ</span>
          <select id="drive-mode">
            <option value="short">☕ ショート(${sc.goals.short}往復 — まず慣れる)</option>
            <option value="full">🎓 フル(${sc.goals.full}往復 — 本番想定)</option>
          </select>
        </div>
        ${sc.passengerOption ? `
        <label class="drive-passenger-row">
          <input type="checkbox" id="drive-passenger">
          <span>👥 同乗者あり(初対面のDr. Parkも乗せる — 難易度アップ)</span>
        </label>` : ''}
        <button class="btn-large primary" id="btn-drive-start">${sc.icon} この場面で始める</button>
        <p class="field-note" style="margin-top:8px">
          ※ AI APIを使います(1回数十円程度)。設定画面のAPIキーが必要です。
        </p>
        ${hist.length ? `
          <h3 class="about-section">これまでの記録</h3>
          ${hist.slice(0, 6).map((h) => {
            const hs = SIM_SCENES[h.scene || 'drive'] || SIM_SCENES.drive;
            return `<p class="field-note">${h.date.slice(0, 10)} — ${hs.icon}${escapeHtml(hs.name)} ・ ${h.mode === 'full' ? 'フル' : 'ショート'}
              ${h.completed ? '完走' : `${h.userTurns}往復で終了`}${h.passenger ? '・👥同乗者' : ''}</p>`;
          }).join('')}
        ` : ''}
      </div>`;
    el.querySelectorAll('[data-sim-scene]').forEach((b) =>
      b.addEventListener('click', () => {
        this._pickScene = b.dataset.simScene;
        this.renderSetup();
      }));
    el.querySelector('#btn-drive-start').addEventListener('click', () => {
      const mode = el.querySelector('#drive-mode').value;
      const pEl = el.querySelector('#drive-passenger');
      this.start(this._pickScene, mode, !!(pEl && pEl.checked));
    });
  },

  renderPlay(fresh) {
    const el = document.getElementById('drive-content');
    el.innerHTML = `
      <div class="drive-bar" id="drive-bar"></div>
      <div class="chat-log drive-log" id="drive-log"></div>
      <div class="fb-explain-area hidden" id="drive-hint-area"></div>
      <div class="drive-sos-row">
        <button class="btn-control" id="btn-drive-topics">🆘 ネタ帳</button>
        <button class="btn-control" id="btn-drive-news">📰 時事ネタ</button>
        <button class="btn-control" id="btn-drive-hint">🇯🇵 ヒント</button>
        <button class="btn-control" id="btn-drive-end">🏁 切り上げる</button>
      </div>
      <div class="chat-input-row">
        <textarea id="drive-input" rows="2" placeholder="英語で話しかける…"></textarea>
        <button id="drive-send" class="btn-control primary">送信</button>
      </div>`;
    this.renderBar();
    // 既存ログを復元(画面を離れて戻ってきた場合)
    for (const m of this.state.messages) {
      if (m.role === 'user') this.addMsg('user', m.content);
      else this.addMsg('ai', m.content);
    }
    el.querySelector('#drive-send').addEventListener('click', () => this.send());
    el.querySelector('#drive-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); this.send(); }
    });
    el.querySelector('#btn-drive-topics').addEventListener('click', () => this.openTopicPicker());
    el.querySelector('#btn-drive-news').addEventListener('click', () => this.openNews());
    el.querySelector('#btn-drive-hint').addEventListener('click', () => this.showHint());
    el.querySelector('#btn-drive-end').addEventListener('click', () => this.endEarly());
    if (fresh) this.kickoff();
  },

  scene() {
    return SIM_SCENES[(this.state && this.state.scene) || 'drive'] || SIM_SCENES.drive;
  },

  renderBar() {
    const bar = document.getElementById('drive-bar');
    if (!bar || !this.state) return;
    const sc = this.scene();
    const prog = Math.min(1, this.state.userTurns / this.state.goal);
    const stage = this.currentStage();
    bar.innerHTML = `
      <div class="drive-bar-head">
        <span>${stage.icon} ${escapeHtml(stage.label)}</span>
        <span class="drive-bar-count">${this.state.userTurns} / ${this.state.goal} 往復</span>
      </div>
      <div class="drive-track"><div class="drive-track-fill" style="width:${Math.round(prog * 100)}%"></div>
        ${sc.stages.map((s) => `
          <span class="drive-track-dot ${prog >= s.at ? 'done' : ''}" style="left:${s.at * 100}%" title="${escapeHtml(s.label)}">${s.icon}</span>`).join('')}
      </div>`;
  },

  currentStage() {
    const sc = this.scene();
    const prog = Math.min(1, this.state.userTurns / this.state.goal);
    let cur = sc.stages[0];
    for (const s of sc.stages) { if (prog >= s.at) cur = s; }
    return cur;
  },

  /* ================= 進行 ================= */

  start(sceneId, mode, passenger) {
    const sc = SIM_SCENES[sceneId] || SIM_SCENES.drive;
    // 開始前にAPIキーを確認(無ければ取得手順を案内して中断)
    if (typeof AI !== 'undefined' && AI.ensureKey && !AI.ensureKey(null, 'AI自由会話')) return;
    this.state = {
      scene: sceneId, mode,
      passenger: !!(passenger && sc.passengerOption),
      goal: sc.goals[mode] || sc.goals.short,
      userTurns: 0, messages: [], over: false, busy: false
    };
    this._newsCache = null;
    this.renderPlay(true);
  },

  /** 開始: AIの第一声を生成する */
  async kickoff() {
    const log = document.getElementById('drive-log');
    const spin = document.createElement('div');
    spin.className = 'spinner';
    log.appendChild(spin);
    try {
      const firsts = {
        drive: this.state.passenger
          ? 'The drive is starting. Greet Hideki and Claire as they get in the car, and introduce Dr. Park who is also riding along. Keep it short and warm.'
          : 'The drive is starting. Greet Hideki and Claire warmly as they get in the car in front of Koreana Hotel. Keep it short.',
        banquet: 'You are standing next to Hideki at the buffet line. As Dr. Novak, give ONE short neutral line (for example about the food or the crowd) ending with "..." — do NOT ask him a question. He should be the one to start the conversation.',
        dinner: 'The dinner begins. As Prof. Lee, welcome Hideki and Claire, thank him briefly for his talk today, and propose a short toast (건배). Keep it short and warm.'
      };
      const first = firsts[this.state.scene] || firsts.drive;
      const reply = await AI.chat(this.systemPrompt(), [{ role: 'user', content: first }], 400);
      spin.remove();
      this.state.messages.push({ role: 'assistant', content: reply });
      this.addMsg('ai', reply);
    } catch (err) {
      spin.remove();
      this.addMsg('ai', this.errText(err) +
        '\n\n(設定を直したら、🏁で一度終了してからもう一度始めてください)');
    }
  },

  async send() {
    if (!this.state || this.state.over || this.state.busy) return;
    const input = document.getElementById('drive-input');
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    document.getElementById('drive-hint-area').classList.add('hidden');
    this.state.busy = true;
    this.state.userTurns++;
    this.state.messages.push({ role: 'user', content: text });
    this.addMsg('user', text);
    this.renderBar();

    const log = document.getElementById('drive-log');
    const spin = document.createElement('div');
    spin.className = 'spinner';
    log.appendChild(spin);
    log.scrollTop = log.scrollHeight;
    try {
      const reply = await AI.chat(this.systemPrompt(), this.state.messages, 400);
      spin.remove();
      this.state.messages.push({ role: 'assistant', content: reply });
      this.addMsg('ai', reply);
      if (this.state.userTurns >= this.state.goal) await this.finish(true);
    } catch (err) {
      spin.remove();
      // 失敗した発言はカウントから戻す(もう一度送れる)
      this.state.userTurns--;
      this.state.messages.pop();
      input.value = text;
      this.renderBar();
      this.addMsg('ai', this.errText(err));
    }
    this.state.busy = false;
  },

  async endEarly() {
    if (!this.state || this.state.over) return;
    const ok = await appConfirm(
      this.state.userTurns >= 3
        ? 'ここで切り上げますか?ここまでの会話でAIの講評をもらえます。'
        : 'まだ会話がほとんどありません。終了しますか?(講評はありません)',
      '🏁 切り上げる');
    if (!ok) return;
    if (this.state.userTurns >= 3) await this.finish(false);
    else { this.state = null; this.renderSetup(); }
  },

  /** 終了処理: 講評+報酬 */
  async finish(completed) {
    const st = this.state;
    const sc = this.scene();
    st.over = true;

    // 報酬(決定的に算出 — AIの出力には依存しない)
    const frac = Math.min(1, st.userTurns / st.goal);
    const score = Math.min(100, Math.round(frac * 100 * (st.mode === 'short' ? 0.8 : 1)));
    const xp = st.userTurns * 3;
    const gains = {};
    sc.focus.forEach((k) => { gains[k] = xp; });
    const levelUps = (typeof Stats !== 'undefined') ? Stats.add(gains) : [];
    const earned = (typeof Gami !== 'undefined') ? Gami.recordPractice(score) : 0;
    if (completed && st.scene === 'drive' && st.mode === 'full' && typeof Achievements !== 'undefined') {
      Achievements.unlock('drive-full');
    }
    const hist = this.history();
    hist.unshift({ date: new Date().toISOString(), scene: st.scene, mode: st.mode,
      passenger: st.passenger, userTurns: st.userTurns, completed: !!completed });
    localStorage.setItem('lq_drive_history', JSON.stringify(hist.slice(0, 30)));
    // 🎭 3場面すべて完走したら実績
    if (completed && typeof Achievements !== 'undefined' &&
        Object.keys(SIM_SCENES).every((id) => hist.some((h) => (h.scene || 'drive') === id && h.completed))) {
      Achievements.unlock('sim-all');
    }

    // 結果カードを組み立て(講評は後から流し込む)
    const el = document.getElementById('drive-content');
    const endTitles = {
      drive: 'Chung-Ang University 到着!',
      banquet: '懇親会を乗り切りました!',
      dinner: 'ごちそうさまでした!'
    };
    const doneHtml = `
      <div class="drive-result card">
        <div class="convo-icon">${sc.icon}</div>
        <h3>${completed ? endTitles[st.scene] || 'おつかれさまでした' : 'おつかれさまでした'}</h3>
        <p class="field-note">${escapeHtml(sc.name)} — ${st.userTurns}往復 話し続けました${st.passenger ? '(👥同乗者あり)' : ''}</p>
        <p>${sc.focus.map((k) =>
          `<span class="xp-chip">${Stats.KEYS[k].icon} ${Stats.KEYS[k].label} +${xp} XP</span>`).join('')}
          <span class="xp-chip">⭐ +${earned} pt</span></p>
        ${(levelUps || []).map((l) =>
          `<p>🎉 <strong>${Stats.KEYS[l.key].label}</strong> が Lv.${l.level} に上がりました!</p>`).join('')}
        <div id="drive-critique"><p class="field-note">🤖 ${escapeHtml(sc.partner)}役のAIが日本語で講評を書いています…</p></div>
        <button class="btn-large primary" id="btn-drive-again">もう一度練習する</button>
        <button class="btn-large" id="btn-drive-home">ネタ帳に戻る</button>
      </div>`;
    el.insertAdjacentHTML('beforeend', doneHtml);
    el.querySelector('.chat-input-row').classList.add('hidden');
    el.querySelector('.drive-sos-row').classList.add('hidden');
    el.querySelector('#btn-drive-again').addEventListener('click', () => { this.state = null; this.renderSetup(); });
    el.querySelector('#btn-drive-home').addEventListener('click', () => { this.state = null; showScreen('topics'); });
    el.querySelector('.drive-result').scrollIntoView({ behavior: 'smooth', block: 'start' });

    // 日本語講評
    try {
      const text = await this.critique();
      const box = document.getElementById('drive-critique');
      if (box) box.innerHTML = `<div class="md-body">${renderMarkdown(text)}</div>`;
    } catch (err) {
      const box = document.getElementById('drive-critique');
      if (box) box.innerHTML = `<p class="field-note">講評を取得できませんでした: ${escapeHtml(this.errText(err))}</p>`;
    }
  },

  critique() {
    const sc = this.scene();
    const transcript = this.state.messages
      .map((m) => (m.role === 'user' ? 'Hideki: ' : sc.partner + ': ') + m.content).join('\n')
      .slice(0, 9000);
    const sys = `あなたは日本人研究者の英会話コーチです。学習者(Hideki)が、${sc.sceneJa}を想定した英語会話の練習をしました。会話ログを読み、日本語で講評してください。

出力形式(Markdown、全体で15行以内。スマホの狭い画面で読みます):
## 会話が続いた度
- ★1〜5と、その理由を1行
## 良かった返し
- 実際のHidekiの発言から2つ引用(> で引用)し、なぜ良いかを各1行
## 次に試すこと
- 2つ。具体的な英語フレーズ(\`バッククォート\`)を添えて
本番は2026年11月の韓国での実際の場面です。励ます調子で締めてください。`;
    return AI.chat(sys, [{ role: 'user', content: `会話ログ:\n${transcript}` }], 900);
  },

  /* ================= ペルソナ ================= */

  personaFor(sceneId) {
    if (sceneId === 'banquet') {
      return `You are role-playing as Dr. Lena Novak, a yeast genomics researcher from Vienna attending the ISSY39 conference in Seoul, November 2026. You are at the conference banquet (standing buffet) and are meeting Hideki — a Japanese genome researcher who is an invited speaker — for the FIRST time. His partner Claire (from Hong Kong) is with him.

About you (Dr. Novak): friendly but you do NOT carry the conversation. This banquet exists to train Hideki to initiate, deepen and gracefully close conversations with strangers. Behaviors:
- Answer what you are asked, add one small detail, and then sometimes stop ("...") without asking anything back — let him re-open or move on.
- You work on yeast stress responses; you are curious about his talk if he mentions it, and you enjoy comparing European and Asian conference culture.
- React to the food (you are debating whether to try hongeo-hoe, the fermented skate).
- Occasionally a Korean PhD student, Mr. Seo, joins the circle — sometimes speak a line as "Mr. Seo:" (he is shy but excited to practice English).
- If Hideki gives a short self-introduction, respond with real interest and one follow-up question.`;
    }
    if (sceneId === 'dinner') {
      return `You are role-playing as Prof. Lee, a senior professor at Chung-Ang University, hosting a dinner near the Anseong campus right after the symposium, November 2026. Hideki — a Japanese genome researcher — gave an invited talk today; his partner Claire (from Hong Kong) sits next to him. Kyoung-Dong Kim ("KD"), Hideki's former Wistar colleague who now works at Chung-Ang, is also at the table — occasionally speak a line as "KD:".

About you (Prof. Lee): a warm, slightly formal senior host. Behaviors:
- Thank Hideki for coming and ask easy questions about his talk, Japan, and his upcoming wedding — but never interrogate; share your own stories too.
- Proudly explain Korean food as it arrives (ganjang-gejang is the "rice thief" 밥도둑; show him how to eat it).
- Include Claire warmly (ask her about Hong Kong food compared to Korean food).
- Appreciate toasts and thanks; if Hideki offers a toast or gratitude in Korean, be delighted.
- You are senior, so Hideki should show polite initiative — when the table goes quiet ("..."), wait for him to offer a topic or a toast.`;
    }
    // drive(既定)
    return `You are role-playing as Kyoung-Dong Kim ("KD"), a Korean genome researcher at Chung-Ang University, driving your former Wistar Institute colleague Hideki (a Japanese genome researcher) from Koreana Hotel in Seoul to Chung-Ang University's Anseong campus (~2 hours) the morning after the ISSY39 conference, November 2026. Hideki's partner Claire (from Hong Kong) is also in the car.${this.state && this.state.passenger ? ' Dr. Park, another ISSY39 attendee meeting Hideki for the first time, is also riding along — occasionally speak as Dr. Park too, prefixing lines with "Dr. Park:".' : ''}

About you (KD): very friendly and easygoing. At Wistar (Noma lab, Philadelphia) you did ChIA-PET/ChIP/microscopy while Hideki did Hi-C and computational analysis; you co-authored papers on condensin/cohesin and 3D genome structure of fission yeast (Nat Genet 2016, NSMB 2017). You later moved to Paul's lab within Wistar (if it comes up, frame it positively as "it worked out great" — never discuss the reason). Recently Hideki did the Hi-C analysis for your Malassezia paper (mBio 2025). Your family visited Japan 1-2 years ago and Hideki showed you his lab. You have a wife (former teacher in Korea) and two kids. Hideki once promised an EBV Hi-C analysis that is still unfinished — if HE brings it up, laugh it off warmly and suggest discussing a plan, don't press him.`;
  },

  systemPrompt() {
    const st = this.state;
    const sc = this.scene();
    const stage = this.currentStage();
    const remaining = st.goal - st.userTurns;
    const arriving = remaining <= 0;
    return `${this.personaFor(st.scene)}

Scene status: currently at "${stage.label}". ${stage.scene} About ${remaining > 0 ? remaining : 0} exchanges left.

Conversation rules:
- Casual spoken English, SHORT replies (2-4 sentences). Keep it light.
- React warmly to what Hideki says, then either ask ONE easy follow-up question or share a small story.
- Occasionally (about every 3rd reply) teach a tiny bit of Korean: give the Korean, romanization, and a short Japanese gloss in parentheses, e.g. 맛있겠다 (masitgetda — おいしそう).
- Every 2-3 exchanges, let the conversation naturally pause: end your reply with "..." and DON'T ask a question — wait for Hideki to bring up a new topic. This trains him to break silences.
- Mention the surroundings or the food when it fits the current stage.
- Never discuss politics/military service unless Hideki asks first; then answer briefly and neutrally.
${arriving ? '- ' + sc.arriveText : ''}
- Output plain conversational text only (no headings, no lists). You may use *italics* for actions like *points out the window*.`;
  },

  /* ================= SOS ================= */

  /** 🆘 ネタ帳: 持ちネタ+今日の3ネタから選んで入力欄に挿入 */
  openTopicPicker() {
    if (typeof TOPIC_DECK === 'undefined') return;
    const favs = (typeof Topics !== 'undefined') ? Topics.favs() : new Set();
    const picks = (typeof Topics !== 'undefined') ? Topics.todaysPicks() : [];
    const seen = new Set();
    const rows = [];
    const add = (c, tag) => {
      if (!c || seen.has(c.id)) return;
      seen.add(c.id);
      rows.push({ c, tag });
    };
    TOPIC_DECK.filter((c) => favs.has(c.id)).forEach((c) => add(c, '⭐'));
    picks.forEach((c) => add(c, '🎲'));
    if (!rows.length) TOPIC_DECK.slice(0, 8).forEach((c) => add(c, ''));

    const ov = document.createElement('div');
    ov.className = 'modal-overlay';
    ov.id = 'drive-topic-overlay';
    ov.innerHTML = `
      <div class="modal-box legend-box">
        <h3>🆘 ネタ帳から切り出す</h3>
        <p class="field-note">タップすると入力欄に切り出し文が入ります(⭐持ちネタ / 🎲今日の3ネタ)</p>
        <div class="drive-topic-list">
          ${rows.map(({ c, tag }) => `
            <button class="drive-topic-row" data-drive-topic="${c.id}">
              <span>${c.icon} ${escapeHtml(c.title)} ${tag}</span>
              <span class="field-note">${escapeHtml(c.openerJa || '')}</span>
            </button>`).join('')}
        </div>
        <button class="btn-large" id="btn-drive-topic-close">閉じる</button>
      </div>`;
    document.body.appendChild(ov);
    const close = () => ov.remove();
    ov.addEventListener('click', (e) => { if (e.target === ov) close(); });
    ov.querySelector('#btn-drive-topic-close').addEventListener('click', close);
    ov.querySelectorAll('[data-drive-topic]').forEach((b) =>
      b.addEventListener('click', () => {
        const c = TOPIC_DECK.find((x) => x.id === b.dataset.driveTopic);
        if (c) {
          const input = document.getElementById('drive-input');
          input.value = c.opener;
          input.focus();
        }
        close();
      }));
  },

  /** 📰 時事ネタ: AIに今日使える切り出しを3つ作らせる */
  async openNews() {
    const area = document.getElementById('drive-hint-area');
    area.classList.remove('hidden');
    if (!this._newsCache) {
      area.innerHTML = '<p class="field-note">📰 AIが今日の時事ネタを3つ考えています…</p>';
      try {
        const sys = `あなたは英語雑談のコーチです。日本人研究者が国際学会の場(車中・懇親会・会食)で話すための「時事ネタの切り出し文」を3つ作ってください。政治的な意見表明は避け、「相手の見方を尋ねる」形にします(例: How is it looking from the Korean side?)。科学研究・経済・AI・日韓の身近な話題を優先。

出力形式(この形式に厳密に従う。前置きや締めの文は不要):
1. 英語の切り出し文
(日本語訳)
2. 英語の切り出し文
(日本語訳)
3. 英語の切り出し文
(日本語訳)`;
        this._newsCache = await AI.chat(sys, [{ role: 'user', content: '3つお願いします。' }], 600);
      } catch (err) {
        area.innerHTML = `<p class="field-note" style="color:var(--danger)">${escapeHtml(this.errText(err))}</p>`;
        return;
      }
    }
    const lines = this._newsCache.split('\n').filter((l) => l.trim());
    const items = [];
    for (const line of lines) {
      const m = line.match(/^\d+\.\s*(.+)$/);
      if (m) items.push({ en: m[1].trim(), ja: '' });
      else if (items.length && !items[items.length - 1].ja) {
        items[items.length - 1].ja = line.replace(/^[((]|[))]$/g, '').trim();
      }
    }
    area.innerHTML = `
      <p class="field-note" style="margin-bottom:6px">📰 タップで入力欄へ(AIの知識に基づく話題です — 当日は最新ニュースも確認を)</p>
      ${items.map((it, i) => `
        <button class="drive-topic-row" data-drive-news="${i}">
          <span>${escapeHtml(it.en)}</span>
          ${it.ja ? `<span class="field-note">${escapeHtml(it.ja)}</span>` : ''}
        </button>`).join('')}`;
    area.querySelectorAll('[data-drive-news]').forEach((b) =>
      b.addEventListener('click', () => {
        const input = document.getElementById('drive-input');
        input.value = items[Number(b.dataset.driveNews)].en;
        input.focus();
        area.classList.add('hidden');
      }));
  },

  /** 🇯🇵 ヒント: いまの返し方を日本語でコーチする */
  async showHint() {
    const area = document.getElementById('drive-hint-area');
    const lastAi = [...this.state.messages].reverse().find((m) => m.role === 'assistant');
    if (!lastAi) { showToast('まだ相手の発言がありません'); return; }
    area.classList.remove('hidden');
    area.innerHTML = '<p class="field-note">🇯🇵 返し方のヒントを考えています…</p>';
    try {
      const sc = this.scene();
      const sys = `あなたは日本人研究者の英会話コーチです。${sc.sceneJa}の場面の英語会話で、会話相手(${sc.partnerJa})の直前の発言にどう返すか、日本語で手短にアドバイスしてください。

出力形式(Markdown、全体で8行以内):
## 相手が言ったこと
- 1行の日本語要約
## 返し方(2案)
- **案1**: 方針を1行 + 例文 \`英語1文\`
- **案2**: 方針を1行 + 例文 \`英語1文\``;
      const text = await AI.chat(sys, [{ role: 'user', content: `相手の発言: ${lastAi.content}` }], 500);
      area.innerHTML = `<div class="md-body">${renderMarkdown(text)}</div>`;
    } catch (err) {
      area.innerHTML = `<p class="field-note" style="color:var(--danger)">${escapeHtml(this.errText(err))}</p>`;
    }
  },

  /* ================= ユーティリティ ================= */

  /** AIのエラーを表示用の文にする(APIキー未設定なら取得手順の案内も出す) */
  errText(err) {
    if (typeof aiErrorText === 'function') return aiErrorText(err);
    return '⚠ ' + ((err && err.message) || '不明なエラー');
  },

  addMsg(who, text) {
    const log = document.getElementById('drive-log');
    if (!log) return;
    const div = document.createElement('div');
    div.className = `chat-msg ${who}`;
    if (who === 'ai') div.innerHTML = `<div class="md-body">${renderMarkdown(text)}</div>`;
    else div.textContent = text;
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
  },

  history() {
    try { return JSON.parse(localStorage.getItem('lq_drive_history') || '[]'); }
    catch (_) { return []; }
  },

  /** 戻るボタン: 会話中なら状態を保持したまま離脱できる */
  async backPressed() {
    if (this.state && !this.state.over && this.state.userTurns > 0) {
      showToast('会話は続いています(戻ってきたら再開できます)');
    }
    showScreen('topics');
  }
};
