import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { getPreferredExternalSecretsApiVersion } from '../utils/externalSecretsOperatorInstallation';

export interface ClusterSecretStoreAuth {
  secretRef?: {
    secretAccessKey?: {
      name: string;
      key: string;
      namespace?: string;
    };
    accessKeyID?: {
      name: string;
      key: string;
      namespace?: string;
    };
    sessionToken?: {
      name: string;
      key: string;
      namespace?: string;
    };
  };
  jwt?: {
    secretRef: {
      name: string;
      key: string;
      namespace?: string;
    };
  };
  kubernetes?: {
    serviceAccountRef?: {
      name: string;
      namespace?: string;
    };
    secretRef?: {
      secretAccessKey?: {
        name: string;
        key: string;
        namespace?: string;
      };
      accessKeyID?: {
        name: string;
        key: string;
        namespace?: string;
      };
    };
  };
}

export interface ClusterSecretStoreProvider {
  aws?: {
    service: 'SecretsManager' | 'ParameterStore';
    region: string;
    role?: string;
    auth?: ClusterSecretStoreAuth;
  };
  vault?: {
    server: string;
    path: string;
    version?: 'v1' | 'v2';
    auth?: ClusterSecretStoreAuth;
    namespace?: string;
    caBundle?: string;
    caProvider?: {
      type: string;
      name: string;
      key: string;
      namespace?: string;
    };
  };
  gcpsm?: {
    projectID: string;
    auth?: {
      secretRef?: {
        secretAccessKey?: {
          name: string;
          key: string;
          namespace?: string;
        };
      };
      workloadIdentity?: {
        clusterLocation: string;
        clusterName: string;
        serviceAccountRef: {
          name: string;
          namespace?: string;
        };
      };
    };
  };
  azurekv?: {
    vaultUrl: string;
    tenantId: string;
    auth?: {
      clientId?: string;
      clientSecret?: {
        name: string;
        key: string;
        namespace?: string;
      };
      managedIdentity?: {
        identityId?: string;
      };
    };
  };
  kubernetes?: {
    server?: {
      url?: string;
      caBundle?: string;
      caProvider?: {
        type: string;
        name: string;
        key: string;
        namespace?: string;
      };
    };
    auth?: ClusterSecretStoreAuth;
  };
}

export interface ClusterSecretStoreNamespaceSelector {
  matchNames?: string[];
  matchLabels?: Record<string, string>;
}

export interface ClusterSecretStoreSpec {
  provider: ClusterSecretStoreProvider;
  retrySettings?: {
    maxRetries?: number;
    retryInterval?: string;
  };
  refreshInterval?: string;
  namespaceSelectors?: ClusterSecretStoreNamespaceSelector[];
}

export interface ClusterSecretStoreCondition {
  type: string;
  status: string;
  reason?: string;
  message?: string;
  lastTransitionTime?: string;
}

export interface ClusterSecretStoreStatus {
  conditions?: ClusterSecretStoreCondition[];
  capabilities?: string[];
}

export interface ClusterSecretStoreCR extends KubeObjectInterface {
  spec: ClusterSecretStoreSpec;
  status?: ClusterSecretStoreStatus;
}

export class ClusterSecretStore extends KubeObject<ClusterSecretStoreCR> {
  static kind = 'ClusterSecretStore';
  static apiName = 'clustersecretstores';
  static isNamespaced = false; // Key difference: cluster-scoped

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
    return '/external-secrets-operator/clustersecretstore/:name';
  }

  get spec(): ClusterSecretStoreSpec {
    return this.jsonData.spec;
  }

  get status(): ClusterSecretStoreStatus {
    return this.jsonData.status || {};
  }

  get provider(): ClusterSecretStoreProvider {
    return this.spec.provider;
  }

  get providerType(): string {
    const provider = this.spec.provider;
    if (provider.aws) return 'AWS';
    if (provider.vault) return 'Vault';
    if (provider.gcpsm) return 'GCP Secret Manager';
    if (provider.azurekv) return 'Azure Key Vault';
    if (provider.kubernetes) return 'Kubernetes';
    return 'Unknown';
  }

  get refreshInterval(): string {
    return this.spec.refreshInterval || '1h';
  }

  get maxRetries(): number {
    return this.spec.retrySettings?.maxRetries || 5;
  }

  get retryInterval(): string {
    return this.spec.retrySettings?.retryInterval || '10s';
  }

  get namespaceSelectors(): ClusterSecretStoreNamespaceSelector[] {
    return this.spec.namespaceSelectors || [];
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

  get capabilities(): string[] {
    return this.status?.capabilities || [];
  }

  get isReady(): boolean {
    return this.readyCondition === 'True';
  }

  get isClusterWide(): boolean {
    return this.namespaceSelectors.length === 0;
  }

  // ===== HELPER METHODS =====

  getProviderConfig(): any {
    const provider = this.spec.provider;

    if (provider.aws) {
      return {
        type: 'AWS',
        service: provider.aws.service,
        region: provider.aws.region,
        role: provider.aws.role,
      };
    }

    if (provider.vault) {
      return {
        type: 'Vault',
        server: provider.vault.server,
        path: provider.vault.path,
        version: provider.vault.version || 'v2',
        namespace: provider.vault.namespace,
      };
    }

    if (provider.gcpsm) {
      return {
        type: 'GCP Secret Manager',
        projectID: provider.gcpsm.projectID,
      };
    }

    if (provider.azurekv) {
      return {
        type: 'Azure Key Vault',
        vaultUrl: provider.azurekv.vaultUrl,
        tenantId: provider.azurekv.tenantId,
      };
    }

    if (provider.kubernetes) {
      return {
        type: 'Kubernetes',
        server: provider.kubernetes.server?.url || 'In-cluster',
      };
    }

    return { type: 'Unknown' };
  }

  // Check if this ClusterSecretStore is available in a specific namespace
  isAllowedInNamespace(namespace: string, namespaceLabels: Record<string, string> = {}): boolean {
    // If no namespace selectors, it's available cluster-wide
    if (this.namespaceSelectors.length === 0) {
      return true;
    }

    // Check each namespace selector
    return this.namespaceSelectors.some(selector => {
      // Check name matching
      if (selector.matchNames) {
        if (selector.matchNames.includes(namespace)) {
          return true;
        }
      }

      // Check label matching
      if (selector.matchLabels) {
        const matches = Object.entries(selector.matchLabels).every(([key, value]) => {
          return namespaceLabels[key] === value;
        });
        if (matches) {
          return true;
        }
      }

      return false;
    });
  }

  // Get list of allowed namespaces (from matchNames selectors)
  getAllowedNamespaces(): string[] {
    const allowedNamespaces: string[] = [];

    this.namespaceSelectors.forEach(selector => {
      if (selector.matchNames) {
        allowedNamespaces.push(...selector.matchNames);
      }
    });

    return [...new Set(allowedNamespaces)]; // Remove duplicates
  }

  // Get namespace selector summary for display
  getNamespaceSelectorSummary(): string {
    if (this.namespaceSelectors.length === 0) {
      return 'All namespaces';
    }

    const summaries: string[] = [];

    this.namespaceSelectors.forEach(selector => {
      if (selector.matchNames && selector.matchNames.length > 0) {
        summaries.push(`Names: ${selector.matchNames.join(', ')}`);
      }

      if (selector.matchLabels && Object.keys(selector.matchLabels).length > 0) {
        const labelStrs = Object.entries(selector.matchLabels).map(
          ([key, value]) => `${key}=${value}`
        );
        summaries.push(`Labels: ${labelStrs.join(', ')}`);
      }
    });

    return summaries.length > 0 ? summaries.join(' | ') : 'All namespaces';
  }

  static getReadyCount(stores: ClusterSecretStore[]): { ready: number; total: number } {
    const ready = stores.filter(store => store.readyCondition === 'True').length;
    return { ready, total: stores.length };
  }

  static getProviderDistribution(
    stores: Array<{ providerType: string }>
  ): Array<{ name: string; value: number }> {
    const providerCounts = new Map<string, number>();
    stores.forEach(store => {
      const providerType = store.providerType;
      providerCounts.set(providerType, (providerCounts.get(providerType) || 0) + 1);
    });

    return Array.from(providerCounts.entries()).map(([name, value]) => ({
      name,
      value,
    }));
  }
}
