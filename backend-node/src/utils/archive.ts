import { open, Entry, ZipFile, Options } from "yauzl";

const openZip = (path: string, options: Options): Promise<ZipFile> =>
  new Promise((resolve, reject) => {
    open(path, options, (err, zipFile) => {
      if (err) {
        reject(err.message ?? err);
        return;
      }

      resolve(zipFile);
    });
  });

const openReadStream = (zipFile: ZipFile, entry: Entry): Promise<string> =>
  new Promise((resolve, reject) => {
    zipFile.openReadStream(entry, (err, readStream) => {
      if (err) {
        reject(err.message ?? err);
        return;
      }

      let data = "";
      readStream.on("data", (chunk) => {
        data += chunk;
      });
      readStream.on("end", () => {
        resolve(data);
      });
      readStream.on("error", (error) => {
        reject(error.message ?? error);
      });
    });
  });

export { openZip, openReadStream };
