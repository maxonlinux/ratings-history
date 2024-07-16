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

export enum Events {
  FILES_UPDATE = "FILES_UPDATE",
  FILE_DELETE = "FILE_DELETE",
  FILE_EDIT = "FILE_EDIT",
}
