import { emitter } from "../services";
import { AgenciesMap, Events } from "../types";
// import { getAmbestRatingsHistory } from "./ambestRatings";
import getDemotechRatingsHistory from "./demotechRatings";
import getEganJonesHistory from "./eganJones";
import getFitchRatingsHistory from "./fitchRatings";
import getJapanCreditRatingsHistory from "./japanCreditRatings";
import getKrollBondRatingsHistory from "./krollBondRatings";
import getMoodysRatings from "./moodysRatings";
import getMorningStarHistory from "./morningStar";

const agenciesFunctionsMap: AgenciesMap = {
  // "ambest-ratings": getAmbestRatingsHistory,
  "fitch-ratings": getFitchRatingsHistory,
  "egan-jones": getEganJonesHistory,
  "demotech-ratings": getDemotechRatingsHistory,
  "japan-credit-ratings": getJapanCreditRatingsHistory,
  "kroll-bond-ratings": getKrollBondRatingsHistory,
  "morning-star": getMorningStarHistory,
  "moodys-ratings": getMoodysRatings,
};

const createEmitter = (agencyName: string) => ({
  message: (message: string) => {
    emitter.emit(Events.AGENCIES_UPDATE, {
      agencyName,
      message,
      type: "message",
    });
  },
  error: (message: string) => {
    emitter.emit(Events.AGENCIES_UPDATE, {
      agencyName,
      message,
      type: "error",
    });
  },
  done: (message: string) => {
    emitter.emit(Events.AGENCIES_UPDATE, {
      agencyName,
      message,
      type: "exit",
    });
  },
});

export { agenciesFunctionsMap, createEmitter };
