<div align="center">
  <img src="img/breezy-cv-logo.png" alt="Breezy CV Logo" width="200" />
  <h1>Breezy CV</h1>
  <p>
    <strong>A lightweight, YAML-based static resume generator.</strong><br>
    separating content from design to build beautiful, responsive CVs hosted on GitHub Pages.
  </p>
  
  <p>
    <a href="https://fritzip.github.io/breezy-cv/"><strong>👀 View Live Demo</strong></a>
  </p>
</div>

---

## 🍃 Features

- **YAML-Based**: Maintain your resume content in a clean, readable `resume.yaml` file.
- **Themable**: Includes `modern` and `classic` themes, fully configurable via `config.yaml`.
- **Auto-Deploy**: Includes a GitHub Actions workflow to deploy to GitHub Pages automatically.
- **PDF Ready**: Optimized print stylesheets ensure high-quality PDF exports directly from the browser.
- **Asset Management**: Handles avatars and favicons automatically.

## 🚀 Getting Started

### 1. Installation

Create a folder for your new resume and initialize it:

```bash
mkdir my-resume && cd my-resume
npm init -y
npm install github:fritzip/breezy-cv
npx breezy-cv init
```

This generates the scaffolding:
- `resume.yaml`: Your content (JSON Resume compatible).
- `config.yaml`: Theme and feature settings.
- `.github/workflows`: Auto-deployment script.

### 2. Usage

To preview your resume, run the development command:

```bash
npm run dev
```

This will:
1.  Build your site to `public/`.
2.  Start a local web server at `http://localhost:3000`.
3.  Watch for changes in your YAML files and auto-refresh the page.

### 3. Customization

-   **Content**: Edit `resume.yaml` with your details.
-   **Design**: Edit `config.yaml` to change colors, fonts, or toggle features.
    ```yaml
    theme: "modern"
    style:
      primaryColor: "#2c3e50"
      fontSizeScale: 1.0
    ```

## 🌍 Deployment

Breezy CV comes with a built-in **GitHub Actions** workflow.

1.  Push your project to a new GitHub repository.
2.  Go to **Settings > Pages** in your repo.
3.  Set **Source** to **GitHub Actions**.
4.  Your resume will typically appear at `https://<user>.github.io/<repo>/`.

## 📦 Updating

To upgrade to the latest version of the engine:

```bash
npm install github:fritzip/breezy-cv
npx breezy-cv init
```
The `init` command will detect if config templates or workflows have changed and offer to update them (backing up your local versions first).

## 🛠 For Developers

To contribute to Breezy CV or modify the engine/themes locally:

1.  Clone this repository.
2.  Install dependencies: `npm install`.
3.  Run the dev server: `npm run dev`.

This runs the engine in "Showcase Mode", using the sample data in the root directory.

---

<p align="center">
  Made with ❤️ by fritzip
</p>
