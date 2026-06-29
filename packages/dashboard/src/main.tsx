import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "./hooks/useTheme";
import { AppShell } from "./ui/AppShell";
import { Login } from "./pages/Login";
import { Announcements } from "./pages/Announcements";
import { AnnouncementEditor } from "./pages/AnnouncementEditor";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<AppShell />}>
            <Route path="/" element={<Announcements />} />
            <Route path="/new" element={<AnnouncementEditor mode="new" />} />
            <Route path="/edit/:id" element={<AnnouncementEditor mode="edit" />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);
