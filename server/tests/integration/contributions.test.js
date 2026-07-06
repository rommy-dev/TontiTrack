import mongoose from 'mongoose';
import { contributionService } from '../../src/modules/contributions/contribution.service.js';
import { Group } from '../../src/modules/groups/group.model.js';
import { Cycle } from '../../src/modules/cycles/cycle.model.js';
import { Contribution } from '../../src/modules/contributions/contribution.model.js';
import { Transaction } from '../../src/modules/transactions/transaction.model.js';
import { User } from '../../src/modules/users/user.model.js';

describe('contributionService', () => {
  it('enregistre un paiement, crée une transaction et met à jour le résumé de dettes', async () => {
    const fakeSession = {
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn(),
      inTransaction: jest.fn(() => true),
    };

    jest.spyOn(mongoose, 'startSession').mockResolvedValue(fakeSession);
    const createSpy = jest.spyOn(Transaction, 'create').mockImplementation(async (docs) => [
      {
        _id: new mongoose.Types.ObjectId(),
        ...docs[0],
      },
    ]);
    const admin = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      passwordHash: 'hash',
    });

    const payer = await User.create({
      firstName: 'Payer',
      lastName: 'User',
      email: 'payer@example.com',
      passwordHash: 'hash',
    });

    const group = await Group.create({
      name: 'Tontine de test',
      type: 'tontine',
      createdBy: admin._id,
      status: 'active',
      members: [
        { userId: admin._id, role: 'admin', status: 'active' },
        { userId: payer._id, role: 'member', status: 'active' },
      ],
      settings: {
        targetAmount: 5000,
        currency: 'XAF',
        gracePeriodDays: 3,
        penaltyRate: 0.05,
        allowPartialPay: true,
        frequency: 'monthly',
      },
    });

    const cycle = await Cycle.create({
      groupId: group._id,
      cycleNumber: 1,
      targetAmount: 5000,
      currency: 'XAF',
      startDate: new Date(),
      dueDate: new Date(),
      status: 'active',
    });

    const contribution = await Contribution.create({
      cycleId: cycle._id,
      groupId: group._id,
      userId: payer._id,
      expectedAmount: 5000,
      paidAmount: 0,
      status: 'pending',
    });

    const actualFindByIdAndUpdate = Contribution.findByIdAndUpdate.bind(Contribution);
    const updateSpy = jest.spyOn(Contribution, 'findByIdAndUpdate').mockImplementation(async (...args) => {
      const [id, update, options] = args;
      const { session, ...restOptions } = options || {};
      return actualFindByIdAndUpdate(id, update, { ...restOptions, new: true });
    });

    const result = await contributionService.recordPayment({
      contributionId: contribution._id,
      payerId: payer._id,
      amountCents: 3000,
    });

    const summary = await contributionService.getGroupDebtSummary(group._id, payer._id);

    expect(result.success).toBe(true);
    expect(result.newStatus).toBe('partial');
    expect(createSpy).toHaveBeenCalled();
    expect(updateSpy).toHaveBeenCalledWith(
      contribution._id,
      expect.objectContaining({ $inc: { paidAmount: 3000 } }),
      expect.objectContaining({ session: fakeSession })
    );
    expect(summary).toHaveLength(1);
    expect(summary[0].totalRemaining).toBe(2000);
    expect(summary[0].pendingCount).toBe(1);
  });
});
