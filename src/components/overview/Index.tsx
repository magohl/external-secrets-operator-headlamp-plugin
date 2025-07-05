import { Link, SectionBox, TileChart } from '@kinvolk/headlamp-plugin/lib/components/common';
import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { ClusterExternalSecret } from '../../resources/ClusterExternalSecret';
import { ClusterPushSecret } from '../../resources/ClusterPushSecret';
import { ClusterSecretStore } from '../../resources/ClusterSecretStore';
import { ExternalSecret } from '../../resources/ExternalSecret';
import { PushSecret } from '../../resources/PushSecret';
import { SecretStore } from '../../resources/SecretStore';
import { ExternalSecretsOperatorInstallCheck } from '../common/CommonComponents';

function ExternalSecretsOperatorOverviewChart({ title, resources, routeName }) {
  const theme = useTheme();

  function getStatus(resources) {
    let ready = 0;
    let notReady = 0;

    for (const resource of resources) {
      if (resource.readyCondition === 'True') {
        ready++;
      } else {
        notReady++;
      }
    }

    return [ready, notReady];
  }

  function makeData() {
    if (resources && resources.length > 0) {
      const total = resources.length;
      const [ready, notReady] = getStatus(resources);

      // Calculate percent ready
      const readyPercent = total > 0 ? Math.round((ready / total) * 100) : 0;
      const notReadyPercent = total > 0 ? Math.round((notReady / total) * 100) : 0;

      // Let them add up to 100%
      let adjustedReadyPercent = readyPercent;
      let adjustedNotReadyPercent = notReadyPercent;

      const sum = readyPercent + notReadyPercent;
      if (sum !== 100 && total > 0) {
        const diff = 100 - sum;
        if (readyPercent >= notReadyPercent) {
          adjustedReadyPercent += diff;
        } else {
          adjustedNotReadyPercent += diff;
        }
      }

      return [
        {
          name: 'ready',
          value: adjustedReadyPercent,
          fill: theme.palette.chartStyles.fillColor,
        },
        {
          name: 'notReady',
          value: adjustedNotReadyPercent,
          fill: '#DC7501',
        },
      ];
    }
    return [];
  }

  function makeLegend() {
    if (resources && resources.length > 0) {
      const total = resources.length;
      const [ready, notReady] = getStatus(resources);

      return (
        <Box>
          <Box>
            {routeName ? (
              <Link routeName={routeName}>{title}</Link>
            ) : (
              <Typography variant="body1">{title}</Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', mt: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <Box>
                {ready}/{total} ready
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <Box>
                {notReady}/{total} not ready
              </Box>
            </Box>
          </Box>
        </Box>
      );
    }

    return (
      <Box>
        <Box>
          {routeName ? (
            <Link routeName={routeName}>{title}</Link>
          ) : (
            <Typography variant="body1">{title}</Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', mt: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <Box>0/0 ready</Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box>0/0 not ready</Box>
          </Box>
        </Box>
      </Box>
    );
  }

  function getLabel() {
    if (resources && resources.length > 0) {
      const total = resources.length;
      if (total === 0) return '0%';

      const [ready] = getStatus(resources);
      const percentage = Math.round((ready / total) * 100);

      return `${percentage}%`;
    }
    return '0%';
  }

  return (
    <Box sx={{ position: 'relative' }}>
      <TileChart data={makeData()} total={100} label={getLabel()} legend={makeLegend()} />
    </Box>
  );
}

function ExternalSecretsOperatorOverview() {
  const [externalSecrets, externalSecretsError] = ExternalSecret.useList();
  const [secretStores, secretStoresError] = SecretStore.useList();
  const [clusterSecretStores, clusterSecretStoresError] = ClusterSecretStore.useList();
  const [clusterExternalSecrets, clusterExternalSecretsError] = ClusterExternalSecret.useList();
  const [pushSecrets, pushSecretsError] = PushSecret.useList();
  const [clusterPushSecrets, clusterPushSecretsError] = ClusterPushSecret.useList();

  const isLoading =
    externalSecrets === null ||
    secretStores === null ||
    clusterSecretStores === null ||
    clusterExternalSecrets === null ||
    pushSecrets === null ||
    clusterPushSecrets === null;

  const hasError =
    externalSecretsError ||
    secretStoresError ||
    clusterSecretStoresError ||
    clusterExternalSecretsError ||
    pushSecretsError ||
    clusterPushSecretsError;

  return (
    <ExternalSecretsOperatorInstallCheck>
      <Box p={3}>
        <Typography variant="h4" gutterBottom>
          External Secrets Operator Overview
        </Typography>

        {isLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <Typography variant="h6" color="text.secondary">
              Loading External Secrets data...
            </Typography>
          </Box>
        ) : hasError ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <Typography variant="h6" color="error">
              Error loading External Secrets data. Please check your cluster connection.
            </Typography>
          </Box>
        ) : (
          <SectionBox>
            <Box
              display="flex"
              justifyContent="space-between"
              sx={{
                flexWrap: 'wrap',
              }}
            >
              <Box width="300px" m={2}>
                <ExternalSecretsOperatorOverviewChart
                  title="External Secrets"
                  resources={externalSecrets}
                  routeName="/external-secrets-operator/externalsecret"
                />
              </Box>
              <Box width="300px" m={2}>
                <ExternalSecretsOperatorOverviewChart
                  title="Secret Stores"
                  resources={secretStores}
                  routeName="/external-secrets-operator/secretstore"
                />
              </Box>
              <Box width="300px" m={2}>
                <ExternalSecretsOperatorOverviewChart
                  title="Cluster Secret Stores"
                  resources={clusterSecretStores}
                  routeName="/external-secrets-operator/clustersecretstore"
                />
              </Box>
              <Box width="300px" m={2}>
                <ExternalSecretsOperatorOverviewChart
                  title="Cluster External Secrets"
                  resources={clusterExternalSecrets}
                  routeName="/external-secrets-operator/clusterexternalsecret"
                />
              </Box>
              <Box width="300px" m={2}>
                <ExternalSecretsOperatorOverviewChart
                  title="Push Secrets"
                  resources={pushSecrets}
                  routeName="/external-secrets-operator/pushsecret"
                />
              </Box>
              <Box width="300px" m={2}>
                <ExternalSecretsOperatorOverviewChart
                  title="Cluster Push Secrets"
                  resources={clusterPushSecrets}
                  routeName="/external-secrets-operator/clusterpushsecret"
                />
              </Box>
            </Box>
          </SectionBox>
        )}
      </Box>
    </ExternalSecretsOperatorInstallCheck>
  );
}

export default ExternalSecretsOperatorOverview;
