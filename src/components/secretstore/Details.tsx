import {
    ConditionsSection,
    DetailsGrid,
    NameValueTable,
    SectionBox,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { Box, Chip, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';
import { SecretStore } from '../../resources/SecretStore';
import { ExternalSecretsOperatorInstallCheck } from '../common/CommonComponents';

function renderProviderDetails(item: SecretStore) {
    const provider = item.provider;

    if (provider.aws) {
        return (
            <NameValueTable
                rows={[
                    {
                        name: 'Service',
                        value: provider.aws.service,
                    },
                    {
                        name: 'Region',
                        value: provider.aws.region,
                    },
                    ...(provider.aws.role
                        ? [
                            {
                                name: 'Role',
                                value: provider.aws.role,
                            },
                        ]
                        : []),
                ]}
            />
        );
    }

    if (provider.vault) {
        return (
            <NameValueTable
                rows={[
                    {
                        name: 'Server',
                        value: provider.vault.server,
                    },
                    {
                        name: 'Path',
                        value: provider.vault.path,
                    },
                    {
                        name: 'Version',
                        value: provider.vault.version || 'v2',
                    },
                    ...(provider.vault.namespace
                        ? [
                            {
                                name: 'Namespace',
                                value: provider.vault.namespace,
                            },
                        ]
                        : []),
                ]}
            />
        );
    }

    if (provider.gcpsm) {
        return (
            <NameValueTable
                rows={[
                    {
                        name: 'Project ID',
                        value: provider.gcpsm.projectID,
                    },
                ]}
            />
        );
    }

    if (provider.azurekv) {
        return (
            <NameValueTable
                rows={[
                    {
                        name: 'Vault URL',
                        value: provider.azurekv.vaultUrl,
                    },
                    {
                        name: 'Tenant ID',
                        value: provider.azurekv.tenantId,
                    },
                ]}
            />
        );
    }

    if (provider.kubernetes) {
        return (
            <NameValueTable
                rows={[
                    {
                        name: 'Server',
                        value: provider.kubernetes.server?.url || 'In-cluster',
                    },
                ]}
            />
        );
    }

    return <Typography variant="body2">No provider details available</Typography>;
}

export function SecretStoreDetail(props: { namespace?: string; name?: string }) {
    const params = useParams<{ namespace: string; name: string }>();
    const { namespace = params.namespace, name = params.name } = props;

    return (
        <ExternalSecretsOperatorInstallCheck>
            <DetailsGrid
                resourceType={SecretStore}
                name={name}
                namespace={namespace}
                withEvents
                extraInfo={item =>
                    item && [
                        {
                            name: 'API Version',
                            value: SecretStore.apiVersion,
                        },
                        {
                            name: 'Kind',
                            value: SecretStore.kind,
                        },
                        {
                            name: 'Provider',
                            value: (
                                <Chip
                                    label={item.providerType}
                                    color="primary"
                                    variant="outlined"
                                    size="small"
                                />
                            ),
                        },
                        {
                            name: 'Ready',
                            value: item.readyCondition || 'Unknown',
                        },
                        {
                            name: 'Refresh Interval',
                            value: item.refreshInterval,
                        },
                        {
                            name: 'Max Retries',
                            value: item.maxRetries.toString(),
                        },
                        {
                            name: 'Retry Interval',
                            value: item.retryInterval,
                        },
                    ]
                }
                extraSections={item =>
                    item && [
                        {
                            id: 'provider-config',
                            section: (
                                <SectionBox title="Provider Configuration">
                                    {renderProviderDetails(item)}
                                </SectionBox>
                            ),
                        },
                        {
                            id: 'capabilities',
                            section: (
                                <SectionBox title="Capabilities">
                                    {(() => {
                                        const caps = item.status?.capabilities;
                                        if (!caps) return '—';

                                        // Handle both string and array cases
                                        const capArray = Array.isArray(caps) ? caps : [caps];

                                        return capArray.length > 0 ? (
                                            <Box display="flex" flexWrap="wrap" gap={1}>
                                                {capArray.map((capability, index) => (
                                                    <Chip
                                                        key={index}
                                                        label={capability}
                                                        size="small"
                                                        variant="outlined"
                                                    />
                                                ))}
                                            </Box>
                                        ) : '—';
                                    })()}
                                </SectionBox>
                            ),
                        },
                        {
                            id: 'status',
                            section: (
                                <SectionBox title="Status">
                                    <NameValueTable
                                        rows={[
                                            {
                                                name: 'Ready Condition',
                                                value: item.readyCondition || 'Unknown',
                                            },
                                            {
                                                name: 'Ready Reason',
                                                value: item.readyConditionReason || '—',
                                            },
                                            {
                                                name: 'Ready Message',
                                                value: item.readyConditionMessage || '—',
                                            },
                                        ]}
                                    />
                                </SectionBox>
                            ),
                        },
                        {
                            id: 'conditions',
                            section: <ConditionsSection resource={item?.jsonData} />,
                        },
                    ]
                }
            />
        </ExternalSecretsOperatorInstallCheck>
    );
}

export default SecretStoreDetail;