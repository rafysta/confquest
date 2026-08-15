/* ConfQuest - 発表練習エンジン */
'use strict';

const PracticeUtil = {
  fmtTime(ms) {
    const s = Math.round(ms / 1000);
    const m = Math.floor(s / 60);
    return `${m}:${String(s % 60).padStart(2, '0')}`;
  },
  fmtSigned(ms) {
    const sign = ms >= 0 ? '+' : '-';
    return sign + this.fmtTime(Math.abs(ms));
  }
};

const Practice = {
  pdfDoc: null,
  pdfName: '',
  session: null,
  timerInterval: null,
  mediaRecorder: null,
  audioChunks: [],
  audioBlob: null,
  audioUrl: null,
  paused: false,
  pauseStartedAt: 0,
  _renderSeq: 0,
  _renderTask: null,

  /* ---------- PDF ---------- */
  async loadPdf(file) {
    const buf = await file.arrayBuffer();
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    this.pdfDoc = await pdfjsLib.getDocument({ data: buf }).promise;
    this.pdfName = file.name;
    return this.pdfDoc.numPages;
  },

  async renderSlide(pageNum) {
    if (!this.pdfDoc) return;
    const seq = ++this._renderSeq;
    // 前の描画が走っていたらキャンセル(連打でPDF.jsがエラーになるのを防ぐ)
    if (this._renderTask) {
      try { this._renderTask.cancel(); } catch (_) {}
      this._renderTask = null;
    }
    let page;
    try {
      page = await this.pdfDoc.getPage(pageNum);
    } catch (_) { return; }
    if (seq !== this._renderSeq) return; // より新しい描画要求が来た

    const canvas = document.getElementById('slide-canvas');
    const area = document.getElementById('slide-area');
    const viewport1 = page.getViewport({ scale: 1 });
    const dpr = window.devicePixelRatio || 1;
    const scale = Math.min(
      area.clientWidth / viewport1.width,
      area.clientHeight / viewport1.height
    ) * dpr;
    const viewport = page.getViewport({ scale });
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    canvas.style.width = `${viewport.width / dpr}px`;
    canvas.style.height = `${viewport.height / dpr}px`;
    this._renderTask = page.render({ canvasContext: canvas.getContext('2d'), viewport });
    try {
      await this._renderTask.promise;
    } catch (_) { /* キャンセル時 */ }
    if (seq === this._renderSeq) this._renderTask = null;
  },

  /* ---------- セッション ---------- */
  async start(opts) {
    const numSlides = this.pdfDoc ? this.pdfDoc.numPages : 1;
    this.session = {
      date: new Date().toISOString(),
      pdfName: this.pdfName,
      targetMs: opts.targetMinutes * 60000,
      lang: opts.lang,
      transcribe: opts.enableTranscribe,
      numSlides,
      currentSlide: 1,
      startTime: Date.now(),
      pausedMs: 0,
      slides: Array.from({ length: numSlides }, () => ({ timeMs: 0, transcript: '' })),
      slideEnteredAt: Date.now(),
      // スライド切り替えの時系列(録音時間軸と一致、pause除外)
      timeline: [{ slide: 1, start: 0 }],
      fullTranscript: '',
      totalMs: 0,
      wordCount: 0,
      wpm: 0,
      fillerCount: 0,
      fillerDetail: '',
      transcriptError: ''
    };
    this.paused = false;
    this.audioBlob = null;

    document.getElementById('no-pdf-message').classList.toggle('hidden', !!this.pdfDoc);
    document.getElementById('slide-canvas').style.display = this.pdfDoc ? '' : 'none';
    if (this.pdfDoc) {
      setTimeout(() => this.renderSlide(1), 50);
    }

    if (opts.enableRecording || opts.enableTranscribe) {
      await this.startRecording().catch((e) => {
        appAlert('録音を開始できませんでした: ' + e.message, '🎙️ エラー');
      });
    }

    this.timerInterval = setInterval(() => this.tick(), 500);
    this.updateStatus();
  },

  elapsedMs() {
    if (!this.session) return 0;
    let e = Date.now() - this.session.startTime - this.session.pausedMs;
    if (this.paused) e -= (Date.now() - this.pauseStartedAt);
    return Math.max(0, e);
  },

  tick() {
    if (this.paused) return;
    this.commitSlideTime();
    this.updateStatus();
  },

  commitSlideTime() {
    const s = this.session;
    const now = Date.now();
    s.slides[s.currentSlide - 1].timeMs += now - s.slideEnteredAt;
    s.slideEnteredAt = now;
  },

  updateStatus() {
    const s = this.session;
    const elapsed = this.elapsedMs();
    document.getElementById('p-slide-info').textContent =
      `Slide ${s.currentSlide} / ${s.numSlides}`;
    document.getElementById('p-elapsed').textContent =
      `${PracticeUtil.fmtTime(elapsed)} / ${PracticeUtil.fmtTime(s.targetMs)}`;
    document.getElementById('slide-timer').textContent =
      `このスライド ${PracticeUtil.fmtTime(s.slides[s.currentSlide - 1].timeMs)}`;

    // ペースバー: 実際の進捗(時間) vs 理想位置(スライド進捗)
    const timeFrac = Math.min(1, elapsed / s.targetMs);
    const slideFrac = s.numSlides > 1 ? (s.currentSlide - 1) / s.numSlides : timeFrac;
    const bar = document.getElementById('pace-bar');
    bar.style.width = `${timeFrac * 100}%`;
    document.getElementById('pace-marker').style.left = `${slideFrac * 100}%`;

    // 終了予測: 現スライドまでの経過から残りを外挿
    const warnEl = document.getElementById('pace-warning');
    if (s.numSlides > 1 && s.currentSlide > 1) {
      const perSlide = elapsed / (s.currentSlide - 1 + this.currentSlideFrac());
      const predicted = perSlide * s.numSlides;
      document.getElementById('p-prediction').textContent =
        `予測 ${PracticeUtil.fmtTime(predicted)}`;
      const diff = predicted - s.targetMs;
      const behind = diff > 30000;
      bar.classList.toggle('behind', behind);
      if (behind) {
        warnEl.textContent = `⚠ このペースだと ${PracticeUtil.fmtTime(diff)} 超過します`;
        warnEl.classList.remove('hidden');
      } else if (diff < -30000 && timeFrac > 0.2) {
        warnEl.textContent = `ペースが速すぎます (${PracticeUtil.fmtTime(-diff)} 早く終わる予測)`;
        warnEl.classList.remove('hidden');
      } else {
        warnEl.classList.add('hidden');
      }
    } else {
      document.getElementById('p-prediction').textContent = '予測 --:--';
      warnEl.classList.add('hidden');
      bar.classList.toggle('behind', elapsed > s.targetMs);
    }
  },

  currentSlideFrac() {
    const s = this.session;
    const cur = s.slides[s.currentSlide - 1].timeMs;
    const avg = this.elapsedMs() / Math.max(1, s.currentSlide);
    return Math.min(1, avg > 0 ? cur / avg : 0);
  },

  nextSlide() {
    const s = this.session;
    if (!s || this.paused) return;
    if (s.currentSlide < s.numSlides) {
      this.commitSlideTime();
      s.currentSlide++;
      s.timeline.push({ slide: s.currentSlide, start: this.elapsedMs() });
      if (this.pdfDoc) this.renderSlide(s.currentSlide);
      this.updateStatus();
      this.flashTap();
    }
  },

  prevSlide() {
    const s = this.session;
    if (!s || this.paused) return;
    if (s.currentSlide > 1) {
      this.commitSlideTime();
      s.currentSlide--;
      s.timeline.push({ slide: s.currentSlide, start: this.elapsedMs() });
      if (this.pdfDoc) this.renderSlide(s.currentSlide);
      this.updateStatus();
      this.flashTap();
    }
  },

  flashTap() {
    const area = document.getElementById('slide-area');
    area.classList.remove('tap-flash');
    void area.offsetWidth; // reflow でアニメーション再発火
    area.classList.add('tap-flash');
  },

  togglePause() {
    if (!this.session) return;
    if (!this.paused) {
      this.paused = true;
      this.pauseStartedAt = Date.now();
      this.commitSlideTime();
      if (this.mediaRecorder && this.mediaRecorder.state === 'recording') this.mediaRecorder.pause();
      document.getElementById('btn-pause').textContent = '▶ 再開';
    } else {
      this.session.pausedMs += Date.now() - this.pauseStartedAt;
      this.session.slideEnteredAt = Date.now();
      this.paused = false;
      if (this.mediaRecorder && this.mediaRecorder.state === 'paused') this.mediaRecorder.resume();
      document.getElementById('btn-pause').textContent = '⏸ 一時停止';
    }
  },

  async finish() {
    const s = this.session;
    if (!s) return null;
    if (this.paused) this.togglePause();
    clearInterval(this.timerInterval);
    this.commitSlideTime();
    s.totalMs = this.elapsedMs();
    await this.stopRecording();
    return s;
  },

  /* ---------- 録音 ---------- */
  async startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.audioChunks = [];
    this.mediaRecorder = new MediaRecorder(stream);
    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.audioChunks.push(e.data);
    };
    this.mediaRecorder.start();
    document.getElementById('rec-indicator').classList.remove('hidden');
  },

  stopRecording() {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        resolve(); return;
      }
      this.mediaRecorder.onstop = () => {
        this.audioBlob = new Blob(this.audioChunks, { type: this.mediaRecorder.mimeType });
        if (this.audioUrl) URL.revokeObjectURL(this.audioUrl);
        this.audioUrl = URL.createObjectURL(this.audioBlob);
        this.mediaRecorder.stream.getTracks().forEach((t) => t.stop());
        document.getElementById('rec-indicator').classList.add('hidden');
        resolve();
      };
      this.mediaRecorder.stop();
    });
  },

  /* ---------- 文字起こし(録音終了後にWhisper APIで実行) ---------- */
  async transcribeAudio() {
    const s = this.session;
    if (!s || !s.transcribe) return;
    if (!this.audioBlob || this.audioBlob.size === 0) {
      s.transcriptError = '録音データがありません。';
      return;
    }
    try {
      const segments = await STT.transcribe(this.audioBlob, s.lang);
      // 各セグメントの中間時刻でどのスライド滞在中かを判定して割り当て
      for (const seg of segments) {
        const midMs = ((seg.start + seg.end) / 2) * 1000;
        let slide = 1;
        for (const ev of s.timeline) {
          if (ev.start <= midMs) slide = ev.slide;
          else break;
        }
        const sl = s.slides[slide - 1];
        sl.transcript += (sl.transcript ? ' ' : '') + seg.text.trim();
      }
    } catch (err) {
      s.transcriptError = err.message;
    }
  },

  /* ---------- 統計 ---------- */
  computeStats() {
    const s = this.session;
    s.fullTranscript = s.slides
      .map((sl, i) => `[Slide ${i + 1}] ${sl.transcript}`.trim())
      .join('\n');
    const words = s.slides.map((sl) => sl.transcript).join(' ')
      .split(/\s+/).filter(Boolean);
    const minutes = s.totalMs / 60000;
    s.wordCount = words.length;
    s.wpm = minutes > 0.1 ? Math.round(words.length / minutes) : 0;

    const fillers = (localStorage.getItem('lq_fillers') ||
      'um, uh, so, actually, basically, you know, kind of, I mean, like')
      .split(',').map((w) => w.trim().toLowerCase()).filter(Boolean);
    const text = ' ' + words.join(' ').toLowerCase() + ' ';
    const counts = [];
    let total = 0;
    for (const f of fillers) {
      const re = new RegExp(`(?:^|[^a-z])${f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:[^a-z]|$)`, 'g');
      const n = (text.match(re) || []).length;
      if (n > 0) { counts.push(`${f}: ${n}`); total += n; }
    }
    s.fillerCount = total;
    s.fillerDetail = counts.join(', ') || 'なし';
  },

  /* ---------- スコア ---------- */
  score() {
    const s = this.session;
    let score = 100;
    const overMin = Math.abs(s.totalMs - s.targetMs) / 60000;
    score -= Math.min(35, Math.round(overMin * 8));
    if (s.wpm > 0) {
      if (s.wpm < 110) score -= Math.min(15, Math.round((110 - s.wpm) / 3));
      if (s.wpm > 170) score -= Math.min(15, Math.round((s.wpm - 170) / 3));
    }
    const perMin = s.fillerCount / Math.max(1, s.totalMs / 60000);
    if (perMin > 3) score -= Math.min(20, Math.round((perMin - 3) * 4));
    return Math.max(10, score);
  }
};
