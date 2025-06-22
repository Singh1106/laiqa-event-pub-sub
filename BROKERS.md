# Broker Setup

## Available Brokers

- Memory (in-memory, default)
- MQTT (via Mosquitto)
- Redis (via Redis server)

## Usage

1. Start broker services:

```bash
docker compose up -d
```

2. Run application with desired broker:

```bash
# Memory broker (default)
deno run start

# MQTT broker
export BROKER_TYPE=mqtt
deno run start

# Redis broker
export BROKER_TYPE=redis
deno run start
```

## Docker Services

### MQTT Broker

- Image: eclipse-mosquitto:2.0
- Port: 1883
- Container: mqtt-broker

### Redis Broker

- Image: redis:7-alpine
- Port: 6379
- Container: redis-broker
- Persistent data volume

## Stop Services

```bash
docker compose down
```
