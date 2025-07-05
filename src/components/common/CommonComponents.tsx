import { Box, CircularProgress, Grid, Link as MuiLink, Typography } from '@mui/material';
import { useExternalSecretsOperatorInstalled } from '../../hooks/useExternalSecretsOperatorInstalled';

interface NotInstalledBannerProps {
  isLoading?: boolean;
}

export function NotInstalledBanner({ isLoading = false }: NotInstalledBannerProps) {
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={2} minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box display="flex" justifyContent="center" alignItems="center" p={2} minHeight="200px">
      <Grid container spacing={2} direction="column" justifyContent="center" alignItems="center">
        <Grid item>
          <Typography variant="h5">
            External Secret Operator was not detected on your cluster. If you haven't already,
            please install it.
          </Typography>
        </Grid>
        <Grid item>
          <Typography>
            Learn how to{' '}
            <MuiLink
              href="https://external-secrets.io/latest/introduction/getting-started/"
              target="_blank"
              rel="noopener noreferrer"
            >
              install
            </MuiLink>{' '}
            External Secrets Operator
          </Typography>
        </Grid>
      </Grid>
    </Box>
  );
}

interface ExternalSecretsOperatorInstallCheckProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ExternalSecretsOperatorInstallCheck({
  children,
  fallback,
}: ExternalSecretsOperatorInstallCheckProps) {
  const { isExternalSecretsOperatorInstalled, isExternalSecretsOperatorCheckLoading } =
    useExternalSecretsOperatorInstalled();

  if (!isExternalSecretsOperatorInstalled) {
    return fallback || <NotInstalledBanner isLoading={isExternalSecretsOperatorCheckLoading} />;
  }

  return <>{children}</>;
}
