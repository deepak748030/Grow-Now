import React from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { store } from './store/store';
import LoginPage from './pages/auth/LoginPage';
import { DashboardLayout } from './components/layout/DashboardLayout';
import ProductsPage from './pages/products/ProductsPage';
import CategoriesPage from './pages/categories/CategoriesPage';
import SettingsPage from './pages/settings/SettingsPage';
import { useSelector } from 'react-redux';
import { RootState } from './store/store';
import DashboardPage from './pages/dashboard/DashboardPage';
import OrdersPage from './pages/orders/OrdersPage';
import SubscriptionPage from './pages/subscription/SubscriptionPage';
import DailyTipsPage from './pages/dailytips/DailyTipsPage';
import GoalPage from './pages/goal/GoalPage';
import CategoryChoice from './pages/categories/CategoryChoice';
import SubscriptionOrderPage from './pages/subscription/SubscriptionOrderPage';
import ProductOrdersPage from './pages/orders/ProductOrdersPage';
import FranchisePage from './pages/franchise/FranchisePage';
import UsersPage from './pages/users/UsersPage';
import DeliveryPartnerPage from './pages/deliver-partner/DeliveryPartnerPage';
import DeliveryAttendence from './pages/attendance/DeliveryAttendance';
import ManagersPage from './pages/manager/ManagerManagement';
import UnavailableLocationsPage from './pages/locations/UnavalableLocations';
import PayoutPage from './pages/payout/PayoutPage';
import DeliveryPartnerVerificationPage from './pages/deliver-partner/DeliveryPartnerVerification';
import ReviewsManagementPage from './pages/reviews/ReviewsManagementPage';
import BoxManagementPage from './pages/box/BoxInfoPage';
import TopCategoriesPage from './pages/categories/TopCategoriesPage';
import SubCategoriesPage from './pages/categories/SubCategoriesPage';
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
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<DashboardLayout />}>
              <Route index element={<DashboardPage />} />  {/* Default page for "/" */}
              <Route path="products" element={<ProductsPage />} />
              <Route path="top-categories" element={<TopCategoriesPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="categories" element={<CategoriesPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="subscriptions" element={<SubscriptionPage />} />
              <Route path="sub-categories" element={<SubCategoriesPage />} />
              <Route path="daily-tips" element={<DailyTipsPage />} />
              <Route path="goals" element={<GoalPage />} />
              <Route path="category-choice" element={<CategoryChoice />} />
              <Route path="subscription-order" element={<SubscriptionOrderPage />} />
              <Route path="product-orders" element={<ProductOrdersPage />} />
              <Route path="franchise" element={<FranchisePage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="delivery-partner" element={<DeliveryPartnerPage />} />
              <Route path="deliver-attendance" element={<DeliveryAttendence />} />
              <Route path="manager-management" element={<ManagersPage />} />
              <Route path="unavailable-locations" element={<UnavailableLocationsPage />} />
              <Route path="payout" element={<PayoutPage />} />
              <Route path="delivery-partner-verification" element={<DeliveryPartnerVerificationPage />} />
              <Route path="reviews" element={<ReviewsManagementPage />} />
              <Route path="box-info" element={<BoxManagementPage />} />
            </Route>


          </Routes>
        </Router>
      </ThemeWrapper>
    </Provider>
  );
}

export default App;
