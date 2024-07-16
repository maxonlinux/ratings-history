import { emitter } from "../services";
import { AgenciesMap, AgencyEvent } from "../types";
import { getDemotechRatingsHistory } from "./demotechRatings";
import { getEganJonesHistory } from "./eganJones";
import { getFitchRatingsHistory } from "./fitchRatings";
import { getJapanCreditRatingsHistory } from "./japanCreditRatings";
import { getKrollBondRatingsHistory } from "./krollBondRatings";
import { getMoodysRatings } from "./moodysRatings";
import { getMorningStarHistory } from "./morningStar";

const agenciesFunctionsMap: AgenciesMap = {
  "fitch-ratings": getFitchRatingsHistory,
  "egan-jones": getEganJonesHistory,
  "demotech-ratings": getDemotechRatingsHistory,
  "japan-credit-ratings": getJapanCreditRatingsHistory,
  "kroll-bond-ratings": getKrollBondRatingsHistory,
  "morning-star": getMorningStarHistory,
  "moodys-ratings": getMoodysRatings,
};

const emit = {
  message: (message: string) => {
    emitter.emit(AgencyEvent.MESSAGE, {
      message,
      type: "message",
    });
  },
  error: (message: string) => {
    emitter.emit(AgencyEvent.MESSAGE, {
      message,
      type: "error",
    });
  },
};

export { agenciesFunctionsMap, emit };
