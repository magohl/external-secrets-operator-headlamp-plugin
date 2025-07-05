import { ApiProxy } from '@kinvolk/headlamp-plugin/lib';

export async function getExternalSecretsOperatorApiVersions(): Promise<string[]> {
  try {
    const response = await ApiProxy.request('/apis/external-secrets.io', {
      method: 'GET',
    });

    if (response && response.versions) {
      return response.versions.map(v => `external-secrets.io/${v.version}`);
    }
    return [];
  } catch (error) {
    console.error('Error fetching External Secrets API versions:', error);
    return [];
  }
}

export async function isExternalSecretsOperatorInstalled(): Promise<boolean> {
  try {
    const versions = await getExternalSecretsOperatorApiVersions();
    return versions.length > 0;
  } catch (error) {
    return false;
  }
}

export async function getPreferredExternalSecretsApiVersion(): Promise<string | null> {
  try {
    const response = await ApiProxy.request('/apis/external-secrets.io', {
      method: 'GET',
    });

    if (response && response.preferredVersion) {
      return `external-secrets.io/${response.preferredVersion.version}`;
    }

    // Fallback: get available versions and prefer v1 over v1beta1
    const versions = await getExternalSecretsOperatorApiVersions();
    if (versions.includes('external-secrets.io/v1')) {
      return 'external-secrets.io/v1';
    }
    if (versions.includes('external-secrets.io/v1beta1')) {
      return 'external-secrets.io/v1beta1';
    }

    return versions[0] || null;
  } catch (error) {
    console.error('Error getting preferred API version:', error);
    return null;
  }
}
