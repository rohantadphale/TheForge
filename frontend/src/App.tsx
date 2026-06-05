import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Navigate, Route, Routes } from 'react-router-dom'
import { getDashboard } from './api/dashboard'
import { CompletionToastViewport } from './components/CompletionToast'
import { Layout } from './components/Layout'
import { RankUpBanner } from './components/RankUpBanner'
import { AttributesPage } from './pages/AttributesPage'
import { CampaignPage } from './pages/CampaignPage'
import { DashboardPage } from './pages/DashboardPage'
import { QuestFormPage } from './pages/QuestFormPage'
import { QuestListPage } from './pages/QuestListPage'
import { SettingsPage } from './pages/SettingsPage'
import { WeeklyPage } from './pages/WeeklyPage'
import { useAppStore } from './stores/useAppStore'

function App() {
  const setSettings = useAppStore((store) => store.setSettings)
  const setProfile = useAppStore((store) => store.setProfile)
  const dashboardQuery = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
    staleTime: 30_000,
  })

  useEffect(() => {
    if (dashboardQuery.data) {
      setSettings(dashboardQuery.data.settings)
      setProfile(dashboardQuery.data.profile)
    }
  }, [dashboardQuery.data, setProfile, setSettings])

  return (
    <>
      <RankUpBanner />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="quests" element={<QuestListPage />} />
          <Route path="quests/new" element={<QuestFormPage />} />
          <Route path="quests/:id/edit" element={<QuestFormPage />} />
          <Route path="campaign" element={<CampaignPage />} />
          <Route path="attributes" element={<AttributesPage />} />
          <Route path="weekly" element={<WeeklyPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      <CompletionToastViewport />
    </>
  )
}

export default App
