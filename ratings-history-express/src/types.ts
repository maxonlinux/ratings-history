export interface InstrumentData {
  [key: string]: string | undefined;
}

export type CustomHeaders = {
  [key: string]: string;
};

export type AgencyFunction = (emitter: MessageEmitter) => Promise<unknown>;

export interface AgenciesMap {
  [key: string]: AgencyFunction;
}

export interface BaseMetadata {
  date: string;
  lines: number;
  size: number;
}

export interface FileMetadata extends BaseMetadata {
  name: string;
}

export enum Agencies {
  FITCH = "fitch-ratings",
  EGAN = "egan-jones",
  DEMO = "demotech-ratings",
  JAPAN = "japan-credit-ratings",
  KROLL = "kroll-bond-ratings",
  MORNING = "morning-star",
  MOODYS = "moodys-ratings",
}

export type Task = () => Promise<void>;

export interface MessageEmitter {
  message: (message: string) => void;
  error: (message: string) => void;
  done: (message: string) => void;
}

export interface Message {
  type: string;
  message: string;
  [key: string]: string;
}
export enum Events {
  AGENCIES_UPDATE = "AGENCIES_UPDATE",

  UPLOAD_MESSAGE = "UPLOAD_MESSAGE",
  UPLOAD_UPDATE = "UPLOAD_UPDATE",

  SYSTEM_INFO = "SYSTEM_INFO",
}

export enum TaskerEvents {
  AGENCY_TASK = "agency",
  UPLOAD_TASK = "file",
}
