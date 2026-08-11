import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/home', label: 'Home', ic: '🏠' },
  { to: '/progress', label: 'Progresso', ic: '📈' },
  { to: '/library', label: 'Biblioteca', ic: '📚' },
  { to: '/profile', label: 'Perfil', ic: '👤' },
]

export default function TabBar() {
  return (
    <nav className="tabbar">
      {tabs.map((t) => (
        <NavLink key={t.to} to={t.to} className={({ isActive }) => (isActive ? 'active' : '')}>
          <span className="ic">{t.ic}</span>
          {t.label}
        </NavLink>
      ))}
    </nav>
  )
}
