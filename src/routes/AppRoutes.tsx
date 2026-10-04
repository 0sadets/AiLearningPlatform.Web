import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import CoursesPage from "../pages/CoursesPage";
import MainLayout from "../layouts/MainLayout";
import CourseDetailsPage from "../pages/CourseDetailsPage";
import RegisterPage from "../pages/RegisterPage";
import ProtectedRoute from "./ProtectedRoute";
import ProfilePage from '../pages/ProfilePage'
import CourseSettingsPage from '../pages/CourseSettingsPage'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/courses/:id" element={<CourseDetailsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/courses/:id/settings" element={<CourseSettingsPage />}/>
        </Route>
      </Route>
      
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default AppRoutes;
