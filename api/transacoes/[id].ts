import { VercelResponse } from '@vercel/node';
import { withAuth, AuthenticatedRequest } from '../middleware/auth';
import { db } from '../utils/db';

export default withAuth(async (req: AuthenticatedRequest, res: VercelResponse) => {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'ID is required' });
  }

  if (req.method === 'PUT') {
    try {
      const data = req.body;
      const transacao = db.updateTransacao(id, data);

      if (!transacao) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      return res.status(200).json(transacao);
    } catch (error) {
      console.error('Error updating transaction:', error);
      return res.status(500).json({ error: 'Failed to update transaction' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      db.deleteTransacao(id);
      return res.status(204).end();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      return res.status(500).json({ error: 'Failed to delete transaction' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
});
