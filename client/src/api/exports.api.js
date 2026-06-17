import api from './axios.js';

export const exportsApi = {
  downloadCyclePdf: (cycleId, groupId) =>
    api.get(`/exports/cycles/${cycleId}/pdf`, {
      params: { groupId },
      responseType: 'blob',
    }),

  downloadGroupExcel: (groupId) =>
    api.get(`/exports/groups/${groupId}/excel`, {
      responseType: 'blob',
    }),
};

export function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
