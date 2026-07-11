import { VercelResponse } from '@vercel/node';
import { withAuth, AuthenticatedRequest } from '../lib/auth';
import { db } from '../lib/db';

export default withAuth(async (req: AuthenticatedRequest, res: VercelResponse) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { mes, ano } = req.query;

    const mes_num = parseInt(mes as string) || new Date().getMonth() + 1;
    const ano_num = parseInt(ano as string) || new Date().getFullYear();

    // Ensure data is from June 2026 onwards
    let queryMes = mes_num;
    let queryAno = ano_num;
    const now = new Date(ano_num, mes_num - 1);
    const june2026 = new Date(2026, 5);

    if (now < june2026) {
      queryMes = 6;
      queryAno = 2026;
    }

    const dashboard = db.getDashboard(queryMes, queryAno);
    return res.status(200).json(dashboard);
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    return res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});
