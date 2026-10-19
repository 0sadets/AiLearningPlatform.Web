import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import CoursesPage from "../pages/CoursesPage";
import MainLayout from "../layouts/MainLayout";
import CourseDetailsPage from "../pages/CourseDetailsPage";
import RegisterPage from "../pages/RegisterPage";
import ProtectedRoute from "./ProtectedRoute";
import ProfilePage from "../pages/ProfilePage";
import CourseSettingsPage from "../pages/CourseSettingsPage";
import MyCoursesPage from "../pages/MyCoursesPage";
import InvitationPage from "../pages/InvitationPage";
import CreateTestPage from "../pages/CreateTestPage";
import TestEditorPage from "../pages/TestEditorPage";

import TestDetailsPage from "../pages/TestDetailsPage";
import TestTakingPage from "../pages/TestTakingPage";
import TestResultPage from "../pages/TestResultPage";

import TeacherTestResultsPage from "../pages/TeacherTestResultsPage";
import TeacherAttemptDetailsPage from "../pages/TeacherAttemptDetailsPage";


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
          <Route
            path="/courses/:id/settings"
            element={<CourseSettingsPage />}
          />
          <Route path="/my-courses" element={<MyCoursesPage />} />
          <Route path="/invitations/:token" element={<InvitationPage />} />

          <Route
            path="/courses/:courseId/tests/create"
            element={<CreateTestPage />}
          />

          <Route path="/tests/:testId/edit" element={<TestEditorPage />} />
          <Route path="/tests/:testId" element={<TestDetailsPage />} />

          <Route
            path="/tests/:testId/attempts/:attemptId"
            element={<TestTakingPage />}
          />

          <Route
            path="/attempts/:attemptId/result"
            element={<TestResultPage />}
          />
<Route
  path="/tests/:testId/results"
  element={<TeacherTestResultsPage />}
/>

<Route
  path="/attempts/:attemptId/details"
  element={<TeacherAttemptDetailsPage />}
/>

        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default AppRoutes;
