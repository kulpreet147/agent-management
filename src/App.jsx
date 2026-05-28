import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login.jsx'
import MasterDashboard from './pages/MasterDashboard.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import DashboardLayout from './layouts/DashboardLayout.jsx'
import { auth } from './utils/auth.js'

import AdminManagement from './pages/master/AdminManagement.jsx'
import MasterSettings from './pages/master/Settings.jsx'

import AgentRecordCreation from './pages/admin/AgentRecordCreation.jsx'
import Agents from './pages/admin/Agents.jsx'
import AgentDetails from './pages/admin/AgentDetails.jsx'
import Agreements from './pages/admin/Agreements.jsx'
import MGACContracts from './pages/admin/MGACContracts.jsx'
import Training from './pages/admin/Training.jsx'
import Compliance from './pages/admin/Compliance.jsx'
import Notifications from './pages/admin/Notifications.jsx'
import Reports from './pages/admin/Reports.jsx'


function Protected({ children }) {
  return auth.isAuthenticated() ? children : <Navigate to="/login" replace />
}

function RoleRoute() {
  const session = auth.get()
  if (!session) return <Navigate to="/login" replace />
  return (
    <Navigate
      to={session.role === 'master_admin' ? '/master' : '/admin'}
      replace
    />
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<RoleRoute />} />

      <Route
        path="/master"
        element={
          <Protected>
            <DashboardLayout variant="master">
              <MasterDashboard />
            </DashboardLayout>
          </Protected>
        }
      />

      <Route
        path="/master/admin-management"
        element={
          <Protected>
            <DashboardLayout variant="master">
              <AdminManagement />
            </DashboardLayout>
          </Protected>
        }
      />

      <Route
        path="/master/settings"
        element={
          <Protected>
            <DashboardLayout variant="master">
              <MasterSettings />
            </DashboardLayout>
          </Protected>
        }
      />

      <Route
        path="/admin"
        element={
          <Protected>
            <DashboardLayout variant="admin">
              <AdminDashboard />
            </DashboardLayout>
          </Protected>
        }
      />

      <Route
        path="/admin/agent-record-creation"
        element={
          <Protected>
            <DashboardLayout variant="admin">
              <AgentRecordCreation />
            </DashboardLayout>
          </Protected>
        }
      />

      <Route
        path="/admin/agents"
        element={
          <Protected>
            <DashboardLayout variant="admin">
              <Agents />
            </DashboardLayout>
          </Protected>
        }
      />

      <Route
        path="/admin/agents/:agentId"
        element={
          <Protected>
            <DashboardLayout variant="admin">
              <AgentDetails />
            </DashboardLayout>
          </Protected>
        }
      />

      <Route
        path="/admin/agreements"
        element={
          <Protected>
            <DashboardLayout variant="admin">
              <Agreements />
            </DashboardLayout>
          </Protected>
        }
      />

      <Route
        path="/admin/mga-contracts"
        element={
          <Protected>
            <DashboardLayout variant="admin">
              <MGACContracts />
            </DashboardLayout>
          </Protected>
        }
      />

      <Route
        path="/admin/training"
        element={
          <Protected>
            <DashboardLayout variant="admin">
              <Training />
            </DashboardLayout>
          </Protected>
        }
      />

      <Route
        path="/admin/compliance"
        element={
          <Protected>
            <DashboardLayout variant="admin">
              <Compliance />
            </DashboardLayout>
          </Protected>
        }
      />

      <Route
        path="/admin/notifications"
        element={
          <Protected>
            <DashboardLayout variant="admin">
              <Notifications />
            </DashboardLayout>
          </Protected>
        }
      />

      <Route
        path="/admin/reports"
        element={
          <Protected>
            <DashboardLayout variant="admin">
              <Reports />
            </DashboardLayout>
          </Protected>
        }
      />


      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
