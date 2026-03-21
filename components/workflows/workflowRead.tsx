'use client';

import { useState } from 'react';
import {
  Plus, GitBranch, Loader2, Trash2, Search, ArrowRight, ArrowLeft,
  Pencil, Check, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  useGetWorkflowQuery,
  useUpdateWorkflowMutation,
  useCreateWorkflowStepMutation,
  useUpdateWorkflowStepMutation,
  useDeleteWorkflowStepMutation,
  useCreateWorkflowTransitionMutation,
  useDeleteWorkflowTransitionMutation,
} from '@/store/api';

// ---------------------------------------------------------------------------
// Workflow Editor (visual step/transition editor)
// ---------------------------------------------------------------------------
function WorkflowEditor({
  workflowId,
  onBack,
}: {
  workflowId: string;
  onBack: () => void;
}) {
  const { data: workflow, isLoading } = useGetWorkflowQuery(workflowId);

  const [updateWorkflow] = useUpdateWorkflowMutation();
  const [createStep, { isLoading: isCreatingStep }] = useCreateWorkflowStepMutation();
  const [updateStep] = useUpdateWorkflowStepMutation();
  const [deleteStep] = useDeleteWorkflowStepMutation();
  const [createTransition, { isLoading: isCreatingTransition }] = useCreateWorkflowTransitionMutation();
  const [deleteTransition] = useDeleteWorkflowTransitionMutation();

  // Header editing
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');

  // Step inline editing
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [stepNameDraft, setStepNameDraft] = useState('');

  // Add step dialog
  const [addStepOpen, setAddStepOpen] = useState(false);
  const [newStepName, setNewStepName] = useState('');

  // Add transition dialog
  const [addTransitionOpen, setAddTransitionOpen] = useState(false);
  const [transitionName, setTransitionName] = useState('');
  const [transitionFrom, setTransitionFrom] = useState('');
  const [transitionTo, setTransitionTo] = useState('');

  if (isLoading || !workflow) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const steps = [...(workflow.steps || [])].sort(
    (a: any, b: any) => a.position - b.position,
  );
  const transitions = workflow.transitions || [];

  // --- handlers ---
  const handleSaveName = async () => {
    if (!nameDraft.trim()) return;
    try {
      await updateWorkflow({ id: workflowId, name: nameDraft.trim() }).unwrap();
      toast.success('Workflow name updated');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update name');
    }
    setEditingName(false);
  };

  const handleAddStep = async () => {
    if (!newStepName.trim()) return;
    try {
      await createStep({
        workflowId,
        name: newStepName.trim(),
        position: steps.length,
      }).unwrap();
      toast.success('Step added');
      setNewStepName('');
      setAddStepOpen(false);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to add step');
    }
  };

  const handleSaveStep = async (stepId: string) => {
    if (!stepNameDraft.trim()) return;
    try {
      await updateStep({ stepId, name: stepNameDraft.trim() }).unwrap();
      toast.success('Step updated');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update step');
    }
    setEditingStepId(null);
  };

  const handleDeleteStep = async (stepId: string) => {
    try {
      await deleteStep(stepId).unwrap();
      toast.success('Step deleted');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete step');
    }
  };

  const handleAddTransition = async () => {
    if (!transitionName.trim() || !transitionFrom || !transitionTo) return;
    try {
      await createTransition({
        workflowId,
        name: transitionName.trim(),
        fromStepId: transitionFrom,
        toStepId: transitionTo,
      }).unwrap();
      toast.success('Transition added');
      setTransitionName('');
      setTransitionFrom('');
      setTransitionTo('');
      setAddTransitionOpen(false);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to add transition');
    }
  };

  const handleDeleteTransition = async (transitionId: string) => {
    try {
      await deleteTransition(transitionId).unwrap();
      toast.success('Transition deleted');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete transition');
    }
  };

  const findStepName = (id: string) =>
    steps.find((s: any) => s.id === id)?.name ?? 'Unknown';

  return (
    <div className="p-4 sm:p-6 md:p-8">
      {/* ---- Header ---- */}
      <div className="flex items-center gap-3 mb-8">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>

        {editingName ? (
          <div className="flex items-center gap-2">
            <Input
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              className="text-2xl font-bold h-10 w-72"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveName();
                if (e.key === 'Escape') setEditingName(false);
              }}
            />
            <Button variant="ghost" size="icon" onClick={handleSaveName}>
              <Check className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setEditingName(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <h1
            className="text-2xl sm:text-3xl font-bold text-foreground cursor-pointer hover:text-primary transition-colors"
            onClick={() => {
              setNameDraft(workflow.name);
              setEditingName(true);
            }}
          >
            {workflow.name}
          </h1>
        )}
      </div>

      {/* ---- Visual Flow Diagram ---- */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-foreground mb-4">Steps</h2>
        <div className="bg-muted/30 border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-4">
            {steps.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No steps yet. Add your first step to get started.
              </p>
            )}

            {steps.map((step: any, i: number) => (
              <div key={step.id} className="flex items-center gap-2">
                {/* Step node */}
                <div className="flex flex-col items-center gap-1 min-w-[140px]">
                  <div className="bg-card border-2 border-primary/30 rounded-xl px-4 py-3 text-center shadow-sm relative group">
                    {editingStepId === step.id ? (
                      <div className="flex items-center gap-1">
                        <Input
                          value={stepNameDraft}
                          onChange={(e) => setStepNameDraft(e.target.value)}
                          className="h-7 text-sm w-24"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveStep(step.id);
                            if (e.key === 'Escape') setEditingStepId(null);
                          }}
                        />
                        <button
                          onClick={() => handleSaveStep(step.id)}
                          className="p-0.5 hover:text-primary"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingStepId(null)}
                          className="p-0.5 hover:text-muted-foreground"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <p className="font-medium text-sm">{step.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Step {step.position + 1}
                        </p>
                        {/* Edit / Delete buttons */}
                        <div className="absolute -top-2 -right-2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setEditingStepId(step.id);
                              setStepNameDraft(step.name);
                            }}
                            className="bg-card border border-border rounded-full p-1 hover:bg-muted shadow-sm"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button className="bg-card border border-border rounded-full p-1 hover:bg-muted shadow-sm">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Step</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete &quot;{step.name}&quot; and remove related transitions.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteStep(step.id)}
                                  className="bg-muted-foreground text-background hover:bg-muted-foreground/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Arrow between steps */}
                {i < steps.length - 1 && (
                  <ArrowRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                )}
              </div>
            ))}

            {/* Add step button at the end */}
            {steps.length > 0 && (
              <ArrowRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            )}
            <Dialog open={addStepOpen} onOpenChange={setAddStepOpen}>
              <DialogTrigger asChild>
                <button className="flex flex-col items-center gap-1 min-w-[100px]">
                  <div className="border-2 border-dashed border-primary/30 rounded-xl px-4 py-3 text-center hover:border-primary/60 hover:bg-primary/5 transition-colors cursor-pointer">
                    <Plus className="w-5 h-5 mx-auto text-primary/60" />
                    <p className="text-xs text-muted-foreground mt-1">Add Step</p>
                  </div>
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                  <DialogTitle>Add Step</DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAddStep();
                  }}
                  className="space-y-4 mt-2"
                >
                  <div className="space-y-2">
                    <Label>Step Name</Label>
                    <Input
                      value={newStepName}
                      onChange={(e) => setNewStepName(e.target.value)}
                      placeholder="e.g. In Progress"
                      required
                      autoFocus
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Position: {steps.length + 1} (auto)
                  </p>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setAddStepOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isCreatingStep || !newStepName.trim()}>
                      {isCreatingStep ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-1" />
                      ) : (
                        <Plus className="w-4 h-4 mr-1" />
                      )}
                      Add Step
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* ---- Transitions Table ---- */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Transitions</h2>
          <Dialog open={addTransitionOpen} onOpenChange={setAddTransitionOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5" disabled={steps.length < 2}>
                <Plus className="w-4 h-4" />
                Add Transition
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[420px]">
              <DialogHeader>
                <DialogTitle>Add Transition</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddTransition();
                }}
                className="space-y-4 mt-2"
              >
                <div className="space-y-2">
                  <Label>Transition Name</Label>
                  <Input
                    value={transitionName}
                    onChange={(e) => setTransitionName(e.target.value)}
                    placeholder="e.g. Start Work"
                    required
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label>From Step</Label>
                  <Select value={transitionFrom} onValueChange={setTransitionFrom}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select source step" />
                    </SelectTrigger>
                    <SelectContent>
                      {steps.map((s: any) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>To Step</Label>
                  <Select value={transitionTo} onValueChange={setTransitionTo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select target step" />
                    </SelectTrigger>
                    <SelectContent>
                      {steps.map((s: any) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setAddTransitionOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      isCreatingTransition ||
                      !transitionName.trim() ||
                      !transitionFrom ||
                      !transitionTo
                    }
                  >
                    {isCreatingTransition ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    ) : (
                      <Plus className="w-4 h-4 mr-1" />
                    )}
                    Add Transition
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {transitions.length === 0 ? (
          <div className="border border-border rounded-lg p-8 text-center">
            <ArrowRight className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {steps.length < 2
                ? 'Add at least 2 steps before creating transitions.'
                : 'No transitions yet. Add one to connect your steps.'}
            </p>
          </div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>From Step</TableHead>
                  <TableHead className="hidden sm:table-cell" />
                  <TableHead>To Step</TableHead>
                  <TableHead className="w-[60px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transitions.map((t: any) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">
                        {findStepName(t.fromStepId)}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-center">
                      <ArrowRight className="w-4 h-4 text-muted-foreground inline-block" />
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                        {findStepName(t.toStepId)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Transition</AlertDialogTitle>
                            <AlertDialogDescription>
                              Remove the &quot;{t.name}&quot; transition?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteTransition(t.id)}
                              className="bg-muted-foreground text-background hover:bg-muted-foreground/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Workflow List + Card Grid
// ---------------------------------------------------------------------------
interface WorkflowReadProps {
  workflows: any[];
  isLoading: boolean;
  selectedWorkflowId: string | null;
  onSelectWorkflow: (id: string | null) => void;
  onEditWorkflow: (workflow: any) => void;
  onDeleteWorkflow: (workflow: any) => void;
}

export default function WorkflowRead({
  workflows,
  isLoading,
  selectedWorkflowId,
  onSelectWorkflow,
  onEditWorkflow,
  onDeleteWorkflow,
}: WorkflowReadProps) {
  const [search, setSearch] = useState('');

  // --- If a workflow is selected, show the editor ---
  if (selectedWorkflowId) {
    return (
      <WorkflowEditor
        workflowId={selectedWorkflowId}
        onBack={() => onSelectWorkflow(null)}
      />
    );
  }

  // --- Loading state ---
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // --- Empty state ---
  if (workflows.length === 0) {
    return (
      <div className="text-center py-12">
        <GitBranch className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-bold text-foreground mb-2">No workflows yet</h3>
        <p className="text-muted-foreground mb-4">Create your first workflow to define status flows</p>
      </div>
    );
  }

  const filtered = workflows.filter((w: any) =>
    w.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <>
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search workflows..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 max-w-sm"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No workflows match &quot;{search}&quot;</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((workflow: any) => {
            const steps = [...(workflow.steps || [])].sort(
              (a: any, b: any) => a.position - b.position,
            );
            const transitionCount = (workflow.transitions || []).length;

            return (
              <div key={workflow.id} className="relative group">
                <div
                  className="bg-card border border-border rounded-lg p-4 sm:p-6 hover:border-primary/50 transition-colors h-full cursor-pointer"
                  onClick={() => onSelectWorkflow(workflow.id)}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <GitBranch className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-foreground group-hover:text-primary transition-colors truncate">
                        {workflow.name}
                      </h3>
                      {workflow.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {workflow.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {workflow.issueType && (
                    <div className="mb-3">
                      <Badge variant="secondary">{workflow.issueType.name}</Badge>
                    </div>
                  )}

                  {steps.length > 0 && (
                    <div className="flex items-center flex-wrap gap-1 mb-3">
                      {steps.map((step: any, i: number) => (
                        <span key={step.id} className="flex items-center gap-1">
                          <Badge variant="outline" className="text-[10px]">
                            {step.name}
                          </Badge>
                          {i < steps.length - 1 && (
                            <ArrowRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                          )}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>
                      {steps.length} {steps.length === 1 ? 'step' : 'steps'}
                    </span>
                    <span>
                      {transitionCount} {transitionCount === 1 ? 'transition' : 'transitions'}
                    </span>
                  </div>
                </div>

                {/* Edit button */}
                <button
                  className="absolute top-3 right-11 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditWorkflow(workflow);
                  }}
                >
                  <Pencil className="w-4 h-4" />
                </button>

                {/* Delete button */}
                <button
                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteWorkflow(workflow);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
