import { MessageBroker } from "../interfaces.ts";
import { createClient } from "npm:redis";
import { to } from "npm:await-to-js";

export class RedisBroker implements MessageBroker {
  private publisher: any = null;
  private subscriber: any = null;

  private connected = false;
  private url: string;

  constructor() {
    const host = Deno.env.get("REDIS_HOST") || "localhost";
    const port = parseInt(Deno.env.get("REDIS_PORT") || "6379");
    this.url = `redis://${host}:${port}`;
  }

  async connect(): Promise<void> {
    this.publisher = createClient({ url: this.url });
    this.subscriber = createClient({ url: this.url });

    const [errPublisher] = await to(this.publisher.connect());
    const [errSubscriber] = await to(this.subscriber.connect());

    if (errPublisher) {
      throw new Error(
        `Failed to initialize publisher: ${String(errPublisher)}`,
      );
    }
    if (errSubscriber) {
      throw new Error(
        `Failed to initialize subscriber: ${String(errSubscriber)}`,
      );
    }

    this.connected = true;
    console.log(`✓ Connected to Redis broker at ${this.url}`);
  }

  async disconnect(): Promise<void> {
    this.connected = false;

    if (this.publisher) {
      const [errPub] = await to(this.publisher.quit());
      if (errPub) {
        console.error("Error disconnecting publisher from Redis:", errPub);
      }
      this.publisher = null;
    }
    if (this.subscriber) {
      const [errSub] = await to(this.subscriber.quit());
      if (errSub) {
        console.error("Error disconnecting subscriber from Redis:", errSub);
      }
      this.subscriber = null;
    }

    console.log("✓ Disconnected from Redis broker");
  }

  async publish(topic: string, message: string): Promise<void> {
    if (!this.connected || !this.publisher) {
      throw new Error("Redis broker not connected");
    }

    const [err] = await to(this.publisher.publish(topic, message));
    if (err) {
      throw new Error(`Failed to publish to Redis: ${String(err)}`);
    }
  }

  async subscribe(
    topic: string,
    callback: (message: string) => void,
  ): Promise<void> {
    if (!this.connected || !this.subscriber) {
      throw new Error("Redis broker not connected");
    }

    const [err] = await to(
      this.subscriber.subscribe(topic, (message: string, channel: string) => {
        if (channel === topic) {
          callback(message);
        }
      }),
    );

    if (err) {
      throw new Error(`Failed to subscribe to Redis: ${String(err)}`);
    }
  }

  async unsubscribe(topic: string): Promise<void> {
    if (!this.connected || !this.subscriber) {
      throw new Error("Redis broker not connected");
    }

    const [err] = await to(this.subscriber.unsubscribe(topic));
    if (err) {
      throw new Error(`Failed to unsubscribe from Redis: ${String(err)}`);
    }
  }
}
