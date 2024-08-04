export interface InstrumentData {
  [key: string]: string | undefined;
}

export interface CustomHeaders {
  [key: string]: string;
}

export interface AgencyFunctionData {
  urls: string[];
  headers?: CustomHeaders;
}

export interface BaseMetadata {
  date: string;
  lines: number;
  size: number;
}

export interface FileMetadata extends BaseMetadata {
  name: string;
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
  UPLOAD_UPDATE = "UPLOAD_UPDATE",
  TASKS_COMPLETE = "TASKS_COMPLETE",
  SYSTEM_INFO = "SYSTEM_INFO",
}
