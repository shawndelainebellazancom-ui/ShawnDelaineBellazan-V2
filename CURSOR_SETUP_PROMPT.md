# CURSOR IDE INITIALIZATION PROMPT

**INSTRUCTIONS:** Open Cursor Chat (Ctrl+L or Cmd+L) and paste the text below to initialize the PMCR-O system.

---

I have initialized the `.cursorrules` file with PMCR-O system instructions.

**Current Context:**
- Project: Shawn Delaine Bellazan Portfolio Website (shawndelainebellazan.com)
- Stack: HTML5, CSS (Gold/Dark Theme), Vanilla JS
- Philosophy: PMCR-O (Planner-Maker-Checker-Reflector-Orchestrator)
- Sprint: 7-day window to perfect the site

**Current Task:**
I need to fix the Sidebar navigation on the `pmcro-prompt-library.html` page. The sidebar should stick properly on desktop and collapse gracefully on mobile.

**What I need you to do:**
1. Review the sidebar CSS in `pmcro-prompt-library.html` (lines 33-46 in the `<style>` section)
2. Check if the `top` value matches the actual navbar height from `style.css`
3. Verify the sticky positioning works correctly
4. Ensure proper z-index layering
5. Test responsive behavior (should collapse to top on mobile per the media query at line 225)

**Files to examine:**
- `pmcro-prompt-library.html` (sidebar CSS)
- `style.css` (navbar height reference)
- `index.html` (to see navbar structure if needed)

Please diagnose the sidebar issue and propose a fix that ensures it sticks correctly on desktop and behaves properly on mobile.

