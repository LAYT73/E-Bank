export class ConfigError extends Error {
  constructor(error: string) {
    super(`ConfigError: "${error}"`);
    this.name = 'ConfigError';
  }
}
