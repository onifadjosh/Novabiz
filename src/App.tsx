import { Navigate, Route, Routes } from "react-router-dom"

import ActivityPage from "./Pages/Activity"
import Layout from "./Pages/Layout/Layout"
import Overview from "./Pages/Overview"
import Placeholder from "./Pages/Placeholder"
import SendMoneyPage from "./Pages/SendMoney/SendMoneyPage"

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Overview />} />
        <Route path="activity" element={<ActivityPage />} />
        <Route path="collections" element={<ActivityPage />} />
        <Route path="payouts" element={<SendMoneyPage />} />
        <Route path="terminals" element={<Placeholder />} />
        <Route path="settlements" element={<Placeholder />} />
        <Route path="settings" element={<Placeholder />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
