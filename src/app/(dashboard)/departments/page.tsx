"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { OrgChartView } from "@/components/org-chart/OrgChartView";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Tabs } from "@/components/ui/Tabs";
import { useLanguage } from "@/components/providers/LanguageProvider";
import Link from "next/link";
import {
  Layers,
  Network,
  Users,
  Code2,
  Palette,
  Video,
  Camera,
  ArrowRight,
} from "lucide-react";

export default function DepartmentsPage() {
  const { language, t } = useLanguage();
  const isFr = language === "fr";

  const [activeTab, setActiveTab] = useState<"chart" | "grid">("chart");
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/departments")
      .then((res) => res.json())
      .then((res) => setDepartments(res.departments || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title={isFr ? "Pôles & Structure Organisationnelle" : "Departments & Org Structure"}
        subtitle={isFr ? "Hiérarchie interactive et pôles de spécialisation technique" : "Interactive hierarchy and technical specialization tracks"}
      />

      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
        {/* View Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Tabs
            tabs={[
              { id: "chart", label: isFr ? "Organigramme Interactif" : "Interactive Org Chart", icon: <Network className="w-3.5 h-3.5" /> },
              { id: "grid", label: isFr ? "Cartes des Pôles" : "Department Cards", icon: <Layers className="w-3.5 h-3.5" /> },
            ]}
            activeTab={activeTab}
            onChange={(id) => setActiveTab(id as any)}
          />

          <div className="text-xs text-ink-soft font-body">
            {isFr
              ? "4 pôles techniques d'élite orientés vers Asteria Freelance"
              : "4 Core Technical Tracks feeding into Asteria Freelance"}
          </div>
        </div>

        {activeTab === "chart" ? (
          <OrgChartView />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-vague-in">
            {departments.map((dept) => (
              <Card key={dept.id} hoverable className="overflow-hidden">
                <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="p-3 rounded-2xl bg-teal-900 text-white shadow-sm">
                      {dept.slug === "web-development" ? (
                        <Code2 className="w-6 h-6" />
                      ) : dept.slug === "graphic-design" ? (
                        <Palette className="w-6 h-6" />
                      ) : dept.slug === "video-editing" ? (
                        <Video className="w-6 h-6" />
                      ) : (
                        <Camera className="w-6 h-6" />
                      )}
                    </div>
                    <Badge variant="primary" size="sm">
                      {dept._count?.members || 0} {isFr ? "Membres" : "Members"}
                    </Badge>
                  </div>

                  <div>
                    <h3 className="font-display font-bold text-lg uppercase tracking-wider text-ink">
                      {dept.name}
                    </h3>
                    <p className="font-body text-xs text-ink-soft mt-1 leading-relaxed">
                      {dept.description}
                    </p>
                  </div>

                  {dept.hod && (
                    <div className="p-3 rounded-xl bg-surface-alt border border-line flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar name={dept.hod.name} src={dept.hod.avatarUrl} size="sm" />
                        <div>
                          <p className="text-xs font-bold font-body text-ink">{dept.hod.name}</p>
                          <p className="text-[10px] text-ink-soft font-body">{isFr ? "Chef de Pôle" : "Head of Department"}</p>
                        </div>
                      </div>
                      <Link href={`/members/${dept.hod.id}`}>
                        <Button variant="ghost" size="sm" className="text-[11px] h-7">
                          {isFr ? "Profil" : "Profile"}
                        </Button>
                      </Link>
                    </div>
                  )}

                  <div className="pt-3 border-t border-line/70 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-ink-soft">
                      <span><strong>{dept._count?.tasks || 0}</strong> {isFr ? "Tâches Actives" : "Active Tasks"}</span>
                      <span><strong>{dept._count?.events || 0}</strong> {isFr ? "Événements" : "Events"}</span>
                    </div>
                    <Link href={`/departments/${dept.id}`}>
                      <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                        {isFr ? "Ouvrir l'Espace" : "Open Hub"}
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
