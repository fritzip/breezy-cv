# My Resume

This resume is built with [Breezy CV](https://github.com/fritzip/breezy-cv). It allows you to maintain your CV in a simple YAML format and automatically generates a beautiful, responsive website and PDF.

## 🛠️ Setup

1.  **Install Node.js** (if not already installed).
2.  **Install Dependencies**:
    ```bash
    npm install
    ```

## ✍️ Usage

### 1. Edit your content
*   **`resume.yaml`**: Contains your personal information, experience, education, and skills.
*   **`config.yaml`**: Controls the visual theme (`modern` or `classic`), colors, fonts, and feature toggles.

### 2. Preview locally
Start the development server. This will build your resume, launch a local web server, and watch for changes.
```bash
npm run dev
```
Visit [http://localhost:3000](http://localhost:3000) to see your resume. Any changes you make to the YAML files will automatically reload the page.

## 🚀 Deployment

This repository is configured to deploy automatically to **GitHub Pages**.

1.  Commit and push your changes to GitHub.
2.  Go to your repository's **Actions** tab to see the build progress.
3.  Once finished, your resume will be live at `https://<your-username>.github.io/<repo-name>/`.

*(Note: Ensure GitHub Pages is enabled in your repository under **Settings > Pages** and set "Source" to **GitHub Actions**)*

## 📄 Export to PDF

1.  Open your live resume (or local preview) in a browser.
2.  Click the **"Save as PDF"** button (or press `Ctrl+P` / `Cmd+P`).
3.  **Important**: Ensure **"Background graphics"** is checked in your print settings.
4.  Save!

## 📦 Updating Breezy CV

To update the resume generator engine to the latest version to get new features or bug fixes:

1.  **Update the package**:
    ```bash
    npm install github:fritzip/breezy-cv
    ```

2.  **Refreshes Configuration** (Safe Update):
    Run the init command again to check for updates to the config templates or workflow files.
    ```bash
    npx breezy-cv init
    ```
    *It will ask before overwriting any of your files. If `config.yaml` has updates, it will create a backup of your old one.*
