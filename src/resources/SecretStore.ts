import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { getPreferredExternalSecretsApiVersion } from '../utils/externalSecretsOperatorInstallation';

export interface SecretStoreAuth {
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

export interface SecretStoreProvider {
  aws?: {
    service: 'SecretsManager' | 'ParameterStore';
    region: string;
    role?: string;
    auth?: SecretStoreAuth;
  };
  vault?: {
    server: string;
    path: string;
    version?: 'v1' | 'v2';
    auth?: SecretStoreAuth;
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
    auth?: SecretStoreAuth;
  };
}

export interface SecretStoreSpec {
  provider: SecretStoreProvider;
  retrySettings?: {
    maxRetries?: number;
    retryInterval?: string;
  };
  refreshInterval?: string;
}

export interface SecretStoreCondition {
  type: string;
  status: string;
  reason?: string;
  message?: string;
  lastTransitionTime?: string;
}

export interface SecretStoreStatus {
  conditions?: SecretStoreCondition[];
  capabilities?: string[];
}

export interface SecretStoreCR extends KubeObjectInterface {
  spec: SecretStoreSpec;
  status?: SecretStoreStatus;
}

export class SecretStore extends KubeObject<SecretStoreCR> {
  static kind = 'SecretStore';
  static apiName = 'secretstores';
  static isNamespaced = true;

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
    return '/external-secrets-operator/secretstore/:namespace/:name';
  }

  get spec(): SecretStoreSpec {
    return this.jsonData.spec;
  }

  get status(): SecretStoreStatus {
    return this.jsonData.status || {};
  }

  get provider(): SecretStoreProvider {
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

  // ===== HELPER METHODS =====

  // Get provider-specific configuration details
  getProviderConfig(): any {
    const provider = this.spec.provider;
    
    if (provider.aws) {
      return {
        type: 'AWS',
        service: provider.aws.service,
        region: provider.aws.region,
        role: provider.aws.role
      };
    }
    
    if (provider.vault) {
      return {
        type: 'Vault',
        server: provider.vault.server,
        path: provider.vault.path,
        version: provider.vault.version || 'v2',
        namespace: provider.vault.namespace
      };
    }
    
    if (provider.gcpsm) {
      return {
        type: 'GCP Secret Manager',
        projectID: provider.gcpsm.projectID
      };
    }
    
    if (provider.azurekv) {
      return {
        type: 'Azure Key Vault',
        vaultUrl: provider.azurekv.vaultUrl,
        tenantId: provider.azurekv.tenantId
      };
    }
    
    if (provider.kubernetes) {
      return {
        type: 'Kubernetes',
        server: provider.kubernetes.server?.url || 'In-cluster'
      };
    }
    
    return { type: 'Unknown' };
  }

    static getReadyCount(stores: SecretStore[]): { ready: number; total: number } {
      const ready = stores.filter(store => store.readyCondition === 'True').length;
      return { ready, total: stores.length };
    }

  static getProviderDistribution(stores: Array<{ providerType: string }>): Array<{ name: string; value: number }> {
    const providerCounts = new Map<string, number>();
    stores.forEach(store => {
      const providerType = store.providerType;
      providerCounts.set(providerType, (providerCounts.get(providerType) || 0) + 1);
    });
    
    return Array.from(providerCounts.entries()).map(([name, value]) => ({
      name,
      value
    }));
  }
}