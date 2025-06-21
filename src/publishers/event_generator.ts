// deno-lint-ignore-file require-await
import { HeadphoneEvent, MessageBroker } from "../interfaces.ts";

export class HeadphoneEventGenerator {
  private intervalIds: number[] = [];
  private isRunning = false;

  constructor(
    private broker: MessageBroker,
    private deviceCount = 10
  ) {}

  async start(): Promise<void> {
    if (this.isRunning) return;

    this.isRunning = true;
    console.log(`🎧 Starting ${this.deviceCount} headphone simulators...`);

    for (let deviceId = 1; deviceId <= this.deviceCount; deviceId++) {
      this.startDeviceSimulation(deviceId);
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) return;

    this.isRunning = false;
    this.intervalIds.forEach(id => clearInterval(id));
    this.intervalIds = [];
    console.log('🛑 Stopped all headphone simulators');
  }

  private startDeviceSimulation(deviceId: number): void {
    const events: HeadphoneEvent['event'][] = ['VOLUMEUP', 'VOLUMEDOWN', 'PLAY', 'PAUSE', 'STOP'];
    
    const generateEvent = async () => {
      if (!this.isRunning) return;

      const event: HeadphoneEvent = {
        deviceId,
        event: events[Math.floor(Math.random() * events.length)],
        timestamp: Date.now()
      };

      try {
        await this.broker.publish(`headphone/${deviceId}`, JSON.stringify(event));
      } catch (error) {
        console.error(`Failed to publish event for device ${deviceId}:`, error);
      }

      // Schedule next event (3-10 seconds)
      const nextInterval = 3000 + Math.random() * 7000;
      const timeoutId = setTimeout(generateEvent, nextInterval);
      this.intervalIds.push(timeoutId as unknown as number);
    };

    // Start with initial delay
    const initialDelay = Math.random() * 2000;
    const timeoutId = setTimeout(generateEvent, initialDelay);
    this.intervalIds.push(timeoutId as unknown as number);
  }
}