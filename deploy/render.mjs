// Render only non-secret manifests. Runtime secrets are provisioned separately.
const namespace = 'innomatch';
const release = process.env.RELEASE_ID;
if (!/^[a-f0-9]{40}-[0-9]+-[0-9]+$/.test(release || '')) throw new Error('Invalid release');
const pod = {
  metadata: { labels: { app: 'innomatch' } },
  spec: {
    automountServiceAccountToken: false,
    securityContext: { runAsUser: 1001, runAsGroup: 1001, runAsNonRoot: true, fsGroup: 1001 },
    containers: [{
      name: 'app', image: 'node:24.19.0-bookworm-slim', workingDir: '/app',
      command: ['node', 'server.js'],
      envFrom: [{ secretRef: { name: 'app-env' } }],
      env: [{ name: 'NODE_ENV', value: 'production' }, { name: 'HOSTNAME', value: '0.0.0.0' }, { name: 'PORT', value: '3000' }, { name: 'NEXT_TELEMETRY_DISABLED', value: '1' }],
      ports: [{ containerPort: 3000 }],
      securityContext: { allowPrivilegeEscalation: false, capabilities: { drop: ['ALL'] } },
      resources: { requests: { cpu: '100m', memory: '128Mi' }, limits: { cpu: '1', memory: '512Mi' } },
      volumeMounts: [{ name: 'releases', mountPath: '/app', subPath: release, readOnly: true }, { name: 'cache', mountPath: '/app/.next/cache' }],
      readinessProbe: { httpGet: { path: '/api/ready', port: 3000 }, initialDelaySeconds: 3, periodSeconds: 5, timeoutSeconds: 10 },
      livenessProbe: { httpGet: { path: '/api/health', port: 3000 }, initialDelaySeconds: 20, periodSeconds: 15 },
    }],
    volumes: [{ name: 'releases', persistentVolumeClaim: { claimName: 'releases' } }, { name: 'cache', emptyDir: {} }],
  },
};
let manifest;
if (process.argv[2] === 'migration') {
  const job = process.env.MIGRATION_JOB;
  if (!/^migrate-[0-9]+-[0-9]+$/.test(job || '')) throw new Error('Invalid job');
  pod.spec.restartPolicy = 'Never';
  pod.spec.containers[0].command = ['node', 'scripts/migrate.mjs'];
  delete pod.spec.containers[0].readinessProbe;
  delete pod.spec.containers[0].livenessProbe;
  manifest = { apiVersion: 'batch/v1', kind: 'Job', metadata: { name: job, namespace }, spec: { backoffLimit: 0, activeDeadlineSeconds: 150, ttlSecondsAfterFinished: 86400, template: pod } };
} else {
  manifest = { apiVersion: 'apps/v1', kind: 'Deployment', metadata: { name: 'innomatch', namespace }, spec: { replicas: 1, revisionHistoryLimit: 3, strategy: { type: 'Recreate' }, selector: { matchLabels: { app: 'innomatch' } }, template: pod } };
}
console.log(JSON.stringify(manifest));
