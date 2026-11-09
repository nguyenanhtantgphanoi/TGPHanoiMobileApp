import axios from 'axios';

const DATA_VERSIONS_API_URL = 'https://mapp.tgphanoi.org/api-fastify/data-versions';

/** Returns the server supplied cache versions, or null when unavailable. */
export const fetchDataVersions = async () => {
    try {
        const response = await axios.get(DATA_VERSIONS_API_URL, { timeout: 10000 });
        if (response.data?.success !== true || !response.data?.data) return null;
        return response.data.data;
    } catch {
        return null;
    }
};

/** A missing local version is stale when the server returned a version. */
export const isCacheVersionStale = (cachedVersion, currentVersion) => (
    Boolean(currentVersion) && String(cachedVersion || '') !== String(currentVersion)
);
