import EventEmitter from "events";

export interface RatingData {
  rating_agency_name: string;
  file_creating_date: string;
  sec_category: string;
  issuer_name: string;
  legal_entity_identifier: string;
  object_type_rated: string;
  instrument_name: string;
  CUSIP_number: string;
  coupon_date?: string;
  maturity_date?: string;
  par_value?: string;
  issued_paid?: string;
  rating?: string;
  rating_action_date?: string;
  rating_action_class?: string;
  rating_type?: string;
  rating_sub_type?: string;
  rating_type_term?: string;
  other_announcement_type?: string;
  watch_status?: string;
  rating_outlook?: string;
  issuer_identifier?: string;
  issuer_identifier_schema?: string;
  instrument_identifier?: string;
  instrument_identifier_schema?: string;
  central_index_key?: string;
  obligor_identifier?: string;
  obligor_identifier_schema?: string;
  obligor_identifier_other?: string;
  obligor_sec_category?: string;
  obligor_industry_group?: string;
  obligor_name?: string;
}

export interface InstrumentData {
  [key: string]: string | undefined;
}

export type CustomHeaders = {
  [key: string]: string;
};

export type AgencyFunction = (
  abortController: AbortController,
  eventEmitter: EventEmitter
) => Promise<unknown>;

export interface AgenciesMap {
  [key: string]: AgencyFunction;
}

export interface FileMetadata {
  name: string;
  date: string;
  lines: number;
  size: number;
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

export interface Message {
  type: string;
  message: string;
  [key: string]: string;
}
export enum Events {
  AGENCY_MESSAGE = "AGENCY_MESSAGE",
  AGENCIES_UPDATE = "AGENCIES_UPDATE",

  UPLOAD_MESSAGE = "UPLOAD_MESSAGE",
  UPLOAD_UPDATE = "UPLOAD_UPDATE",
  
  SYSTEM_INFO = "SYSTEM_INFO",
}

export enum TaskerEvents {
  AGENCY_TASK = "agency",
  UPLOAD_TASK = "file",
}
