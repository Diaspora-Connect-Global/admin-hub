/**
 * Audit service (core): in-app structured logging. No network calls.
 * Uses central logger; never include passwords or tokens.
 */

import { logger, type LogLevel } from "@/lib/logger";

export type AuditAction =
  | "auth.login"
  | "auth.logout"
  | "auth.login_failed"
  | "auth.session_expired"
  | "route.access_denied";

export interface AuditEvent {
  timestamp: string;
  action: AuditAction | string;
  actorId: string;
  actorLabel?: string;
  resourceType?: string;
  resourceId?: string;
  success?: boolean;
  reason?: string;
  metadata?: Record<string, unknown>;
}

const MAX_BUFFER = 500;
const eventBuffer: AuditEvent[] = [];
const auditLog = logger.child("Audit");

function emit(event: AuditEvent, level: LogLevel = "info"): void {
  const { action, actorId, actorLabel, resourceType, resourceId, success, reason, metadata } = event;
  auditLog[level](`Audit: ${action}`, {
    action,
    actorId,
    ...(actorLabel != null && { actorLabel }),
    ...(resourceType != null && { resourceType }),
    ...(resourceId != null && { resourceId }),
    ...(success != null && { success }),
    ...(reason != null && { reason }),
    ...metadata,
  });
  eventBuffer.push(event);
  if (eventBuffer.length > MAX_BUFFER) eventBuffer.shift();
}

export function audit(event: Omit<AuditEvent, "timestamp">, level: LogLevel = "info"): void {
  emit({ ...event, timestamp: new Date().toISOString() }, level);
}

export function logLogin(params: {
  actorId: string;
  actorLabel?: string;
  success: boolean;
  reason?: string;
  metadata?: Record<string, unknown>;
}): void {
  audit({
    action: params.success ? "auth.login" : "auth.login_failed",
    actorId: params.actorId,
    actorLabel: params.actorLabel,
    resourceType: "Auth",
    resourceId: params.success ? "session" : undefined,
    success: params.success,
    reason: params.reason,
    metadata: params.metadata,
  });
}

export function logLogout(params: {
  actorId: string;
  actorLabel?: string;
  metadata?: Record<string, unknown>;
}): void {
  audit({
    action: "auth.logout",
    actorId: params.actorId,
    actorLabel: params.actorLabel,
    resourceType: "Auth",
    resourceId: "session",
    metadata: params.metadata,
  });
}

export function logRouteAccessDenied(params: {
  path: string;
  metadata?: Record<string, unknown>;
}): void {
  audit({
    action: "route.access_denied",
    actorId: "anonymous",
    resourceType: "Route",
    resourceId: params.path,
    success: false,
    metadata: params.metadata,
  }, "debug");
}

export function getRecentAuditEvents(limit = 100): AuditEvent[] {
  return [...eventBuffer].reverse().slice(0, limit);
}
