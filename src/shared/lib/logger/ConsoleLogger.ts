import { type ILogger } from './ILogger';

export class ConsoleLogger implements ILogger {
  private getCallerInfo(): string {
    const stack = new Error().stack;
    if (!stack) return '';
    const lines = stack.split('\n');

    // 0 — "Error", 1 — вызов getCallerInfo, 2 — вызов info/warn/error, 3 — место вызова снаружи
    const callerLine = lines[3] ?? lines[2];

    // Пример строки: "at Object.<anonymous> (/path/to/file.ts:10:5)"
    const match = callerLine.match(/\((.*):(\d+):(\d+)\)/);
    if (!match) return callerLine.trim();
    const [, file, line, column] = match;
    return `${file}:${line}:${column}`;
  }

  info(message: string, meta?: Record<string, unknown>) {
    console.info('[INFO]', message, meta ?? '', this.getCallerInfo());
  }
  warn(message: string, meta?: Record<string, unknown>) {
    console.warn('[WARN]', message, meta ?? '', this.getCallerInfo());
  }
  error(message: string, meta?: Record<string, unknown>) {
    console.error('[ERROR]', message, meta ?? '', this.getCallerInfo());
  }
}
