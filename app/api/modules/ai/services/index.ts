import { prisma } from "@/lib/db/client";
import { invokeModel } from "@/lib/bedrock";
import { requireOrgMembership } from "@/lib/guards/org-guard";
import type {
  SuggestTaskDTO,
  GenerateSubtasksDTO,
  SummarizeDTO,
  ChatDTO,
} from "../types";

export async function suggestTask(userId: string, dto: SuggestTaskDTO) {
  const project = await prisma.project.findUnique({
    where: { id: dto.projectId },
    include: {
      space: { select: { organizationId: true } },
      tasks: {
        take: 10,
        orderBy: { createdAt: "desc" },
        select: { title: true, priority: true, status: true },
      },
    },
  });
  if (!project) throw new Error("Project not found");

  await requireOrgMembership(userId, project.space.organizationId);

  const existingTasks = project.tasks
    .map((t) => `- ${t.title} [${t.priority}, ${t.status}]`)
    .join("\n");

  const system = `You are a task management assistant for the project "${project.name}". Help create well-structured tasks. Return ONLY valid JSON with no extra text.`;

  const prompt = `Based on this request: "${dto.prompt}"

Recent tasks in this project:
${existingTasks || "No tasks yet."}

Return a JSON object with:
{
  "title": "concise task title",
  "description": "detailed description with acceptance criteria",
  "priority": "LOW" | "MEDIUM" | "HIGH" | "URGENT",
  "subtasks": ["subtask 1", "subtask 2", ...]
}`;

  const response = await invokeModel(
    [{ role: "user", content: prompt }],
    system,
  );

  try {
    const cleaned = response.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return {
      title: dto.prompt,
      description: response,
      priority: "MEDIUM",
      subtasks: [],
    };
  }
}

export async function generateSubtasks(
  _userId: string,
  dto: GenerateSubtasksDTO,
) {
  const system =
    "You are a task breakdown specialist. Return ONLY a JSON array of subtask strings, no extra text.";

  const prompt = `Break this task into actionable subtasks (3-8 items):

Title: ${dto.taskTitle}
${dto.taskDescription ? `Description: ${dto.taskDescription}` : ""}

Return a JSON array: ["subtask 1", "subtask 2", ...]`;

  const response = await invokeModel(
    [{ role: "user", content: prompt }],
    system,
  );

  try {
    const cleaned = response.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return response
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => line.replace(/^[-\d.)\s]+/, "").trim());
  }
}

export async function summarize(userId: string, dto: SummarizeDTO) {
  await requireOrgMembership(userId, dto.organizationId);

  let context = "";

  if (dto.type === "daily") {
    const since = new Date();
    since.setHours(since.getHours() - 24);

    const recentTasks = await prisma.task.findMany({
      where: {
        project: { space: { organizationId: dto.organizationId } },
        updatedAt: { gte: since },
      },
      select: { title: true, status: true, priority: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 30,
    });

    context = recentTasks
      .map((t) => `- ${t.title} [${t.status}, ${t.priority}]`)
      .join("\n");
  } else if (dto.type === "project" && dto.targetId) {
    const tasks = await prisma.task.findMany({
      where: { projectId: dto.targetId },
      select: { title: true, status: true, priority: true },
    });

    const stats = {
      total: tasks.length,
      done: tasks.filter((t) => t.status === "DONE").length,
      inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
      todo: tasks.filter((t) => t.status === "TODO").length,
      urgent: tasks.filter((t) => t.priority === "URGENT").length,
    };

    context = `Project stats: ${stats.total} total, ${stats.done} done, ${stats.inProgress} in progress, ${stats.todo} todo, ${stats.urgent} urgent\n\nTasks:\n${tasks.map((t) => `- ${t.title} [${t.status}]`).join("\n")}`;
  } else if (dto.type === "sprint" && dto.targetId) {
    const sprint = await prisma.sprint.findUnique({
      where: { id: dto.targetId },
      include: {
        sprintTasks: {
          include: {
            task: { select: { title: true, status: true, priority: true } },
          },
        },
      },
    });

    if (sprint) {
      context = `Sprint "${sprint.name}" (${sprint.status}):\n${sprint.sprintTasks.map((st: any) => `- ${st.task.title} [${st.task.status}] ${st.storyPoints ? `(${st.storyPoints}pts)` : ""}`).join("\n")}`;
    }
  }

  if (!context) {
    return { summary: "No data available to summarize." };
  }

  const system =
    "You are a project management assistant. Provide concise, actionable summaries.";
  const prompt = `Summarize this ${dto.type} update:\n\n${context}\n\nProvide:\n1. A brief status overview (2-3 sentences)\n2. Key highlights\n3. Blockers or risks (if any)\n4. Recommended next steps`;

  const summary = await invokeModel(
    [{ role: "user", content: prompt }],
    system,
  );
  return { summary };
}

export async function chat(userId: string, dto: ChatDTO) {
  await requireOrgMembership(userId, dto.organizationId);

  let contextInfo = "";

  if (dto.context === "tasks") {
    const tasks = await prisma.task.findMany({
      where: {
        project: { space: { organizationId: dto.organizationId } },
        status: { in: ["TODO", "IN_PROGRESS"] },
      },
      select: { title: true, status: true, priority: true, dueDate: true },
      orderBy: { updatedAt: "desc" },
      take: 20,
    });

    contextInfo = `\n\nCurrent open tasks:\n${tasks.map((t) => `- ${t.title} [${t.status}, ${t.priority}]${t.dueDate ? ` due ${t.dueDate.toISOString().split("T")[0]}` : ""}`).join("\n")}`;
  }

  const system = `You are TaskFlow AI, a helpful project management assistant. Be concise and actionable. You help users manage tasks, plan sprints, and stay organized. Use the prior conversation to maintain continuity — refer back to earlier messages when relevant and avoid repeating information already given unless asked.${contextInfo}`;

  const history = (dto.history ?? []).map((m) => ({
    role: m.role,
    content: m.content,
  }));
  const response = await invokeModel(
    [...history, { role: "user", content: dto.message }],
    system,
  );

  return { response };
}
