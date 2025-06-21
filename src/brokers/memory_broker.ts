// deno-lint-ignore-file require-await

import { MessageBroker } from "../interfaces.ts";

export class MemoryBroker implements MessageBroker {
  private connected = false;
  private subscriptions = new Map<string, (message: string) => void>();

  async connect(): Promise<void> {
    this.connected = true;
    console.log("✓ Connected to in-memory broker");
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.subscriptions.clear();
    console.log("✓ Disconnected from in-memory broker");
  }

  async publish(topic: string, message: string): Promise<void> {
    if (!this.connected) {
      throw new Error("Broker not connected");
    }

    const callback = this.subscriptions.get(topic);
    if (callback) {
      // Simulate async message delivery
      setTimeout(() => callback(message), 1);
    }
  }

  async subscribe(
    topic: string,
    callback: (message: string) => void,
  ): Promise<void> {
    if (!this.connected) {
      throw new Error("Broker not connected");
    }

    this.subscriptions.set(topic, callback);
  }

  async unsubscribe(topic: string): Promise<void> {
    if (!this.connected) {
      throw new Error("Broker not connected");
    }

    this.subscriptions.delete(topic);
  }
}
