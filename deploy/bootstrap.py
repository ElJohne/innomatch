"""Run on dev-k3s; GitHub runner registration token is read from stdin, never logged."""
import json
import os
import secrets
import subprocess
import sys

os.environ['KUBECONFIG'] = os.path.expanduser('~/.kube/config')
NS = 'innomatch'

def kubectl(*args, data=None):
    return subprocess.run(['kubectl', *args], input=data, text=True, check=True, capture_output=True).stdout

def apply(obj):
    kubectl('apply', '-f', '-', data=json.dumps(obj))
    print(f"Configured {obj['kind']}/{obj['metadata']['name']}")

def obj(kind, name, **kwargs):
    return dict(apiVersion='v1', kind=kind, metadata=dict(name=name, namespace=NS), **kwargs)

def secret(name, values):
    if not kubectl('-n', NS, 'get', 'secret', name, '--ignore-not-found', '-o', 'name').strip():
        apply(obj('Secret', name, type='Opaque', stringData=values))

token = sys.stdin.read().strip()
if not token:
    raise SystemExit('Registration token is required')
apply(dict(apiVersion='v1', kind='Namespace', metadata=dict(name=NS)))
password = secrets.token_hex(32)
secret('postgres-env', {'POSTGRES_USER': 'postgres', 'POSTGRES_DB': 'innomatch', 'POSTGRES_PASSWORD': secrets.token_hex(32), 'APP_PASSWORD': password})
# Recover the existing password on a repeat invocation without printing it.
import base64
db_secret = json.loads(kubectl('-n', NS, 'get', 'secret', 'postgres-env', '-o', 'json'))
password = base64.b64decode(db_secret['data']['APP_PASSWORD']).decode()
secret('app-env', {
    'DATABASE_URL': f'postgresql://innomatch:{password}@postgres:5432/innomatch',
    'DATABASE_CONFIRMED_FOR_PROJECT': 'true', 'AUTH_SECRET': secrets.token_hex(48),
    'APP_URL': 'https://pomocnypunkt.pl', 'DATA_PROVIDER': 'postgres',
    'AI_PROVIDER': 'mock', 'DEMO_DATA_ENABLED': 'false',
})
secret('runner-registration', {'token': token})
secret('openai-env', {})
for name, size in [('postgres-data', '5Gi'), ('releases', '5Gi'), ('runner-data', '3Gi'), ('backups', '3Gi')]:
    apply(obj('PersistentVolumeClaim', name, spec={'accessModes': ['ReadWriteOnce'], 'storageClassName': 'local-path', 'resources': {'requests': {'storage': size}}}))

apply(obj('ConfigMap', 'postgres-init', data={'01-app.sh': '''#!/bin/sh
set -eu
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" --set=app_password="$APP_PASSWORD" <<'SQL'
CREATE ROLE innomatch LOGIN PASSWORD :'app_password';
ALTER DATABASE innomatch OWNER TO innomatch;
ALTER SCHEMA public OWNER TO innomatch;
SQL
'''}))
apply(dict(apiVersion='apps/v1', kind='StatefulSet', metadata=dict(name='postgres', namespace=NS), spec={
    'serviceName': 'postgres', 'replicas': 1, 'selector': {'matchLabels': {'app': 'postgres'}},
    'template': {'metadata': {'labels': {'app': 'postgres'}}, 'spec': {
        'automountServiceAccountToken': False,
        'containers': [{'name': 'postgres', 'image': 'postgres:17.11-bookworm',
            'envFrom': [{'secretRef': {'name': 'postgres-env'}}],
            'env': [{'name': 'PGDATA', 'value': '/var/lib/postgresql/data/pgdata'}],
            'args': ['-c', 'log_statement=none', '-c', 'log_min_error_statement=panic'],
            'ports': [{'containerPort': 5432}],
            'resources': {'requests': {'cpu': '100m', 'memory': '128Mi'}, 'limits': {'cpu': '1', 'memory': '512Mi'}},
            'readinessProbe': {'exec': {'command': ['pg_isready', '-U', 'postgres', '-d', 'innomatch']}, 'initialDelaySeconds': 5, 'periodSeconds': 5},
            'volumeMounts': [{'name': 'data', 'mountPath': '/var/lib/postgresql/data'}, {'name': 'init', 'mountPath': '/docker-entrypoint-initdb.d', 'readOnly': True}],
        }],
        'volumes': [{'name': 'data', 'persistentVolumeClaim': {'claimName': 'postgres-data'}}, {'name': 'init', 'configMap': {'name': 'postgres-init'}}],
    }},
}))
apply(obj('Service', 'postgres', spec={'selector': {'app': 'postgres'}, 'ports': [{'port': 5432, 'targetPort': 5432}]}))
apply(dict(apiVersion='networking.k8s.io/v1', kind='NetworkPolicy', metadata=dict(name='postgres-private', namespace=NS), spec={
    'podSelector': {'matchLabels': {'app': 'postgres'}}, 'policyTypes': ['Ingress'],
    'ingress': [{'from': [{'podSelector': {}}], 'ports': [{'protocol': 'TCP', 'port': 5432}]}],
}))
apply(obj('Service', 'innomatch', spec={'selector': {'app': 'innomatch'}, 'ports': [{'name': 'http', 'port': 3000, 'targetPort': 3000}]}))
apply(dict(apiVersion='networking.k8s.io/v1', kind='Ingress', metadata=dict(name='innomatch', namespace=NS), spec={
    'ingressClassName': 'traefik', 'rules': [{'host': 'pomocnypunkt.pl', 'http': {'paths': [{'path': '/', 'pathType': 'Prefix', 'backend': {'service': {'name': 'innomatch', 'port': {'number': 3000}}}}]}}],
}))

apply(obj('ServiceAccount', 'deployer'))
apply(dict(apiVersion='rbac.authorization.k8s.io/v1', kind='Role', metadata=dict(name='deployer', namespace=NS), rules=[
    {'apiGroups': ['apps'], 'resources': ['deployments', 'replicasets'], 'verbs': ['get', 'list', 'watch', 'create', 'patch', 'update']},
    {'apiGroups': ['batch'], 'resources': ['jobs'], 'verbs': ['get', 'list', 'watch', 'create', 'patch']},
    {'apiGroups': [''], 'resources': ['pods', 'pods/log'], 'verbs': ['get', 'list', 'watch']},
    {'apiGroups': [''], 'resources': ['secrets'], 'resourceNames': ['openai-env'], 'verbs': ['get', 'patch']},
]))
apply(dict(apiVersion='rbac.authorization.k8s.io/v1', kind='RoleBinding', metadata=dict(name='deployer', namespace=NS), roleRef={'apiGroup': 'rbac.authorization.k8s.io', 'kind': 'Role', 'name': 'deployer'}, subjects=[{'kind': 'ServiceAccount', 'name': 'deployer', 'namespace': NS}]))
install = """const fs=require('fs'), c=require('crypto'); (async()=>{
const url='https://dl.k8s.io/release/v1.35.5/bin/linux/amd64/kubectl';
const r=await fetch(url); if(!r.ok) throw Error('download'); const b=Buffer.from(await r.arrayBuffer());
const s=await fetch(url+'.sha256'); if(!s.ok) throw Error('checksum');
if(c.createHash('sha256').update(b).digest('hex')!==(await s.text()).trim()) throw Error('checksum');
fs.writeFileSync('/tools/kubectl',b,{mode:0o755}); fs.copyFileSync('/usr/local/bin/node','/tools/node'); fs.chmodSync('/tools/node',0o755);
fs.chownSync('/runner-state',1001,1001); fs.chownSync('/releases',1001,1001);
})().catch(()=>process.exit(1))"""
apply(dict(apiVersion='apps/v1', kind='Deployment', metadata=dict(name='actions-runner', namespace=NS), spec={
    'replicas': 1, 'strategy': {'type': 'Recreate'}, 'selector': {'matchLabels': {'app': 'actions-runner'}},
    'template': {'metadata': {'labels': {'app': 'actions-runner'}}, 'spec': {
        'serviceAccountName': 'deployer',
        'initContainers': [{'name': 'tools', 'image': 'node:24.19.0-bookworm-slim', 'command': ['node', '-e', install], 'volumeMounts': [{'name': 'tools', 'mountPath': '/tools'}, {'name': 'state', 'mountPath': '/runner-state'}, {'name': 'releases', 'mountPath': '/releases'}]}],
        'containers': [{'name': 'runner', 'image': 'ghcr.io/actions/actions-runner:2.337.0',
            'workingDir': '/runner-state', 'command': ['/bin/bash', '-ec'], 'args': ['''
if [ ! -f ./run.sh ]; then cp -a /home/runner/. /runner-state/; fi
if [ ! -f .runner ]; then
  ./config.sh --unattended --url https://github.com/ElJohne/innomatch --token "$RUNNER_TOKEN" --name innomatch-prod-k3s --labels innomatch-prod --work _work --disableupdate
fi
unset RUNNER_TOKEN
exec ./run.sh
'''],
            'env': [{'name': 'RUNNER_TOKEN', 'valueFrom': {'secretKeyRef': {'name': 'runner-registration', 'key': 'token'}}}],
            'securityContext': {'runAsUser': 1001, 'runAsGroup': 1001, 'allowPrivilegeEscalation': False},
            'resources': {'requests': {'cpu': '100m', 'memory': '256Mi'}, 'limits': {'cpu': '1', 'memory': '1Gi'}},
            'volumeMounts': [{'name': 'tools', 'mountPath': '/tools', 'readOnly': True}, {'name': 'state', 'mountPath': '/runner-state'}, {'name': 'releases', 'mountPath': '/releases'}],
        }],
        'volumes': [{'name': 'tools', 'emptyDir': {}}, {'name': 'state', 'persistentVolumeClaim': {'claimName': 'runner-data'}}, {'name': 'releases', 'persistentVolumeClaim': {'claimName': 'releases'}}],
    }},
}))
apply(dict(apiVersion='batch/v1', kind='CronJob', metadata=dict(name='postgres-backup', namespace=NS), spec={
    'schedule': '0 2 * * *', 'concurrencyPolicy': 'Forbid', 'successfulJobsHistoryLimit': 1, 'failedJobsHistoryLimit': 2,
    'jobTemplate': {'spec': {'backoffLimit': 1, 'template': {'spec': {
        'restartPolicy': 'Never', 'automountServiceAccountToken': False,
        'containers': [{'name': 'backup', 'image': 'postgres:17.11-bookworm',
            'env': [{'name': 'PGPASSWORD', 'valueFrom': {'secretKeyRef': {'name': 'postgres-env', 'key': 'POSTGRES_PASSWORD'}}}],
            'command': ['/bin/sh', '-ec', 'umask 077; attempt=0; until pg_isready -h postgres -U postgres -d innomatch -t 3 >/dev/null 2>&1; do attempt=$((attempt+1)); [ "$attempt" -lt 30 ] || exit 1; sleep 2; done; file=/backups/innomatch-$(date -u +%Y%m%dT%H%M%SZ).dump; pg_dump -h postgres -U postgres -d innomatch -Fc -f "$file.tmp"; mv "$file.tmp" "$file"; find /backups -name "innomatch-*.dump" -mtime +7 -delete'],
            'resources': {'requests': {'cpu': '50m', 'memory': '64Mi'}, 'limits': {'cpu': '500m', 'memory': '256Mi'}},
            'volumeMounts': [{'name': 'backups', 'mountPath': '/backups'}],
        }], 'volumes': [{'name': 'backups', 'persistentVolumeClaim': {'claimName': 'backups'}}],
    }}}},
}))
print('Bootstrap complete. Database, runner, ingress and daily local backups configured.')
