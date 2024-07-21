import path from "path";
import fs from "fs/promises";
import { config } from "../config";
import { InstrumentData } from "../types";
import { decode } from "entities";
import { Entry, ZipFile } from "yauzl";
import { openReadStream, openZip } from "../utils/archive";

const escapeCsvValue = (value: string | undefined) => {
  return typeof value === "string" &&
    (value.includes(",") || value.includes('"') || value.includes("\n"))
    ? `"${value.replace(/"/g, '""')}"`
    : value;
};

class Parser {
  columnsMap: InstrumentData = {
    RAN: "rating_agency_name",
    FCD: "file_creating_date",
    SSC: "sec_category",
    ISSNAME: "issuer_name",
    LEI: "legal_entity_identifier",
    OBT: "object_type_rated",
    INSTNAME: "instrument_name",
    CUSIP: "CUSIP_number",
    CR: "coupon_date",
    MD: "maturity_date",
    PV: "par_value",
    IP: "issued_paid",
    R: "rating",
    RAD: "rating_action_date",
    RAC: "rating_action_class",
    RT: "rating_type",
    RST: "rating_sub_type",
    RTT: "rating_type_term",
    OAN: "other_announcement_type",
    WST: "watch_status",
    ROL: "rating_outlook",
    ISI: "issuer_identifier",
    ISIS: "issuer_identifier_schema",
    INI: "instrument_identifier",
    INIS: "instrument_identifier_schema",
    CIK: "central_index_key",
    OI: "obligor_identifier",
    OIS: "obligor_identifier_schema",
    OIOS: "obligor_identifier_other",
    OSC: "obligor_sec_category",
    OIG: "obligor_industry_group",
    OBNAME: "obligor_name",
  };

  parseXml(xmlString: string): InstrumentData[] {
    const rttRegex = /<(?:[a-z]*:)?(RTT)\b[^>]*>.*?<\/(?:[a-z]*:)?\1>/gs;

    const valueRegex =
      /<(?:[a-z]*:)?([A-Z]+)\b[^>]*>(?:<!\[CDATA\[(.*?)\]\]>|([^<]*))<\/(?:[a-z]*:)?\1>/gs;

    const result = [];

    const currentInstrument: InstrumentData = Object.fromEntries(
      Object.keys(this.columnsMap).map((key) => [key, undefined])
    );

    let match;

    const hasRTT = rttRegex.test(xmlString);

    // For testing purposes
    let lastMatch = ["", "", ""];
    const allowedLastKeys = ["RT", "RST", "RAC", "WST", "OAN", "ROL"];
    //

    while ((match = valueRegex.exec(xmlString)) !== null) {
      const [, key, cdata, text] = match;

      // For testing purposes
      const [, lastKey, lastCdata, lastText] = lastMatch;

      if (key === "RTT" && !allowedLastKeys.includes(lastKey)) {
        console.log(lastKey, lastCdata, lastText);
        throw new Error(
          "Invalid XML structure: RTT tag must always follow RT tag."
        );
      }

      lastMatch = match;
      //

      if (this.columnsMap[key]) {
        const value = cdata || text;
        currentInstrument[key] = decode(value);
      }

      if (key === "RTT") {
        result.push(currentInstrument);
      }

      if (!hasRTT && key === "RT") {
        result.push(currentInstrument);
      }
    }

    return result;
  }

  async createCsvFile(outputFilePath: string) {
    try {
      const columnHeaders = Object.values(this.columnsMap).join(",");

      await fs.writeFile(outputFilePath, columnHeaders, "utf8");
    } catch (error) {
      const err = error as any;
      throw new Error("Error creating CSV file: " + err.message ?? err);
    }
  }

  async appendCsvFile(outputFilePath: string, data: InstrumentData[]) {
    try {
      const csvData = data
        .map((row) => "\n" + Object.values(row).map(escapeCsvValue).join(","))
        .join("");

      await fs.appendFile(outputFilePath, csvData, "utf8");
    } catch (error) {
      const err = error as any;
      throw new Error("Error writing to CSV file: " + err.message ?? err);
    }
  }

  async processXmlData(data: string, csvFileNameSet: Set<string>) {
    const parsedData = this.parseXml(data);

    if (!parsedData.length) {
      return;
    }

    const { FCD, RAN, SSC, OSC } = parsedData[0];
    const csvFileName = `${FCD?.replace(/-/g, "")} ${RAN} ${SSC || OSC}`;

    const outputFilePath = path.resolve(
      config.tempDirPath,
      "csv",
      `${csvFileName}.csv`
    );

    // Create new file and add its name in set
    if (!csvFileNameSet.has(csvFileName)) {
      await this.createCsvFile(outputFilePath);
      csvFileNameSet.add(csvFileName);
    }

    // Append existing file or the new file that was just created
    await this.appendCsvFile(outputFilePath, parsedData);
  }

  async processZipArchive(zipFilePath: string) {
    try {
      const csvFileNameSet: Set<string> = new Set();
      const zipFile: ZipFile = await openZip(zipFilePath, {
        lazyEntries: true,
      });

      // Function to wait for zipFile to finish processing
      const zipFilePromise = new Promise<void>((resolve, reject) => {
        zipFile.on("error", reject);
        zipFile.on("end", resolve);
      });

      // Start reading entries from the zip file
      zipFile.readEntry();

      const handleEntry = async (entry: Entry) => {
        // Directory file names end with '/'
        if (/\/$/.test(entry.fileName)) {
          // Move to the next entry
          zipFile.readEntry();
          return;
        }

        try {
          console.log("Processing " + entry.fileName);

          // Open read stream for the current entry
          const data = await openReadStream(zipFile, entry);

          console.log("Processing", entry.fileName);

          await this.processXmlData(data, csvFileNameSet);
        } catch (error) {
          const err = error as any;
          console.error(
            `Error opening read stream for ${entry.fileName}:`,
            err
          );
        }

        // Move to the next entry
        zipFile.readEntry();
      };

      // Handle each entry in the zip file
      zipFile.on("entry", handleEntry);

      // Wait for zipFile to finish processing all entries
      await zipFilePromise;
      console.log("All files processed.");

      // Close the zipFile
      zipFile.close();

      // Move all CSV files from temporary to output directory
      for (const file of csvFileNameSet) {
        const oldPath = path.resolve(config.tempDirPath, "csv", file + ".csv");
        const newPath = path.resolve(config.outDirPath, file + ".csv");

        fs.rename(oldPath, newPath);
      }
    } catch (error) {
      const err = error as any;
      throw new Error("Error processing zip file: " + err.message ?? err);
    }
  }
}

export default Parser;
