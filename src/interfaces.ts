export enum HeadphoneEventType {
  VOLUMEUP = "VOLUMEUP",
  VOLUMEDOWN = "VOLUMEDOWN",
  PLAY = "PLAY",
  PAUSE = "PAUSE",
  STOP = "STOP",
}

export enum StereoStatus {
  PLAYING = "Playing",
  PAUSED = "Paused",
  Stopped = "Stopped",
}

export interface MessageBroker {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  publish(topic: string, message: string): Promise<void>;
  subscribe(topic: string, callback: (message: string) => void): Promise<void>;
  unsubscribe(topic: string): Promise<void>;
}

export interface HeadphoneEvent {
  deviceId: number;
  event: HeadphoneEventType;
  timestamp: number;
}

export interface StereoState {
  deviceId: number;
  volume: number;
  status: StereoStatus;
  lastUpdate: number;
}
