import { ApiProxy } from '@kinvolk/headlamp-plugin/lib';
import { K8s } from '@kinvolk/headlamp-plugin/lib';
import React from 'react';

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

export function useESOVersion() {
  const [pods] = K8s.ResourceClasses.Pod.useList();

  const version = React.useMemo(() => {
    if (!pods) return null;

    const esoController = pods.find(
      pod => pod.metadata.labels?.['app.kubernetes.io/instance'] === 'external-secrets'
    );

    return esoController?.metadata?.labels?.['app.kubernetes.io/version'] || null;
  }, [pods]);

  return version;
}

export function useESOControllers() {
  const [pods] = K8s.ResourceClasses.Pod.useList(); // No namespace filter

  const controllers = React.useMemo(() => {
    if (!pods) return null;

    const esoControllers = pods.filter(
      pod => pod.metadata.labels?.['app.kubernetes.io/instance'] === 'external-secrets'
    );

    const controllerStatus = {
      total: esoControllers.length,
      running: esoControllers.filter(pod => pod.status?.phase === 'Running').length,
      controllers: esoControllers.map(pod => ({
        name: pod.metadata.name,
        namespace: pod.metadata.namespace,
        status: pod.status?.phase || 'Unknown',
        ready: pod.status?.phase === 'Running',
      })),
    };

    return controllerStatus;
  }, [pods]);

  return controllers;
}
