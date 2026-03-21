import { requireOrgMembership } from '@/lib/guards/org-guard';
import * as dashboardModel from '../models';
import { CreateDashboardDTO, UpdateDashboardDTO } from '../types';

export async function createDashboard(userId: string, dto: CreateDashboardDTO) {
  await requireOrgMembership(userId, dto.organizationId);
  return dashboardModel.createDashboard({
    name: dto.name,
    layout: dto.layout,
    organizationId: dto.organizationId,
    createdById: userId,
  });
}

export async function readDashboard(dashboardId: string, userId: string) {
  const dashboard = await dashboardModel.findDashboardById(dashboardId);
  if (!dashboard) throw new Error('Dashboard not found');
  await requireOrgMembership(userId, dashboard.organizationId);
  if (dashboard.createdById !== userId) throw new Error('Access denied');
  return dashboard;
}

export async function readDashboards(organizationId: string, userId: string) {
  await requireOrgMembership(userId, organizationId);
  return dashboardModel.findDashboardsByUser(userId, organizationId);
}

export async function editDashboard(dashboardId: string, userId: string, dto: UpdateDashboardDTO) {
  const dashboard = await dashboardModel.findDashboardById(dashboardId);
  if (!dashboard) throw new Error('Dashboard not found');
  if (dashboard.createdById !== userId) throw new Error('Access denied');
  return dashboardModel.updateDashboard(dashboardId, dto);
}

export async function removeDashboard(dashboardId: string, userId: string) {
  const dashboard = await dashboardModel.findDashboardById(dashboardId);
  if (!dashboard) throw new Error('Dashboard not found');
  if (dashboard.createdById !== userId) throw new Error('Access denied');
  return dashboardModel.deleteDashboard(dashboardId);
}
