import { VercelResponse } from '@vercel/node';
import { withAuth, AuthenticatedRequest } from './middleware/auth';

// Simple mock sync status
const syncStates: Record<string, any> = {
  status: 'sucesso',
  ultimaSincronizacao: new Date(Date.now() - 5 * 60000).toISOString(),
  proximaSincronizacaoAgendada: new Date(Date.now() + 25 * 60000).toISOString(),
  transacoesSincronizadas: 0,
};

export default withAuth(async (req: AuthenticatedRequest, res: VercelResponse) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    return res.status(200).json(syncStates);
  } catch (error) {
    console.error('Error fetching sync status:', error);
    return res.status(500).json({ error: 'Failed to fetch sync status' });
  }
});
