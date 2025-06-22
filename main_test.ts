import { assertEquals } from "@std/assert";
import { MemoryBroker } from "./src/brokers/memory_broker.ts";
import { HeadphoneEventType } from "./src/interfaces.ts";
import { HeadphoneEventGenerator } from "./src/publishers/event_generator.ts";
import { StereoDashboard } from "./src/subscribers/dashboard.ts";
// Test 1: Broker Connection (Essential)
Deno.test("MemoryBroker - connects and disconnects", async () => {
  const broker = new MemoryBroker();
  await broker.connect();
  await broker.disconnect();
});

// Test 2: Event Publishing (Core Logic)
Deno.test("MemoryBroker - publishes to subscriber", async () => {
  const broker = new MemoryBroker();
  await broker.connect();
  
  let receivedMessage = "";
  await broker.subscribe("test", (msg) => {
    receivedMessage = msg;
  });
  
  await broker.publish("test", "hello");
  
  // Wait for async delivery
  await new Promise(resolve => setTimeout(resolve, 10));
  
  assertEquals(receivedMessage, "hello");
  await broker.disconnect();
});

// Test 3: Volume Logic (Business Rules)
Deno.test("Dashboard - handles volume events correctly", async () => {
  const broker = new MemoryBroker();
  await broker.connect();
  
  const dashboard = new StereoDashboard(broker, 1);
  await dashboard.start();
  
  // Simulate volume up event
  const volumeEvent = {
    deviceId: 1,
    event: HeadphoneEventType.VOLUMEUP,
    timestamp: Date.now()
  };
  
  await broker.publish("headphone/1", JSON.stringify(volumeEvent));
  await new Promise(resolve => setTimeout(resolve, 10));
  
  await dashboard.stop();
  await broker.disconnect();
});

// Test 4: Event Generator (Integration)
Deno.test("HeadphoneEventGenerator - starts and stops", async () => {
  const broker = new MemoryBroker();
  await broker.connect();
  
  const generator = new HeadphoneEventGenerator(broker, 1);
  await generator.start();
  await generator.stop();
  
  await broker.disconnect();
});

// Test 5: Error Handling (Interview Favorite)
Deno.test("MemoryBroker - throws when not connected", async () => {
  const broker = new MemoryBroker();
  
  try {
    await broker.publish("test", "msg");
    throw new Error("Should have thrown");
  } catch (error) {
    if(error instanceof Error){
      assertEquals(error.message, "Broker not connected");
      return;
    }
    throw new Error("Should have caught an Error error");
  }
});



// Integration test - end-to-end flow
Deno.test("Integration - headphone event affects stereo state", async () => {
  const broker = new MemoryBroker();
  await broker.connect();
  
  let stereoVolume = 5; // default
  
  // Subscribe to events like dashboard would
  await broker.subscribe("headphone/1", (message) => {
    const event = JSON.parse(message);
    if (event.event === HeadphoneEventType.VOLUMEUP) {
      stereoVolume = Math.min(stereoVolume + 1, 10);
    }
  });
  
  // Publish event like generator would
  const event = {
    deviceId: 1,
    event: HeadphoneEventType.VOLUMEUP,
    timestamp: Date.now()
  };
  
  await broker.publish("headphone/1", JSON.stringify(event));
  await new Promise(resolve => setTimeout(resolve, 10));
  
  assertEquals(stereoVolume, 6);
  await broker.disconnect();
});

// Performance test (simple)
Deno.test("Performance - handles multiple events", async () => {
  const broker = new MemoryBroker();
  await broker.connect();
  
  let eventCount = 0;
  await broker.subscribe("test", () => eventCount++);
  
  const start = Date.now();
  
  // Send 100 events
  for (let i = 0; i < 1000000; i++) {
    await broker.publish("test", `message-${i}`);
  }
  
  await new Promise(resolve => setTimeout(resolve, 1));
  // why is this needed. At 0 it is failing.
  
  const duration = Date.now() - start;
  
  assertEquals(eventCount, 1000000);
  console.log(`Processed 1000000 events in ${duration}ms`);
  
  await broker.disconnect();
});

