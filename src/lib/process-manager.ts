// src/lib/process-manager.ts

import { exec } from 'child_process';

// 起動中プロセスの情報を示す型
export interface RunningProcess {
  toolId: string;
  toolName: string;
  pid: number;
  port: number | null;
  startTime: string;
}

// 起動中プロセスをPIDをキーにして保存するMap
// ※サーバーが再起動するとリセットされますが、個人用途なら十分です。
export const runningProcesses = new Map<number, RunningProcess>();

// --- ▼▼▼ 終了時クリーンアップ処理を追加 ▼▼▼ ---

const cleanupProcesses = () => {
  const pids = Array.from(runningProcesses.keys());
  if (pids.length === 0) {
    console.log('No running processes to clean up.');
    return;
  }

  console.log(`Cleaning up ${pids.length} running processes...`);
  pids.forEach(pid => {
    try {
      // Windowsで特定のプロセスをPIDで強制終了するコマンド
      const command = `taskkill /F /PID ${pid}`;
      exec(command, (error) => {
        if (error) {
          // すでにプロセスが存在しない場合などのエラーは無視して良い
          // console.error(`Failed to kill process ${pid}:`, stderr);
        }
      });
    } catch (e) {
      console.error(`Error while trying to kill process ${pid}:`, e);
    }
  });
  runningProcesses.clear();
  console.log('Cleanup complete.');
};

// アプリケーションが終了するシグナルを捕捉する
// (Ctrl+C など)
process.on('SIGINT', () => {
  console.log('\nSIGINT signal received. Running cleanup...');
  cleanupProcesses();
  process.exit(0);
});

// その他の終了シグナルにも対応（より堅牢にする場合）
process.on('SIGTERM', () => {
  console.log('\nSIGTERM signal received. Running cleanup...');
  cleanupProcesses();
  process.exit(0);
});