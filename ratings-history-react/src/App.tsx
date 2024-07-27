import { useEffect, useState } from "react";
import AgenciesView from "./components/AgenciesView";
import FilesView from "./components/FilesView";
import socket from "./services/socket";
import axios from "axios";
import { config } from "./config";
import { emitter } from "./services/emitter";
import { Events } from "./types";
import SysInfo from "./components/SysInfo";

export const agenciesMap: { [key: string]: string } = {
  "ambest-ratings": "Ambest Ratings",
  "fitch-ratings": "Fitch Ratings",
  "egan-jones": "Egan Jones",
  "demotech-ratings": "Demotech",
  "japan-credit-ratings": "Japan Credit Ratings",
  "kroll-bond-ratings": "Kroll Bond Ratings",
  "morning-star": "Morningstar",
  "moodys-ratings": "Moody's Ratings",
};

function App() {
  const [isRestarting, setIsRestarting] = useState(false);
  const [shouldReload, setShouldReload] = useState(false);

  const handleRestart = async () => {
    try {
      const res = await axios.post(config.apiUrl + "/server/restart");
      const data = res.data;

      console.log(data.message);
      setShouldReload(true);
      setIsRestarting(true);
    } catch (error) {
      const err = error as any;
      console.error(err.message ?? err);
    }
  };

  useEffect(() => {
    socket.connect();

    emitter.subscribe(Events.SOCKET_OPEN, () => {
      setIsRestarting(false);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!isRestarting && shouldReload) {
      location.reload();
    }
  }, [isRestarting, shouldReload]);

  return (
    <>
      <header className="flex items-center gap-4 px-4 py-4 border-b border-black/15">
        <p className="opacity-50">Space reserved for future updates</p>
      </header>

      <div
        className={`fixed flex flex-col gap-4 justify-center items-center top-0 left-0 w-full h-full bg-black text-white z-50 transition-opacity duration-1000 ${
          isRestarting ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        {isRestarting ? (
          <>
            <span className="ic animate-spin text-7xl font-thin">
              progress_activity
            </span>
            Restarting server...
          </>
        ) : (
          <>
            <span className="ic text-7xl font-thin">check_circle</span>
            Done! Reloading page...
          </>
        )}
      </div>

      <div className="flex overflow-hidden h-full">
        <aside className="flex flex-col border-r border-black/20 flex-shrink-0 w-72 py-4">
          <h1 className="flex items-center gap-2 text-3xl mb-8 mt-4 px-4">
            <span className="ic font-thin">admin_panel_settings</span>
            <span className="font-thin">RatingsHistory</span>
          </h1>
          <div className="flex flex-col gap-4 flex-1 overflow-scroll px-4 pb-4">
            <SysInfo />
          </div>
          <div className="flex flex-col gap-4 px-4 pt-4 border-t border-black/20">
            <button
              className="flex items-center gap-4 px-4 py-2 w-full border border-black/20 rounded-lg hover:bg-black/5"
              onClick={handleRestart}
            >
              <span className="flex items-center justify-center ic size-8 text-blue-700 rounded-full bg-blue-700/20">
                sync
              </span>
              Restart server
            </button>
            <button className="flex items-center gap-4 px-4 py-2 w-full border border-black/20 rounded-lg hover:bg-black/5">
              <span className="flex items-center justify-center ic size-8 text-red-700 rounded-full bg-red-700/20">
                chevron_left
              </span>
              Logout
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
