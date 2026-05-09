import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import {
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  updatePassword,
} from 'firebase/auth';

import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
} from 'firebase/firestore';

import {
  LayoutDashboard,
  Building2,
  Landmark,
  Users,
  LogOut,
  Settings,
  ChevronDown,
  Edit3,
  Trash2,
  Download,
  FileText,
} from 'lucide-react';

import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './App.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('Viewer');
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [firms, setFirms] = useState([]);
  const [banks, setBanks] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [selectedFirm, setSelectedFirm] = useState('All');
  const [expandedBank, setExpandedBank] = useState(null);
  const [time, setTime] = useState(new Date());
  const [form, setForm] = useState({});
  const [newPass, setNewPass] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);

      if (u) {
        onSnapshot(collection(db, 'Firms'), (s) => {
          setFirms(s.docs.map((d) => ({ id: d.id, ...d.data() })));
        });

        onSnapshot(collection(db, 'Bank Master'), (s) => {
          setBanks(s.docs.map((d) => ({ id: d.id, ...d.data() })));
        });

        onSnapshot(collection(db, 'User Master'), (s) => {
          const data = s.docs.map((d) => ({ id: d.id, ...d.data() }));
          setUsersList(data);

          const match = data.find((x) => x.uEmail === u.email);
          if (match) {
            setUserRole(match.role);
          }
        });
      }
    });

    return () => {
      clearInterval(timer);
      unsub();
    };
  }, []);

  const handleSave = async (coll) => {
    if (userRole === 'Viewer') {
      alert('Permission Denied');
      return;
    }

    try {
      await addDoc(collection(db, coll), {
        ...form,
        status: 'Open',
        createdAt: new Date(),
      });

      setForm({});
      alert('Saved Successfully');
    } catch (e) {
      alert(e.message);
    }
  };

  const exportExcel = (b) => {
    const data = [
      {
        Date: '01-05-2026',
        Particular: 'Opening Balance',
        Receipt: '',
        Payment: '',
        Balance: b.balance,
      },
      {
        Date: '02-05-2026',
        Particular: 'Cash Deposit',
        Receipt: 25000,
        Payment: '',
        Balance: 125000,
      },
      {
        Date: '03-05-2026',
        Particular: 'Cheque Payment',
        Receipt: '',
        Payment: 10000,
        Balance: 115000,
      },
    ];

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, 'Ledger');

    XLSX.writeFile(wb, `${b.bankName}_Ledger.xlsx`);
  };

  const exportPDF = (b) => {
    const pdf = new jsPDF();

    pdf.setFontSize(18);
    pdf.text('BANK LEDGER REPORT', 14, 20);

    pdf.setFontSize(11);
    pdf.text(`Bank : ${b.bankName}`, 14, 30);
    pdf.text(`Account No : ${b.accNo}`, 14, 37);
    pdf.text(`Generated : ${new Date().toLocaleString()}`, 14, 44);

    pdf.autoTable({
      startY: 55,
      head: [['Date', 'Particular', 'Receipt', 'Payment', 'Balance']],
      body: [
        ['01-05-2026', 'Opening Balance', '-', '-', b.balance],
        ['02-05-2026', 'Cash Deposit', '25000', '-', '125000'],
        ['03-05-2026', 'Cheque Payment', '-', '10000', '115000'],
      ],
      headStyles: {
        fillColor: [10, 25, 47],
      },
    });

    pdf.save(`${b.bankName}.pdf`);
  };

  if (!user) {
    return <LoginScreen />;
  }

  const dashboardData = banks.filter(
    (b) => selectedFirm === 'All' || b.linkedFirm === selectedFirm
  );

  return (
    <div className="app-container" style={{ display: 'flex' }}>
      <aside className="executive-sidebar">
        <div style={{ padding: '30px 20px' }}>
          <h1
            style={{
              color: 'var(--gold)',
              margin: 0,
              fontSize: '20px',
            }}
          >
            BANKING PRO
          </h1>

          <p
            style={{
              fontSize: '10px',
              color: '#94a3b8',
              marginTop: '5px',
            }}
          >
            Executive Version 2.0
          </p>
        </div>

        <nav style={{ flex: 1 }}>
          <div
            className={`nav-item ${activeTab === 'Dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('Dashboard')}
          >
            <LayoutDashboard size={18} /> Dashboard
          </div>

          <div
            className={`nav-item ${activeTab === 'Firm Master' ? 'active' : ''}`}
            onClick={() => setActiveTab('Firm Master')}
          >
            <Building2 size={18} /> Firm Master
          </div>

          <div
            className={`nav-item ${activeTab === 'Bank Master' ? 'active' : ''}`}
            onClick={() => setActiveTab('Bank Master')}
          >
            <Landmark size={18} /> Bank Master
          </div>

          <div
            className={`nav-item ${activeTab === 'User Master' ? 'active' : ''}`}
            onClick={() => setActiveTab('User Master')}
          >
            <Users size={18} /> User Master
          </div>

          <div
            className={`nav-item ${activeTab === 'Setting' ? 'active' : ''}`}
            onClick={() => setActiveTab('Setting')}
          >
            <Settings size={18} /> Setting
          </div>
        </nav>

        <div
          style={{
            padding: '20px',
            borderTop: '1px solid rgba(212,175,55,0.1)',
            color: '#cbd5e1',
            fontSize: '11px',
            lineHeight: '20px',
          }}
        >
          <div
            style={{
              color: '#d4af37',
              fontWeight: 'bold',
            }}
          >
            Developed By
          </div>

          <div>SOFTVIEW TECHNOLOGIES</div>

          <div style={{ color: '#d4af37' }}>+91 7972084304</div>
        </div>
      </aside>

      <main
        style={{
          flex: 1,
          marginLeft: '260px',
          background: '#f8fafc',
          minHeight: '100vh',
        }}
      >
        <header className="luxury-header">
          <div style={{ fontWeight: 'bold' }}>
            {activeTab.toUpperCase()}
          </div>

          <div
            style={{
              display: 'flex',
              gap: '25px',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                textAlign: 'right',
                borderRight: '1px solid #ddd',
                paddingRight: '15px',
              }}
            >
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: '700',
                  color: '#fff',
                }}
              >
                Login User : {user?.email}
              </div>

              <div
                style={{
                  fontSize: '13px',
                  fontWeight: '900',
                  color: '#d4af37',
                }}
              >
                {time.toLocaleTimeString()}
              </div>

              <div
                style={{
                  fontSize: '10px',
                  color: '#cbd5e1',
                }}
              >
                {time.toLocaleDateString()}
              </div>
            </div>

            <button
              className="btn-gold"
              style={{ background: '#ffefef', color: 'red' }}
              onClick={() => signOut(auth)}
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        <div style={{ padding: '30px' }}>
          {activeTab === 'Dashboard' && (
            <div>
              <select
                className="btn-gold"
                style={{ background: 'white', marginBottom: '20px' }}
                onChange={(e) => setSelectedFirm(e.target.value)}
              >
                <option value="All">All Firms</option>

                {firms.map((f) => (
                  <option key={f.id} value={f.name}>
                    {f.name}
                  </option>
                ))}
              </select>

              <table className="royal-table">
                <thead>
                  <tr>
                    <th>Bank Name</th>
                    <th>A/c No.</th>
                    <th>Closing Balance</th>
                    <th>Ledger</th>
                  </tr>
                </thead>

                <tbody>
                  {dashboardData.map((b) => (
                    <React.Fragment key={b.id}>
                      <tr
                        onClick={() =>
                          setExpandedBank(expandedBank === b.id ? null : b.id)
                        }
                        style={{ cursor: 'pointer' }}
                      >
                        <td>{b.bankName}</td>
                        <td>{b.accNo}</td>
                        <td>₹ {b.balance}</td>
                        <td>
                          <ChevronDown />
                        </td>
                      </tr>

                      {expandedBank === b.id && (
                        <tr>
                          <td colSpan="4">
                            <div style={{ padding: '20px' }}>
                              <div
                                style={{
                                  display: 'flex',
                                  gap: '10px',
                                  marginBottom: '10px',
                                }}
                              >
                                <button
                                  className="btn-gold"
                                  onClick={() => exportExcel(b)}
                                >
                                  <Download size={14} /> Excel
                                </button>

                                <button
                                  className="btn-gold"
                                  onClick={() => exportPDF(b)}
                                >
                                  <FileText size={14} /> PDF
                                </button>
                              </div>

                              <table className="royal-table">
                                <thead>
                                  <tr>
                                    <th>Date</th>
                                    <th>Particular</th>
                                    <th>Receipt</th>
                                    <th>Payment</th>
                                    <th>Balance</th>
                                  </tr>
                                </thead>

                                <tbody>
                                  <tr>
                                    <td>01-05-2026</td>
                                    <td>Opening Balance</td>
                                    <td>-</td>
                                    <td>-</td>
                                    <td>{b.balance}</td>
                                  </tr>

                                  <tr>
                                    <td>02-05-2026</td>
                                    <td>Cash Deposit</td>
                                    <td style={{ color: 'green' }}>
                                      ↓ 25000
                                    </td>
                                    <td>-</td>
                                    <td>125000</td>
                                  </tr>

                                  <tr>
                                    <td>03-05-2026</td>
                                    <td>Cheque Payment</td>
                                    <td>-</td>
                                    <td style={{ color: 'red' }}>
                                      ↑ 10000
                                    </td>
                                    <td>115000</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function LoginScreen() {
  const [e, setE] = useState('');
  const [p, setP] = useState('');

  const h = (ev) => {
    ev.preventDefault();

    signInWithEmailAndPassword(auth, e, p).catch(() => {
      alert('Login Failed');
    });
  };

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a192f',
      }}
    >
      <form
        onSubmit={h}
        style={{
          background: 'white',
          padding: '50px',
          borderRadius: '15px',
          width: '400px',
          borderTop: '5px solid #d4af37',
        }}
      >
        <h2
          style={{
            textAlign: 'center',
            color: '#0a192f',
          }}
        >
          BANKING PRO
        </h2>

        <p
          style={{
            textAlign: 'center',
            color: '#64748b',
            fontSize: '12px',
          }}
        >
          Executive Version 2.0
        </p>

        <input
          type="email"
          placeholder="Email"
          className="btn-gold"
          style={{
            width: '100%',
            marginBottom: '15px',
            background: '#f8fafc',
          }}
          onChange={(v) => setE(v.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="btn-gold"
          style={{
            width: '100%',
            marginBottom: '25px',
            background: '#f8fafc',
          }}
          onChange={(v) => setP(v.target.value)}
        />

        <button type="submit" className="btn-gold" style={{ width: '100%' }}>
          LOG IN
        </button>
      </form>
    </div>
  );
}