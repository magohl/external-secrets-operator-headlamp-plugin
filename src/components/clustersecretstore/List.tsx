import { ResourceListView, StatusLabel } from '@kinvolk/headlamp-plugin/lib/components/common';
import { ClusterSecretStore } from '../../resources/ClusterSecretStore';
import { ExternalSecretsOperatorInstallCheck } from '../common/CommonComponents';

export function ClusterSecretStoreList() {
  return (
    <ExternalSecretsOperatorInstallCheck>
      <ResourceListView
        title="Cluster Secret Store"
        resourceClass={ClusterSecretStore}
        columns={[
          'name',
          {
            id: 'secret-store-ref',
            label: 'Provider Type',
            getValue: item => item.providerType || 'N/A',
            sort: true,
          },
          {
            id: 'caps',
            label: 'Capabilities',
            getValue: item => item.status?.capabilities ?? '-',
            sort: true,
          },
          {
            id: 'status',
            label: 'Status',
            getValue: item => item.readyConditionReason ?? 'N/A',
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
