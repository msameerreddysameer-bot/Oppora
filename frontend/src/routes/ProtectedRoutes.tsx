import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import StudentDashboardPage from "@/Pages/StudentDashboardPage";
import SavedOpportunitiesPage from "@/Pages/SavedOpportunitiesPage";
import MyApplicationsPage from "@/Pages/MyApplicationsPage";
import StudentProfilePage from "@/Pages/StudentProfilePage";
import OpportunityDetailsPage from "@/Pages/OpportunityDetailsPage";

export default function ProtectedRoutes() {
  return (
    <Routes>
      <Route element={<ProtectedRoute />}>
        <Route path="/discover" element={<StudentDashboardPage />} />
        <Route path="/saved" element={<SavedOpportunitiesPage />} />
        <Route path="/applications" element={<MyApplicationsPage />} />
        <Route path="/profile" element={<StudentProfilePage />} />
        <Route path="/opportunities/:opportunityId" element={<OpportunityDetailsPage />} />
      </Route>
    </Routes>
  );
}