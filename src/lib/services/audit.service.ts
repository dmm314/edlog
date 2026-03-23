/**
 * Audit Service — Track all state changes for entries and other entities.
 * Creates an immutable audit trail for compliance and trust.
 */
import { db } from "@/lib/db";

export type AuditAction =
  | "CREATED"
  | "EDITED"
  | "SUBMITTED"
  | "VERIFIED"
  | "FLAGGED"
  | "DELETED"
  | "STATUS_CHANGED"
  | "APPROVED"
  | "REJECTED";

export interface CreateAuditLogInput {
  entityType: string; // 'LogbookEntry', 'Assessment', 'User', etc.
  entityId: string;
  action: AuditAction;
  actorId: string;
  actorRole: string;
  metadata?: Record<string, unknown>;
}

export async function createAuditLog(input: CreateAuditLogInput) {
  return db.auditLog.create({
    data: {
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      actorId: input.actorId,
      actorRole: input.actorRole,
      metadata: input.metadata ? JSON.parse(JSON.stringify(input.metadata)) : undefined,
    },
  });
}

export async function getAuditLogs(
  entityType: string,
  entityId: string,
  options?: { limit?: number; offset?: number }
) {
  const limit = options?.limit || 50;
  const offset = options?.offset || 0;

  return db.auditLog.findMany({
    where: { entityType, entityId },
    include: {
      actor: { select: { id: true, firstName: true, lastName: true, role: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  });
}

export async function getAuditLogsByActor(
  actorId: string,
  options?: { limit?: number; offset?: number; entityType?: string }
) {
  const limit = options?.limit || 50;
  const offset = options?.offset || 0;

  return db.auditLog.findMany({
    where: {
      actorId,
      ...(options?.entityType ? { entityType: options.entityType } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  });
}
