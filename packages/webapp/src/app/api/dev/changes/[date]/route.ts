import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ date: string }> }
) {
  const { date } = await params

  // Validate date format (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Invalid date format. Use YYYY-MM-DD.' }, { status: 400 })
  }

  const filePath = path.join(process.cwd(), 'docs/plan/changes', `${date}.json`)

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'Change set not found' }, { status: 404 })
  }

  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Failed to parse change set' }, { status: 500 })
  }
}
