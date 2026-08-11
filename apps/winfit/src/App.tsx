import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useStore } from './lib/store'
import Intro from './pages/Intro'
import Onboarding from './pages/Onboarding'
import Preview from './pages/Preview'
import Home from './pages/Home'
import Player from './pages/Player'
import Summary from './pages/Summary'
import Progress from './pages/Progress'
import ExerciseDetail from './pages/ExerciseDetail'
import Library from './pages/Library'
import Profile from './pages/Profile'
import TabBar from './components/TabBar'
import MiniBar from './components/MiniBar'
import PwaToasts from './components/PwaToasts'

export default function App() {
  const profile = useStore((s) => s.profile)
  const plan = useStore((s) => s.plan)
  const loc = useLocation()

  const onboarded = profile !== null && plan !== null
  const inPlayer = loc.pathname === '/player'
  const inFlow = ['/', '/onboarding', '/preview'].includes(loc.pathname)

  return (
    <div className="app-shell">
      <PwaToasts />
      <Routes>
        <Route path="/" element={onboarded ? <Navigate to="/home" replace /> : <Intro />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/preview" element={<Preview />} />
        <Route path="/home" element={onboarded ? <Home /> : <Navigate to="/" replace />} />
        <Route path="/player" element={<Player />} />
        <Route path="/summary/:id" element={<Summary />} />
        <Route path="/progress" element={onboarded ? <Progress /> : <Navigate to="/" replace />} />
        <Route path="/exercise/:id" element={<ExerciseDetail />} />
        <Route path="/library" element={onboarded ? <Library /> : <Navigate to="/" replace />} />
        <Route path="/profile" element={onboarded ? <Profile /> : <Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {onboarded && !inPlayer && !inFlow && !loc.pathname.startsWith('/summary') && (
        <>
          <MiniBar />
          <TabBar />
        </>
      )}
    </div>
  )
}
