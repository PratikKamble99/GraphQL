import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: {
    target: "pino-pretty",
    options: { colorize: true }
  }
});


export function withTiming<T extends Function>(
  resolver: T,
  name: string
) {
  return async (...args: any[]) => {
    const start = Date.now();
    const result = await resolver(...args);
    const duration = Date.now() - start;

    logger.info({ resolver: name, duration }, "Resolver timing");

    return result;
  };
}