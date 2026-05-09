import React, { useEffect, useState } from "react";
import "./App.css";
import { db } from "./firebase";

import {
  collection,
  addDoc,
  getDocs,
} from "firebase/firestore";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function App() {

  const [loggedIn, setLoggedIn] = useState(true);
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [time, setTime] = useState(new Date());

  const [firms, setFirms] = useState([]);
  const [banks, setBanks] = useState([]);
  const [users, setUsers] = useState([]);

  const [firmName, setFirmName] = useState("");
  const [gstNo, setGstNo] = useState("");
  const [officeAddress, setOfficeAddress] = useState("");

  const [bankName, setBankName] = useState("");
  const [branch, setBranch] = useState("");
  const [accountNo, setAccountNo] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [openingBalance, setOpeningBalance] = useState("");
  const [linkedFirm, setLinkedFirm] = useState("");

  const [userCode, setUserCode] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [role, setRole] = useState("Operator");

  const [selectedFirm, setSelectedFirm] = useState("All Firms");
  const [expandedBank, setExpandedBank] = useState(null);

  const [ledger] = useState([
    {
      id: 1,
      bankName: "SBI",
      accountNo: "65498798",
      date: "2026-05-01",
      opening: 100000,
      particular: "Cash Deposit",
      receipt: 50000,
      payment: 0,
      closing: 150000,
    },
    {
      id: 2,
      bankName: "SBI",
      accountNo: "65498798",
      date: "2026-05-02",
      opening: 150000,
      particular: "Cheque Payment",
      receipt: 0,
      payment: 25000,
      closing: 125000,
    },
    {
      id: 3,
      bankName: "HDFC LTD",
      accountNo: "132165464",
      date: "2026-05-03",
      opening: 100000,
      particular: "Online Receipt",
      receipt: 35000,
      payment: 0,
      closing: 135000,
    },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchFirms();
    fetchBanks();
    fetchUsers();
  }, []);

  const fetchFirms = async () => {
    const snapshot = await getDocs(collection(db, "firms"));

    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setFirms(data);
  };

  const fetchBanks = async () => {
    const snapshot = await getDocs(collection(db, "banks"));

    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setBanks(data);
  };

  const fetchUsers = async () => {
    const snapshot = await getDocs(collection(db, "users"));

    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setUsers(data);
  };

  const saveFirm = async () => {
    await addDoc(collection(db, "firms"), {
      firmName,
      gstNo,
      officeAddress,
      status: "ACTIVE",
    });

    setFirmName("");
    setGstNo("");
    setOfficeAddress("");

    fetchFirms();
  };

  const saveBank = async () => {
    await addDoc(collection(db, "banks"), {
      bankName,
      branch,
      accountNo,
      ifsc,
      openingBalance,
      linkedFirm,
      status: "ACTIVE",
    });

    setBankName("");
    setBranch("");
    setAccountNo("");
    setIfsc("");
    setOpeningBalance("");
    setLinkedFirm("");

    fetchBanks();
  };

  const saveUser = async () => {
    await addDoc(collection(db, "users"), {
      userCode,
      userName,
      userEmail,
      mobile,
      role,
      status: "ACTIVE",
    });

    setUserCode("");
    setUserName("");
    setUserEmail("");
    setMobile("");
    setRole("Operator");

    fetchUsers();
  };

  const filteredBanks =
    selectedFirm === "All Firms"
      ? banks
      : banks.filter(
          (item) => item.linkedFirm === selectedFirm
        );

  const exportPDF = (bank) => {

    const bankLedger = ledger.filter(
      (l) => l.bankName === bank.bankName
    );

    const doc = new jsPDF();

    doc.setFillColor(7, 23, 39);
    doc.rect(0, 0, 220, 35, "F");

    doc.setTextColor(255, 215, 0);
    doc.setFontSize(22);
    doc.text("BANK ACCOUNT LEDGER", 14, 18);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text(`Generated On : ${new Date().toLocaleString()}`, 14, 28);

    doc.setTextColor(0,0,0);

    doc.text(`Bank Name : ${bank.bankName}`,14,50);
    doc.text(`Account No : ${bank.accountNo}`,14,58);
    doc.text(`Firm Name : ${bank.linkedFirm}`,14,66);

    autoTable(doc, {
      startY: 80,
      head: [[
        "Date",
        "Opening",
        "Particular",
        "Receipt",
        "Payment",
        "Closing"
      ]],

      body: bankLedger.map((item)=>([
        item.date,
        item.opening,
        item.particular,
        item.receipt,
        item.payment,
        item.closing,
      ])),

      headStyles:{
        fillColor:[255,215,0],
        textColor:[0,0,0],
      },

      bodyStyles:{
        fillColor:[18,43,67],
        textColor:[255,255,255],
      },
    });

    doc.save(`${bank.bankName}_Ledger.pdf`);
  };

  const exportExcel = (bank) => {

    const bankLedger = ledger.filter(
      (l) => l.bankName === bank.bankName
    );

    const data = [
      ["BANK ACCOUNT LEDGER"],
      [],
      ["Generated On", new Date().toLocaleString()],
      ["Bank Name", bank.bankName],
      ["Account Number", bank.accountNo],
      ["Firm Name", bank.linkedFirm],
      [],
      [
        "Date",
        "Opening",
        "Particular",
        "Receipt",
        "Payment",
        "Closing",
      ],
    ];

    bankLedger.forEach((item) => {
      data.push([
        item.date,
        item.opening,
        item.particular,
        item.receipt,
        item.payment,
        item.closing,
      ]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(data);

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Ledger");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const fileData = new Blob([excelBuffer], {
      type:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });

    saveAs(fileData, `${bank.bankName}_Ledger.xlsx`);
  };

  return (
    <div className="main-container">
      <div className="sidebar">

        <div>

          <div className="logo-section">
            <h1>BANKING PRO</h1>
            <p>Executive Version 2.0</p>
          </div>

          <div className="menu-section">

            <button
              className={activeMenu === "dashboard" ? "active-btn" : ""}
              onClick={() => setActiveMenu("dashboard")}
            >
              Dashboard
            </button>

            <button
              className={activeMenu === "firm" ? "active-btn" : ""}
              onClick={() => setActiveMenu("firm")}
            >
              Firm Master
            </button>

            <button
              className={activeMenu === "bank" ? "active-btn" : ""}
              onClick={() => setActiveMenu("bank")}
            >
              Bank Master
            </button>

            <button
              className={activeMenu === "user" ? "active-btn" : ""}
              onClick={() => setActiveMenu("user")}
            >
              User Master
            </button>

            <button
              className={activeMenu === "setting" ? "active-btn" : ""}
              onClick={() => setActiveMenu("setting")}
            >
              Settings
            </button>

          </div>

        </div>

        <div className="branding">
          Developed By
          <br />
          <strong>SOFTVIEW TECHNOLOGIES</strong>
          <br />
          +91 7972084304
        </div>
      </div>

      <div className="content">

        <div className="header">

          <h2>Welcome To Banking Pro</h2>

          <div className="top-right">

            <div className="user-box">
              <div className="user-name">ADMIN USER</div>
              <div className="user-role">Administrator</div>
              <div className="clock">
                {time.toLocaleDateString()}
                <br />
                {time.toLocaleTimeString()}
              </div>
            </div>

            <button
              className="logout-btn"
              onClick={() => setLoggedIn(false)}
            >
              Logout
            </button>

          </div>

        </div>

        {/* DASHBOARD */}

        {activeMenu === "dashboard" && (
          <div className="card">

            <div className="top-bar">
              <h2>Dashboard</h2>

              <select
                value={selectedFirm}
                onChange={(e) => setSelectedFirm(e.target.value)}
              >
                <option>All Firms</option>

                {firms.map((item) => (
                  <option key={item.id} value={item.firmName}>
                    {item.firmName}
                  </option>
                ))}
              </select>
            </div>

            <table>
              <thead>
                <tr>
                  <th></th>
                  <th>Firm</th>
                  <th>Bank</th>
                  <th>Account No</th>
                  <th>Balance</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredBanks.map((item) => (
                  <React.Fragment key={item.id}>

                    <tr>
                      <td>
                        <button
                          className="expand-btn"
                          onClick={() =>
                            setExpandedBank(
                              expandedBank === item.bankName
                                ? null
                                : item.bankName
                            )
                          }
                        >
                          {expandedBank === item.bankName ? "▲" : "▼"}
                        </button>
                      </td>

                      <td>{item.linkedFirm}</td>
                      <td>{item.bankName}</td>
                      <td>{item.accountNo}</td>
                      <td>₹ {item.openingBalance}</td>
                      <td>{item.status}</td>
                    </tr>

                    {expandedBank === item.bankName && (
                      <tr>
                        <td colSpan="6">

                          <div className="ledger-box">

                            <div className="ledger-top">

                              <div className="ledger-buttons">
                                <button>Daily</button>
                                <button>Monthly</button>
                                <button>Period Wise</button>
                              </div>

                              <div className="export-buttons">
                                <button onClick={() => exportExcel(item)}>
                                  Export Excel
                                </button>

                                <button onClick={() => exportPDF(item)}>
                                  Export PDF
                                </button>
                              </div>
                            </div>

                            <table>
                              <thead>
                                <tr>
                                  <th>Date</th>
                                  <th>Opening</th>
                                  <th>Particular</th>
                                  <th>Receipt</th>
                                  <th>Payment</th>
                                  <th>Closing</th>
                                </tr>
                              </thead>

                              <tbody>
                                {ledger
                                  .filter((l) => l.bankName === item.bankName)
                                  .map((led) => (
                                    <tr key={led.id}>
                                      <td>{led.date}</td>
                                      <td>₹ {led.opening}</td>
                                      <td>{led.particular}</td>
                                      <td className="receipt">
                                        ↓ ₹ {led.receipt}
                                      </td>
                                      <td className="payment">
                                        ↑ ₹ {led.payment}
                                      </td>
                                      <td>₹ {led.closing}</td>
                                    </tr>
                                  ))}
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
    </div>
  );
}


// ========================== FINAL CORRECTED HEADER + LOGIC ==========================
// Replace ONLY your current header block and table action sections with these.
// This fixes:
// - Login user display
// - Date & live clock
// - Logout button
// - Developed by branding
// - Executive Version 2.0
// - Edit/Delete/Close logic
// - JSX closing tag errors

/* ================= HEADER ================= */

<header className="luxury-header">

  <div>
    <div style={{
      fontWeight: 'bold',
      fontSize: '18px',
      color: '#fff'
    }}>
      {activeTab.toUpperCase()}
    </div>
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
        textAlign: 'right',
        borderRight: '1px solid rgba(255,255,255,0.2)',
        paddingRight: '15px'
      }}
    >

      <div
        style={{
          fontSize: '12px',
          fontWeight: '700',
          color: '#ffffff'
        }}
      >
        Login User : {user?.email}
      </div>

      <div
        style={{
          fontSize: '13px',
          fontWeight: '900',
          color: '#d4af37'
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
      <LogOut size={16}/>
    </button>

  </div>

</header>

/* ================= SIDEBAR TOP ================= */

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
      color: '#94a3b8',
      marginTop: '5px',
      lineHeight: '16px'
    }}
  >
    Executive Version 2.0
  </p>

</div>

/* ================= SIDEBAR FOOTER ================= */

<div
  style={{
    padding: '20px',
    borderTop: '1px solid rgba(212,175,55,0.1)',
    color: '#cbd5e1',
    fontSize: '11px',
    lineHeight: '20px'
  }}
>

  <div
    style={{
      color: '#d4af37',
      fontWeight: 'bold',
      marginBottom: '5px'
    }}
  >
    Developed By
  </div>

  <div>
    SOFTVIEW TECHNOLOGIES
  </div>

  <div
    style={{
      color: '#d4af37',
      marginTop: '5px'
    }}
  >
    +91 7972084304
  </div>

</div>

/* ================= FIRM MASTER ACTIONS ================= */

<td style={{display:'flex', gap:'10px'}}>

  <Edit3
    size={16}
    color="#0a192f"
    style={{cursor:'pointer'}}
    onClick={() => setForm(f)}
  />

  <Trash2
    size={16}
    color="red"
    style={{cursor:'pointer'}}
    onClick={async () => {
      if(window.confirm("Delete Firm ?")){
        await deleteDoc(doc(db,"Firms",f.id))
      }
    }}
  />

  <button
    style={{
      background:'#0a192f',
      color:'#fff',
      border:'none',
      borderRadius:'5px',
      padding:'3px 10px',
      cursor:'pointer'
    }}
    onClick={async () => {
      await updateDoc(doc(db,"Firms",f.id),{
        status:'Closed',
        closedDate:new Date()
      })
    }}
  >
    Close
  </button>

</td>

/* ================= BANK MASTER ACTIONS ================= */

<td style={{display:'flex', gap:'10px'}}>

  <Edit3
    size={16}
    color="#0a192f"
    style={{cursor:'pointer'}}
    onClick={() => setForm(b)}
  />

  <Trash2
    size={16}
    color="red"
    style={{cursor:'pointer'}}
    onClick={async () => {
      if(window.confirm("Delete Bank ?")){
        await deleteDoc(doc(db,"Bank Master",b.id))
      }
    }}
  />

  <button
    style={{
      background:'#0a192f',
      color:'#fff',
      border:'none',
      borderRadius:'5px',
      padding:'3px 10px'
    }}
    onClick={async () => {
      await updateDoc(doc(db,"Bank Master",b.id),{
        status:'Closed',
        closedDate:new Date()
      })
    }}
  >
    Close
  </button>

</td>

/* ================= USER MASTER ACTIONS ================= */

<td style={{display:'flex', gap:'10px'}}>

  <Edit3
    size={16}
    color="#0a192f"
    style={{cursor:'pointer'}}
    onClick={() => setForm(u)}
  />

  <Trash2
    size={16}
    color="red"
    style={{cursor:'pointer'}}
    onClick={async () => {
      if(window.confirm("Delete User ?")){
        await deleteDoc(doc(db,"User Master",u.id))
      }
    }}
  />

  <button
    style={{
      background:'#0a192f',
      color:'#fff',
      border:'none',
      borderRadius:'5px',
      padding:'3px 10px'
    }}
    onClick={async () => {
      await updateDoc(doc(db,"User Master",u.id),{
        status:'Closed',
        closedDate:new Date()
      })
    }}
  >
    Close
  </button>

</td>

export default App;
