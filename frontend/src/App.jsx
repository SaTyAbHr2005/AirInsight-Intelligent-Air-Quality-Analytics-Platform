import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import Shell from './components/Shell';
import { useAppContext } from './context/AppContext';
import { Glyph } from './components/Wordmark';

const Story = lazy(() => import('./pages/Story'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Trends = lazy(() => import('./pages/Trends'));
const MapView = lazy(() => import('./pages/MapView'));
const Prediction = lazy(() => import('./pages/Prediction'));
const Simulator = lazy(() => import('./pages/Simulator'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const AdminRegister = lazy(() => import('./pages/AdminRegister'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

const Loading = () => (
    <div className="h-screen grid place-items-center bg-bg text-ink">
        <Glyph className="w-12 h-12 motion-safe:animate-pulse" />
    </div>
);

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated } = useAppContext();
    return isAuthenticated ? children : <Navigate to="/admin" replace />;
};

export default function App() {
    return (
        <Router>
            <Suspense fallback={<Loading />}>
                <Routes>
                    <Route path="/" element={<Story />} />
                    <Route path="/admin" element={<AdminLogin />} />
                    <Route path="/admin/register" element={<AdminRegister />} />
                    <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />

                    <Route element={<Shell />}>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/trends" element={<Trends />} />
                        <Route path="/map" element={<MapView />} />
                        <Route path="/prediction" element={<Prediction />} />
                        <Route path="/simulator" element={<ProtectedRoute><Simulator /></ProtectedRoute>} />
                    </Route>

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Suspense>
        </Router>
    );
}
