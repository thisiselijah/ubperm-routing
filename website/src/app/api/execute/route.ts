import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';
import util from 'util';

const execPromise = util.promisify(exec);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { algo, nodes } = body;

    if (!algo || !nodes || !Array.isArray(nodes)) {
      return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
    }

    // Prepare comma-separated input based on the packets array
    const packets = nodes.map(n => n.packet).join(',');
    
    // Path to the executable (assuming process.cwd() is inside website folder)
    const executablePath = path.join(process.cwd(), '../src/bin/routing');
    
    // Command format: ./src/bin/routing -algo <merge/bfs> -default <comma_separated_numbers>
    const command = `"${executablePath}" -algo ${algo} -default ${packets}`;

    try {
      const { stdout } = await execPromise(command);
      
      // Parse stdout for swaps.
      // Expected output line: "Step 1: Swap index 0 and 1"
      const swapRegex = /Step \d+: Swap index (\d+) and (\d+)/g;
      const swaps = [];
      let match;

      while ((match = swapRegex.exec(stdout)) !== null) {
        swaps.push({
          node1: parseInt(match[1], 10),
          node2: parseInt(match[2], 10),
        });
      }

      return NextResponse.json({ success: true, swaps, stdout });
    } catch (execError: any) {
      // If the path is not valid or no bit-level routing path found, execPromise may reject with non-zero exit code.
      console.error('Execution error:', execError);
      return NextResponse.json({ 
        success: false, 
        error: execError.message || 'Execution failed',
        stdout: execError.stdout,
        stderr: execError.stderr
      }, { status: 500 });
    }

  } catch (e) {
    return NextResponse.json({ success: false, error: 'Failed to parse JSON' }, { status: 400 });
  }
}
