import { transactionService } from './transaction.service.js';
import { catchAsync }         from '../../utils/catchAsync.js';
import { ValidationError }    from '../../utils/ApiError.js';

export const transactionController = {

  // GET /api/transactions/group/:groupId
  // Historique paginé d'un groupe avec filtres optionnels
  getGroupHistory: catchAsync(async (req, res) => {
    const { page, limit, type } = req.query;

    // Validation des query params — types acceptés uniquement
    const validTypes = ['contribution', 'penalty', 'payout', 'refund'];
    if (type && !validTypes.includes(type)) {
      throw new ValidationError(`Type invalide. Valeurs acceptées : ${validTypes.join(', ')}`);
    }

    const data = await transactionService.getGroupHistory(
      req.params.groupId,
      req.user._id,
      {
        page:  Math.max(1, parseInt(page) || 1),
        limit: Math.min(100, parseInt(limit) || 20), // max 100 par page
        type,
      }
    );

    res.json({ status: 'success', data });
  }),

  // GET /api/transactions/me
  // Toutes les transactions personnelles du user connecté
  getMyTransactions: catchAsync(async (req, res) => {
    const { page, limit, type, groupId } = req.query;

    const data = await transactionService.getUserTransactions(
      req.user._id,
      {
        page:    Math.max(1, parseInt(page) || 1),
        limit:   Math.min(100, parseInt(limit) || 20),
        type,
        groupId,
      }
    );

    res.json({ status: 'success', data });
  }),

  // POST /api/transactions/correct/:transactionId
  // Correction d'une transaction erronée — admin seulement
  correctTransaction: catchAsync(async (req, res) => {
    const result = await transactionService.correctTransaction({
      wrongTransactionId: req.params.transactionId,
      adminId:            req.user._id,
      correctedData:      req.body,
    });

    res.json({ status: 'success', data: result });
  }),

  // GET /api/transactions/:transactionId
  // Détail d'une transaction unique
  getById: catchAsync(async (req, res) => {
    const transaction = await transactionService.getById(
      req.params.transactionId,
      req.user._id
    );
    res.json({ status: 'success', data: { transaction } });
  }),
};