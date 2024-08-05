const fs = require("fs-extra");
const path = require("path");

const copyViews = async () => {
  const srcDir = path.join(__dirname, "express-server", "src", "views");
  const destDir = path.join(__dirname, "express-server", "dist", "views");

  try {
    await fs.copy(srcDir, destDir);
    console.log("Views copied successfully!");
  } catch (error) {
    console.error("Error copying views:", error);
  }
};

const copyAdminPanel = async () => {
  const srcDir = path.resolve(__dirname, "admin-panel", "dist");
  const destDir = path.resolve(__dirname, "express-server", "dist-admin");

  try {
    await fs.copy(srcDir, destDir);
    console.log("Admin panel copied successfully!");
  } catch (error) {
    console.error("Error copying admin panel:", error);
  }
};

const main = async () => {
  await copyViews();
  await copyAdminPanel();
};

main();
