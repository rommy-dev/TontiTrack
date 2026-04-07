// src/modules/groups/group.service.js
import { Group } from './group.model.js';
import { notificationService } from '../notifications/notification.service.js';
import { NotFoundError, ForbiddenError, ConflictError, ValidationError } from '../../utils/ApiError.js';

export const groupService = {

  async create({ name, description, type, settings, creatorId }) {
    const group = new Group({
      name,
      description,
      type,
      settings,             // targetAmount est déjà en centimes, validé en amont
      createdBy: creatorId,
      status: 'draft',
      // Le créateur est automatiquement ajouté comme admin
      members: [{ userId: creatorId, role: 'admin', status: 'active' }],
    });
    await group.save();
    return group;
  },

  async getById(groupId, requestingUserId) {
    const group = await Group.findById(groupId)
      .populate('members.userId', 'firstName lastName email');  // enrichit les membres

    if (!group) throw new NotFoundError('Groupe');

    // Un non-membre ne peut pas voir les détails du groupe
    if (!group.hasMember(requestingUserId)) {
      throw new ForbiddenError('Vous n\'êtes pas membre de ce groupe');
    }
    return group;
  },

  async getUserGroups(userId) {
    // L'index sur members.userId rend cette requête efficace
    return Group.find({
      'members.userId': userId,
      'members.status': 'active',
    }).select('name type status settings.currency settings.targetAmount members createdAt');
  },

  async addMember({ groupId, adminId, newMemberEmail }) {
    const group = await Group.findById(groupId);
    if (!group) throw new NotFoundError('Groupe');
    if (!group.isAdmin(adminId)) throw new ForbiddenError('Action réservée à l\'admin');
    if (group.status !== 'draft' && group.status !== 'active') {
      throw new ValidationError('Impossible d\'ajouter un membre à un groupe ' + group.status);
    }

    // Importer User ici pour éviter la dépendance circulaire au niveau module
    const { User } = await import('../users/user.model.js');
    const newMember = await User.findOne({ email: newMemberEmail });
    if (!newMember) throw new NotFoundError('Utilisateur');

    // Vérifier qu'il n'est pas déjà membre actif
    const existing = group.members.find(m => m.userId.equals(newMember._id));
    if (existing?.status === 'active') {
      throw new ConflictError('Cet utilisateur est déjà membre du groupe');
    }

    // S'il était membre et est parti, on le réactive
    if (existing) {
      existing.status = 'active';
      existing.joinedAt = new Date();
    } else {
      group.members.push({ userId: newMember._id, role: 'member', status: 'active' });
    }

    await group.save();

    // Créer une notification pour le nouveau membre
    await notificationService.create({
      userId: newMember._id,
      type: 'member_joined',
      title: `Vous avez été ajouté au groupe ${group.name}`,
      message: `${group.description || 'Vous pouvez maintenant participer aux contributions.'}`,
      link: `/groups/${group._id}`,
      meta: {
        groupId: group._id,
        groupName: group.name,
      },
    });

    return group;
  },

  async removeMember({ groupId, adminId, memberToRemoveId }) {
    const group = await Group.findById(groupId);
    if (!group) throw new NotFoundError('Groupe');
    if (!group.isAdmin(adminId)) throw new ForbiddenError('Action réservée à l\'admin');

    // L'admin ne peut pas s'expulser lui-même
    if (adminId.toString() === memberToRemoveId.toString()) {
      throw new ValidationError('L\'admin ne peut pas se retirer. Transférez d\'abord le rôle.');
    }

    const member = group.members.find(m => m.userId.equals(memberToRemoveId));
    if (!member || member.status !== 'active') throw new NotFoundError('Membre');

    member.status = 'expelled';  // soft delete — historique préservé
    await group.save();
    return group;
  },

  async activateGroup(groupId, adminId) {
    const group = await Group.findById(groupId);
    if (!group) throw new NotFoundError('Groupe');
    if (!group.isAdmin(adminId)) throw new ForbiddenError('Action réservée à l\'admin');
    if (group.status !== 'draft') {
      throw new ValidationError('Seul un groupe en état "draft" peut être activé');
    }

    const activeMembers = group.members.filter(m => m.status === 'active');
    if (activeMembers.length < 2) {
      throw new ValidationError('Un groupe doit avoir au moins 2 membres pour être activé');
    }

    group.status = 'active';
    await group.save();
    return group;
  },
};