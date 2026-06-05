import cloudbase from "@cloudbase/js-sdk";

export const CLOUDBASE_ENV_ID = import.meta.env.VITE_CLOUDBASE_ENV_ID || "cloud1";
export const CLOUDBASE_REGION = import.meta.env.VITE_CLOUDBASE_REGION || "ap-shanghai";

const cloudbaseApp = cloudbase.init({
  env: CLOUDBASE_ENV_ID,
  region: CLOUDBASE_REGION,
});

let anonymousSignInPromise = null;

export function getCloudbaseApp() {
  return cloudbaseApp;
}

export async function ensureCloudbaseAuth() {
  const auth = cloudbaseApp.auth();

  if (!anonymousSignInPromise) {
    anonymousSignInPromise = auth.signInAnonymously().catch((error) => {
      anonymousSignInPromise = null;
      throw error;
    });
  }

  const response = await anonymousSignInPromise;
  if (response?.error) {
    anonymousSignInPromise = null;
    throw response.error;
  }

  return cloudbaseApp;
}
