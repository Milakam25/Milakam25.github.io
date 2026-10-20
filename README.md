# Mila Kam — Professional Portfolio

Personal portfolio website for Mila Kam, an MIS graduate focused on systems, cybersecurity, data, and full-stack development.

**Live site:** [milakam25.github.io](https://milakam25.github.io/)

## Technology

- Semantic HTML5
- Responsive CSS
- Vanilla JavaScript
- GitHub Pages

## Project structure

```text
.
├── .github/ISSUE_TEMPLATE/  # Repository issue forms
├── assets/
│   ├── css/                 # Site styling
│   ├── documents/           # Downloadable résumé
│   ├── images/              # Portfolio imagery
│   └── js/                  # Site interactions
├── 404.html                 # Custom not-found page
├── favicon.ico
├── index.html               # Main portfolio page
└── LICENSE.md
```

## Run locally

No build step or package installation is required. From the repository root, start any static file server—for example:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Updating content

- Portfolio copy and links: `index.html`
- Colors, layout, and responsive styles: `assets/css/styles.css`
- Scroll, carousel, and contact interactions: `assets/js/script.js`
- Résumé: replace `assets/documents/resume.pdf` while keeping the filename
- Portfolio image: replace `assets/images/honolulu-coast.jpg` while keeping the filename

## Deployment

GitHub Pages deploys the `main` branch automatically. After a change is merged or pushed, allow a few minutes for the live site to refresh.

## License

This project is available under the terms in [LICENSE.md](LICENSE.md).
