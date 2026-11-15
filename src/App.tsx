import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Diagnosis from './pages/Diagnosis'
import Results from './pages/Results'
import SchoolDetail from './pages/SchoolDetail'
import Compare from './pages/Compare'
import Strategy from './pages/Strategy'
import CalendarPage from './pages/Calendar'
import Talk from './pages/Talk'

function routerBasename(): string | undefined {
  const base = document.querySelector('base')
  if (!base) return undefined
  try {
    const path = new URL(base.href).pathname.replace(/\/$/, '')
    return path || undefined
  } catch {
    return undefined
  }
}

export default function App() {
  return (
    <BrowserRouter basename={routerBasename()}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/shindan" element={<Diagnosis />} />
          <Route path="/kekka" element={<Results />} />
          <Route path="/school/:id" element={<SchoolDetail />} />
          <Route path="/hikaku" element={<Compare />} />
          <Route path="/heigan" element={<Strategy />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/soudan" element={<Talk />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
