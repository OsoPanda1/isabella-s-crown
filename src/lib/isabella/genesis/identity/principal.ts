/** IDENTITY & AUTHORITY — PrincipalContext (who asks). */
export type PrincipalKind = "human" | "machine" | "service";

export interface Principal {
  id: string;
  kind: PrincipalKind;
  displayName?: string | undefined;
  tenantId?: string | undefined;
  roles: readonly string[];
  attributes: Readonly<Record<string, string | number | boolean>>;
  approvalKeyId?: string | undefined;
}

export interface PrincipalContext {
  principal: Principal;
  scope: string;
  methodId: string;
  requestId?: string | undefined;
  traceId?: string | undefined;
}

export function createPrincipal(partial: Omit<Principal, "roles" | "attributes"> & {
  roles?: readonly string[] | undefined;
  attributes?: Record<string, string | number | boolean> | undefined;
}): Principal {
  return {
    id: partial.id, kind: partial.kind, displayName: partial.displayName, tenantId: partial.tenantId,
    roles: partial.roles ?? [], attributes: partial.attributes ?? {}, approvalKeyId: partial.approvalKeyId,
  };
}

export function isHuman(p: Principal): boolean { return p.kind === "human"; }

export function assertBalancedAuthority(p: Principal): void {
  if (p.kind !== "human" && p.roles.includes("admin")) {
    throw new Error("IDENTITY: una máquina o principal no humano no puede ostentar admin sin delegación humana (non-human principals cannot hold admin without explicit human delegation).");
  }
}
