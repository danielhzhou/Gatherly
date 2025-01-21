import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { SignIn, SignUp, SignedIn, SignedOut, useAuth, OrganizationSwitcher } from '@clerk/clerk-react';
import Calendar from './Components/Calendar';
import './App.css';

function PrivateRoute({ children }) {
  const { isSignedIn, isLoaded } = useAuth();
  
  if (!isLoaded) {
    return <div className="loading-state">Loading...</div>;
  }
  
  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />;
  }
  
  return children;
}

function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">Gatherly</h1>
          <SignedIn>
            <div className="header-controls">
              <OrganizationSwitcher 
                afterCreateOrganizationUrl="/"
                afterLeaveOrganizationUrl="/sign-in"
                afterSelectOrganizationUrl="/"
                createOrganizationMode="modal"
                appearance={{
                  elements: {
                    rootBox: {
                      width: '100%',
                      maxWidth: '300px',
                    },
                    organizationSwitcherTrigger: {
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-dark)',
                      backgroundColor: 'var(--secondary-dark)',
                      color: 'var(--text-dark)',
                      fontSize: '1rem',
                      '&:hover': {
                        backgroundColor: 'var(--primary-dark)',
                        borderColor: 'var(--primary-dark)',
                      },
                    }
                  }
                }}
              />
            </div>
          </SignedIn>
        </div>
      </header>
      <main>
        <Routes>
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Calendar />
              </PrivateRoute>
            }
          />
          <Route
            path="/sign-in/*"
            element={
              <SignedOut>
                <div className="auth-container">
                  <SignIn 
                    routing="path" 
                    path="/sign-in" 
                    redirectUrl="/"
                    appearance={{
                      elements: {
                        rootBox: {
                          margin: '0 auto',
                        },
                        card: {
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                        }
                      }
                    }}
                  />
                </div>
              </SignedOut>
            }
          />
          <Route
            path="/sign-up/*"
            element={
              <SignedOut>
                <div className="auth-container">
                  <SignUp 
                    routing="path" 
                    path="/sign-up" 
                    redirectUrl="/"
                    appearance={{
                      elements: {
                        rootBox: {
                          margin: '0 auto',
                        },
                        card: {
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                        }
                      }
                    }}
                  />
                </div>
              </SignedOut>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
