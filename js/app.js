/* ConfQuest - アプリ本体(画面遷移・設定・履歴・ゲーミフィケーション) */
'use strict';

/* ---------- エラーの可視化(真っ暗な画面の原因を表示する) ---------- */
function showErrorBanner(msg) {
  let el = document.getElementById('error-banner');
  if (!el) {
    el = document.createElement('div');
    el.id = 'error-banner';
    el.innerHTML = '<div id="error-banner-msgs"></div>' +
      '<button id="error-banner-close">×</button>';
    document.body.appendChild(el);
    el.querySelector('#error-banner-close').addEventListener('click', () => el.remove());
  }
  const p = document.createElement('p');
  p.textContent = '⚠ ' + msg;
  el.querySelector('#error-banner-msgs').appendChild(p);
}
window.addEventListener('error', (e) => {
  showErrorBanner((e.message || 'エラー') + ' @' +
    String(e.filename || '').split('/').pop() + ':' + (e.lineno || 0));
});
window.addEventListener('unhandledrejection', (e) => {
  showErrorBanner('Promise: ' + String((e.reason && e.reason.message) || e.reason));
});
// スクリプト読み込み中に発生していたエラーを表示
if (window.__earlyErrors && window.__earlyErrors.length) {
  window.__earlyErrors.forEach((m) => showErrorBanner(m));
}

/* ---------- アプリ内ダイアログ(ブラウザのalert/confirm代替) ---------- */
function appDialog(msg, title, isConfirm) {
  return new Promise((resolve) => {
    const ov = document.getElementById('modal-overlay');
    document.getElementById('modal-title').textContent = title || '';
    document.getElementById('modal-msg').textContent = msg;
    const okBtn = document.getElementById('modal-ok');
    const cancelBtn = document.getElementById('modal-cancel');
    cancelBtn.style.display = isConfirm ? '' : 'none';
    const close = (result) => {
      ov.classList.add('hidden');
      okBtn.onclick = null;
      cancelBtn.onclick = null;
      resolve(result);
    };
    okBtn.onclick = () => close(true);
    cancelBtn.onclick = () => close(false);
    ov.classList.remove('hidden');
  });
}
function appAlert(msg, title) { return appDialog(msg, title, false); }
function appConfirm(msg, title) { return appDialog(msg, title, true); }

/* ---------- 画面遷移 ---------- */
function showScreen(name) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
  document.getElementById(`screen-${name}`).classList.add('active');
  if (name === 'home') renderHome();
  if (name === 'history') renderHistory();
  if (name === 'settings') loadSettings();
  if (name === 'about') renderAbout();
  if (name === 'talk-list') renderTalkList();
  if (name === 'convo-list') renderConvoList();
  if (name === 'status') renderStatus();
  if (name === 'run-map') Run.renderMap();
  if (name === 'quests' && typeof Quests !== 'undefined') renderQuests();
  if (name === 'achievements' && typeof Achievements !== 'undefined') renderAchievements();
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
  /** ポイント加算はすべてここを通す(週間グラフ用に日別ログも記録) */
  addPoints(n) {
    if (!n) return;
    const d = this.data();
    d.points += n;
    this.save(d);
    if (typeof PointsLog !== 'undefined') PointsLog.add(n);
  },
  /** 練習完了時に呼ぶ。獲得ポイントを返す */
  recordPractice(score) {
    const d = this.data();
    const today = new Date().toISOString().slice(0, 10);
    if (d.lastDay !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      d.streak = (d.lastDay === yesterday) ? d.streak + 1 : 1;
      d.lastDay = today;
      this.save(d);
    }
    const earned = 10 + Math.round(score / 10) + Math.min(20, d.streak);
    this.addPoints(earned);
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
  if (typeof Gems !== 'undefined') {
    document.getElementById('gems-badge').textContent = `💎 ${Gems.get()}`;
    document.getElementById('daily-quest-summary').textContent =
      `${Quests.doneCount()}/${QUEST_DEFS.length} 達成`;
  }
  const sum = document.getElementById('status-summary');
  if (sum) {
    sum.textContent = `総合レベル ${Stats.totalLevel()}` +
      (typeof Achievements !== 'undefined'
        ? `・実績 ${Achievements.count()}/${ACHIEVEMENT_DEFS.length}` : '');
  }
  updateRunMenuDesc();
}

/* ---------- 設定 ---------- */
function loadSettings() {
  document.getElementById('api-key').value = localStorage.getItem('lq_api_key') || '';
  document.getElementById('openai-key').value = localStorage.getItem('lq_openai_key') || '';
  document.getElementById('ai-provider').value =
    localStorage.getItem('lq_ai_provider') || 'claude';
  document.getElementById('ai-model').value =
    localStorage.getItem('lq_ai_model') || 'claude-sonnet-5';
  document.getElementById('openai-model').value =
    localStorage.getItem('lq_openai_model') || 'gpt-5';
  document.getElementById('stt-model').value =
    localStorage.getItem('lq_stt_model') || 'whisper-1';
  document.getElementById('time-scale').value =
    localStorage.getItem('lq_time_scale') || '1.5';
  document.getElementById('filler-words').value =
    localStorage.getItem('lq_fillers') ||
    'um, uh, so, actually, basically, you know, kind of, I mean, like';
  updateProviderFields();
}

/** 選択中のプロバイダに応じてモデル選択欄を出し分け */
function updateProviderFields() {
  const isOpenAI = document.getElementById('ai-provider').value === 'openai';
  document.getElementById('field-claude-model').classList.toggle('hidden', isOpenAI);
  document.getElementById('field-openai-model').classList.toggle('hidden', !isOpenAI);
}

document.getElementById('ai-provider').addEventListener('change', updateProviderFields);

document.getElementById('save-settings').addEventListener('click', () => {
  localStorage.setItem('lq_api_key', document.getElementById('api-key').value.trim());
  localStorage.setItem('lq_openai_key', document.getElementById('openai-key').value.trim());
  localStorage.setItem('lq_ai_provider', document.getElementById('ai-provider').value);
  localStorage.setItem('lq_ai_model', document.getElementById('ai-model').value);
  localStorage.setItem('lq_openai_model', document.getElementById('openai-model').value);
  localStorage.setItem('lq_stt_model', document.getElementById('stt-model').value);
  localStorage.setItem('lq_time_scale', document.getElementById('time-scale').value);
  localStorage.setItem('lq_fillers', document.getElementById('filler-words').value);
  // 保存されたことをはっきり示す: ボタンの見た目変化+トースト通知
  const btn = document.getElementById('save-settings');
  btn.textContent = '✓ 保存しました';
  btn.classList.add('saved');
  setTimeout(() => {
    btn.textContent = '保存';
    btn.classList.remove('saved');
  }, 1800);
  showToast('✓ 設定を保存しました');
});

/** 画面下部に短時間表示される通知 */
function showToast(msg) {
  let el = document.getElementById('app-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'app-toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.remove('show');
  void el.offsetWidth;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 2200);
}

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
    appAlert('文字起こしにはOpenAI APIキーが必要です。設定画面で入力するか、文字起こしのチェックを外してください。', '🔑 APIキーが必要');
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
  if (typeof Achievements !== 'undefined') Achievements.unlock('first-practice');
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

/* ---------- 簡易Markdownレンダラー ---------- */
/**
 * AI応答をMarkdownとして整形表示する。
 * HTMLを先にエスケープするため、AI出力にタグが含まれても安全。
 */
function renderMarkdown(src) {
  const blocks = [];
  // コードブロックを退避(中身は整形しない)
  let text = escapeHtml(src).replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
    blocks.push(`<pre class="md-pre"><code>${code.replace(/\n$/, '')}</code></pre>`);
    return `BLOCK${blocks.length - 1}`;
  });

  const inline = (s) => s
    .replace(/`([^`]+)`/g, '<code class="md-code">$1</code>')
    .replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener">$1</a>');

  const lines = text.split('\n');
  const out = [];
  let listType = null;   // 'ul' | 'ol' | null
  let para = [];

  const flushPara = () => {
    if (para.length) {
      out.push(`<p>${inline(para.join(' '))}</p>`);
      para = [];
    }
  };
  const closeList = () => {
    if (listType) { out.push(`</${listType}>`); listType = null; }
  };
  const openList = (type) => {
    if (listType !== type) { closeList(); out.push(`<${type}>`); listType = type; }
  };

  // テーブル用: 行を | で分割(前後の | は除去)
  const splitRow = (s) => s.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
  const isTableSep = (s) => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$/.test(s);

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trimEnd();

    if (/^BLOCK\d+$/.test(line.trim())) {
      flushPara(); closeList();
      out.push(line.trim());
      continue;
    }
    if (!line.trim()) { flushPara(); closeList(); continue; }

    // テーブル: ヘッダ行の次が区切り行(|---|---|)なら表として処理
    if (line.includes('|') && i + 1 < lines.length && isTableSep(lines[i + 1])) {
      flushPara(); closeList();
      const headers = splitRow(line);
      const aligns = splitRow(lines[i + 1]).map((c) => {
        if (/^:.*:$/.test(c)) return 'center';
        if (/:$/.test(c)) return 'right';
        return 'left';
      });
      const rows = [];
      i += 2;
      while (i < lines.length && lines[i].includes('|') && lines[i].trim()) {
        rows.push(splitRow(lines[i]));
        i++;
      }
      i--; // for文のi++と相殺
      const th = headers.map((h, k) =>
        `<th style="text-align:${aligns[k] || 'left'}">${inline(h)}</th>`).join('');
      const tb = rows.map((r) =>
        '<tr>' + headers.map((_, k) =>
          `<td style="text-align:${aligns[k] || 'left'}">${inline(r[k] || '')}</td>`).join('') + '</tr>'
      ).join('');
      out.push(`<div class="md-table-wrap"><table class="md-table">` +
        `<thead><tr>${th}</tr></thead><tbody>${tb}</tbody></table></div>`);
      continue;
    }

    let m;
    if ((m = line.match(/^(#{1,6})\s+(.*)$/))) {
      flushPara(); closeList();
      const lv = m[1].length <= 2 ? 3 : 4; // 画面が狭いのでh3/h4に丸める
      out.push(`<h${lv} class="md-h">${inline(m[2])}</h${lv}>`);
    } else if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      flushPara(); closeList();
      out.push('<hr class="md-hr">');
    } else if ((m = line.match(/^\s*&gt;\s?(.*)$/))) {
      // 引用(この時点で > は &gt; にエスケープ済み)
      flushPara(); closeList();
      const prev = out[out.length - 1];
      if (prev && prev.startsWith('<blockquote')) {
        // 連続する引用行はひとつのブロックにまとめる
        out[out.length - 1] = prev.replace(/<\/blockquote>$/, `<br>${inline(m[1])}</blockquote>`);
      } else {
        out.push(`<blockquote class="md-quote">${inline(m[1])}</blockquote>`);
      }
    } else if ((m = line.match(/^\s*(?:[-*+])\s+(.*)$/))) {
      flushPara(); openList('ul');
      out.push(`<li>${inline(m[1])}</li>`);
    } else if ((m = line.match(/^\s*\d+[.)]\s+(.*)$/))) {
      flushPara(); openList('ol');
      out.push(`<li>${inline(m[1])}</li>`);
    } else {
      closeList();
      para.push(line.trim());
    }
  }
  flushPara(); closeList();

  return out.join('\n').replace(/BLOCK(\d+)/g, (_, i) => blocks[i]);
}

/* ---------- AIフィードバック ---------- */
document.getElementById('btn-ai-feedback').addEventListener('click', async () => {
  const area = document.getElementById('ai-feedback-area');
  area.classList.remove('hidden');
  area.innerHTML = '<div class="spinner"></div>';
  const label = `${AI.providerLabel()} / ${AI.getModel()}`;
  try {
    const text = await AI.presentationFeedback(Practice.session);
    area.innerHTML =
      `<p class="field-note md-source">— ${escapeHtml(label)} —</p>
       <div class="md-body">${renderMarkdown(text)}</div>`;
  } catch (err) {
    area.innerHTML = `<p class="md-error">⚠ ${escapeHtml(err.message)}</p>`;
  }
});

/* ---------- Q&Aシミュレータ ---------- */
const QA = { messages: [] };

document.getElementById('btn-qa-sim').addEventListener('click', () => {
  if (!Practice.session || !Practice.session.fullTranscript.trim()) {
    appAlert('文字起こしがありません。「終了後に文字起こし」を有効にして練習してください。', '❓ Q&Aシミュレータ');
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
  if (who === 'ai') {
    div.innerHTML = `<div class="md-body">${renderMarkdown(text)}</div>`;
  } else {
    div.textContent = text;
  }
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

/* ---------- デイリークエスト・実績 ---------- */
function renderQuests() {
  const d = Quests.data();
  const el = document.getElementById('quests-content');
  el.innerHTML = QUEST_DEFS.map((q) => {
    const done = !!d.done[q.id];
    const progress = (q.id === 'spend' && !done)
      ? `<span class="field-note">(${Math.min(50, d.spent || 0)}/50)</span>` : '';
    return `<div class="quest-row ${done ? 'done' : ''}">
      <span class="quest-icon">${q.icon}</span>
      <span class="quest-body">
        <strong>${q.name}</strong> ${progress}
        <span class="field-note">${q.desc}</span>
      </span>
      <span class="quest-reward">${done ? '✅' : `⭐${q.pt}<br>💎${q.gems}`}</span>
    </div>`;
  }).join('') + `
    <div class="quest-row bonus ${QUEST_DEFS.every((q) => d.done[q.id]) ? 'done' : ''}">
      <span class="quest-icon">🎯</span>
      <span class="quest-body"><strong>全達成ボーナス</strong>
        <span class="field-note">4つすべて達成する</span></span>
      <span class="quest-reward">${QUEST_DEFS.every((q) => d.done[q.id]) ? '✅' : `💎${QUEST_ALL_BONUS_GEMS}`}</span>
    </div>`;
}

function renderAchievements() {
  const unlocked = Achievements.data();
  document.getElementById('achv-summary').textContent =
    `${Achievements.count()} / ${ACHIEVEMENT_DEFS.length} 個解除 ・ 解除ごとに💎${ACHIEVEMENT_GEMS}`;
  document.getElementById('achievements-content').innerHTML =
    ACHIEVEMENT_DEFS.map((a) => {
      const got = unlocked[a.id];
      const dateStr = got ? new Date(got).toLocaleDateString('ja-JP') : '';
      return `<div class="achv-row ${got ? 'unlocked' : 'locked'}">
        <span class="achv-icon">${got ? a.icon : '🔒'}</span>
        <span class="achv-body">
          <strong>${a.name}</strong>
          <span class="field-note">${a.desc}</span>
        </span>
        ${got ? `<span class="achv-date">${dateStr}</span>` : ''}
      </div>`;
    }).join('');
}

/* ---------- 学会攻略モード ---------- */
document.getElementById('menu-run').addEventListener('click', async () => {
  if (Run.hasActive()) {
    if (Run.resume()) {
      showScreen('run-map');
      return;
    }
    // 旧バージョンのセーブが修復できない場合は破棄して新規開始を促す
    Run.end();
    await appAlert('以前のセーブデータが古い形式だったため、リセットしました。新しく始めてください。', '🗺️ 学会攻略');
  }
  {
    const go = await appConfirm(
      '学会1日分のマップに挑戦します。\n🧠メンタルが尽きるとゲームオーバーですが、獲得したXPは残ります。',
      '🗺️ 学会攻略を始める');
    if (!go) return;
    Run.newRun();
    showScreen('run-map');
  }
});

function updateRunMenuDesc() {
  const el = document.getElementById('menu-run-desc');
  if (el) el.textContent = Run.hasActive()
    ? '進行中のランがあります — 続きから'
    : 'マップを進んで学会を攻略するゲーム';
}

/* ---------- 会話トレーニング ---------- */
function renderConvoList() {
  const hist = JSON.parse(localStorage.getItem('lq_convo_history') || '[]');
  const el = document.getElementById('convo-list-content');
  el.innerHTML = SCENARIOS.map((s) => {
    const past = hist.filter((h) => h.scenarioId === s.id);
    const best = past.length ? Math.max(...past.map((h) => h.affinity)) : null;
    const badge = best !== null
      ? `<span class="scen-best" style="color:${affinityRank(best).color}">最高 ${affinityRank(best).rank}</span>`
      : '<span class="scen-best new">未挑戦</span>';
    return `<button class="scen-card" data-scenario="${s.id}">
      <span class="scen-icon">${s.icon}</span>
      <span class="scen-body">
        <span class="scen-title">${escapeHtml(s.title)}</span>
        <span class="scen-meta">Lv.${s.level} ・ ${s.turns.length}ターン ・ ${s.focus.map((f) => Stats.KEYS[f].label).join(' / ')}</span>
      </span>
      ${badge}
    </button>`;
  }).join('');

  el.querySelectorAll('[data-scenario]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const s = SCENARIOS.find((x) => x.id === btn.dataset.scenario);
      document.getElementById('convo-title').textContent = s.title;
      showScreen('convo-play');
      Convo.start(btn.dataset.scenario);
    });
  });
}

function renderStatus() {
  const d = Stats.data();
  const el = document.getElementById('status-content');
  const hasProgress = (typeof Login !== 'undefined');
  const login = hasProgress ? Login.data() : { streak: 0, total: 0 };
  const week = hasProgress ? PointsLog.week()
    : Array.from({ length: 7 }, () => ({ label: '-', pts: 0, isToday: false }));
  const maxPts = Math.max(1, ...week.map((w) => w.pts));

  el.innerHTML = `
    <div class="status-top-grid">
      <div class="stat-box">
        <div class="val">${Stats.totalLevel()}</div>
        <div class="lbl">総合レベル</div>
      </div>
      <div class="stat-box">
        <div class="val" style="color:var(--warn)">🔥 ${login.streak}</div>
        <div class="lbl">連続学習日数</div>
      </div>
      <div class="stat-box">
        <div class="val" style="color:#c084fc">💎 ${hasProgress ? Gems.get() : 0}</div>
        <div class="lbl">ジェム</div>
      </div>
      <div class="stat-box">
        <div class="val">${login.total || 0}</div>
        <div class="lbl">累計学習日数</div>
      </div>
    </div>

    <h3 class="about-section">今週の獲得ポイント</h3>
    <div class="week-chart card">
      ${week.map((w) => `
        <div class="week-col ${w.isToday ? 'today' : ''}">
          <span class="week-pts">${w.pts > 0 ? w.pts : ''}</span>
          <div class="week-bar-track">
            <div class="week-bar" style="height:${Math.max(w.pts > 0 ? 8 : 2, Math.round(w.pts / maxPts * 100))}%"></div>
          </div>
          <span class="week-label">${w.label}</span>
        </div>`).join('')}
    </div>

    <button class="btn-large" id="btn-achievements" style="margin-bottom:16px">
      🏅 実績 (${hasProgress ? `${Achievements.count()}/${ACHIEVEMENT_DEFS.length}` : '-'})
    </button>

    <h3 class="about-section">能力</h3>
    ${Object.entries(Stats.KEYS).map(([k, meta]) => {
      const lv = Stats.level(d[k] || 0);
      const pct = Math.round((lv.into / lv.need) * 100);
      return `<div class="stat-row">
        <span class="stat-icon">${meta.icon}</span>
        <span class="stat-name">${meta.label}<span class="stat-desc">${meta.desc}</span></span>
        <span class="stat-lv">Lv.${lv.level}</span>
        <div class="stat-track"><div class="stat-fill" style="width:${pct}%"></div></div>
        <span class="stat-xp">${lv.into} / ${lv.need} XP</span>
      </div>`;
    }).join('')}`;

  document.getElementById('btn-achievements').addEventListener('click', () =>
    showScreen('achievements'));

  const hist = JSON.parse(localStorage.getItem('lq_convo_history') || '[]');
  const hel = document.getElementById('convo-history-content');
  if (!hist.length) {
    hel.innerHTML = '<p class="empty-note">まだ記録がありません。<br>会話トレーニングを始めましょう!</p>';
    return;
  }
  hel.innerHTML = hist.slice(0, 20).map((h) => {
    const d2 = new Date(h.date);
    const r = affinityRank(h.affinity);
    return `<div class="history-item">
      <span class="date">${d2.getMonth() + 1}/${d2.getDate()} ${escapeHtml(h.title)}</span>
      <span style="font-weight:700;color:${r.color}">${r.rank}</span>
      <span class="meta">好感度 ${h.affinity} ・ ベスト ${h.bestCount}/${h.total}</span>
    </div>`;
  }).join('');
}

/* ---------- 講演の録音・要約 ---------- */
document.getElementById('btn-talk-start').addEventListener('click', async () => {
  if (!localStorage.getItem('lq_openai_key')) {
    appAlert('文字起こしにOpenAI APIキーが必要です。設定画面で入力してください。', '🔑 APIキーが必要');
    return;
  }
  const meta = {
    title: document.getElementById('talk-title').value.trim(),
    speaker: document.getElementById('talk-speaker').value.trim(),
    venue: document.getElementById('talk-venue').value.trim(),
    lang: document.getElementById('talk-lang').value
  };
  try {
    await Talk.start(meta);
  } catch (err) {
    appAlert('録音を開始できませんでした: ' + err.message, '🎙️ エラー');
    return;
  }
  document.getElementById('talk-note').value = '';
  document.getElementById('btn-talk-pause').textContent = '⏸ 一時停止';
  document.getElementById('talk-rec-title').textContent = meta.title || '無題の講演';
  showScreen('talk-record');
});

document.getElementById('btn-talk-mark').addEventListener('click', () => Talk.addMark());
document.getElementById('btn-talk-pause').addEventListener('click', () => Talk.togglePause());

document.getElementById('btn-talk-finish').addEventListener('click', async () => {
  Talk.current.note = document.getElementById('talk-note').value.trim();
  await Talk.stop();
  showScreen('talk-result');
  const el = document.getElementById('talk-result-content');
  const actions = document.getElementById('talk-actions');
  actions.classList.add('hidden');
  document.getElementById('talk-share-status').textContent = '';

  try {
    el.innerHTML = '<div class="spinner"></div><p class="field-note" style="text-align:center">文字起こし中...</p>';
    await Talk.transcribe();
    el.innerHTML = '<div class="spinner"></div><p class="field-note" style="text-align:center">要約を作成中...</p>';
    await Talk.summarize();
    Talk.save();
    if (typeof Achievements !== 'undefined') Achievements.unlock('first-talk');
    renderTalkResult();
    actions.classList.remove('hidden');
  } catch (err) {
    el.innerHTML = `<p class="md-error">⚠ ${escapeHtml(err.message)}</p>`;
    if (Talk.current && Talk.current.transcript) {
      // 要約に失敗しても文字起こしは残す
      Talk.save();
      el.innerHTML += `<p class="field-note">文字起こしは保存しました。「聴講した講演」から確認できます。</p>
        <div class="transcript-box">${escapeHtml(Talk.current.transcript)}</div>`;
    }
    if (Talk.audioUrl) {
      el.innerHTML += `<p class="field-note" style="margin-top:12px">録音は再生できます:</p>
        <audio controls src="${Talk.audioUrl}"></audio>`;
    }
  }
});

function renderTalkResult() {
  const c = Talk.current;
  const el = document.getElementById('talk-result-content');
  el.innerHTML = `
    <div class="card">
      <h3 style="font-size:1.05rem;margin-bottom:6px">${escapeHtml(c.title)}</h3>
      <p class="field-note">
        ${c.speaker ? escapeHtml(c.speaker) + ' · ' : ''}${PracticeUtil.fmtTime(c.durationMs)}
        ${c.markedText && c.markedText.length ? ' · ⭐' + c.markedText.length : ''}
      </p>
    </div>
    ${Talk.audioUrl ? `<audio controls src="${Talk.audioUrl}"></audio>` : ''}
    <div class="card"><div class="md-body">${renderMarkdown(c.summary)}</div></div>
  `;
}

/* 共有・保存・コピー */
function includeTranscript() {
  return document.getElementById('include-transcript').checked;
}

document.getElementById('btn-talk-share').addEventListener('click', async () => {
  const status = document.getElementById('talk-share-status');
  try {
    const mode = await Talk.share(includeTranscript());
    status.textContent = mode === 'cancelled' ? '共有をキャンセルしました'
      : (mode === 'file' ? '✓ ファイルとして共有しました' : '✓ テキストとして共有しました');
  } catch (err) {
    status.textContent = '⚠ ' + err.message;
  }
});

document.getElementById('btn-talk-download').addEventListener('click', () => {
  Talk.download(includeTranscript());
  document.getElementById('talk-share-status').textContent = '✓ ダウンロードフォルダに保存しました';
});

document.getElementById('btn-talk-copy').addEventListener('click', async () => {
  const status = document.getElementById('talk-share-status');
  try {
    await Talk.copy(includeTranscript());
    status.textContent = '✓ クリップボードにコピーしました';
  } catch (err) {
    status.textContent = '⚠ コピーできませんでした: ' + err.message;
  }
});

/* 聴講した講演の一覧 */
function renderTalkList() {
  const list = JSON.parse(localStorage.getItem('lq_talks') || '[]');
  const el = document.getElementById('talk-list-content');
  if (list.length === 0) {
    el.innerHTML = '<p class="empty-note">まだ録音した講演がありません。<br>学会で使ってみましょう!</p>';
    return;
  }
  el.innerHTML = list.map((t) => {
    const d = new Date(t.date);
    const dateStr = `${d.getMonth() + 1}/${d.getDate()}`;
    return `<button class="talk-item" data-talk-id="${t.id}">
      <span class="talk-item-title">${escapeHtml(t.title)}</span>
      <span class="meta">${dateStr}${t.speaker ? ' · ' + escapeHtml(t.speaker) : ''} · ${PracticeUtil.fmtTime(t.durationMs)}${t.summary ? '' : ' · 要約なし'}</span>
    </button>`;
  }).join('');

  el.querySelectorAll('[data-talk-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const found = Talk.load(Number(btn.dataset.talkId));
      if (!found) return;
      showScreen('talk-result');
      document.getElementById('talk-share-status').textContent = '';
      document.getElementById('talk-actions').classList.remove('hidden');
      if (found.summary) {
        renderTalkResult();
      } else {
        document.getElementById('talk-result-content').innerHTML =
          `<div class="card"><h3 style="font-size:1.05rem">${escapeHtml(found.title)}</h3>
           <p class="field-note">要約がありません(作成時にエラー)。文字起こしのみ表示します。</p></div>
           <div class="transcript-box">${escapeHtml(found.transcript || '')}</div>`;
      }
    });
  });
}

/* ---------- アプリ情報 ---------- */
function renderAbout() {
  document.getElementById('about-version').textContent = `v${APP_VERSION}`;
  document.getElementById('about-build').textContent = `ビルド日 ${APP_BUILD}`;
  document.getElementById('vc-running').textContent = `v${APP_VERSION}`;

  const typeLabel = { new: '新機能', fix: '修正', change: '変更' };
  document.getElementById('changelog-content').innerHTML = CHANGELOG.map((rel, idx) => `
    <div class="release ${idx === 0 ? 'latest' : ''}">
      <div class="release-head">
        <span class="release-ver">v${escapeHtml(rel.version)}</span>
        ${idx === 0 ? '<span class="release-badge">最新</span>' : ''}
        <span class="release-date">${escapeHtml(rel.date)}</span>
      </div>
      <ul class="release-list">
        ${rel.items.map((it) => `
          <li><span class="tag tag-${it.type}">${typeLabel[it.type] || ''}</span>${escapeHtml(it.text)}</li>
        `).join('')}
      </ul>
    </div>
  `).join('');
}

/** サーバー上の最新バージョンを、キャッシュを一切通さずに取得する */
async function fetchServerVersion() {
  const url = `version.json?t=${Date.now()}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`サーバーから取得できません (${res.status})`);
  return res.json();
}

/** キャッシュとService Workerを完全に消す */
async function purgeAll() {
  if ('caches' in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
  }
  if ('serviceWorker' in navigator) {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map((r) => r.unregister()));
  }
}

/** キャッシュを避けて再読み込み(URLに時刻を付けてHTTPキャッシュも迂回) */
function hardReload() {
  const base = location.href.split('?')[0].split('#')[0];
  location.replace(`${base}?v=${Date.now()}`);
}

document.getElementById('btn-check-update').addEventListener('click', async () => {
  const status = document.getElementById('update-status');
  const serverEl = document.getElementById('vc-server');
  status.textContent = 'サーバーに問い合わせ中...';
  let info;
  try {
    info = await fetchServerVersion();
  } catch (err) {
    serverEl.textContent = '取得失敗';
    status.textContent = `⚠ ${err.message}\nネットワーク接続と、GitHubへのpushが済んでいるかを確認してください。`;
    return;
  }
  serverEl.textContent = `v${info.version}`;

  if (info.version === APP_VERSION) {
    status.textContent = '✓ すでに最新版です。サーバーにも新しいバージョンはありません。';
    return;
  }
  serverEl.style.color = 'var(--success)';
  status.textContent = `新しいバージョン v${info.version} があります。取得しています...`;
  try {
    await purgeAll();
    setTimeout(hardReload, 400);
  } catch (err) {
    status.textContent = '⚠ ' + err.message + ' — ブラウザを再起動してお試しください。';
  }
});

document.getElementById('btn-force-reset').addEventListener('click', async () => {
  const status = document.getElementById('update-status');
  const go = await appConfirm(
    '保存済みのキャッシュとService Workerをすべて削除して再取得します。\n(APIキー・練習履歴・ステータスは消えません)',
    '🧹 完全リセット');
  if (!go) return;
  status.textContent = '削除中...';
  try {
    await purgeAll();
    status.textContent = '再取得しています...';
    setTimeout(hardReload, 400);
  } catch (err) {
    status.textContent = '⚠ ' + err.message;
  }
});

/* ---------- 初期化 ---------- */
document.getElementById('version-footer').textContent = `ConfQuest v${APP_VERSION}`;
document.getElementById('menu-version').textContent = `バージョン v${APP_VERSION}・更新履歴`;
document.getElementById('status-summary').textContent = `総合レベル ${Stats.totalLevel()}・能力の成長`;

/* 起動時にサーバーの最新版を静かに確認し、違えばホームに通知を出す */
(async function checkUpdateOnStart() {
  try {
    const info = await fetchServerVersion();
    if (info.version !== APP_VERSION) {
      const banner = document.getElementById('update-banner');
      document.getElementById('update-banner-text').textContent =
        `新しいバージョン v${info.version} があります`;
      banner.classList.remove('hidden');
      document.getElementById('btn-banner-update').addEventListener('click', async () => {
        document.getElementById('update-banner-text').textContent = '更新中...';
        await purgeAll();
        setTimeout(hardReload, 400);
      });
    }
  } catch (_) { /* オフライン時は何もしない */ }
})();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').then((reg) => {
    // 新しいバージョンが用意できたら即座に切り替える
    reg.addEventListener('updatefound', () => {
      const sw = reg.installing;
      if (!sw) return;
      sw.addEventListener('statechange', () => {
        if (sw.state === 'installed' && navigator.serviceWorker.controller) {
          sw.postMessage('skipWaiting');
        }
      });
    });
    reg.update().catch(() => {});
  }).catch(() => {});

  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloaded) return;
    reloaded = true;
    location.reload();
  });
}

// ログイン記録とデイリークエスト判定(progress.js未読込でも起動は継続)
if (typeof Login !== 'undefined') {
  Login.record();
  Quests.onLogin();
}
renderHome();
