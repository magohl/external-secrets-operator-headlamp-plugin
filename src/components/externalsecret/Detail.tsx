import {
  ActionButton,
  ConditionsSection,
  DetailsGrid,
  NameValueTable,
  SectionBox,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router-dom';
import { ExternalSecret } from '../../resources/ExternalSecret';
import { ExternalSecretsOperatorInstallCheck } from '../common/CommonComponents';

export function RenderExternalSecretSyncActionButton(item: ExternalSecret) {
  return (
    <ActionButton
      key="sync-action"
      description="Refresh this External Secret"
      icon="mdi:refresh"
      onClick={() => item.forceSync()}
    />
  );
}

export function ExternalSecretDetail(props: { namespace?: string; name?: string }) {
  const params = useParams<{ namespace: string; name: string }>();
  const { namespace = params.namespace, name = params.name } = props;

  return (
    <ExternalSecretsOperatorInstallCheck>
      <DetailsGrid
        resourceType={ExternalSecret}
        name={name}
        namespace={namespace}
        withEvents
        extraInfo={item =>
          item && [
            {
              name: 'API Version',
              value: ExternalSecret.apiVersion,
            },
            {
              name: 'Kind',
              value: ExternalSecret.kind,
            },
            {
              name: 'Refresh Interval',
              value: item.refreshInterval,
            },
            {
              name: 'Sync Policy',
              value: item.syncPolicy,
            },
            {
              name: 'Target Secret',
              value: item.targetName,
            },
            {
              name: 'Creation Policy',
              value: item.creationPolicy,
            },
            {
              name: 'Deletion Policy',
              value: item.spec.target?.deletionPolicy || 'Retain',
            },
          ]
        }
        extraSections={item =>
          item && [
            {
              id: 'secret-store-ref',
              section: (
                <SectionBox title="Secret Store Reference">
                  <NameValueTable
                    rows={[
                      {
                        name: 'Kind',
                        value: item.secretStoreRef?.kind || 'SecretStore',
                      },
                      {
                        name: 'Name',
                        value: item.secretStoreRef?.name,
                      },
                    ]}
                  />
                </SectionBox>
              ),
            },
            {
              id: 'data',
              section: (
                <SectionBox title="Data">
                  {item.data.length > 0 ? (
                    <NameValueTable
                      rows={item.data.map(d => ({
                        name: d.secretKey,
                        value: d.remoteRef.property
                          ? `${d.remoteRef.key}#${d.remoteRef.property}`
                          : d.remoteRef.key,
                      }))}
                    />
                  ) : (
                    '—'
                  )}
                </SectionBox>
              ),
            },
            {
              id: 'data-from',
              section: (
                <SectionBox title="Data From">
                  {item.dataFrom.length > 0 ? (
                    <NameValueTable
                      rows={item.dataFrom.map((df, i) => ({
                        name: `extract ${i + 1}`,
                        value: df.extract.key,
                      }))}
                    />
                  ) : (
                    '—'
                  )}
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
                        name: 'Last Refresh',
                        value: item.lastRefreshTime || 'Never',
                      },
                      {
                        name: 'Synced Version',
                        value: item.syncedVersion || '—',
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

export default ExternalSecretDetail;
