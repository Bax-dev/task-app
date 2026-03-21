import { requireOrgMembership, requireOrgAdmin } from '@/lib/guards/org-guard';
import { IntegrationType } from '@prisma/client';
import * as integrationModel from '../models';
import { CreateIntegrationDTO, UpdateIntegrationDTO } from '../types';

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

  await requireOrgMembership(userId, integration.organization.id);
  return integration;
}

export async function readIntegrations(organizationId: string, userId: string) {
  await requireOrgMembership(userId, organizationId);
  return integrationModel.findIntegrationsByOrganization(organizationId);
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
