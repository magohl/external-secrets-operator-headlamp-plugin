import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { getPreferredExternalSecretsApiVersion } from '../utils/externalSecretsOperatorInstallation';

export interface SecretStoreRef {
  name: string;
  kind?: 'SecretStore' | 'ClusterSecretStore';
}

export interface RemoteRef {
  key: string;
  version?: string;
  property?: string;
  conversionStrategy?: 'Default' | 'Unicode';
  decodingStrategy?: 'None' | 'Base64';
  metadataPolicy?: 'Fetch' | 'None';
}

export interface ExternalSecretData {
  secretKey: string;
  remoteRef: RemoteRef;
}

export interface ExternalSecretDataFrom {
  extract: {
    key: string;
    version?: string;
    conversionStrategy?: 'Default' | 'Unicode';
    decodingStrategy?: 'None' | 'Base64';
    metadataPolicy?: 'Fetch' | 'None';
  };
}

export interface ExternalSecretTarget {
  name?: string;
  template?: any;
  creationPolicy?: 'Owner' | 'Merge' | 'None' | 'Orphan';
  deletionPolicy?: 'Retain' | 'Delete';
  templateFrom?: any;
}

export interface ClusterExternalSecretSpec {
  refreshInterval?: string;
  secretStoreRef?: SecretStoreRef;
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
  externalSecretSpec: {
    refreshInterval?: string;
    secretStoreRef: SecretStoreRef;
    target?: ExternalSecretTarget;
    data?: ExternalSecretData[];
    dataFrom?: ExternalSecretDataFrom[];
    syncPolicy?: 'Automatic' | 'Manual';
  };
  externalSecretName?: string;
  externalSecretMetadata?: {
    annotations?: Record<string, string>;
    labels?: Record<string, string>;
  };
}

export interface ClusterExternalSecretStatus {
  conditions?: {
    type: string;
    status: string;
    reason?: string;
    message?: string;
    lastTransitionTime?: string;
  }[];
  refreshTime?: string;
  syncedResourceVersion?: string;
  externalSecretStatuses?: Array<{
    name: string;
    namespace: string;
    status: {
      conditions?: {
        type: string;
        status: string;
        reason?: string;
        message?: string;
        lastTransitionTime?: string;
      }[];
      refreshTime?: string;
      syncedResourceVersion?: string;
    };
  }>;
  provisionedNamespaces?: string[];
  failedNamespaces?: Array<{
    namespace: string;
    reason: string;
    message?: string;
  }>;
}

export interface ClusterExternalSecretCR extends KubeObjectInterface {
  spec: ClusterExternalSecretSpec;
  status?: ClusterExternalSecretStatus;
}

export class ClusterExternalSecret extends KubeObject<ClusterExternalSecretCR> {
  static kind = 'ClusterExternalSecret';
  static apiName = 'clusterexternalsecrets';
  static isNamespaced = false; // Cluster-scoped resource

  private static _apiVersion: string | null = null;

  static async getApiVersion(): Promise<string> {
    if (!this._apiVersion) {
      this._apiVersion = await getPreferredExternalSecretsApiVersion();
    }
    return this._apiVersion || 'external-secrets.io/v1'; // fallback
  }

  static get apiVersion(): string {
    return this._apiVersion || 'external-secrets.io/v1';
  }

  static get detailsRoute() {
    return '/external-secrets-operator/clusterexternalsecret/:name';
  }

  get spec(): ClusterExternalSecretSpec {
    return this.jsonData.spec;
  }

  get status(): ClusterExternalSecretStatus {
    return this.jsonData.status || {};
  }

  get refreshInterval(): string {
    return this.spec.refreshInterval || this.spec.externalSecretSpec.refreshInterval || '1h';
  }

  get secretStoreRef(): SecretStoreRef {
    return this.spec.secretStoreRef || this.spec.externalSecretSpec.secretStoreRef;
  }

  get externalSecretName(): string {
    return this.spec.externalSecretName || this.metadata.name;
  }

  get targetName(): string {
    return this.spec.externalSecretSpec.target?.name || this.metadata.name;
  }

  get creationPolicy(): string {
    return this.spec.externalSecretSpec.target?.creationPolicy || 'Owner';
  }

  get deletionPolicy(): string {
    return this.spec.externalSecretSpec.target?.deletionPolicy || 'Retain';
  }

  get data(): ExternalSecretData[] {
    return this.spec.externalSecretSpec.data || [];
  }

  get dataFrom(): ExternalSecretDataFrom[] {
    return this.spec.externalSecretSpec.dataFrom || [];
  }

  get syncPolicy(): string {
    return this.spec.externalSecretSpec.syncPolicy || 'Automatic';
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

  get failedNamespaces() {
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

  get lastRefreshTime(): string | undefined {
    return this.status?.refreshTime;
  }

  get syncedVersion(): string | undefined {
    return this.status?.syncedResourceVersion;
  }

  // Get external secret statuses for all namespaces
  get externalSecretStatuses() {
    return this.status?.externalSecretStatuses || [];
  }

  // Get ready count across all external secrets created by this cluster external secret
  get readyExternalSecretsCount(): { ready: number; total: number } {
    const statuses = this.externalSecretStatuses;
    const ready = statuses.filter(
      status => status.status.conditions?.find(c => c.type === 'Ready')?.status === 'True'
    ).length;
    return { ready, total: statuses.length };
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

  async forceSync(): Promise<void> {
    try {
      // Add force-sync annotation with current unix timestamp as described in the eso docs in section 'manual refresh'
      const annotationKey = 'force-sync';
      const annotationValue = Math.floor(Date.now() / 1000).toString();

      await this.addAnnotation(annotationKey, annotationValue);
    } catch (error) {
      console.error('Failed to add force-sync annotation:', error);
    }
  }

  // Static helper methods
  static getReadyCount(clusterSecrets: ClusterExternalSecret[]): { ready: number; total: number } {
    const ready = clusterSecrets.filter(secret => secret.readyCondition === 'True').length;
    return { ready, total: clusterSecrets.length };
  }

  static getNamespaceDistribution(
    clusterSecrets: ClusterExternalSecret[]
  ): Array<{ name: string; value: number }> {
    const namespaceCounts = new Map<string, number>();

    clusterSecrets.forEach(clusterSecret => {
      clusterSecret.provisionedNamespaces.forEach(namespace => {
        namespaceCounts.set(namespace, (namespaceCounts.get(namespace) || 0) + 1);
      });
    });

    return Array.from(namespaceCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, value]) => ({ name, value }));
  }

  // Get all external secrets created across namespaces
  static getTotalExternalSecretsCount(clusterSecrets: ClusterExternalSecret[]): number {
    return clusterSecrets.reduce((total, clusterSecret) => {
      return total + clusterSecret.externalSecretStatuses.length;
    }, 0);
  }

  // Get failed namespaces across all cluster external secrets
  static getFailedNamespacesCount(clusterSecrets: ClusterExternalSecret[]): number {
    return clusterSecrets.reduce((total, clusterSecret) => {
      return total + clusterSecret.failedNamespaces.length;
    }, 0);
  }

  // ===== TARGET SECRET NAMESPACE TRACKING =====

  // Get all target secret references with their namespaces
  getTargetSecretReferences(): Array<{
    namespace: string;
    secretName: string;
    externalSecretName: string;
  }> {
    return this.externalSecretStatuses.map(status => ({
      namespace: status.namespace,
      secretName: this.targetName, // The actual Kubernetes Secret name
      externalSecretName: status.name, // The ExternalSecret name
    }));
  }

  // Get target secret reference for a specific namespace
  getTargetSecretInNamespace(
    namespace: string
  ): { secretName: string; externalSecretName: string } | null {
    const status = this.externalSecretStatuses.find(s => s.namespace === namespace);
    if (!status) return null;

    return {
      secretName: this.targetName,
      externalSecretName: status.name,
    };
  }

  // Get all namespaces where this ClusterExternalSecret has created target secrets
  getTargetSecretNamespaces(): string[] {
    return this.externalSecretStatuses.map(status => status.namespace);
  }

  // Check if a target secret exists in a specific namespace (based on ExternalSecret status)
  hasTargetSecretInNamespace(namespace: string): boolean {
    const status = this.externalSecretStatuses.find(s => s.namespace === namespace);
    return status
      ? status.status.conditions?.find(c => c.type === 'Ready')?.status === 'True'
      : false;
  }

  // Get ready target secrets with their namespace info
  getReadyTargetSecrets(): Array<{
    namespace: string;
    secretName: string;
    externalSecretName: string;
  }> {
    return this.externalSecretStatuses
      .filter(status => status.status.conditions?.find(c => c.type === 'Ready')?.status === 'True')
      .map(status => ({
        namespace: status.namespace,
        secretName: this.targetName,
        externalSecretName: status.name,
      }));
  }
}
