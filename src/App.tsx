import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SyncStatus } from './components/SyncStatus';
import PrivateRoute from './components/PrivateRoute';
import AuthScreen from './components/auth/AuthScreen';
import Dashboard from './pages/Dashboard';
import MealCycle from './pages/MealCycle';
import Profile from './pages/Profile';
import History from './pages/History';
import MealSessions from './pages/MealSessions';
import TrackGlucose from './pages/TrackGlucose';
import BodyFatCalculator from './pages/BodyFatCalculator';
import BaselineProfile from './pages/BaselineProfile';
import NotFound from './pages/NotFound';
import Navigation from './components/Navigation';
import Login from './pages/Login';
import SignUp from './pages/SignUp';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <Navigation />
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            
            {/* Protected routes */}
            <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/history" element={<PrivateRoute><History /></PrivateRoute>} />
            <Route path="/sessions" element={<PrivateRoute><MealSessions /></PrivateRoute>} />
            <Route path="/track" element={<PrivateRoute><TrackGlucose /></PrivateRoute>} />
            <Route path="/body-fat" element={<PrivateRoute><BodyFatCalculator /></PrivateRoute>} />
            <Route path="/baseline" element={<PrivateRoute><BaselineProfile /></PrivateRoute>} />
            <Route path="/meal-cycle/:id" element={<PrivateRoute><MealCycle /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
            
            {/* Catch all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <SyncStatus />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
