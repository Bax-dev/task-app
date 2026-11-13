import { requireOrgMembership, requireOrgAdmin } from '@/lib/guards/org-guard';
import { IntegrationType } from '@prisma/client';
import * as integrationModel from '../models';
import { CreateIntegrationDTO, UpdateIntegrationDTO } from '../types';

/** `config` can hold API tokens: admins only. */
const forRole = <T extends { config: unknown }>(role: string, i: T): T => (role === 'ADMIN' ? i : { ...i, config: null });

export async function createIntegration(userId: string, dto: CreateIntegrationDTO) {
  await requireOrgAdmin(userId, dto.organizationId);

  return integrationModel.createIntegration({
    type: dto.type as IntegrationType,
    name: dto.name,
    config: dto.config,
    enabled: dto.enabled,
    organizationId: dto.organizationId,
    createdById: userId,
  });
}

export async function readIntegration(integrationId: string, userId: string) {
  const integration = await integrationModel.findIntegrationById(integrationId);
  if (!integration) throw new Error('Integration not found');

  const role = await requireOrgMembership(userId, integration.organization.id);
  return forRole(role, integration);
}

export async function readIntegrations(organizationId: string, userId: string) {
  const role = await requireOrgMembership(userId, organizationId);
  return (await integrationModel.findIntegrationsByOrganization(organizationId)).map((i) => forRole(role, i));
}

export async function editIntegration(integrationId: string, userId: string, dto: UpdateIntegrationDTO) {
  const integration = await integrationModel.findIntegrationById(integrationId);
  if (!integration) throw new Error('Integration not found');

  await requireOrgAdmin(userId, integration.organization.id);
  return integrationModel.updateIntegration(integrationId, dto);
}

export async function removeIntegration(integrationId: string, userId: string) {
  const integration = await integrationModel.findIntegrationById(integrationId);
  if (!integration) throw new Error('Integration not found');

  await requireOrgAdmin(userId, integration.organization.id);
  return integrationModel.deleteIntegration(integrationId);
}
