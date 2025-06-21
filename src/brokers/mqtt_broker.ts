// deno-lint-ignore-file require-await
import * as mqtt from "npm:mqtt";
import { MessageBroker } from "../interfaces.ts";

export class MqttBroker implements MessageBroker {
  private client: mqtt.MqttClient | null = null;
  private connected = false;
  private host: string;
  private port: number;
  private clientId: string;

  constructor() {
    this.host = Deno.env.get("MQTT_HOST") || "localhost";
    this.port = parseInt(Deno.env.get("MQTT_PORT") || "1883");
    this.clientId = Deno.env.get("MQTT_CLIENT_ID") || `deno_client_${Date.now()}`;
  }

  async connect(): Promise<void> {
    try {
      console.log(`🔄 Connecting to MQTT broker at mqtt://${this.host}:${this.port}...`);
      
      this.client = mqtt.connect(`mqtt://${this.host}:${this.port}`, {
        clientId: this.clientId,
        clean: true,
        keepalive: 60,
      });

      return new Promise((resolve, reject) => {
        this.client!.on('connect', () => {
          console.log(`🔄 Connected to MQTT broker at mqtt://${this.host}:${this.port} successfully.`);
          this.connected = true;
          resolve();
        });

        this.client!.on('error', (error) => {
          reject(new Error(`Failed to connect to MQTT broker: ${error}`));
        });
      });
    } catch (error) {
      throw new Error(`Failed to connect to MQTT broker: ${error}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      return new Promise((resolve) => {
        this.client!.end(false, {}, () => {
          this.client = null;
          this.connected = false;
          console.log("✓ Disconnected from MQTT broker");
          resolve();
        });
      });
    }
    this.connected = false;
  }

  async publish(topic: string, message: string): Promise<void> {
    if (!this.connected || !this.client) {
      throw new Error("MQTT broker not connected");
    }

    return new Promise((resolve, reject) => {
      this.client!.publish(topic, message, { qos: 0 }, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  async subscribe(topic: string, callback: (message: string) => void): Promise<void> {
    if (!this.connected || !this.client) {
      throw new Error("MQTT broker not connected");
    }

    return new Promise((resolve, reject) => {
      this.client!.subscribe(topic, { qos: 1 }, (error) => {
        if (error) {
          reject(error);
        } else {
          this.client!.on('message', (receivedTopic, payload) => {
            if (receivedTopic === topic) {
              callback(payload.toString());
            }
          });
          resolve();
        }
      });
    });
  }

  async unsubscribe(topic: string): Promise<void> {
    if (!this.connected || !this.client) {
      throw new Error("MQTT broker not connected");
    }

    return new Promise((resolve, reject) => {
      this.client!.unsubscribe(topic, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }
}