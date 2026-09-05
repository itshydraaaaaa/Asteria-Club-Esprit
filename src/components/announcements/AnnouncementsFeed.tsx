"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, RoleBadge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import { Input, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { EmptyState } from "@/components/ui/EmptyState";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/components/providers/LanguageProvider";
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
  const { language, t } = useLanguage();
  const isFr = language === "fr";

  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  // New Announcement Modal
  const [isOpen, setIsOpen] = useState(false);
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

    // Supabase Realtime channel for live announcements
    const supabase = createClient();
    const channel = supabase
      .channel("announcements_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "announcements" },
        () => {
          fetchAnnouncements();
        }
      )
      .on(
        "broadcast",
        { event: "announcement_updated" },
        () => {
          fetchAnnouncements();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
    <div className="space-y-6">
      {/* Control bar */}
      <div className="p-4 bg-surface/90 backdrop-blur-md rounded-2xl border border-line shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold font-body border transition-all ${
              filter === "all"
                ? "bg-ast-primary text-white border-ast-primary shadow-sm"
                : "bg-surface-alt text-ink-soft border-line hover:text-ink"
            }`}
          >
            {isFr ? "Toutes les Annonces" : "All Broadcasts"}
          </button>
          <button
            onClick={() => setFilter("CLUB")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold font-body border transition-all ${
              filter === "CLUB"
                ? "bg-ast-primary text-white border-ast-primary shadow-sm"
                : "bg-surface-alt text-ink-soft border-line hover:text-ink"
            }`}
          >
            {isFr ? "Tout le Club" : "Club-Wide Feed"}
          </button>

          <Select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-48 text-xs py-1.5"
          >
            <option value="all">{isFr ? "Filtrer par pôle..." : "Filter Department..."}</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} {isFr ? "Pôle" : "Division"}
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
            {isFr ? "Publier une Annonce" : "Publish Announcement"}
          </Button>
        )}
      </div>

      {/* Announcements Stream */}
      {loading ? (
        <div className="p-12 text-center text-ink-soft">
          <div className="animate-spin w-8 h-8 border-2 border-ast-primary border-t-transparent rounded-full mx-auto mb-3" />
          <p className="font-display text-xs uppercase tracking-wider">Syncing Bulletins...</p>
        </div>
      ) : announcements.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No Announcements Posted"
          description="Check back later or publish a club-wide notice to update all members."
        />
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {announcements.map((ann) => (
              <motion.div
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                key={ann.id}
              >
                <Card
                  className={`p-6 space-y-4 border ${
                    ann.isPinned
                      ? "border-ast-light/80 bg-teal-50/20 shadow-md"
                      : "bg-surface/90 backdrop-blur-md"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {ann.isPinned && (
                        <Badge variant="accent" size="sm" className="font-bold">
                          <Pin className="w-3 h-3" /> Pinned Bulletin
                        </Badge>
                      )}
                      <Badge variant={ann.scope === "CLUB" ? "primary" : "default"} size="sm">
                        {ann.scope === "CLUB" ? "Club-Wide Broadcast" : ann.department?.name}
                      </Badge>
                    </div>
                    <span className="text-xs text-ink-faint font-mono">
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
              </motion.div>
            ))}
          </AnimatePresence>
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
            placeholder="e.g. Asteria Freelance Division Open Call"
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
                className="w-4 h-4 text-ast-primary rounded border-line"
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
                Push Webhook Dispatch to Asteria Discord Server
              </label>
            </div>
          </div>

          {/* Discord Webhook Preview Card */}
          {form.syncDiscord && (
            <div className="p-3.5 rounded-xl bg-[#2b2d31] text-[#dbdee1] border border-[#1e1f22] space-y-2 text-xs font-body">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#5865f2] font-bold">
                  <Bot className="w-4 h-4" /> Asteria Bot [BOT]
                </div>
                <span className="text-[10px] font-mono text-teal-400 bg-teal-950/80 px-2 py-0.5 rounded border border-teal-800/60 font-semibold">
                  Webhook Dispatch Preview
                </span>
              </div>
              <div className="p-3 bg-[#1e1f22] rounded-lg border-l-4 border-[#60C8D4] space-y-1">
                <p className="font-bold text-white text-xs font-display">
                  {form.title || "Announcement Title"}
                </p>
                <p className="text-[#dbdee1] text-[11px] font-body">
                  {form.body || "Announcement text will be formatted as a rich Discord embed and broadcasted."}
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
