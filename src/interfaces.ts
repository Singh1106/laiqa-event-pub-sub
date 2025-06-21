export interface MessageBroker {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  publish(topic: string, message: string): Promise<void>;
  subscribe(topic: string, callback: (message: string) => void): Promise<void>;
  unsubscribe(topic: string): Promise<void>;
}

export interface HeadphoneEvent {
  deviceId: number;
  event: 'VOLUMEUP' | 'VOLUMEDOWN' | 'PLAY' | 'PAUSE' | 'STOP';
  timestamp: number;
}

export interface StereoState {
  deviceId: number;
  volume: number;
  status: 'Playing' | 'Paused' | 'Not Playing';
  lastUpdate: number;
}