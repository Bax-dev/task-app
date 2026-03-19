import * as userModel from '../models';
import { UpdateUserDTO, AddMemberDTO } from '../types';

export async function getUserProfile(userId: string) {
  const user = await userModel.findUserById(userId);
  if (!user) throw new Error('User not found');
  return user;
}

export async function updateUserProfile(userId: string, dto: UpdateUserDTO) {
  const user = await userModel.findUserById(userId);
  if (!user) throw new Error('User not found');
  return userModel.updateUser(userId, dto);
}

export async function getOrganizationMembers(organizationId: string) {
  const members = await userModel.findUsersByOrganization(organizationId);
  return members.map((m) => ({
    id: m.id,
    name: m.name,
    email: m.email,
    role: m.memberships[0]?.role ?? 'MEMBER',
  }));
}

export async function addMemberDirectly(dto: AddMemberDTO) {
  const user = await userModel.findUserByEmail(dto.email);
  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }

  const existing = await userModel.findMembership(user.id, dto.organizationId);
  if (existing) {
    throw new Error('User is already a member of this organization');
  }

  const membership = await userModel.createMembership({
    userId: user.id,
    organizationId: dto.organizationId,
    role: dto.role,
  });

  return { user: membership.user, role: dto.role };
}

export async function removeMember(adminUserId: string, userId: string, organizationId: string) {
  if (adminUserId === userId) {
    throw new Error('You cannot remove yourself');
  }

  const membership = await userModel.findMembership(userId, organizationId);
  if (!membership) {
    throw new Error('User is not a member');
  }

  await userModel.removeMembership(userId, organizationId);
  return { message: 'Member removed' };
}
