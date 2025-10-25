import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listTeacherProjectsApi, createTeacherProjectApi, updateTeacherProjectApi, deleteTeacherProjectApi } from '../api/teacher';

export default function TeacherProjects() {
  const { id } = useParams(); // classId
  const qc = useQueryClient();
  const q = useQuery({ queryKey:['teacher-projects', id], queryFn: () => listTeacherProjectsApi(id) });
  const createM = useMutation({ mutationFn: (body)=>createTeacherProjectApi(id, body), onSuccess: ()=>qc.invalidateQueries({queryKey:['teacher-projects', id]}) });
  const updateM = useMutation({ mutationFn: ({pid, body})=>updateTeacherProjectApi(pid, body), onSuccess: ()=>qc.invalidateQueries({queryKey:['teacher-projects', id]}) });
  const deleteM = useMutation({ mutationFn: deleteTeacherProjectApi, onSuccess: ()=>qc.invalidateQueries({queryKey:['teacher-projects', id]}) });

  const [name, setName] = useState('');
  return (
    <div style={{ display:'grid', gap:16 }}>
      <h3>Projects for class</h3>
      <div style={{ display:'flex', gap:8 }}>
        <input placeholder="New project name" value={name} onChange={e=>setName(e.target.value)} />
        <button onClick={()=> name && createM.mutate({ name })}>Create</button>
      </div>
      {q.isLoading && <p>Loading…</p>}
      <ul style={{ display:'grid', gap:8 }}>
        {(q.data || []).map(p => (
          <li key={p.id} style={{ border:'1px solid #eee', padding:10, borderRadius:6 }}>
            <b>{p.name}</b>
            <div style={{ display:'flex', gap:8, marginTop:6 }}>
              <button onClick={()=>{
                const nn = prompt('New name', p.name);
                if (nn != null) updateM.mutate({ pid:p.id, body:{ name: nn } });
              }}>Rename</button>
              <button onClick={()=>deleteM.mutate(p.id)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}