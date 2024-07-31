export interface CustomHeaders {
  [key: string]: string;
}

export interface AgencyFunctionData {
  urls: string[];
  headers?: CustomHeaders;
}

export interface AgencyFunctionData {
  urls: string[];
  headers?: CustomHeaders;
}

export interface MessageEmitter {
  message: (message: string) => void;
  error: (message: string) => void;
  done: (message: string) => void;
}

export type AgencyFunction = (
  emitter: MessageEmitter
) => Promise<AgencyFunctionData>;

export interface AgenciesMap {
  [key: string]: AgencyFunction;
}

export enum Events {
  AGENCIES_UPDATE = "AGENCIES_UPDATE",
}
