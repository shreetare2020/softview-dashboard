import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "firebase/auth";

import { auth } from "./firebase";

import Dashboard from "./pages/Dashboard";
import FirmMaster from "./pages/FirmMaster";
import BankMaster from "./pages/BankMaster";
import UserMaster from "./pages/UserMaster";
import Login from "./pages/Login";

function AppWrapper() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {!user ? (
          <Route path="*" element={<Login />} />
        ) : (
          <>
            <Route path="/" element={<Dashboard user={user} />} />
            <Route path="/firm" element={<FirmMaster />} />
            <Route path="/bank" element={<BankMaster />} />
            <Route path="/user" element={<UserMaster />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default AppWrapper;