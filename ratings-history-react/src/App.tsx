import { useEffect } from "react";
import AgenciesView from "./components/AgenciesView";
import FilesView from "./components/FilesView";
import socket from "./services/socket";

export const baseUrl = "http://localhost:3000";

export const agenciesMap: { [key: string]: string } = {
  "fitch-ratings": "Fitch Ratings",
  "egan-jones": "Egan Jones",
  "demotech-ratings": "Demotech",
  "japan-credit-ratings": "Japan Credit Ratings",
  "kroll-bond-ratings": "Kroll Bond Ratings",
  "morning-star": "Morning Star",
  "moodys-ratings": "Moody's Ratings",
};

function App() {
  useEffect(() => {
    socket.connect();

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <>
      <header className="flex items-center gap-4 px-4 py-4 border-b border-black/15">
        <p className="opacity-50">Space reserved for future updates</p>
      </header>
      <div className="flex overflow-hidden h-full">
        <aside className="border-r border-black/20 p-4 flex-shrink-0 w-72">
          <h1 className="flex items-center gap-2 text-3xl mb-8 mt-4">
            <span className="ic font-thin">admin_panel_settings</span>
            <span className="font-thin">RatingsHistory</span>
          </h1>
          <div className="flex flex-col gap-4">
            <button className="flex items-center gap-2 p-4 w-full border border-black rounded-lg">
              <span className="ic">replay</span> Restart server
            </button>
            <button className="flex items-center gap-2 p-4 w-full border text-red-500 border-red-500 rounded-lg hover:border-red-500">
              <span className="ic">chevron_left</span> Logout
            </button>
          </div>
        </aside>
        <AgenciesView />
        <div className="w-px bg-black/15" />
        <FilesView />
      </div>
      <footer className="border-t border-black/15 p-4">
        <div className="opacity-50 text-center text-sm">
          RatingsHistory Admin Panel
        </div>
      </footer>
    </>
  );
}

export default App;
