// Future host interfaces only. No integration is implemented or verified.
import type {RepairProposal,Range} from './contracts.js';
export interface RendererAdapter {status:'UNVERIFIED';render(snapshot:unknown,range:Range):Promise<unknown>}
export interface SnapshotSource {status:'UNVERIFIED';snapshot():Promise<unknown>}
export interface OperationSink {status:'UNVERIFIED';propose(proposal:RepairProposal):Promise<unknown>}
