import { MessageEmitter } from "../types";

const getDemotechRatingsHistory = async (emit: MessageEmitter) => {
  emit.message("Getting Demotech history files...");

  const downloadUrl = "https://www.demotech.com/17g-7.php";

  return { urls: [downloadUrl] };
};

export { getDemotechRatingsHistory };
