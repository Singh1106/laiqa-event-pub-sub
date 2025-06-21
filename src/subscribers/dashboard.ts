// dashboard.ts - Terminal-based stereo dashboard
import { type MessageBroker, type HeadphoneEvent, type StereoState, StereoStatus, HeadphoneEventType } from "../interfaces.ts";

export class StereoDashboard {
  private stereos = new Map<number, StereoState>();
  private isRunning = false;
  private updateInterval: number | null = null;

  constructor(
    private broker: MessageBroker,
    private deviceCount = (Deno.env.get('DEVICE_COUNT') || 10) as number
  ) {
    // Initialize stereo states
    for (let i = 1; i <= deviceCount; i++) {
      this.stereos.set(i, {
        deviceId: i,
        volume: 5,
        status: StereoStatus.Stopped,
        lastUpdate: Date.now()
      });
    }
  }

  async start(): Promise<void> {
    if (this.isRunning) return;

    this.isRunning = true;
    console.log('🎵 Starting stereo dashboard...');

    // Subscribe to all device channels
    for (let deviceId = 1; deviceId <= this.deviceCount; deviceId++) {
      await this.broker.subscribe(`headphone/${deviceId}`, (message) => {
        this.handleHeadphoneEvent(message);
      });
    }

    // Start display update loop
    this.updateInterval = setInterval(() => {
      this.renderDashboard();
    }, 1000);

    // Initial render
    this.renderDashboard();
  }

  async stop(): Promise<void> {
    if (!this.isRunning) return;

    this.isRunning = false;

    // Unsubscribe from all channels
    for (let deviceId = 1; deviceId <= this.deviceCount; deviceId++) {
      await this.broker.unsubscribe(`headphone/${deviceId}`);
    }

    // Stop update loop
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    console.log('🛑 Stopped stereo dashboard');
  }

  private handleHeadphoneEvent(message: string): void {
    try {
      const event: HeadphoneEvent = JSON.parse(message);
      const stereo = this.stereos.get(event.deviceId);
      
      if (!stereo) return;

      // Update stereo state based on event
      switch (event.event) {
        case HeadphoneEventType.VOLUMEUP:
          stereo.volume = Math.min(stereo.volume + 1, 10);
          break;
        case HeadphoneEventType.VOLUMEDOWN:
          stereo.volume = Math.max(stereo.volume - 1, 0);
          break;
        case HeadphoneEventType.PLAY:
          stereo.status = StereoStatus.PLAYING;
          break;
        case HeadphoneEventType.PAUSE:
          stereo.status = StereoStatus.PAUSED;
          break;
        case HeadphoneEventType.STOP:
          stereo.status = StereoStatus.Stopped;
          break;
      }

      stereo.lastUpdate = event.timestamp;
      this.stereos.set(event.deviceId, stereo);
    } catch (error) {
      console.error('Failed to parse headphone event:', error);
    }
  }

  private renderDashboard(): void {
    // Clear screen
    console.clear();
    
    console.log('🎵 STEREO DASHBOARD 🎵');
    console.log('═'.repeat(60));
    console.log('');

    // Header
    console.log('Device | Volume | Status      | Last Update');
    console.log('─'.repeat(60));

    // Stereo states
    for (let i = 1; i <= this.deviceCount; i++) {
      const stereo = this.stereos.get(i)!;
      const timeSinceUpdate = Math.floor((Date.now() - stereo.lastUpdate) / 1000);
      const volumeBar = '█'.repeat(stereo.volume) + '░'.repeat(10 - stereo.volume);
      
      console.log(
        `  ${i.toString().padStart(2)}   | ${volumeBar} | ${stereo.status.padEnd(11)} | ${timeSinceUpdate}s ago`
      );
    }

    console.log();
    console.log('─'.repeat(60));
    console.log('Press Ctrl+C or "q" + Enter to exit');
  }
}