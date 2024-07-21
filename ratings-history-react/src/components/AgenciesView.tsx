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
      setAgencies((prev) => {
        const updatedAgencies = { ...prev };

        if (!Object.getOwnPropertyNames(prev).length) {
          return data;
        }

        for (const agencyName in data) {
          if (!data.hasOwnProperty(agencyName)) {
            continue;
          }

          const newMessages = data[agencyName].messages;

          updatedAgencies[agencyName] = {
            messages: newMessages.length
              ? newMessages
              : prev[agencyName].messages,
          };
        }

        return updatedAgencies;
      });
    };

    socket.subscribe("AGENCIES_UPDATE", handleAgenciesUpdate);

    return () => {
      socket.unsubscribe("AGENCIES_UPDATE");
    };
  }, []);

  return (
    <div className="p-4 w-1/2 overflow-y-auto">
      <h1 className="flex items-center gap-2 text-3xl mb-8 mt-4">
        <span className="font-thin">Agencies</span>
      </h1>
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
