/* ConfQuest - 学習プロフィール(v1.32.0)
 *
 * 同じアプリを英樹さんとパートナーの2人が使うための仕組み。
 * 韓国語の学習内容(コース)だけを切り替える。
 *
 * ■ なぜ「進捗を分ける」のではなく「コースを分ける」のか
 *   カードのIDはコースごとに違う(ko1-1 / kp1-1)ので、
 *   同じ保存領域に置いても混ざらない。分けるのは「どのユニットを見せるか」だけでよく、
 *   こうすると💾バックアップ・復元がそのまま両方の進捗を運べる。
 *   (保存領域を分けると、片方だけ復元される・片方が消えるといった事故が起きやすい)
 *
 * ■ ユニット側の約束
 *   PHRASE_UNITS の各ユニットは course を持てる。
 *     course:'self'    英樹さん向け(学会)
 *     course:'partner' パートナー向け(懇親会・観光)
 *     course なし      両方に出す(広東語はこちら。パートナーが監修するため)
 */
'use strict';

const Profile = {
  KEY: 'lq_profile',

  DEFS: {
    self: {
      key: 'self', icon: '🎤', name: '英樹さん',
      short: '学会',
      desc: '学会で発表し、質疑応答やレセプションに出る人向け',
      koTitle: 'Korea Route',
      koGoal: 'ISSY39 本番',
      eventLabel: 'ISSY39'
    },
    partner: {
      key: 'partner', icon: '🌷', name: 'パートナー',
      short: '懇親会と観光',
      desc: '懇親会やディナーに出て、日中はソウルの街を歩く人向け',
      koTitle: 'Seoul Route',
      koGoal: 'ソウル滞在',
      eventLabel: '韓国へ出発'
    }
  },

  /** いま選ばれているプロフィール。未設定なら 'self' */
  current() {
    const v = localStorage.getItem(this.KEY);
    return this.DEFS[v] ? v : 'self';
  },
  /** まだ一度も選んでいないか(初回の案内を出すかどうかの判断に使う) */
  isUnset() { return !this.DEFS[localStorage.getItem(this.KEY)]; },
  isPartner() { return this.current() === 'partner'; },
  meta(key) { return this.DEFS[key || this.current()]; },

  set(key) {
    if (!this.DEFS[key]) return;
    localStorage.setItem(this.KEY, key);
    // 路線も合わせて切り替える(韓国語を見ているときだけ。広東語の路線は触らない)
    if (typeof Route !== 'undefined' && Route.routeKey !== 'hk') {
      Route.setRoute(key === 'partner' ? 'seoul' : 'korea');
    }
  },

  /** そのユニットを、いまのプロフィールで見せるか */
  showsUnit(unit) {
    if (!unit || !unit.course) return true;      // course指定なし = 両方に出す
    return unit.course === this.current();
  },

  /** 韓国語でいま使う路線のキー */
  koRouteKey() { return this.isPartner() ? 'seoul' : 'korea'; }
};
