export abstract class BaseClient {
  abstract disconnect(): Promise<void>
  abstract query<T = any>(command: string, ...args: any[]): Promise<T[]>
  abstract execute<T = any>(command: string, ...args: any[]): Promise<T[]>
}
