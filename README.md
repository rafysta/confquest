# ConfQuest

**Level up your conference skills.**

学会を一つのクエストとして攻略する、研究者向けトレーニングPWA(Webアプリ)。発表練習・質疑応答・懇親会会話をゲーム感覚で鍛えます。AndroidのChromeで開き、ホーム画面に追加するとアプリとして使えます。

## 現在の機能(発表練習モジュール)

- **スライド練習**: PDFを読み込み、タップでスライド送りしながら発表練習
- **時間管理**: 全体タイマー、スライドごとの滞在時間、リアルタイム終了予測、ペース警告
- **録音**: 練習を録音し、終了後に聞き直し
- **音声認識**: 発話を文字起こしし、WPM(話速)とfiller語(um, uh, so...)を自動集計
- **AIフィードバック**: Claude APIで改善点3つ・言い回しの改善例を提示
- **AI質疑応答シミュレータ**: 質問者タイプ(学生〜厳しい査読者)を選び、発表内容に基づく英語Q&A練習
- **ゲーミフィケーション**: スコア・ポイント・連続日数(ストリーク)

## 使い方

### スマホ(Android)で使う

1. このフォルダをWebサーバーで公開する(下記「公開方法」参照)
2. AndroidのChromeでURLを開く
3. メニュー → **「ホーム画面に追加」** でアプリ化
4. 設定画面でAnthropic APIキーを入力(AI機能を使う場合)

### PCで試す

```bash
cd confquest
python3 -m http.server 8000
# ブラウザで http://localhost:8000 を開く
```

※ `index.html` をダブルクリックで直接開くと音声認識・Service Workerが動きません。必ずサーバー経由 (http/https) で開いてください。

## 公開方法(GitHub Pages 推奨・無料)

1. GitHubで新しいリポジトリ `confquest` を作成: https://github.com/new
2. このフォルダから push:

```bash
cd confquest
git remote add origin https://github.com/rafysta/confquest.git
git push -u origin main
```

3. GitHubのリポジトリページ → Settings → Pages → Source を「Deploy from a branch」、Branch を `main` / `(root)` にして保存
4. 数分後 `https://rafysta.github.io/confquest/` で公開されます(httpsなので音声認識・マイクも動作)

**注意**: リポジトリをPublicにするとコードは誰でも見られますが、APIキーはコードに含まれず各端末のブラウザ内にのみ保存されるので安全です。

## APIキーの取得(AI機能用)

1. https://console.anthropic.com でアカウント作成
2. API Keys → Create Key
3. アプリの設定画面に貼り付け(この端末のブラウザにのみ保存されます)

## 技術構成

- 純粋なHTML/CSS/JavaScript(ビルド不要)
- PDF表示: [PDF.js](https://mozilla.github.io/pdf.js/) (CDN)
- 音声認識: Web Speech API(Chrome内蔵、無料)
- 録音: MediaRecorder API
- AI: Anthropic Claude API(ブラウザから直接呼び出し)
- オフライン対応: Service Worker(AI機能以外はオフラインで動作)

## 今後の予定(クエスト構想)

- **Preparation Stage**: Timing Challenge、Q&A Battle、Elevator Pitch、自己紹介
- **Conference Stage**: 懇親会会話ミッション(AIが相手役)、話題選択ゲーム、車中2時間の会話準備
- **Language Quest**: 韓国語入門(2026年11月 ISSY39向け)
- **Wedding Quest**: 広東語入門(2027年1月向け特別ステージ)
- プレイヤーステータス育成(Presentation / Q&A / Networking / English / Confidence)
