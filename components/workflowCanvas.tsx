"use client";
import React, {
  useCallback,
  useMemo,
  useState,
  useRef,
  useEffect,
} from "react";
import ReactFlow, {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  Controls,
  MiniMap,
  Node,
  NodeChange,
  Edge,
  Connection,
  EdgeChange,
  OnConnect,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";
import { createNode } from "@/lib/utility";
import { simulateWorkflow, getAutomations } from "@/lib/mockapi";
import {
  NodeKind,
  WorkflowNode,
  WorkflowNodeData,
  StartNodeData,
  TaskNodeData,
  ApprovalNodeData,
  EndNodeData,
  AutomatedNodeData,
} from "@/lib/types";
import nodeCard from "./taskNode";

export default function WorkflowCanvas() {
  const [nodes, setNodes] = useState<WorkflowNode[]>([
    createNode("start"),
    createNode("end"),
  ]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selected, setSelected] = useState<WorkflowNode | null>(null);
  const [automations, setAutomations] = useState<
    { id: string; label: string; params: string[] }[]
  >([]);
  const [logs, setLogs] = useState<string[]>([]);
  const reactFlowWrapper = useRef(null);
  const { screenToFlowPosition } = useReactFlow();

  const onDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault();

    const type = event.dataTransfer.getData(
      "application/reactflow"
    ) as NodeKind;
    if (!type) return;

    const position = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    // use your existing createNode function
    const newNode = createNode(type);
    newNode.position = position;

    setNodes((nds) => nds.concat(newNode));
  };

  React.useEffect(() => {
    getAutomations().then(setAutomations);
  }, []);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) =>
      setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) =>
      setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect: OnConnect = useCallback(
    (connection) => {
      const sourceNode = nodes.find((n) => n.id === connection.source);
      const targetNode = nodes.find((n) => n.id === connection.target);

      // Prevent incoming to start node
      if (targetNode?.data?.kind === "start") return;

      // Prevent outgoing from end node
      if (sourceNode?.data?.kind === "end") return;

      setEdges((eds) => addEdge({ ...connection, animated: true }, eds));
    },
    [nodes]
  );

  const addNewNode = (kind: NodeKind) => {
    setNodes((n) => [...n, createNode(kind)]);
  };

  const updateNode = (updated: WorkflowNode) => {
    setNodes((nds) => nds.map((n) => (n.id === updated.id ? updated : n)));
    setSelected(updated);
  };

  const onElementClick = useCallback(
    (_: any, el: any) => {
      // el may be node or edge
      if (el?.id) {
        const node = nodes.find((n) => n.id === el.id) || null;
        setSelected(node);
      }
    },
    [nodes]
  );

  const removeSelected = () => {
    if (!selected) return;
    setNodes((nds) => nds.filter((n) => n.id !== selected.id));
    setEdges((eds) =>
      eds.filter((e) => e.source !== selected.id && e.target !== selected.id)
    );
    setSelected(null);
  };

  const runSimulation = async () => {
    console.log("running sim");
    const res = await simulateWorkflow(nodes, edges);
    console.log("running sim", res);
    setLogs(res.logs);
  };

  const exportJSON = () => {
    const payload = { nodes, edges };
    const str = JSON.stringify(payload, null, 2);
    const blob = new Blob([str], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "workflow.json";
    a.click();
  };

  const importJSON = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (parsed?.nodes && parsed?.edges) {
          setNodes(parsed.nodes);
          setEdges(parsed.edges);
        } else {
          alert("Invalid workflow JSON");
        }
      } catch (err) {
        alert("Error parsing JSON");
      }
    };
    reader.readAsText(file);
  };

  const nodeTypes = useMemo(
    () => ({
      start: nodeCard("bg-emerald-300 border-emerald-300"),
      task: nodeCard("bg-emerald-300 border-emerald-300"),
      approval: nodeCard("bg-emerald-300 border-emerald-300"),
      automated: nodeCard("bg-emerald-300 border-emerald-300"),
      end: nodeCard("bg-emerald-300 border-emerald-300"),
    }),
    []
  );

  useEffect(() => {
    if (!selected) return;

    const updated = nodes.find((n) => n.id === selected.id);
    if (updated && updated !== selected) {
      setSelected(updated);
    }
  }, [nodes]);

  function NodeFormPanel({ node, automations, setNodes }: any) {
    if (!node) return <div className="p-4">Select a node to edit</div>;

    const kind = node.data.kind;

    // Local state to edit without updating React Flow nodes immediately
    const [localData, setLocalData] = useState(node.data);

    // Sync when selected node changes
    useEffect(() => {
      if (!node) return;
      setLocalData(structuredClone(node.data));
    }, [node?.id]);

    // Helper to update nested paths in localData
    const updateLocalField = (path: string, value: any) => {
      setLocalData((prev: any) => {
        const updated = structuredClone(prev);
        const keys = path.split(".");
        let curr = updated;
        for (let i = 0; i < keys.length - 1; i++) {
          if (!curr[keys[i]]) curr[keys[i]] = {};
          curr = curr[keys[i]];
        }
        curr[keys[keys.length - 1]] = value;
        return updated;
      });
    };

    // Save changes to React Flow nodes
    const saveNode = () => {
      setNodes((nodes: WorkflowNode[]) =>
        nodes.map((n) =>
          n.id === node.id ? { ...n, data: structuredClone(localData) } : n
        )
      );
    };

    return (
      <div className="p-4 space-y-3">
        <h3 className="text-lg font-semibold">
          Edit: {localData.title || node.id} ({kind})
        </h3>

        {/* ================== START NODE ================== */}
        {kind === "start" && (
          <>
            <label>Title</label>
            <input
              className="w-full p-2 border"
              value={localData.title ?? ""}
              onChange={(e) => updateLocalField("title", e.target.value)}
            />

            <label className="mt-2 block">Metadata (k=v)</label>
            <input
              className="w-full p-2 border"
              value={Object.entries((localData as StartNodeData).metadata || {})
                .map(([k, v]) => `${k}=${v}`)
                .join(",")}
              onChange={(e) => {
                const obj: Record<string, string> = {};
                e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .forEach((kv) => {
                    const [k, v] = kv.split("=");
                    if (k) obj[k.trim()] = (v || "").trim();
                  });
                updateLocalField("metadata", obj);
              }}
            />
          </>
        )}

        {/* ================== TASK NODE ================== */}
        {kind === "task" && (
          <>
            <label>Title *</label>
            <input
              className="w-full p-2 border"
              value={localData.title ?? ""}
              onChange={(e) => updateLocalField("title", e.target.value)}
            />

            <label className="mt-2 block">Description</label>
            <textarea
              className="w-full p-2 border"
              value={(localData as TaskNodeData).description ?? ""}
              onChange={(e) => updateLocalField("description", e.target.value)}
            />

            <label className="mt-2 block">Assignee</label>
            <input
              className="w-full p-2 border"
              value={(localData as TaskNodeData).assignee ?? ""}
              onChange={(e) => updateLocalField("assignee", e.target.value)}
            />

            <label className="mt-2 block">Due Date</label>
            <input
              className="w-full p-2 border"
              value={(localData as TaskNodeData).dueDate ?? ""}
              onChange={(e) => updateLocalField("dueDate", e.target.value)}
            />

            <label className="mt-2 block">Custom Fields (k=v)</label>
            <input
              className="w-full p-2 border"
              value={Object.entries((localData as TaskNodeData).custom || {})
                .map(([k, v]) => `${k}=${v}`)
                .join(",")}
              onChange={(e) => {
                const obj: Record<string, string> = {};
                e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .forEach((kv) => {
                    const [k, v] = kv.split("=");
                    if (k) obj[k.trim()] = (v || "").trim();
                  });
                updateLocalField("custom", obj);
              }}
            />
          </>
        )}

        {/* ================== APPROVAL NODE ================== */}
        {kind === "approval" && (
          <>
            <label>Title</label>
            <input
              className="w-full p-2 border"
              value={localData.title ?? ""}
              onChange={(e) => updateLocalField("title", e.target.value)}
            />

            <label className="mt-2 block">Approver Role</label>
            <input
              className="w-full p-2 border"
              value={(localData as ApprovalNodeData).approverRole ?? ""}
              onChange={(e) => updateLocalField("approverRole", e.target.value)}
            />

            <label className="mt-2 block">Auto-approve Threshold</label>
            <input
              type="number"
              className="w-full p-2 border"
              value={(localData as ApprovalNodeData).autoApproveThreshold ?? 0}
              onChange={(e) =>
                updateLocalField("autoApproveThreshold", Number(e.target.value))
              }
            />
          </>
        )}

        {/* ================== AUTOMATED NODE ================== */}
        {kind === "automated" && (
          <>
            <label>Title</label>
            <input
              className="w-full p-2 border"
              value={localData.title ?? ""}
              onChange={(e) => updateLocalField("title", e.target.value)}
            />

            <label className="mt-2 block">Action</label>
            <select
              className="w-full p-2 border"
              value={(localData as AutomatedNodeData).actionId ?? ""}
              onChange={(e) => updateLocalField("actionId", e.target.value)}
            >
              <option value="">-- Select --</option>
              {automations.map((a: any) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </select>

            {(localData as AutomatedNodeData).actionId && (
              <div className="mt-2 space-y-2">
                <h4 className="text-sm font-medium">Action Parameters</h4>

                {automations
                  .find(
                    (a: any) =>
                      a.id === (localData as AutomatedNodeData).actionId
                  )
                  ?.params.map((p: any) => (
                    <div key={p}>
                      <label>{p}</label>
                      <input
                        className="w-full p-2 border"
                        value={
                          (localData as AutomatedNodeData).actionParams?.[p] ??
                          ""
                        }
                        onChange={(e) =>
                          updateLocalField(`actionParams.${p}`, e.target.value)
                        }
                      />
                    </div>
                  ))}
              </div>
            )}
          </>
        )}

        {/* ================== END NODE ================== */}
        {kind === "end" && (
          <>
            <label>End Message</label>
            <input
              className="w-full p-2 border"
              value={localData.title ?? ""}
              onChange={(e) => updateLocalField("title", e.target.value)}
            />

            <label className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                checked={(localData as EndNodeData).summary ?? false}
                onChange={(e) => updateLocalField("summary", e.target.checked)}
              />
              <span>Include summary</span>
            </label>
          </>
        )}

        {/* ================== SAVE BUTTON ================== */}
        <button
          className="mt-3 p-2 bg-blue-500 text-white rounded"
          onClick={saveNode}
        >
          Save
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <div className="w-64 border-r p-3 flex flex-col gap-3 bg-gray-700">
        <button
          onClick={() => document.getElementById("jsonFileInput")!.click()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Browse JSON File
        </button>

        <input
          id="jsonFileInput"
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => importJSON(e.target.files?.[0] ?? null)}
        />
        <p className="text-sm text-white">
          Drag nodes into the canvas area or click to add.
        </p>

        <div className="space-y-2">
          <button
            draggable
            onDragStart={(e) =>
              e.dataTransfer.setData("application/reactflow", "start")
            }
            onClick={() => addNewNode("start")}
            className="w-full p-2 bg-gray-800 rounded text-emerald-400 font-bold"
          >
            + Start
          </button>
          <button
            draggable
            onDragStart={(e) =>
              e.dataTransfer.setData("application/reactflow", "task")
            }
            onClick={() => addNewNode("task")}
            className="w-full p-2 bg-gray-800 rounded text-emerald-400 font-bold"
          >
            + Task
          </button>
          <button
            draggable
            onDragStart={(e) =>
              e.dataTransfer.setData("application/reactflow", "approval")
            }
            onClick={() => addNewNode("approval")}
            className="w-full p-2 bg-gray-800 rounded text-emerald-400 font-bold"
          >
            + Approval
          </button>
          <button
            draggable
            onDragStart={(e) =>
              e.dataTransfer.setData("application/reactflow", "automated")
            }
            onClick={() => addNewNode("automated")}
            className="w-full p-2 bg-gray-800 rounded text-emerald-400 font-bold"
          >
            + Automated
          </button>
          <button
            draggable
            onDragStart={(e) =>
              e.dataTransfer.setData("application/reactflow", "end")
            }
            onClick={() => addNewNode("end")}
            className="w-full p-2 bg-gray-800 rounded text-emerald-400 font-bold"
          >
            + End
          </button>
        </div>

        <div className="mt-4 space-y-2">
          <button
            onClick={exportJSON}
            className="w-full p-2 bg-blue-500 text-white rounded"
          >
            Export JSON
          </button>

          <button
            onClick={runSimulation}
            className="w-full p-2 bg-green-500 text-white rounded"
          >
            Run Simulation
          </button>
          <button
            onClick={removeSelected}
            className="w-full p-2 bg-red-500 text-white rounded"
          >
            Delete Selected
          </button>
        </div>

        <div className="mt-auto text-xs text-gray-500">
          Tip: Select a node to edit configuration on the right.
        </div>
      </div>

      {/* Canvas area */}
      <div className="flex-1 relative bg-gray-800" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onElementClick}
          onPaneClick={() => setSelected(null)}
          nodeTypes={nodeTypes}
          onDrop={onDrop}
          onDragOver={onDragOver}
          fitView
          style={{ width: "100%", height: "100%" }}
        >
          <Background
            color="white" // dot color
            gap={20} // space between dots
            size={1.5} // dot size
          />
          <Controls />
          <MiniMap
            nodeColor={(node) => "#29bd3fff"}
            nodeStrokeWidth={2}
            zoomable
            pannable
            maskColor="rgba(240,240,240,0.6)"
          />
        </ReactFlow>
      </div>

      {/* Right panel: node editor + logs */}
      <div className="w-96 border-l p-3 flex flex-col rounded-xl bg-gray-600 text-white">
        <div className="flex-1 overflow-auto">
          <NodeFormPanel
            node={selected}
            setNodes={setNodes}
            automations={automations}
          />
        </div>

        <div className="mt-2 bg-gray-700">
          <h4 className="font-semibold">Simulation Log</h4>
          <div className="h-48 overflow-auto p-2 bg-gray-50 border mt-1 text-sm bg-gray-800">
            {logs.length === 0 ? (
              <div className="text-gray-400">No runs yet</div>
            ) : (
              logs.map((l, i) => (
                <div
                  key={i}
                  className={l.startsWith("ERROR") ? "text-red-600" : ""}
                >
                  {l}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
