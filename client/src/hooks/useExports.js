import { useState } from 'react';
import toast from 'react-hot-toast';
import { exportsApi, triggerDownload } from '../api/exports.api.js';

function safeFilename(value, fallback) {
  return String(value || fallback)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

export function useExportCyclePdf() {
  const [loading, setLoading] = useState(false);

  async function download(cycleId, groupId, cycleName = 'cycle') {
    setLoading(true);
    const toastId = toast.loading('Génération du PDF...');
    try {
      const { data } = await exportsApi.downloadCyclePdf(cycleId, groupId);
      triggerDownload(data, `tontitrack-${safeFilename(cycleName, 'cycle')}.pdf`);
      toast.success('PDF téléchargé', { id: toastId });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la génération du PDF', { id: toastId });
    } finally {
      setLoading(false);
    }
  }

  return { download, loading };
}

export function useExportGroupExcel() {
  const [loading, setLoading] = useState(false);

  async function download(groupId, groupName = 'groupe') {
    setLoading(true);
    const toastId = toast.loading('Export Excel en cours...');
    try {
      const { data } = await exportsApi.downloadGroupExcel(groupId);
      triggerDownload(data, `tontitrack-${safeFilename(groupName, 'groupe')}-transactions.xlsx`);
      toast.success('Excel téléchargé', { id: toastId });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de l\'export Excel', { id: toastId });
    } finally {
      setLoading(false);
    }
  }

  return { download, loading };
}
