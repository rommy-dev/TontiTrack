// src/modules/groups/group.controller.js
import { groupService } from './group.service.js';
import { catchAsync }   from '../../utils/catchAsync.js';

export const groupController = {

  create: catchAsync(async (req, res) => {
    // Zod a déjà validé et transformé req.body via validateBody middleware
    // On convertit targetAmount en centimes ici (l'utilisateur envoie des unités)
    const settings = {
      ...req.body.settings,
      targetAmount: req.body.settings.targetAmount * 100,
    };

    const group = await groupService.create({
      ...req.body,
      settings,
      creatorId: req.user._id,
    });

    res.status(201).json({ status: 'success', data: { group } });
  }),

  getMyGroups: catchAsync(async (req, res) => {
    const groups = await groupService.getUserGroups(req.user._id);
    res.json({ status: 'success', results: groups.length, data: { groups } });
  }),

  getById: catchAsync(async (req, res) => {
    const group = await groupService.getById(req.params.groupId, req.user._id);
    res.json({ status: 'success', data: { group } });
  }),

  addMember: catchAsync(async (req, res) => {
    const group = await groupService.addMember({
      groupId:        req.params.groupId,
      adminId:        req.user._id,
      newMemberEmail: req.body.email,
    });
    res.json({ status: 'success', data: { group } });
  }),

  removeMember: catchAsync(async (req, res) => {
    const group = await groupService.removeMember({
      groupId:          req.params.groupId,
      adminId:          req.user._id,
      memberToRemoveId: req.params.memberId,
    });
    res.json({ status: 'success', data: { group } });
  }),

  activate: catchAsync(async (req, res) => {
    const group = await groupService.activateGroup(req.params.groupId, req.user._id);
    res.json({ status: 'success', data: { group } });
  }),

  update: catchAsync(async (req, res) => {
    // Convertir targetAmount en centimes si fourni (comme pour la création)
    const updateData = { ...req.body };
    if (updateData.settings?.targetAmount !== undefined) {
      updateData.settings.targetAmount = updateData.settings.targetAmount * 100;
    }

    const group = await groupService.updateGroup(
      req.params.groupId,
      req.user._id,
      updateData
    );
    res.json({ status: 'success', data: { group } });
  }),
};