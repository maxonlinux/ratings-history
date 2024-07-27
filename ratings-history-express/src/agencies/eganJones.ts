import { MessageEmitter } from "../types";

const getEganJonesHistory = async (emit: MessageEmitter) => {
  emit.message("Getting Egan Jones history files...");

  const downloadUrl = "https://17g7-xbrl.egan-jones.com/download-xbrl";

  return { urls: [downloadUrl] };
};

export default getEganJonesHistory;
