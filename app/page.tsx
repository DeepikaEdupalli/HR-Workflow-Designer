"use client";
import {
  ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";
import WorkflowCanvas from "@/components/workflowCanvas";

export default function App() {

  return (
    <div
      className="h-screen bg-gray-800"
      style={{ fontFamily: "Inter, ui-sans-serif, system-ui" }}
    >
      <h2 className="text-xl font-bold bg-gray-800 h-12 p-2 text-white">
        HR Workflow Designer
      </h2>
        {/* Canvas area */}
        <ReactFlowProvider>
        <WorkflowCanvas/>
        </ReactFlowProvider>
    </div>
  );
}