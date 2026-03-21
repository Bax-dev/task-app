import { requireOrgMembership, requireOrgAdmin } from '@/lib/guards/org-guard';
import { AutomationTrigger, AutomationAction } from '@prisma/client';
import * as automationModel from '../models';
import { CreateAutomationDTO, UpdateAutomationDTO } from '../types';

export async function createAutomation(userId: string, dto: CreateAutomationDTO) {
  await requireOrgAdmin(userId, dto.organizationId);

  return automationModel.createAutomation({
    name: dto.name,
    description: dto.description,
    trigger: dto.trigger as AutomationTrigger,
    conditions: dto.conditions,
    action: dto.action as AutomationAction,
    actionConfig: dto.actionConfig,
    enabled: dto.enabled,
    organizationId: dto.organizationId,
    createdById: userId,
  });
}

export async function readAutomation(automationId: string, userId: string) {
  const automation = await automationModel.findAutomationById(automationId);
  if (!automation) throw new Error('Automation not found');

  await requireOrgMembership(userId, automation.organization.id);
  return automation;
}

export async function readAutomations(organizationId: string, userId: string) {
  await requireOrgMembership(userId, organizationId);
  return automationModel.findAutomationsByOrganization(organizationId);
}

export async function editAutomation(automationId: string, userId: string, dto: UpdateAutomationDTO) {
  const automation = await automationModel.findAutomationById(automationId);
  if (!automation) throw new Error('Automation not found');

  await requireOrgAdmin(userId, automation.organization.id);
  return automationModel.updateAutomation(automationId, {
    ...dto,
    ...(dto.trigger && { trigger: dto.trigger as AutomationTrigger }),
    ...(dto.action && { action: dto.action as AutomationAction }),
  });
}

export async function removeAutomation(automationId: string, userId: string) {
  const automation = await automationModel.findAutomationById(automationId);
  if (!automation) throw new Error('Automation not found');

  await requireOrgAdmin(userId, automation.organization.id);
  return automationModel.deleteAutomation(automationId);
}
