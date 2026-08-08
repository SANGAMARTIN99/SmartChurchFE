import { getAccessToken } from './auth';
import { ENDPOINT } from '../api/environment';

export const handleExportDownload = async (path: string, filename: string, params: Record<string, string> = {}) => {
    try {
        const token = getAccessToken();
        const baseUrl = ENDPOINT.replace('/graphql/', '');

        // Construct query string
        const url = new URL(`${baseUrl}${path}`);
        Object.keys(params).forEach(key => {
            if (params[key]) {
                url.searchParams.append(key, params[key]);
            }
        });

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to download: ${response.statusText}`);
        }

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
        console.error('Export failed:', error);
        alert('Failed to export data. Please try again.');
    }
};

// Revision note [2026-07-25 09:20:26 +0300]: Optimize member dashboard metrics display

// Revision note [2026-08-08 14:39:21 +0300]: Update authentication header propagation logic
