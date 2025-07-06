import {
  registerDetailsViewHeaderActionsProcessor,
  registerRoute,
  registerSidebarEntry,
} from '@kinvolk/headlamp-plugin/lib';
import {
  ClusterExternalSecretDetail,
  RenderClusterExternalSecretSyncActionButton,
} from './components/clusterexternalsecret/Detail';
import { ClusterExternalSecretList } from './components/clusterexternalsecret/List';
import { ClusterPushSecretDetail } from './components/clusterpushsecret/Detail';
import { ClusterPushSecretList } from './components/clusterpushsecret/List';
import { ClusterSecretStoreDetail } from './components/clustersecretstore/Details';
import { ClusterSecretStoreList } from './components/clustersecretstore/List';
import {
  ExternalSecretDetail,
  RenderExternalSecretSyncActionButton,
} from './components/externalsecret/Detail';
import { ExternalSecretList } from './components/externalsecret/List';
import ExternalSecretsOperatorOverview from './components/overview/Index';
import { PushSecretDetail } from './components/pushsecret/Detail';
import { PushSecretList } from './components/pushsecret/List';
import { SecretStoreDetail } from './components/secretstore/Details';
import { SecretStoreList } from './components/secretstore/List';
import { ClusterExternalSecret } from './resources/ClusterExternalSecret';
import { ExternalSecret } from './resources/ExternalSecret';

// Main entry - root of the External Secrets Operator plugin
registerSidebarEntry({
  parent: null,
  name: 'external-secrets-operator',
  label: 'External Secrets Operator',
  url: '/external-secrets-operator/overview',
  icon: 'mdi:cloud-security',
});

// -----------------------------------
// --- Overview ---
// -----------------------------------

registerSidebarEntry({
  parent: 'external-secrets-operator',
  name: 'external-secrets-overview',
  url: '/external-secrets-operator/overview',
  label: 'Overview',
});

registerRoute({
  path: '/external-secrets-operator/overview',
  sidebar: 'external-secrets-overview',
  name: 'external-secrets-overview',
  component: () => <ExternalSecretsOperatorOverview />,
  exact: true,
});

// -----------------------------------
// --- External Secret ---
// -----------------------------------

registerSidebarEntry({
  name: 'external-secrets',
  url: '/external-secrets-operator/externalsecret',
  parent: 'external-secrets-operator',
  label: 'External Secrets',
});

registerRoute({
  path: '/external-secrets-operator/externalsecret',
  sidebar: 'external-secrets',
  name: 'External Secret List',
  component: () => <ExternalSecretList />,
  exact: true,
});

registerRoute({
  path: '/external-secrets-operator/externalsecret/:namespace/:name',
  name: 'external-secret-detail',
  component: ExternalSecretDetail,
  exact: true,
  hideSidebar: true,
});

registerDetailsViewHeaderActionsProcessor((resource: ExternalSecret, headerActions) => {
  if (resource?.kind === 'ExternalSecret') {
    return [RenderExternalSecretSyncActionButton(resource), ...headerActions];
  }
  return headerActions;
});

// -----------------------------------
// --- Secret Store ---
// -----------------------------------

registerSidebarEntry({
  name: 'secret-stores',
  url: '/external-secrets-operator/secretstore',
  parent: 'external-secrets-operator',
  label: 'Secret Stores',
});

registerRoute({
  path: '/external-secrets-operator/secretstore',
  sidebar: 'secret-stores',
  name: 'Secret Store List',
  component: () => <SecretStoreList />,
  exact: true,
});

registerRoute({
  path: '/external-secrets-operator/secretstore/:namespace/:name',
  name: 'secret-store-detail',
  component: SecretStoreDetail,
  exact: true,
  hideSidebar: true,
});

// -----------------------------------
// --- Cluster Secret Store ---
// -----------------------------------

registerSidebarEntry({
  name: 'cluster-secret-stores',
  url: '/external-secrets-operator/clustersecretstore',
  parent: 'external-secrets-operator',
  label: 'Cluster Secret Stores',
});

registerRoute({
  path: '/external-secrets-operator/clustersecretstore',
  sidebar: 'cluster-secret-stores',
  name: 'Cluster Secret Store List',
  component: () => <ClusterSecretStoreList />,
  exact: true,
});

registerRoute({
  path: '/external-secrets-operator/clustersecretstore/:name',
  name: 'cluster-secret-store-detail',
  component: ClusterSecretStoreDetail,
  exact: false,
  hideSidebar: true,
});

// -----------------------------------
// --- Cluster External Secret ---
// -----------------------------------

registerSidebarEntry({
  name: 'cluster-external-secrets',
  url: '/external-secrets-operator/clusterexternalsecret',
  parent: 'external-secrets-operator',
  label: 'Cluster External Secrets',
});

registerRoute({
  path: '/external-secrets-operator/clusterexternalsecret',
  sidebar: 'cluster-external-secrets',
  name: 'Cluster External Secret List',
  component: () => <ClusterExternalSecretList />,
  exact: true,
});

registerRoute({
  path: '/external-secrets-operator/clusterexternalsecret/:name',
  name: 'cluster-external-secret-detail',
  component: ClusterExternalSecretDetail,
  exact: true,
  hideSidebar: true,
});

registerDetailsViewHeaderActionsProcessor((resource: ClusterExternalSecret, headerActions) => {
  if (resource?.kind === 'ClusterExternalSecret') {
    return [RenderClusterExternalSecretSyncActionButton(resource), ...headerActions];
  }
  return headerActions;
});

// -----------------------------------
// --- Push Secret ---
// -----------------------------------

registerSidebarEntry({
  name: 'push-secrets',
  url: '/external-secrets-operator/pushsecret',
  parent: 'external-secrets-operator',
  label: 'Push Secrets',
});

registerRoute({
  path: '/external-secrets-operator/pushsecret',
  sidebar: 'push-secrets',
  name: 'Push Secret List',
  component: () => <PushSecretList />,
  exact: true,
});

registerRoute({
  path: '/external-secrets-operator/pushsecret/:namespace/:name',
  name: 'push-secret-detail',
  component: PushSecretDetail,
  exact: true,
  hideSidebar: true,
});

// -----------------------------------
// --- Cluster Push Secret ---
// -----------------------------------

registerSidebarEntry({
  name: 'cluster-push-secrets',
  url: '/external-secrets-operator/clusterpushsecret',
  parent: 'external-secrets-operator',
  label: 'Cluster Push Secrets',
});

registerRoute({
  path: '/external-secrets-operator/clusterpushsecret',
  sidebar: 'cluster-push-secrets',
  name: 'Cluster Push Secret List',
  component: () => <ClusterPushSecretList />,
  exact: true,
});

registerRoute({
  path: '/external-secrets-operator/clusterpushsecret/:name',
  name: 'cluster-push-secret-detail',
  component: ClusterPushSecretDetail,
  exact: true,
  hideSidebar: true,
});
