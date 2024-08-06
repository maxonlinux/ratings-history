const { exec } = require("child_process");

const isAzure = process.env.WEBSITE_HOSTNAME !== undefined;

if (isAzure) {
  console.error(
    "The app is deployed to Azure Web App. Please, use Azure's restart functionality"
  );

  return;
}

const startCommand = "npx pm2 restart ratingshistory";

console.log(`Starting app with command: ${startCommand}`);

exec(startCommand, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error executing command: ${error}`);
    return;
  }
  console.log(`stdout: ${stdout}`);
  console.error(`stderr: ${stderr}`);
});
