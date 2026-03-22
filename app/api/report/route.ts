import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  if (process.env.ENABLE_REPORT !== 'true') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { email, issue } = await req.json();
  if (!issue?.trim()) {
    return NextResponse.json({ error: 'Issue description is required' }, { status: 400 });
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Broadgame.app Report" <${process.env.SMTP_USER}>`,
    to: process.env.REPORT_EMAIL_TO || 'dungtruong.server@gmail.com',
    subject: `[Broadgame] Issue Report`,
    text: `From: ${email?.trim() || 'anonymous'}\n\n${issue.trim()}`,
    html: `<p><strong>From:</strong> ${email?.trim() || 'anonymous'}</p><p><strong>Issue:</strong></p><p>${issue.trim().replace(/\n/g, '<br>')}</p>`,
  });

  return NextResponse.json({ ok: true });
}
