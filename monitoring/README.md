# AgriRent monitoring demo

Prometheus + `blackbox_exporter` + Grafana stack that probes the **deployed**
AgriRent services through the ALB and visualizes availability and response
delay.

## What this shows

Two services are probed every 15 seconds:

| Service | Target | Signal |
| --- | --- | --- |
| Frontend | `http://agrirent-dev-alb-1676444296.eu-north-1.elb.amazonaws.com/dashboard` | `probe_success`, `probe_duration_seconds` |
| Backend | `http://agrirent-dev-alb-1676444296.eu-north-1.elb.amazonaws.com/api/shops` | `probe_success`, `probe_duration_seconds` |

`probe_success == 1` means the target returned HTTP 200 on the last probe.
`probe_duration_seconds` shows the response delay. `probe_http_status_code`
shows the actual status code.

> The ALB listener forwards only `/api/*` and `/auth/*` to the backend. A
> request to `/health` through the ALB reaches the frontend SPA, so the backend
> probe uses `/api/shops` instead. That also exercises the backend's database
> read path, making it a stronger signal than a liveness-only endpoint.

## Run

From the repository root:

```bash
cd monitoring
docker compose up -d
docker compose ps
```

Open:

- Grafana: http://localhost:3000 (`admin` / `admin`) → **Dashboards → AgriRent → AgriRent Health**
- Prometheus: http://localhost:9090

Useful Prometheus queries:

```promql
probe_success{service="frontend"}
probe_success{service="backend"}
probe_duration_seconds{service="frontend"}
probe_duration_seconds{service="backend"}
probe_http_status_code{service=~"frontend|backend"}
```

Verify a probe directly:

```bash
curl -sG 'http://localhost:9115/probe' \
  --data-urlencode 'target=http://agrirent-dev-alb-1676444296.eu-north-1.elb.amazonaws.com/api/shops' \
  --data 'module=http_2xx' \
  | grep -E '^probe_success|^probe_http_status_code|^probe_duration_seconds'
```

Healthy output:

```text
probe_duration_seconds 0.4xx
probe_http_status_code 200
probe_success 1
```

## Dashboard link

```text
http://localhost:3000/d/agrirent-health/agrirent-health?from=now-15m&to=now&timezone=browser&refresh=10s
```

## Stop

```bash
cd monitoring
docker compose down
```

## Change the target

Edit `prometheus/prometheus.yml`, update the two `targets` entries, then:

```bash
docker compose restart prometheus
```
