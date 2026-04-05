import { Router }                from 'express';
import { transactionService }    from './transaction.service.js';
import { protect }               from '../../middleware/auth.js';
import { catchAsync }            from '../../utils/catchAsync.js';

const router = Router();
router.use(protect);

router.get('/group/:groupId', catchAsync(async (req, res) => {
  const { page, limit, type } = req.query;
  const data = await transactionService.getGroupHistory(
    req.params.groupId,
    req.user._id,
    { page: Number(page) || 1, limit: Number(limit) || 20, type }
  );
  res.json({ status: 'success', data });
}));

router.post('/correct/:transactionId', catchAsync(async (req, res) => {
  const result = await transactionService.correctTransaction({
    wrongTransactionId: req.params.transactionId,
    adminId:            req.user._id,
    correctedData:      req.body,
  });
  res.json({ status: 'success', data: result });
}));

export default router;