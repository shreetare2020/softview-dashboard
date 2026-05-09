import React, { useState, useEffect } from 'react';
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { collection, onSnapshot, doc, updateDoc, deleteDoc, addDoc } from "firebase/firestore";
import { LayoutDashboard, Building2, Landmark, Users, LogOut, Settings, ChevronDown, Edit3, Trash2, FileText, Download, UserCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './App.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [firms, setFirms] = useState([]);
  const [banks, setBanks] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [form, setForm] = useState({});
  const [editId, setEditId] = useState(null);
  const [expandedBank, setExpandedBank] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        onSnapshot(collection(db, "Firms"), s => setFirms(s.docs.map(d => ({id: d.id, ...d.data()}))));
        onSnapshot(collection(db, "Bank Master"), s => setBanks(s.docs.map(d => ({id: d.id, ...d.data()}))));
        onSnapshot(collection(db, "User Master"), s => setUsersList(s.docs.map(d => ({id: d.id, ...d.data()}))));
      }
    });
    return unsub;
  }, []);

  const handleSave = async (coll) => {
    try {
      if (editId) { await updateDoc(doc(db, coll, editId), { ...form }); setEditId(null); }
      else { await addDoc(collection(db, coll), { ...form, createdAt: new Date() }); }
      setForm({}); alert("Saved Successfully!");
    } catch (e) { alert(e.message); }
  };

  const exportExcel = (data) => {
    const ws = XLSX.utils.json_to_sheet([data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ledger");
    XLSX.writeFile(wb, "Bank_Ledger.xlsx");
  };

  if (!user) return <LoginScreen />;

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw' }}>
      {/* SIDEBAR */}
      <aside style={{ width: '280px', background: '#0a192f', color: '#fff', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '40px 25px' }}><h1 style={{ color: '#d4af37', margin: 0 }}>BANKING PRO</h1></div>
        <nav style={{ flex: 1 }}>
          {[
            {id: 'Dashboard', icon: <LayoutDashboard size={20}/>},
            {id: 'Firm Master', icon: <Building2 size={20}/>},
            {id: 'Bank Master', icon: <Landmark size={20}/>},
            {id: 'User Master', icon: <Users size={20}/>},
            {id: 'Setting', icon: <Settings size={20}/>}
          ].map(item => (
            <div key={item.id} onClick={() => {setActiveTab(item.id); setEditId(null); setForm({});}} 
                 style={{ display: 'flex', alignItems: 'center', padding: '15px 25px', cursor: 'pointer', background: activeTab === item.id ? 'rgba(212,175,55,0.1)' : '' }}>
              {item.icon} <span style={{ marginLeft: '15px' }}>{item.id}</span>
            </div>
          ))}
        </nav>
      </aside>

      <main>
        <header style={{ height: '80px', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 40px', borderBottom: '1px solid #eee' }}>
          <h2 style={{ color: '#0a192f' }}>{activeTab}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
             <div style={{ textAlign: 'right' }}><div style={{ fontWeight: 'bold' }}>Admin</div><div style={{ fontSize: '10px' }}>{user.email}</div></div>
             <UserCircle size={40} color="#d4af37" />
             <button onClick={() => signOut(auth)} className="btn-logout"><LogOut size={20}/></button>
          </div>
        </header>

        <div style={{ padding: '40px' }}>
          {activeTab === "Dashboard" && (
            <div className="premium-card">
              <table className="royal-table">
                <thead><tr><th>BANK</th><th>ACCOUNT NO</th><th>BALANCE</th><th>ACTION</th></tr></thead>
                <tbody>{banks.map(b => (
                  <React.Fragment key={b.id}>
                    <tr onClick={() => setExpandedBank(expandedBank === b.id ? null : b.id)} style={{ cursor: 'pointer' }}>
                      <td>{b.bankName}</td><td>{b.accNo}</td><td>₹ {b.balance || '0'}</td><td><ChevronDown size={18}/></td>
                    </tr>
                    {expandedBank === b.id && (
                      <tr><td colSpan="4" style={{ background: '#f8fafc', padding: '20px' }}>
                        <div style={{ display: 'flex', gap: '15px' }}>
                          <button className="gold-btn" onClick={() => exportExcel(b)}><Download size={16}/> EXCEL</button>
                          <button className="gold-btn"><FileText size={16}/> PDF</button>
                        </div>
                      </td></tr>
                    )}
                  </React.Fragment>
                ))}</tbody>
              </table>
            </div>
          )}

          {activeTab === "Firm Master" && (
            <div className="premium-card">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <input placeholder="Firm Name" className="luxury-input" value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} />
                <input placeholder="GST No" className="luxury-input" value={form.gst || ''} onChange={e => setForm({...form, gst: e.target.value})} />
                <textarea placeholder="Office Address" className="luxury-input" style={{ gridColumn: 'span 2' }} value={form.address || ''} onChange={e => setForm({...form, address: e.target.value})} />
              </div>
              <button onClick={() => handleSave("Firms")} className="btn-royal">Save Firm</button>
              <table className="royal-table">
                <thead><tr><th>NAME</th><th>GST</th><th>ACTION</th></tr></thead>
                <tbody>{firms.map(f => <tr key={f.id}><td>{f.name}</td><td>{f.gst}</td><td><Edit3 size={16} onClick={() => {setForm(f); setEditId(f.id);}}/></td></tr>)}</tbody>
              </table>
            </div>
          )}

          {activeTab === "Bank Master" && (
            <div className="premium-card">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                <input placeholder="Bank Name" className="luxury-input" value={form.bankName || ''} onChange={e => setForm({...form, bankName: e.target.value})} />
                <input placeholder="Branch" className="luxury-input" value={form.branch || ''} onChange={e => setForm({...form, branch: e.target.value})} />
                <input placeholder="A/c No" className="luxury-input" value={form.accNo || ''} onChange={e => setForm({...form, accNo: e.target.value})} />
                <input placeholder="IFSC Code" className="luxury-input" value={form.ifsc || ''} onChange={e => setForm({...form, ifsc: e.target.value})} />
                <select className="luxury-input" value={form.status || 'Active'} onChange={e => setForm({...form, status: e.target.value})}>
                  <option value="Active">Active</option><option value="Closed">Closed</option>
                </select>
                {form.status === 'Closed' && <input type="date" className="luxury-input" onChange={e => setForm({...form, closingDate: e.target.value})} />}
              </div>
              <button onClick={() => handleSave("Bank Master")} className="btn-royal">Save Bank</button>
            </div>
          )}

          {activeTab === "User Master" && (
            <div className="premium-card">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <input placeholder="User Code" className="luxury-input" value={form.code || ''} onChange={e => setForm({...form, code: e.target.value})} />
                <input placeholder="User Name" className="luxury-input" value={form.uName || ''} onChange={e => setForm({...form, uName: e.target.value})} />
                <input placeholder="Email" className="luxury-input" value={form.uEmail || ''} onChange={e => setForm({...form, uEmail: e.target.value})} />
                <input placeholder="Mobile No" className="luxury-input" value={form.mobile || ''} onChange={e => setForm({...form, mobile: e.target.value})} />
                <input type="password" placeholder="Password" className="luxury-input" value={form.pass || ''} onChange={e => setForm({...form, pass: e.target.value})} />
              </div>
              <button onClick={() => handleSave("User Master")} className="btn-royal">Save User</button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function LoginScreen() {
  const [e, setE] = useState(""); const [p, setP] = useState("");
  const h = (ev) => { ev.preventDefault(); signInWithEmailAndPassword(auth, e, p).catch(() => alert("Error")); };
  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a192f' }}>
      <form onSubmit={h} style={{ background: '#fff', padding: '50px', borderRadius: '20px', width: '400px' }}>
        <h2 style={{ textAlign: 'center', color: '#0a192f' }}>EXECUTIVE LOGIN</h2>
        <input type="email" placeholder="Email" className="luxury-input" onChange={v => setE(v.target.value)} />
        <input type="password" placeholder="Password" className="luxury-input" onChange={v => setP(v.target.value)} />
        <button type="submit" className="btn-royal" style={{ width: '100%' }}>Login</button>
      </form>
    </div>
  );
}