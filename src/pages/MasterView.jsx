import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

const MasterView = () => {
  const [candidates, setCandidates] = useState([]);

  useEffect(() => {
    // Fetch data immediately
    api.getCandidates().then(data => {
      console.log("MasterView Loaded Data:", data);
      setCandidates(data);
    });
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <h1 className="text-3xl font-bold text-red-500 mb-4">
        ✅ IF YOU SEE THIS, IT WORKED!
      </h1>
      <p className="mb-4">Rows found: {candidates.length}</p>

      {/* SUPER SIMPLE TABLE - NO STYLING OBSTRUCTIONS */}
      <div style={{ overflowX: 'auto', border: '2px solid red', width: '100%' }}>
        <table style={{ minWidth: '2000px', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#333', color: '#fff' }}>
              <th className="p-2 border">ID</th>
              <th className="p-2 border">First Name</th>
              <th className="p-2 border">Last Name</th>
              <th className="p-2 border">Email</th>
              <th className="p-2 border">Fit %</th>
              <th className="p-2 border">Risk Factor</th>
              <th className="p-2 border">Strengths</th>
              <th className="p-2 border">Weaknesses</th>
              <th className="p-2 border">Tone</th>
              <th className="p-2 border">Justification</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((c) => (
              <tr key={c.id} style={{ borderBottom: '1px solid #555' }}>
                <td className="p-2 border">{c.id}</td>
                <td className="p-2 border font-bold text-green-400">{c.first_name}</td>
                <td className="p-2 border">{c.last_name}</td>
                <td className="p-2 border">{c.email}</td>
                <td className="p-2 border">{c.overall_fit}</td>
                <td className="p-2 border text-red-300">{c.risk_factor?.substring(0, 50)}...</td>
                <td className="p-2 border">{c.strengths?.substring(0, 50)}...</td>
                <td className="p-2 border">{c.weaknesses?.substring(0, 50)}...</td>
                <td className="p-2 border">{c.tone_label}</td>
                <td className="p-2 border italic">{c.justification?.substring(0, 50)}...</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MasterView;