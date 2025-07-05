import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { getPreferredExternalSecretsApiVersion } from '../utils/externalSecretsOperatorInstallation';

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

export interface PushSecretSpec {
  refreshInterval?: string;
  secretStoreRefs: PushSecretStoreRef[];
  updatePolicy?: PushSecretUpdatePolicy;
  deletionPolicy?: PushSecretDeletionPolicy;
  selector: PushSecretSelector;
  template?: PushSecretTemplate;
  data?: PushSecretData[];
}

export interface PushSecretStatusCondition {
  type: string;
  status: string;
  reason?: string;
  message?: string;
  lastTransitionTime?: string;
}

export interface SyncedPushSecretsMap {
  [remoteKey: string]: {
    match?: {
      [secretKey: string]: {
        remoteRef: PushSecretRemoteRef;
      };
    };
  };
}

export interface PushSecretStatus {
  conditions?: PushSecretStatusCondition[];
  refreshTime?: string;
  syncedResourceVersion?: string;
  syncedPushSecrets?: SyncedPushSecretsMap;
}

export interface PushSecretCR extends KubeObjectInterface {
  spec: PushSecretSpec;
  status?: PushSecretStatus;
}

export class PushSecret extends KubeObject<PushSecretCR> {
  static kind = 'PushSecret';
  static apiName = 'pushsecrets';
  static isNamespaced = true;

  private static _apiVersion: string | null = null;

  static async getApiVersion(): Promise<string> {
    if (!this._apiVersion) {
      this._apiVersion = await getPreferredExternalSecretsApiVersion();
    }
    return this._apiVersion || 'external-secrets.io/v1alpha1'; // PushSecret still uses v1alpha1
  }

  static get apiVersion(): string {
    return this._apiVersion || 'external-secrets.io/v1alpha1';
  }

  static get detailsRoute() {
    return '/external-secrets-operator/pushsecret/:namespace/:name';
  }

  get spec(): PushSecretSpec {
    return this.jsonData.spec;
  }

  get status(): PushSecretStatus {
    return this.jsonData.status || {};
  }

  get refreshInterval(): string {
    return this.spec.refreshInterval || '1h';
  }

  get secretStoreRefs(): PushSecretStoreRef[] {
    return this.spec.secretStoreRefs || [];
  }

  get sourceSecretName(): string {
    return this.spec.selector.secret.name;
  }

  get updatePolicy(): PushSecretUpdatePolicy {
    return this.spec.updatePolicy || 'Replace';
  }

  get deletionPolicy(): PushSecretDeletionPolicy {
    return this.spec.deletionPolicy || 'None';
  }

  get data(): PushSecretData[] {
    return this.spec.data || [];
  }

  get template(): PushSecretTemplate | undefined {
    return this.spec.template;
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

  get syncedPushSecrets(): SyncedPushSecretsMap {
    return this.status?.syncedPushSecrets || {};
  }

  // ===== HELPER METHODS =====

  // Get all remote keys that this PushSecret is configured to push to
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

  // Check if a specific remote key has been successfully synced
  isRemoteKeySynced(remoteKey: string): boolean {
    return this.syncedPushSecrets.hasOwnProperty(remoteKey);
  }

  // Get sync status for all remote keys
  getSyncStatus(): Array<{ remoteKey: string; synced: boolean }> {
    const remoteKeys = this.getRemoteKeys();
    return remoteKeys.map(remoteKey => ({
      remoteKey,
      synced: this.isRemoteKeySynced(remoteKey),
    }));
  }

  // Get all secret stores this PushSecret pushes to
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

  // ===== STATIC HELPER METHODS =====

  static getReadyCount(pushSecrets: PushSecret[]): { ready: number; total: number } {
    const ready = pushSecrets.filter(secret => secret.readyCondition === 'True').length;
    return { ready, total: pushSecrets.length };
  }

  static getNamespaceDistribution(
    pushSecrets: PushSecret[]
  ): Array<{ name: string; value: number }> {
    const namespaceCounts = new Map<string, number>();
    pushSecrets.forEach(secret => {
      const namespace = secret.metadata.namespace || 'default';
      namespaceCounts.set(namespace, (namespaceCounts.get(namespace) || 0) + 1);
    });

    return Array.from(namespaceCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, value]) => ({ name, value }));
  }

  static getSecretStoreDistribution(
    pushSecrets: PushSecret[]
  ): Array<{ name: string; value: number; kind: string }> {
    const storeCounts = new Map<string, { count: number; kind: string }>();

    pushSecrets.forEach(secret => {
      secret.secretStoreRefs.forEach(ref => {
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

  // Get total count of remote keys being pushed across all PushSecrets
  static getTotalRemoteKeysCount(pushSecrets: PushSecret[]): number {
    return pushSecrets.reduce((total, pushSecret) => {
      return total + pushSecret.getRemoteKeys().length;
    }, 0);
  }

  // Get sync success rate across all PushSecrets
  static getSyncSuccessRate(pushSecrets: PushSecret[]): {
    synced: number;
    total: number;
    rate: number;
  } {
    let totalRemoteKeys = 0;
    let syncedRemoteKeys = 0;

    pushSecrets.forEach(pushSecret => {
      const remoteKeys = pushSecret.getRemoteKeys();
      totalRemoteKeys += remoteKeys.length;
      syncedRemoteKeys += remoteKeys.filter(key => pushSecret.isRemoteKeySynced(key)).length;
    });

    const rate = totalRemoteKeys > 0 ? (syncedRemoteKeys / totalRemoteKeys) * 100 : 0;

    return {
      synced: syncedRemoteKeys,
      total: totalRemoteKeys,
      rate: Math.round(rate * 100) / 100,
    };
  }
}
