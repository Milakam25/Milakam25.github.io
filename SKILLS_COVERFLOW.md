# Technical Skills Cover Flow

The existing HTML content is progressively enhanced by `assets/js/skills-coverflow.js`
and styled only within the Skills section by `assets/css/skills-coverflow.css`.
The site's heading, coastline image, skill wording, and other sections are unchanged.
Without JavaScript, the original grouped lists remain available.

## Assumptions

- This repository uses plain HTML, CSS, and JavaScript, so no React or Tailwind dependency was introduced.
- Categories keep their original order, start at Languages, and stop at either end rather than wrapping.
- Autoplay and the optional card flip are omitted.
- The jump menu uses a navigation list of buttons with `aria-current`, rather than tabs with duplicated content.
- Mouse drags browse cards; double-click text selection remains available.
- Reduced motion disables momentum, spring, pop, tilt, and foil movement. Selection changes instantly with a short opacity fade, and pastel fills remain.

## Tuning

The `SKILLS_COVERFLOW` object at the top of `assets/js/skills-coverflow.js` contains:

| Setting | Default |
| --- | --- |
| `dragPixelsPerCard` | 80 pixels |
| `dragThreshold` | 6 pixels |
| `momentumMs` | 180 milliseconds of velocity projection |
| `maxFlickCards` | 4 additional cards |
| `maxTiltDegrees` | 8 degrees |
| `colors` | The seven requested pastel hex values, in category order |

The same script contains `skillsSpringResponse` (stiffness 200, damping 22, mass 1),
the mobile rotation (35 degrees), and the pop amplitude (`.04`, or four percent).
New selection impulses are summed with the running spring; flicks also carry their
initial release velocity. This keeps mid-flight changes continuous.

In `assets/css/skills-coverflow.css`, change the 900px breakpoint for the mobile chip
row, 20px card radius, `.3s` fill transition, or `.24` foil opacity as desired.
The selected card is approximately 80 percent of the viewport on phones.

## Checks

```sh
node --test tools/skills-coverflow.test.mjs tools/project-story.test.mjs tools/contact.test.mjs
node tools/skills-coverflow.browser.mjs
```

The browser check temporarily serves only the page and public assets on localhost,
then closes the browser and server. It verifies content, keyboard navigation,
category jumps, live dragging, momentum, horizontal wheel input, touch swipes,
pop/tilt/shine, native vertical touch scrolling, 320px text fit, mobile chip layout,
and reduced motion. Screenshots are written to
`/tmp/mila-skills-coverflow-desktop.png` and `/tmp/mila-skills-coverflow-mobile.png`.
