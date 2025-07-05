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

// main entry
registerSidebarEntry({
  parent: null,
  name: 'root',
  label: 'External Secrets Operator',
  url: '/external-secrets-operator/overview',
  icon: 'mdi:cloud-security',
});

// -----------------------------------
// --- Overview ---
// -----------------------------------

// External Secrets - Overview
registerSidebarEntry({
  parent: 'root',
  name: 'overview',
  url: '/external-secrets-operator/overview',
  label: 'Overview',
});

// External Secrets - List route
registerRoute({
  path: '/external-secrets-operator/overview',
  sidebar: 'overview',
  parent: 'root',
  name: 'overview',
  component: () => <ExternalSecretsOperatorOverview />,
  exact: true,
});

// -----------------------------------
// --- External Secret ---
// -----------------------------------

// External Secrets - Sidebar entry
registerSidebarEntry({
  name: 'external-secrets',
  url: '/external-secrets-operator/externalsecret',
  parent: 'root',
  label: 'External Secrets',
});

// External Secrets - List route
registerRoute({
  path: '/external-secrets-operator/externalsecret',
  sidebar: 'external-secrets',
  name: 'External Secret List',
  component: () => <ExternalSecretList />,
  exact: true,
});

// External Secrets - Detail route
registerRoute({
  path: '/external-secrets-operator/externalsecret/:namespace/:name',
  name: 'external-secret-detail',
  component: ExternalSecretDetail,
  exact: true,
  hideSidebar: true,
});

// External Secrets - Action Processor
registerDetailsViewHeaderActionsProcessor((resource: ExternalSecret, headerActions) => {
  if (resource?.kind === 'ExternalSecret') {
    return [RenderExternalSecretSyncActionButton(resource), ...headerActions];
  }
  return headerActions;
});

// -----------------------------------
// --- Secret Store ---
// -----------------------------------

// Secret Store - Sidebar entry
registerSidebarEntry({
  name: 'secret-stores',
  url: '/external-secrets-operator/secretstore',
  parent: 'root',
  label: 'Secret Stores',
});

// Secret Store - List route
registerRoute({
  path: '/external-secrets-operator/secretstore',
  sidebar: 'secret-stores',
  name: 'Secret Store List',
  component: () => <SecretStoreList />,
  exact: true,
});

// Secret Store - Detail route
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

// Secret Store - Sidebar entry
registerSidebarEntry({
  name: 'cluster-secret-stores',
  url: '/external-secrets-operator/clustersecretstore',
  parent: 'root',
  label: 'Cluster Secret Stores',
});

// Secret Store - List route
registerRoute({
  path: '/external-secrets-operator/clustersecretstore',
  sidebar: 'cluster-secret-stores',
  name: 'Cluster Secret Store List',
  component: () => <ClusterSecretStoreList />,
  exact: true,
});

// Secret Store - Detail route
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

// External Secrets - Sidebar entry
registerSidebarEntry({
  name: 'cluster-external-secrets',
  url: '/external-secrets-operator/clusterexternalsecret',
  parent: 'root',
  label: 'Cluster External Secrets',
});

// Cluster External Secrets - List route
registerRoute({
  path: '/external-secrets-operator/clusterexternalsecret',
  sidebar: 'cluster-external-secrets',
  name: 'Cluster External Secret List',
  component: () => <ClusterExternalSecretList />,
  exact: true,
});

// Cluster External Secrets - Detail route
registerRoute({
  path: '/external-secrets-operator/clusterexternalsecret/:name',
  name: 'cluster-external-secret-detail',
  component: ClusterExternalSecretDetail,
  exact: true,
  hideSidebar: true,
});

// Cluster External Secrets - Action Processor
registerDetailsViewHeaderActionsProcessor((resource: ClusterExternalSecret, headerActions) => {
  if (resource?.kind === 'ClusterExternalSecret') {
    return [RenderClusterExternalSecretSyncActionButton(resource), ...headerActions];
  }
  return headerActions;
});

// -----------------------------------
// --- Push Secret ---
// -----------------------------------

// Push Secrets - Sidebar entry
registerSidebarEntry({
  name: 'push-secrets',
  url: '/external-secrets-operator/pushsecret',
  parent: 'root',
  label: 'Push Secrets',
});

// Push Secrets - List route
registerRoute({
  path: '/external-secrets-operator/pushsecret',
  sidebar: 'push-secrets',
  name: 'Push Secret List',
  component: () => <PushSecretList />,
  exact: true,
});

// Cluster External Secrets - Detail route
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

// Cluster Push Secrets - Sidebar entry
registerSidebarEntry({
  name: 'cluster-push-secrets',
  url: '/external-secrets-operator/clusterpushsecret',
  parent: 'root',
  label: 'Cluster Push Secrets',
});

// Cluster Push Secrets - List route
registerRoute({
  path: '/external-secrets-operator/clusterpushsecret',
  sidebar: 'cluster-push-secrets',
  name: 'Cluster Push Secret List',
  component: () => <ClusterPushSecretList />,
  exact: true,
});

// Cluster Push Secrets - Detail route
registerRoute({
  path: '/external-secrets-operator/clusterpushsecret/:name',
  name: 'cluster-push-secret-detail',
  component: ClusterPushSecretDetail,
  exact: true,
  hideSidebar: true,
});
