import React, { useState, useEffect } from 'react';
import { auth, db } from "./firebase";
import {
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  updatePassword
} from "firebase/auth";

import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  addDoc
} from "firebase/firestore";

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
  XCircle
} from 'lucide-react';

import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './App.css';

export default function App() {

  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState("Viewer");

  const [activeTab, setActiveTab] = useState("Dashboard");

  const [firms, setFirms] = useState([]);
  const [banks, setBanks] = useState([]);
  const [usersList, setUsersList] = useState([]);

  const [selectedFirm, setSelectedFirm] = useState("All");

  const [expandedBank, setExpandedBank] = useState(null);

  const [time, setTime] = useState(new Date());

  const [form, setForm] = useState({});

  const [newPass, setNewPass] = useState("");

  useEffect(() => {

    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    const unsub = onAuthStateChanged(auth, (u) => {

      setUser(u);

      if (u) {

        onSnapshot(
          collection(db, "User Master"),
          (s) => {
            setUsersList(
              s.docs.map(d => ({
                id: d.id,
                ...d.data()
              }))
            );
          }
        );

        onSnapshot(
          collection(db, "Firms"),
          (s) => {
            setFirms(
              s.docs.map(d => ({
                id: d.id,
                ...d.data()
              }))
            );
          }
        );

        onSnapshot(
          collection(db, "Bank Master"),
          (s) => {
            setBanks(
              s.docs.map(d => ({
                id: d.id,
                ...d.data()
              }))
            );
          }
        );

        onSnapshot(
          collection(db, "User Master"),
          (s) => {

            const match = s.docs.find(
              d => d.data().uEmail === u.email
            );

            if (match) {
              setUserRole(match.data().role);
            }

          }
        );

      }

    });

    return () => {
      clearInterval(timer);
      unsub();
    };

  }, []);

  const handleSave = async (coll) => {

    if (userRole === "Viewer") {
      return alert("Permission Denied");
    }

    try {

      await addDoc(
        collection(db, coll),
        {
          ...form,
          status: "Open",
          createdAt: new Date()
        }
      );

      setForm({});

      alert("Saved Successfully");

    } catch (e) {

      alert(e.message);

    }

  };

  const handleDelete = async (coll, id) => {

    if (!window.confirm("Delete Record ?")) return;

    try {

      await deleteDoc(doc(db, coll, id));

      alert("Deleted");

    } catch (e) {

      alert(e.message);

    }

  };

  const handleClose = async (coll, id) => {

    try {

      await updateDoc(
        doc(db, coll, id),
        {
          status: "Closed"
        }
      );

      alert("Status Updated");

    } catch (e) {

      alert(e.message);

    }

  };

  const handleEdit = async (coll, id, data) => {

    const value = prompt(
      "Update Value",
      data.name || data.bankName || data.uName
    );

    if (!value) return;

    try {

      if (coll === "Firms") {

        await updateDoc(
          doc(db, coll, id),
          {
            name: value
          }
        );

      }

      if (coll === "Bank Master") {

        await updateDoc(
          doc(db, coll, id),
          {
            bankName: value
          }
        );

      }

      if (coll === "User Master") {

        await updateDoc(
          doc(db, coll, id),
          {
            uName: value
          }
        );

      }

      alert("Updated");

    } catch (e) {

      alert(e.message);

    }

  };

  const exportExcel = (b) => {

    const data = [
      {
        Date: "Opening",
        Particulars: "Balance B/F",
        Dr: "-",
        Cr: "-",
        Balance: b.balance
      }
    ];

    const ws = XLSX.utils.json_to_sheet(data);

    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      wb,
      ws,
      "Ledger"
    );

    XLSX.writeFile(
      wb,
      `${b.bankName}_Ledger.xlsx`
    );

  };

  const exportPDF = (b) => {

    const doc = new jsPDF();

    doc.setFontSize(18);

    doc.text(
      "BANKING PRO - LEDGER REPORT",
      14,
      20
    );

    doc.setFontSize(10);

    doc.text(
      `Bank : ${b.bankName}`,
      14,
      30
    );

    doc.text(
      `A/c : ${b.accNo}`,
      14,
      36
    );

    doc.text(
      `Generated : ${time.toLocaleString()}`,
      14,
      42
    );

    doc.autoTable({

      startY: 50,

      head: [[
        "Date",
        "Particulars",
        "Dr",
        "Cr",
        "Balance"
      ]],

      body: [[
        "Opening",
        "Balance B/F",
        "-",
        "-",
        `${b.balance} ${b.type}`
      ]],

      headStyles: {
        fillColor: [10, 25, 47]
      }

    });

    doc.save(
      `${b.bankName}_Ledger.pdf`
    );

  };

  if (!user) {
    return <LoginScreen />;
  }

  const dashboardData = banks.filter(
    b =>
      selectedFirm === "All" ||
      b.linkedFirm === selectedFirm
  );

  return (

    <div
      className="app-container"
      style={{
        display: 'flex',
        height: '100vh',
        width: '100vw'
      }}
    >

      <aside className="executive-sidebar">

        <div style={{ padding: '30px 20px' }}>

          <h1
            style={{
              color: 'var(--gold)',
              margin: 0,
              fontSize: '20px'
            }}
          >
            BANKING PRO
          </h1>

          <p
            style={{
              fontSize: '10px',
              color: '#64748b'
            }}
          >
            Executive Version 2.0
          </p>

          <p
            style={{
              fontSize: '10px',
              color: '#d4af37'
            }}
          >
            Developed By Softview Technologies
          </p>

          <p
            style={{
              fontSize: '10px',
              color: '#ffffff'
            }}
          >
            7972084304
          </p>

        </div>

        <nav style={{ flex: 1 }}>

          <div
            className={`nav-item ${activeTab === 'Dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('Dashboard')}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </div>

          <div
            className={`nav-item ${activeTab === 'Firm Master' ? 'active' : ''}`}
            onClick={() => setActiveTab('Firm Master')}
          >
            <Building2 size={18} />
            Firm Master
          </div>

          <div
            className={`nav-item ${activeTab === 'Bank Master' ? 'active' : ''}`}
            onClick={() => setActiveTab('Bank Master')}
          >
            <Landmark size={18} />
            Bank Master
          </div>

          <div
            className={`nav-item ${activeTab === 'User Master' ? 'active' : ''}`}
            onClick={() => setActiveTab('User Master')}
          >
            <Users size={18} />
            User Master
          </div>

          <div
            className={`nav-item ${activeTab === 'Setting' ? 'active' : ''}`}
            onClick={() => setActiveTab('Setting')}
          >
            <Settings size={18} />
            Setting
          </div>

        </nav>

      </aside>

      <main
        style={{
          flex: 1,
          marginLeft: '260px',
          overflowY: 'auto',
          background: '#f8fafc'
        }}
      >

        <header className="luxury-header">

          <div
            style={{
              fontWeight: 'bold'
            }}
          >
            {activeTab.toUpperCase()}
          </div>

          <div
            style={{
              display: 'flex',
              gap: '25px',
              alignItems: 'center'
            }}
          >

            <div
              style={{
                background: '#fff',
                padding: '8px 14px',
                borderRadius: '8px'
              }}
            >

              <div
                style={{
                  fontSize: '12px',
                  fontWeight: '700',
                  color: '#0a192f'
                }}
              >
                {user?.email}
              </div>

              <div
                style={{
                  fontSize: '10px',
                  color: '#64748b'
                }}
              >
                Role : {userRole}
              </div>

            </div>

            <div
              style={{
                textAlign: 'right',
                borderRight: '1px solid #ddd',
                paddingRight: '15px'
              }}
            >

              <div
                style={{
                  fontSize: '13px',
                  fontWeight: '900',
                  color: '#fff'
                }}
              >
                {time.toLocaleTimeString()}
              </div>

              <div
                style={{
                  fontSize: '10px',
                  color: '#cbd5e1'
                }}
              >
                {time.toLocaleDateString()}
              </div>

            </div>

            <button
              className="btn-gold"
              style={{
                background: '#ffefef',
                color: 'red'
              }}
              onClick={() => signOut(auth)}
            >
              <LogOut size={16} />
            </button>

          </div>

        </header>

      </main>

    </div>

  );

}

function LoginScreen() {

  const [e, setE] = useState("");
  const [p, setP] = useState("");

  const h = (ev) => {

    ev.preventDefault();

    signInWithEmailAndPassword(
      auth,
      e,
      p
    ).catch(() => {

      alert("Login Failed");

    });

  };

  return (

    <div
      style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a192f'
      }}
    >

      <form
        onSubmit={h}
        style={{
          background: 'white',
          padding: '50px',
          borderRadius: '15px',
          width: '400px',
          borderTop: '5px solid #d4af37'
        }}
      >

        <h2
          style={{
            textAlign: 'center',
            color: '#0a192f'
          }}
        >
          BANKING PRO
        </h2>

        <input
          type="email"
          placeholder="Email"
          className="btn-gold"
          style={{
            width: '100%',
            marginBottom: '15px',
            background: '#f8fafc'
          }}
          onChange={v => setE(v.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="btn-gold"
          style={{
            width: '100%',
            marginBottom: '25px',
            background: '#f8fafc'
          }}
          onChange={v => setP(v.target.value)}
        />

        <button
          type="submit"
          className="btn-gold"
          style={{
            width: '100%'
          }}
        >
          LOG IN
        </button>

      </form>

    </div>

  );

}