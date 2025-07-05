FROM busybox:1.37.0-glibc@sha256:7c0ffe5751238c8479f952f3fbc3b719d47bccac0e9bf0a21c77a27cba9ef12d

COPY external-secrets-operator-headlamp-plugin /plugins/external-secrets-operator-headlamp-plugin/

USER 1001