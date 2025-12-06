import { Node } from "reactflow";

export type NodeKind = "start" | "task" | "approval" | "automated" | "end";

export type BaseNodeData = {
  title?: string;
  metadata?: Record<string, string>;
};

export type StartNodeData = BaseNodeData & {
  title: string;
  metadata?: Record<string, string>;
};

export type TaskNodeData = BaseNodeData & {
  title: string;
  description?: string;
  assignee?: string;
  dueDate?: string;
  custom?: Record<string, string>;
};

export type ApprovalNodeData = BaseNodeData & {
  title: string;
  approverRole?: string;
  autoApproveThreshold?: number;
};

export type AutomatedNodeData = BaseNodeData & {
  title: string;
  actionId?: string;
  actionParams?: Record<string, string>;
};

export type EndNodeData = BaseNodeData & {
  title: string;
  endMessage?: string;
  summary?: boolean;
};

export type WorkflowNodeData =
  | ({ kind: "start" } & StartNodeData)
  | ({ kind: "task" } & TaskNodeData)
  | ({ kind: "approval" } & ApprovalNodeData)
  | ({ kind: "automated" } & AutomatedNodeData)
  | ({ kind: "end" } & EndNodeData);

export type WorkflowNode = Node<WorkflowNodeData>;
