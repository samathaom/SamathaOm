---
title: Distributed Microservices Pipeline
thumbnail: /images/Shirdi Sai DTP.jpg
date: 2026-05-16
tags:
  - Python
  - FastAPI
  - Docker
  - AWS
---
### Architecture Overview

This project targets high-throughput telemetry data ingestion. By utilizing an asynchronous framework pattern, we reduced running execution overhead down to zero-cost idle limits.

#### Core Tech Stack

- **Python / FastAPI**: Core API data worker processes.
- **Docker**: Containerized deployment pipelines.

#### Key Engineering Metrics

- **Zero Overhead**: Scales to zero compute usage when processing idle states.
- **Sub-50ms Latency**: Native async execution event-loops.

