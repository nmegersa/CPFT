import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Budgets from './pages/Budgets'
import Credit from './pages/Credit'
import Dashboard from './pages/Dashboard'
import Subscriptions from './pages/Subscriptions'
import Transactions from './pages/Transactions'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="budgets" element={<Budgets />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="credit" element={<Credit />} />
          <Route path="subscriptions" element={<Subscriptions />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
