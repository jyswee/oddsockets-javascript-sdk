import { EventEmitter } from 'eventemitter3';

export interface OddSocketsConfig {
  apiKey: string;
  managerUrl: string;
  userId?: string;
  options?: any;
  autoConnect?: boolean;
}

export interface WorkerInfo {
  workerId: string;
  workerUrl: string;
}

export interface SessionInfo {
  isExisting?: boolean;
  ageMs?: number;
  workerId?: string;
}

export interface MessageOptions {
  ttl?: number;
  metadata?: Record<string, any>;
}

export interface SubscriptionOptions {
  maxHistory?: number;
  retainHistory?: boolean;
  enablePresence?: boolean;
}

export interface HistoryOptions {
  count?: number;
  start?: string;
  end?: string;
}

export interface BulkMessage {
  channel: string;
  message: any;
  options?: MessageOptions;
}

export interface BulkResult {
  success: boolean;
  result?: any;
  error?: string;
}

export interface PresenceData {
  occupancy: number;
  occupants?: Array<{
    userId: string;
    state?: any;
  }>;
}

export interface MessageData {
  channel: string;
  message: any;
  publisher?: {
    userId: string;
  };
  timestamp: string;
}

export declare class Channel extends EventEmitter {
  constructor(name: string, client: OddSockets);
  
  readonly name: string;
  
  subscribe(callback: (message: MessageData) => void, options?: SubscriptionOptions): Promise<void>;
  unsubscribe(): Promise<void>;
  publish(message: any, options?: MessageOptions): Promise<any>;
  getHistory(options?: HistoryOptions): Promise<MessageData[]>;
  getPresence(): Promise<PresenceData>;
  updateState(state: any): Promise<void>;
  
  isSubscribed(): boolean;
  getName(): string;
  getPresenceMap(): Map<string, any>;
  getCachedHistory(): MessageData[];
}

export declare class OddSockets extends EventEmitter {
  constructor(config: OddSocketsConfig);
  
  connect(): Promise<void>;
  disconnect(): void;
  
  channel(channelName: string): Channel;
  
  getState(): 'disconnected' | 'connecting' | 'connected' | 'reconnecting';
  getWorkerInfo(): WorkerInfo | null;
  getClientIdentifier(): string;
  getSessionInfo(): SessionInfo | null;
  
  publishBulk(messages: BulkMessage[]): Promise<BulkResult[]>;
  
  // Events
  on(event: 'connecting', listener: () => void): this;
  on(event: 'connected', listener: () => void): this;
  on(event: 'disconnected', listener: (reason?: string) => void): this;
  on(event: 'error', listener: (error: Error) => void): this;
  on(event: 'reconnecting', listener: (data: { attempt: number; maxAttempts: number; delay: number }) => void): this;
  on(event: 'max_reconnect_attempts_reached', listener: () => void): this;
  on(event: 'worker_assigned', listener: (data: { workerId: string; workerUrl: string; session?: SessionInfo; clientIdentifier: string }) => void): this;
  on(event: string, listener: (...args: any[]) => void): this;
}

export interface PubNubCompatConfig {
  publishKey: string;
  subscribeKey: string;
  managerUrl: string;
  userId?: string;
  options?: any;
}

export declare class PubNubCompat extends EventEmitter {
  constructor(config: PubNubCompatConfig);
  
  subscribe(params: { channels: string | string[]; withPresence?: boolean; timetoken?: number }): void;
  unsubscribe(params: { channels: string | string[] }): void;
  publish(params: { channel: string; message: any; meta?: any }, callback?: (response: any) => void): Promise<any>;
  history(params: { channel: string; count?: number; start?: number; end?: number }, callback?: (response: any) => void): Promise<any>;
  hereNow(params: { channels: string | string[] }, callback?: (response: any) => void): Promise<any>;
  setState(params: { channels: string | string[]; state: any }, callback?: (response: any) => void): Promise<any>;
  
  addListener(listener: any): void;
  removeListener(listener: any): void;
  removeAllListeners(): void;
  
  disconnect(): void;
  reconnect(): void;
  getSubscribedChannels(): string[];
}

export declare function create(config: OddSocketsConfig): OddSockets;
export declare function createPubNubCompat(config: any): PubNubCompat;

export declare const version: string;

export default OddSockets;
