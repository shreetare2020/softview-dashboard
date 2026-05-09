// ============================ APP.JS ============================

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

  // ================= LOGIN =================

  const [loggedIn, setLoggedIn] =
    useState(true);

  // ================= USER =================

  const [loginUser] =
    useState("ADMIN USER");

  const [userRole] =
    useState("Administrator");

  // ================= MENU =================

  const [activeMenu,
    setActiveMenu] =
    useState("dashboard");

  // ================= CLOCK =================

  const [time, setTime] =
    useState(new Date());

  // ================= FIRM =================

  const [firms, setFirms] =
    useState([]);

  const [firmName,
    setFirmName] =
    useState("");

  const [gstNo,
    setGstNo] =
    useState("");

  const [officeAddress,
    setOfficeAddress] =
    useState("");

  // ================= BANK =================

  const [banks, setBanks] =
    useState([]);

  const [bankName,
    setBankName] =
    useState("");

  const [branch,
    setBranch] =
    useState("");

  const [accountNo,
    setAccountNo] =
    useState("");

  const [ifsc,
    setIfsc] =
    useState("");

  const [openingBalance,
    setOpeningBalance] =
    useState("");

  const [drcr,
    setDrcr] =
    useState("DR");

  const [linkedFirm,
    setLinkedFirm] =
    useState("");

  // ================= USERS =================

  const [users, setUsers] =
    useState([]);

  const [userCode,
    setUserCode] =
    useState("");

  const [userName,
    setUserName] =
    useState("");

  const [userEmail,
    setUserEmail] =
    useState("");

  const [mobile,
    setMobile] =
    useState("");

  const [role,
    setRole] =
    useState("Operator");

  // ================= FILTER =================

  const [selectedFirm,
    setSelectedFirm] =
    useState("All Firms");

  const [expandedBank,
    setExpandedBank] =
    useState(null);

  // ================= LEDGER =================

  const [ledger] =
    useState([
      {
        id:1,
        bankName:"SBI",
        date:"2026-05-09",
        openingBalance:100000,
        particular:"Cash Deposit",
        receipt:50000,
        payment:0,
        closingBalance:150000
      },
      {
        id:2,
        bankName:"SBI",
        date:"2026-05-09",
        openingBalance:150000,
        particular:"Cheque Payment",
        receipt:0,
        payment:20000,
        closingBalance:130000
      }
    ]);

  // ================= CLOCK =================

  useEffect(() => {

    const interval =
      setInterval(() => {

        setTime(new Date());

      },1000);

    return () =>
      clearInterval(interval);

  }, []);

  // ================= FETCH =================

  useEffect(() => {

    fetchFirms();
    fetchBanks();
    fetchUsers();

  }, []);

  // ================= FETCH FIRMS =================

  const fetchFirms = async () => {

    const snapshot =
      await getDocs(
        collection(db,"firms")
      );

    const data =
      snapshot.docs.map((doc)=>({

        id:doc.id,
        ...doc.data()

      }));

    setFirms(data);
  };

  // ================= FETCH BANKS =================

  const fetchBanks = async () => {

    const snapshot =
      await getDocs(
        collection(db,"banks")
      );

    const data =
      snapshot.docs.map((doc)=>({

        id:doc.id,
        ...doc.data()

      }));

    setBanks(data);
  };

  // ================= FETCH USERS =================

  const fetchUsers = async () => {

    const snapshot =
      await getDocs(
        collection(db,"users")
      );

    const data =
      snapshot.docs.map((doc)=>({

        id:doc.id,
        ...doc.data()

      }));

    setUsers(data);
  };

  // ================= SAVE FIRM =================

  const saveFirm = async () => {

    await addDoc(
      collection(db,"firms"),
      {
        firmName,
        gstNo,
        officeAddress,
      }
    );

    setFirmName("");
    setGstNo("");
    setOfficeAddress("");

    fetchFirms();

    alert("Firm Saved");
  };

  // ================= SAVE BANK =================

  const saveBank = async () => {

    await addDoc(
      collection(db,"banks"),
      {
        bankName,
        branch,
        accountNo,
        ifsc,
        openingBalance,
        drcr,
        linkedFirm,
      }
    );

    setBankName("");
    setBranch("");
    setAccountNo("");
    setIfsc("");
    setOpeningBalance("");
    setDrcr("DR");
    setLinkedFirm("");

    fetchBanks();

    alert("Bank Saved");
  };

  // ================= SAVE USER =================

  const saveUser = async () => {

    await addDoc(
      collection(db,"users"),
      {
        userCode,
        userName,
        userEmail,
        mobile,
        role,
      }
    );

    setUserCode("");
    setUserName("");
    setUserEmail("");
    setMobile("");
    setRole("Operator");

    fetchUsers();

    alert("User Saved");
  };

  // ================= FILTER BANK =================

  const filteredBanks =
    selectedFirm === "All Firms"
    ? banks
    : banks.filter(
      (item)=>
      item.linkedFirm ===
      selectedFirm
    );

  // ================= EXPORT EXCEL =================

  const exportExcel = () => {

    const worksheet =
      XLSX.utils.json_to_sheet(
        ledger
      );

    const workbook =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Ledger"
    );

    const excelBuffer =
      XLSX.write(workbook,{
        bookType:"xlsx",
        type:"array"
      });

    const fileData =
      new Blob(
        [excelBuffer],
        {
          type:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8"
        }
      );

    saveAs(
      fileData,
      "BankLedger.xlsx"
    );
  };

  // ================= EXPORT PDF =================

  const exportPDF = () => {

    const doc =
      new jsPDF();

    doc.setFontSize(18);

    doc.text(
      "BANK LEDGER REPORT",
      14,
      20
    );

    autoTable(doc,{

      startY:30,

      head:[[
        "Date",
        "Opening",
        "Particular",
        "Receipt",
        "Payment",
        "Closing"
      ]],

      body:ledger.map((item)=>[
        item.date,
        item.openingBalance,
        item.particular,
        item.receipt,
        item.payment,
        item.closingBalance
      ]),

      headStyles:{
        fillColor:[255,215,0],
        textColor:[0,0,0]
      },

      bodyStyles:{
        fillColor:[17,38,59],
        textColor:[255,255,255]
      }

    });

    doc.save("Ledger.pdf");
  };

  // ================= LOGIN PAGE =================

  if(!loggedIn){

    return(

      <div className="login-page">

        <div className="login-card">

          <h1>BANKING PRO</h1>

          <h3>
            Executive Version 2.0
          </h3>

          <input
            type="text"
            placeholder="Login ID"
          />

          <input
            type="password"
            placeholder="Password"
          />

          <button
            onClick={()=>
              setLoggedIn(true)
            }
          >
            LOGIN
          </button>

          <div className="dev-text">

            Developed By
            <br />

            <span>
              SOFTVIEW TECHNOLOGIES
            </span>

            <br />

            +91 7972084304

          </div>

        </div>

      </div>
    );
  }

  // ================= MAIN =================

  return(

    <div className="main-container">

      {/* ================= SIDEBAR ================= */}

      <div className="sidebar">

        <div>

          <div className="logo-section">

            <h1>
              BANKING PRO
            </h1>

            <p>
              Executive Version 2.0
            </p>

          </div>

          <div className="menu-section">

            <button
              className={
                activeMenu==="dashboard"
                ? "active-btn"
                : ""
              }
              onClick={()=>
                setActiveMenu(
                  "dashboard"
                )
              }
            >
              Dashboard
            </button>

            <button
              className={
                activeMenu==="firm"
                ? "active-btn"
                : ""
              }
              onClick={()=>
                setActiveMenu(
                  "firm"
                )
              }
            >
              Firm Master
            </button>

            <button
              className={
                activeMenu==="bank"
                ? "active-btn"
                : ""
              }
              onClick={()=>
                setActiveMenu(
                  "bank"
                )
              }
            >
              Bank Master
            </button>

            <button
              className={
                activeMenu==="user"
                ? "active-btn"
                : ""
              }
              onClick={()=>
                setActiveMenu(
                  "user"
                )
              }
            >
              User Master
            </button>

            <button
              className={
                activeMenu==="setting"
                ? "active-btn"
                : ""
              }
              onClick={()=>
                setActiveMenu(
                  "setting"
                )
              }
            >
              Settings
            </button>

          </div>

        </div>

        <div className="branding">

          Developed By
          <br />

          <strong>
            SOFTVIEW TECHNOLOGIES
          </strong>

          <br />

          +91 7972084304

        </div>

      </div>

      {/* ================= CONTENT ================= */}

      <div className="content">

        {/* ================= HEADER ================= */}

        <div className="header">

          <h2>
            Welcome To Banking Pro
          </h2>

          <div className="top-right">

            <div className="user-box">

              <div className="user-name">
                {loginUser}
              </div>

              <div className="user-role">
                {userRole}
              </div>

              <div className="clock">
                {time.toLocaleDateString()}
                <br />
                {time.toLocaleTimeString()}
              </div>

            </div>

            <button
              className="logout-btn"
              onClick={()=>
                setLoggedIn(false)
              }
            >
              Logout
            </button>

          </div>

        </div>

        {/* ================= DASHBOARD ================= */}

        {activeMenu==="dashboard" && (

          <div className="card">

            <div className="top-bar">

              <h2>
                Dashboard
              </h2>

              <select
                value={selectedFirm}
                onChange={(e)=>
                  setSelectedFirm(
                    e.target.value
                  )
                }
              >

                <option>
                  All Firms
                </option>

                {firms.map((item)=>(

                  <option
                    key={item.id}
                    value={item.firmName}
                  >
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

                </tr>

              </thead>

              <tbody>

                {filteredBanks.map((item)=>(

                  <React.Fragment
                    key={item.id}
                  >

                    <tr>

                      <td>

                        <button
                          className="expand-btn"
                          onClick={()=>
                            setExpandedBank(
                              expandedBank ===
                              item.bankName
                              ? null
                              : item.bankName
                            )
                          }
                        >

                          {expandedBank ===
                          item.bankName
                          ? "▲"
                          : "▼"}

                        </button>

                      </td>

                      <td>
                        {item.linkedFirm}
                      </td>

                      <td>
                        {item.bankName}
                      </td>

                      <td>
                        {item.accountNo}
                      </td>

                      <td>
                        ₹ {item.openingBalance}
                      </td>

                    </tr>

                    {expandedBank ===
                    item.bankName && (

                      <tr>

                        <td colSpan="5">

                          <div className="ledger-box">

                            <div className="ledger-top">

                              <div className="ledger-buttons">

                                <button>
                                  Daily
                                </button>

                                <button>
                                  Monthly
                                </button>

                                <button>
                                  Period Wise
                                </button>

                              </div>

                              <div className="export-buttons">

                                <button
                                  onClick={
                                    exportExcel
                                  }
                                >
                                  Export Excel
                                </button>

                                <button
                                  onClick={
                                    exportPDF
                                  }
                                >
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
                                .filter(
                                  (l)=>
                                  l.bankName===
                                  item.bankName
                                )
                                .map((led)=>(

                                  <tr
                                    key={led.id}
                                  >

                                    <td>
                                      {led.date}
                                    </td>

                                    <td>
                                      ₹
                                      {
                                        led.openingBalance
                                      }
                                    </td>

                                    <td>
                                      {
                                        led.particular
                                      }
                                    </td>

                                    <td className="receipt">
                                      ↓ ₹
                                      {
                                        led.receipt
                                      }
                                    </td>

                                    <td className="payment">
                                      ↑ ₹
                                      {
                                        led.payment
                                      }
                                    </td>

                                    <td>
                                      ₹
                                      {
                                        led.closingBalance
                                      }
                                    </td>

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

        {/* ================= FIRM MASTER ================= */}

        {activeMenu==="firm" && (

          <div className="card">

            <h2>
              Firm Master
            </h2>

            <div className="form-grid">

              <input
                type="text"
                placeholder="Firm Name"
                value={firmName}
                onChange={(e)=>
                  setFirmName(
                    e.target.value
                  )
                }
              />

              <input
                type="text"
                placeholder="GST No"
                value={gstNo}
                onChange={(e)=>
                  setGstNo(
                    e.target.value
                  )
                }
              />

              <input
                type="text"
                placeholder="Office Address"
                value={officeAddress}
                onChange={(e)=>
                  setOfficeAddress(
                    e.target.value
                  )
                }
              />

              <button
                onClick={saveFirm}
              >
                Save Firm
              </button>

            </div>

            <table>

              <thead>

                <tr>

                  <th>Firm</th>

                  <th>GST</th>

                  <th>Address</th>

                </tr>

              </thead>

              <tbody>

                {firms.map((item)=>(

                  <tr
                    key={item.id}
                  >

                    <td>
                      {item.firmName}
                    </td>

                    <td>
                      {item.gstNo}
                    </td>

                    <td>
                      {
                        item.officeAddress
                      }
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

        {/* ================= BANK MASTER ================= */}

        {activeMenu==="bank" && (

          <div className="card">

            <h2>
              Bank Master
            </h2>

            <div className="form-grid">

              <input
                type="text"
                placeholder="Bank Name"
                value={bankName}
                onChange={(e)=>
                  setBankName(
                    e.target.value
                  )
                }
              />

              <input
                type="text"
                placeholder="Branch"
                value={branch}
                onChange={(e)=>
                  setBranch(
                    e.target.value
                  )
                }
              />

              <input
                type="text"
                placeholder="Account No"
                value={accountNo}
                onChange={(e)=>
                  setAccountNo(
                    e.target.value
                  )
                }
              />

              <input
                type="text"
                placeholder="IFSC"
                value={ifsc}
                onChange={(e)=>
                  setIfsc(
                    e.target.value
                  )
                }
              />

              <input
                type="number"
                placeholder="Opening Balance"
                value={openingBalance}
                onChange={(e)=>
                  setOpeningBalance(
                    e.target.value
                  )
                }
              />

              <select
                value={drcr}
                onChange={(e)=>
                  setDrcr(
                    e.target.value
                  )
                }
              >

                <option>
                  DR
                </option>

                <option>
                  CR
                </option>

              </select>

              <select
                value={linkedFirm}
                onChange={(e)=>
                  setLinkedFirm(
                    e.target.value
                  )
                }
              >

                <option value="">
                  Select Firm
                </option>

                {firms.map((item)=>(

                  <option
                    key={item.id}
                    value={item.firmName}
                  >
                    {item.firmName}
                  </option>

                ))}

              </select>

              <button
                onClick={saveBank}
              >
                Save Bank
              </button>

            </div>

            <table>

              <thead>

                <tr>

                  <th>Firm</th>

                  <th>Bank</th>

                  <th>Branch</th>

                  <th>Account</th>

                  <th>IFSC</th>

                  <th>Balance</th>

                </tr>

              </thead>

              <tbody>

                {banks.map((item)=>(

                  <tr
                    key={item.id}
                  >

                    <td>
                      {
                        item.linkedFirm
                      }
                    </td>

                    <td>
                      {
                        item.bankName
                      }
                    </td>

                    <td>
                      {item.branch}
                    </td>

                    <td>
                      {
                        item.accountNo
                      }
                    </td>

                    <td>
                      {item.ifsc}
                    </td>

                    <td>
                      ₹
                      {
                        item.openingBalance
                      }
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

        {/* ================= USER MASTER ================= */}

        {activeMenu==="user" && (

          <div className="card">

            <h2>
              User Master
            </h2>

            <div className="form-grid">

              <input
                type="text"
                placeholder="User Code"
                value={userCode}
                onChange={(e)=>
                  setUserCode(
                    e.target.value
                  )
                }
              />

              <input
                type="text"
                placeholder="User Name"
                value={userName}
                onChange={(e)=>
                  setUserName(
                    e.target.value
                  )
                }
              />

              <input
                type="email"
                placeholder="User Email"
                value={userEmail}
                onChange={(e)=>
                  setUserEmail(
                    e.target.value
                  )
                }
              />

              <input
                type="text"
                placeholder="Mobile"
                value={mobile}
                onChange={(e)=>
                  setMobile(
                    e.target.value
                  )
                }
              />

              <select
                value={role}
                onChange={(e)=>
                  setRole(
                    e.target.value
                  )
                }
              >

                <option>
                  Admin
                </option>

                <option>
                  Operator
                </option>

                <option>
                  Viewer
                </option>

              </select>

              <button
                onClick={saveUser}
              >
                Save User
              </button>

            </div>

            <table>

              <thead>

                <tr>

                  <th>Code</th>

                  <th>Name</th>

                  <th>Email</th>

                  <th>Mobile</th>

                  <th>Role</th>

                </tr>

              </thead>

              <tbody>

                {users.map((item)=>(

                  <tr
                    key={item.id}
                  >

                    <td>
                      {item.userCode}
                    </td>

                    <td>
                      {item.userName}
                    </td>

                    <td>
                      {item.userEmail}
                    </td>

                    <td>
                      {item.mobile}
                    </td>

                    <td>
                      {item.role}
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

        {/* ================= SETTINGS ================= */}

        {activeMenu==="setting" && (

          <div className="card">

            <h2>
              Settings
            </h2>

            <div className="form-grid">

              <input
                type="password"
                placeholder="Old Password"
              />

              <input
                type="password"
                placeholder="New Password"
              />

              <input
                type="password"
                placeholder="Confirm Password"
              />

              <button>
                Change Password
              </button>

            </div>

          </div>

        )}

      </div>

    </div>
  );
}

export default App;