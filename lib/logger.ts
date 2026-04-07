import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

const SLOW_THRESHOLD = 300; // ms

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDev ? "debug" : "info"),
  ...(isDev
    ? {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            ignore: "pid,hostname",
            translateTime: "SYS:standard",
          },
        },
      }
    : {}),
});

export function logDB(operation: string, table: string, duration: number) {
  const isSlow = duration >= SLOW_THRESHOLD;
  const level = isSlow ? "warn" : "info";
  const prefix = isSlow ? "[SLOW DB]" : "[DB]";
  logger[level](
    { duration: `${duration}ms` },
    `${prefix} [${operation}] ${table} | ${duration}ms`
  );
}

export function logFetch(method: string, url: string, duration: number) {
  const isSlow = duration >= SLOW_THRESHOLD;
  const level = isSlow ? "warn" : "info";
  const prefix = isSlow ? "[SLOW FETCH]" : "[FETCH]";
  const displayUrl = url.replace(/^https?:\/\//, "").split("?")[0];
  logger[level](
    { url, duration: `${duration}ms` },
    `${prefix} [${method}] ${displayUrl} | ${duration}ms`
  );
}

export function logAction(
  name: string,
  duration: number,
  success: boolean = true
) {
  const isSlow = duration >= SLOW_THRESHOLD;
  const level = success ? (isSlow ? "warn" : "info") : "error";
  const prefix = success
    ? isSlow
      ? "[SLOW ACTION]"
      : "[ACTION]"
    : "[FAILED ACTION]";
  logger[level](
    { duration: `${duration}ms`, success },
    `${prefix} ${name} | ${duration}ms`
  );
}
