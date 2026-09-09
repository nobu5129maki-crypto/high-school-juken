import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { loadProfile } from '../lib/storage'

const NAV = [
  { to: '/', label: 'ホーム', mark: '家' },
  { to: '/shindan', label: '診断', mark: '問' },
  { to: '/kekka', label: '結果', mark: '合' },
  { to: '/heigan', label: '併願', mark: '策' },
  { to: '/soudan', label: '相談', mark: '話' },
]

export default function Layout() {
  useLocation()
  const profile = loadProfile()
  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink to="/" className="brand">
          <img src="/icon.png" alt="合う高校" />
          <div>
            <strong>合う高校</strong>
            <span>高校受験の学校選びコンパス</span>
          </div>
        </NavLink>
        {profile ? <span className="chip">{profile.prefecture}・{profile.grade}</span> : <span className="chip">未診断</span>}
      </header>
      <main className="page">
        <Outlet />
      </main>
      <nav className="bottom-nav">
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.to === '/'} className={({ isActive }) => (isActive ? 'active' : '')}>
            <strong>{n.mark}</strong>
            {n.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
