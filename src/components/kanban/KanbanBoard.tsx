"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, StatusBadge, PriorityBadge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import { Input, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { TaskStatus, TaskPriority } from "@/lib/types";
import {
  Plus,
  MessageSquare,
  Clock,
  Calendar,
  Filter,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layers,
  ArrowRight,
  Send,
  Trash2,
} from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/utils";

interface KanbanBoardProps {
  currentUser: any;
}

export function KanbanBoard({ currentUser }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [myTasksOnly, setMyTasksOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [newComment, setNewComment] = useState("");

  const [newTaskForm, setNewTaskForm] = useState({
    title: "",
    description: "",
    departmentId: "",
    assigneeId: "",
    priority: "MEDIUM" as TaskPriority,
    dueDate: "",
    status: "TODO" as TaskStatus,
  });

  const fetchInitialData = async () => {
    try {
      const [deptRes, memRes] = await Promise.all([
        fetch("/api/departments").then((r) => r.json()),
        fetch("/api/members").then((r) => r.json()),
      ]);
      setDepartments(deptRes.departments || []);
      setMembers(memRes.members || []);
      if (deptRes.departments && deptRes.departments.length > 0) {
        setNewTaskForm((prev) => ({
          ...prev,
          departmentId: currentUser?.departmentId || deptRes.departments[0].id,
        }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (departmentFilter !== "all") query.set("departmentId", departmentFilter);
      if (myTasksOnly && currentUser) {
        query.set("assigneeId", currentUser.id);
      } else if (assigneeFilter !== "all") {
        query.set("assigneeId", assigneeFilter);
      }

      const res = await fetch(`/api/tasks?${query.toString()}`);
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [departmentFilter, assigneeFilter, myTasksOnly]);

  const handleCreateTask = async () => {
    if (!newTaskForm.title || !newTaskForm.departmentId) return;
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTaskForm),
      });
      if (res.ok) {
        setIsNewTaskOpen(false);
        setNewTaskForm({
          title: "",
          description: "",
          departmentId: departments[0]?.id || "",
          assigneeId: "",
          priority: "MEDIUM",
          dueDate: "",
          status: "TODO",
        });
        fetchTasks();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchTasks();
        if (selectedTask && selectedTask.id === taskId) {
          setSelectedTask((prev: any) => ({ ...prev, status: newStatus }));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddComment = async () => {
    if (!selectedTask || !newComment.trim()) return;
    try {
      const res = await fetch(`/api/tasks/${selectedTask.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: newComment }),
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedTask((prev: any) => ({
          ...prev,
          comments: [...(prev.comments || []), data.comment],
        }));
        setNewComment("");
        fetchTasks();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const columns: { id: TaskStatus; title: string; color: string; badgeVariant: any }[] = [
    { id: "TODO", title: "To Do", color: "border-t-teal-900/40", badgeVariant: "default" },
    { id: "IN_PROGRESS", title: "In Progress", color: "border-t-teal-500", badgeVariant: "accent" },
    { id: "REVIEW", title: "Review", color: "border-t-amber-500", badgeVariant: "warning" },
    { id: "DONE", title: "Done", color: "border-t-emerald-500", badgeVariant: "success" },
  ];

  return (
    <div className="space-y-6 animate-vague-in">
      {/* Controls & Filter Bar */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setMyTasksOnly(!myTasksOnly)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold font-body border transition-all duration-200 ${
                myTasksOnly
                  ? "bg-teal-900 text-white border-teal-900 shadow-sm"
                  : "bg-surface-alt text-ink-soft border-line hover:text-ink hover:bg-surface"
              }`}
            >
              ★ My Assigned Tasks
            </button>

            <Select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-48 text-xs py-2"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>

            <Select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              disabled={myTasksOnly}
              className="w-48 text-xs py-2"
            >
              <option value="all">All Assignees</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Select>
          </div>

          <Button
            size="sm"
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsNewTaskOpen(true)}
          >
            Create Task
          </Button>
        </div>
      </Card>

      {/* 4-Column Kanban Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
        {columns.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);
          return (
            <div
              key={col.id}
              className={`bg-surface-alt/70 border border-line rounded-2xl p-3.5 space-y-3 min-h-[500px] border-t-4 ${col.color}`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between px-1">
                <span className="font-display font-bold text-xs uppercase tracking-wider text-ink">
                  {col.title}
                </span>
                <span className="font-body text-xs font-bold text-ink-soft bg-surface px-2 py-0.5 rounded-full border border-line">
                  {colTasks.length}
                </span>
              </div>

              {/* Tasks List */}
              <div className="space-y-3">
                {colTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    className="p-4 bg-surface border border-line rounded-xl shadow-sm hover:shadow-md hover:border-teal-400/60 transition-all duration-200 cursor-pointer space-y-2.5 group"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <PriorityBadge priority={task.priority} />
                      {task.department && (
                        <span className="text-[10px] font-bold text-teal-900 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200 truncate max-w-[120px]">
                          {task.department.name}
                        </span>
                      )}
                    </div>

                    <h4 className="font-body font-bold text-xs text-ink group-hover:text-teal-900 transition-colors line-clamp-2">
                      {task.title}
                    </h4>

                    {task.description && (
                      <p className="text-[11px] text-ink-soft font-body line-clamp-2 leading-relaxed">
                        {task.description}
                      </p>
                    )}

                    <div className="pt-2 border-t border-line/60 flex items-center justify-between text-xs">
                      {task.assignee ? (
                        <div className="flex items-center gap-1.5" title={task.assignee.name}>
                          <Avatar name={task.assignee.name} src={task.assignee.avatarUrl} size="xs" />
                          <span className="text-[11px] font-semibold text-ink truncate max-w-[90px]">
                            {task.assignee.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-ink-faint italic font-body">
                          Unassigned
                        </span>
                      )}

                      <div className="flex items-center gap-2 text-ink-faint text-[10px]">
                        {task.comments?.length > 0 && (
                          <span className="flex items-center gap-0.5">
                            <MessageSquare className="w-3 h-3" /> {task.comments.length}
                          </span>
                        )}
                        {task.dueDate && (
                          <span className="flex items-center gap-0.5">
                            <Calendar className="w-3 h-3" /> {formatDate(task.dueDate)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {colTasks.length === 0 && (
                  <div className="p-6 text-center text-ink-faint border border-dashed border-line rounded-xl text-xs font-body">
                    No tickets in {col.title.toLowerCase()}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Task Modal */}
      <Modal
        isOpen={isNewTaskOpen}
        onClose={() => setIsNewTaskOpen(false)}
        title="Create New Sprint Task"
        description="Assign tickets to department members adhering to sprint priorities"
      >
        <div className="space-y-4">
          <Input
            label="Task Title *"
            placeholder="e.g., Design Social Media Story Kit"
            value={newTaskForm.title}
            onChange={(e) => setNewTaskForm({ ...newTaskForm, title: e.target.value })}
          />

          <Textarea
            label="Description & Acceptance Criteria"
            placeholder="Outline specific requirements, brand guidelines, and deliverable format..."
            value={newTaskForm.description}
            onChange={(e) => setNewTaskForm({ ...newTaskForm, description: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Department *"
              value={newTaskForm.departmentId}
              onChange={(e) => setNewTaskForm({ ...newTaskForm, departmentId: e.target.value })}
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>

            <Select
              label="Assignee"
              value={newTaskForm.assigneeId}
              onChange={(e) => setNewTaskForm({ ...newTaskForm, assigneeId: e.target.value })}
            >
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.departmentName || m.role})
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Priority"
              value={newTaskForm.priority}
              onChange={(e) => setNewTaskForm({ ...newTaskForm, priority: e.target.value as TaskPriority })}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent ⚡</option>
            </Select>

            <Input
              type="date"
              label="Due Date"
              value={newTaskForm.dueDate}
              onChange={(e) => setNewTaskForm({ ...newTaskForm, dueDate: e.target.value })}
            />
          </div>

          <div className="pt-4 border-t border-line flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setIsNewTaskOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreateTask}>
              Create Ticket
            </Button>
          </div>
        </div>
      </Modal>

      {/* Task Detail & Comments Modal */}
      {selectedTask && (
        <Modal
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          title={selectedTask.title}
          maxWidth="xl"
        >
          <div className="space-y-6">
            {/* Meta row */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-surface-alt rounded-xl border border-line">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold font-body text-ink-soft">Status:</span>
                <select
                  value={selectedTask.status}
                  onChange={(e) => handleStatusChange(selectedTask.id, e.target.value as TaskStatus)}
                  className="bg-surface border border-line rounded-lg px-2 py-1 text-xs font-bold font-body text-ink focus:outline-none focus:ring-1 focus:ring-teal-900"
                >
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="REVIEW">Review</option>
                  <option value="DONE">Done ✓</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <PriorityBadge priority={selectedTask.priority} />
                {selectedTask.dueDate && (
                  <span className="text-xs text-ink-soft font-body">
                    Due: <strong>{formatDate(selectedTask.dueDate)}</strong>
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <h5 className="text-xs font-semibold uppercase tracking-wider text-ink-soft font-body mb-1">
                Description
              </h5>
              <p className="text-xs text-ink font-body leading-relaxed bg-surface p-3 rounded-xl border border-line">
                {selectedTask.description || "No description provided."}
              </p>
            </div>

            {/* Assignee & Creator Info */}
            <div className="grid grid-cols-2 gap-4 text-xs font-body">
              <div className="p-3 bg-surface-alt rounded-xl border border-line">
                <span className="text-[10px] uppercase font-bold text-ink-faint block">Assignee</span>
                <p className="font-bold text-ink mt-0.5">
                  {selectedTask.assignee?.name || "Unassigned"}
                </p>
              </div>
              <div className="p-3 bg-surface-alt rounded-xl border border-line">
                <span className="text-[10px] uppercase font-bold text-ink-faint block">Created By</span>
                <p className="font-bold text-ink mt-0.5">
                  {selectedTask.createdBy?.name || "Executive Board"}
                </p>
              </div>
            </div>

            {/* Comments Thread */}
            <div className="space-y-3 pt-2">
              <h5 className="text-xs font-semibold uppercase tracking-wider text-ink-soft font-body flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" /> Comments & Activity (
                {selectedTask.comments?.length || 0})
              </h5>

              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                {selectedTask.comments?.map((c: any) => (
                  <div key={c.id} className="p-3 bg-surface-alt/60 border border-line/60 rounded-xl space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-ink font-body">{c.user?.name}</span>
                      <span className="text-[10px] text-ink-faint font-body">{formatDate(c.createdAt)}</span>
                    </div>
                    <p className="text-xs text-ink-soft font-body leading-snug">{c.body}</p>
                  </div>
                ))}
              </div>

              {/* Add Comment Input */}
              <div className="flex gap-2 pt-2">
                <Input
                  placeholder="Type a comment or update..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="text-xs py-2"
                />
                <Button size="sm" variant="primary" onClick={handleAddComment}>
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
