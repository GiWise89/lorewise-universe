import { createHash } from "node:crypto";
import { closeSync, createReadStream, existsSync, mkdirSync, openSync, readSync, statSync, writeFileSync } from "node:fs";
import { basename, extname, resolve } from "node:path";
import { execFileSync } from "node:child_process";

function usage() {
  console.log("Uso: npm run audit:windows-installer -- <file.exe> [--version 1.0.0] [--defender]");
}

const args = process.argv.slice(2);
const installerArg = args.find((arg) => !arg.startsWith("--"));
const versionIndex = args.indexOf("--version");
const expectedVersion = versionIndex >= 0 ? args[versionIndex + 1] : "";
const runDefender = args.includes("--defender");

if (!installerArg || !existsSync(resolve(installerArg))) {
  usage();
  process.exitCode = 2;
} else {
  const installerPath = resolve(installerArg);
  const file = statSync(installerPath);
  const firstBytes = Buffer.alloc(2);
  const descriptor = openSync(installerPath, "r");
  readSync(descriptor, firstBytes, 0, 2, 0);
  closeSync(descriptor);
  const hash = createHash("sha256");
  await new Promise((resolveStream, reject) => {
    createReadStream(installerPath).on("data", (chunk) => hash.update(chunk)).on("end", resolveStream).on("error", reject);
  });

  const staticPowerShell = [
    "$item=Get-Item -LiteralPath $env:LW_INSTALLER_AUDIT_PATH",
    "$sig=Get-AuthenticodeSignature -LiteralPath $env:LW_INSTALLER_AUDIT_PATH",
    "[pscustomobject]@{FileVersion=$item.VersionInfo.FileVersion;ProductVersion=$item.VersionInfo.ProductVersion;SignatureStatus=[string]$sig.Status;Signer=$(if($sig.SignerCertificate){$sig.SignerCertificate.Subject}else{$null})}|ConvertTo-Json -Compress",
  ].join("; ");
  const env = { ...process.env, LW_INSTALLER_AUDIT_PATH: installerPath };
  const windows = JSON.parse(execFileSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", staticPowerShell], { encoding: "utf8", env }).trim());
  let defender = { status: "not_run", detections: [] };

  if (runDefender) {
    const defenderPowerShell = [
      "$ErrorActionPreference='Stop'",
      "try { Start-MpScan -ScanType CustomScan -ScanPath $env:LW_INSTALLER_AUDIT_PATH -ErrorAction Stop; $hits=@(Get-MpThreatDetection -ErrorAction SilentlyContinue|Where-Object{($_.Resources -join '\n') -like ('*'+$env:LW_INSTALLER_AUDIT_PATH+'*')}|ForEach-Object{[pscustomobject]@{ThreatID=$_.ThreatID;ThreatName=$_.ThreatName}}); [pscustomobject]@{Status=$(if($hits.Count){'failed'}else{'passed'});Detections=$hits;Error=$null}|ConvertTo-Json -Compress -Depth 4 } catch { [pscustomobject]@{Status='not_verified';Detections=@();Error=$_.Exception.Message}|ConvertTo-Json -Compress -Depth 4 }",
    ].join("; ");
    const result = JSON.parse(execFileSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", defenderPowerShell], { encoding: "utf8", env }).trim());
    defender = { status: result.Status, detections: Array.isArray(result.Detections) ? result.Detections : result.Detections ? [result.Detections] : [], error: result.Error || null };
  }

  const detectedVersion = String(windows.ProductVersion || windows.FileVersion || "").replace(/\.0$/, "");
  const report = {
    generatedAt: new Date().toISOString(),
    installer: { filename: basename(installerPath), absolutePath: installerPath, size: file.size, sha256: hash.digest("hex").toUpperCase() },
    executable: { extension: extname(installerPath).toLowerCase(), mzHeader: firstBytes[0] === 0x4d && firstBytes[1] === 0x5a, fileVersion: windows.FileVersion || null, productVersion: windows.ProductVersion || null },
    signature: { status: windows.SignatureStatus || "Unknown", signer: windows.Signer || null, distributionNoticeRequired: windows.SignatureStatus !== "Valid" },
    defender,
    checklist: {
      fileIntegrity: firstBytes[0] === 0x4d && firstBytes[1] === 0x5a ? "passed" : "failed",
      versionMatch: expectedVersion ? (detectedVersion === expectedVersion ? "passed" : "failed") : "not_requested",
      install: "pending_manual_test",
      launch: "pending_manual_test",
      desktopIdentity: "pending_manual_test",
      update: "pending_manual_test",
      uninstall: "pending_manual_test",
      privateDelivery: "pending_after_approval",
    },
  };
  const outputDirectory = resolve("outputs", "windows-installer-audit");
  mkdirSync(outputDirectory, { recursive: true });
  const outputPath = resolve(outputDirectory, `${basename(installerPath, extname(installerPath))}-audit.json`);
  writeFileSync(outputPath, JSON.stringify(report, null, 2) + "\n", "utf8");
  console.log(JSON.stringify({ outputPath, ...report }, null, 2));
  if (!report.executable.mzHeader || report.checklist.versionMatch === "failed" || (runDefender && defender.status !== "passed")) process.exitCode = 1;
}
