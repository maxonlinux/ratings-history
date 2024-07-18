import axios from "axios";
import { agenciesMap } from "../App";
import { Events, Message } from "../types";
import { useEffect } from "react";
import { emitter } from "../services/emitter";
import { config } from "../config";

const AgencyComponent: React.FC<{
  agency: { name: string; messages: Message[] };
}> = ({ agency }) => {
  const getMessageColorClass = (message: Message) => {
    if (!message) {
      return "opacity-50";
    }

    if (message.type === "exit") {
      return "text-blue-700";
    }

    if (message.type === "error") {
      return "text-red-700";
    }

    if (message.type === "message") {
      return "text-gray-700";
    }
  };

  const hasMessages = agency.messages.length;
  const isLoading = hasMessages ? agency.messages[0].type === "message" : false;
  const isFailed = hasMessages ? agency.messages[0].type === "error" : false;
  const isDone = hasMessages ? agency.messages[0].type === "exit" : false;

  const lastMessage = agency.messages[0];
  const lastMessageClass = lastMessage ? getMessageColorClass(lastMessage) : "";

  useEffect(() => {
    if (isFailed || isDone) {
      emitter.dispatch(Events.FILES_UPDATE, null);
    }
  }, [isFailed, isDone]);

  return (
    <div className="flex gap-4 items-center p-4 border border-black/15 rounded-lg">
      <div className="relative flex items-center justify-center rounded-full flex-shrink-0 size-10 bg-gray-200">
        <div className="ic">database</div>
        {isLoading ? (
          <div className="absolute w-full h-full rounded-full border border-blue-700 border-r-transparent animate-spin" />
        ) : null}
      </div>
      <div className="text-left">
        <div>{agenciesMap[agency.name] ?? agency}</div>
        <div className={`text-xs ${lastMessageClass}`}>
          {agency.messages.length ? lastMessage.message : "No process running"}
        </div>
      </div>
      {isLoading ? (
        <button
          className="ic ml-auto size-10 bg-red-700/15 text-red-700 flex-shrink-0 rounded-full"
          onClick={() => {
            axios.post(config.apiUrl + "/agencies/abort/" + agency.name);
          }}
        >
          close
        </button>
      ) : (
        <button
          className={`ml-auto ic size-10 ${
            isFailed
              ? "bg-gray-700/15 text-gray-700"
              : "bg-blue-700/15 text-blue-700"
          } flex-shrink-0 rounded-full`}
          onClick={() => {
            axios.post(config.apiUrl + "/agencies/download/" + agency.name);
          }}
        >
          {isFailed ? "replay" : "download"}
        </button>
      )}
    </div>
  );
};

export default AgencyComponent;
