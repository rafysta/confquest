# ConfQuest

**Level up your conference skills.**

学会を一つのクエストとして攻略する、研究者向けトレーニングPWA(Webアプリ)。発表練習・質疑応答・懇親会会話をゲーム感覚で鍛えます。AndroidのChromeで開き、ホーム画面に追加するとアプリとして使えます。

## 現在の機能(発表練習モジュール)

- **スライド練習**: PDFを読み込み、タップでスライド送りしながら発表練習
- **時間管理**: 全体タイマー、スライドごとの滞在時間、リアルタイム終了予測、ペース警告
- **録音**: 練習を録音し、終了後に聞き直し
- **文字起こし**: 録音をWhisper APIで文字起こしし、WPM(話速)とfiller語(um, uh, so...)をスライドごとに自動集計
- **AIフィードバック**: 改善点3つ・言い回しの改善例をMarkdown整形で表示(Claude / OpenAI GPT を設定画面で切替可能。同じ練習を両方に評価させて比較できます)
- **AI質疑応答シミュレータ**: 質問者タイプ(学生〜厳しい査読者)を選び、発表内容に基づく英語Q&A練習
- **ゲーミフィケーション**: スコア・ポイント・連続日数(ストリーク)

## 会話トレーニングモジュール

懇親会・レセプションでの立ち回りを、制限時間つきの選択肢バトルで鍛えます。

- **4場面・全16ターン**: 初対面に話しかける / 沈黙の立て直し / 自分の研究をいつ出すか / 研究以外の雑談
- **好感度ゲージ**: 選択によって相手の好感度が変動。最終的にS〜Dでランク判定
- **制限時間**: 10〜14秒。良い選択を素早くできると即答ボーナス。会話は間の取り方も実力のうち
- **全選択肢に解説**: なぜ良いか/悪いかが日本語で表示され、外した場面は終了後に見直せます
- **ステータス育成**: Networking / English / Confidence / Topics がXPで成長

シナリオは `js/scenarios.js` で管理しています。追加や修正はこのファイルを編集してください。

## 講演の録音・要約モジュール

学会で聴いた発表を記録し、PCで整理できる形にします。

- **録音**: 講演タイトル・発表者を入れて録音開始(個別講演単位、30分程度まで)
- **「ここは重要」ボタン**: 押した時刻の前後が、要約で重点的に扱われます
- **AI要約**: 概要 / 背景と問い / 手法 / 主要な結果 / 結論 / 質問候補 / キーワード の構成で自動生成
- **共有**: Androidの共有シートからNextcloud・Gmailなどに送信(Nextcloudを選べばPCの同期フォルダに自動で届きます)。ファイル保存とクリップボードコピーにも対応
- **聴講した講演**: 保存した要約を後から見返して再送信できます

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

## APIキーの取得

いずれも設定画面に貼り付けます(この端末のブラウザにのみ保存されます)。

- **OpenAI APIキー**(必須。文字起こし用。約0.45〜0.9円/分): https://platform.openai.com → API Keys → Create new secret key
- **Anthropic APIキー**(任意。AIフィードバック・質疑応答をClaudeで行う場合): https://console.anthropic.com → API Keys → Create Key

AIフィードバックのプロバイダは設定画面で切り替えられます。両方のキーを入れておけば、同じ練習をClaudeとGPTの両方に評価させて質を比べられます(フィードバック欄の先頭に使用モデルが表示されます)。

## 技術構成

- 純粋なHTML/CSS/JavaScript(ビルド不要)
- PDF表示: [PDF.js](https://mozilla.github.io/pdf.js/) (CDN)
- 録音: MediaRecorder API
- 文字起こし: OpenAI Whisper API(録音終了後にまとめて処理。リアルタイム認識はAndroidで録音と競合し通知音も鳴るため不採用)
- AI: Anthropic Claude API(ブラウザから直接呼び出し)
- オフライン対応: Service Worker(AI機能以外はオフラインで動作)

## バージョン管理

アプリ内の「アプリ情報」画面で現在のバージョンと更新履歴を確認できます。更新が反映されない場合は同画面の「更新を確認」を押してください。バージョン番号と更新履歴は `js/version.js` で管理しています。

## 今後の予定(クエスト構想)

- **会話トレーニングの拡張**: 車中2時間の雑談、自己紹介・Elevator pitch、AIが相手役の自由会話
- **Language Quest**: 韓国語入門(2026年11月 ISSY39向け)
- **Wedding Quest**: 広東語入門(2027年1月向け特別ステージ)
- キャラクター育成・戦略シミュレーション要素の強化
