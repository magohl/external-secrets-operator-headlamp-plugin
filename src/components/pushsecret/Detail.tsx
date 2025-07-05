import {
  ConditionsSection,
  DetailsGrid,
  NameValueTable,
  SectionBox,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router-dom';
import { PushSecret } from '../../resources/PushSecret';
import { ExternalSecretsOperatorInstallCheck } from '../common/CommonComponents';

export function PushSecretDetail(props: { namespace?: string; name?: string }) {
  const params = useParams<{ namespace: string; name: string }>();
  const { namespace = params.namespace, name = params.name } = props;

  return (
    <ExternalSecretsOperatorInstallCheck>
      <DetailsGrid
        resourceType={PushSecret}
        name={name}
        namespace={namespace}
        withEvents
        extraInfo={item =>
          item && [
            {
              name: 'API Version',
              value: PushSecret.apiVersion,
            },
            {
              name: 'Kind',
              value: PushSecret.kind,
            },
            {
              name: 'Source Secret',
              value: item.sourceSecretName,
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
              name: 'Synced Version',
              value: item.syncedVersion || '—',
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
              id: 'sync-status',
              section: (
                <SectionBox title="Sync Status">
                  {(() => {
                    const syncStatus = item.getSyncStatus();
                    const totalKeys = syncStatus.length;
                    const syncedKeys = syncStatus.filter(s => s.synced).length;

                    if (totalKeys === 0) {
                      return 'No remote keys configured';
                    }

                    return (
                      <>
                        <NameValueTable
                          rows={[
                            {
                              name: 'Overall Status',
                              value: `${syncedKeys}/${totalKeys} keys synced`,
                            },
                          ]}
                        />
                        <NameValueTable
                          rows={syncStatus.map(status => ({
                            name: status.remoteKey,
                            value: status.synced ? 'Synced' : 'Not Synced',
                          }))}
                        />
                      </>
                    );
                  })()}
                </SectionBox>
              ),
            },
            {
              id: 'template',
              section: (
                <SectionBox title="Template Configuration">
                  {item.template ? (
                    <NameValueTable
                      rows={[
                        {
                          name: 'Engine Version',
                          value: item.template.engineVersion || 'v1',
                        },
                        {
                          name: 'Has Template Data',
                          value: item.template.data ? 'Yes' : 'No',
                        },
                        {
                          name: 'Template Labels',
                          value: item.template.metadata?.labels
                            ? Object.keys(item.template.metadata.labels).length
                            : 0,
                        },
                        {
                          name: 'Template Annotations',
                          value: item.template.metadata?.annotations
                            ? Object.keys(item.template.metadata.annotations).length
                            : 0,
                        },
                      ]}
                    />
                  ) : (
                    'No template configuration'
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

export default PushSecretDetail;
