import {
  ConditionsSection,
  DetailsGrid,
  NameValueTable,
  SectionBox,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router-dom';
import { ClusterPushSecret } from '../../resources/ClusterPushSecret';
import { ExternalSecretsOperatorInstallCheck } from '../common/CommonComponents';

export function ClusterPushSecretDetail(props: { name?: string }) {
  const params = useParams<{ name: string }>();
  const { name = params.name } = props;

  return (
    <ExternalSecretsOperatorInstallCheck>
      <DetailsGrid
        resourceType={ClusterPushSecret}
        name={name}
        withEvents
        extraInfo={item =>
          item && [
            {
              name: 'API Version',
              value: ClusterPushSecret.apiVersion,
            },
            {
              name: 'Kind',
              value: ClusterPushSecret.kind,
            },
            {
              name: 'Source Secret',
              value: item.sourceSecretName,
            },
            {
              name: 'Push Secret Name',
              value: item.pushSecretName,
            },
            {
              name: 'Refresh Interval',
              value: item.refreshInterval,
            },
            {
              name: 'Update Policy',
              value: item.updatePolicy,
            },
            {
              name: 'Deletion Policy',
              value: item.deletionPolicy,
            },
            {
              name: 'Ready Condition',
              value: item.readyCondition || 'Unknown',
            },
            {
              name: 'Last Refresh',
              value: item.lastRefreshTime || 'Never',
            },
            {
              name: 'Provisioned Namespaces',
              value: item.provisionedNamespaces.length,
            },
            {
              name: 'Failed Namespaces',
              value: item.failedNamespaces.length,
            },
            {
              name: 'Push Secrets Ready',
              value: `${item.readyPushSecretsCount.ready}/${item.readyPushSecretsCount.total}`,
            },
          ]
        }
        extraSections={item =>
          item && [
            {
              id: 'secret-stores',
              section: (
                <SectionBox title="Secret Stores">
                  {item.secretStoreRefs.length > 0 ? (
                    <NameValueTable
                      rows={item.secretStoreRefs.map(store => ({
                        name: store.kind || 'SecretStore',
                        value: store.name,
                      }))}
                    />
                  ) : (
                    '—'
                  )}
                </SectionBox>
              ),
            },
            {
              id: 'namespace-selector',
              section: (
                <SectionBox title="Namespace Selection">
                  {item.namespaceSelector || item.namespaceSelectors.length > 0 ? (
                    <NameValueTable
                      rows={[
                        {
                          name: 'Primary Selector',
                          value: item.namespaceSelector
                            ? `${
                                Object.keys(item.namespaceSelector.matchLabels || {}).length
                              } labels, ${
                                (item.namespaceSelector.matchExpressions || []).length
                              } expressions`
                            : 'None',
                        },
                        {
                          name: 'Additional Selectors',
                          value: item.namespaceSelectors.length,
                        },
                      ]}
                    />
                  ) : (
                    'No namespace selectors configured'
                  )}
                </SectionBox>
              ),
            },
            {
              id: 'push-secrets',
              section: (
                <SectionBox title="Push Secrets">
                  {item.pushSecretStatuses.length > 0 ? (
                    <NameValueTable
                      rows={item.pushSecretStatuses.map(status => {
                        const readyCondition = status.status.conditions?.find(
                          c => c.type === 'Ready'
                        );
                        const isReady = readyCondition?.status === 'True';
                        return {
                          name: `${status.namespace}/${status.name}`,
                          value: isReady ? 'Ready' : readyCondition?.reason || 'Not Ready',
                        };
                      })}
                    />
                  ) : (
                    'No PushSecrets created yet'
                  )}
                </SectionBox>
              ),
            },
            {
              id: 'failed-namespaces',
              section: (
                <SectionBox title="Failed Namespaces">
                  {item.failedNamespaces.length > 0 ? (
                    <NameValueTable
                      rows={item.failedNamespaces.map(failure => ({
                        name: failure.namespace,
                        value: failure.message || failure.reason,
                      }))}
                    />
                  ) : (
                    'No failed namespaces'
                  )}
                </SectionBox>
              ),
            },
            {
              id: 'data-mappings',
              section: (
                <SectionBox title="Data Mappings">
                  {item.data.length > 0 ? (
                    <NameValueTable
                      rows={item.data.map(d => ({
                        name: d.match.secretKey || '(all keys)',
                        value: d.match.remoteRef.property
                          ? `${d.match.remoteRef.remoteKey}#${d.match.remoteRef.property}`
                          : d.match.remoteRef.remoteKey,
                      }))}
                    />
                  ) : (
                    'No explicit data mappings configured. All keys from the source secret will be pushed.'
                  )}
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

export default ClusterPushSecretDetail;
