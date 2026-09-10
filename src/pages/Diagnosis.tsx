import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AREA_SCOPES,
  CLUB_SUGGESTIONS,
  COMMUTE_OPTIONS,
  DORM_PREFS,
  EMPTY_PROFILE,
  PREFECTURES,
  PRIORITIES,
  type Priority,
  type Profile,
} from '../types'

const AREA_HELP: Record<Profile['areaScope'], string> = {
  同じ都道府県: '受験する都道府県の学校だけを出します。',
  隣接県も含む: '首都圏・関西などは隣の県の学校も候補に出します。',
  全国: '全国の学校を候補にします。寮のある学校も一緒に探せます。',
}

const DORM_HELP: Record<Profile['dorm'], string> = {
  こだわらない: '寮の有無は気にしません。通学できる学校を中心に出します。',
  寮ありを優先: '寮のある学校を高めに評価し、通学時間の制約を外して探します。',
  寮ありのみ: '寮のある学校だけを出します（全国対象）。',
}
import { loadOrEmpty, saveProfile } from '../lib/storage'

const STEPS = ['誰が', '地域', '今の力', '通い方', '大切なもの', '将来'] as const

export default function Diagnosis() {
  const nav = useNavigate()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<Profile>(loadOrEmpty)
  const pct = ((step + 1) / STEPS.length) * 100

  const set = <K extends keyof Profile>(key: K, value: Profile[K]) => setForm((f) => ({ ...f, [key]: value }))
  const togglePri = (list: Priority[], item: Priority) =>
    list.includes(item) ? list.filter((x) => x !== item) : [...list, item].slice(0, 3)

  const canNext = useMemo(() => {
    if (step === 4) return form.priorities.length > 0
    return true
  }, [step, form.priorities.length])

  return (
    <div>
      <p className="tiny">{STEPS[step]}　{step + 1} / {STEPS.length}</p>
      <div className="progress"><span style={{ width: `${pct}%` }} /></div>

      {step === 0 && (
        <section>
          <h1>誰が使いますか</h1>
          <p className="lead">答えは途中で保存されます。親子で違う希望がある前提で作っています。</p>
          <div className="choice" style={{ marginTop: 16 }}>
            {([
              ['together', '親子で一緒に'],
              ['student', '中学生本人'],
              ['parent', '保護者'],
            ] as const).map(([v, l]) => (
              <button key={v} className={form.role === v ? 'on' : ''} onClick={() => set('role', v)}>{l}</button>
            ))}
          </div>
          <div className="choice-grid" style={{ marginTop: 12, gridTemplateColumns: '1fr 1fr 1fr' }}>
            {(['中1', '中2', '中3'] as const).map((g) => (
              <button key={g} className={form.grade === g ? 'on' : ''} onClick={() => set('grade', g)}>{g}</button>
            ))}
          </div>
        </section>
      )}

      {step === 1 && (
        <section>
          <h1>受験する都道府県</h1>
          <p className="lead">住んでいる（受験する）都道府県と、候補に含める範囲を選んでください。</p>
          <label className="field">
            <span className="tiny">都道府県</span>
            <select value={form.prefecture} onChange={(e) => set('prefecture', e.target.value)}>
              {PREFECTURES.map((p) => <option key={p}>{p}</option>)}
            </select>
          </label>
          <span className="tiny">候補に含める範囲</span>
          <div className="choice-grid" style={{ marginTop: 6, marginBottom: 6, gridTemplateColumns: '1fr 1fr 1fr' }}>
            {AREA_SCOPES.map((a) => (
              <button key={a} className={form.areaScope === a ? 'on' : ''} onClick={() => set('areaScope', a)}>{a}</button>
            ))}
          </div>
          <p className="tiny" style={{ marginTop: 0, marginBottom: 14 }}>{AREA_HELP[form.areaScope]}</p>
          <div className="choice">
            {(['公立', '私立', 'どちらも'] as const).map((k) => (
              <button key={k} className={form.kind === k ? 'on' : ''} onClick={() => set('kind', k)}>{k}</button>
            ))}
          </div>
          <div className="choice" style={{ marginTop: 8 }}>
            {(['こだわらない', '共学', '男子', '女子'] as const).map((g) => (
              <button key={g} className={form.gender === g ? 'on' : ''} onClick={() => set('gender', g)}>{g}</button>
            ))}
          </div>
        </section>
      )}

      {step === 2 && (
        <section>
          <h1>今の学力の目安</h1>
          <p className="lead">正確でなくて構いません。模試を受けていなければ、学校の成績からの感覚で。</p>
          <label className="field">
            <span>模試偏差値　{form.hensachi}</span>
            <input className="range" type="range" min={35} max={76} value={form.hensachi} onChange={(e) => set('hensachi', Number(e.target.value))} />
          </label>
          <label className="field">
            <span>9教科内申の合計目安　{form.naishin}（5〜45）</span>
            <input className="range" type="range" min={15} max={45} value={form.naishin} onChange={(e) => set('naishin', Number(e.target.value))} />
          </label>
          <p className="tiny">都立は換算内申、神奈川は中2・中3の積み上げなど、地域ルールは結果画面でも案内します。</p>
        </section>
      )}

      {step === 3 && (
        <section>
          <h1>通い方</h1>
          <p className="lead">部活があるなら、帰宅後に机へ向かえる時間まで含めて考えてください。</p>
          <label className="field">
            <span className="tiny">自宅の最寄り駅（任意）</span>
            <input
              value={form.homeStation}
              onChange={(e) => set('homeStation', e.target.value)}
              placeholder="例）荻窪"
              autoComplete="off"
            />
            <span className="tiny">入力すると、結果の各校に「最寄り駅からの乗換検索」リンクが付き、実際の通学時間を確かめられます。</span>
          </label>
          <span className="tiny">最寄り駅からの通学時間（片道）</span>
          <div className="choice-grid" style={{ marginTop: 6, gridTemplateColumns: '1fr 1fr 1fr' }}>
            {COMMUTE_OPTIONS.map((m) => (
              <button key={m} className={form.commuteMax === m ? 'on' : ''} onClick={() => set('commuteMax', m)}>
                {m === 0 ? '制限なし' : `${m}分まで`}
              </button>
            ))}
          </div>
          <span className="tiny" style={{ display: 'block', marginTop: 14 }}>寮の希望</span>
          <div className="choice-grid" style={{ marginTop: 6, gridTemplateColumns: '1fr 1fr 1fr' }}>
            {DORM_PREFS.map((d) => (
              <button key={d} className={form.dorm === d ? 'on' : ''} onClick={() => set('dorm', d)}>{d}</button>
            ))}
          </div>
          <p className="tiny" style={{ marginTop: 4 }}>{DORM_HELP[form.dorm]}</p>
          <div className="choice" style={{ marginTop: 12 }}>
            {(['毎日登校', '柔軟さ重視', 'こだわらない'] as const).map((l) => (
              <button key={l} className={form.lifestyle === l ? 'on' : ''} onClick={() => set('lifestyle', l)}>{l}</button>
            ))}
          </div>
          <label className="field" style={{ marginTop: 14 }}>
            <span className="tiny">続けたい部活（任意）</span>
            <input
              value={form.club}
              onChange={(e) => set('club', e.target.value)}
              placeholder="例）野球"
              list="club-suggestions"
              autoComplete="off"
            />
            <datalist id="club-suggestions">
              {CLUB_SUGGESTIONS.map((c) => <option key={c} value={c} />)}
            </datalist>
            <span className="tiny">入力した部活が公式情報で確認できた学校だけを結果に出します（「未確認の学校も見る」に切り替え可）。</span>
          </label>
        </section>
      )}

      {step === 4 && (
        <section>
          <h1>大切にしたいこと（最大3）</h1>
          <p className="lead">本人の希望です。保護者の希望は次で別に取ります。</p>
          <div className="choice-grid">
            {PRIORITIES.map((p) => (
              <button key={p} className={form.priorities.includes(p) ? 'on' : ''} onClick={() => set('priorities', togglePri(form.priorities, p))}>{p}</button>
            ))}
          </div>
          <h3 style={{ marginTop: 22 }}>保護者が特に見たいこと</h3>
          <div className="choice-grid">
            {PRIORITIES.map((p) => (
              <button key={p} className={form.parentPriorities.includes(p) ? 'on' : ''} onClick={() => set('parentPriorities', togglePri(form.parentPriorities, p))}>{p}</button>
            ))}
          </div>
        </section>
      )}

      {step === 5 && (
        <section>
          <h1>高校の先は？</h1>
          <p className="lead">決まっていなくて正解です。決まっていない人ほど、選べる幅のある学校がフィットしやすいです。</p>
          <div className="choice">
            {(['まだ決めていない', '大学', '専門・就職'] as const).map((f) => (
              <button key={f} className={form.future === f ? 'on' : ''} onClick={() => set('future', f)}>{f}</button>
            ))}
          </div>
        </section>
      )}

      <div className="row">
        {step > 0 ? <button className="btn btn-ghost" onClick={() => setStep((s) => s - 1)}>戻る</button> : null}
        {step < STEPS.length - 1 ? (
          <button className="btn btn-primary" disabled={!canNext} onClick={() => setStep((s) => s + 1)}>次へ</button>
        ) : (
          <button
            className="btn btn-warn"
            onClick={() => {
              saveProfile(form)
              nav('/kekka')
            }}
          >
            合う高校を見る
          </button>
        )}
        <button className="btn btn-ghost" onClick={() => setForm(EMPTY_PROFILE)}>リセット</button>
      </div>
    </div>
  )
}
