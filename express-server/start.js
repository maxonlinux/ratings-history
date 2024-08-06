const { exec } = require("child_process");

const isAzure = process.env.WEBSITE_HOSTNAME !== undefined;

const startCommand = isAzure
  ? "node dist/index.js"
  : 'npx pm2 start dist/index.js --name "ratingshistory"';

console.log(`Starting app with command: ${startCommand}`);

exec(startCommand, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error executing command: ${error}`);
    return;
  }
  console.log(`stdout: ${stdout}`);
  console.error(`stderr: ${stderr}`);
});
