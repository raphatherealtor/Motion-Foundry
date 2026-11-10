import type {Boxes} from '../../render.js';
export interface MotionSuiteBoxes extends Boxes {word_level:{status:'PASS'|'UNSUPPORTED'|'NOT_RUN';unsupported_objects:string[]}}
