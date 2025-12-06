import {
  NodeKind,
  WorkflowNode,
  WorkflowNodeData,
  StartNodeData,
  TaskNodeData,
  ApprovalNodeData,
  EndNodeData,
  AutomatedNodeData,
} from "./types";

let nodeIdCounter = 1;
const makeId = (prefix = "node") => `${prefix}_${nodeIdCounter++}`;

export function defaultPosition(kind: NodeKind) {
  switch (kind) {
    case "start":
      return { x: 0, y: 0 };
    case "end":
      return { x: 600, y: 0 };
    default:
      return { x: Math.random() * 400, y: Math.random() * 300 };
  }
}

export function createNode(kind: NodeKind): WorkflowNode {
  const id = makeId(kind);
  const base: WorkflowNode = {
    id,
    position: defaultPosition(kind),
    data: { kind, title: kind.toUpperCase() },
    type: kind,
  } as WorkflowNode;

  // Attach type-specific defaults
  switch (kind) {
    case "start":
      base.data = {
        kind: "start",
        title: "Start",
        metadata: {},
        canReceive: false,
        canSend: true, // only outgoing
      } as StartNodeData & { kind: "start" };
      break;
    case "task":
      base.data = {
        kind: "task",
        title: "Task",
        description: "",
        assignee: "",
        dueDate: "",
        custom: {},
      } as TaskNodeData & { kind: "task" };
      break;
    case "approval":
      base.data = {
        kind: "approval",
        title: "Approval",
        approverRole: "Manager",
        autoApproveThreshold: 0,
      } as ApprovalNodeData & { kind: "approval" };
      break;
    case "automated":
      base.data = {
        kind: "automated",
        title: "Automated",
        actionId: undefined,
        actionParams: {},
      } as AutomatedNodeData & { kind: "automated" };
      break;
    case "end":
      base.data = {
        kind: "end",
        title: "End",
        endMessage: "Done.",
        summary: true,
        canReceive: true,
        canSend: false,
      } as EndNodeData & { kind: "end" };
      break;
  }
  return base;
}
