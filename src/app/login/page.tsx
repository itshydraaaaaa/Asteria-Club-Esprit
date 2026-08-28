"use client";

import React, { useState } from "react";
import { AsteriaLogo } from "@/components/brand/AsteriaLogo";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AmbientCanvas } from "@/components/ui/AmbientCanvas";
import Link from "next/link";
import { Lock, Mail, Shield, Award, User, ArrowRight, Sparkles } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("president@asteria.tn");
  const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        window.location.href = "/dashboard";
      } else {
        setError(data.error || "Login failed. Check your credentials.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const quickDemoAccounts = [
    {
      title: "President (Board)",
      email: "president@asteria.tn",
      role: "Board Executive",
      icon: Shield,
    },
    {
      title: "HoD Web Development",
      email: "hod.web@asteria.tn",
      role: "Department Lead",
      icon: Award,
    },
    {
      title: "Karim (Active Member)",
      email: "karim.chaabane@asteria.tn",
      role: "Web Dev Member",
      icon: User,
    },
    {
      title: "Mehdi (Applicant)",
      email: "mehdi.applicant@esprit.tn",
      role: "Applicant Portal",
      icon: User,
    },
  ];

  return (
    <div className="min-h-screen bg-surface-alt flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-body relative overflow-hidden">
      <AmbientCanvas particleCount={30} className="absolute inset-0 pointer-events-none opacity-40" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3 relative z-10">
        <AsteriaLogo variant="light" size="lg" href="/" className="justify-center" />
        <p className="font-body text-xs text-ink-soft font-medium">
          Asteria Club Esprit Operating System · Management Console
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-vague-in px-4 relative z-10">
        <Card className="p-6 sm:p-8 bg-surface/90 backdrop-blur-md shadow-xl border border-line/80 space-y-6">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-body">
                {error}
              </div>
            )}

            <Input
              type="email"
              label="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />

            <Input
              type="password"
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              size="lg"
              isLoading={loading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to Platform
            </Button>
          </form>

          {/* Quick Demo Accounts */}
          <div className="pt-4 border-t border-line space-y-2.5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-ink-faint font-mono">
              <Sparkles className="w-3.5 h-3.5 text-ast-light" />
              1-Click Demo Personas:
            </div>
            <div className="grid grid-cols-2 gap-2">
              {quickDemoAccounts.map((acc) => {
                const Icon = acc.icon;
                return (
                  <button
                    key={acc.email}
                    onClick={() => {
                      setEmail(acc.email);
                      setPassword("password123");
                      fetch("/api/auth/switch-role", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email: acc.email }),
                      }).then(() => {
                        window.location.href = "/dashboard";
                      });
                    }}
                    className="p-2.5 rounded-xl border border-line bg-surface-alt hover:bg-teal-50 hover:border-ast-light/60 text-left transition-all group"
                  >
                    <div className="flex items-center gap-1.5">
                      <Icon className="w-3 h-3 text-ast-primary" />
                      <span className="font-bold text-[11px] text-ink truncate group-hover:text-ast-primary">
                        {acc.title}
                      </span>
                    </div>
                    <span className="text-[10px] text-ink-soft block truncate mt-0.5 font-body">
                      {acc.role}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-line flex items-center justify-between text-xs font-body text-ink-soft">
            <Link href="/apply" className="text-ast-primary font-semibold hover:underline">
              Join Asteria Form →
            </Link>
            <Link href="/signup" className="hover:underline">
              Create Account
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
