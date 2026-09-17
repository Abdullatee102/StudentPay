import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import Dashboard from '@/pages/Dashboard'
import CreateDeal from '@/pages/CreateDeal'
import MyDeals from '@/pages/MyDeals'
import DealDetails from '@/pages/DealDetails'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="create" element={<CreateDeal />} />
          <Route path="my-deals" element={<MyDeals />} />
          <Route path="deals/:dealId" element={<DealDetails />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

