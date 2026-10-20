import { Navigate, Route, Routes } from "react-router-dom";
import AdminDashboardPage from "@/Pages/admin/AdminDashboardPage";
import AdminOpportunitiesPage from "@/Pages/admin/AdminOpportunitiesPage";
import AdminProfilePage from "@/Pages/admin/AdminProfilePage";
import AdminCreateOpportunityPage from "@/Pages/admin/AdminCreateOpportunityPage";
import AdminUsersPage from "@/Pages/admin/AdminUsersPage";

export default function AdminRoutes() {
  return (
    <Routes>
      <Route index element={<AdminDashboardPage />} />
      <Route path="opportunities" element={<AdminOpportunitiesPage />} />
      <Route
        path="create-opportunity"
        element={<AdminCreateOpportunityPage />}
      />
      <Route
        path="opportunities/create"
        element={<AdminCreateOpportunityPage />}
      />
      <Route
        path="opportunities/edit/:id"
        element={<AdminCreateOpportunityPage />}
      />
      <Route
        path="edit-opportunity/:id"
        element={<AdminCreateOpportunityPage />}
      />
      <Route path="users" element={<AdminUsersPage />} />
      <Route path="profile" element={<AdminProfilePage />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
