declare interface LogMessage {
  error?: Error;
  level?: string;
  message?: string;
  [key: string]: unknown;
}
