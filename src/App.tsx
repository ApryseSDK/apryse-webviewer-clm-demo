import { Refine } from "@refinedev/core";
import {
  ErrorComponent,
  ThemedLayout,
  ThemedSider,
  ThemedTitle,
  useNotificationProvider,
} from "@refinedev/antd";
import "@refinedev/antd/dist/reset.css";

import {
  ContainerOutlined,
  FileOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { App as AntdApp } from "antd";
import { BrowserRouter, Outlet, Route, Routes } from "react-router";
import routerProvider, {
  DocumentTitleHandler,
  NavigateToResource,
  UnsavedChangesNotifier,
} from "@refinedev/react-router";

import { AppIcon } from "./components/app-icon";
import { AdminOnly } from "./components/admin-only";
import { Header } from "./components/header";
import { ColorModeContextProvider } from "./contexts/color-mode";
import { RoleProvider, useRole } from "./contexts/role";
import { localDataProvider } from "./data";
import {
  AgreementCreate,
  AgreementList,
  AgreementShow,
  AgreementSign,
} from "./pages/agreements";
import { TemplateCreate, TemplateEdit, TemplateList } from "./pages/templates";
import { UserCreate, UserEdit, UserList } from "./pages/users";

// Signers only see Agreements; Templates and Signers are hidden from their menu.
const getResources = (isAdmin: boolean) => [
  {
    name: "templates",
    list: "/templates",
    create: "/templates/create",
    edit: "/templates/edit/:id",
    meta: { canDelete: true, hide: !isAdmin, icon: <FileOutlined /> },
  },
  {
    name: "users",
    list: "/users",
    create: "/users/create",
    edit: "/users/edit/:id",
    meta: { label: "Signers", canDelete: true, hide: !isAdmin, icon: <UserOutlined /> },
  },
  {
    name: "agreements",
    list: "/agreements",
    create: "/agreements/create",
    show: "/agreements/show/:id",
    meta: { canDelete: true, icon: <ContainerOutlined /> },
  },
];

function AppRoutes() {
  const { isAdmin } = useRole();
  return (
          <Refine
            dataProvider={localDataProvider}
            routerProvider={routerProvider}
            notificationProvider={useNotificationProvider}
            resources={getResources(isAdmin)}
            options={{
              syncWithLocation: true,
              warnWhenUnsavedChanges: true,
              // Refine sends anonymous usage data by default; this demo keeps everything in the browser.
              disableTelemetry: true,
              title: { text: "WebViewer CLM", icon: <AppIcon /> },
            }}
          >
            <Routes>
              <Route
                element={
                  <ThemedLayout
                    Header={Header}
                    Sider={(props) => <ThemedSider {...props} fixed />}
                    Title={({ collapsed }) => (
                      <ThemedTitle
                        collapsed={collapsed}
                        icon={<AppIcon />}
                        text="WebViewer CLM"
                      />
                    )}
                  >
                    <Outlet />
                  </ThemedLayout>
                }
              >
                <Route index element={<NavigateToResource resource="agreements" />} />
                <Route element={<AdminOnly />}>
                  <Route path="/templates">
                    <Route index element={<TemplateList />} />
                    <Route path="create" element={<TemplateCreate />} />
                    <Route path="edit/:id" element={<TemplateEdit />} />
                  </Route>
                  <Route path="/users">
                    <Route index element={<UserList />} />
                    <Route path="create" element={<UserCreate />} />
                    <Route path="edit/:id" element={<UserEdit />} />
                  </Route>
                  <Route path="/agreements/create" element={<AgreementCreate />} />
                </Route>
                <Route path="/agreements">
                  <Route index element={<AgreementList />} />
                  <Route path="show/:id" element={<AgreementShow />} />
                  <Route path="sign/:id" element={<AgreementSign />} />
                </Route>
                <Route path="*" element={<ErrorComponent />} />
              </Route>
            </Routes>
            <UnsavedChangesNotifier />
            <DocumentTitleHandler />
          </Refine>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ColorModeContextProvider>
        <AntdApp>
          <RoleProvider>
            <AppRoutes />
          </RoleProvider>
        </AntdApp>
      </ColorModeContextProvider>
    </BrowserRouter>
  );
}

export default App;
