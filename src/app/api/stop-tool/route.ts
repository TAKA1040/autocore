// /api/stop-tool/route.ts

import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { runningProcesses } from '@/lib/process-manager';

export async function POST(request: Request) {
  const { pid } = await request.json() as { pid: number };

  if (!pid) {
    return new NextResponse('Missing PID', { status: 400 });
  }

  // Windowsで特定のプロセスをPIDで強制終了するコマンド
  const command = `taskkill /F /PID ${pid}`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Failed to kill process ${pid}:`, stderr);
      // エラーでも台帳からは削除を試みる
    }
    // 成功・失敗に関わらず、台帳から削除
    runningProcesses.delete(pid);
    console.log(`Process ${pid} terminated and removed from store.`);
  });

  return NextResponse.json({ success: true, message: `Termination signal sent to PID: ${pid}` });
}
