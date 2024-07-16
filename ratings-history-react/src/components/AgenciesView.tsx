import { useEffect, useState } from "react";
import AgencyComponent from "./AgencyComponent";
import socket from "../services/socket";
import { Message } from "../types";
import ManualUpload from "./ManualUpload";

const AgenciesView: React.FC = () => {
  const [agencies, setAgencies] = useState<{
    [key: string]: { messages: Message[] };
  }>({});

  const agenciesArray = Object.entries(agencies).map(([name, data]) => ({
    name,
    messages: data.messages,
  }));

  useEffect(() => {
    const handleAgenciesUpdate = (data: any) => {
      setAgencies(data);
    };

    socket.subscribe("AGENCIES_UPDATE", handleAgenciesUpdate);

    return () => {
      socket.unsubscribe("AGENCIES_UPDATE");
    };
  }, []);

  return (
    <div className="p-4 w-1/2 overflow-y-auto">
      <div className="flex flex-col gap-4">
        {agenciesArray.map((agency) => (
          <AgencyComponent key={agency.name} agency={agency} />
        ))}
      </div>
      <ManualUpload />
    </div>
  );
};

export default AgenciesView;
