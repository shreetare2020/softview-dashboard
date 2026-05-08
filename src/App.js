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
      setForm({}); alert("Data Saved Successfully!");
    } catch (e) { alert("Database Error!"); }
  };

  if (!user) return <LoginScreen />;

  return (
    <div className="portal-container">
      <aside className="sidebar-luxury">
        <div className="brand-header"><h1>BANKING PRO</h1><p>EXECUTIVE ACCESS</p></div>
        <nav className="nav-menu">
          <div className={activeTab === "Dashboard" ? "nav-item active" : "nav-item"} onClick={() => setActiveTab("Dashboard")}><LayoutDashboard size={18}/> Dashboard</div>
          <div className={activeTab === "Firm Master" ? "nav-item active" : "nav-item"} onClick={() => setActiveTab("Firm Master")}><Building2 size={18}/> Firm Master</div>
          <div className={activeTab === "Bank Master" ? "nav-item active" : "nav-item"} onClick={() => setActiveTab("Bank Master")}><Landmark size={18}/> Bank Master</div>
          <div className={activeTab === "User Master" ? "nav-item active" : "nav-item"} onClick={() => setActiveTab("User Master")}><Users size={18}/> User Master</div>
        </nav>
        <div className="sidebar-footer">
          <p>CRAFTED BY</p>
          <h4>SOFTVIEW TECHNOLOGIES</h4>
          <span>+91 7972084304</span>
        </div>
      </aside>

      <main className="main-stage">
        <header className="header-bar"><h2>{activeTab}</h2><button className="gold-out" onClick={() => signOut(auth)}><LogOut size={16}/> LOGOUT</button></header>
        
        <div className="view-panel">
          {activeTab === "Firm Master" && (
            <div className="glass-card">
              <div className="card-head"><Building2 color="#d4af37"/> <h3>Firm Registration</h3></div>
              <div className="form-layout">
                <input placeholder="Firm Name" value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} />
                <input placeholder="GST Number" value={form.gst || ''} onChange={e => setForm({...form, gst: e.target.value})} />
                <input className="span-all" placeholder="Full Address (Office/Branch)" value={form.address || ''} onChange={e => setForm({...form, address: e.target.value})} />
                <button className="action-btn-gold" onClick={() => handleSave("firms")}>REGISTER FIRM</button>
              </div>
              <div className="table-wrapper">
                <table className="prime-table">
                  <thead><tr><th>FIRM NAME</th><th>GST NO</th><th>ADDRESS</th><th>ACTION</th></tr></thead>
                  <tbody>{firms.map(f => <tr key={f.id}><td>{f.name}</td><td>{f.gst}</td><td>{f.address}</td><td><Trash2 size={16} color="red" onClick={() => deleteDoc(doc(db, "firms", f.id))}/></td></tr>)}</tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "Bank Master" && (
            <div className="glass-card">
              <div className="card-head"><Landmark color="#d4af37"/> <h3>Bank Account Setup</h3></div>
              <div className="form-layout">
                <input placeholder="Bank Name" value={form.bankName || ''} onChange={e => setForm({...form, bankName: e.target.value})} />
                <input placeholder="Branch Name" value={form.branch || ''} onChange={e => setForm({...form, branch: e.target.value})} />
                <input placeholder="Account No" value={form.accNo || ''} onChange={e => setForm({...form, accNo: e.target.value})} />
                <input placeholder="Opening Balance" value={form.balance || ''} onChange={e => setForm({...form, balance: e.target.value})} />
                <select value={form.firmLink || ''} onChange={e => setForm({...form, firmLink: e.target.value})}><option value="">Link to Firm</option>{firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}</select>
                <button className="action-btn-gold" onClick={() => handleSave("banks")}>SAVE ACCOUNT</button>
              </div>
              <div className="table-wrapper">
                <table className="prime-table">
                  <thead><tr><th>BANK</th><th>BRANCH</th><th>A/C NO</th><th>FIRM</th><th>ACTION</th></tr></thead>
                  <tbody>{banks.map(b => <tr key={b.id}><td>{b.bankName}</td><td>{b.branch}</td><td>{b.accNo}</td><td>{b.firmLink}</td><td><Trash2 size={16} color="red" onClick={() => deleteDoc(doc(db, "banks", b.id))}/></td></tr>)}</tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* USER MASTER - FULL FIELDS */}
          {activeTab === "User Master" && (
            <div className="glass-card">
              <div className="card-head"><UserPlus color="#d4af37"/> <h3>User Authorization</h3></div>
              <div className="form-layout">
                <div className="icon-field"><Users size={16}/><input placeholder="Name" value={form.uName || ''} onChange={e => setForm({...form, uName: e.target.value})} /></div>
                <div className="icon-field"><Mail size={16}/><input placeholder="Email" value={form.uEmail || ''} onChange={e => setForm({...form, uEmail: e.target.value})} /></div>
                <div className="icon-field"><Phone size={16}/><input placeholder="Mobile" value={form.uMobile || ''} onChange={e => setForm({...form, uMobile: e.target.value})} /></div>
                <select value={form.role || ''} onChange={e => setForm({...form, role: e.target.value})}><option value="">Role</option><option value="Admin">Admin</option><option value="Operator">Operator</option></select>
                <div className="icon-field"><Lock size={16}/><input type="password" placeholder="Pass" value={form.pass || ''} onChange={e => setForm({...form, pass: e.target.value})} /></div>
                <div className="icon-field"><Lock size={16}/><input type="password" placeholder="Confirm" value={form.cPass || ''} onChange={e => setForm({...form, cPass: e.target.value})} /></div>
                <button className="action-btn-gold" onClick={() => handleSave("users")}>ADD USER</button>
              </div>
              <div className="table-wrapper">
                <table className="prime-table">
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

function LoginScreen() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const handleLogin = (e) => {
    e.preventDefault();
    signInWithEmailAndPassword(auth, email, pass).catch(() => alert("Invalid Credentials"));
  };
  return (
    <div className="auth-box-overlay">
      <div className="login-card-rigid">
        <ShieldCheck size={50} color="#d4af37" />
        <h2>BANKING PRO</h2>
        <p>EXECUTIVE VERSION 2.0</p>
        <form onSubmit={handleLogin}>
          <input type="email" placeholder="EMAIL ADDRESS" required onChange={e => setEmail(e.target.value)} />
          <input type="password" placeholder="PASSWORD" required onChange={e => setPass(e.target.value)} />
          <button type="submit">LOGIN TO SYSTEM</button>
        </form>
        <div className="login-footer">Powered by Softview Technologies</div>
      </div>
    </div>
  );
}