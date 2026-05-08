import React, { useState, useEffect } from 'react';
import './App.css';
import { auth, db } from "./firebase"; 
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { collection, onSnapshot, addDoc, doc, deleteDoc } from "firebase/firestore";
import { Trash2, LayoutDashboard, Building2, Landmark, Users, LogOut, ChevronDown, FileSpreadsheet, FileText, ShieldCheck, Phone, Mail, Lock, UserPlus, MapPin } from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from "jspdf";
import "jspdf-autotable";

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [banks, setBanks] = useState([]);
  const [firms, setFirms] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [form, setForm] = useState({});
  const [expandedBank, setExpandedBank] = useState(null);
  const [firmFilter, setFirmFilter] = useState("All");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    if (user) {
      onSnapshot(collection(db, "firms"), s => setFirms(s.docs.map(d => ({id: d.id, ...d.data()}))));
      onSnapshot(collection(db, "banks"), s => setBanks(s.docs.map(d => ({id: d.id, ...d.data()}))));
      onSnapshot(collection(db, "users"), s => setUsersList(s.docs.map(d => ({id: d.id, ...d.data()}))));
    }
    return () => unsub();
  }, [user]);

  const handleSave = async (coll) => {
    if (coll === "users" && form.pass !== form.cPass) { alert("Passwords Mismatch!"); return; }
    try {
      await addDoc(collection(db, coll), { ...form, createdAt: new Date() });
      setForm({}); alert("System Database Updated!");
    } catch (e) { alert("Error Saving Data!"); }
  };

  if (!user) return <LoginScreen />;

  return (
    <div className="portal-frame">
      <aside className="sidebar-luxury">
        <div className="side-logo"><h1>BANKING PRO</h1><p>EXECUTIVE ACCESS</p></div>
        <nav className="nav-stack">
          <div className={activeTab === "Dashboard" ? "nav-btn active" : "nav-btn"} onClick={() => setActiveTab("Dashboard")}><LayoutDashboard size={18}/> Dashboard</div>
          <div className={activeTab === "Firm Master" ? "nav-btn active" : "nav-btn"} onClick={() => setActiveTab("Firm Master")}><Building2 size={18}/> Firm Master</div>
          <div className={activeTab === "Bank Master" ? "nav-btn active" : "nav-btn"} onClick={() => setActiveTab("Bank Master")}><Landmark size={18}/> Bank Master</div>
          <div className={activeTab === "User Master" ? "nav-btn active" : "nav-btn"} onClick={() => setActiveTab("User Master")}><Users size={18}/> User Master</div>
        </nav>
        <div className="side-footer"><h4>SOFTVIEW TECHNOLOGIES</h4><span>+91 7972084304</span></div>
      </aside>

      <main className="main-viewport">
        <header className="top-header"><h2>{activeTab}</h2><button className="logout-gold" onClick={() => signOut(auth)}>LOGOUT</button></header>

        <div className="scroll-panel">
          {/* FIRM MASTER - ADDRESS FIXED */}
          {activeTab === "Firm Master" && (
            <div className="master-card">
              <div className="master-head"><Building2 color="#d4af37"/> <h3>Firm Registration Master</h3></div>
              <div className="pro-form-grid">
                <input placeholder="Firm Name" value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} />
                <input placeholder="GST Number" value={form.gst || ''} onChange={e => setForm({...form, gst: e.target.value})} />
                <input className="full-width" placeholder="Full Office Address" value={form.address || ''} onChange={e => setForm({...form, address: e.target.value})} />
                <button className="btn-save-gold" onClick={() => handleSave("firms")}>REGISTER FIRM</button>
              </div>
              <div className="table-container">
                <table className="luxury-table">
                  <thead><tr><th>FIRM NAME</th><th>GST NO.</th><th>ADDRESS</th><th>ACTION</th></tr></thead>
                  <tbody>{firms.map(f => <tr key={f.id}><td>{f.name}</td><td>{f.gst}</td><td>{f.address}</td><td><Trash2 size={16} color="red" onClick={() => deleteDoc(doc(db, "firms", f.id))}/></td></tr>)}</tbody>
                </table>
              </div>
            </div>
          )}

          {/* BANK MASTER - FULL FIELDS */}
          {activeTab === "Bank Master" && (
            <div className="master-card">
              <div className="master-head"><Landmark color="#d4af37"/> <h3>Bank Account Master</h3></div>
              <div className="pro-form-grid">
                <input placeholder="Bank Name" value={form.bankName || ''} onChange={e => setForm({...form, bankName: e.target.value})} />
                <input placeholder="Branch Name" value={form.branch || ''} onChange={e => setForm({...form, branch: e.target.value})} />
                <input placeholder="Account No" value={form.accNo || ''} onChange={e => setForm({...form, accNo: e.target.value})} />
                <input placeholder="Opening Balance" value={form.balance || ''} onChange={e => setForm({...form, balance: e.target.value})} />
                <select value={form.firmLink || ''} onChange={e => setForm({...form, firmLink: e.target.value})}>
                   <option value="">Link to Firm</option>{firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                </select>
                <button className="btn-save-gold" onClick={() => handleSave("banks")}>SAVE ACCOUNT</button>
              </div>
              <div className="table-container">
                <table className="luxury-table">
                  <thead><tr><th>BANK</th><th>BRANCH</th><th>A/C NO</th><th>FIRM</th><th>ACTION</th></tr></thead>
                  <tbody>{banks.map(b => <tr key={b.id}><td>{b.bankName}</td><td>{b.branch}</td><td>{b.accNo}</td><td>{b.firmLink}</td><td><Trash2 size={16} color="red" onClick={() => deleteDoc(doc(db, "banks", b.id))}/></td></tr>)}</tbody>
                </table>
              </div>
            </div>
          )}

          {/* USER MASTER - FULL FIELDS */}
          {activeTab === "User Master" && (
            <div className="master-card">
              <div className="master-head"><UserPlus color="#d4af37"/> <h3>User Authorization Master</h3></div>
              <div className="pro-form-grid">
                <div className="input-with-icon"><Users size={16}/><input placeholder="Full Name" value={form.uName || ''} onChange={e => setForm({...form, uName: e.target.value})} /></div>
                <div className="input-with-icon"><Mail size={16}/><input placeholder="Email Address" value={form.uEmail || ''} onChange={e => setForm({...form, uEmail: e.target.value})} /></div>
                <div className="input-with-icon"><Phone size={16}/><input placeholder="Mobile No" value={form.uMobile || ''} onChange={e => setForm({...form, uMobile: e.target.value})} /></div>
                <select value={form.role || ''} onChange={e => setForm({...form, role: e.target.value})}><option value="">Select Role</option><option value="Admin">Admin</option><option value="Operator">Operator</option></select>
                <div className="input-with-icon"><Lock size={16}/><input type="password" placeholder="Password" value={form.pass || ''} onChange={e => setForm({...form, pass: e.target.value})} /></div>
                <div className="input-with-icon"><Lock size={16}/><input type="password" placeholder="Confirm Password" value={form.cPass || ''} onChange={e => setForm({...form, cPass: e.target.value})} /></div>
                <button className="btn-save-gold" onClick={() => handleSave("users")}>AUTHORIZE USER</button>
              </div>
              <div className="table-container">
                <table className="luxury-table">
                  <thead><tr><th>NAME</th><th>EMAIL</th><th>MOBILE</th><th>ROLE</th><th>ACTION</th></tr></thead>
                  <tbody>{usersList.map(u => <tr key={u.id}><td>{u.uName}</td><td>{u.uEmail}</td><td>{u.uMobile}</td><td>{u.role}</td><td><Trash2 size={16} color="red" onClick={() => deleteDoc(doc(db, "users", u.id))}/></td></tr>)}</tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function LoginScreen() { return <div className="login-full"><h1>LOGIN</h1></div>; }