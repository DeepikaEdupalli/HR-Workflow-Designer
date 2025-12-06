import React from "react";
import { Handle, Position } from "reactflow";

export default function nodeCard(bg: string) {
  function NodeCard({ data }: any) {
    return (
      <div
        className={`px-4 py-2 rounded-xl shadow border text-md font-bold w-auto min-w-[100px] max-w-[200px] h-[40px] flex items-center justify-center text-center whitespace-normal ${bg}`}
        >
        <div>{data.title}</div>
         {/* LEFT (Incoming) */}
        <Handle
          type="target"
          position={Position.Left}
          style={{ background: "#fff", width: 5, height: 5 }}
          isConnectable={data?.canReceive !== false}
        />

        {/* RIGHT (Outgoing) */}
        <Handle
          type="source"
          position={Position.Right}
          style={{ background: "#fff", width: 5, height: 5 }}
          isConnectable={data?.canSend !== false}
        />
      </div>
    );
  };
  return React.memo(NodeCard);
}
