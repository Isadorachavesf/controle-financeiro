import { VercelResponse } from '@vercel/node';
import { withAuth, AuthenticatedRequest } from '../lib/auth';
import { db } from '../lib/db';

export default withAuth(async (req: AuthenticatedRequest, res: VercelResponse) => {
  if (req.method === 'GET') {
    try {
      const categorias = db.getCategorias();
      return res.status(200).json(categorias);
    } catch (error) {
      console.error('Error fetching categories:', error);
      return res.status(500).json({ error: 'Failed to fetch categories' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { nome, limiteMensal, corGrafico } = req.body;

      if (!nome || !limiteMensal) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const categoria = db.createCategoria({
        nome,
        limiteMensal: parseFloat(limiteMensal),
        corGrafico: corGrafico || '#3b82f6',
      });

      return res.status(201).json(categoria);
    } catch (error) {
      console.error('Error creating category:', error);
      return res.status(500).json({ error: 'Failed to create category' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
});
