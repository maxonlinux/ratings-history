import path from "path";
import fs from "fs/promises";
import { decode } from "entities";
import { Entry, ZipFile } from "yauzl";
import config from "../config";
import { InstrumentData } from "../types";
import { openReadStream, openZip } from "../utils/archive";

const escapeCsvValue = (value: string | undefined) =>
  typeof value === "string" &&
  (value.includes(",") || value.includes('"') || value.includes("\n"))
    ? `"${value.replace(/"/g, '""')}"`
    : value;

class Parser {
  private readonly xmlTagToCsvColumnMap: { [key: string]: string };
  private readonly columnHeaders: string[];
  private readonly keySet: Set<string>;
  private readonly endTagSet: Set<string>;
  private readonly defaultInstrument: InstrumentData;

  constructor() {
    this.xmlTagToCsvColumnMap = {
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

    this.columnHeaders = Object.values(this.xmlTagToCsvColumnMap);
    this.keySet = new Set(Object.keys(this.xmlTagToCsvColumnMap));
    this.endTagSet = new Set(["ORD", "INRD"]);

    this.defaultInstrument = {};

    this.keySet.forEach((key) => {
      this.defaultInstrument[key] = undefined;
    });
  }

  parseXml(xmlString: string): InstrumentData[] {
    const valueRegex =
      /<(?:[a-z]*:)?([A-Z]+)\b[^>]*>(?:<!\[CDATA\[(.*?)\]\]>|([^<]*))<\/(?:[a-z]*:)?\1>|<\/(?:[a-z]*:)?([A-Z]+)\b[^>]*>/gs;

    const result: Set<InstrumentData> = new Set();
    const currentInstrument: InstrumentData = { ...this.defaultInstrument };

    let match;

    while ((match = valueRegex.exec(xmlString)) !== null) {
      const [, key, cdata, text, closingTag] = match;

      if (this.endTagSet.has(closingTag)) {
        result.add({ ...currentInstrument });
        continue;
      }

      if (this.keySet.has(key)) {
        const value = cdata || text || "";
        currentInstrument[key] = decode(value);
      }
    }

    return [...result];
  }

  async createCsvFile(outputFilePath: string) {
    try {
      const columnHeaders = this.columnHeaders.join(",");

      await fs.writeFile(outputFilePath, columnHeaders, "utf8");
    } catch (error) {
      throw new Error(
        `Error creating CSV file: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  private async appendCsvFile(outputFilePath: string, data: InstrumentData[]) {
    try {
      const csvData = data
        .map((row) => `\n${Object.values(row).map(escapeCsvValue).join(",")}`)
        .join("");

      await fs.appendFile(outputFilePath, csvData, "utf8");
    } catch (error) {
      throw new Error(
        `Error writing to CSV file: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
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

    if (!csvFileNameSet.has(csvFileName)) {
      csvFileNameSet.add(csvFileName);
      await this.createCsvFile(outputFilePath);
    }

    await this.appendCsvFile(outputFilePath, parsedData);
  }

  async processZipArchive(zipFilePath: string) {
    try {
      const csvFileNameSet: Set<string> = new Set();
      const zipFile: ZipFile = await openZip(zipFilePath, {
        lazyEntries: true,
      });

      const zipFilePromise = new Promise<void>((resolve, reject) => {
        zipFile.on("error", reject);
        zipFile.on("end", resolve);
      });

      zipFile.readEntry();

      const handleEntry = async (entry: Entry) => {
        if (/\/$|^(?!.*\.xml$).*$/.test(entry.fileName)) {
          zipFile.readEntry();
          return;
        }

        try {
          // console.log("Processing", entry.fileName);

          const data = await openReadStream(zipFile, entry);

          await this.processXmlData(data, csvFileNameSet);
        } finally {
          zipFile.readEntry();
        }
      };

      zipFile.on("entry", handleEntry);

      await zipFilePromise;
      console.log("All files processed.");

      zipFile.close();

      const renamePromises = Array.from(csvFileNameSet).map(async (file) => {
        const oldPath = path.resolve(config.tempDirPath, "csv", `${file}.csv`);
        const newPath = path.resolve(config.outDirPath, `${file}.csv`);
        await fs.rename(oldPath, newPath);
      });

      await Promise.all(renamePromises);
    } catch (error) {
      throw new Error(
        `Error processing ZIP file: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
}

export default Parser;
