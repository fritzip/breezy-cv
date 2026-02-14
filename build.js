#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const ejs = require("ejs");
const crypto = require("crypto");
const readline = require("readline");

// Utils
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

const STATE_FILE = path.join(process.cwd(), ".breezy-cv-state.json");

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

// Handle init command
if (process.argv[2] === "init") {
  (async () => {
    console.log("🚀 Initializing new Breezy CV project...");

    const state = loadState();
    let newState = { ...state };
    let createdCount = 0;

    const filesToManage = [
      { src: "resume.yaml", dest: "resume.yaml" },
      { src: "config.yaml", dest: "config.yaml" },
      { src: "template.gitignore", dest: ".gitignore" },
      {
        src: ".github/workflows/deploy.yml",
        dest: ".github/workflows/deploy.yml",
      },
    ];

    for (const { src, dest } of filesToManage) {
      const fileName = dest; // use destination name for logs/state
      const srcPath = path.join(__dirname, src);
      const destPath = path.join(process.cwd(), dest);

      if (!fs.existsSync(srcPath)) {
        console.warn(`⚠️  Template file missing: ${src} (skipped)`);
        continue;
      }

      // Skip if running in the source repo
      if (srcPath === destPath) continue;

      const destDir = path.dirname(destPath);

      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }

      const currentSrcHash = calculateHash(srcPath);
      const userDestHash = calculateHash(destPath);
      const lastSrcHash = state[fileName];

      // New record for state
      newState[fileName] = currentSrcHash;

      // Case 1: File does not exist in user repo
      if (!fs.existsSync(destPath)) {
        fs.copyFileSync(srcPath, destPath);
        console.log(`✅ created: ${fileName}`);
        createdCount++;
        continue;
      }

      // Case 2: File exists. Check if it differs from current template
      if (userDestHash === currentSrcHash) {
        // Already up to date
        // console.log(`   ${fileName} is up to date.`);
        continue;
      }

      // Case 3: File is different.
      // Check if template has changed since last update (or if we have no record)
      const templateChanged = lastSrcHash !== currentSrcHash;

      if (templateChanged) {
        // Template changed AND user file is different (conflict or update needed)
        console.log(`\n⚠️  Update available for ${fileName}.`);
        console.log(`   (The template has changed in the new version)`);

        const answer = await askQuestion(
          `   Replace with new version? (Your current file will be backed up) [y/N]: `,
        );

        if (answer.toLowerCase() === "y" || answer.toLowerCase() === "yes") {
          const backupPath = destPath + ".bak";
          fs.copyFileSync(destPath, backupPath);
          fs.copyFileSync(srcPath, destPath);
          console.log(
            `✅ updated: ${fileName} (backup: ${path.basename(backupPath)})`,
          );
          createdCount++;
        } else {
          console.log(`   skipped: ${fileName} (kept local version)`);
        }
      } else {
        // Template hasn't changed, but user file is different.
        // User just has local modifications. Don't bother them.
        console.log(
          `   skipped: ${fileName} (local modifications, no upstream change)`,
        );
      }
    }

    saveState(newState);

    console.log(`\n🎉 Initialization/Update complete!`);
    if (createdCount > 0) {
      console.log(`\nNext steps:`);
      console.log(`1. Edit 'resume.yaml' with your details.`);
      console.log(`2. Commit and push your changes.`);
      console.log(`3. Check 'config.yaml' for avatar/favicon settings.`);
      console.log(`4. Watch the Action tab for your deployment!`);
    }

    process.exit(0);
  })();
} else {
  // Build Script Logic
  // Paths
  // Allow passing an input file or default to resume.yaml
  const inputFileArg = process.argv[2];
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

  try {
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

    // Helper to copy assets to public/
    // Modified to force rename assets (preventing duplicates and dirty public dir)
    const copyAsset = (assetPath, targetName) => {
      if (!assetPath || typeof assetPath !== "string") return assetPath;
      if (assetPath.match(/^https?:\/\//)) return assetPath;

      try {
        const srcPath = path.resolve(process.cwd(), assetPath);
        if (fs.existsSync(srcPath)) {
          let fileName;

          if (targetName) {
            // 1. Determine extension
            const ext = path.extname(srcPath);
            fileName = targetName + ext;

            // 2. Clean up old files with the same targetName (e.g. avatar.png vs avatar.jpg)
            const existingFiles = fs.readdirSync(OUTPUT_DIR);
            existingFiles.forEach((file) => {
              if (file.startsWith(targetName + ".") && file !== fileName) {
                try {
                  fs.unlinkSync(path.join(OUTPUT_DIR, file));
                  // console.log(`   Cleaned up old asset: ${file}`);
                } catch (e) {
                  /* ignore */
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

    // Process assets (favicon, avatar, resume image)
    if (config.favicon) {
      config.favicon = copyAsset(config.favicon, "favicon");
    }

    // Avatar Logic:
    // If config.avatar exists, it becomes the canonical 'avatar' (avatar.ext)
    // If not, resume.basics.image becomes the canonical 'avatar'
    if (config.avatar) {
      config.avatar = copyAsset(config.avatar, "avatar");
      // We still copy resume image if it exists, just in case (with original name)
      if (resumeData.basics && resumeData.basics.image) {
        resumeData.basics.image = copyAsset(resumeData.basics.image);
      }
    } else {
      if (resumeData.basics && resumeData.basics.image) {
        resumeData.basics.image = copyAsset(resumeData.basics.image, "avatar");
      }
    }

    // Resolve Theme Paths
    const THEME_DIR = path.join(__dirname, "themes", config.theme);
    const TEMPLATE_FILE = path.join(THEME_DIR, "template.ejs");
    const CSS_FILE = path.join(THEME_DIR, "style.css");

    if (!fs.existsSync(THEME_DIR)) {
      throw new Error(`Theme "${config.theme}" not found in themes/`);
    }

    console.log(`🎨 Compiling template using theme: ${config.theme}...`);
    const template = fs.readFileSync(TEMPLATE_FILE, "utf8");

    // Pass both resume data and config to template
    const html = ejs.render(template, {
      resume: resumeData,
      config: config,
    });

    console.log("💾 Writing files to public/ ...");
    fs.writeFileSync(OUTPUT_HTML, html);

    // Copy Base CSS if it exists
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
  } catch (e) {
    console.error("❌ Build failed:", e);
    process.exit(1);
  }
}
