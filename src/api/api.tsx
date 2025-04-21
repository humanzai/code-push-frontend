import axios from "axios";
import config from "../../config.json"; // Load configuration from static JSON file

// Set the base URL for Axios
axios.defaults.baseURL = config.BASE_URL; // Ensure all requests are prefixed with /api

// Middleware to add token to every request
axios.interceptors.request.use((requestConfig) => {
  const token = config.APP_TOKEN; // Retrieve token from config.json
  if (token) {
    requestConfig.headers.Authorization = `Bearer ${token}`;
  }
  return requestConfig;
});

export const getApps = async () => {
  const response = await axios.get("/apps");
  return response.data;
};

export const getDeploymentHistory = async (
  appName: string,
  deploymentName: string
) => {
  const response = await axios.get(
    `/apps/${appName}/deployments/${deploymentName}/history`
  );
  return response?.data?.history;
};

export const rollbackDeployment = async (
  appName: string,
  deploymentName: string,
  label: string
) => {
  await axios.post(`/apps/${appName}/deployments/${deploymentName}/rollback`, {
    label,
  });
};

const rollbackToPreviousVersion = async (
  appName: string,
  deploymentName: string,
  version?: string
) => {
  const response = await axios.post(
    `/apps/${appName}/deployments/${deploymentName}/rollback${
      version ? `/${version}` : ""
    }`
  );
  return response.data;
};

export { rollbackToPreviousVersion };

export const updateDeploymentRelease = async (
  appName: string,
  deploymentName: string,
  packageInfo: {
    appVersion: string;
    description: string;
    isMandatory: boolean;
    rollout: number;
    isDisabled: boolean;
  }
) => {
  const response = await axios.patch(
    `/apps/${appName}/deployments/${deploymentName}/release`,
    { packageInfo }
  );
  return response.data;
};

export const getDeploymentKeys = async (appName: string) => {
  const response = await axios.get(`/apps/${appName}/deployments`);
  return response.data.deployments.map((deployment: any) => ({
    name: deployment.name,
    key: deployment.key,
  }));
};
