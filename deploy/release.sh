#!/usr/bin/env bash
set -euo pipefail
export PATH="/tools:$PATH"
[[ "${RELEASE_ID:-}" =~ ^[a-f0-9]{40}-[0-9]+-[0-9]+$ ]] || exit 1
release="/releases/$RELEASE_ID"
mkdir "$release"
tar -xzf release.tar.gz -C "$release"
mkdir -p "$release/.next/cache"
chmod -R a+rX "$release"
job="migrate-${GITHUB_RUN_ID}-${GITHUB_RUN_ATTEMPT}"
export MIGRATION_JOB="$job"
node deploy/render.mjs migration | kubectl -n innomatch apply -f -
for attempt in $(seq 1 90); do
  state=$(kubectl -n innomatch get "job/$job" -o jsonpath='{.status.conditions[*].type}')
  if [[ "$state" == *Complete* ]]; then break; fi
  if [[ "$state" == *Failed* || "$state" == *FailureTarget* ]]; then
    kubectl -n innomatch logs "job/$job" || true
    exit 1
  fi
  sleep 2
done
[[ "$state" == *Complete* ]] || exit 1
kubectl -n innomatch logs "job/$job"
previous=$(kubectl -n innomatch get deployment innomatch -o jsonpath='{.metadata.annotations.deployment\.kubernetes\.io/revision}' --ignore-not-found)
node deploy/render.mjs app | kubectl -n innomatch apply -f -
if ! kubectl -n innomatch rollout status deployment/innomatch --timeout=180s; then
  if [[ -n "$previous" ]]; then
    kubectl -n innomatch rollout undo deployment/innomatch --to-revision="$previous"
    kubectl -n innomatch rollout status deployment/innomatch --timeout=120s
  fi
  exit 1
fi
curl --fail --silent --show-error --retry 3 http://innomatch.innomatch.svc.cluster.local:3000/api/ready
echo "Deployed $RELEASE_ID"
