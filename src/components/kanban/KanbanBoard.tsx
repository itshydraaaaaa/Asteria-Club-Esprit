"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, StatusBadge, PriorityBadge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import { Input, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { EmptyState } from "@/components/ui/EmptyState";
import { TaskStatus, TaskPriority } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
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
  UserCheck,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

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

    // Supabase Realtime channel for live Kanban sync
    const supabase = createClient();
    const channel = supabase
      .channel("tasks_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        () => {
          fetchTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
        if (newStatus === "DONE") {
          confetti({
            particleCount: 75,
            spread: 60,
            origin: { y: 0.6 },
            colors: ["#11606E", "#60C8D4", "#0A3A40"],
          });
        }
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

  const columns: {
    id: TaskStatus;
    title: string;
    accentColor: string;
    borderTop: string;
  }[] = [
    { id: "TODO", title: "To Do", accentColor: "text-ink-soft", borderTop: "border-t-teal-900/40" },
    { id: "IN_PROGRESS", title: "In Progress", accentColor: "text-teal-900", borderTop: "border-t-teal-500" },
    { id: "REVIEW", title: "In Review", accentColor: "text-amber-700", borderTop: "border-t-amber-500" },
    { id: "DONE", title: "Completed", accentColor: "text-emerald-700", borderTop: "border-t-emerald-500" },
  ];

  return (
    <div className="space-y-6">
      {/* Filter and Trigger Controls */}
      <div className="p-4 bg-surface/90 backdrop-blur-md rounded-2xl border border-line shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setMyTasksOnly(!myTasksOnly)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold font-body border transition-all duration-200 ${
              myTasksOnly
                ? "bg-ast-primary text-white border-ast-primary shadow-sm"
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
            <option value="all">All Technical Tracks</option>
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
            <option value="all">All Members</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.departmentName || m.role})
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
          Create Sprint Task
        </Button>
      </div>

      {/* 4-Column Kanban Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
        {columns.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);
          return (
            <div
              key={col.id}
              className={`bg-surface-alt/80 backdrop-blur-sm border border-line rounded-2xl p-4 space-y-3.5 min-h-[520px] border-t-4 ${col.borderTop}`}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-1">
                <span className="font-display font-bold text-xs uppercase tracking-wider text-ink">
                  {col.title}
                </span>
                <span className="font-mono text-xs font-bold text-ink-soft bg-surface px-2 py-0.5 rounded-full border border-line">
                  {colTasks.length}
                </span>
              </div>

              {/* Tasks List with Framer Motion Stagger */}
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {colTasks.map((task) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.25 }}
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className="p-4 bg-surface border border-line rounded-xl shadow-sm hover:shadow-md hover:border-ast-light/70 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer space-y-3 group"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <PriorityBadge priority={task.priority} />
                        {task.department && (
                          <span className="text-[10px] font-mono font-bold text-ast-primary bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200 truncate max-w-[120px]">
                            {task.department.name}
                          </span>
                        )}
                      </div>

                      <h4 className="font-body font-bold text-xs text-ink group-hover:text-ast-primary transition-colors line-clamp-2">
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
                            <Avatar
                              name={task.assignee.name}
                              src={task.assignee.avatarUrl}
                              size="xs"
                            />
                            <span className="text-[11px] font-semibold text-ink truncate max-w-[90px]">
                              {task.assignee.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-ink-faint italic font-body">
                            Unassigned
                          </span>
                        )}

                        <div className="flex items-center gap-2 text-ink-faint text-[10px] font-mono">
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
                    </motion.div>
                  ))}
                </AnimatePresence>

                {colTasks.length === 0 && (
                  <div className="p-8 text-center text-ink-faint border border-dashed border-line/80 rounded-xl text-xs font-body">
                    No active tickets in {col.title.toLowerCase()}
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
        title="Create Sprint Ticket"
        description="Allocate technical deliverables to club members"
      >
        <div className="space-y-4">
          <Input
            label="Ticket Title *"
            placeholder="e.g. Design Component Library in Figma"
            value={newTaskForm.title}
            onChange={(e) => setNewTaskForm({ ...newTaskForm, title: e.target.value })}
          />

          <Textarea
            label="Requirements & Acceptance Criteria"
            placeholder="Specify technical scope, brand guidelines, and deliverable format..."
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

      {/* Task Detail Modal */}
      {selectedTask && (
        <Modal
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          title={selectedTask.title}
          maxWidth="xl"
        >
          <div className="space-y-5">
            {/* Meta status selector */}
            <div className="p-3 bg-surface-alt rounded-xl border border-line flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold font-body text-ink-soft">Status:</span>
                <select
                  value={selectedTask.status}
                  onChange={(e) => handleStatusChange(selectedTask.id, e.target.value as TaskStatus)}
                  className="bg-surface border border-line rounded-lg px-2.5 py-1 text-xs font-bold font-body text-ink focus:outline-none focus:ring-1 focus:ring-ast-primary"
                >
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="REVIEW">Review</option>
                  <option value="DONE">Completed ✓</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <PriorityBadge priority={selectedTask.priority} />
                {selectedTask.dueDate && (
                  <span className="text-xs text-ink-soft font-mono">
                    Due: {formatDate(selectedTask.dueDate)}
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <h5 className="text-xs font-semibold uppercase tracking-wider text-ink-soft font-display mb-1">
                Description & Deliverables
              </h5>
              <p className="text-xs text-ink font-body leading-relaxed bg-surface p-3.5 rounded-xl border border-line">
                {selectedTask.description || "No description provided."}
              </p>
            </div>

            {/* Assignee / Creator Details */}
            <div className="grid grid-cols-2 gap-4 text-xs font-body">
              <div className="p-3 bg-surface-alt rounded-xl border border-line">
                <span className="text-[10px] uppercase font-bold text-ink-faint font-display block">Assignee</span>
                <p className="font-bold text-ink mt-0.5">
                  {selectedTask.assignee?.name || "Unassigned"}
                </p>
              </div>
              <div className="p-3 bg-surface-alt rounded-xl border border-line">
                <span className="text-[10px] uppercase font-bold text-ink-faint font-display block">Created By</span>
                <p className="font-bold text-ink mt-0.5">
                  {selectedTask.createdBy?.name || "Executive Board"}
                </p>
              </div>
            </div>

            {/* Comments Thread */}
            <div className="space-y-3 pt-2">
              <h5 className="text-xs font-semibold uppercase tracking-wider text-ink-soft font-display flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" /> Comments & Activity (
                {selectedTask.comments?.length || 0})
              </h5>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {selectedTask.comments?.map((c: any) => (
                  <div key={c.id} className="p-3 bg-surface-alt/70 border border-line/60 rounded-xl space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-ink font-body">{c.user?.name}</span>
                      <span className="text-[10px] text-ink-faint font-mono">{formatDate(c.createdAt)}</span>
                    </div>
                    <p className="text-xs text-ink-soft font-body leading-snug">{c.body}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <Input
                  placeholder="Type an update or comment..."
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
