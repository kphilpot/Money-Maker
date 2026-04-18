// Generate HTML email receipt for audit entry

export function generateReceiptHTML(auditEntry, chainStatus) {
  const timestamp = new Date(auditEntry.created_at).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short'
  })

  const statusIcon = chainStatus === 'intact' ? '✓' : '⚠️'
  const statusColor = chainStatus === 'intact' ? '#28a745' : '#dc3545'

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { border-bottom: 2px solid #007bff; padding-bottom: 20px; margin-bottom: 20px; }
    .header h1 { color: #007bff; margin: 0; font-size: 24px; }
    .header p { color: #666; margin: 5px 0 0 0; font-size: 14px; }
    .section { margin: 20px 0; padding: 15px; background: #f8f9fa; border-left: 4px solid #007bff; }
    .label { font-weight: 600; color: #333; margin-top: 15px; }
    .value { font-family: 'Monaco', 'Courier New', monospace; background: #fff; padding: 10px; border-radius: 4px; word-break: break-all; }
    .hash-value { font-size: 12px; padding: 12px; background: #fff; border: 1px solid #ddd; border-radius: 4px; margin: 8px 0; }
    .status { padding: 10px 15px; border-radius: 4px; font-weight: 600; color: white; background: ${statusColor}; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
    .button { display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 Audit Entry Receipt</h1>
      <p>VerifyAI Professional Verification Proof</p>
    </div>

    <div class="section">
      <div style="margin-bottom: 15px;">
        <strong>Verification Timestamp</strong><br>
        ${timestamp}
      </div>
      <div>
        <strong>Entry ID</strong><br>
        <span class="value">${auditEntry.id}</span>
      </div>
    </div>

    <div class="section">
      <div class="label">Verification Details</div>
      <div style="margin: 10px 0;">
        <strong>Action:</strong> ${auditEntry.action || 'verification'}<br>
        <strong>Result:</strong> ${auditEntry.result || 'pending'}
      </div>
      ${auditEntry.screenshot_hash ? `<div style="margin: 10px 0;"><strong>Screenshot Hash:</strong><br><span class="value" style="font-size: 11px;">${auditEntry.screenshot_hash}</span></div>` : ''}
      ${auditEntry.reasoning_hash ? `<div style="margin: 10px 0;"><strong>Reasoning Hash:</strong><br><span class="value" style="font-size: 11px;">${auditEntry.reasoning_hash}</span></div>` : ''}
      ${auditEntry.rulebook_version ? `<div style="margin: 10px 0;"><strong>Rulebook Version:</strong> ${auditEntry.rulebook_version}</div>` : ''}
    </div>

    <div class="section">
      <div class="label">SHA-256 Verification Hash</div>
      <p style="font-size: 12px; color: #666; margin: 8px 0;">
        This hash uniquely identifies this audit entry and proves its authenticity.
      </p>
      <div class="hash-value">
        <strong>Hash:</strong><br>
        <code style="word-break: break-all; font-size: 11px;">${auditEntry.hash}</code>
      </div>
      ${auditEntry.previous_hash ? `<div class="hash-value">
        <strong>Previous Hash (Chain Link):</strong><br>
        <code style="word-break: break-all; font-size: 11px;">${auditEntry.previous_hash}</code>
      </div>` : '<div class="hash-value"><strong>Previous Hash:</strong> None (first entry in chain)</div>'}
    </div>

    <div class="section">
      <div class="label">Chain Integrity Status</div>
      <div class="status" style="width: fit-content;">
        ${statusIcon} Chain ${chainStatus === 'intact' ? 'Verified' : 'Verification Failed'}
      </div>
      <p style="font-size: 12px; margin-top: 10px; color: #666;">
        ${chainStatus === 'intact'
          ? 'This entry is part of an unbroken verification chain. No tampering detected.'
          : 'The audit chain has been interrupted or modified. Please review this entry.'}
      </p>
    </div>

    <div class="section">
      <div class="label">What This Means</div>
      <ul style="font-size: 13px; line-height: 1.6;">
        <li>This receipt proves a verification was performed on ${timestamp}</li>
        <li>The SHA-256 hash uniquely identifies this specific verification</li>
        <li>The chain link ensures this entry follows from the previous one</li>
        <li>Keep this receipt as proof of professional verification</li>
      </ul>
    </div>

    <div class="footer">
      <p>This is an automated email from VerifyAI Professional Verification System.</p>
      <p>If you did not initiate this verification, please contact support immediately.</p>
    </div>
  </div>
</body>
</html>
  `
}

export function generateReceiptPlainText(auditEntry, chainStatus) {
  const timestamp = new Date(auditEntry.created_at).toLocaleString()

  return `
VERIFYAI AUDIT ENTRY RECEIPT
========================================

Verification Timestamp: ${timestamp}
Entry ID: ${auditEntry.id}

VERIFICATION DETAILS
-------------------
Action: ${auditEntry.action || 'verification'}
Result: ${auditEntry.result || 'pending'}
${auditEntry.screenshot_hash ? `Screenshot Hash: ${auditEntry.screenshot_hash}` : ''}
${auditEntry.reasoning_hash ? `Reasoning Hash: ${auditEntry.reasoning_hash}` : ''}
${auditEntry.rulebook_version ? `Rulebook Version: ${auditEntry.rulebook_version}` : ''}

SHA-256 VERIFICATION HASH
------------------------
Hash: ${auditEntry.hash}
${auditEntry.previous_hash ? `Previous Hash (Chain): ${auditEntry.previous_hash}` : 'Previous Hash: None (first entry)'}

CHAIN INTEGRITY STATUS
---------------------
Chain ${chainStatus === 'intact' ? 'Verified ✓' : 'Warning ⚠️'}
${chainStatus === 'intact'
  ? 'This entry is part of an unbroken verification chain. No tampering detected.'
  : 'The audit chain has been interrupted or modified. Please review.'}

This receipt proves verification was performed on ${timestamp}.
Keep this as proof of professional verification.

========================================
VerifyAI Professional Verification System
  `
}
