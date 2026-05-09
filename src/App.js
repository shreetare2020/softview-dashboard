import React, { useState, useEffect } from 'react';
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { collection, onSnapshot, doc, updateDoc, addDoc } from "firebase/firestore";
import { LayoutDashboard, Building2, Landmark, Users, LogOut, Settings, X, FileText, ArrowUpCircle, ArrowDownCircle, Clock } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// --- THEME: Royal Dark Blue & Gold ---
const theme = {
  bg: '#020617', // Ekdam dark navy
  card: '#0f172a', 
  gold: '#d4af37',
  border: 'rgba(212, 175, 55, 0.3)',
  text: '#ffffff'
};

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [banks, setBanks] = useState([]);
  const [viewLedger, setViewLedger] = useState(null);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        onSnapshot(collection(db, "Bank Master"), s => setBanks(s.docs.map(d => ({id: d.id, ...d.data()}))));
      }
    });
    return () => { clearInterval(timer); unsub(); };
  }, []);

  if (!user) return <LoginScreen />;

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', background: theme.bg, color: theme.text, overflow: 'hidden', fontFamily: 'Arial' }}>
      
      {/* SIDEBAR */}
      <aside style={{ width: '280px', borderRight: `1px solid ${theme.border}`, background: '#010409', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '40px 30px' }}>
          <h1 style={{ color: theme.gold, fontSize: '22px', fontWeight: '900', margin: 0 }}>BANKING PRO</h1>
          <p style={{ color: '#64748b', fontSize: '10px' }}>EXECUTIVE VERSION 2.0</p>
        </div>

        <nav style={{ flex: 1 }}>
          {['Dashboard', 'Firm Master', 'Bank Master', 'User Master', 'Setting'].map(id => (
            <div key={id} onClick={() => setActiveTab(id)} 
                 style={{ padding: '18px 30px', cursor: 'pointer', color: activeTab === id ? theme.gold : '#94a3b8', background: activeTab === id ? 'rgba(212,175,55,0.05)' : '' }}>
              {id}
            </div>
          ))}
        </nav>

        <div style={{ padding: '30px', borderTop: `1px solid ${theme.border}` }}>
          <p style={{ color: theme.gold, fontSize: '10px', fontWeight: 'bold' }}>DEVELOPED BY</p>
          <p style={{ color: '#fff', fontSize: '14px', fontWeight: '800' }}>SOFTVIEW TECHNOLOGIES</p>
          <p style={{ color: '#64748b', fontSize: '11px' }}>+91 7972084304</p>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header style={{ height: '90px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 40px', borderBottom: `1px solid ${theme.border}` }}>
          <h2 style={{ color: theme.gold }}>{activeTab}</h2>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 'bold', color: theme.gold }}>{user.email.split('@')[0]}</div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>{time.toLocaleTimeString()}</div>
          </div>
        </header>

        <div style={{ padding: '40px' }}>
          {activeTab === "Dashboard" && (
            <div style={{ background: theme.card, borderRadius: '15px', border: `1px solid ${theme.border}`, padding: '25px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ color: theme.gold, borderBottom: `2px solid ${theme.gold}` }}>
                    <th style={{ padding: '15px', textAlign: 'left' }}>BANK NAME</th>
                    <th style={{ padding: '15px' }}>ACCOUNT NO.</th>
                    <th style={{ padding: '15px' }}>BALANCE</th>
                    <th style={{ padding: '15px' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {banks.map(b => (
                    <tr key={b.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '15px' }}>{b.bankName}</td>
                      <td style={{ padding: '15px', textAlign: 'center' }}>{b.accNo}</td>
                      <td style={{ padding: '15px', color: '#10b981', fontWeight: 'bold', textAlign: 'center' }}>₹ {b.balance}</td>
                      <td style={{ padding: '15px', textAlign: 'center' }}>
                        <button onClick={() => setViewLedger(b)} style={{ background: theme.gold, color: '#000', border: 'none', padding: '8px 15px', borderRadius: '5px', fontWeight: 'bold' }}>
                          VIEW LEDGER
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* FULL SCREEN LEDGER OVERLAY */}
      {viewLedger && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: theme.bg, zIndex: 9999, padding: '50px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `2px solid ${theme.gold}`, paddingBottom: '20px' }}>
            <h1 style={{ color: theme.gold }}>{viewLedger.bankName} - ACCOUNT LEDGER</h1>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => generatePDF(viewLedger)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '5px' }}>PDF</button>
              <button onClick={() => setViewLedger(null)} style={{ background: '#334155', color: '#fff', border: 'none', padding: '10px', borderRadius: '5px' }}><X/></button>
            </div>
          </div>
          <table style={{ width: '100%', marginTop: '30px', borderCollapse: 'collapse' }}>
            <thead style={{ background: theme.gold, color: '#000' }}>
              <tr>
                <th style={{ padding: '12px' }}>DATE</th>
                <th style={{ padding: '12px' }}>PARTICULARS</th>
                <th style={{ padding: '12px' }}>RECEIPT (CR)</th>
                <th style={{ padding: '12px' }}>PAYMENT (DR)</th>
                <th style={{ padding: '12px' }}>BALANCE</th>
              </tr>
            </thead>
            <tbody style={{ textAlign: 'center' }}>
              <tr style={{ borderBottom: '1px solid #334155' }}>
                <td style={{ padding: '15px' }}>09/05/2026</td>
                <td style={{ padding: '15px', textAlign: 'left' }}>Opening Balance Entry</td>
                <td style={{ color: '#10b981' }}><ArrowDownCircle size={14}/> 50,000</td>
                <td style={{ color: '#ef4444' }}>-</td>
                <td style={{ fontWeight: 'bold' }}>₹ {viewLedger.balance}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const generatePDF = (bank) => {
  const doc = new jsPDF();
  doc.setFillColor(2, 6, 23);
  doc.rect(0, 0, 210, 40, 'F');
  doc.setTextColor(212, 175, 55);
  doc.setFontSize(22);
  doc.text("ACCOUNT STATEMENT", 105, 25, { align: 'center' });
  doc.autoTable({
    startY: 45,
    head: [['Date', 'Particulars', 'Receipt', 'Payment', 'Balance']],
    body: [['09/05/2026', 'Sample Transaction', '50,000', '0', bank.balance]],
    headStyles: { fillColor: [212, 175, 55], textColor: [0, 0, 0] }
  });
  doc.save(`${bank.bankName}_Ledger.pdf`);
};

function LoginScreen() {
  const [e, setE] = useState(""); const [p, setP] = useState("");
  return (
    <div style={{ height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#020617' }}>
      <div style={{ background: '#0f172a', padding: '50px', borderRadius: '20px', border: '1px solid #d4af37', width: '400px', textAlign: 'center' }}>
        <h1 style={{ color: '#d4af37' }}>LOGIN</h1>
        <input type="email" placeholder="Email" onChange={v => setE(v.target.value)} style={{ width: '100%', padding: '12px', margin: '10px 0', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid #d4af37' }} />
        <input type="password" placeholder="Password" onChange={v => setP(v.target.value)} style={{ width: '100%', padding: '12px', margin: '10px 0', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid #d4af37' }} />
        <button onClick={() => signInWithEmailAndPassword(auth, e, p)} style={{ width: '100%', background: '#d4af37', color: '#000', padding: '12px', borderRadius: '5px', fontWeight: 'bold', marginTop: '20px' }}>LOGIN</button>
      </div>
    </div>
  );
}