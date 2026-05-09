// ============================ APP.JS ============================
// FULL PREMIUM BANKING PRO WITH FIREBASE + FIRM LINKING

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

  const [activeMenu, setActiveMenu] = useState("dashboard");

  // ================= CLOCK =================

  const [time, setTime] = useState(new Date());

  // ================= FIRM =================

  const [firmName, setFirmName] = useState("");
  const [gstNo, setGstNo] = useState("");
  const [officeAddress, setOfficeAddress] = useState("");

  const [firms, setFirms] = useState([]);

  // ================= BANK =================

  const [bankName, setBankName] = useState("");
  const [bankBranch, setBankBranch] = useState("");
  const [accountNo, setAccountNo] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [openingBalance, setOpeningBalance] = useState("");
  const [drcr, setDrcr] = useState("DR");

  const [linkedFirm, setLinkedFirm] = useState("");

  const [banks, setBanks] = useState([]);

  // ================= USER =================

  const [userCode, setUserCode] = useState("");
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [role, setRole] = useState("Admin");

  const [users, setUsers] = useState([]);

  // ================= FILTER =================

  const [selectedFirm, setSelectedFirm] =
    useState("All Firms");

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
            onClick={() => setLoggedIn(true)}
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

                  <th>Firm</th>

                  <th>Bank Name</th>

                  <th>Account No</th>

                  <th>Balance</th>

                  <th>Status</th>

                </tr>

              </thead>

              <tbody>

                {filteredBanks.map((item) => (

                  <tr key={item.id}>

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

                    <td>
                      {item.status}
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

        {/* FIRM MASTER */}

        {activeMenu === "firm" && (

          <div className="card">

            <h2>Firm Master</h2>

            <div className="grid">

              <input
                placeholder="Firm Name"
                value={firmName}
                onChange={(e) =>
                  setFirmName(
                    e.target.value
                  )
                }
              />

              <input
                placeholder="GST No"
                value={gstNo}
                onChange={(e) =>
                  setGstNo(
                    e.target.value
                  )
                }
              />

              <input
                placeholder="Office Address"
                value={officeAddress}
                onChange={(e) =>
                  setOfficeAddress(
                    e.target.value
                  )
                }
              />

            </div>

            <button onClick={saveFirm}>
              Save Firm
            </button>

            <table>

              <thead>

                <tr>

                  <th>Firm</th>

                  <th>GST</th>

                  <th>Address</th>

                  <th>Status</th>

                  <th>Action</th>

                </tr>

              </thead>

              <tbody>

                {firms.map((item) => (

                  <tr key={item.id}>

                    <td>
                      {item.firmName}
                    </td>

                    <td>
                      {item.gstNo}
                    </td>

                    <td>
                      {item.officeAddress}
                    </td>

                    <td>
                      {item.status}
                    </td>

                    <td>

                      <button
                        className="delete"
                        onClick={() =>
                          deleteFirm(
                            item.id
                          )
                        }
                      >
                        Delete
                      </button>

                      <button
                        className="close"
                        onClick={() =>
                          closeFirm(
                            item.id
                          )
                        }
                      >
                        Close
                      </button>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

        {/* BANK MASTER */}

        {activeMenu === "bank" && (

          <div className="card">

            <h2>Bank Master</h2>

            <div className="grid">

              <input
                placeholder="Bank Name"
                value={bankName}
                onChange={(e) =>
                  setBankName(
                    e.target.value
                  )
                }
              />

              <input
                placeholder="Branch"
                value={bankBranch}
                onChange={(e) =>
                  setBankBranch(
                    e.target.value
                  )
                }
              />

              <input
                placeholder="Account No"
                value={accountNo}
                onChange={(e) =>
                  setAccountNo(
                    e.target.value
                  )
                }
              />

              <input
                placeholder="IFSC"
                value={ifsc}
                onChange={(e) =>
                  setIfsc(
                    e.target.value
                  )
                }
              />

              <input
                placeholder="Opening Balance"
                value={openingBalance}
                onChange={(e) =>
                  setOpeningBalance(
                    e.target.value
                  )
                }
              />

              <select
                value={drcr}
                onChange={(e) =>
                  setDrcr(
                    e.target.value
                  )
                }
              >

                <option>DR</option>

                <option>CR</option>

              </select>

              {/* LINKED FIRM */}

              <select
                value={linkedFirm}
                onChange={(e) =>
                  setLinkedFirm(
                    e.target.value
                  )
                }
              >

                <option value="">
                  Select Firm
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

            <button onClick={saveBank}>
              Save Bank
            </button>

            <table>

              <thead>

                <tr>

                  <th>Firm</th>

                  <th>Bank</th>

                  <th>Branch</th>

                  <th>Account</th>

                  <th>Balance</th>

                  <th>Status</th>

                  <th>Action</th>

                </tr>

              </thead>

              <tbody>

                {banks.map((item) => (

                  <tr key={item.id}>

                    <td>
                      {item.linkedFirm}
                    </td>

                    <td>
                      {item.bankName}
                    </td>

                    <td>
                      {item.bankBranch}
                    </td>

                    <td>
                      {item.accountNo}
                    </td>

                    <td>
                      ₹ {item.openingBalance}
                    </td>

                    <td>
                      {item.status}
                    </td>

                    <td>

                      <button
                        className="delete"
                        onClick={() =>
                          deleteBank(
                            item.id
                          )
                        }
                      >
                        Delete
                      </button>

                      <button
                        className="close"
                        onClick={() =>
                          closeBank(
                            item.id
                          )
                        }
                      >
                        Close
                      </button>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

        {/* USER MASTER */}

        {activeMenu === "user" && (

          <div className="card">

            <h2>User Master</h2>

            <div className="grid">

              <input
                placeholder="User Code"
                value={userCode}
                onChange={(e) =>
                  setUserCode(
                    e.target.value
                  )
                }
              />

              <input
                placeholder="User Name"
                value={userName}
                onChange={(e) =>
                  setUserName(
                    e.target.value
                  )
                }
              />

              <input
                placeholder="Email"
                value={email}
                onChange={(e) =>
                  setEmail(
                    e.target.value
                  )
                }
              />

              <input
                placeholder="Mobile"
                value={mobile}
                onChange={(e) =>
                  setMobile(
                    e.target.value
                  )
                }
              />

              <select
                value={role}
                onChange={(e) =>
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

            </div>

            <button onClick={saveUser}>
              Save User
            </button>

            <table>

              <thead>

                <tr>

                  <th>User</th>

                  <th>Email</th>

                  <th>Mobile</th>

                  <th>Role</th>

                  <th>Action</th>

                </tr>

              </thead>

              <tbody>

                {users.map((item) => (

                  <tr key={item.id}>

                    <td>
                      {item.userName}
                    </td>

                    <td>
                      {item.email}
                    </td>

                    <td>
                      {item.mobile}
                    </td>

                    <td>
                      {item.role}
                    </td>

                    <td>

                      <button
                        className="delete"
                        onClick={() =>
                          deleteUser(
                            item.id
                          )
                        }
                      >
                        Delete
                      </button>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

        {/* SETTINGS */}

        {activeMenu === "setting" && (

          <div className="card">

            <h2>Settings</h2>

            <div className="grid">

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

            </div>

            <button>
              Change Password
            </button>

          </div>

        )}

      </div>

    </div>
  );
}

export default App;