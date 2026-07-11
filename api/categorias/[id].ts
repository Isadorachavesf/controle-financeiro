import { VercelResponse } from '@vercel/node';
import { withAuth, AuthenticatedRequest } from '../../lib/auth';
import { db } from '../../lib/db';

export default withAuth(async (req: AuthenticatedRequest, res: VercelResponse) => {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'ID is required' });
  }

  if (req.method === 'PUT') {
    try {
      const data = req.body;
      if (data.limiteMensal) {
        data.limiteMensal = parseFloat(data.limiteMensal);
      }

      const categoria = db.updateCategoria(id, data);

      if (!categoria) {
        return res.status(404).json({ error: 'Category not found' });
      }

      return res.status(200).json(categoria);
    } catch (error) {
      console.error('Error updating category:', error);
      return res.status(500).json({ error: 'Failed to update category' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
});
