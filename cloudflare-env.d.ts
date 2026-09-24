/// <reference types="@cloudflare/workers-types" />

declare global {
  interface CloudflareEnv {
    DB: D1Database;
    HOUSE: KVNamespace;
    MEDIA: R2Bucket;
    WEBFLOW_CLOUD_MEDIA?: R2Bucket;
  }
}

export {};
