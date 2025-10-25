import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import SignupChoice from './pages/SignupChoice';
import SignupSchool from './pages/SignupSchool';
import SignupMember from './pages/SignupMember';
import DashboardLayout from './pages/DashboardLayout';
import AdminTeachers from './pages/AdminTeachers';
import AdminStudents from './pages/AdminStudents';
import AdminPrograms from './pages/AdminPrograms';
import AdminSubjects from './pages/AdminSubjects';
import AdminSchoolYears from './pages/AdminSchoolYears';
import AdminPeriods from './pages/AdminPeriods';
import MemberPrograms from './pages/MemberPrograms';
import MemberSubjects from './pages/MemberSubjects';
import MemberNotes from './pages/MemberNotes';
import PendingNotice from './pages/PendingNotice';
import NotePage from './pages/NotePage';

import AdminClassrooms from './pages/AdminClassrooms';
import AdminClasses from './pages/AdminClasses';
import TeacherClasses from './pages/TeacherClasses';
import TeacherProjects from './pages/TeacherProjects';
import StudentClasses from './pages/StudentClasses';

function Protected() {
  const { booted, user } = useAuth();
  if (!booted) return <p style={{ padding:24 }}>Initializing…</p>;
  return user ? <Outlet/> : <Navigate to="/" replace/>;
}
function PublicOnly() {
  const { booted, user } = useAuth();
  if (!booted) return <p style={{ padding:24 }}>Initializing…</p>;
  return user ? <Navigate to="/dashboard" replace/> : <Outlet/>;
}
function DashboardIndex() {
  const { roles } = useAuth();
  return (
    <Navigate
      to={roles.includes('admin') ? '/dashboard/admin/teachers' : '/dashboard/notes'}
      replace
    />
  );
}
function MemberGate() {
  const { roles } = useAuth();
  return (roles.includes('teacher') || roles.includes('student')) ? <MemberNotes/> : <PendingNotice/>;
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicOnly/>}>
          <Route path="/" element={<Welcome/>} />
          <Route path="/login" element={<Login/>} />
          <Route path="/signup" element={<SignupChoice/>} />
          <Route path="/signup/school" element={<SignupSchool/>} />
          <Route path="/signup/member" element={<SignupMember/>} />
        </Route>

        <Route element={<Protected/>}>
          <Route path="/dashboard" element={<DashboardLayout/>}>
            {/* admin */}
            <Route path="admin/teachers" element={<AdminTeachers/>} />
            <Route path="admin/students" element={<AdminStudents/>} />
            <Route path="admin/programs" element={<AdminPrograms/>} />
            <Route path="admin/subjects" element={<AdminSubjects/>} />
            <Route path="admin/school-years" element={<AdminSchoolYears/>} />
            <Route path="admin/periods" element={<AdminPeriods/>} />
            <Route path="admin/classrooms" element={<AdminClassrooms/>} />
            <Route path="admin/classes" element={<AdminClasses/>} />
            {/* member */}
            <Route path="notes" element={<MemberGate/>} />
            <Route path="catalog/programs" element={<MemberPrograms/>} />
            <Route path="catalog/subjects" element={<MemberSubjects/>} />
            {/* teacher / student */}
            <Route path="teacher/classes" element={<TeacherClasses/>} />
            <Route path="student/classes" element={<StudentClasses/>} />
          </Route>

          <Route path="/dashboard/teacher/classes/:id/projects" element={<TeacherProjects/>} />
          <Route path="/note/:id" element={<NotePage/>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace/>} />
      </Routes>
    </BrowserRouter>  
  );
}