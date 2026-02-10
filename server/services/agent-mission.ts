import type { MissionPhase, AgentMissionLog } from "../../shared/types/audit";

export class AgentMission {
  private readonly missionId: string;
  private readonly tenantId: string;
  private readonly agentId: string;
  private logs: AgentMissionLog[] = [];
  private currentPhase: MissionPhase = "Planning";

  constructor(tenantId: string, agentId: string) {
    this.missionId = `mission_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    this.tenantId = tenantId;
    this.agentId = agentId;
    this.log("Planning", `Mission initialized for tenant [${tenantId}] by agent [${agentId}]`);
  }

  public getMissionId(): string {
    return this.missionId;
  }

  public getTenantId(): string {
    return this.tenantId;
  }

  public getCurrentPhase(): MissionPhase {
    return this.currentPhase;
  }

  public transitionTo(phase: MissionPhase, message: string): void {
    this.currentPhase = phase;
    this.log(phase, message);
  }

  private log(phase: MissionPhase, message: string): void {
    const entry: AgentMissionLog = {
      missionId: this.missionId,
      tenantId: this.tenantId,
      phase,
      timestamp: new Date().toISOString(),
      message,
    };
    this.logs.push(entry);
    console.log(`[AgentMission:${this.missionId}] [${phase}] ${message}`);
  }

  public getLogs(): AgentMissionLog[] {
    return [...this.logs];
  }

  public finalize(success: boolean): void {
    this.transitionTo(
      "Finalizing",
      success
        ? `Mission completed successfully for tenant [${this.tenantId}]`
        : `Mission failed for tenant [${this.tenantId}]`
    );
  }
}
