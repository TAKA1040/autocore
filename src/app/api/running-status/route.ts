// /api/running-status/route.ts

import { NextResponse } from 'next/server';
import { runningProcesses } from '@/lib/process-manager';

export async function GET() {
  // MapをJSONで返せる配列形式に変換
  const processes = Array.from(runningProcesses.values());
  return NextResponse.json(processes);
}
