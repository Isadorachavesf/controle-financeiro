import { VercelResponse } from '@vercel/node';
import { withAuth, AuthenticatedRequest } from '../lib/auth';
import { db } from '../lib/db';

// Mock sync state
let lastSyncTime = new Date();
let syncInProgress = false;

export default withAuth(async (req: AuthenticatedRequest, res: VercelResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (syncInProgress) {
      return res.status(409).json({ error: 'Sync already in progress' });
    }

    syncInProgress = true;

    // Simulate sync delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const transacoes = db.getTransacoes(new Date().getMonth() + 1, new Date().getFullYear());

    // Mock Google Sheets sync
    // In production, this would:
    // 1. Authenticate with Google Sheets API
    // 2. Read/write data to the sheet
    // 3. Handle conflicts
    // 4. Log sync results

    lastSyncTime = new Date();
    syncInProgress = false;

    return res.status(200).json({
      success: true,
      status: 'sucesso',
      ultimaSincronizacao: lastSyncTime.toISOString(),
      proximaSincronizacaoAgendada: new Date(lastSyncTime.getTime() + 30 * 60000).toISOString(),
      transacoesSincronizadas: transacoes.length,
    });
  } catch (error) {
    console.error('Error syncing with Google Sheets:', error);
    syncInProgress = false;

    return res.status(500).json({
      status: 'erro',
      ultimaSincronizacao: lastSyncTime.toISOString(),
      motivoErro: 'Failed to sync with Google Sheets',
    });
  }
});
