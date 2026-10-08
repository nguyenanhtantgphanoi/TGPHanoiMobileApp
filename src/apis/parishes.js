import axios from 'axios';

const PARISHES_API_URL = 'https://lmwp.tgphanoi.org/api/parishes';

let parishesCache = null;
let parishesRequest = null;

const normalizeParishesResponse = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
};

export async function getParishes(options = {}) {
    const { forceRefresh = false } = options;

    if (forceRefresh) {
        parishesCache = null;
    }

    if (parishesCache) {
        return parishesCache;
    }

    if (parishesRequest) {
        return parishesRequest;
    }

    parishesRequest = axios.get(PARISHES_API_URL)
        .then((res) => {
            const parishes = normalizeParishesResponse(res.data);
            parishesCache = parishes;
            return parishes;
        })
        .finally(() => {
            parishesRequest = null;
        });

    return parishesRequest;
}

