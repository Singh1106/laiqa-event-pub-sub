import { MessageBroker } from "../interfaces.ts";
import { createClient } from "npm:redis";

export class RedisBroker implements MessageBroker {
  private client: any = null;
  private connected = false;
  private url: string;

  constructor(host = "localhost", port = 6379) {
    this.url = `redis://${host}:${port}`;
  }

  async connect(): Promise<void> {
    try {
      this.client = createClient({ url: this.url });
      await this.client.connect();

      this.connected = true;
      console.log(`✓ Connected to Redis broker at ${this.url}`);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to connect to Redis: ${error.message}`);
      } else {
        throw new Error(`Failed to connect to Redis: ${String(error)}`);
      }
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false;

    try {
      if (this.client) {
        await this.client.quit();
        this.client = null;
      }

      console.log("✓ Disconnected from Redis broker");
    } catch (error) {
      console.error("Error disconnecting from Redis:", error);
    }
  }

  async publish(topic: string, message: string): Promise<void> {
    if (!this.connected || !this.client) {
      throw new Error("Redis broker not connected");
    }

    try {
      await this.client.publish(topic, message);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to connect to Redis: ${error.message}`);
      } else {
        throw new Error(`Failed to connect to Redis: ${String(error)}`);
      }
    }
  }

  async subscribe(
    topic: string,
    callback: (message: string) => void,
  ): Promise<void> {
    if (!this.connected || !this.client) {
      throw new Error("Redis broker not connected");
    }

    try {
      await this.client.subscribe(topic, (message: string, channel: string) => {
        if (channel === topic) {
          callback(message);
        }
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to connect to Redis: ${error.message}`);
      } else {
        throw new Error(`Failed to connect to Redis: ${String(error)}`);
      }
    }
  }

  async unsubscribe(topic: string): Promise<void> {
    if (!this.connected || !this.client) {
      throw new Error("Redis broker not connected");
    }

    try {
      await this.client.unsubscribe(topic);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to connect to Redis: ${error.message}`);
      } else {
        throw new Error(`Failed to connect to Redis: ${String(error)}`);
      }
    }
  }
}
