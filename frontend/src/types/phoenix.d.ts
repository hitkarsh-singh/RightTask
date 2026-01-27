declare module 'phoenix' {
  export class Socket {
    constructor(endpoint: string, opts?: any);
    connect(): void;
    disconnect(): void;
    channel(topic: string, params?: any): Channel;
  }

  export interface Channel {
    join(): Push;
    leave(): Push;
    on(event: string, callback: (payload: any) => void): void;
    off(event: string): void;
    push(event: string, payload: any): Push;
  }

  export interface Push {
    receive(status: string, callback: (response: any) => void): Push;
  }
}
