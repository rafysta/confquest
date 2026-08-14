/* ConfQuest - アプリ本体(画面遷移・設定・履歴・ゲーミフィケーション) */
'use strict';

/* ---------- 画面遷移 ---------- */
function showScreen(name) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
  document.getElementById(`screen-${name}`).classList.add('active');
  if (name === 'home') renderHome();
  if (name === 'history') renderHistory();
  if (name === 'settings') loadSettings();
}

document.querySelectorAll('[data-nav]').forEach((btn) => {
  btn.addEventListener('click', () => showScreen(btn.dataset.nav));
});

/* ---------- ストリークとポイント ---------- */
const Gami = {
  data() {
    return JSON.parse(localStorage.getItem('lq_gami') ||
      '{"points":0,"streak":0,"lastDay":""}');
  },
  save(d) { localStorage.setItem('lq_gami', JSON.stringify(d)); },
  /** 練習完了時に呼ぶ。獲得ポイントを返す */
  recordPractice(score) {
    const d = this.data();
    const today = new Date().toISOString().slice(0, 10);
    if (d.lastDay !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      d.streak = (d.lastDay === yesterday) ? d.streak + 1 : 1;
      d.lastDay = today;
    }
    const earned = 10 + Math.round(score / 10) + Math.min(20, d.streak);
    d.points += earned;
    this.save(d);
    return earned;
  }
};

function renderHome() {
  const d = Gami.data();
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  // 昨日も今日も練習していなければストリークは途切れて見える
  const effective = (d.lastDay === today || d.lastDay === yesterday) ? d.streak : 0;
  document.getElementById('streak-text').textContent =
    d.lastDay === today ? `連続 ${effective} 日 (今日クリア!)` : `連続 ${effective} 日`;
  document.getElementById('points-badge').textContent = `⭐ ${d.points} pt`;
}

/* ---------- 設定 ---------- */
function loadSettings() {
  document.getElementById('api-key').value = localStorage.getItem('lq_api_key') || '';
  document.getElementById('openai-key').value = localStorage.getItem('lq_openai_key') || '';
  document.getElementById('ai-model').value =
    localStorage.getItem('lq_ai_model') || 'claude-sonnet-5';
  document.getElementById('filler-words').value =
    localStorage.getItem('lq_fillers') ||
    'um, uh, so, actually, basically, you know, kind of, I mean, like';
}

document.getElementById('save-settings').addEventListener('click', () => {
  localStorage.setItem('lq_api_key', document.getElementById('api-key').value.trim());
  localStorage.setItem('lq_openai_key', document.getElementById('openai-key').value.trim());
  localStorage.setItem('lq_ai_model', document.getElementById('ai-model').value);
  localStorage.setItem('lq_fillers', document.getElementById('filler-words').value);
  const note = document.getElementById('settings-saved');
  note.style.display = 'block';
  setTimeout(() => { note.style.display = 'none'; }, 2000);
});

/* ---------- 練習セットアップ ---------- */
document.getElementById('pdf-input').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  const status = document.getElementById('pdf-status');
  if (!file) { status.textContent = '未選択(PDFなしでも練習可能)'; return; }
  status.textContent = '読み込み中...';
  try {
    const pages = await Practice.loadPdf(file);
    status.textContent = `✓ ${file.name} (${pages}ページ)`;
  } catch (err) {
    Practice.pdfDoc = null;
    status.textContent = '読み込み失敗: ' + err.message;
  }
});

document.getElementById('start-practice').addEventListener('click', async () => {
  const enableTranscribe = document.getElementById('enable-transcribe').checked;
  if (enableTranscribe && !localStorage.getItem('lq_openai_key')) {
    alert('文字起こしにはOpenAI APIキーが必要です。設定画面で入力するか、文字起こしのチェックを外してください。');
    return;
  }
  const opts = {
    targetMinutes: parseFloat(document.getElementById('target-minutes').value) || 12,
    lang: document.getElementById('speech-lang').value,
    enableTranscribe,
    enableRecording: document.getElementById('enable-recording').checked
  };
  showScreen('practice');
  await Practice.start(opts);
});

/* ---------- 練習中の操作 ---------- */
document.getElementById('tap-next').addEventListener('click', () => Practice.nextSlide());
document.getElementById('tap-prev').addEventListener('click', () => Practice.prevSlide());
document.getElementById('btn-pause').addEventListener('click', () => Practice.togglePause());
document.getElementById('btn-finish').addEventListener('click', async () => {
  const session = await Practice.finish();
  if (!session) return;
  showScreen('results');
  if (session.transcribe) {
    document.getElementById('results-content').innerHTML =
      '<div class="spinner"></div><p style="text-align:center" class="field-note">文字起こし中... (発表時間により数十秒かかります)</p>';
    await Practice.transcribeAudio();
  }
  Practice.computeStats();
  saveHistory(session);
  renderResults(session);
});

/* ---------- 結果画面 ---------- */
function renderResults(s) {
  const score = Practice.score();
  const earned = Gami.recordPractice(score);
  const overMs = s.totalMs - s.targetMs;
  const el = document.getElementById('results-content');

  const slideRows = s.slides.map((sl, i) => {
    const planned = s.targetMs / s.numSlides;
    const diff = sl.timeMs - planned;
    const cls = diff > 15000 ? 'over' : (diff < -15000 ? 'under' : '');
    const wc = sl.transcript.split(/\s+/).filter(Boolean).length;
    return `<tr>
      <td>Slide ${i + 1}</td>
      <td>${PracticeUtil.fmtTime(sl.timeMs)}</td>
      <td class="${cls}">${PracticeUtil.fmtSigned(diff)}</td>
      <td>${wc}語</td>
    </tr>`;
  }).join('');

  el.innerHTML = `
    <div class="score-circle" id="score-circle">
      <div class="inner">
        <span class="score-num" id="score-num">0</span>
        <span class="score-label">SCORE</span>
      </div>
    </div>
    <p style="text-align:center;margin-bottom:12px" class="field-note">
      ⭐ +${earned} pt 獲得!
    </p>
    <div class="stat-grid">
      <div class="stat-box">
        <div class="val ${Math.abs(overMs) < 30000 ? 'good' : 'bad'}">${PracticeUtil.fmtTime(s.totalMs)}</div>
        <div class="lbl">発表時間 (目標 ${PracticeUtil.fmtTime(s.targetMs)} / ${PracticeUtil.fmtSigned(overMs)})</div>
      </div>
      <div class="stat-box">
        <div class="val ${s.wpm >= 110 && s.wpm <= 170 ? 'good' : ''}">${s.wpm || '--'}</div>
        <div class="lbl">WPM (${s.wordCount || 0}語)</div>
      </div>
      <div class="stat-box">
        <div class="val ${s.fillerCount <= 5 ? 'good' : 'bad'}">${s.fillerCount}</div>
        <div class="lbl">Filler語</div>
      </div>
      <div class="stat-box">
        <div class="val">${s.numSlides}</div>
        <div class="lbl">スライド数</div>
      </div>
    </div>
    ${s.transcriptError ? `<p class="field-note" style="margin-bottom:12px;color:var(--warn)">⚠ 文字起こし失敗: ${escapeHtml(s.transcriptError)}</p>` : ''}
    ${s.fillerCount > 0 ? `<p class="field-note" style="margin-bottom:12px">Filler内訳: ${s.fillerDetail}</p>` : ''}
    ${Practice.audioUrl ? `<audio controls src="${Practice.audioUrl}"></audio>` : ''}
    <h3 style="margin-bottom:8px;font-size:1rem">スライドごとの記録</h3>
    <table class="slide-table">
      <tr><th>スライド</th><th>滞在</th><th>均等配分比</th><th>発話</th></tr>
      ${slideRows}
    </table>
    ${s.fullTranscript.trim() ? `
      <h3 style="margin-bottom:8px;font-size:1rem">文字起こし</h3>
      <div class="transcript-box">${escapeHtml(s.fullTranscript)}</div>` : ''}
  `;

  // スコアのカウントアップアニメーション
  animateScore(score);
  document.getElementById('ai-feedback-area').classList.add('hidden');
  document.getElementById('ai-feedback-area').textContent = '';
}

function animateScore(target) {
  const numEl = document.getElementById('score-num');
  const circle = document.getElementById('score-circle');
  const t0 = performance.now();
  const dur = 1200;
  function frame(t) {
    const p = Math.min(1, (t - t0) / dur);
    const eased = 1 - Math.pow(1 - p, 3);
    const val = Math.round(target * eased);
    numEl.textContent = val;
    const deg = 360 * (val / 100);
    const color = val >= 75 ? 'var(--success)' : (val >= 50 ? 'var(--accent)' : 'var(--warn)');
    circle.style.background = `conic-gradient(${color} ${deg}deg, var(--bg-card) ${deg}deg)`;
    if (p < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* ---------- AIフィードバック ---------- */
document.getElementById('btn-ai-feedback').addEventListener('click', async () => {
  const area = document.getElementById('ai-feedback-area');
  area.classList.remove('hidden');
  area.innerHTML = '<div class="spinner"></div>';
  try {
    const text = await AI.presentationFeedback(Practice.session);
    area.textContent = text;
  } catch (err) {
    area.textContent = '⚠ ' + err.message;
  }
});

/* ---------- Q&Aシミュレータ ---------- */
const QA = { messages: [] };

document.getElementById('btn-qa-sim').addEventListener('click', () => {
  if (!Practice.session || !Practice.session.fullTranscript.trim()) {
    alert('文字起こしがありません。「終了後に文字起こし」を有効にして練習してください。');
    return;
  }
  QA.messages = [];
  document.getElementById('qa-log').innerHTML = '';
  document.getElementById('qa-start').style.display = 'block';
  showScreen('qa');
});

document.getElementById('qa-start').addEventListener('click', async () => {
  document.getElementById('qa-start').style.display = 'none';
  QA.messages = [{ role: 'user', content: 'Please ask your first question about my presentation.' }];
  await qaAsk();
});

document.getElementById('qa-send').addEventListener('click', async () => {
  const input = document.getElementById('qa-input');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  addChatMsg('user', text);
  QA.messages.push({ role: 'user', content: text });
  await qaAsk();
});

async function qaAsk() {
  const log = document.getElementById('qa-log');
  const spinner = document.createElement('div');
  spinner.className = 'spinner';
  log.appendChild(spinner);
  log.scrollTop = log.scrollHeight;
  try {
    const persona = document.getElementById('qa-persona').value;
    const sys = AI.qaSystemPrompt(persona, Practice.session);
    const reply = await AI.chat(sys, QA.messages, 500);
    QA.messages.push({ role: 'assistant', content: reply });
    spinner.remove();
    addChatMsg('ai', reply);
  } catch (err) {
    spinner.remove();
    addChatMsg('ai', '⚠ ' + err.message);
  }
}

function addChatMsg(who, text) {
  const log = document.getElementById('qa-log');
  const div = document.createElement('div');
  div.className = `chat-msg ${who}`;
  div.textContent = text;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
}

/* ---------- 履歴 ---------- */
function saveHistory(s) {
  const hist = JSON.parse(localStorage.getItem('lq_history') || '[]');
  hist.unshift({
    date: s.date,
    pdfName: s.pdfName,
    totalMs: s.totalMs,
    targetMs: s.targetMs,
    wpm: s.wpm,
    fillerCount: s.fillerCount,
    numSlides: s.numSlides,
    score: Practice.score()
  });
  localStorage.setItem('lq_history', JSON.stringify(hist.slice(0, 200)));
}

function renderHistory() {
  const hist = JSON.parse(localStorage.getItem('lq_history') || '[]');
  const el = document.getElementById('history-content');
  if (hist.length === 0) {
    el.innerHTML = '<p class="empty-note">まだ練習記録がありません。<br>最初の練習を始めましょう!</p>';
    return;
  }
  el.innerHTML = hist.map((h) => {
    const d = new Date(h.date);
    const dateStr = `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    const over = h.totalMs - h.targetMs;
    return `<div class="history-item">
      <span class="date">${dateStr} ${h.pdfName ? '· ' + escapeHtml(h.pdfName) : ''}</span>
      <span style="font-weight:700;color:var(--accent)">${h.score}点</span>
      <span class="meta">
        ${PracticeUtil.fmtTime(h.totalMs)} (${PracticeUtil.fmtSigned(over)}) ·
        ${h.wpm ? h.wpm + ' WPM · ' : ''}filler ${h.fillerCount} · ${h.numSlides}枚
      </span>
    </div>`;
  }).join('');
}

/* ---------- 初期化 ---------- */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
renderHome();
