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
  if (name === 'learn' && typeof Learn !== 'undefined') Learn.renderHome();
  if (name === 'learn-dex' && typeof Learn !== 'undefined') Learn.renderDex();
  if (name === 'learn-check' && typeof Learn !== 'undefined') Learn.renderCheck();
  if (name === 'quests' && typeof Quests !== 'undefined') renderQuests();
  if (name === 'achievements' && typeof Achievements !== 'undefined') renderAchievements();
  if (name === 'itemdex' && typeof ItemDex !== 'undefined') renderItemDex();
  if (name === 'gemshop' && typeof GemShop !== 'undefined') renderGemShop();
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
    Quests.refreshHomeCard();
  }
  const sum = document.getElementById('status-summary');
  if (sum) {
    sum.textContent = `総合レベル ${Stats.totalLevel()}` +
      (typeof Achievements !== 'undefined'
        ? `・実績 ${Achievements.count()}/${ACHIEVEMENT_DEFS.length}` : '');
  }
  updateRunMenuDesc();
  updateLearnMenuDesc();
  if (typeof ConfMode !== 'undefined') ConfMode.applyHome();
}

/* ---------- 学会モード(録音機能をホーム最上部に浮上させる) ---------- */
const ConfMode = {
  KEY: 'lq_conf_mode',
  PROMPTED_KEY: 'lq_conf_prompted',
  on() { return localStorage.getItem(this.KEY) === '1'; },
  set(v) { localStorage.setItem(this.KEY, v ? '1' : '0'); },

  applyHome() {
    const area = document.getElementById('conf-mode-area');
    const chip = document.getElementById('btn-conf-mode');
    if (!area || !chip) return;
    const on = this.on();
    area.classList.toggle('hidden', !on);
    chip.textContent = on ? '🎙️ 学会モード ON — 終わったらタップでOFF' : '🎙️ 学会モード';
    chip.classList.toggle('on', on);
  },

  toggle() {
    this.set(!this.on());
    this.applyHome();
    showToast(this.on()
      ? '🎙️ 学会モードON: 録音機能をホームの一番上に出しました'
      : '学会モードをOFFにしました');
  },

  /** ISSY39の前日〜期間中に一度だけ提案する */
  async maybeSuggest() {
    if (this.on() || typeof EventDates === 'undefined') return;
    if (localStorage.getItem(this.PROMPTED_KEY)) return;
    const left = EventDates.daysLeft('ko');
    if (left === null || left > 1 || left < -7) return;
    localStorage.setItem(this.PROMPTED_KEY, '1');
    const go = await appConfirm(
      'ISSY39が近づいています!\n学会モードをONにすると、「講演を録音・要約」がホームの一番上に表示されます。\n(ホームのチップからいつでも切り替えられます)',
      '🎙️ 学会モードにしますか?');
    if (go) {
      this.set(true);
      this.applyHome();
      showToast('🎙️ 学会モードON! 良い学会を!');
    }
  }
};

{
  const chip = document.getElementById('btn-conf-mode');
  if (chip) chip.addEventListener('click', () => ConfMode.toggle());
  // 「そのほか」の開閉状態を記憶
  const more = document.getElementById('more-menu');
  if (more) {
    if (localStorage.getItem('lq_more_open') === '1') more.open = true;
    more.addEventListener('toggle', () =>
      localStorage.setItem('lq_more_open', more.open ? '1' : '0'));
  }
}

/** ホームのLanguage Questボタンに復習枚数とカウントダウンを表示 */
function updateLearnMenuDesc() {
  const el = document.getElementById('menu-learn-desc');
  if (!el || typeof SRS === 'undefined') return;
  const parts = [];
  const due = Math.min(SRS.dueCards().length, SRS.REVIEW_CAP);
  if (due > 0) parts.push(`📖 今日の復習 ${due}枚`);
  const dl = EventDates.daysLeft('ko');
  if (dl !== null && dl > 0) parts.push(`🎤 ISSY39まであと${dl}日`);
  else {
    const dw = EventDates.daysLeft('yue');
    if (dw !== null && dw > 0) parts.push(`💒 結婚式まであと${dw}日`);
  }
  el.textContent = parts.length ? parts.join(' ・ ') : '韓国語・広東語をカードで育てて習得';
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
  if (typeof EventDates !== 'undefined') {
    document.getElementById('event-ko').value = EventDates.get('ko');
    document.getElementById('event-yue').value = EventDates.get('yue');
  }
  document.getElementById('voice-check-result').innerHTML = '';
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
  if (typeof EventDates !== 'undefined') {
    EventDates.set('ko', document.getElementById('event-ko').value);
    EventDates.set('yue', document.getElementById('event-yue').value);
  }
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

/* ---------- 読み上げ音声の診断(Language Quest) ---------- */
const _vcBtn = document.getElementById('btn-voice-check');
if (_vcBtn) _vcBtn.addEventListener('click', () => {
  const el = document.getElementById('voice-check-result');
  if (typeof Speech === 'undefined' || !('speechSynthesis' in window)) {
    el.innerHTML = '<p class="field-note">⚠ この端末・ブラウザは読み上げに対応していません。</p>';
    return;
  }
  Speech.init(); // 最新のvoice一覧を取り直す
  const samples = { ko: '안녕하세요', yue: '你好' };
  el.innerHTML = Object.entries(LEARN_LANGS).map(([k, m]) => {
    const v = Speech.voiceFor(k);
    return `<div class="voice-row">
      <span>${m.flag} ${m.label}</span>
      <span class="${v ? 'voice-ok' : 'voice-ng'}">${v ? '✓ 対応 (' + escapeHtml(v.lang) + ')' : '✗ 音声なし'}</span>
      ${v ? `<button class="btn-control" type="button" data-voicetest="${k}">▶ テスト</button>` : ''}
    </div>`;
  }).join('') + (Speech.canSpeak('yue') ? '' :
    '<p class="field-note">広東語の音声が無い端末では、聞き取り問題は文字での出題になります。Androidでは「設定 → システム → テキスト読み上げ」でGoogle音声データに広東語を追加できる場合があります。</p>');
  el.querySelectorAll('[data-voicetest]').forEach((btn) =>
    btn.addEventListener('click', () =>
      Speech.speak(samples[btn.dataset.voicetest], btn.dataset.voicetest, 0.9)));
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
  const bonus = Quests.bonusState();

  el.innerHTML = QUEST_DEFS.map((q) => {
    const done = !!d.done[q.id];
    const ready = !done && !!d.ready[q.id];
    const progress = (q.id === 'spend' && !done && !ready)
      ? `<span class="field-note">(${Math.min(50, d.spent || 0)}/50)</span>` : '';
    const reward = done
      ? '✅'
      : (ready
        ? `<button class="quest-claim" data-claim="${q.id}">🎁 受け取る</button>`
        : `⭐${q.pt}<br>💎${q.gems}`);
    return `<div class="quest-row ${done ? 'done' : ''} ${ready ? 'ready' : ''}" data-quest-row="${q.id}">
      <span class="quest-icon">${q.icon}</span>
      <span class="quest-body">
        <strong>${q.name}</strong> ${progress}
        <span class="field-note">${ready ? '達成! タップして報酬を受け取ろう' : q.desc}</span>
      </span>
      <span class="quest-reward">${reward}</span>
    </div>`;
  }).join('') + `
    <div class="quest-row bonus ${bonus === 'claimed' ? 'done' : ''} ${bonus === 'ready' ? 'ready' : ''}" data-quest-row="__bonus">
      <span class="quest-icon">🎯</span>
      <span class="quest-body"><strong>全達成ボーナス</strong>
        <span class="field-note">${bonus === 'ready' ? '全クエスト達成! タップして受け取ろう' : `${QUEST_DEFS.length}つすべての報酬を受け取る`}</span></span>
      <span class="quest-reward">${bonus === 'claimed' ? '✅'
        : (bonus === 'ready' ? `<button class="quest-claim" data-claim="__bonus">🎁 受け取る</button>` : `💎${QUEST_ALL_BONUS_GEMS}`)}</span>
    </div>`;

  el.querySelectorAll('[data-claim]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.claim;
      let rewardHtml = '';
      if (id === '__bonus') {
        if (!Quests.claimBonus()) return;
        rewardHtml = `💎+${QUEST_ALL_BONUS_GEMS}`;
      } else {
        const def = Quests.claim(id);
        if (!def) return;
        rewardHtml = `⭐+${def.pt} 💎+${def.gems}`;
      }
      playClaimEffect(el.querySelector(`[data-quest-row="${id}"]`), rewardHtml);
      // エフェクトを見せてから再描画(全達成でボーナスが出現する場合も反映)
      setTimeout(() => {
        if (document.getElementById('screen-quests').classList.contains('active')) renderQuests();
      }, 1000);
    });
  });
}

/** 報酬受け取りの演出: 行のフラッシュ + 浮き上がる報酬 + 飛び散るパーティクル */
function playClaimEffect(row, rewardHtml) {
  if (!row) return;
  row.classList.remove('ready');
  row.classList.add('done', 'claim-flash');
  const rw = row.querySelector('.quest-reward');
  if (rw) rw.innerHTML = '✅';

  const pop = document.createElement('div');
  pop.className = 'reward-pop';
  pop.textContent = rewardHtml;
  row.appendChild(pop);

  for (let i = 0; i < 12; i++) {
    const s = document.createElement('span');
    s.className = 'reward-spark';
    const ang = (Math.PI * 2 * i) / 12 + Math.random() * 0.5;
    const dist = 40 + Math.random() * 45;
    s.style.setProperty('--dx', `${Math.cos(ang) * dist}px`);
    s.style.setProperty('--dy', `${Math.sin(ang) * dist * 0.7}px`);
    s.textContent = ['✨', '⭐', '💎', '🎉'][i % 4];
    row.appendChild(s);
    setTimeout(() => s.remove(), 950);
  }
  setTimeout(() => pop.remove(), 1150);
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

/* ---------- ジェムショップ ---------- */
function renderGemShop() {
  document.getElementById('gemshop-balance').textContent = `💎 ${Gems.get()}`;
  const gems = Gems.get();
  document.getElementById('gemshop-content').innerHTML = GEM_SHOP.map((g) => {
    const bought = GemShop.has(g.id);
    const afford = gems >= g.cost;
    return `<div class="shop-row ${bought ? 'bought' : ''}">
      <span class="shop-icon">${g.icon}</span>
      <span class="shop-body"><strong>${g.name}</strong>
        <span class="field-note">${g.desc}</span></span>
      <button class="btn-control ${!bought && afford ? 'primary' : ''}" data-gembuy="${g.id}"
        ${bought || !afford ? 'disabled' : ''}>${bought ? '✅ 適用待ち' : `💎${g.cost}`}</button>
    </div>`;
  }).join('');

  document.querySelectorAll('[data-gembuy]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.gembuy;
      if (GemShop.buy(id)) {
        const g = GEM_SHOP.find((x) => x.id === id);
        showToast(`${g.icon} ${g.name} を購入! 次のランに適用されます`);
        renderGemShop();
        renderHome();
      }
    });
  });
}

/* ---------- アイテム図鑑 ---------- */
const DEX_GROUPS = [
  { kind: 'gadget', label: '🎒 ガジェット', note: '持っている間ずっと効果が続きます' },
  { kind: 'relic',  label: '✨ レリック', note: '持ったまま学会を制覇するとボーナス' },
  { kind: 'drink',  label: '🥤 ドリンク', note: '使い切り。HUDのアイコンをタップして使用' },
  { kind: 'bad',    label: '😪 バッドアイテム', note: 'できれば持ちたくない。お店で売って処分' }
];

function renderItemDex() {
  const all = Object.keys(RUN_ITEMS);
  const found = all.filter((id) => ItemDex.has(id));
  document.getElementById('dex-summary').textContent =
    `${found.length} / ${all.length} 種類を発見 ・ 未発見のアイテムは効果が伏せられています`;

  document.getElementById('itemdex-content').innerHTML = DEX_GROUPS.map((g) => {
    const ids = all.filter((id) => RUN_ITEMS[id].kind === g.kind);
    if (!ids.length) return '';
    const gotCount = ids.filter((id) => ItemDex.has(id)).length;
    return `
      <h3 class="about-section">${g.label} <span class="dex-count">${gotCount}/${ids.length}</span></h3>
      <p class="field-note" style="margin-bottom:8px">${g.note}</p>
      <div class="dex-grid">
        ${ids.map((id) => {
          const got = ItemDex.has(id);
          return `<button class="dex-cell ${got ? 'found' : 'unknown'}" data-dex="${id}"
            aria-label="${got ? escapeHtml(RUN_ITEMS[id].name) : '未発見'}">
            <span class="dex-icon">${RUN_ITEMS[id].icon}</span>
          </button>`;
        }).join('')}
      </div>`;
  }).join('');

  document.querySelectorAll('[data-dex]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.dex;
      const it = RUN_ITEMS[id];
      if (ItemDex.has(id)) {
        const when = new Date(ItemDex.data()[id]).toLocaleDateString('ja-JP');
        appAlert(`${it.desc}\n\n初めて手に入れた日: ${when}`, `${it.icon} ${it.name}`);
      } else {
        appAlert('まだ手に入れたことがありません。\n学会攻略で見つけると、効果がここに記録されます。', '❔ 未発見のアイテム');
      }
    });
  });
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
    let msg = '学会1日分のマップに挑戦します。\n🧠メンタルが尽きるとゲームオーバーですが、獲得したXPは残ります。';
    if (typeof DailyBonus !== 'undefined') {
      msg += `\n\n${DailyBonus.multiplierLabel('run')}`;
    }
    const perks = (typeof GemShop !== 'undefined') ? GemShop.pending() : [];
    if (perks.length) {
      msg += '\n\n💎 適用される特典:\n' + perks.map((id) => {
        const g = GEM_SHOP.find((x) => x.id === id);
        return g ? `  ${g.icon} ${g.name}` : '';
      }).join('\n');
    }
    const go = await appConfirm(msg, '🗺️ 学会攻略を始める');
    if (!go) return;
    Run.newRun();
    showScreen('run-map');
    if (perks.length) showToast('💎 特典を適用しました');
  }
});

document.getElementById('btn-run-retire').addEventListener('click', async () => {
  if (!Run.state) return;
  const keep = Math.round(Run.state.funds * 0.4);
  const go = await appConfirm(
    `今回のランをここで終了します。\n\n💰${Run.state.funds} のうち ⭐${keep} pt を持ち帰れます。\n(獲得したXPと実績はすべて残ります)`,
    '🏳️ ランを切り上げる');
  if (!go) return;
  Run.retire();
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

    <div class="collection-btns">
      <button class="btn-large" id="btn-achievements">
        🏅 実績<br><span class="coll-count">${hasProgress ? `${Achievements.count()}/${ACHIEVEMENT_DEFS.length}` : '-'}</span>
      </button>
      <button class="btn-large" id="btn-itemdex">
        📖 アイテム図鑑<br><span class="coll-count">${hasProgress ? `${ItemDex.count()}/${Object.keys(RUN_ITEMS).length}` : '-'}</span>
      </button>
    </div>

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
  document.getElementById('btn-itemdex').addEventListener('click', () =>
    showScreen('itemdex'));

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
ConfMode.maybeSuggest();
