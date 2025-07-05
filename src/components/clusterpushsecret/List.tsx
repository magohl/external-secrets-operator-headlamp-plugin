import { ResourceListView, StatusLabel } from '@kinvolk/headlamp-plugin/lib/components/common';
import { ClusterPushSecret } from '../../resources/ClusterPushSecret';
import { ExternalSecretsOperatorInstallCheck } from '../common/CommonComponents';

export function ClusterPushSecretList() {
  return (
    <ExternalSecretsOperatorInstallCheck>
      <ResourceListView
        title="Cluster Push Secrets"
        resourceClass={ClusterPushSecret}
        columns={[
          'name',
          {
            id: 'source-secret',
            label: 'Source Secret',
            getValue: item => item.sourceSecretName,
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
            id: 'namespaces',
            label: 'Namespaces',
            getValue: (item): any => {
              const provisioned = item.provisionedNamespaces.length;
              const failed = item.failedNamespaces.length;
              const total = provisioned + failed;

              if (total === 0) return 'N/A';

              const status = failed === 0 ? 'success' : provisioned > 0 ? 'warning' : 'error';

              return (
                <StatusLabel status={status}>
                  {provisioned}/{total}
                </StatusLabel>
              );
            },
            sort: true,
          },
          {
            id: 'push-secrets',
            label: 'Push Secrets',
            getValue: (item): any => {
              const counts = item.readyPushSecretsCount;

              if (counts.total === 0) return 'N/A';

              const status =
                counts.ready === counts.total ? 'success' : counts.ready > 0 ? 'warning' : 'error';

              return (
                <StatusLabel status={status}>
                  {counts.ready}/{counts.total}
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
