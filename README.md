# Bob Kozdemba's Portfolio

A professional portfolio website showcasing technical projects, professional experience, and web applications.

## Architecture

This is a static HTML website built with semantic HTML5 and CSS. No build process or framework dependencies required - just pure HTML and CSS optimized for GitHub Pages.

## Structure

```
/
├── index.html          # Home page
├── about.html          # About page (professional background & personal interests)
├── projects.html       # 3D graphics projects showcase
├── apps.html           # Web applications showcase
├── contact.html        # Contact information
├── 404.html            # Error page
├── assets/
│   └── css/
│       └── style.css   # Unified stylesheet
├── images/             # Images and graphics
├── audio-play/         # Audio stream player application
├── hls/                # KNKX streaming player
└── artwork/            # Album artwork tool
```

## Pages

### Main Pages
- **Home** (`index.html`) - Welcome page with overview and quick links
- **About** (`about.html`) - Professional background at Red Hat, 3D graphics experience, and personal interests
- **Projects** (`projects.html`) - Portfolio of 3D graphics and technical projects
- **Apps** (`apps.html`) - Showcase of web applications with launch links
- **Contact** (`contact.html`) - Contact information and social media links

### Standalone Applications
- **Audio Stream Player** (`audio-play/`) - Advanced HTML5 audio player with VU meters, codec detection, and metadata extraction
- **KNKX Streaming Player** (`hls/knkx_player.html`) - Dedicated streaming player for KNKX radio
- **Album Artwork Tool** (`artwork/`) - Browse and manage album artwork from music library

## Design System

### Colors
- Background: `#F0EFE2` (warm beige)
- Content areas: `gray`
- Menubar: `gray`
- Text: `#FFF` (white on gray backgrounds), `#000` (black on beige)
- Name accent: `#0707A0` (blue)
- Hover state: `lightslategray` on `black`

### Typography
- Headers: 'Century Gothic', Arial, sans-serif
- Body text: 'Trebuchet MS', Arial, sans-serif (0.80em)
- Professional and readable throughout

### Layout
- Fixed width: 898px container
- Two-column layout: 210px sidebar + 595px main content
- Consistent header with logo and navigation
- Footer with copyright and validation links

## Updating Content

### To Update a Page
1. Open the HTML file you want to edit
2. Find the `<div id="content">` section
3. Edit the HTML content directly
4. Save and commit changes

### To Add a New Page
1. Copy an existing page as a template (e.g., `about.html`)
2. Update the `<title>` and meta tags
3. Set the appropriate menu item to `class="selected"`
4. Replace the content in `<div id="content">`
5. Update navigation in other pages if needed

### To Update Styles
- Edit `assets/css/style.css`
- The stylesheet is shared across all pages
- Changes will apply site-wide

## Navigation

The site uses a consistent navigation menu across all pages:
- Home
- About
- Projects
- Apps
- Contact

The active page is highlighted with a black background.

## Deployment

This site is hosted on GitHub Pages and deployed automatically when changes are pushed to the `master` branch.

- **Live URL**: https://bkoz.github.io
- **Deployment**: Automatic via GitHub Pages
- **No build step required**: Static HTML is served directly

## Technical Details

- **HTML5**: Semantic markup, validated
- **CSS**: Single unified stylesheet, no preprocessor needed
- **Standalone apps**: Each app is self-contained and preserved as-is
- **No JavaScript framework**: Lightweight and fast
- **GitHub Pages compatible**: Works out of the box

## Browser Support

Modern browsers (Chrome, Firefox, Safari, Edge) are fully supported. The design is optimized for desktop viewing with a fixed-width layout.

## Maintenance

### Files to Keep
- All HTML files in root directory
- `/assets/` directory (CSS)
- `/images/` directory (all images)
- `/audio-play/`, `/hls/`, `/artwork/` (standalone apps)
- `README.md` (this file)
- `.gitignore`
- `CNAME` (if using custom domain)

### Files Removed
- Jekyll configuration and dependencies (no longer needed)
- Old portfolio directory (content merged into main pages)
- Markdown files (converted to HTML)

## License

Content and design by Bob Kozdemba. Template originally from [free HTML5 templates](http://www.html5webtemplates.co.uk), modified and enhanced.

## Contact

- **GitHub**: [bkoz](https://github.com/bkoz)
- **LinkedIn**: [Bob Kozdemba](https://www.linkedin.com/in/bob-kozdemba-230743/)
- **Email**: bob_kozdemba_at_gmail
