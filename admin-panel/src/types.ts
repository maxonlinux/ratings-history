export interface Message {
  type: string;
  message: string;
}

export interface FileMetaData {
  name: string;
  date: string;
  lines: number;
  size: number;
}

export interface SystemInfo {
  cpu: {
    manufacturer: string;
    brand: string;
    speed: number;
    cores: number;
    usage: number;
  };
  memory: {
    total: number;
    free: number;
    used: number;
    percentage: number;
  };
  disk: {
    fs: string;
    type: string;
    size: number;
    used: number;
    free: number;
    percentage: number;
  }[];
  uptime: number;
}

export enum Events {
  FILES_UPDATE = "FILES_UPDATE",
  FILE_DELETE = "FILE_DELETE",
  FILE_EDIT = "FILE_EDIT",

  SOCKET_OPEN = "SOCKET_OPEN",
}
