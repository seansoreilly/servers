import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { spawn } from "child_process";
import { Readable, Writable } from "stream";

async function main() {
  // Start the server process
  const serverProcess = spawn("node", ["--loader", "ts-node/esm", "index.ts"], {
    stdio: ["pipe", "pipe", "pipe"],
  });

  // Create client
  const client = new Client(
    {
      name: "abs-test",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Create transport
  const transport = {
    async start() {
      // No-op for stdio transport
    },
    async *receive() {
      for await (const chunk of serverProcess.stdout as Readable) {
        yield chunk.toString();
      }
    },
    async send(message: any) {
      (serverProcess.stdin as Writable).write(JSON.stringify(message) + "\n");
    },
    async close() {
      serverProcess.kill();
    },
  };

  try {
    // Connect to the server
    await client.connect(transport);

    // List available tools
    const tools = await client.listTools();
    console.log("Available tools:", tools);

    // Test get_structure_list
    const structureList = await client.callTool({
      name: "get_structure_list",
      arguments: {
        structureType: "datastructure",
        agencyId: "ABS"
      }
    });
    console.log("Structure list result:", structureList);

    // Test get_data
    const data = await client.callTool({
      name: "get_data",
      arguments: {
        dataflowIdentifier: "ABS_CENSUS2021_T01",
        dataKey: "all",
        format: "json"
      }
    });
    console.log("Data result:", data);

  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    // Clean up
    await transport.close();
  }
}

main().catch(console.error);
