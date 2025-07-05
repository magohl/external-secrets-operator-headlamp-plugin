import {
  Link,
  ResourceListView,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { PushSecret } from '../../resources/PushSecret';
import { ExternalSecretsOperatorInstallCheck } from '../common/CommonComponents';

export function PushSecretList() {
  return (
    <ExternalSecretsOperatorInstallCheck>
      <ResourceListView
        title="Push Secrets"
        resourceClass={PushSecret}
        columns={[
          'name',
          'namespace',
          {
            id: 'source-secret',
            label: 'Source Secret',
            getValue: item => {
              const name = item.sourceSecretName;
              const ns = item.metadata.namespace;
              if (!name || !ns) return 'N/A';

              return (
                <Link routeName="secret" params={{ namespace: ns, name: name }}>
                  {name}
                </Link>
              ) as unknown as string;
            },
            sort: true,
          },
          {
            id: 'secret-stores',
            label: 'Secret Stores',
            getValue: item => {
              const stores = item.secretStoreRefs || [];
              if (stores.length === 0) return 'N/A';
              if (stores.length === 1) {
                return `${stores[0].name} (${stores[0].kind || 'SecretStore'})`;
              }
              return `${stores.length} stores`;
            },
            sort: true,
          },
          {
            id: 'update-policy',
            label: 'Update Policy',
            getValue: item => item.updatePolicy,
            sort: true,
          },
          {
            id: 'refresh-interval',
            label: 'Refresh Interval',
            getValue: item => item.refreshInterval,
            sort: true,
          },
          {
            id: 'sync-status',
            label: 'Synced Keys',
            getValue: (item): any => {
              const totalKeys = item.getRemoteKeys().length;
              const syncedKeys = Object.keys(item.syncedPushSecrets).length;

              if (totalKeys === 0) return 'N/A';

              const status =
                syncedKeys === totalKeys ? 'success' : syncedKeys > 0 ? 'warning' : 'error';

              return (
                <StatusLabel status={status}>
                  {syncedKeys}/{totalKeys}
                </StatusLabel>
              );
            },
            sort: true,
          },
          {
            id: 'ready-condition',
            label: 'Ready',
            getValue: (item): any => {
              const status = item.readyCondition;
              if (status === 'True') {
                return <StatusLabel status="success">True</StatusLabel>;
              } else if (status === 'False') {
                return <StatusLabel status="error">False</StatusLabel>;
              } else {
                return <StatusLabel status="warning">{status ?? 'Unknown'}</StatusLabel>;
              }
            },
            sort: true,
          },
          'age',
        ]}
      />
    </ExternalSecretsOperatorInstallCheck>
  );
}
