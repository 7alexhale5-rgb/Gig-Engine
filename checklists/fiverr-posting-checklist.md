# Fiverr Gig Posting Checklist

> Step-by-step guide to post a new Fiverr gig from generated content.
> Generated content lives in: `listings/fiverr/{GIG-ID}-{service-slug}.md`

---

## Pre-Posting Requirements

- [ ] Fiverr seller account is active and in good standing
- [ ] Profile is 100% complete (profile photo, description, languages, skills)
- [ ] At least one portfolio item is uploaded
- [ ] You have the generated listing file open (from `listings/fiverr/`)
- [ ] You have a gig image ready (see Step 8 for specs)
- [ ] Confirm the gig's row in `strategy-matrix.md` has status `generated`

---

## Posting Steps

### Step 1: Navigate to Gig Creation

- [ ] Log in at [fiverr.com/seller_dashboard](https://www.fiverr.com/seller_dashboard)
- [ ] Click **"Create a New Gig"** from the dashboard
- [ ] You'll land on the **Overview** tab

### Step 2: Gig Title

- [ ] Copy the title from the generated listing file (under `## Title`)
- [ ] Paste into the **Gig Title** field
- [ ] Verify it's 80 characters or fewer (Fiverr enforces this hard limit)
- [ ] Confirm it follows the "I will..." format
- [ ] Check that primary keywords appear early in the title

### Step 3: Category & Subcategory

- [ ] Select the **Category** as specified in the generated file (under `## Category`)
- [ ] Select the **Subcategory** as specified
- [ ] If the exact subcategory doesn't exist, pick the closest match and note the deviation in `tracker.md`

### Step 4: Search Tags

- [ ] Enter all 5 tags from the generated file (under `## Search Tags`)
- [ ] Type each tag and press Enter to confirm
- [ ] Verify all 5 are accepted (some may be rejected if they duplicate existing tags)
- [ ] If a tag is rejected, substitute from the secondary keywords in the generated file

### Step 5: Pricing Table

Fill all 3 tiers from the generated file (under `## Pricing`):

**Basic Tier:**
- [ ] Name (e.g., "Starter")
- [ ] Description (keep concise, highlight the core deliverable)
- [ ] Delivery time (days)
- [ ] Number of revisions
- [ ] Price

**Standard Tier:**
- [ ] Name (e.g., "Professional")
- [ ] Description (expand on Basic, add more scope)
- [ ] Delivery time (days)
- [ ] Number of revisions
- [ ] Price

**Premium Tier:**
- [ ] Name (e.g., "Enterprise")
- [ ] Description (full scope, max value)
- [ ] Delivery time (days)
- [ ] Number of revisions
- [ ] Price

**Pricing sanity check:**
- [ ] Basic price matches strategy matrix
- [ ] Tiers have clear value progression (not just "more revisions")
- [ ] Delivery days are realistic for your current workload

### Step 6: Gig Description

- [ ] Copy the full description from the generated file (under `## Description`)
- [ ] Paste into the **Description** field
- [ ] Verify formatting renders correctly (Fiverr uses limited markdown)
- [ ] Check that the structure follows: Hook > Deliverables > Why Me > Process > FAQ > CTA
- [ ] Confirm the CTA says "Message me before ordering" (drives pre-sale conversations)
- [ ] Verify no external links are included (Fiverr flags these)

### Step 7: Requirements (Buyer Questions)

- [ ] Click the **Requirements** tab
- [ ] Add each requirement from the generated file (under `## Requirements`)
- [ ] Mark required questions as **Required** (buyers must answer before ordering)
- [ ] Common requirements to include:
  - What systems/tools are you currently using?
  - What is the primary goal of this project?
  - Do you have login credentials ready to share? (mark as optional)
  - What is your timeline expectation?

### Step 8: Gallery (Gig Image)

- [ ] Open Canva and use the PrettyFly gig image template
- [ ] Image specs: **1280 x 769 px**, PNG or JPG
- [ ] Design guidelines:
  - Dark professional background (consistent with PrettyFly brand)
  - Service name prominently displayed
  - 2-3 key deliverables or value props as bullet text
  - PrettyFly.ai watermark/logo (subtle, bottom corner)
- [ ] Upload as the **primary gig image**
- [ ] Optional: Add 1-2 additional images (process diagram, sample deliverable screenshot)
- [ ] Optional: Add a short video intro (30-60 seconds, face-to-camera recommended)

### Step 9: FAQ

- [ ] Click the **FAQ** tab
- [ ] Add all 5 questions from the generated file (under `## FAQ`)
- [ ] Standard FAQ topics to cover:
  1. What information do you need from me to get started?
  2. Can you work with [platform/tool] specifically?
  3. What happens if I need changes after delivery?
  4. How do you handle communication during the project?
  5. Do you offer ongoing support or retainer arrangements?

### Step 10: Review & Publish

- [ ] Click **"Publish Gig"**
- [ ] Review the preview page for any formatting issues
- [ ] Confirm pricing displays correctly across all 3 tiers
- [ ] Verify the gig image looks sharp at thumbnail size
- [ ] Click **"Publish"** to go live

---

## Post-Posting Tasks

- [ ] Copy the live gig URL
- [ ] Update `tracker.md` with:
  - GIG-ID
  - Service name
  - Platform: Fiverr
  - Status: `live`
  - Posted date
  - URL
  - Initial metrics: 0/0/0/0 (impressions/clicks/orders/revenue)
- [ ] Update `strategy-matrix.md` status from `generated` to `posted`
- [ ] Verify the gig appears in Fiverr search within 24 hours:
  - Search for your primary keyword on Fiverr
  - Check first 5-10 pages of results
  - If not indexed after 48 hours, edit and re-save the gig (triggers re-index)
- [ ] Send yourself a test message through the gig page to confirm messaging works

---

## Weekly Optimization (Per Gig)

These tactics come directly from the Fiverr algorithm factors in `docs/PLATFORM-GUIDES.md`:

- [ ] **Update gig description weekly** -- even minor edits signal "active seller" to the algorithm
- [ ] **Maintain 100% response rate** -- respond to every message within 1 hour
- [ ] **Deliver early** when possible -- early delivery boosts ranking
- [ ] **Review pricing** -- start lower for review velocity in the first 2-4 weeks, then raise
- [ ] **Promoted Gigs** -- only enable on gigs with proven conversion ($10-15/day budget)
- [ ] **Never cancel orders** -- negotiate scope adjustments instead (cancellations tank your metrics)
- [ ] **Log performance** in `tracker.md` weekly:
  - Impressions
  - Clicks
  - Click-through rate (clicks / impressions)
  - Orders
  - Conversion rate (orders / clicks)
  - Revenue

---

## Seller Level Progression

Track your path to higher visibility:

| Level | Requirements |
|-------|-------------|
| New Seller | Complete profile, first gig live |
| Level 1 | 60+ days active, 10+ orders, 4.7+ rating, 90%+ completion, 90%+ on-time, 90%+ response |
| Level 2 | 120+ days, 50+ orders, 4.7+ rating, maintain all metrics |
| Top Rated | 180+ days, 100+ orders, $20K+ revenue, maintain all metrics |

---

## Common Gotchas

1. **Title rejected for special characters** -- Fiverr strips certain punctuation. Stick to alphanumeric plus basic punctuation (commas, hyphens). Avoid ampersands, use "and" instead.

2. **Description formatting lost** -- Fiverr's editor strips most markdown. Use their built-in formatting toolbar. Bold and bullet points work; headers and code blocks do not.

3. **Tags not saving** -- If a tag won't stick, it may conflict with Fiverr's restricted terms or duplicate another tag. Try a synonym.

4. **Image rejected for text overlay** -- Fiverr has rules about text-to-image ratio on gig thumbnails. Keep text to 30% or less of the image area. Test by uploading and checking the preview.

5. **Gig not appearing in search** -- New gigs can take 24-48 hours to index. If it still doesn't appear, edit any field and re-save. Avoid creating and deleting gigs repeatedly (flags your account).

6. **Pricing changes after publish** -- You can change pricing anytime, but frequent changes may temporarily de-rank the gig. Set it right the first time when possible.

7. **Requirements too long** -- Buyers get overwhelmed by 10+ questions. Keep it to 4-5 essential questions. You can always ask follow-ups in the order chat.

8. **Forgetting to update tracker** -- The tracker is your single source of truth. If it's not in `tracker.md`, it doesn't exist for analytics purposes. Update immediately after posting.

9. **Copying description from Google Docs** -- Hidden formatting from Google Docs/Word can cause display issues. Paste into a plain text editor first, then into Fiverr.

10. **Video not processing** -- Fiverr video encoding can take hours. Upload well before you plan to publish. Max file size is 50MB, recommended format is MP4.
