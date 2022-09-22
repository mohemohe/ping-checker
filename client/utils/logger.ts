import LogT, { LOG_LEVEL } from "logt";

export interface CustomLogT extends LogT {
  _setLogLevel: (level: LOG_LEVEL) => void;
}

export const original = {
  log: window.console.log,
  error: window.console.error,
  warn: window.console.warn,
  info: window.console.info,
};

const Logger: CustomLogT = new LogT("silly") as CustomLogT;
export default Logger;

function setLogLevelLog(level: string) {
  Logger[level as "warn"]("Logger", "setLogLevel changed:", level);
}

export function setLogLevel(level: LOG_LEVEL) {
  switch (level) {
    case "error":
      Logger._setLogLevel("error");
      setLogLevelLog("error");
      break;
    case "warn":
      Logger._setLogLevel("warn");
      setLogLevelLog("warn");
      break;
    case "info":
      Logger._setLogLevel("info");
      setLogLevelLog("info");
      break;
    case "verbose":
      Logger._setLogLevel("verbose");
      setLogLevelLog("verbose");
      break;
    case "debug":
      Logger._setLogLevel("debug");
      setLogLevelLog("debug");
      break;
    case "silly":
      Logger._setLogLevel("silly");
      setLogLevelLog("silly");
      break;
    default:
      Logger.error("Logger", `invalid log level: '${level}'. setLogLevel ignored. log level supports 'error', 'warn', 'info', 'verbose', 'debug' and 'silly'.`);
  }
}

(window as any).setLogLevel = setLogLevel;
Logger._setLogLevel = Logger.setLogLevel;
Logger.setLogLevel = setLogLevel;
Logger.readConsole();

Logger.info("Logger", "initialized.");