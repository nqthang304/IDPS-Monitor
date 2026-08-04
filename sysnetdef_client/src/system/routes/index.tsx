import { createBrowserRouter, Navigate } from "react-router-dom";

//loaders
import { protected_loader, public_loader } from "@/application/loader/auth.loader";
import { idpsRulesLoader } from "@/features/modules/idps/services/loader/idpsGetRules.loader";

//pages
import Main from '@/application/layout/main/main';
import Login from '@/application/pages/login/Login';

// idps
import IdpsDashboard from "@/application/pages/idps/idpsDashboard/idpsDashboard";
import IdpsRulesManagement from "@/application/pages/idps/idpsRulesManagement/idpsRulesManangement";
import IdpsAnalyze from "@/application/pages/idps/idpsAnalyze/idpsAnalyze";

// management
import Logs from "@/application/pages/management/logsManagement/logs";
import Users from "@/application/pages/management/usersManagement/users";
import Profile from "@/application/pages/profile/profile";


export const router = createBrowserRouter([
    {
        path: "/login",
        element: <Login />,
        HydrateFallback: () => null,
        loader: public_loader
    },
    {
        path: "/",
        element: <Main />,
        HydrateFallback: () => null,
        loader: protected_loader,
        children: [
            // 1. CHUYỂN HƯỚNG MẶC ĐỊNH
            {
                index: true,
                // Khi vào "/" -> hất thẳng vào mục đầu tiên của Dashboard
                element: <Navigate to="dashboard" replace />
            },

            // 2. NHÓM DASHBOARD
            {
                path: "dashboard",
                element: <IdpsDashboard />
            },

            {
                path: "rules",
                element: <IdpsRulesManagement />,
                loader: idpsRulesLoader,
                errorElement: <div>Lỗi hệ thống!</div>
            },

            {
                path: "analyze", 
                element: <IdpsAnalyze />
            },

            // 6. Management
            {
                path: "management",
                children: [
                    {
                        index: true,
                        element: <Navigate to="logs" replace />
                    },
                    {
                        path: "logs",
                        element: <Logs />
                    },
                    {
                        path: "users",
                        element: <Users />
                    }
                ]
            },

            // 7. CÁC TRANG ĐỘC LẬP (Không nằm trong SubMenu)
            {
                path: "profile",
                element: <Profile />
            }
        ]
    }
]);