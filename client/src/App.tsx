import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminRoute } from "./components/AdminRoute";
import { PermissionRoute } from "./components/PermissionRoute";
import { CustomerServiceRoute } from "./components/CustomerServiceRoute";
import Home from "./pages/Home";
import CoursesHub from "./pages/CoursesHub";
import CourseDetails from "./pages/CourseDetails";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";

import Archive from "./pages/Archive";
import Services from "./pages/Services";
import OperationalExpenses from "./pages/OperationalExpenses";
import StrategicTargets from "./pages/StrategicTargets";
import Partnerships from "./pages/Partnerships";
import InnovativeIdeas from "./pages/InnovativeIdeas";

import Login from "./pages/Login";
import Landing from "./pages/public/Landing";
import PublicCourses from "./pages/public/Courses";
import PublicCourseDetail from "./pages/public/CourseDetail";
import PublicServices from "./pages/public/Services";
import PublicContact from "./pages/public/Contact";
import PermissionsManagement from "./pages/PermissionsManagement";
import PasswordManagement from "./pages/PasswordManagement";
import BulkDeleteUsers from "./pages/BulkDeleteUsers";
import BulkDeleteEmployees from "./pages/BulkDeleteEmployees";
import UserManagement from "./pages/UserManagement";

import Projects from "./pages/Projects";
import ProjectDetails from "./pages/ProjectDetails";
import Employees from "./pages/Employees";
import EmployeeManagement from "./pages/EmployeeManagement";
import EmployeeTargets from "./pages/EmployeeTargets";
import Attendance from "./pages/Attendance";
import DailyReports from "./pages/DailyReports";
import Salaries from "./pages/Salaries";
import EmployeeProfile from "./pages/EmployeeProfile";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import RecordedCourses from "./pages/RecordedCourses";
import RecordedCourseView from "./pages/RecordedCourseView";
import InstructorDashboard from "./pages/InstructorDashboard";
import PublicRecordedCourses from "./pages/public/RecordedCourses";
import PublicRecordedCourseDetail from "./pages/public/RecordedCourseDetail";
import PaymentCallback from "./pages/PaymentCallback";
import MyCertificates from "./pages/MyCertificates";
import MyPayments from "./pages/MyPayments";
import MyTargets from "./pages/MyTargets";
import DailyStatsReview from "./pages/DailyStatsReview";
import ApprovedStatsReport from "./pages/ApprovedStatsReport";
import TargetAlerts from "./pages/TargetAlerts";

function Router() {
  return (
    <Switch>
      {/* الصفحات العامة - الموقع الإلكتروني */}
      <Route path="/public" component={Landing} />
      <Route path="/public/courses" component={PublicCourses} />
      <Route path="/public/courses/:id" component={PublicCourseDetail} />
      <Route path="/public/services" component={PublicServices} />
      <Route path="/public/recorded-courses" component={PublicRecordedCourses} />
      <Route path="/public/recorded-courses/:slug" component={PublicRecordedCourseDetail} />
      <Route path="/public/contact" component={PublicContact} />
      
      {/* صفحة تسجيل الدخول - عامة */}
      <Route path="/login" component={Login} />
      
      {/* الصفحات العامة - متاحة لجميع المستخدمين المسجلين (ماعدا خدمة العملاء) */}
      <Route path="/" component={() => <CustomerServiceRoute><Home /></CustomerServiceRoute>} />
      <Route path="/courses" component={() => <ProtectedRoute><CoursesHub /></ProtectedRoute>} />
      <Route path="/courses/:id" component={() => <ProtectedRoute><CourseDetails /></ProtectedRoute>} />
      <Route path="/recorded-courses" component={() => <ProtectedRoute><RecordedCourses /></ProtectedRoute>} />
      <Route path="/recorded-courses/view/:id" component={() => <ProtectedRoute><RecordedCourseView /></ProtectedRoute>} />
      <Route path="/instructor-dashboard" component={() => <ProtectedRoute><InstructorDashboard /></ProtectedRoute>} />
      <Route path="/my-certificates" component={() => <ProtectedRoute><MyCertificates /></ProtectedRoute>} />
      <Route path="/my-payments" component={() => <ProtectedRoute><MyPayments /></ProtectedRoute>} />
      <Route path="/payment/callback" component={PaymentCallback} />
      <Route path="/reports" component={() => <ProtectedRoute><Reports /></ProtectedRoute>} />
      
      <Route path="/archive" component={() => <ProtectedRoute><Archive /></ProtectedRoute>} />
      <Route path="/services" component={() => <ProtectedRoute><Services /></ProtectedRoute>} />
      <Route path="/operational-expenses" component={() => <ProtectedRoute><OperationalExpenses /></ProtectedRoute>} />
      <Route path="/strategic-targets" component={() => <ProtectedRoute><StrategicTargets /></ProtectedRoute>} />
      <Route path="/partnerships" component={() => <ProtectedRoute><Partnerships /></ProtectedRoute>} />
      <Route path="/innovative-ideas" component={() => <ProtectedRoute><InnovativeIdeas /></ProtectedRoute>} />
      
      <Route path="/projects" component={() => <ProtectedRoute><Projects /></ProtectedRoute>} />
      <Route path="/projects/:id" component={() => <ProtectedRoute><ProjectDetails /></ProtectedRoute>} />
      <Route path="/dashboard" component={() => <ProtectedRoute><EmployeeDashboard /></ProtectedRoute>} />
      
      {/* صفحة مستهدفاتي - لخدمة العملاء */}
      <Route path="/my-targets" component={() => <ProtectedRoute><MyTargets /></ProtectedRoute>} />
      
      {/* الصفحات الإدارية - متاحة فقط للمسؤولين (roleId = 1) */}
      <Route path="/settings" component={() => <AdminRoute><Settings /></AdminRoute>} />
      <Route path="/permissions" component={() => <AdminRoute><PermissionsManagement /></AdminRoute>} />
      <Route path="/password-management" component={() => <AdminRoute><PasswordManagement /></AdminRoute>} />
      <Route path="/bulk-delete-users" component={() => <AdminRoute><BulkDeleteUsers /></AdminRoute>} />
      <Route path="/bulk-delete-employees" component={() => <AdminRoute><BulkDeleteEmployees /></AdminRoute>} />
      <Route path="/user-management" component={() => <AdminRoute><UserManagement /></AdminRoute>} />
      <Route path="/employees" component={() => <AdminRoute><Employees /></AdminRoute>} />
      <Route path="/employee-management" component={() => <AdminRoute><EmployeeManagement /></AdminRoute>} />
      <Route path="/employee-targets" component={() => <PermissionRoute permission="employee_targets.view"><EmployeeTargets /></PermissionRoute>} />
      <Route path="/attendance" component={() => <AdminRoute><Attendance /></AdminRoute>} />
      <Route path="/daily-reports" component={() => <AdminRoute><DailyReports /></AdminRoute>} />
      <Route path="/salaries" component={() => <AdminRoute><Salaries /></AdminRoute>} />
      <Route path="/employees/:id" component={() => <AdminRoute><EmployeeProfile /></AdminRoute>} />
      <Route path="/daily-stats-review" component={() => <PermissionRoute permission="employee_stats.review"><DailyStatsReview /></PermissionRoute>} />
      <Route path="/approved-stats-report" component={() => <PermissionRoute permission="employee_performance.view"><ApprovedStatsReport /></PermissionRoute>} />
      <Route path="/target-alerts" component={() => <PermissionRoute permission="employee_targets.view"><TargetAlerts /></PermissionRoute>} />
      
      {/* صفحات الخطأ */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
