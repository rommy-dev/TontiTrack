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

  async updateGroup(groupId, adminId, updateData) {
    const group = await Group.findById(groupId);
    if (!group) throw new NotFoundError('Groupe');
    if (!group.isAdmin(adminId)) throw new ForbiddenError('Action réservée à l\'admin du groupe');

    // Mets à jour les champs autorisés
    if (updateData.name !== undefined) {
      group.name = updateData.name;
    }
    if (updateData.description !== undefined) {
      group.description = updateData.description;
    }
    if (updateData.type !== undefined) {
      group.type = updateData.type;
    }
    if (updateData.settings) {
      // Mise à jour des paramètres financiers
      if (updateData.settings.targetAmount !== undefined) {
        group.settings.targetAmount = updateData.settings.targetAmount;
      }
      if (updateData.settings.frequency !== undefined) {
        group.settings.frequency = updateData.settings.frequency;
      }
      if (updateData.settings.penaltyRate !== undefined) {
        group.settings.penaltyRate = updateData.settings.penaltyRate;
      }
      if (updateData.settings.gracePeriodDays !== undefined) {
        group.settings.gracePeriodDays = updateData.settings.gracePeriodDays;
      }
      if (updateData.settings.allowPartialPay !== undefined) {
        group.settings.allowPartialPay = updateData.settings.allowPartialPay;
      }
      if (updateData.settings.currency !== undefined) {
        group.settings.currency = updateData.settings.currency;
      }
    }

    await group.save();
    return group;
  },

  async transferAdminRole(groupId, currentAdminId, newAdminId) {
    const group = await Group.findById(groupId);
    if (!group) throw new NotFoundError('Groupe');

    // Vérifier que l'utilisateur actuel est admin
    if (!group.isAdmin(currentAdminId)) {
      throw new ForbiddenError('Action réservée à l\'admin du groupe');
    }

    // Utiliser la méthode du modèle pour transférer le rôle
    try {
      group.transferAdminRole(currentAdminId, newAdminId);
      await group.save();

      // Créer des notifications pour les deux parties
      await notificationService.create({
        userId: currentAdminId,
        type: 'admin_role_transferred',
        title: `Vous n'êtes plus admin du groupe ${group.name}`,
        message: `Le rôle d'administrateur a été transféré à un autre membre.`,
        link: `/groups/${group._id}`,
        meta: {
          groupId: group._id,
          groupName: group.name,
          action: 'role_lost'
        },
      });

      await notificationService.create({
        userId: newAdminId,
        type: 'admin_role_received',
        title: `Vous êtes maintenant admin du groupe ${group.name}`,
        message: `Le rôle d'administrateur vous a été transféré.`,
        link: `/groups/${group._id}`,
        meta: {
          groupId: group._id,
          groupName: group.name,
          action: 'role_gained'
        },
      });

      return group;
    } catch (error) {
      throw new ValidationError(error.message);
    }
  },

  async updateGroupStatus(groupId, adminId, newStatus, reason = null) {
    const group = await Group.findById(groupId);
    if (!group) throw new NotFoundError('Groupe');

    // Vérifier que l'utilisateur est admin
    if (!group.isAdmin(adminId)) {
      throw new ForbiddenError('Action réservée à l\'admin du groupe');
    }

    // Validation des transitions de statut
    const allowedTransitions = {
      draft: ['active'],
      active: ['paused', 'completed'],
      paused: ['active', 'completed'],
      completed: [] // Un groupe terminé ne peut plus changer de statut
    };

    if (!allowedTransitions[group.status]?.includes(newStatus)) {
      throw new ValidationError(
        `Transition de statut invalide: ${group.status} → ${newStatus}`
      );
    }

    // Vérifications spécifiques
    if (newStatus === 'active' && group.status === 'draft') {
      // Activation depuis draft : vérifier qu'il y a au moins 2 membres
      const activeMembers = group.members.filter(m => m.status === 'active');
      if (activeMembers.length < 2) {
        throw new ValidationError('Un groupe doit avoir au moins 2 membres pour être activé');
      }
    }

    if (newStatus === 'completed') {
      // Archivage : vérifier qu'il n'y a pas de cycles actifs
      // TODO: Implémenter la vérification des cycles actifs quand le module cycles sera disponible
    }

    const oldStatus = group.status;
    group.status = newStatus;

    // Ajouter une entrée d'historique si une raison est fournie
    if (reason) {
      // TODO: Implémenter un système d'historique si nécessaire
    }

    await group.save();

    // Créer une notification pour tous les membres actifs
    const notificationType = newStatus === 'paused' ? 'group_paused' :
                           newStatus === 'active' ? 'group_reactivated' : 'group_completed';

    const notificationTitle = newStatus === 'paused' ? `Le groupe ${group.name} est en pause` :
                            newStatus === 'active' ? `Le groupe ${group.name} est réactivé` :
                            `Le groupe ${group.name} est terminé`;

    // Créer les notifications de manière asynchrone sans bloquer
    setImmediate(async () => {
      try {
        for (const member of group.members.filter(m => m.status === 'active')) {
          await notificationService.create({
            userId: member.userId,
            type: notificationType,
            title: notificationTitle,
            message: reason || `Le statut du groupe a changé: ${oldStatus} → ${newStatus}`,
            link: `/groups/${group._id}`,
            meta: {
              groupId: group._id,
              groupName: group.name,
              oldStatus,
              newStatus,
              reason
            },
          });
        }
      } catch (error) {
        // Log l'erreur mais ne pas échouer l'opération
        console.error('Erreur lors de la création des notifications de changement de statut:', error);
      }
    });

    return group;
  },
};