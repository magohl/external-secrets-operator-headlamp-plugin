import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { getPreferredExternalSecretsApiVersion } from '../utils/externalSecretsOperatorInstallation';

// Re-use interfaces from PushSecret
export interface PushSecretStoreRef {
  name: string;
  kind?: 'SecretStore' | 'ClusterSecretStore';
}

export interface PushSecretRemoteRef {
  remoteKey: string;
  property?: string;
}

export interface PushSecretMatch {
  secretKey?: string;
  remoteRef: PushSecretRemoteRef;
}

export interface PushSecretData {
  match: PushSecretMatch;
  conversionStrategy?: 'None' | 'Default' | 'ReverseUnicode';
  metadata?: any; // Provider-specific metadata
}

export interface PushSecretSelector {
  secret: {
    name: string;
  };
  generatorRef?: {
    apiVersion: string;
    kind: string;
    name: string;
  };
}

export interface PushSecretTemplate {
  engineVersion?: 'v1' | 'v2';
  data?: {
    [key: string]: string;
  };
  metadata?: {
    annotations?: {
      [key: string]: string;
    };
    labels?: {
      [key: string]: string;
    };
  };
  templateFrom?: Array<{
    configMap?: {
      name: string;
      items: Array<{
        key: string;
        templateAs?: 'Values' | 'KeysAndValues';
      }>;
    };
    secret?: {
      name: string;
      items: Array<{
        key: string;
        templateAs?: 'Values' | 'KeysAndValues';
      }>;
    };
    target?: 'Data' | 'Annotations' | 'Labels';
  }>;
}

export type PushSecretUpdatePolicy = 'Replace' | 'IfNotExist';
export type PushSecretDeletionPolicy = 'Delete' | 'None';

// ClusterPushSecret specific interfaces
export interface ClusterPushSecretSpec {
  refreshInterval?: string;
  namespaceSelector?: {
    matchLabels?: Record<string, string>;
    matchExpressions?: Array<{
      key: string;
      operator: 'In' | 'NotIn' | 'Exists' | 'DoesNotExist';
      values?: string[];
    }>;
  };
  namespaceSelectors?: Array<{
    matchLabels?: Record<string, string>;
    matchExpressions?: Array<{
      key: string;
      operator: 'In' | 'NotIn' | 'Exists' | 'DoesNotExist';
      values?: string[];
    }>;
  }>;
  pushSecretSpec: {
    refreshInterval?: string;
    secretStoreRefs: PushSecretStoreRef[];
    updatePolicy?: PushSecretUpdatePolicy;
    deletionPolicy?: PushSecretDeletionPolicy;
    selector: PushSecretSelector;
    template?: PushSecretTemplate;
    data?: PushSecretData[];
  };
  pushSecretName?: string;
  pushSecretMetadata?: {
    annotations?: Record<string, string>;
    labels?: Record<string, string>;
  };
}

export interface PushSecretStatusCondition {
  type: string;
  status: string;
  reason?: string;
  message?: string;
  lastTransitionTime?: string;
}

export interface ClusterPushSecretNamespaceFailure {
  namespace: string;
  reason: string;
  message?: string;
}

export interface ClusterPushSecretStatus {
  conditions?: PushSecretStatusCondition[];
  refreshTime?: string;
  syncedResourceVersion?: string;
  pushSecretStatuses?: Array<{
    name: string;
    namespace: string;
    status: {
      conditions?: PushSecretStatusCondition[];
      refreshTime?: string;
      syncedResourceVersion?: string;
      syncedPushSecrets?: {
        [remoteKey: string]: {
          match?: {
            [secretKey: string]: {
              remoteRef: PushSecretRemoteRef;
            };
          };
        };
      };
    };
  }>;
  provisionedNamespaces?: string[];
  failedNamespaces?: ClusterPushSecretNamespaceFailure[];
  pushSecretName?: string;
}

export interface ClusterPushSecretCR extends KubeObjectInterface {
  spec: ClusterPushSecretSpec;
  status?: ClusterPushSecretStatus;
}

export class ClusterPushSecret extends KubeObject<ClusterPushSecretCR> {
  static kind = 'ClusterPushSecret';
  static apiName = 'clusterpushsecrets';
  static isNamespaced = false; // Cluster-scoped resource

  private static _apiVersion: string | null = null;

  static async getApiVersion(): Promise<string> {
    if (!this._apiVersion) {
      this._apiVersion = await getPreferredExternalSecretsApiVersion();
    }
    return this._apiVersion || 'external-secrets.io/v1alpha1'; // ClusterPushSecret still uses v1alpha1
  }

  static get apiVersion(): string {
    return this._apiVersion || 'external-secrets.io/v1alpha1';
  }

  static get detailsRoute() {
    return '/external-secrets-operator/clusterpushsecret/:name';
  }

  get spec(): ClusterPushSecretSpec {
    return this.jsonData.spec;
  }

  get status(): ClusterPushSecretStatus {
    return this.jsonData.status || {};
  }

  get refreshInterval(): string {
    return this.spec.refreshInterval || this.spec.pushSecretSpec.refreshInterval || '1h';
  }

  get secretStoreRefs(): PushSecretStoreRef[] {
    return this.spec.pushSecretSpec.secretStoreRefs || [];
  }

  get pushSecretName(): string {
    return this.spec.pushSecretName || this.metadata.name;
  }

  get sourceSecretName(): string {
    return this.spec.pushSecretSpec.selector.secret.name;
  }

  get updatePolicy(): PushSecretUpdatePolicy {
    return this.spec.pushSecretSpec.updatePolicy || 'Replace';
  }

  get deletionPolicy(): PushSecretDeletionPolicy {
    return this.spec.pushSecretSpec.deletionPolicy || 'None';
  }

  get data(): PushSecretData[] {
    return this.spec.pushSecretSpec.data || [];
  }

  get template(): PushSecretTemplate | undefined {
    return this.spec.pushSecretSpec.template;
  }

  get namespaceSelector() {
    return this.spec.namespaceSelector;
  }

  get namespaceSelectors() {
    return this.spec.namespaceSelectors || [];
  }

  get provisionedNamespaces(): string[] {
    return this.status?.provisionedNamespaces || [];
  }

  get failedNamespaces(): ClusterPushSecretNamespaceFailure[] {
    return this.status?.failedNamespaces || [];
  }

  get readyCondition(): string | undefined {
    return this.status?.conditions?.find(c => c.type === 'Ready')?.status;
  }

  get readyConditionReason(): string | undefined {
    return this.status?.conditions?.find(c => c.type === 'Ready')?.reason;
  }

  get readyConditionMessage(): string | undefined {
    return this.status?.conditions?.find(c => c.type === 'Ready')?.message;
  }

  get syncedVersion(): string | undefined {
    return this.status?.syncedResourceVersion;
  }

  get lastRefreshTime(): string | undefined {
    return this.status?.refreshTime;
  }

  // Get push secret statuses for all namespaces
  get pushSecretStatuses() {
    return this.status?.pushSecretStatuses || [];
  }

  // Get ready count across all push secrets created by this cluster push secret
  get readyPushSecretsCount(): { ready: number; total: number } {
    const statuses = this.pushSecretStatuses;
    const ready = statuses.filter(
      status => status.status.conditions?.find(c => c.type === 'Ready')?.status === 'True'
    ).length;
    return { ready, total: statuses.length };
  }

  // ===== HELPER METHODS =====

  // Get all remote keys that this ClusterPushSecret is configured to push to
  getRemoteKeys(): string[] {
    const remoteKeys = new Set<string>();

    this.data.forEach(dataItem => {
      remoteKeys.add(dataItem.match.remoteRef.remoteKey);
    });

    return Array.from(remoteKeys);
  }

  // Get the mapping of secret keys to remote keys
  getSecretKeyMappings(): Array<{ secretKey?: string; remoteKey: string; property?: string }> {
    return this.data.map(dataItem => ({
      secretKey: dataItem.match.secretKey,
      remoteKey: dataItem.match.remoteRef.remoteKey,
      property: dataItem.match.remoteRef.property,
    }));
  }

  // Get all target push secret references with their namespaces
  getPushSecretReferences(): Array<{ namespace: string; pushSecretName: string }> {
    return this.pushSecretStatuses.map(status => ({
      namespace: status.namespace,
      pushSecretName: status.name,
    }));
  }

  // Get push secret reference for a specific namespace
  getPushSecretInNamespace(namespace: string): { pushSecretName: string } | null {
    const status = this.pushSecretStatuses.find(s => s.namespace === namespace);
    if (!status) return null;

    return {
      pushSecretName: status.name,
    };
  }

  // Get all namespaces where this ClusterPushSecret has created push secrets
  getPushSecretNamespaces(): string[] {
    return this.pushSecretStatuses.map(status => status.namespace);
  }

  // Check if a push secret exists in a specific namespace (based on PushSecret status)
  hasPushSecretInNamespace(namespace: string): boolean {
    const status = this.pushSecretStatuses.find(s => s.namespace === namespace);
    return status
      ? status.status.conditions?.find(c => c.type === 'Ready')?.status === 'True'
      : false;
  }

  // Get ready push secrets with their namespace info
  getReadyPushSecrets(): Array<{ namespace: string; pushSecretName: string }> {
    return this.pushSecretStatuses
      .filter(status => status.status.conditions?.find(c => c.type === 'Ready')?.status === 'True')
      .map(status => ({
        namespace: status.namespace,
        pushSecretName: status.name,
      }));
  }

  // Get all secret stores this ClusterPushSecret pushes to
  getSecretStores(): Array<{ name: string; kind: string }> {
    return this.secretStoreRefs.map(ref => ({
      name: ref.name,
      kind: ref.kind || 'SecretStore',
    }));
  }

  async addAnnotation(key: string, value: string): Promise<void> {
    return this.patch({
      metadata: {
        annotations: {
          [key]: value,
        },
      },
    });
  }

  async addAnnotations(annotations: Record<string, string>): Promise<void> {
    return this.patch({
      metadata: {
        annotations: annotations,
      },
    });
  }

  // Note: Do ClusterPushSecret support force-sync annotation like ExternalSecret. Lets check the ESO source code for the controller

  // ===== STATIC HELPER METHODS =====

  static getReadyCount(clusterPushSecrets: ClusterPushSecret[]): { ready: number; total: number } {
    const ready = clusterPushSecrets.filter(secret => secret.readyCondition === 'True').length;
    return { ready, total: clusterPushSecrets.length };
  }

  static getNamespaceDistribution(
    clusterPushSecrets: ClusterPushSecret[]
  ): Array<{ name: string; value: number }> {
    const namespaceCounts = new Map<string, number>();

    clusterPushSecrets.forEach(clusterSecret => {
      clusterSecret.provisionedNamespaces.forEach(namespace => {
        namespaceCounts.set(namespace, (namespaceCounts.get(namespace) || 0) + 1);
      });
    });

    return Array.from(namespaceCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, value]) => ({ name, value }));
  }

  static getSecretStoreDistribution(
    clusterPushSecrets: ClusterPushSecret[]
  ): Array<{ name: string; value: number; kind: string }> {
    const storeCounts = new Map<string, { count: number; kind: string }>();

    clusterPushSecrets.forEach(clusterSecret => {
      clusterSecret.secretStoreRefs.forEach(ref => {
        const storeKey = `${ref.name}:${ref.kind || 'SecretStore'}`;
        const existing = storeCounts.get(storeKey) || { count: 0, kind: ref.kind || 'SecretStore' };
        storeCounts.set(storeKey, { count: existing.count + 1, kind: existing.kind });
      });
    });

    return Array.from(storeCounts.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([nameAndKind, { count, kind }]) => ({
        name: nameAndKind.split(':')[0],
        value: count,
        kind,
      }));
  }

  // Get all push secrets created across namespaces
  static getTotalPushSecretsCount(clusterPushSecrets: ClusterPushSecret[]): number {
    return clusterPushSecrets.reduce((total, clusterSecret) => {
      return total + clusterSecret.pushSecretStatuses.length;
    }, 0);
  }

  // Get failed namespaces across all cluster push secrets
  static getFailedNamespacesCount(clusterPushSecrets: ClusterPushSecret[]): number {
    return clusterPushSecrets.reduce((total, clusterSecret) => {
      return total + clusterSecret.failedNamespaces.length;
    }, 0);
  }

  // Get total count of remote keys being pushed across all ClusterPushSecrets
  static getTotalRemoteKeysCount(clusterPushSecrets: ClusterPushSecret[]): number {
    return clusterPushSecrets.reduce((total, clusterSecret) => {
      return total + clusterSecret.getRemoteKeys().length;
    }, 0);
  }

  // Get sync success rate across all ClusterPushSecrets
  static getSyncSuccessRate(clusterPushSecrets: ClusterPushSecret[]): {
    ready: number;
    total: number;
    rate: number;
  } {
    let totalPushSecrets = 0;
    let readyPushSecrets = 0;

    clusterPushSecrets.forEach(clusterSecret => {
      const counts = clusterSecret.readyPushSecretsCount;
      totalPushSecrets += counts.total;
      readyPushSecrets += counts.ready;
    });

    const rate = totalPushSecrets > 0 ? (readyPushSecrets / totalPushSecrets) * 100 : 0;

    return {
      ready: readyPushSecrets,
      total: totalPushSecrets,
      rate: Math.round(rate * 100) / 100,
    };
  }
}
