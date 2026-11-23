ARG DIRECTUS_VERSION=11.17.4
FROM directus/directus:${DIRECTUS_VERSION}

# The schemas, access policies, seeds and the loader that applies them are part
# of the image. Rebuild it to ship a change; nothing is mounted at runtime.
USER root
WORKDIR /opt/tunisaid
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && chown -R node:node /opt/tunisaid
COPY --chown=node:node scripts ./scripts
COPY --chown=node:node schemas ./schemas
COPY --chown=node:node access ./access
COPY --chown=node:node seeds ./seeds
COPY --chown=node:node --chmod=755 entrypoint.sh ./entrypoint.sh

USER node
WORKDIR /directus
CMD ["/opt/tunisaid/entrypoint.sh"]
