import { Opik } from "opik";

const OPIK_API_KEY = process.env.OPIK_API_KEY;
const OPIK_PROJECT = process.env.OPIK_PROJECT_NAME || "polar-universal";
const OPIK_WORKSPACE = process.env.OPIK_WORKSPACE || "default";

let opikInstance: Opik | null = null;

export function getOpikClient(): Opik | null {
  if (!OPIK_API_KEY) return null;
  if (!opikInstance) {
    opikInstance = new Opik({
      apiKey: OPIK_API_KEY,
      projectName: OPIK_PROJECT,
      workspaceName: OPIK_WORKSPACE,
    });
  }
  return opikInstance;
}

export function getOpikProjectName(): string {
  return OPIK_PROJECT;
}

export function isOpikEnabled(): boolean {
  return !!OPIK_API_KEY;
}
