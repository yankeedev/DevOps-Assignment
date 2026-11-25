# AgriRent monitoring demo

Prometheus + blackbox_exporter + Grafana stack that probes the existing
`GET /health` endpoint and visualizes the result.

## What this shows

- `probe_success == 1` — the API returned HTTP 200 on the last probe
- `probe_duration_seconds` — how long the health request took
- `probe_http_status_code` — the actual HTTP status (expected `200`)

This is a liveness/readiness signal: the API process is up, listening on
port 5000, and responding. The current `/health` endpoint does not check
RDS, so it does not prove database health.

## Run locally

Make sure the app is running and port 5000 is published:

```bash
cd ..
docker compose up -d
curl http://localhost:5000/health
```

Expected:

```json
{"status":"ok","message":"AgriRent API is running"}
```

Start the monitoring stack:

```bash
cd monitoring
docker compose up -d
docker compose ps
```

Verify the probe directly:

```bash
curl -s 'http://localhost:9115/probe?target=http://host.docker.internal:5000/health&module=http_2xx' \
  | grep -E 'probe_success|probe_http_status_code|probe_duration_seconds'
```

Healthy output:

```text
probe_duration_seconds 0.00x
probe_http_status_code 200
probe_success 1
```

Open:

- Prometheus: http://localhost:9090 (query `probe_success`)
- Grafana: http://localhost:3000 (`admin` / `admin`)

The **AgriRent Health** dashboard is provisioned automatically under the
`AgriRent` folder.

## Run against the deployed VM

Copy this `monitoring/` directory to the app VM, then:

```bash
cd monitoring
docker compose up -d
```

Reach the dashboards from your laptop through the bastion:

```bash
ssh -J ec2-user@<bastion-public-ip> \
  -L 3000:localhost:3000 \
  -L 9090:localhost:9090 \
  ec2-user@<app-private-ip>
```

Then open http://localhost:3000 and http://localhost:9090 locally.

## Change the target

If the app is not on the Docker host, edit
`prometheus/prometheus.yml` and replace the target with a reachable URL,
for example:

```yaml
- http://<alb-dns-name>/health
```

Reload Prometheus:

```bash
docker compose restart prometheus
```
