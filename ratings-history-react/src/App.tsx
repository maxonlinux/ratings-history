import { useEffect, useState } from "react";
import axios, { AxiosError } from "axios";
import { config } from "./config";
import LoginPage from "./pages/LoginPage";
import MainPage from "./pages/MainPage";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await axios.get(config.apiUrl + "/auth/whoami", {
          withCredentials: true,
        });

        setIsAuthenticated(true);
      } catch (error) {
        setIsAuthenticated(false);
        if (!(error instanceof AxiosError)) {
          console.error(error);
          return;
        }

        if (error.response?.status === 401) {
          console.log("User is not authenticated");
        }

        if (error.response?.status === 403) {
          console.error("Token is expired or invalid");
        }
      }
    };

    checkAuth();
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="flex gap-2 w-full h-full items-center justify-center text-3xl font-thin">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={() => setIsAuthenticated(true)} />;
  }

  return <MainPage />;
}

export default App;
