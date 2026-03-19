import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { token } = await request.json()

  if (!token) {
    return NextResponse.json({ success: false, error: 'Token eksik' }, { status: 400 })
  }

  const secretKey = process.env.RECAPTCHA_SECRET_KEY
  const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `secret=${secretKey}&response=${token}`,
  })

  const data = await response.json()

  if (!data.success || data.score < 0.5) {
    return NextResponse.json({ success: false, error: 'Bot aktivitesi tespit edildi' }, { status: 403 })
  }

  return NextResponse.json({ success: true, score: data.score })
}
