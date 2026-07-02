import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import RequireAuth from './components/RequireAuth'
import Budgets from './pages/Budgets'
import Credit from './pages/Credit'
import Dashboard from './pages/Dashboard'
import ForgotPassword from './pages/auth/ForgotPassword'
import Landing from './pages/Landing'
import Profile from './pages/Profile'
import Login from './pages/auth/Login'
import ResetPassword from './pages/auth/ResetPassword'
import Signup from './pages/auth/Signup'
import Subscriptions from './pages/Subscriptions'
import Transactions from './pages/Transactions'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route
          path="/app"
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="budgets" element={<Budgets />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="credit" element={<Credit />} />
          <Route path="subscriptions" element={<Subscriptions />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
