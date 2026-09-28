import { lazy } from "react";
import { Route, Routes } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import ProtectedRoute, { GuestOnlyRoute } from "@/components/layout/ProtectedRoute";
import Home from "@/pages/Home";

const About = lazy(() => import("@/pages/About"));
const Features = lazy(() => import("@/pages/Features"));
const Contact = lazy(() => import("@/pages/Contact"));
const PostpartumDepression = lazy(() => import("@/pages/PostpartumDepression"));
const Login = lazy(() => import("@/pages/Login"));
const Signup = lazy(() => import("@/pages/Signup"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Test = lazy(() => import("@/pages/Test"));
const Program = lazy(() => import("@/pages/Program"));
const Notifications = lazy(() => import("@/pages/Notifications"));
const Therapy = lazy(() => import("@/pages/Therapy"));
const Consultation = lazy(() => import("@/pages/consultation/ConsultationDashboard"));
const ConsultationHistory = lazy(() => import("@/pages/consultation/ConsultationHistory"));
const MedicalAgent = lazy(() => import("@/pages/consultation/MedicalAgent"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const Legal = lazy(() => import("@/pages/Legal"));
const Account = lazy(() => import("@/pages/Account"));

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="features" element={<Features />} />
        <Route path="contact" element={<Contact />} />
        <Route path="postpartum-depression" element={<PostpartumDepression />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password" element={<ResetPassword />} />
        <Route path="privacy" element={<Legal doc="privacy" />} />
        <Route path="terms" element={<Legal doc="terms" />} />

        <Route element={<GuestOnlyRoute />}>
          <Route path="login" element={<Login />} />
          <Route path="signup" element={<Signup />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="test" element={<Test />} />
          <Route path="program" element={<Program />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="account" element={<Account />} />
          <Route path="therapy/:sessionId" element={<Therapy />} />
          <Route path="consultation" element={<Consultation />} />
          <Route path="consultation/history" element={<ConsultationHistory />} />
          <Route path="consultation/medical-agent/:sessionId" element={<MedicalAgent />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
