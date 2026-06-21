import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index.tsx";
import AboutPage from "./pages/AboutPage.tsx";
import CoursesPage from "./pages/CoursesPage.tsx";
import BookCoursePage from "./pages/BookCoursePage.tsx";
import GroupClassOverviewPage from "./pages/GroupClassOverviewPage.tsx";
import GroupClassDetailsPage from "./pages/GroupClassDetailsPage.tsx";
import FreePdfPage from "./pages/FreePdfPage.tsx";
import ConfirmSignupPage from "./pages/ConfirmSignupPage.tsx";
import CheckoutReturn from "./pages/CheckoutReturn.tsx";
import ContactPage from "./pages/ContactPage.tsx";
import UnsubscribePage from "./pages/UnsubscribePage.tsx";
import PrivacyPage from "./pages/PrivacyPage.tsx";
import TermsPage from "./pages/TermsPage.tsx";
import Auth from "./pages/Auth.tsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.tsx";
import UpdatePasswordPage from "./pages/UpdatePasswordPage.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Admin from "./pages/Admin.tsx";
import AdminDashboard from "./pages/AdminDashboard.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/courses" element={<CoursesPage />} />
            <Route path="/courses/group-class/overview" element={<GroupClassOverviewPage />} />
            <Route path="/courses/group-class/details" element={<GroupClassDetailsPage />} />
            <Route path="/courses/:courseId" element={<BookCoursePage />} />
            <Route path="/free-pdf" element={<FreePdfPage />} />
            <Route path="/confirm-signup" element={<ConfirmSignupPage />} />
            <Route path="/checkout/return" element={<CheckoutReturn />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/unsubscribe" element={<UnsubscribePage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
            <Route path="/auth/update-password" element={<UpdatePasswordPage />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>} />
            <Route path="/admin/dashboard" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
