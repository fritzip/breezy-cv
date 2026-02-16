#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const ejs = require("ejs");
const crypto = require("crypto");
const readline = require("readline");

// =============================================================================
// CLI Router
// =============================================================================
const command = process.argv[2];
const STATE_FILE = path.join(process.cwd(), ".breezy-cv-state.json");

(async () => {
  try {
    switch (command) {
      case "init":
        await runInit();
        break;
      case "serve":
        await runServe();
        break;
      case "build":
        await runBuild(process.argv[3]);
        break;
      default:
        // Default to build if no command or unknown command (legacy/simple usage)
        if (!command || command.endsWith(".yaml") || command.endsWith(".yml")) {
          await runBuild(command);
        } else {
          console.error(`Unknown command: ${command}`);
          console.error("Usage: breezy-cv [init|build|serve]");
          process.exit(1);
        }
        break;
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
})();

// =============================================================================
// Commands
// =============================================================================

async function runInit() {
  console.log("🚀 Initializing new Breezy CV project...");

  const state = loadState();
  let newState = { ...state };
  let createdCount = 0;

  const filesToManage = [
    { src: "resume.yaml", dest: "resume.yaml" },
    { src: "config.yaml", dest: "config.yaml" },
    { src: "img/favicon.svg", dest: "img/favicon.svg" },
    { src: "templates/gitignore", dest: ".gitignore" },
    { src: "templates/README.md", dest: "README.md" },
    {
      src: ".github/workflows/deploy.yml",
      dest: ".github/workflows/deploy.yml",
    },
  ];

  for (const fileMap of filesToManage) {
    const srcPath = path.join(__dirname, fileMap.src);
    const destPath = path.join(process.cwd(), fileMap.dest);

    if (!fs.existsSync(srcPath)) {
      console.warn(`⚠️  Template file missing: ${fileMap.src} (skipped)`);
      continue;
    }

    // Skip if running in the source repo (only if src and dest are identical paths, which is tougher to check now with mapping)
    // We can just check if we are overwriting the source file itself
    if (path.resolve(srcPath) === path.resolve(destPath)) continue;

    const destDir = path.dirname(destPath);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    const currentSrcHash = calculateHash(srcPath);
    const userDestHash = calculateHash(destPath);
    // Use the destination filename as the key for state tracking
    const stateKey = fileMap.dest;
    const lastSrcHash = state[stateKey];

    newState[stateKey] = currentSrcHash;
    const displayName = fileMap.dest;

    // Case 1: File does not exist
    if (!fs.existsSync(destPath)) {
      fs.copyFileSync(srcPath, destPath);
      console.log(`✅ created: ${displayName}`);
      createdCount++;
      continue;
    }

    // Case 2: File exists but matches template
    if (userDestHash === currentSrcHash) {
      continue;
    }

    // Case 3: File is different. Check if template updated.
    const templateChanged = lastSrcHash !== currentSrcHash;

    if (templateChanged) {
      console.log(`\n⚠️  Update available for ${displayName}.`);
      console.log(`   (The template has changed in the new version)`);

      const answer = await askQuestion(
        `   Replace with new version? (Your current file will be backed up) [y/N]: `,
      );

      if (answer.toLowerCase() === "y" || answer.toLowerCase() === "yes") {
        const backupPath = destPath + ".bak";
        fs.copyFileSync(destPath, backupPath);
        fs.copyFileSync(srcPath, destPath);
        console.log(
          `✅ updated: ${displayName} (backup: ${path.basename(backupPath)})`,
        );
        createdCount++;
      } else {
        console.log(`⏭️  skipped: ${displayName} (kept local version)`);
      }
    } else {
      console.log(
        `⏭️  skipped: ${displayName} (local modifications, no upstream change)`,
      );
    }
  }

  saveState(newState);
  ensurePackageScripts();

  console.log(`\n🎉 Initialization/Update complete!`);
  if (createdCount > 0) {
    console.log(`\nNext steps:`);
    console.log(`1. Edit 'resume.yaml' with your details.`);
    console.log(
      `2. Run 'npm run build' then 'npm run serve' to preview your resume locally.`,
    );
    console.log(`3. Commit and push your changes.`);
    console.log(`4. Watch the Action tab for your deployment!`);
  }
}

async function runBuild(inputFileArg) {
  // Use process.cwd() to look for files in the user's current directory
  const DATA_FILE = inputFileArg
    ? path.resolve(inputFileArg)
    : path.join(process.cwd(), "resume.yaml");

  const CONFIG_FILE = path.join(process.cwd(), "config.yaml");
  const OUTPUT_DIR = path.join(process.cwd(), "public");
  const OUTPUT_HTML = path.join(OUTPUT_DIR, "index.html");
  const OUTPUT_CSS = path.join(OUTPUT_DIR, "style.css");

  // Ensure public dir exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR);
  }

  console.log(`📖 Reading resume data from ${DATA_FILE}...`);
  if (!fs.existsSync(DATA_FILE)) {
    throw new Error(`Input file not found: ${DATA_FILE}`);
  }
  const resumeData = yaml.load(fs.readFileSync(DATA_FILE, "utf8"));

  console.log("⚙️  Reading configuration...");
  let config = {
    theme: "modern",
    avatar: "",
    favicon: "",
    style: {},
    features: {},
  };
  if (fs.existsSync(CONFIG_FILE)) {
    const userConfig = yaml.load(fs.readFileSync(CONFIG_FILE, "utf8"));
    config = { ...config, ...userConfig };
  }

  // Asset Copy Helper
  const copyAsset = (assetPath, targetName) => {
    if (!assetPath || typeof assetPath !== "string") return assetPath;
    if (assetPath.match(/^https?:\/\//)) return assetPath;

    try {
      const srcPath = path.resolve(process.cwd(), assetPath);
      if (fs.existsSync(srcPath)) {
        let fileName;

        if (targetName) {
          const ext = path.extname(srcPath);
          fileName = targetName + ext;

          // Cleanup old assets
          const existingFiles = fs.readdirSync(OUTPUT_DIR);
          existingFiles.forEach((file) => {
            if (file.startsWith(targetName + ".") && file !== fileName) {
              try {
                fs.unlinkSync(path.join(OUTPUT_DIR, file));
              } catch (e) {
                // ignore
              }
            }
          });
        } else {
          fileName = path.basename(srcPath);
        }

        const destPath = path.join(OUTPUT_DIR, fileName);
        fs.copyFileSync(srcPath, destPath);
        console.log(`✅ Copied asset: ${assetPath} -> public/${fileName}`);
        return fileName;
      } else {
        console.warn(`⚠️  Asset not found: ${assetPath}`);
      }
    } catch (err) {
      console.warn(`⚠️  Failed to copy asset: ${assetPath}`, err.message);
    }
    return assetPath;
  };

  // Process assets
  if (config.favicon) {
    config.favicon = copyAsset(config.favicon, "favicon");
  }

  if (config.avatar) {
    config.avatar = copyAsset(config.avatar, "avatar");
    if (resumeData.basics && resumeData.basics.image) {
      resumeData.basics.image = copyAsset(resumeData.basics.image);
    }
  } else {
    if (resumeData.basics && resumeData.basics.image) {
      resumeData.basics.image = copyAsset(resumeData.basics.image, "avatar");
    }
  }

  // Resolve Theme
  const THEME_DIR = path.join(__dirname, "themes", config.theme);
  const TEMPLATE_FILE = path.join(THEME_DIR, "template.ejs");
  const CSS_FILE = path.join(THEME_DIR, "style.css");

  if (!fs.existsSync(THEME_DIR)) {
    throw new Error(`Theme "${config.theme}" not found in themes/`);
  }

  console.log(`🎨 Compiling template using theme: ${config.theme}...`);
  const template = fs.readFileSync(TEMPLATE_FILE, "utf8");

  const html = ejs.render(template, {
    resume: resumeData,
    config: config,
  });

  console.log("💾 Writing files to public/ ...");
  fs.writeFileSync(OUTPUT_HTML, html);

  // Copy Base CSS
  const BASE_CSS = path.join(__dirname, "themes", "base.css");
  const OUTPUT_BASE_CSS = path.join(OUTPUT_DIR, "base.css");
  if (fs.existsSync(BASE_CSS)) {
    fs.copyFileSync(BASE_CSS, OUTPUT_BASE_CSS);
  }

  // Copy Theme CSS
  if (fs.existsSync(CSS_FILE)) {
    fs.copyFileSync(CSS_FILE, OUTPUT_CSS);
  } else {
    console.warn("⚠️  No style.css found for this theme.");
  }

  console.log("✅ Build complete! Open public/index.html to view.");
}

async function runServe() {
  const { spawn } = require("child_process");

  // Iterate over possible serve locations
  const possiblePaths = [
    // 1. Local node_modules (if running inside the repo)
    path.join(__dirname, "node_modules", ".bin", "serve"),
    // 2. Parent node_modules (if installed as a dependency)
    path.join(__dirname, "..", ".bin", "serve"),
  ];

  let serveBin = "npx"; // Fallback to npx
  let args = ["serve", "public"];

  // Check if we can find a local binary
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      serveBin = p;
      args = ["public"]; // If using binary directly, don't need 'serve' arg
      break;
    }
  }

  // Windows compatibility
  if (process.platform === "win32" && serveBin !== "npx") {
    serveBin += ".cmd";
  }

  console.log(`🌐 Starting local server...`);

  // Use spawn to pipe input/output
  const server = spawn(serveBin, args, {
    stdio: "inherit",
    shell: true,
  });

  server.on("close", (code) => {
    process.exit(code);
  });
}

// =============================================================================
// Utils
// =============================================================================

function calculateHash(filePath) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash("sha256");
    hashSum.update(fileBuffer);
    return hashSum.digest("hex");
  } catch (e) {
    return null;
  }
}

function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans);
    }),
  );
}

function loadState() {
  if (fs.existsSync(STATE_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
    } catch (e) {
      return {};
    }
  }
  return {};
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function ensurePackageScripts() {
  const packageJsonPath = path.join(process.cwd(), "package.json");
  if (fs.existsSync(packageJsonPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
      pkg.scripts = pkg.scripts || {};

      let changed = false;
      if (pkg.scripts.build !== "brz build") {
        pkg.scripts.build = "brz build";
        changed = true;
      }
      // 'dev' is the primary command for local preview
      if (pkg.scripts.dev !== "brz build && (npm run watch & npm run serve)") {
        pkg.scripts.dev = "brz build && (npm run watch & npm run serve)";
        changed = true;
      }
      if (
        pkg.scripts.watch !==
        'nodemon -e yaml,json,css,ejs,js --watch resume.yaml --watch config.yaml --watch themes --exec "npm run build"'
      ) {
        pkg.scripts.watch =
          'nodemon -e yaml,json,css,ejs,js --watch resume.yaml --watch config.yaml --watch themes --exec "npm run build"';
        changed = true;
      }
      if (pkg.scripts.serve !== "npx serve public") {
        pkg.scripts.serve = "npx serve public";
        changed = true;
      }

      if (changed) {
        fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2));
        console.log(
          "✅ Updated package.json with dev/build/watch/serve scripts",
        );
      }
    } catch (e) {
      console.warn("⚠️  Could not update package.json scripts.");
    }
  }
}
