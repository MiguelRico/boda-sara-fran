/* eslint-disable */
function escapeEmailHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function emailValue(value, fallback) {
  const text = String(value || "").trim();

  return escapeEmailHtml(text || fallback);
}

function emailShell(content, options) {
  const copy = EMAIL_COPY;
  const preheader = options.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeEmailHtml(options.preheader)}</div>`
    : "";

  return `
    <div style="margin:0;padding:0;background:${COLOR_BG};font-family:Montserrat,Arial,sans-serif;color:${COLOR_TEXT};">
      ${preheader}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:${COLOR_BG};">
        <tr>
          <td style="padding:28px 14px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;margin:0 auto;border-collapse:collapse;">
              <tr>
                <td style="padding:0;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:rgba(255,255,255,0.78);border:1px solid ${COLOR_BORDER};border-radius:32px;overflow:hidden;box-shadow:0 24px 70px rgba(52,69,49,0.08);">
                    <tr>
                      <td style="padding:34px 26px 30px;text-align:center;background:${COLOR_BG_SOFT};border-bottom:1px solid ${COLOR_BORDER};">
                        <div style="font-size:11px;line-height:1.4;letter-spacing:3.4px;text-transform:uppercase;color:${COLOR_ACCENT};margin-bottom:14px;">${escapeEmailHtml(options.eyebrow)}</div>
                        <h1 style="margin:0;font-family:Georgia,serif;font-size:42px;line-height:0.98;letter-spacing:1px;color:${COLOR_TEXT};font-weight:400;">${escapeEmailHtml(options.title)}</h1>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:30px 24px 28px;">
                        ${content}
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:17px 24px;text-align:center;background:${COLOR_BG_WARM};border-top:1px solid ${COLOR_BORDER};color:${COLOR_MUTED};font-size:12px;line-height:1.6;">
                        ${escapeEmailHtml(copy.footer)}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `;
}

function sendConfirmationEmail(email, confirmationName, guests, confirmationId) {
  const copy = EMAIL_COPY.confirmation;
  const appUrl = `${RSVP_URL}/edit?confirmationId=${encodeURIComponent(
    String(confirmationId || "").trim(),
  )}`;
  const guestsHtml = guests
    .map((guest) => {
      const guestName = [guest.name, guest.lastname].filter(Boolean).join(" ");

      return `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid ${COLOR_BORDER};">
            <span style="display:inline-block;width:9px;height:9px;border-radius:999px;background:${COLOR_ACCENT};margin-right:10px;vertical-align:middle;"></span>
            <strong style="font-size:15px;line-height:1.7;color:${COLOR_TEXT};font-weight:500;">${escapeEmailHtml(guestName)}</strong>
          </td>
        </tr>
      `;
    })
    .join("");

  const html = emailShell(
    `
      <p style="margin:0 0 22px;font-size:15px;line-height:1.9;color:${COLOR_MUTED};text-align:center;">${escapeEmailHtml(copy.intro)}</p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:24px 0;background:white;border:1px solid ${COLOR_BORDER};border-radius:24px;overflow:hidden;">
        <tr>
          <td style="padding:18px 20px 4px;">
            <h2 style="margin:0;font-family:Georgia,serif;font-size:28px;line-height:1.05;font-weight:400;color:${COLOR_ACCENT_DARK};">${escapeEmailHtml(copy.guestsTitle)}</h2>
          </td>
        </tr>
        <tr>
          <td style="padding:2px 20px 10px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">${guestsHtml}</table>
          </td>
        </tr>
      </table>

      <p style="margin:22px 0 0;font-size:14px;line-height:1.8;color:${COLOR_MUTED};text-align:center;">${escapeEmailHtml(copy.editText)}</p>

      <div style="text-align:center;margin:24px 0 28px;">
        <a href="${appUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:${COLOR_ACCENT_DARK};color:white;text-decoration:none;padding:15px 24px;border-radius:999px;font-size:14px;font-weight:600;letter-spacing:0.2px;box-shadow:0 18px 45px rgba(111,139,107,0.25);">${escapeEmailHtml(copy.cta)}</a>
      </div>

      <p style="margin:0;font-size:15px;line-height:1.8;color:${COLOR_TEXT};text-align:center;">${escapeEmailHtml(copy.closing)}<br/><strong style="color:${COLOR_ACCENT_DARK};font-weight:600;">${escapeEmailHtml(EMAIL_COPY.brand)}</strong></p>
    `,
    {
      eyebrow: copy.eyebrow,
      preheader: copy.preheader,
      title: copy.title,
    },
  );

  GmailApp.sendEmail(
    email,
    copy.subject,
    `${copy.plain} ${appUrl}`,
    { htmlBody: html },
  );
}

function sendAdminNotification(confirmationName, email, phone, guests) {
  const copy = EMAIL_COPY.admin;
  const fallback = EMAIL_COPY.fallback;
  const labels = copy.labels;
  const adminUrl = `${APP_BASE_URL}/admin`;
  const menuRowEnabled = isMenuModuleEnabled();
  const guestsHtml = guests
    .map((guest) => {
      const guestName = [guest.name, guest.lastname].filter(Boolean).join(" ");
      const allergies = guest.allergies?.length
        ? guest.allergies.join(", ")
        : fallback.noAllergies;

      return `
        <tr>
          <td style="padding:16px 0;border-bottom:1px solid ${COLOR_BORDER};">
            <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${COLOR_ACCENT};margin-bottom:8px;">${escapeEmailHtml(labels.name)}</div>
            <div style="font-size:18px;line-height:1.4;color:${COLOR_TEXT};font-weight:600;margin-bottom:12px;">${escapeEmailHtml(guestName)}</div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
              ${
                menuRowEnabled
                  ? `<tr>
                      <td style="padding:8px 0;color:${COLOR_ACCENT_DARK};font-size:13px;font-weight:600;width:34%;">${escapeEmailHtml(labels.menu)}</td>
                      <td style="padding:8px 0;color:${COLOR_TEXT};font-size:13px;line-height:1.6;">${emailValue(guest.menu, "-")}</td>
                    </tr>`
                  : ""
              }
              <tr>
                <td style="padding:8px 0;color:${COLOR_ACCENT_DARK};font-size:13px;font-weight:600;width:34%;">${escapeEmailHtml(labels.bus)}</td>
                <td style="padding:8px 0;color:${COLOR_TEXT};font-size:13px;line-height:1.6;">${escapeEmailHtml(labels.outbound)}: ${emailValue(guest.outboundBus, fallback.noBus)} | ${escapeEmailHtml(labels.return)}: ${emailValue(guest.returnBus, fallback.noBus)}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:${COLOR_ACCENT_DARK};font-size:13px;font-weight:600;">${escapeEmailHtml(labels.allergies)}</td>
                <td style="padding:8px 0;color:${COLOR_TEXT};font-size:13px;line-height:1.6;">${escapeEmailHtml(allergies)}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:${COLOR_ACCENT_DARK};font-size:13px;font-weight:600;">${escapeEmailHtml(labels.otherAllergies)}</td>
                <td style="padding:8px 0;color:${COLOR_TEXT};font-size:13px;line-height:1.6;">${emailValue(guest.otherAllergies, fallback.noAllergies)}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:${COLOR_ACCENT_DARK};font-size:13px;font-weight:600;">${escapeEmailHtml(labels.comments)}</td>
                <td style="padding:8px 0;color:${COLOR_TEXT};font-size:13px;line-height:1.6;">${emailValue(guest.comments, fallback.noComments)}</td>
              </tr>
            </table>
          </td>
        </tr>
      `;
    })
    .join("");

  const html = emailShell(
    `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 24px;background:white;border:1px solid ${COLOR_BORDER};border-radius:24px;overflow:hidden;">
        <tr>
          <td style="padding:18px 20px;border-bottom:1px solid ${COLOR_BORDER};">
            <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${COLOR_ACCENT};margin-bottom:6px;">${escapeEmailHtml(copy.confirmationNameLabel)}</div>
            <div style="font-size:18px;line-height:1.5;color:${COLOR_TEXT};font-weight:600;">${emailValue(confirmationName, "-")}</div>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 20px;border-bottom:1px solid ${COLOR_BORDER};color:${COLOR_TEXT};font-size:14px;line-height:1.7;">
            <strong style="color:${COLOR_ACCENT_DARK};">${escapeEmailHtml(copy.emailLabel)}:</strong> ${emailValue(email, "-")}
          </td>
        </tr>
        <tr>
          <td style="padding:16px 20px;color:${COLOR_TEXT};font-size:14px;line-height:1.7;">
            <strong style="color:${COLOR_ACCENT_DARK};">${escapeEmailHtml(copy.phoneLabel)}:</strong> ${emailValue(phone, "-")}
          </td>
        </tr>
      </table>

      <h2 style="margin:0 0 12px;font-family:Georgia,serif;font-size:30px;line-height:1.05;font-weight:400;color:${COLOR_ACCENT_DARK};">${escapeEmailHtml(copy.guestsTitle)}</h2>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 24px;background:white;border:1px solid ${COLOR_BORDER};border-radius:24px;overflow:hidden;">
        <tr>
          <td style="padding:2px 20px 10px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">${guestsHtml}</table>
          </td>
        </tr>
      </table>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:${COLOR_BG_SOFT};border:1px solid ${COLOR_BORDER_STRONG};border-radius:24px;overflow:hidden;">
        <tr>
          <td style="padding:18px 20px;text-align:center;">
            <h2 style="margin:0 0 8px;font-family:Georgia,serif;font-size:26px;line-height:1.1;font-weight:400;color:${COLOR_TEXT};">${escapeEmailHtml(copy.checkListTitle)}</h2>
            <p style="margin:0 0 16px;color:${COLOR_MUTED};font-size:13px;line-height:1.8;">${escapeEmailHtml(copy.checkListText)}</p>
            <a href="${adminUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:${COLOR_ACCENT_DARK};color:white;text-decoration:none;padding:15px 24px;border-radius:999px;font-size:14px;font-weight:600;letter-spacing:0.2px;box-shadow:0 18px 45px rgba(111,139,107,0.25);">${escapeEmailHtml(copy.checkListCta)}</a>
          </td>
        </tr>
      </table>
    `,
    {
      eyebrow: copy.eyebrow,
      title: copy.title,
    },
  );

  GmailApp.sendEmail(ADMIN_EMAIL, copy.subject, email, {
    htmlBody: html,
  });
}

