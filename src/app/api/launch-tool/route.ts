import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { spawn, ChildProcess } from 'child_process'
import { runningProcesses } from '@/lib/process-manager'

export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const { tool_id, suppress_open } = await request.json() as { tool_id: string, suppress_open: boolean }
  if (!tool_id) {
    return new NextResponse('Missing tool_id', { status: 400 })
  }

  const { data: tool, error } = await supabase
    .from('tools')
    .select('*')
    .eq('id', tool_id)
    .single()

  if (error || !tool) {
    return new NextResponse('Tool not found', { status: 404 })
  }

  const launchUrl = (tool.launch_url && String(tool.launch_url).trim()) || (tool.port ? `http://localhost:${tool.port}` : '')

  // command が未入力なら、port/launch_url を用いてブラウザで開く or 抑止
  if (!tool.command || tool.command.trim() === '') {
    if (!launchUrl) {
      return new NextResponse('Missing command and url/port', { status: 400 })
    }
    try {
      if (suppress_open) {
        return NextResponse.json({
          success: true,
          message: 'Open suppressed (no command).',
          url: launchUrl,
          port: tool.port ?? null,
          suppressed: true,
        })
      }
      const subprocess = spawn('cmd', ['/c', 'start', '', launchUrl], {
        detached: true,
        stdio: 'ignore'
      })
      subprocess.unref()
      console.log(`Opened browser: ${launchUrl} (PID: ${subprocess.pid})`)
      return NextResponse.json({
        success: true,
        message: `Opened ${launchUrl}`,
        url: launchUrl,
        port: tool.port ?? null,
        suppressed: false,
      })
    } catch (err) {
      console.error('Failed to open browser:', err)
      return new NextResponse(`Failed to open: ${err instanceof Error ? err.message : String(err)}`, { status: 500 })
    }
  }

  try {
    // Windowsで新しいコマンドウィンドウを開くための設定
    const isWindows = process.platform === 'win32'
    let proc: ChildProcess
    
    if (isWindows) {
      // Windowsでは新しいcmdウィンドウでコマンドを実行
      proc = spawn('cmd', ['/c', 'start', 'cmd', '/k', tool.command], {
        detached: true,
        stdio: 'ignore'
      })
    } else {
      // その他のOSでは通常の実行
      proc = spawn(tool.command, {
        shell: true,
        detached: true,
        stdio: 'ignore'
      })
    }
    
    proc.on('error', (e) => console.error('Failed to spawn:', e))
    proc.unref()

    if (proc.pid) {
      console.log(`Launched: ${tool.command} (PID: ${proc.pid})`)
      runningProcesses.set(proc.pid, {
        toolId: tool.id,
        toolName: tool.name,
        pid: proc.pid,
        port: tool.port ?? null,
        startTime: new Date().toISOString(),
      })
    } else {
      console.log(`Launched: ${tool.command} (PID not available)`)
    }

    // port が設定されていれば、起動完了（HTTP応答）を待ってからブラウザを開く（suppress_open=false のときのみ）
    if (!suppress_open && tool.port && Number.isInteger(tool.port) && tool.port > 0 && tool.port <= 65535) {
      const psScript = `
        $port = ${tool.port};
        $url = "http://localhost:$port";
        $opened = $false;
        for ($i = 0; $i -lt 180; $i++) {
          try {
            Invoke-WebRequest $url -UseBasicParsing -TimeoutSec 1 | Out-Null
            Start-Process $url
            $opened = $true
            break
          } catch {}
          Start-Sleep -Milliseconds 500
        }
        # フォールバック: 起動検知に失敗しても一度だけブラウザを開く
        if (-not $opened) {
          try {
            Start-Process $url
          } catch {}
        }
      `
      const waiter = spawn('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', psScript], {
        detached: true,
        stdio: 'ignore'
      })
      waiter.unref()
      console.log(`Started readiness waiter for http://localhost:${tool.port} (PID: ${waiter.pid})`)
    }

    return NextResponse.json({
      success: true,
      message: `Successfully launched: ${tool.name}`,
      command: tool.command,
      tool_name: tool.name,
      pid: proc.pid,
      port: tool.port ?? null,
      suppressed: Boolean(suppress_open),
      url: launchUrl || null,
    })

  } catch (err) {
    console.error('Failed to launch:', err)
    return new NextResponse(`Failed to start tool: ${err instanceof Error ? err.message : String(err)}`, { status: 500 })
  }
}
