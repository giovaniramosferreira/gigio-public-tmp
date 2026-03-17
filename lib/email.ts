import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendOtpEmail(email: string, code: string) {
  const { error } = await resend.emails.send({
    from: 'ViralPost <noreply@viralpost.app>',
    to: email,
    subject: `${code} é seu código de acesso — ViralPost`,
    html: otpEmailHtml(code),
  })
  if (error) throw new Error(error.message)
}

function otpEmailHtml(code: string) {
  const digits = code.split('')
  const digitBoxes = digits
    .map(
      (d) => `
      <td style="
        width:48px; height:56px;
        background:#1a1a1a;
        border:2px solid #FFD000;
        border-radius:10px;
        text-align:center;
        vertical-align:middle;
        font-size:28px;
        font-weight:900;
        color:#FFD000;
        font-family:'Courier New', monospace;
        letter-spacing:0;
        padding:0 4px;
      ">${d}</td>
      <td style="width:8px;"></td>`
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Seu código ViralPost</title>
</head>
<body style="margin:0;padding:0;background:#0d0d0d;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0d;min-height:100vh;">
    <tr>
      <td align="center" style="padding:48px 16px;">
        <table width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:40px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="
                    background:#FFD000;
                    border-radius:12px;
                    width:44px; height:44px;
                    text-align:center;
                    vertical-align:middle;
                    font-weight:900;
                    font-size:20px;
                    color:#000;
                    padding:0 14px;
                  ">V</td>
                  <td style="width:12px;"></td>
                  <td style="
                    font-size:24px;
                    font-weight:800;
                    color:#ffffff;
                    vertical-align:middle;
                    letter-spacing:-0.5px;
                  ">Viral<span style="color:#FFD000;">Post</span></td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="
              background:#161616;
              border-radius:20px;
              border:1px solid #2a2a2a;
              padding:40px 36px;
            ">
              <table width="100%" cellpadding="0" cellspacing="0">

                <!-- Header -->
                <tr>
                  <td style="padding-bottom:8px;">
                    <p style="margin:0;font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.3px;">
                      Seu código de acesso
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:36px;">
                    <p style="margin:0;font-size:14px;color:#888888;line-height:1.5;">
                      Use o código abaixo para entrar na sua conta ViralPost.<br>
                      Válido por <strong style="color:#aaaaaa;">10 minutos</strong>.
                    </p>
                  </td>
                </tr>

                <!-- OTP Digits -->
                <tr>
                  <td align="center" style="padding-bottom:36px;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>${digitBoxes}</tr>
                    </table>
                  </td>
                </tr>

                <!-- Divider -->
                <tr>
                  <td style="border-top:1px solid #2a2a2a;padding-bottom:24px;"></td>
                </tr>

                <!-- Warning -->
                <tr>
                  <td style="
                    background:#1a1500;
                    border:1px solid #3a2e00;
                    border-radius:10px;
                    padding:14px 16px;
                  ">
                    <p style="margin:0;font-size:12px;color:#888;line-height:1.6;">
                      🔒 <strong style="color:#aaa;">Não compartilhe este código.</strong>
                      Se você não solicitou o acesso, pode ignorar este e-mail com segurança.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:28px;">
              <p style="margin:0;font-size:11px;color:#444444;line-height:1.6;">
                Pipeline YouTube → Carrossel Instagram com IA<br>
                © 2026 ViralPost. Todos os direitos reservados.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
