import axios from "axios";

// Set the base URL for Axios
axios.defaults.baseURL = "/api"; // Ensure all requests are prefixed with /api

// Middleware to add token to every request
axios.interceptors.request.use((requestConfig) => {
  const token = window.SERVER_CONF?.APP_TOKEN; // Set by /config.js
  if (token) {
    requestConfig.headers.Authorization = `Bearer ${token}`;
  }
  return requestConfig;
});

const enc = encodeURIComponent;

// The server answers errors with plain text (or sometimes JSON).
export const apiErrorMessage = (error: any, fallback = "Request failed") => {
  const data = error?.response?.data;
  if (typeof data === "string" && data.trim()) return data.trim();
  if (data?.message) return data.message;
  return error?.message || fallback;
};

export const getApps = async () => {
  try {
    const response = await axios.get("/apps");
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.status === 401) {
      throw new Error(apiErrorMessage(error, "Unauthorized"));
    }
    throw error;
  }
};

// Returned oldest first; the last entry is the current (latest) release.
export const getDeploymentHistory = async (
  appName: string,
  deploymentName: string
) => {
  const response = await axios.get(
    `/apps/${enc(appName)}/deployments/${enc(deploymentName)}/history`
  );
  return response?.data?.history || [];
};

// Rolls the deployment back to `label` by publishing a copy of it as a new
// release. The server reads the target from the URL path (a body is ignored,
// which used to make every rollback go to the previous release instead).
export const rollbackDeployment = async (
  appName: string,
  deploymentName: string,
  label: string
) => {
  const history = await getDeploymentHistory(appName, deploymentName);
  const targetVersion = history.find((entry: any) => entry.label === label);

  if (!targetVersion) {
    throw new Error(`Label ${label} not found in deployment history.`);
  }

  const latest = history[history.length - 1];
  if (latest?.label === label) {
    throw new Error(`${label} is already the latest release.`);
  }
  if (targetVersion.appVersion !== latest?.appVersion) {
    throw new Error(
      `Cannot roll back to a different app version. Latest targets ${latest?.appVersion}, ${label} targets ${targetVersion.appVersion}.`
    );
  }

  try {
    const response = await axios.post(
      `/apps/${enc(appName)}/deployments/${enc(deploymentName)}/rollback/${enc(label)}`
    );
    return response.data;
  } catch (error: any) {
    throw new Error(apiErrorMessage(error, "Rollback failed"));
  }
};

export const updateDeploymentRelease = async (
  appName: string,
  deploymentName: string,
  releaseLabel: string,
  packageInfo: {
    appVersion?: string;
    description?: string;
    isMandatory?: boolean;
    rollout?: number;
    isDisabled?: boolean;
  }
) => {
  try {
    const response = await axios.patch(
      `/apps/${enc(appName)}/deployments/${enc(deploymentName)}/release`,
      {
        packageInfo: {
          ...packageInfo,
          label: releaseLabel, // Include the release label inside packageInfo
        },
      }
    );
    return response.data;
  } catch (error: any) {
    throw new Error(apiErrorMessage(error, "Update failed"));
  }
};

export const getDeploymentKeys = async (appName: string) => {
  const response = await axios.get(`/apps/${enc(appName)}/deployments`);
  return response.data.deployments.map((deployment: any) => ({
    name: deployment.name,
    key: deployment.key,
  }));
};

export const getDeploymentMetrics = async (
  appName: string,
  deploymentName: string
) => {
  const response = await axios.get(
    `/apps/${enc(appName)}/deployments/${enc(deploymentName)}/metrics`
  );
  return response.data;
};

declare global {
  interface Window {
    SERVER_CONF: any;
  }
}
