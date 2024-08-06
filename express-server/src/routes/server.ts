import { WebSiteManagementClient } from "@azure/arm-appservice";
import { DefaultAzureCredential } from "@azure/identity";
import { exec } from "child_process";
import { Request, Response, Router } from "express";
import config from "../config";

const router = Router();

router.post("/restart", async (_req: Request, res: Response) => {
  const restartWebApp = async (
    client: WebSiteManagementClient,
    {
      resourceGroupName,
      appName,
    }: { resourceGroupName: string; appName: string }
  ) => {
    await client.webApps.restart(resourceGroupName, appName);
    console.log("Web App restarted successfully");
  };

  try {
    if (
      !config.isAzure ||
      !config.azureCredentials.appName ||
      !config.azureCredentials.resourceGroupName ||
      !config.azureCredentials.subscriptionId
    ) {
      console.log("SERVER RESTART!");
      res.json({ message: "Restarting server..." });
      exec("npm run restart");
      return;
    }

    const credentials = new DefaultAzureCredential();
    const client = new WebSiteManagementClient(
      credentials,
      config.azureCredentials.subscriptionId
    );

    await restartWebApp(client, {
      resourceGroupName: config.azureCredentials.resourceGroupName,
      appName: config.azureCredentials.appName,
    });
  } catch (error) {
    res.status(500).json({ error: `Error restarting server: ${error}` });
  }
});

export default router;
