import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const linkStyle = ({ isActive }) => ({
  display:'block', padding:'8px 12px', borderRadius:6,
  background: isActive ? '#eef' : 'transparent', textDecoration:'none', color:'#000'
});

export default function DashboardLayout() {
  const { user, roles, logout, loggingOut } = useAuth();
  const isAdmin = roles.includes('admin');
  const isTeacher = roles.includes('teacher');

  return (
    <div style={{ maxWidth: 1200, margin:'16px auto', display:'grid', gridTemplateColumns:'240px 1fr', gap:16 }}>
      <aside style={{ border:'1px solid #ddd', borderRadius:8, padding:12, height:'fit-content' }}>
        <div style={{ marginBottom:12, fontWeight:600 }}>
          Dashboard {isAdmin ? 'Admin' : 'Member'} {user ? `<${user.email}>` : ''}
        </div>
        <nav style={{ display:'grid', gap:6 }}>
          {isAdmin ? (
            <>
              <NavLink to="/dashboard/admin/teachers" style={linkStyle}>Teachers</NavLink>
              <NavLink to="/dashboard/admin/students" style={linkStyle}>Students</NavLink>
              <NavLink to="/dashboard/admin/programs" style={linkStyle}>Programs</NavLink>
              <NavLink to="/dashboard/admin/subjects" style={linkStyle}>Subjects</NavLink>
              <NavLink to="/dashboard/admin/school-years" style={linkStyle}>School Years</NavLink>
              <NavLink to="/dashboard/admin/periods" style={linkStyle}>Periods</NavLink>
              <NavLink to="/dashboard/admin/classrooms" style={linkStyle}>Classrooms</NavLink>
              <NavLink to="/dashboard/admin/classes" style={linkStyle}>Classes</NavLink>
            </>
          ) : (
            <>
              <NavLink to="/dashboard/notes" style={linkStyle}>Notes</NavLink>
              <NavLink to="/dashboard/catalog/programs" style={linkStyle}>Programs</NavLink>
              <NavLink to="/dashboard/catalog/subjects" style={linkStyle}>Subjects</NavLink>
              {isTeacher
                ? <NavLink to="/dashboard/teacher/classes" style={linkStyle}>Classes</NavLink>
                : <NavLink to="/dashboard/student/classes" style={linkStyle}>My Classes</NavLink>}
            </>
          )}
        </nav>
        <div style={{ marginTop:16 }}>
          <button onClick={() => logout().then(()=>location.assign('/'))} disabled={loggingOut}>
            {loggingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </aside>
      <main>
        <Outlet />
      </main>
    </div>
  );
}