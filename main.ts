import { MemoryBroker } from "./src/brokers/memory_broker.ts";
import { MqttBroker } from "./src/brokers/mqtt_broker.ts";
import { RedisBroker } from "./src/brokers/redis_broker.ts";
import { StereoDashboard } from "./src/subscribers/dashboard.ts";
import { HeadphoneEventGenerator } from "./src/publishers/event_generator.ts";
import { MessageBroker } from "./src/interfaces.ts";

class Application {
  private broker: MessageBroker;
  private eventGenerator: HeadphoneEventGenerator;
  private dashboard: StereoDashboard;
  private isShuttingDown = false;

  constructor() {
    // Configure broker (easily swappable)
    const brokerType = Deno.env.get("BROKER_TYPE") || "mqtt";

    switch (brokerType.toLowerCase()) {
      case "memory":
        this.broker = new MemoryBroker();
        break;
      case "mqtt":
        this.broker = new MqttBroker();
        break;
      case "redis":
        this.broker = new RedisBroker();
        break;
      default:
        this.broker = new MemoryBroker();
        break;
    }

    this.eventGenerator = new HeadphoneEventGenerator(this.broker);
    this.dashboard = new StereoDashboard(this.broker);
  }

  async start(): Promise<void> {
    try {
      // Setup signal handlers first
      this.setupSignalHandlers();

      console.log("🚀 Starting Headphone-Stereo System...");

      // Connect to message broker
      await this.broker.connect();

      // Start dashboard first
      await this.dashboard.start();

      // Start event generation
      await this.eventGenerator.start();

      console.log("✅ System started successfully!");
      console.log('Press Ctrl+C or type "q" + Enter to exit gracefully');

      // Keep the process alive and listen for keyboard input
      await this.waitForShutdown();
    } catch (error) {
      console.error("❌ Failed to start system:", error);
      await this.shutdown();
      Deno.exit(1);
    }
  }

  private async waitForShutdown(): Promise<void> {
    // Listen for keyboard input
    const decoder = new TextDecoder();
    const buffer = new Uint8Array(1024);

    while (!this.isShuttingDown) {
      const n = await Deno.stdin.read(buffer);
      if (n === null) break;

      const input = decoder.decode(buffer.subarray(0, n)).trim().toLowerCase();
      if (input === "q" || input === "quit" || input === "exit") {
        console.log("\n🛑 Shutdown requested...");
        break;
      }
    }

    await this.shutdown();
  }

  private setupSignalHandlers(): void {
    // Handle Ctrl+C (SIGINT)
    Deno.addSignalListener("SIGINT", async () => {
      console.log("\n🛑 Received SIGINT (Ctrl+C), shutting down...");
      await this.shutdown();
      Deno.exit(0);
    });

    // Handle SIGTERM (termination request)
    Deno.addSignalListener("SIGTERM", async () => {
      console.log("\n🛑 Received SIGTERM, shutting down...");
      await this.shutdown();
      Deno.exit(0);
    });
  }

  private async shutdown(): Promise<void> {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;

    console.log("🔄 Shutting down system...");

    try {
      // Stop components in reverse order
      await this.eventGenerator.stop();
      await this.dashboard.stop();
      await this.broker.disconnect();

      console.log("✅ System shutdown complete");
    } catch (error) {
      console.error("❌ Error during shutdown:", error);
    }
  }
}

// Start the application
if (import.meta.main) {
  const app = new Application();
  await app.start();
}
