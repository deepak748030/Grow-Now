import React from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { store } from './store/store';
import LoginPage from './pages/auth/LoginPage';
import { DashboardLayout } from './components/layout/DashboardLayout';
import ProductsPage from './pages/products/ProductsPage';
import { useSelector } from 'react-redux';
import { RootState } from './store/store';

// Theme wrapper component
function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);

  React.useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return <>{children}</>;
}

function App() {




  return (
    <Provider store={store}>
      <ThemeWrapper>
        <Router>
          <Routes>
            <Route path="/vendor-auth" element={<LoginPage />} />
            <Route path="/" element={<DashboardLayout />}>
              <Route index element={<ProductsPage />} />  {/* Default page for "/" */}


            </Route>


          </Routes>
        </Router>
      </ThemeWrapper>
    </Provider>
  );
}

export default App;
