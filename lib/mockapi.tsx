const mockAutomations = [
  { id: "send_email", label: "Send Email", params: ["to", "subject"] },
  {
    id: "generate_doc",
    label: "Generate Document",
    params: ["template", "recipient"],
  },
];

export async function getAutomations() {
  // Simulate network latency
  await new Promise((r) => setTimeout(r, 200));
  return mockAutomations;
}
export async function simulateWorkflow(nodes: any, edges: any) {
  const logs: string[] = [];

  // Helper maps
  const nodeMap = new Map(nodes.map((n: any) => [n.id, n]));
  const outgoing = new Map<string, string[]>();

  edges.forEach((e: any) => {
    if (!outgoing.has(e.source)) outgoing.set(e.source, []);
    outgoing.get(e.source)?.push(e.target);
  });

  logs.push("🔍 Validating workflow...");

  // ---- 1. Find start node ----
  const startNodes = nodes.filter((n: any) => n.data.kind === "start");

  if (startNodes.length === 0) {
    logs.push("❌ ERROR: No Start node found.");
    return { logs };
  }
  if (startNodes.length > 1) {
    logs.push("❌ ERROR: Multiple Start nodes found.");
    return { logs };
  }

  const start = startNodes[0];
  logs.push(`▶ Start node: ${start.data.title}`);

  // ---- 2. Detect cycles using DFS ----
  const visited = new Set<string>();
  const stack = new Set<string>();

  function detectCycle(nodeId: string): boolean {
    if (stack.has(nodeId)) return true;
    if (visited.has(nodeId)) return false;

    visited.add(nodeId);
    stack.add(nodeId);

    const next = outgoing.get(nodeId) || [];
    for (const n of next) {
      if (detectCycle(n)) return true;
    }

    stack.delete(nodeId);
    return false;
  }

  if (detectCycle(start.id)) {
    logs.push("❌ ERROR: Cycle detected in workflow.");
    return { logs };
  }

  logs.push("✔ No cycles detected.");

  // ---- 3. Walk through graph ----
  logs.push("🚀 Executing workflow...");

  let current = start.id;
  const visitedRun = new Set<string>();

  while (current) {
    if (visitedRun.has(current)) {
      logs.push("❌ ERROR: Infinite loop detected.");
      break;
    }
    visitedRun.add(current);

    const node: any = nodeMap.get(current);

    if (!node) {
      logs.push(`❌ ERROR: Node not found: ${current}`);
      break;
    }

    const { kind, title } = node.data;

    switch (kind) {
      case "start":
        logs.push(`▶ START: ${title}`);
        break;

      case "task":
        logs.push(`🧑‍💼 TASK: Assigned to ${node.data.assignee || "Unassigned"}`);
        logs.push(`   → ${node.data.description || "No description"}`);
        break;

      case "approval":
        logs.push(`✔ APPROVAL STEP: ${title}`);
        logs.push(`   Approver Role: ${node.data.approverRole || "Manager"}`);
        break;

      case "automated": {
        const actionId = node.data.actionId;
        const actionParams = node.data.actionParams;

        logs.push(
          `⚙ AUTOMATION: Running "${actionId || "Unknown Automation"}"`
        );

        if (actionParams && Object.keys(actionParams).length > 0) {
          logs.push(`   Params: ${JSON.stringify(actionParams)}`);
        } else {
          logs.push(`   No parameters provided`);
        }
        break;
      }

      case "end":
        logs.push(`🏁 END: ${node.data.endMessage || "Workflow complete"}`);
        return { logs };

      default:
        logs.push(`❓ Unknown node type: ${kind}`);
        break;
    }

    // Move to next
    const targets = outgoing.get(current) || [];

    if (targets.length === 0) {
      logs.push("❌ ERROR: No outgoing connection — workflow breaks here.");
      break;
    }
    if (targets.length > 1) {
      logs.push("⚠ Branching detected. Following first path.");
    }

    current = targets[0];
  }

  return { logs };
}
