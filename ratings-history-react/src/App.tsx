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
      <header className="flex gap-2 border-b border-black/15 pl-6 pr-4 py-4">
        <h1 className="flex items-center gap-2 text-xl">
          <span className="font-semibold">RatingsHistory</span>
          <span className="font-thin opacity-70"> | </span>
          <span className="font-thin opacity-70">Admin Panel</span>
        </h1>
        <button className="ml-auto flex items-center gap-2 text-amber-500 border border-amber-500 px-2 rounded-full">
          Reboot server<span className="ic">replay</span>
        </button>
        <button className="flex items-center gap-2 text-red-600 border border-red-500 px-2 rounded-full">
          Logout<span className="ic">logout</span>
        </button>
      </header>
      <div className="px-4 py-4 border-b border-black/15">
        <p className="opacity-50">Space reserved for future updates</p>
      </div>
      <div className="flex overflow-hidden h-full">
        <AgenciesView />
        <div className="w-px bg-black/15" />
        <FilesView />
      </div>
      <footer className="border-t border-black/15 p-4">
        <div className="opacity-50 text-center text-sm">
          RatingsHistory.info Admin Panel
        </div>
      </footer>
    </>
  );
}

export default App;
