import { ActionButton, Link,ResourceListView, StatusLabel } from '@kinvolk/headlamp-plugin/lib/components/common';
import { ExternalSecret } from '../../resources/ExternalSecret';
import { ExternalSecretsOperatorInstallCheck } from '../common/CommonComponents';

export function ExternalSecretList() {

    return (
        <ExternalSecretsOperatorInstallCheck>
            <ResourceListView
                title="External Secrets"
                resourceClass={ExternalSecret}
                columns={[
                    'name',
                    'namespace',
                    {
                        id: 'secret-store-ref',
                        label: 'Secret Store Reference',
                        getValue: item => item.secretStoreRef?.name || 'N/A',
                        sort: true,
                    },
                    {
                        id: 'target-secret-name',
                        label: 'Target Secret',
                        getValue: item => {
                            const name = item.targetName;
                            const ns = item.metadata.namespace;
                            if (!name || !ns) return 'N/A';

                            return (
                                <Link
                                    routeName="secret"
                                    params={{ namespace: ns, name: name }}
                                >
                                    {name}
                                </Link>
                            ) as unknown as string;
                        },
                        sort: true,
                    },
                    {
                        id: 'refresh-interval',
                        label: 'Refresh Inteval',
                        getValue: item => item.refreshInterval,
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
                                return (
                                    <StatusLabel status="success">True</StatusLabel>
                                );
                            } else if (status === 'False') {
                                return (
                                    <StatusLabel status="error">False</StatusLabel>
                                );
                            } else {
                                return (
                                    <StatusLabel status="warning">{status ?? 'Unknown'}</StatusLabel>
                                );
                            }
                        },
                        sort: true,
                    },
                    'age',
                    {
                        id: 'sync',
                        label: 'Force Sync',
                        sort: false,
                        getValue: null,
                        render: item => (

                            <ActionButton
                                description="Force sync this External Secret"
                                icon="mdi:refresh"
                                onClick={() => item.forceSync()}
                            />
                        )
                    }
                ]}
            />
        </ExternalSecretsOperatorInstallCheck >
    );
}