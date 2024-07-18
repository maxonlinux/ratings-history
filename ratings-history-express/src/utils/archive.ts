import { open, Entry, ZipFile, Options } from "yauzl";

const openZip = (path: string, options: Options): Promise<ZipFile> => {
  return new Promise((resolve, reject) => {
    open(path, options, (err, zipFile) => {
      if (err) return reject(err);
      resolve(zipFile);
    });
  });
};

const openReadStream = (zipFile: ZipFile, entry: Entry): Promise<any> => {
  return new Promise((resolve, reject) => {
    zipFile.openReadStream(entry, (err, readStream) => {
      if (err) return reject(err);
      let data = "";
      readStream.on("data", (chunk: any) => {
        data += chunk;
      });
      readStream.on("end", () => {
        resolve(data);
      });
      readStream.on("error", (err) => {
        reject(err);
      });
    });
  });
};

export { openZip, openReadStream };
