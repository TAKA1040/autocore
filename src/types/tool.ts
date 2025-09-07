export interface Tool {
  id: string
  name: string
  port: number | null
  launch_url?: string
  command?: string
  description?: string
  enabled?: boolean
  created_at?: string
  updated_at?: string
}