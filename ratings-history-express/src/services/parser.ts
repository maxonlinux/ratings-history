import path from "path";
import fs from "fs/promises";
import { config } from "../config";
import { InstrumentData } from "../types";
import { escapeCsvValue } from "../utils";

class XmlParser {
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
    const allowedLastKeys = ["RT", "RST", "RAC", "WST", "OAN"];
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
        currentInstrument[key] = value;
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

  async readXmlFiles(directoryPath: string): Promise<string[]> {
    try {
      const files = await fs.readdir(directoryPath);
      return files.filter((file) => file.endsWith(".xml"));
    } catch (err) {
      throw new Error("Error reading directory: " + err);
    }
  }

  async writeCsv(outputFilePath: string, data: InstrumentData[]) {
    const columnHeaders = Object.values(this.columnsMap).join(",");

    try {
      const csvData = [
        columnHeaders,
        ...data.map((row) => Object.values(row).map(escapeCsvValue).join(",")),
      ].join("\n");

      await fs.writeFile(outputFilePath, csvData, "utf8");

      console.log(`CSV file ${outputFilePath} has been written successfully`);
    } catch (err) {
      throw new Error("Error writing CSV file: " + err);
    }
  }

  async processXmlFiles(directoryPath: string) {
    if (!config.outDirPath) {
      throw new Error("No out dir name in .env!!!");
    }

    console.log("Start parsing XML files...");

    try {
      const files = await this.readXmlFiles(directoryPath);
      const fileDataMap: { [key: string]: InstrumentData[] } = {};

      for (const file of files) {
        console.log("Reading " + file);

        const filePath = path.join(directoryPath, file);
        const XMLdata = await fs.readFile(filePath, "utf-8");

        const parsedData = this.parseXml(XMLdata);

        for (const data of parsedData) {
          const FCD = data.FCD ? data.FCD.replace(/-/g, "") : "UNDATED";
          const key = `${FCD} ${data.RAN} ${data.SSC || data.OSC}`;

          if (!fileDataMap[key]) {
            fileDataMap[key] = [];
          }

          fileDataMap[key].push(data);
        }
      }

      // Write to CSV file
      for (const key in fileDataMap) {
        const outputFilePath = path.join(config.outDirPath, `${key}.csv`);
        await this.writeCsv(outputFilePath, fileDataMap[key]);
      }

      console.log(`All XML files parsed successfully!`);
    } catch (err) {
      throw new Error("Error parsing and writing XML to CSV: " + err);
    }
  }
}

export default XmlParser;
