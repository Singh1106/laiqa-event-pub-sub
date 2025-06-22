# Headphone-Stereo System

A publisher-subscriber messaging system with pluggable broker architecture for Deno. The system includes a headphone event generator (publisher) and stereo dashboard (consumer) with support for multiple message brokers.

## Features

- **Publisher-Subscriber Pattern**: Event generator publishes headphone events, dashboard consumes them
- **Pluggable Broker System**: Easy switching between Memory, MQTT, and Redis brokers
- **Scalable Architecture**: Support for multiple device simulation
- **Docker Integration**: Containerized broker services
- **Performance Testing**: Built-in testing capabilities

## Available Brokers

- **Memory Broker**: In-memory messaging (default)
- **MQTT Broker**: Via Eclipse Mosquitto
- **Redis Broker**: Via Redis server

## Prerequisites

- Docker and Docker Compose
- Deno runtime

## Environment Variables

Create a `.env` file with the following variables:

```env
BROKER_TYPE=redis          # Options: memory, mqtt, redis
DEVICE_COUNT=10           # Number of simulated devices

# MQTT Configuration
MQTT_HOST=127.0.0.1
MQTT_PORT=1883
MQTT_CLIENT_ID=headphone_stereo_client

# Redis Configuration
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

## Setup & Usage

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd <project-directory>
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your preferred settings
   ```

3. **Start broker services** (only for MQTT/Redis brokers)
   ```bash
   # Skip this step if using memory broker
   docker compose up -d
   ```

4. **Run the application**
   ```bash
   deno run start
   ```

5. **Performance testing**
   ```bash
   deno run test
   ```

## Broker Configuration

Switch between brokers by updating the `BROKER_TYPE` environment variable:

```bash
# Memory broker (no Docker required)
BROKER_TYPE=memory

# MQTT broker (requires Docker)
BROKER_TYPE=mqtt

# Redis broker (requires Docker)
BROKER_TYPE=redis
```

## Docker Services

Required only for MQTT and Redis brokers:

- **MQTT Broker**: eclipse-mosquitto:2.0 on port 1883
- **Redis Broker**: redis:7-alpine on port 6379 with persistent storage

### Starting Services
```bash
docker compose up -d
```

### Stopping Services
```bash
docker compose down
```

## Architecture

The system follows a clean architecture with:
- Message brokers implementing a common interface
- Publishers generating events
- Subscribers consuming events
- Easy broker switching via environment configuration