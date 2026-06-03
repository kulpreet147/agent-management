import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import AgentAccountSetup from "./pages/AgentAccountSetup.jsx";
import MasterDashboard from "./pages/MasterDashboard.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import DashboardLayout from "./layouts/DashboardLayout.jsx";
import { auth } from "./utils/auth.js";

import AdminManagement from "./pages/master/AdminManagement.jsx";
import MasterSettings from "./pages/master/Settings.jsx";

import AgentRecordCreation from "./pages/admin/AgentRecordCreation.jsx";
import Agents from "./pages/admin/Agents.jsx";
import LeadManagement from "./pages/admin/LeadManagement.jsx";
import ClientManagement from "./pages/admin/ClientManagement.jsx";
import PolicyManagement from "./pages/admin/PolicyManagement.jsx";
import LeadDetail from "./pages/admin/LeadDetail.jsx";
import LeadNeedAnalysis from "./pages/admin/LeadNeedAnalysis.jsx";
import LeadReassign from "./pages/admin/LeadReassign.jsx";
import LeadRecordCreation from "./pages/admin/LeadRecordCreation.jsx";
import AgentDetails from "./pages/admin/AgentDetails.jsx";
import AgentMGAPackage from "./pages/admin/AgentMGAPackage.jsx";
import AgentRegistrationForm from "./pages/agent/AgentRegistrationForm.jsx";
import AgentDocumentSigning from "./pages/agent/AgentDocumentSigning.jsx";
import AgentWelcome from "./pages/agent/AgentWelcome.jsx";
import AgentOnboardingDashboard from "./pages/agent/AgentOnboardingDashboard.jsx";
import AgentDashboard from "./pages/agent/AgentDashboard.jsx";
import AgentLeadManagement from "./pages/agent/AgentLeadManagement.jsx";
import AgentLeadDetail from "./pages/agent/AgentLeadDetail.jsx";
import AgentActionItems from "./pages/agent/AgentActionItems.jsx";
import NeedAnalysisForm from "./components/NeedAnalysisForm.jsx";
import Analytics from "./pages/admin/Analytics.jsx";

function Protected({ children }) {
  return auth.isAuthenticated() ? children : <Navigate to="/login" replace />;
}

function getAgentRoute(status) {
  const step = Number(status || 2);
  if (step >= 5) return "/agent/dashboard";
  if (step >= 4) return "/agent/onboarding-progress";
  if (step >= 3) return "/agent/sign-documents";
  return "/agent/registration";
}

function AgentProtected({ children }) {
  const session = auth.get();
  if (!session) return <Navigate to="/login" replace />;
  if (session.role !== "agent") return <Navigate to="/" replace />;
  return children;
}

function RoleRoute() {
  const session = auth.get();
  if (!session) return <Navigate to="/login" replace />;
  if (session.role === "agent")
    return <Navigate to={getAgentRoute(session.onboardingStatus)} replace />;
  return (
    <Navigate
      to={session.role === "master_admin" ? "/master" : "/admin"}
      replace
    />
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/agent/account-setup" element={<AgentAccountSetup />} />
      <Route
        path="/agent/account-setup/:inviteToken"
        element={<AgentAccountSetup />}
      />
      <Route
        path="/agent/registration"
        element={
          <AgentProtected>
            <AgentRegistrationForm />
          </AgentProtected>
        }
      />
      <Route
        path="/agent/sign-documents"
        element={
          <AgentProtected>
            <AgentDocumentSigning />
          </AgentProtected>
        }
      />
      <Route
        path="/agent/welcome"
        element={
          <AgentProtected>
            <AgentWelcome />
          </AgentProtected>
        }
      />
      <Route
        path="/agent/onboarding-progress"
        element={
          <AgentProtected>
            <AgentOnboardingDashboard />
          </AgentProtected>
        }
      />
      <Route
        path="/agent/dashboard"
        element={
          <AgentProtected>
            <AgentDashboard />
          </AgentProtected>
        }
      />
      <Route
        path="/agent/leads"
        element={
          <AgentProtected>
            <AgentLeadManagement />
          </AgentProtected>
        }
      />
      <Route
        path="/agent/leads/:leadId"
        element={
          <AgentProtected>
            <AgentLeadDetail />
          </AgentProtected>
        }
      />
      <Route
        path="/agent/leads/:leadId/need-analysis"
        element={
          <AgentProtected>
            <NeedAnalysisForm role="agent" />
          </AgentProtected>
        }
      />
      <Route
        path="/agent/action-items"
        element={
          <AgentProtected>
            <AgentActionItems />
          </AgentProtected>
        }
      />
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
        path="/admin/agents/:agentId/mga-package"
        element={
          <Protected>
            <DashboardLayout variant="admin">
              <AgentMGAPackage />
            </DashboardLayout>
          </Protected>
        }
      />

      <Route
        path="/admin/leads"
        element={
          <Protected>
            <DashboardLayout variant="admin">
              <LeadManagement />
            </DashboardLayout>
          </Protected>
        }
      />

      <Route
        path="/admin/clients"
        element={
          <Protected>
            <DashboardLayout variant="admin">
              <ClientManagement />
            </DashboardLayout>
          </Protected>
        }
      />

      <Route
        path="/admin/policies"
        element={
          <Protected>
            <DashboardLayout variant="admin">
              <PolicyManagement />
            </DashboardLayout>
          </Protected>
        }
      />

      <Route
        path="/admin/leads/new"
        element={
          <Protected>
            <DashboardLayout variant="admin">
              <LeadRecordCreation />
            </DashboardLayout>
          </Protected>
        }
      />

      <Route
        path="/admin/leads/:leadId/need-analysis"
        element={
          <Protected>
            <DashboardLayout variant="admin">
              <NeedAnalysisForm role="admin" />
            </DashboardLayout>
          </Protected>
        }
      />

      <Route
        path="/admin/leads/:leadId/reassign"
        element={
          <Protected>
            <DashboardLayout variant="admin">
              <LeadReassign />
            </DashboardLayout>
          </Protected>
        }
      />

      <Route
        path="/admin/leads/:leadId"
        element={
          <Protected>
            <DashboardLayout variant="admin">
              <LeadDetail />
            </DashboardLayout>
          </Protected>
        }
      />
      <Route
        path="/admin/analytics"
        element={
          <Protected>
            <DashboardLayout variant="admin">
              <Analytics />
            </DashboardLayout>
          </Protected>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
