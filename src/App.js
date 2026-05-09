// ============================ APP.JS ============================
// FULL PREMIUM BANKING PRO WITH FIREBASE + LEDGER EXPAND

import React, { useEffect, useState } from "react";
import "./App.css";

import { db } from "./firebase";

import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";

function App() {

  // ================= LOGIN =================

  const [loggedIn, setLoggedIn] = useState(false);

  // ================= MENU =================

  const [activeMenu, setActiveMenu] =
    useState("dashboard");

  // ================= CLOCK =================

  const [time, setTime] =
    useState(new Date());

  // ================= FIRMS =================

  const [firmName, setFirmName] =
    useState("");

  const [gstNo, setGstNo] =
    useState("");

  const [officeAddress, setOfficeAddress] =
    useState("");

  const [firms, setFirms] =
    useState([]);

  // ================= BANKS =================

  const [bankName, setBankName] =
    useState("");

  const [bankBranch, setBankBranch] =
    useState("");

  const [accountNo, setAccountNo] =
    useState("");

  const [ifsc, setIfsc] =
    useState("");

  const [openingBalance, setOpeningBalance] =
    useState("");

  const [drcr, setDrcr] =
    useState("DR");

  const [linkedFirm, setLinkedFirm] =
    useState("");

  const [banks, setBanks] =
    useState([]);

  // ================= USERS =================

  const [userCode, setUserCode] =
    useState("");

  const [userName, setUserName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [mobile, setMobile] =
    useState("");

  const [role, setRole] =
    useState("Admin");

  const [users, setUsers] =
    useState([]);

  // ================= LEDGER =================

  const [ledger, setLedger] =
    useState([]);

  // ================= FILTER =================

  const [selectedFirm, setSelectedFirm] =
    useState("All Firms");

  // ================= LEDGER FILTER =================

  const [expandedBank, setExpandedBank] =
    useState(null);

  const [ledgerFilter, setLedgerFilter] =
    useState("daily");

  const [fromDate, setFromDate] =
    useState("");

  const [toDate, setToDate] =
    useState("");

  // ================= CLOCK =================

  useEffect(() => {

    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);

  }, []);

  // ================= FETCH =================

  useEffect(() => {

    fetchFirms();
    fetchBanks();
    fetchUsers();
    fetchLedger();

  }, []);

  // ================= FETCH FIRMS =================

  const fetchFirms = async () => {

    const snapshot = await getDocs(
      collection(db, "firms")
    );

    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setFirms(data);
  };

  // ================= FETCH BANKS =================

  const fetchBanks = async () => {

    const snapshot = await getDocs(
      collection(db, "banks")
    );

    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setBanks(data);
  };

  // ================= FETCH USERS =================

  const fetchUsers = async () => {

    const snapshot = await getDocs(
      collection(db, "users")
    );

    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setUsers(data);
  };

  // ================= FETCH LEDGER =================

  const fetchLedger = async () => {

    const snapshot = await getDocs(
      collection(db, "ledger")
    );

    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setLedger(data);
  };

  // ================= SAVE FIRM =================

  const saveFirm = async () => {

    if (!firmName)
      return alert("Enter Firm Name");

    await addDoc(collection(db, "firms"), {
      firmName,
      gstNo,
      officeAddress,
      status: "ACTIVE",
      closeDate: "",
    });

    setFirmName("");
    setGstNo("");
    setOfficeAddress("");

    fetchFirms();

    alert("Firm Saved");
  };

  // ================= SAVE BANK =================

  const saveBank = async () => {

    if (!bankName)
      return alert("Enter Bank Name");

    await addDoc(collection(db, "banks"), {
      bankName,
      bankBranch,
      accountNo,
      ifsc,
      openingBalance,
      drcr,
      linkedFirm,
      status: "ACTIVE",
      closeDate: "",
    });

    setBankName("");
    setBankBranch("");
    setAccountNo("");
    setIfsc("");
    setOpeningBalance("");
    setLinkedFirm("");

    fetchBanks();

    alert("Bank Saved");
  };

  // ================= SAVE USER =================

  const saveUser = async () => {

    await addDoc(collection(db, "users"), {
      userCode,
      userName,
      email,
      mobile,
      role,
      status: "ACTIVE",
    });

    setUserCode("");
    setUserName("");
    setEmail("");
    setMobile("");

    fetchUsers();

    alert("User Saved");
  };

  // ================= DELETE =================

  const deleteFirm = async (id) => {

    await deleteDoc(doc(db, "firms", id));

    fetchFirms();
  };

  const deleteBank = async (id) => {

    await deleteDoc(doc(db, "banks", id));

    fetchBanks();
  };

  const deleteUser = async (id) => {

    await deleteDoc(doc(db, "users", id));

    fetchUsers();
  };

  // ================= CLOSE =================

  const closeFirm = async (id) => {

    await updateDoc(doc(db, "firms", id), {
      status: "CLOSED",
      closeDate:
        new Date().toLocaleDateString(),
    });

    fetchFirms();
  };

  const closeBank = async (id) => {

    await updateDoc(doc(db, "banks", id), {
      status: "CLOSED",
      closeDate:
        new Date().toLocaleDateString(),
    });

    fetchBanks();
  };

  // ================= FILTERED BANKS =================

  const filteredBanks =
    selectedFirm === "All Firms"
      ? banks
      : banks.filter(
          (item) =>
            item.linkedFirm === selectedFirm
        );

  // ================= FILTER LEDGER =================

  const getFilteredLedger = (bankName) => {

    const today = new Date();

    return ledger.filter((item) => {

      if (item.bankName !== bankName)
        return false;

      const itemDate =
        new Date(item.date);

      if (ledgerFilter === "daily") {

        return (
          itemDate.toDateString() ===
          today.toDateString()
        );
      }

      if (ledgerFilter === "monthly") {

        return (
          itemDate.getMonth() ===
            today.getMonth() &&
          itemDate.getFullYear() ===
            today.getFullYear()
        );
      }

      if (
        ledgerFilter === "period" &&
        fromDate &&
        toDate
      ) {

        return (
          itemDate >= new Date(fromDate) &&
          itemDate <= new Date(toDate)
        );
      }

      return true;
    });
  };

  // ================= LOGIN PAGE =================

  if (!loggedIn) {

    return (

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
            onClick={() =>
              setLoggedIn(true)
            }
          >
            LOGIN
          </button>

          <div className="developer">

            Developed By
            <br />

            SOFTVIEW TECHNOLOGIES
            <br />

            +91 7972084304

          </div>

        </div>

      </div>
    );
  }

  // ================= MAIN PAGE =================

  return (

    <div className="main-container">

      {/* SIDEBAR */}

      <div className="sidebar">

        <div>

          <div className="logo">

            <h1>BANKING PRO</h1>

            <p>
              Executive Version 2.0
            </p>

          </div>

          <button
            onClick={() =>
              setActiveMenu("dashboard")
            }
          >
            Dashboard
          </button>

          <button
            onClick={() =>
              setActiveMenu("firm")
            }
          >
            Firm Master
          </button>

          <button
            onClick={() =>
              setActiveMenu("bank")
            }
          >
            Bank Master
          </button>

          <button
            onClick={() =>
              setActiveMenu("user")
            }
          >
            User Master
          </button>

          <button
            onClick={() =>
              setActiveMenu("setting")
            }
          >
            Settings
          </button>

        </div>

        <div className="branding">

          Developed By
          <br />

          SOFTVIEW TECHNOLOGIES
          <br />

          +91 7972084304

        </div>

      </div>

      {/* CONTENT */}

      <div className="content">

        {/* HEADER */}

        <div className="header">

          <div className="welcome">
            Welcome To Banking Pro
          </div>

          <div className="right-header">

            <div className="clock">

              Admin User
              <br />

              {time.toLocaleDateString()}
              <br />

              {time.toLocaleTimeString()}

            </div>

            <button
              className="logout-btn"
              onClick={() =>
                setLoggedIn(false)
              }
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
                onChange={(e) =>
                  setSelectedFirm(
                    e.target.value
                  )
                }
              >

                <option>
                  All Firms
                </option>

                {firms
                  .filter(
                    (item) =>
                      item.status ===
                      "ACTIVE"
                  )
                  .map((item) => (

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

                  <th>Bank Name</th>

                  <th>Account No</th>

                  <th>Closing Balance</th>

                  <th>Status</th>

                </tr>

              </thead>

              <tbody>

                {filteredBanks.map((item) => (

                  <React.Fragment
                    key={item.id}
                  >

                    {/* BANK ROW */}

                    <tr>

                      <td>

                        <button
                          className="expand-btn"
                          onClick={() =>
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
                        ₹{" "}
                        {item.openingBalance}
                      </td>

                      <td>
                        {item.status}
                      </td>

                    </tr>

                    {/* LEDGER */}

                    {expandedBank ===
                      item.bankName && (

                      <tr>

                        <td colSpan="6">

                          <div className="ledger-box">

                            {/* FILTERS */}

                            <div className="ledger-top">

                              <div className="ledger-buttons">

                                <button
                                  className={
                                    ledgerFilter ===
                                    "daily"
                                      ? "active-filter"
                                      : ""
                                  }
                                  onClick={() =>
                                    setLedgerFilter(
                                      "daily"
                                    )
                                  }
                                >
                                  Daily
                                </button>

                                <button
                                  className={
                                    ledgerFilter ===
                                    "monthly"
                                      ? "active-filter"
                                      : ""
                                  }
                                  onClick={() =>
                                    setLedgerFilter(
                                      "monthly"
                                    )
                                  }
                                >
                                  Monthly
                                </button>

                                <button
                                  className={
                                    ledgerFilter ===
                                    "period"
                                      ? "active-filter"
                                      : ""
                                  }
                                  onClick={() =>
                                    setLedgerFilter(
                                      "period"
                                    )
                                  }
                                >
                                  Period Wise
                                </button>

                              </div>

                              {ledgerFilter ===
                                "period" && (

                                <div className="date-filter">

                                  <input
                                    type="date"
                                    value={fromDate}
                                    onChange={(e) =>
                                      setFromDate(
                                        e.target.value
                                      )
                                    }
                                  />

                                  <input
                                    type="date"
                                    value={toDate}
                                    onChange={(e) =>
                                      setToDate(
                                        e.target.value
                                      )
                                    }
                                  />

                                </div>

                              )}

                            </div>

                            {/* LEDGER TABLE */}

                            <table className="ledger-table">

                              <thead>

                                <tr>

                                  <th>
                                    Date
                                  </th>

                                  <th>
                                    Opening Balance
                                  </th>

                                  <th>
                                    Particular
                                  </th>

                                  <th>
                                    Receipt
                                  </th>

                                  <th>
                                    Payment
                                  </th>

                                  <th>
                                    Closing Balance
                                  </th>

                                </tr>

                              </thead>

                              <tbody>

                                {getFilteredLedger(
                                  item.bankName
                                ).map(
                                  (led) => (

                                    <tr
                                      key={
                                        led.id
                                      }
                                    >

                                      <td>
                                        {
                                          led.date
                                        }
                                      </td>

                                      <td>
                                        ₹{" "}
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

                                        ↓ ₹{" "}
                                        {
                                          led.receipt
                                        }

                                      </td>

                                      <td className="payment">

                                        ↑ ₹{" "}
                                        {
                                          led.payment
                                        }

                                      </td>

                                      <td>

                                        ₹{" "}
                                        {
                                          led.closingBalance
                                        }

                                      </td>

                                    </tr>

                                  )
                                )}

                              </tbody>

                            </table>

                            {/* EXPORT */}

                            <div className="export-buttons">

                              <button>
                                Export Excel
                              </button>

                              <button>
                                Export PDF
                              </button>

                            </div>

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

export default App;