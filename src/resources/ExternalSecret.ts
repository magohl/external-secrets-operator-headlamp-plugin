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

export interface ExternalSecretSpec {
  refreshInterval?: string;
  secretStoreRef: SecretStoreRef;
  target?: ExternalSecretTarget;
  data?: ExternalSecretData[];
  dataFrom?: ExternalSecretDataFrom[];
  syncPolicy?: 'Automatic' | 'Manual';
}

export interface ExternalSecretStatus {
  conditions?: {
    type: string;
    status: string;
    reason?: string;
    message?: string;
    lastTransitionTime?: string;
  }[];
  refreshTime?: string;
  syncedResourceVersion?: string;
}

export interface ExternalSecretCR extends KubeObjectInterface {
  spec: ExternalSecretSpec;
  status?: ExternalSecretStatus;
}

export class ExternalSecret extends KubeObject<ExternalSecretCR> {
  static kind = 'ExternalSecret';
  static apiName = 'externalsecrets';
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
    return '/external-secrets-operator/externalsecret/:namespace/:name';
  }

  get spec(): ExternalSecretSpec {
    return this.jsonData.spec;
  }

  get status(): ExternalSecretStatus {
    return this.jsonData.status || {};
  }

  get refreshInterval(): string {
    return this.spec.refreshInterval || '1h';
  }

  get secretStoreRef(): SecretStoreRef {
    return this.spec.secretStoreRef;
  }

  get targetName(): string {
    return this.spec.target?.name || this.metadata.name;
  }

  get creationPolicy(): string {
    return this.spec.target?.creationPolicy || 'Owner';
  }

  get deletionPolicy(): string {
    return this.spec.target?.deletionPolicy || 'Retain';
  }

  get data(): ExternalSecretData[] {
    return this.spec.data || [];
  }

  get dataFrom(): ExternalSecretDataFrom[] {
    return this.spec.dataFrom || [];
  }

  get syncPolicy(): string {
    return this.spec.syncPolicy || 'Automatic';
  }

  get readyCondition(): string | undefined {
    return this.status?.conditions?.find(c => c.type === 'Ready')?.status;
  }

  get syncedVersion(): string | undefined {
    return this.status?.syncedResourceVersion;
  }

  get lastRefreshTime(): string | undefined {
    return this.status?.refreshTime;
  }

  // ===== HELPER METHODS =====

  get readyConditionReason(): string | undefined {
    return this.status?.conditions?.find(c => c.type === 'Ready')?.reason;
  }

  get readyConditionMessage(): string | undefined {
    return this.status?.conditions?.find(c => c.type === 'Ready')?.message;
  }


  async addAnnotation(key: string, value: string): Promise<void> {
    return this.patch({
      metadata: {
        annotations: {
          [key]: value
        }
      }
    });
  }

  async addAnnotations(annotations: Record<string, string>): Promise<void> {
    return this.patch({
      metadata: {
        annotations: annotations
      }
    });
  }



  async forceSync(): Promise<void> {
    try {
      // Add force-sync annotation with current unix timestamp
      const annotationKey = 'force-sync';
      const annotationValue = Math.floor(Date.now() / 1000).toString();

      await this.addAnnotation(annotationKey, annotationValue);
    } catch (error) {
      console.error('Failed to add force-sync annotation:', error);
    }
  };

static getReadyCount(secrets: ExternalSecret[]): { ready: number; total: number } {
  const ready = secrets.filter(secret => secret.readyCondition === 'True').length;
  return { ready, total: secrets.length };
}

static getNamespaceDistribution(secrets: ExternalSecret[]): Array<{ name: string; value: number }> {
  const namespaceCounts = new Map<string, number>();
  secrets.forEach(secret => {
    const namespace = secret.metadata.namespace || 'default';
    namespaceCounts.set(namespace, (namespaceCounts.get(namespace) || 0) + 1);
  });
  
  return Array.from(namespaceCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, value]) => ({ name, value }));
}



}


