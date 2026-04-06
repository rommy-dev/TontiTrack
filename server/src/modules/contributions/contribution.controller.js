import { contributionService } from './contribution.service.js';
import { catchAsync }          from '../../utils/catchAsync.js';

export const contributionController = {
  getById: catchAsync(async (req, res) => {
    const contribution = await Contribution.findById(req.params.contributionId)
      .populate('cycleId',  'cycleNumber startDate dueDate status targetAmount')
      .populate('groupId',  'name settings')
      .populate('userId',   'firstName lastName email');

    if (!contribution) throw new NotFoundError('Contribution');

    // Vérifier que le user est concerné ou membre du groupe
    const isSelf   = contribution.userId._id.equals(req.user._id);
    const { Group } = await import('../groups/group.model.js');
    const group    = await Group.findById(contribution.groupId);
    const isMember = group?.hasMember(req.user._id);

    if (!isSelf && !isMember) throw new ForbiddenError('Accès refusé');

    res.json({ status: 'success', data: { contribution } });
  }),

  recordPayment: catchAsync(async (req, res) => {
    // L'utilisateur envoie le montant en unités entières (ex : 5000)
    // On convertit en centimes ici — convention cohérente avec create group
    const amountCents = Math.round(req.body.amount * 100);

    const result = await contributionService.recordPayment({
      contributionId: req.params.contributionId,
      payerId:        req.user._id,
      amountCents,
    });
    res.json({ status: 'success', data: result });
  }),

  getMyContributions: catchAsync(async (req, res) => {
    const { status, groupId } = req.query;
    const filters = {};
    if (status)  filters.status  = status;
    if (groupId) filters.groupId = groupId;

    const contributions = await contributionService.getUserContributions(
      req.user._id,
      filters
    );
    res.json({ status: 'success', results: contributions.length, data: { contributions } });
  }),

  getGroupDebtSummary: catchAsync(async (req, res) => {
    const summary = await contributionService.getGroupDebtSummary(
      req.params.groupId,
      req.user._id
    );
    res.json({ status: 'success', data: { summary } });
  }),
};