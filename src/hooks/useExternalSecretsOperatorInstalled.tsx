import { useEffect, useState } from 'react';
import { isExternalSecretsOperatorInstalled as checkExternalSecretsOperatorInstallation } from '../utils/externalSecretsOperatorInstallation';

export function useExternalSecretsOperatorInstalled() {
  const [isExternalSecretsOperatorInstalled, setIsExternalSecretsOperatorInstalled] = useState<
    boolean | null
  >(null);

  useEffect(() => {
    async function checkExternalSecretsOperatorInstalled() {
      const isInstalled = await checkExternalSecretsOperatorInstallation();
      setIsExternalSecretsOperatorInstalled(!!isInstalled);
    }
    checkExternalSecretsOperatorInstalled();
  }, []);

  return {
    isExternalSecretsOperatorInstalled,
    isExternalSecretsOperatorCheckLoading: isExternalSecretsOperatorInstalled === null,
  };
}
