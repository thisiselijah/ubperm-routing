import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

let state = {
  dimension: 3,
  nodes: Array.from({ length: 8 }, (_, i) => ({ id: i, packet: i }))
};

export async function GET() {
  return NextResponse.json(state);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Handle adjacent swap action
    if (body.action === 'swap') {
      const { node1, node2 } = body;
      
      if (typeof node1 !== 'number' || typeof node2 !== 'number') {
        return NextResponse.json({ success: false, error: 'Invalid nodes for swap' }, { status: 400 });
      }

      // Check if nodes are adjacent (must differ by exactly one bit)
      const xor = node1 ^ node2;
      const isAdjacent = xor > 0 && (xor & (xor - 1)) === 0;
      
      if (!isAdjacent) {
        return NextResponse.json({ success: false, error: 'Nodes are not adjacent. Swapping between any node is not allowed.' }, { status: 403 });
      }

      const n1 = state.nodes.find(n => n.id === node1);
      const n2 = state.nodes.find(n => n.id === node2);

      if (!n1 || !n2) {
         return NextResponse.json({ success: false, error: 'Node not found' }, { status: 404 });
      }

      // Perform swap
      const temp = n1.packet;
      n1.packet = n2.packet;
      n2.packet = temp;

      return NextResponse.json({ success: true, state });
    }

    // Full state override
    if (body.dimension && body.nodes) {
      state = body;
      return NextResponse.json({ success: true, state });
    }
    
    return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Failed to parse JSON' }, { status: 400 });
  }
}
