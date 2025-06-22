import { MemoryBroker } from "../src/brokers/memory_broker.ts";
import { RedisBroker } from "../src/brokers/redis_broker.ts";
import { MessageBroker } from "../src/interfaces.ts";
import { MqttBroker } from "../src/brokers/mqtt_broker.ts";

export interface PerformanceMetrics {
  brokerType: string;
  throughput: number; // messages/sec
  avgLatency: number; // ms
  p95Latency: number; // ms
  maxLatency: number; // ms
  connectionTime: number; // ms
  errorRate: number; // percentage
}

export class BrokerPerformanceTester {
  private results: PerformanceMetrics[] = [];

  async testBroker(
    broker: MessageBroker,
    brokerType: string,
  ): Promise<PerformanceMetrics> {
    console.log(`\n🧪 Testing ${brokerType} Broker Performance...`);
    console.time(`[PERF] Total ${brokerType} test duration`);

    // 1. Connection Performance
    console.log(`[PERF] Starting connection test for ${brokerType}`);
    console.time(`[PERF] ${brokerType} connection time`);
    const connectionStart = performance.now();
    await broker.connect();
    const connectionTime = performance.now() - connectionStart;
    console.timeEnd(`[PERF] ${brokerType} connection time`);
    console.log(`[PERF] ${brokerType} connection took ${connectionTime.toFixed(2)}ms`);

    // 2. Throughput Test
    console.log(`[PERF] Starting throughput test for ${brokerType}`);
    console.time(`[PERF] ${brokerType} throughput test`);
    const throughputResult = await this.throughputTest(broker);
    console.timeEnd(`[PERF] ${brokerType} throughput test`);
    console.log(`[PERF] ${brokerType} throughput: ${throughputResult.messagesPerSecond.toFixed(0)} msg/s`);

    // 3. Latency Test
    console.log(`[PERF] Starting latency test for ${brokerType}`);
    console.time(`[PERF] ${brokerType} latency test`);
    const latencyResult = await this.latencyTest(broker);
    console.timeEnd(`[PERF] ${brokerType} latency test`);
    console.log(`[PERF] ${brokerType} avg latency: ${latencyResult.avgLatency.toFixed(2)}ms`);

    // 4. Error Rate Test
    console.log(`[PERF] Starting error rate test for ${brokerType}`);
    console.time(`[PERF] ${brokerType} error rate test`);
    const errorResult = await this.errorRateTest(broker);
    console.timeEnd(`[PERF] ${brokerType} error rate test`);
    console.log(`[PERF] ${brokerType} error rate: ${errorResult.errorRate.toFixed(2)}%`);

    console.log(`[PERF] Disconnecting ${brokerType} broker`);
    console.time(`[PERF] ${brokerType} disconnect time`);
    await broker.disconnect();
    console.timeEnd(`[PERF] ${brokerType} disconnect time`);

    console.timeEnd(`[PERF] Total ${brokerType} test duration`);

    return {
      brokerType,
      throughput: throughputResult.messagesPerSecond,
      avgLatency: latencyResult.avgLatency,
      p95Latency: latencyResult.p95Latency,
      maxLatency: latencyResult.maxLatency,
      connectionTime,
      errorRate: errorResult.errorRate,
    };
  }

  private async throughputTest(
    broker: MessageBroker,
  ): Promise<{ messagesPerSecond: number }> {
    console.log(`[PERF] Starting throughput test setup`);
    const messageCount = 10000;
    let receivedCount = 0;
    
    console.log(`[PERF] Setting up subscription for throughput test`);
    console.time(`[PERF] Throughput subscription setup`);
    await broker.subscribe("throughput-test", () => {
      receivedCount++;
      if (receivedCount % 1000 === 0) {
        console.log(`[PERF] Received ${receivedCount}/${messageCount} throughput messages`);
      }
    });
    console.timeEnd(`[PERF] Throughput subscription setup`);

    console.log(`[PERF] Starting to publish ${messageCount} messages`);
    const start = performance.now();
    console.time(`[PERF] Publishing ${messageCount} messages`);

    const publishPromises = [];
    for (let i = 0; i < messageCount; i++) {
      publishPromises.push(broker.publish("throughput-test", `message-${i}`));
      if (i % 1000 === 0) {
        console.log(`[PERF] Queued ${i}/${messageCount} publish operations`);
      }
    }

    console.log(`[PERF] Waiting for all publish operations to complete`);
    await Promise.all(publishPromises);
    console.timeEnd(`[PERF] Publishing ${messageCount} messages`);

    console.log(`[PERF] Waiting for message delivery completion`);
    console.time(`[PERF] Message delivery wait`);
    let waitCount = 0;
    while (receivedCount < messageCount) {
      await new Promise((resolve) => setTimeout(resolve, 1));
      waitCount++;
      if (waitCount % 100 === 0) {
        console.log(`[PERF] Still waiting... received ${receivedCount}/${messageCount} (waited ${waitCount}ms)`);
      }
    }
    console.timeEnd(`[PERF] Message delivery wait`);

    const duration = performance.now() - start;
    console.log(`[PERF] Throughput test completed in ${duration.toFixed(2)}ms`);

    return {
      messagesPerSecond: messageCount / (duration / 1000),
    };
  }

  private async latencyTest(broker: MessageBroker, iterations = 1000): Promise<{
    avgLatency: number;
    p95Latency: number;
    maxLatency: number;
  }> {
    console.log(`[PERF] Starting latency test with ${iterations} iterations`);
    const latencies: number[] = [];

    console.log(`[PERF] Setting up latency test subscription`);
    console.time(`[PERF] Latency subscription setup`);
    await broker.subscribe("latency-test", (message) => {
      const data = JSON.parse(message);
      const latency = Date.now() - data.timestamp;
      latencies.push(latency);
      if (latencies.length % 100 === 0) {
        console.log(`[PERF] Processed ${latencies.length}/${iterations} latency messages`);
      }
    });
    console.timeEnd(`[PERF] Latency subscription setup`);

    console.log(`[PERF] Publishing ${iterations} latency test messages`);
    console.time(`[PERF] Latency message publishing`);
    for (let i = 0; i < iterations; i++) {
      const timestamp = Date.now();
      await broker.publish(
        "latency-test",
        JSON.stringify({
          id: i,
          timestamp,
        }),
      );

      if (i % 100 === 0) {
        console.log(`[PERF] Published ${i}/${iterations} latency messages`);
        // Small delay to prevent overwhelming
        await new Promise((resolve) => setTimeout(resolve, 1));
      }
    }
    console.timeEnd(`[PERF] Latency message publishing`);

    console.log(`[PERF] Waiting for all latency responses`);
    console.time(`[PERF] Latency response wait`);
    let waitCount = 0;
    while (latencies.length < iterations) {
      await new Promise((resolve) => setTimeout(resolve, 1));
      waitCount++;
      if (waitCount % 100 === 0) {
        console.log(`[PERF] Waiting for latency responses... ${latencies.length}/${iterations} (waited ${waitCount}ms)`);
      }
    }
    console.timeEnd(`[PERF] Latency response wait`);

    console.log(`[PERF] Calculating latency statistics`);
    console.time(`[PERF] Latency calculation`);
    latencies.sort((a, b) => a - b);
    console.timeEnd(`[PERF] Latency calculation`);

    const avgLatency = latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length;
    const p95Latency = latencies[Math.floor(latencies.length * 0.95)];
    const maxLatency = Math.max(...latencies);

    console.log(`[PERF] Latency stats - Avg: ${avgLatency.toFixed(2)}ms, P95: ${p95Latency}ms, Max: ${maxLatency}ms`);

    return {
      avgLatency,
      p95Latency,
      maxLatency,
    };
  }

  private async errorRateTest(
    broker: MessageBroker,
  ): Promise<{ errorRate: number }> {
    console.log(`[PERF] Starting error rate test`);
    const totalOperations = 1000;
    let errors = 0;

    console.log(`[PERF] Testing ${totalOperations} publish operations for errors`);
    console.time(`[PERF] Error rate testing`);
    
    // Test publishing to non-existent topics
    for (let i = 0; i < totalOperations; i++) {
      try {
        await broker.publish(`error-test-${i}`, `message-${i}`);
      } catch (error) {
        errors++;
        console.log(`[PERF] Error ${errors} at operation ${i}:`, error);
      }
      if (i % 100 === 0) {
        console.log(`[PERF] Completed ${i}/${totalOperations} error test operations (${errors} errors so far)`);
      }
    }
    console.timeEnd(`[PERF] Error rate testing`);

    const errorRate = (errors / totalOperations) * 100;
    console.log(`[PERF] Error rate test completed: ${errors}/${totalOperations} errors (${errorRate.toFixed(2)}%)`);

    return {
      errorRate,
    };
  }

  printResults(): void {
    console.log("\n📊 BROKER PERFORMANCE COMPARISON RESULTS");
    console.log("=".repeat(80));

    const headers = [
      "Broker",
      "Throughput (msg/s)",
      "Avg Latency (ms)",
      "P95 Latency (ms)",
      "Connection (ms)",
      "Error Rate (%)",
    ];
    console.log(headers.join("\t| "));
    console.log("-".repeat(80));

    this.results.forEach((result) => {
      const row = [
        result.brokerType.padEnd(10),
        result.throughput.toFixed(0).padStart(10),
        result.avgLatency.toFixed(2).padStart(10),
        result.p95Latency.toFixed(2).padStart(10),
        result.connectionTime.toFixed(2).padStart(10),
        result.errorRate.toFixed(2).padStart(8),
      ];
      console.log(row.join("\t| "));
    });

    // Performance insights
    console.log("\n🔍 PERFORMANCE INSIGHTS:");

    const fastest = this.results.reduce((prev, current) =>
      prev.throughput > current.throughput ? prev : current
    );
    console.log(
      `🚀 Fastest Throughput: ${fastest.brokerType} (${
        fastest.throughput.toFixed(0)
      } msg/s)`,
    );

    const lowestLatency = this.results.reduce((prev, current) =>
      prev.avgLatency < current.avgLatency ? prev : current
    );
    console.log(
      `⚡ Lowest Latency: ${lowestLatency.brokerType} (${
        lowestLatency.avgLatency.toFixed(2)
      }ms)`,
    );

    const mostReliable = this.results.reduce((prev, current) =>
      prev.errorRate < current.errorRate ? prev : current
    );
    console.log(
      `🛡️  Most Reliable: ${mostReliable.brokerType} (${
        mostReliable.errorRate.toFixed(2)
      }% errors)`,
    );
  }

  addResult(result: PerformanceMetrics): void {
    this.results.push(result);
    console.log(`[PERF] Added result for ${result.brokerType} broker`);
  }
}

Deno.test("Broker Performance Comparison", async () => {
  console.log(`[PERF] Starting comprehensive broker performance comparison`);
  console.time(`[PERF] Total comparison test duration`);
  
  const tester = new BrokerPerformanceTester();
  const brokers = [
    { broker: new MemoryBroker(), name: "Memory" },
    { broker: new RedisBroker(), name: "Redis" },
    // { broker: new MqttBroker(), name: "MQTT" },
  ];

  for (const { broker, name } of brokers) {
    console.log(`[PERF] Testing ${name} broker`);
    console.time(`[PERF] ${name} broker total test`);
    try {
      const result = await tester.testBroker(broker, name);
      tester.addResult(result);
      console.log(`[PERF] ${name} broker test completed successfully`);
    } catch (error) {
      if (error instanceof Error) {
        console.log(`⚠️  ${name} broker not available:`, error.message);
        console.log(`[PERF] ${name} broker test failed:`, error.stack);
      } else {
        console.log(`⚠️  ${name} broker not available:`, error);
        console.log(`[PERF] ${name} broker test failed with unknown error`);
      }
    }
    console.timeEnd(`[PERF] ${name} broker total test`);
  }

  console.log(`[PERF] Printing final results`);
  tester.printResults();
  console.timeEnd(`[PERF] Total comparison test duration`);
});
