"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, RoleBadge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import { Input, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  Megaphone,
  Pin,
  Plus,
  Send,
  Sparkles,
  MessageSquare,
  Bot,
  ExternalLink,
} from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/utils";

interface AnnouncementsFeedProps {
  currentUser: any;
}

export function AnnouncementsFeed({ currentUser }: AnnouncementsFeedProps) {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  // New Announcement Modal
  const [isOpen, setIsOpen] = useState(false);
  const [discordPreview, setDiscordPreview] = useState(false);
  const [form, setForm] = useState({
    title: "",
    body: "",
    scope: "CLUB" as "CLUB" | "DEPARTMENT",
    departmentId: "",
    isPinned: false,
    syncDiscord: true,
  });

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (filter === "CLUB") query.set("scope", "CLUB");
      else if (filter !== "all") query.set("departmentId", filter);

      const res = await fetch(`/api/announcements?${query.toString()}`);
      const data = await res.json();
      setAnnouncements(data.announcements || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch("/api/departments")
      .then((r) => r.json())
      .then((r) => setDepartments(r.departments || []));
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [filter]);

  const handleCreate = async () => {
    if (!form.title || !form.body) return;
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setIsOpen(false);
        setForm({
          title: "",
          body: "",
          scope: "CLUB",
          departmentId: "",
          isPinned: false,
          syncDiscord: true,
        });
        fetchAnnouncements();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 animate-vague-in">
      {/* Action and Filter bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold font-body border transition-all ${
                filter === "all"
                  ? "bg-teal-900 text-white border-teal-900"
                  : "bg-surface-alt text-ink-soft border-line hover:text-ink"
              }`}
            >
              All Announcements
            </button>
            <button
              onClick={() => setFilter("CLUB")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold font-body border transition-all ${
                filter === "CLUB"
                  ? "bg-teal-900 text-white border-teal-900"
                  : "bg-surface-alt text-ink-soft border-line hover:text-ink"
              }`}
            >
              Club-Wide Feed
            </button>

            <Select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-48 text-xs py-1.5"
            >
              <option value="all">Filter Department...</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} Division
                </option>
              ))}
            </Select>
          </div>

          {(currentUser?.role === "BOARD" || currentUser?.role === "HOD") && (
            <Button
              size="sm"
              variant="primary"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsOpen(true)}
            >
              Publish Announcement
            </Button>
          )}
        </div>
      </Card>

      {/* Announcements List */}
      {loading ? (
        <div className="p-12 text-center text-ink-soft">
          <div className="animate-spin w-8 h-8 border-2 border-teal-900 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="font-display text-xs uppercase tracking-wider">Loading Announcements...</p>
        </div>
      ) : announcements.length === 0 ? (
        <div className="p-12 text-center text-ink-soft bg-surface rounded-2xl border border-line">
          <Megaphone className="w-10 h-10 text-ink-faint mx-auto mb-2" />
          <h4 className="font-display font-bold text-sm text-ink uppercase">No Announcements</h4>
          <p className="text-xs text-ink-soft mt-1">Check back later for club bulletins.</p>
        </div>
      ) : (
        <div className="space-y-4 animate-vague-in">
          {announcements.map((ann) => (
            <Card
              key={ann.id}
              className={`p-6 space-y-4 border ${
                ann.isPinned ? "border-teal-400/80 bg-teal-50/20" : "bg-surface"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {ann.isPinned && (
                    <Badge variant="accent" size="sm" className="font-bold">
                      <Pin className="w-3 h-3" /> Pinned Post
                    </Badge>
                  )}
                  <Badge variant={ann.scope === "CLUB" ? "primary" : "default"} size="sm">
                    {ann.scope === "CLUB" ? "Club-Wide Broadcast" : ann.department?.name}
                  </Badge>
                </div>
                <span className="text-xs text-ink-faint font-body">
                  {formatDateTime(ann.createdAt)}
                </span>
              </div>

              <div>
                <h3 className="font-display font-bold text-base sm:text-lg uppercase tracking-wider text-ink">
                  {ann.title}
                </h3>
                <p className="font-body text-xs sm:text-sm text-ink mt-2 leading-relaxed whitespace-pre-line">
                  {ann.body}
                </p>
              </div>

              {/* Author Footer & Discord Badge */}
              <div className="pt-4 border-t border-line/60 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <Avatar name={ann.author?.name} src={ann.author?.avatarUrl} size="sm" />
                  <div>
                    <p className="font-body font-bold text-xs text-ink">{ann.author?.name}</p>
                    <p className="text-[10px] text-ink-soft font-body">{ann.author?.role}</p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                  <Bot className="w-3.5 h-3.5" />
                  Synced to Discord #announcements
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Publish Announcement Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Publish Announcement"
        description="Broadcast to members and push rich embeds to Asteria Discord"
        maxWidth="xl"
      >
        <div className="space-y-4">
          <Input
            label="Announcement Title *"
            placeholder="e.g. Asteria Freelance Division Recruitment Open"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />

          <Textarea
            label="Body Content *"
            placeholder="Write clear, brand-consistent bulletin details..."
            rows={4}
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Audience / Scope"
              value={form.scope}
              onChange={(e) => setForm({ ...form, scope: e.target.value as any })}
            >
              <option value="CLUB">Club-Wide (All Members)</option>
              <option value="DEPARTMENT">Specific Department Only</option>
            </Select>

            {form.scope === "DEPARTMENT" && (
              <Select
                label="Department"
                value={form.departmentId}
                onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
              >
                <option value="">Select department...</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </Select>
            )}
          </div>

          <div className="space-y-2 pt-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="pinnedCheck"
                checked={form.isPinned}
                onChange={(e) => setForm({ ...form, isPinned: e.target.checked })}
                className="w-4 h-4 text-teal-900 rounded border-line"
              />
              <label htmlFor="pinnedCheck" className="text-xs font-semibold font-body text-ink cursor-pointer">
                Pin to top of announcements feed
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="discordCheck"
                checked={form.syncDiscord}
                onChange={(e) => setForm({ ...form, syncDiscord: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded border-line"
              />
              <label htmlFor="discordCheck" className="text-xs font-semibold font-body text-indigo-900 cursor-pointer">
                Simulate Webhook Dispatch to Asteria Discord Server
              </label>
            </div>
          </div>

          {/* Discord Preview Card */}
          {form.syncDiscord && (
            <div className="p-3 rounded-xl bg-[#2b2d31] text-[#dbdee1] border border-[#1e1f22] space-y-2 text-xs font-body">
              <div className="flex items-center gap-2 text-[#5865f2] font-bold">
                <Bot className="w-4 h-4" /> Asteria Bot [BOT] • Today at 12:00 PM
              </div>
              <div className="p-3 bg-[#1e1f22] rounded-lg border-l-4 border-[#60C8D4] space-y-1">
                <p className="font-bold text-white text-xs">
                  {form.title || "Announcement Title"}
                </p>
                <p className="text-[#dbdee1] text-[11px]">
                  {form.body || "Announcement text will be formatted and posted to the channel."}
                </p>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-line flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreate}>
              Publish Announcement
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
