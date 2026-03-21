import { requireOrgMembership, requireOrgAdmin } from '@/lib/guards/org-guard';
import { prisma } from '@/lib/db/client';
import * as workflowModel from '../models';
import { CreateWorkflowDTO, UpdateWorkflowDTO, CreateWorkflowStepDTO, UpdateWorkflowStepDTO, CreateWorkflowTransitionDTO } from '../types';

export async function createWorkflow(userId: string, dto: CreateWorkflowDTO) {
  await requireOrgAdmin(userId, dto.organizationId);

  return workflowModel.createWorkflow({
    name: dto.name,
    description: dto.description,
    issueTypeId: dto.issueTypeId,
    organizationId: dto.organizationId,
  });
}

export async function readWorkflow(workflowId: string, userId: string) {
  const workflow = await workflowModel.findWorkflowById(workflowId);
  if (!workflow) throw new Error('Workflow not found');

  await requireOrgMembership(userId, workflow.organization.id);
  return workflow;
}

export async function readWorkflows(organizationId: string, userId: string) {
  await requireOrgMembership(userId, organizationId);
  return workflowModel.findWorkflowsByOrganization(organizationId);
}

export async function editWorkflow(workflowId: string, userId: string, dto: UpdateWorkflowDTO) {
  const workflow = await workflowModel.findWorkflowById(workflowId);
  if (!workflow) throw new Error('Workflow not found');

  await requireOrgAdmin(userId, workflow.organization.id);
  return workflowModel.updateWorkflow(workflowId, dto);
}

export async function removeWorkflow(workflowId: string, userId: string) {
  const workflow = await workflowModel.findWorkflowById(workflowId);
  if (!workflow) throw new Error('Workflow not found');

  await requireOrgAdmin(userId, workflow.organization.id);
  return workflowModel.deleteWorkflow(workflowId);
}

export async function createStep(workflowId: string, userId: string, dto: CreateWorkflowStepDTO) {
  const workflow = await workflowModel.findWorkflowById(workflowId);
  if (!workflow) throw new Error('Workflow not found');

  await requireOrgAdmin(userId, workflow.organization.id);
  return workflowModel.createWorkflowStep({
    name: dto.name,
    position: dto.position,
    workflowId,
  });
}

export async function editStep(stepId: string, userId: string, dto: UpdateWorkflowStepDTO) {
  const step = await workflowModel.findWorkflowStepById(stepId);
  if (!step) throw new Error('Workflow step not found');

  await requireOrgAdmin(userId, step.workflow.organizationId);
  return workflowModel.updateWorkflowStep(stepId, dto);
}

export async function removeStep(stepId: string, userId: string) {
  const step = await workflowModel.findWorkflowStepById(stepId);
  if (!step) throw new Error('Workflow step not found');

  await requireOrgAdmin(userId, step.workflow.organizationId);
  return workflowModel.deleteWorkflowStep(stepId);
}

export async function createTransition(workflowId: string, userId: string, dto: CreateWorkflowTransitionDTO) {
  const workflow = await workflowModel.findWorkflowById(workflowId);
  if (!workflow) throw new Error('Workflow not found');

  await requireOrgAdmin(userId, workflow.organization.id);
  return workflowModel.createWorkflowTransition({
    name: dto.name,
    fromStepId: dto.fromStepId,
    toStepId: dto.toStepId,
    conditions: dto.conditions,
    workflowId,
  });
}

export async function removeTransition(transitionId: string, userId: string) {
  const transition = await prisma.workflowTransition.findUnique({
    where: { id: transitionId },
    include: { workflow: true },
  });
  if (!transition) throw new Error('Workflow transition not found');

  await requireOrgAdmin(userId, transition.workflow.organizationId);
  return workflowModel.deleteWorkflowTransition(transitionId);
}
