#!/usr/bin/env bash
#
# admin-hub (SYSTEM_ADMIN console) — build + deploy the Vite/React SPA to Cloud Run.
# Idempotent: safe to re-run. Deploy-from-source (Cloud Build reads the Dockerfile).
# Mirrors services/media-compression-service/deploy.sh conventions.
#
#   ./deploy.sh
#
set -euo pipefail

PROJECT_ID="${GCP_PROJECT_ID:-daily-spark-b2cbe}"
REGION="${GCP_REGION:-us-central1}"
SERVICE="admin-hub"
DOMAIN="${DOMAIN:-admin.diaspoplug.org}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Public build-time config baked into the bundle (see Dockerfile ARG).
VITE_ADMIN_GRAPHQL_URL="${VITE_ADMIN_GRAPHQL_URL:-https://api.diaspoplug.net/graphql}"

gc() { gcloud "$@" --project "$PROJECT_ID"; }
say() { echo -e "\n▶ $*"; }

say "Enabling required APIs"
gc services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com

say "Deploy Cloud Run service from source ($SERVICE @ $REGION)"
gc run deploy "$SERVICE" --region "$REGION" \
  --source "$SCRIPT_DIR" \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi --cpu 1 --min-instances 0 --max-instances 4 \
  --set-build-env-vars "VITE_ADMIN_GRAPHQL_URL=${VITE_ADMIN_GRAPHQL_URL}"

say "Service URL"
gc run services describe "$SERVICE" --region "$REGION" --format="value(status.url)"

say "Map custom domain $DOMAIN (add the printed DNS records at your registrar)"
gc beta run domain-mappings create --service "$SERVICE" --domain "$DOMAIN" --region "$REGION" \
  2>/dev/null || echo "  mapping already exists"
echo "  DNS records to create for $DOMAIN:"
gc beta run domain-mappings describe --domain "$DOMAIN" --region "$REGION" \
  --format="table(status.resourceRecords[].name, status.resourceRecords[].type, status.resourceRecords[].rrdata)" \
  2>/dev/null || echo "  (re-run describe once the mapping is created)"
