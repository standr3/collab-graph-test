import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { listSchoolsApi } from '../api/schools';
import { useNavigate } from 'react-router-dom';

export default function SignupMember() {
  const { registerMember, refetchAuth } = useAuth();
  const nav = useNavigate();
  const [schools, setSchools] = useState([]);
  const [f, setF] = useState({ name:'', email:'', password:'', school_id:'', role:'teacher' });

  useEffect(() => { (async () => { setSchools(await listSchoolsApi()); })(); }, []);
  const on = k => e => setF(s => ({ ...s, [k]: e.target.value }));

  const disabled = !schools.length || !f.name || !f.email || !f.password || !f.school_id || !f.role;

  async function onSubmit(e) {
    e.preventDefault();
    await registerMember(f);
    await refetchAuth();
    location.assign('/dashboard/notes');
  }

  return (
    <div style={{ maxWidth: 600, margin:'32px auto', display:'grid', gap:16 }}>
      <h2>Register as member</h2>
      <form onSubmit={onSubmit} style={{ display:'grid', gap:8 }}>
        <div>
          <label><input type="radio" name="role" value="teacher" checked={f.role==='teacher'} onChange={on('role')} /> Teacher</label>{' '}
          <label><input type="radio" name="role" value="student" checked={f.role==='student'} onChange={on('role')} /> Student</label>
        </div>
        <input placeholder="Name" value={f.name} onChange={on('name')} required />
        <input placeholder="Email" value={f.email} onChange={on('email')} required />
        <input placeholder="Password" type="password" value={f.password} onChange={on('password')} required />
        <select value={f.school_id} onChange={on('school_id')}>
          <option value="">Select a school</option>
          {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <button type="submit" disabled={disabled}>Sign up</button>
        {!schools.length && <small>No schools available. Ask an admin to register a school first.</small>}
      </form>
    </div>
  );
}