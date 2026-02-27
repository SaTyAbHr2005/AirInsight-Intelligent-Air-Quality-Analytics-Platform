import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Prediction from './pages/Prediction';
import Trends from './pages/Trends';
import MapView from './pages/MapView';
import Simulator from './pages/Simulator';
import Home from './pages/Home';
import AdminLogin from './pages/AdminLogin';
import AdminRegister from './pages/AdminRegister';
import AdminDashboard from './pages/AdminDashboard';
import { useAppContext } from './context/AppContext';

const AppLayout = ({ children }) => {
    const { sidebarOpen } = useAppContext();

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-[#0b1120] transition-colors duration-300 w-full">
            <Sidebar />
            <div className={`flex flex-col flex-1 transition-all duration-300 overflow-hidden ${sidebarOpen ? 'md:ml-64 ml-20' : 'ml-20'}`}>
                <Navbar />
                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 w-full">
                    <div className="max-w-7xl mx-auto space-y-6">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated } = useAppContext();
    if (!isAuthenticated) return <Navigate to="/admin" replace />;
    return children;
};

function App() {
    return (
        <Router>
            <Routes>
                {/* Public Landing & Auth */}
                <Route path="/" element={<Home />} />
                <Route path="/admin" element={<AdminLogin />} />
                <Route path="/admin/register" element={<AdminRegister />} />

                {/* Protected Admin */}
                <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />

                {/* Public Application */}
                <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
                <Route path="/prediction" element={<AppLayout><Prediction /></AppLayout>} />
                <Route path="/trends" element={<AppLayout><Trends /></AppLayout>} />
                <Route path="/map" element={<AppLayout><MapView /></AppLayout>} />
                <Route path="/simulator" element={<AppLayout><Simulator /></AppLayout>} />

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}

export default App;
