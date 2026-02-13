const fs = require("fs");
const path = require("path");

const chunksDir = path.join(__dirname, "..", "node_modules", "vite", "dist", "node", "chunks");

function patchChunkFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return false;
  }

  const original = fs.readFileSync(filePath, "utf8");
  if (original.includes("VITE_WINDOWS_EPERM_PATCH_APPLIED")) {
    return true;
  }

  const target =
    '  exec("net use", (error, stdout) => {\n' +
    "    if (error) return;\n" +
    '    const lines = stdout.split("\\n");\n' +
    "    for (const line of lines) {\n" +
    "      const m = parseNetUseRE.exec(line);\n" +
    "      if (m) windowsNetworkMap.set(m[2], m[1]);\n" +
    "    }\n" +
    "    if (windowsNetworkMap.size === 0) {\n" +
    "      safeRealpathSync = fs__default.realpathSync.native;\n" +
    "    } else {\n" +
    "      safeRealpathSync = windowsMappedRealpathSync;\n" +
    "    }\n" +
    "  });";

  const replacement =
    "  // VITE_WINDOWS_EPERM_PATCH_APPLIED\n" +
    "  try {\n" +
    '    exec("net use", (error, stdout) => {\n' +
    "      if (error) return;\n" +
    '      const lines = stdout.split("\\n");\n' +
    "      for (const line of lines) {\n" +
    "        const m = parseNetUseRE.exec(line);\n" +
    "        if (m) windowsNetworkMap.set(m[2], m[1]);\n" +
    "      }\n" +
    "      if (windowsNetworkMap.size === 0) {\n" +
    "        safeRealpathSync = fs__default.realpathSync.native;\n" +
    "      } else {\n" +
    "        safeRealpathSync = windowsMappedRealpathSync;\n" +
    "      }\n" +
    "    });\n" +
    "  } catch (error) {\n" +
    "    safeRealpathSync = fs__default.realpathSync.native;\n" +
    "  }";

  if (!original.includes(target)) {
    return false;
  }

  const updated = original.replace(target, replacement);
  if (updated === original) {
    return false;
  }

  fs.writeFileSync(filePath, updated, "utf8");
  return true;
}

function main() {
  if (!fs.existsSync(chunksDir)) {
    return;
  }

  const files = fs.readdirSync(chunksDir).filter((file) => file.startsWith("dep-") && file.endsWith(".js"));
  for (const file of files) {
    const fullPath = path.join(chunksDir, file);
    const ok = patchChunkFile(fullPath);
    if (ok) {
      return;
    }
  }
}

main();
