import { Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ChatPage from "./pages/ChatPage";
import FormPage from "./pages/FormPage";
import WishlistPage from "./pages/WishlistPage";
import TreatmentsPage from "./pages/TreatmentsPage";
import TreatmentDetailPage from "./pages/TreatmentDetailPage";
import HospitalsPage from "./pages/HospitalsPage";
import HospitalDetailPage from "./pages/HospitalDetailPage";
import DoctorsPage from "./pages/DoctorsPage";
import DoctorDetailPage from "./pages/DoctorDetailPage";
import SpecialtiesPage from "./pages/SpecialtiesPage";
import SpecialtyDetailPage from "./pages/SpecialtyDetailPage";
import WellnessPage from "./pages/WellnessPage";
import WellnessDetailPage from "./pages/WellnessDetailPage";
import ArticleListPage from "./components/content/ArticleListPage";
import ArticleDetailPage from "./components/content/ArticleDetailPage";
import ContactPage from "./pages/ContactPage";
import BecomePartnerPage from "./pages/BecomePartnerPage";
import GetOpinionPage from "./pages/GetOpinionPage";
import ProtectedRoute from "./routes/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      {/* Public landing + auth */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Public treatments directory */}
      <Route path="/treatments" element={<TreatmentsPage />} />
      <Route path="/treatments/:slug" element={<TreatmentDetailPage />} />

      {/* Public hospitals directory */}
      <Route path="/hospitals" element={<HospitalsPage />} />
      <Route path="/hospitals/:slug" element={<HospitalDetailPage />} />

      {/* Public doctors directory */}
      <Route path="/doctors" element={<DoctorsPage />} />
      <Route path="/doctors/:slug" element={<DoctorDetailPage />} />

      {/* Public specialties directory */}
      <Route path="/specialties" element={<SpecialtiesPage />} />
      <Route path="/specialties/:slug" element={<SpecialtyDetailPage />} />

      {/* Health blog */}
      <Route path="/blog" element={<ArticleListPage kind="blog" />} />
      <Route path="/blog/:slug" element={<ArticleDetailPage kind="blog" />} />

      {/* Patient stories */}
      <Route path="/stories" element={<ArticleListPage kind="story" />} />
      <Route path="/stories/:slug" element={<ArticleDetailPage kind="story" />} />

      {/* Wellness packages */}
      <Route path="/wellness" element={<WellnessPage />} />
      <Route path="/wellness/:slug" element={<WellnessDetailPage />} />

      {/* Contact & lead pages (UI only) */}
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/partner" element={<BecomePartnerPage />} />
      <Route path="/opinion" element={<GetOpinionPage />} />

      {/* Behind login: our interactive chat + the intake forms */}
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/form"
        element={
          <ProtectedRoute>
            <FormPage />
          </ProtectedRoute>
        }
      />
      {/* alias so both /form and /forms work */}
      <Route path="/forms" element={<Navigate to="/form" replace />} />

      <Route
        path="/wishlist"
        element={
          <ProtectedRoute>
            <WishlistPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
