import { Navigate, RouterProvider as ReactRouterProvider, createBrowserRouter } from "react-router";
import LoginPage from "../pages/login";
import SignupPage from "../pages/signup";
import { AuthLayout } from "../layouts/auth.layout";
import DashboardPage from "../pages/dashboard";
import { ProtectedRoute } from "../components/auth/protected-route";

function RouterProvider() {
  return (
    <ReactRouterProvider
      router={createBrowserRouter([
        {
          path: "/",
          element: <Navigate to="/dashboard" replace />,
        },
        {
          path: "/",
          element: <AuthLayout />,
          children: [
            {
              path: "login",
              element: <LoginPage />,
            },
            {
              path: "signup",
              element: <SignupPage />,
            },
          ],
        },
        {
          path: "/dashboard",
          element: (
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          ),
        },
      ])}
    />
  );
}

export default RouterProvider;
