<div align="center">
  <img src="img/breezy-cv-logo.png" alt="Breezy CV Logo" width="200" />
  <h1>Breezy CV</h1>
  <p>
    <strong>A lightweight, YAML-based static resume generator.</strong><br>
    Build a beautiful, responsive CV hosted on GitHub Pages in minutes.
  </p>
  
  <p>
    <a href="https://fritzip.github.io/breezy-cv/"><strong>👀 View Live Demo</strong></a>
  </p>
</div>

---

## 🍃 Why Breezy CV?

- **Easy to Maintain**: Separation of content (`resume.yaml`) and design.
- **Configurable**: Choose themes (currently 'modern'), colors, and toggles via `config.yaml`.
- **Assets Managed**: Automatically handles your avatar and favicon.
- **Auto-Deploy**: Built-in GitHub Actions workflow to deploy to GitHub Pages automatically.

## 🚀 Quick Start

### 1. Create a Repository

Create a new public repository on GitHub.

### 2. Initialize

Run these commands in your local terminal:

```bash
# Create a folder for your resume
mkdir my-resume && cd my-resume

# Initialize npm
npm init -y

# Install Breezy CV
npm install github:fritzip/breezy-cv

# Initialize the project structure
npx breezy-cv init
```

This will create:

- `resume.yaml` (Your content)
- `config.yaml` (Your settings)
- `.github/workflows/deploy.yml` (Auto-deployment script)

### 3. Customize

1.  Edit **`resume.yaml`** with your own information.
2.  Edit **`config.yaml`** to change colors or reference your photo.
    ```yaml
    avatar: "photos/me.jpg" # Place your photo in the folder and link it here
    ```

### 4. Deploy

1.  Commit and push your changes:
    ```bash
    git add .
    git commit -m "Initial commit"
    git push origin main
    ```
2.  Go to your repository on GitHub.
3.  Navigate to **Settings** > **Pages**.
4.  Under **Build and deployment**, select **GitHub Actions** as the source.

🎉 **That's it!** Your resume will be built and deployed. Check the "Actions" tab to see the progress.

### 5. Updating

To get the latest features and bug fixes from Breezy CV:

1.  Update the package:
    ```bash
    npm install github:fritzip/breezy-cv
    ```

2.  Run the initialization command again:
    ```bash
    npx breezy-cv init
    ```

The tool will detect if any template files (like `config.yaml` or the deployment workflow) have been updated in the new version.
-   If meaningful changes are detected, it will ask if you want to overwrite your local file.
-   If you choose **Yes**, your current file will be backed up (e.g., `config.yaml.bak`) so you don't lose any work.

---

## ⚙️ Configuration

### `config.yaml`

```yaml
theme: "modern"

avatar: "me.jpg" # Path to your profile picture
favicon: "icon.png" # Path to your favicon

style:
  primaryColor: "#3b3763"
  accentColor: "#399ba8"
  sidebarRatio: 0.3 # e.g. 0.3 means 30% width

features:
  showPhoto: true
  showSkillBars: true
```

### `resume.yaml`

Follows the standard JSON Resume schema structure (converted to YAML for readability).

```yaml
basics:
  name: "Jane Doe"
  label: "Software Engineer"
  ...
experience:
  ...
```

## 🛠 For Developers (Showcase Mode)

If you want to contribute to the engine or run the demo locally from this repository:

1.  Clone this repo.
2.  Run `npm install`.
3.  Run `npm run build` to generate the `public/` folder.
4.  Run `npm run serve` to preview it locally.

---

<p align="center">
  Made with ❤️ by fritzip
</p>
