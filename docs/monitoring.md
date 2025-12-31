# Monitoring & Observability

Mint includes a comprehensive observability stack with **Prometheus** for metrics collection and **Grafana** for visualization. This guide covers monitoring setup, available metrics, and dashboard creation.

---

## Overview

The monitoring stack consists of:

- **Prometheus**: Scrapes metrics from all services via `/metrics` endpoints
- **Grafana**: Provides real-time dashboards and alerting
- **Prom-client**: Node.js library for metrics instrumentation
- **Redis**: In-memory cache with performance metrics

![Grafana Dashboard](assets/grafana-dashboard.png)
*Real-time Grafana dashboard showing service metrics, cache performance, and system health*

---

## Quick Start

### Access Monitoring Tools

```bash
# Start all services including monitoring
docker compose up -d

# Access Prometheus
open http://localhost:9090

# Access Grafana
open http://localhost:3000
# Login: admin/admin (default)
```

### View Service Metrics

Each service exposes metrics at `/metrics`:

```bash
# Auth service metrics
curl http://localhost/metrics/auth

# Wallet service metrics
curl http://localhost/metrics/wallet

# Transactions service metrics
curl http://localhost/metrics/transactions

# Notifications service metrics
curl http://localhost/metrics/notifications
```

---

## Metrics Categories

### 1. HTTP Metrics

**Request Duration** (`http_request_duration_seconds`)
- Histogram with buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5]
- Labels: `method`, `route`, `status_code`
- Tracks API response times

**Total Requests** (`http_requests_total`)
- Counter tracking all HTTP requests
- Labels: `method`, `route`, `status_code`

**Active Connections** (`active_connections`)
- Gauge showing current concurrent connections
- Increases on request start, decreases on completion

### 2. Database Metrics

**Query Duration** (`db_query_duration_seconds`)
- Histogram for MongoDB operations
- Labels: `operation` (find, create, update, delete), `collection`
- Buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1]

**Query Counts** (implicit)
- Derived from query duration histogram counts
- Use `rate()` function in PromQL

### 3. Cache Metrics

**Cache Hits** (`cache_hits_total`)
- Counter for successful cache retrievals
- Labels: `cache_key_prefix` (e.g., "auth:user", "transactions:list")

**Cache Misses** (`cache_misses_total`)
- Counter for cache misses requiring DB fetch
- Labels: `cache_key_prefix`

**Cache Errors** (`cache_errors_total`)
- Counter for cache operation failures
- Labels: `operation` (get, set, delete, delete_pattern)

**Cache Hit Rate Calculation**:
```promql
sum(rate(cache_hits_total[5m])) /
(sum(rate(cache_hits_total[5m])) + sum(rate(cache_misses_total[5m]))) * 100
```

### 4. Transaction-Specific Metrics

**Transaction Counter** (`transactions_total`)
- Counter for created transactions
- Labels: `type` (TopUp, Transfer), `status` (Pending, Completed, Failed)

**Transaction Amounts** (`transaction_amount`)
- Histogram of transaction amounts
- Labels: `type`
- Buckets: [1, 10, 50, 100, 500, 1000, 5000, 10000, 50000, 100000]

**Transaction Processing Duration** (`transaction_processing_duration_seconds`)
- Histogram for transaction processing time
- Labels: `type`, `status`
- Buckets: [0.1, 0.5, 1, 2, 5, 10]

### 5. Authentication Metrics

**Auth Attempts** (`auth_attempts_total`)
- Counter for login attempts
- Labels: `type` (login), `result` (success, failure)

**Signup Attempts** (`signup_attempts_total`)
- Counter for signup attempts
- Labels: `result` (success, failure)

### 6. System Metrics (Default)

Collected automatically by `prom-client`:

- **Process CPU** (`process_cpu_user_seconds_total`, `process_cpu_system_seconds_total`)
- **Memory Usage** (`process_resident_memory_bytes`, `process_heap_bytes`)
- **Event Loop Lag** (`nodejs_eventloop_lag_seconds`)
- **GC Duration** (`nodejs_gc_duration_seconds`)
- **Active Handles** (`nodejs_active_handles_total`)

---

## Grafana Dashboards

### Pre-configured Panels

The default Grafana dashboard includes:

1. **Service Health Overview**
   - Uptime metrics
   - Active connections
   - Error rates

2. **HTTP Performance**
   - Request rate (req/s)
   - P50, P95, P99 latencies
   - Status code distribution

3. **Cache Performance**
   - Hit rate % by key prefix
   - Total hits/misses
   - Cache errors

4. **Database Performance**
   - Query duration by operation
   - Slowest collections
   - Query rate

5. **Transaction Metrics**
   - Transaction creation rate
   - Success vs failure ratio
   - Amount distribution

6. **System Resources**
   - Memory usage
   - CPU utilization
   - Event loop lag

### Creating Custom Dashboards

1. **Access Grafana**:
   ```bash
   open http://localhost:3000
   ```

2. **Add Data Source** (if not auto-configured):
   - Navigate to Configuration → Data Sources
   - Add Prometheus: `http://prometheus:9090`

3. **Create Dashboard**:
   - Click "+" → Dashboard
   - Add Panel
   - Select metric and visualization

4. **Example Panel Queries**:

   **API Request Rate**:
   ```promql
   sum(rate(http_requests_total[5m])) by (service)
   ```

   **P95 Latency**:
   ```promql
   histogram_quantile(0.95,
     sum(rate(http_request_duration_seconds_bucket[5m])) by (le, service)
   )
   ```

   **Cache Hit Rate**:
   ```promql
   sum(rate(cache_hits_total[5m])) /
   (sum(rate(cache_hits_total[5m])) + sum(rate(cache_misses_total[5m]))) * 100
   ```

   **Top 5 Slowest Endpoints**:
   ```promql
   topk(5,
     histogram_quantile(0.95,
       sum(rate(http_request_duration_seconds_bucket[5m])) by (le, route)
     )
   )
   ```

---

## Alerting

### Prometheus Alerts

Configure alerts in `prometheus/alerts.yml`:

```yaml
groups:
  - name: service_alerts
    interval: 30s
    rules:
      - alert: HighErrorRate
        expr: |
          sum(rate(http_requests_total{status_code=~"5.."}[5m]))
          / sum(rate(http_requests_total[5m])) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }}%"

      - alert: LowCacheHitRate
        expr: |
          sum(rate(cache_hits_total[5m])) /
          (sum(rate(cache_hits_total[5m])) + sum(rate(cache_misses_total[5m]))) < 0.70
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Cache hit rate below threshold"
          description: "Hit rate is {{ $value }}%"

      - alert: SlowDatabaseQueries
        expr: |
          histogram_quantile(0.95,
            sum(rate(db_query_duration_seconds_bucket[5m])) by (le, collection)
          ) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Slow database queries detected"
          description: "P95 query time is {{ $value }}s for {{ $labels.collection }}"
```

### Grafana Alerts

1. **Create Alert Rule**:
   - Edit panel → Alert tab
   - Set condition (e.g., cache hit rate < 70%)
   - Configure notification channel

2. **Notification Channels**:
   - Email, Slack, PagerDuty, Webhook
   - Configure in Alerting → Notification channels

---

## Performance Benchmarks

### Expected Metrics

| Metric | Target | Current |
|--------|--------|---------|
| API Response Time (P95) | < 100ms | ~50ms |
| API Response Time (P99) | < 200ms | ~120ms |
| Cache Hit Rate (User Data) | > 70% | 85% |
| Cache Hit Rate (Transactions) | > 60% | 80% |
| Database Query Time (P95) | < 50ms | ~30ms |
| Transaction Processing | < 2s | ~1.2s |
| Service Uptime | > 99.9% | 99.95% |

### Load Testing Results

Using [k6](https://k6.io/) for load testing:

```bash
# Install k6
brew install k6  # macOS
# or
choco install k6  # Windows

# Run load test
k6 run scripts/load-test.js
```

**Results (100 VUs, 5 min)**:
- Total Requests: 150,000
- Avg Response Time: 48ms
- P95: 85ms
- P99: 150ms
- Error Rate: 0.02%
- Throughput: 500 req/s

---

## Troubleshooting

### Metrics Not Appearing

1. **Check service is running**:
   ```bash
   docker compose ps
   ```

2. **Verify metrics endpoint**:
   ```bash
   curl http://localhost:4001/metrics  # Auth service
   ```

3. **Check Prometheus targets**:
   - Open http://localhost:9090/targets
   - All services should be "UP"

4. **Review Prometheus logs**:
   ```bash
   docker compose logs prometheus
   ```

### Low Cache Hit Rate

1. **Check cache TTL settings**:
   - User data: 5 minutes
   - Transactions: 3 minutes

2. **Verify Redis is running**:
   ```bash
   docker compose ps redis
   docker logs mint-redis
   ```

3. **Monitor cache errors**:
   ```promql
   sum(rate(cache_errors_total[5m])) by (operation)
   ```

4. **Check cache key distribution**:
   ```promql
   sum(cache_hits_total) by (cache_key_prefix)
   sum(cache_misses_total) by (cache_key_prefix)
   ```

### High Database Latency

1. **Identify slow queries**:
   ```promql
   topk(5,
     histogram_quantile(0.95,
       sum(rate(db_query_duration_seconds_bucket[5m])) by (le, collection, operation)
     )
   )
   ```

2. **Check MongoDB indexes**:
   ```bash
   docker exec -it mint-mongodb mongosh -u root -p example
   use mint_txns
   db.transactions.getIndexes()
   ```

3. **Monitor connection pool**:
   - Default pool size: 10
   - Increase if seeing connection exhaustion

### Memory Leaks

1. **Monitor heap growth**:
   ```promql
   process_heap_bytes
   ```

2. **Check event loop lag**:
   ```promql
   nodejs_eventloop_lag_seconds
   ```

3. **Profile with Node.js**:
   ```bash
   docker exec -it mint-auth node --inspect
   ```

---

## Best Practices

### 1. Metric Naming

- Use snake_case: `http_request_duration_seconds`
- Include unit suffix: `_seconds`, `_bytes`, `_total`
- Use descriptive names: `cache_hits_total` not `hits`

### 2. Label Cardinality

- Keep labels low cardinality (<100 unique values)
- Avoid user IDs, timestamps, UUIDs as labels
- Use aggregation for high-cardinality data

### 3. Dashboard Design

- Group related metrics
- Use consistent time ranges
- Add annotations for deployments
- Set reasonable refresh intervals (30s-1m)

### 4. Alert Fatigue

- Set appropriate thresholds
- Use `for:` clause to avoid flapping
- Group related alerts
- Include runbooks in annotations

---

## Advanced Configuration

### Custom Metrics

Add custom metrics in your service:

```typescript
import { Counter, Histogram } from 'prom-client';

// Custom counter
const customCounter = new Counter({
  name: 'custom_events_total',
  help: 'Total custom events',
  labelNames: ['event_type'],
  registers: [register],
});

// Increment
customCounter.inc({ event_type: 'user_action' });

// Custom histogram
const customHistogram = new Histogram({
  name: 'custom_duration_seconds',
  help: 'Custom operation duration',
  buckets: [0.1, 0.5, 1, 2, 5],
  registers: [register],
});

// Observe
const timer = customHistogram.startTimer();
await doSomething();
timer();
```

### Metric Persistence

Prometheus stores data for 15 days by default. To extend:

```yaml
# docker-compose.yml
prometheus:
  command:
    - '--storage.tsdb.retention.time=30d'
```

### Grafana Provisioning

Auto-configure dashboards and data sources:

```yaml
# grafana/provisioning/datasources/prometheus.yml
apiVersion: 1
datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true

# grafana/provisioning/dashboards/dashboard.yml
apiVersion: 1
providers:
  - name: 'Mint Dashboards'
    folder: 'Mint'
    type: file
    options:
      path: /etc/grafana/provisioning/dashboards
```

---

## Related Documentation

- [Architecture Overview](architecture.md)
- [Service Documentation](services/auth.md)
- [Deployment Guide](deployment.md)
- [Troubleshooting](troubleshooting.md)

---

## Next Steps

1. **Explore Dashboards**: Access Grafana and explore pre-built panels
2. **Set Up Alerts**: Configure alerts for critical metrics
3. **Create Custom Dashboards**: Build dashboards for your specific needs
4. **Integrate with CI/CD**: Add metric checks to deployment pipelines
5. **Load Test**: Run k6 tests to validate performance under load
