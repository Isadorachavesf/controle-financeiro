import { VercelResponse } from '@vercel/node';
import { withAuth, AuthenticatedRequest } from '../lib/auth';
import { db } from '../lib/db';

export default withAuth(async (req: AuthenticatedRequest, res: VercelResponse) => {
  const { mes, ano, categoria_id } = req.query;

  if (req.method === 'GET') {
    try {
      let transacoes = db.getTransacoes(
        parseInt(mes as string) || new Date().getMonth() + 1,
        parseInt(ano as string) || new Date().getFullYear()
      );

      if (categoria_id) {
        transacoes = transacoes.filter((t) => t.categoriaId === categoria_id);
      }

      return res.status(200).json(transacoes);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return res.status(500).json({ error: 'Failed to fetch transactions' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { categoriaId, descricao, valor, dataTransacao, tipo, metodoPagamento, notas } =
        req.body;

      if (!categoriaId || !descricao || !valor || !dataTransacao || !tipo) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const transacao = db.createTransacao({
        categoriaId,
        descricao,
        valor: parseFloat(valor),
        dataTransacao,
        tipo,
        metodoPagamento,
        notas,
      });

      return res.status(201).json(transacao);
    } catch (error) {
      console.error('Error creating transaction:', error);
      return res.status(500).json({ error: 'Failed to create transaction' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
});
