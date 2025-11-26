# Minimap Scaling & Centering Analysis

## Current Issues

### 1. Cell Size Not Updating (Tailwind Dynamic Classes)
**Problem:** 
- Code: `w-[calc(20rem/${viewportSize})] h-[calc(20rem/${viewportSize})]`
- Tailwind compiles CSS at build time, doesn't evaluate JS variables
- Result: Classes never generated, cells stay same size

**Solution:**
- Remove Tailwind dynamic classes
- Use **inline style** with computed pixel values: `style={{ width: cellSizePx, height: cellSizePx }}`

### 2. Minimap Container Shifting on Viewport Change
**Problem:**
- `totalViewportOffsetPx` calculated as: `-(gridCenter - viewportRadius) * cellSizePx`
- Applied as `--pan-x` and `--pan-y` CSS vars → `transform: translate(var(--pan-x), var(--pan-y))`
- When viewport changes (5→7→9): offset changes → container shifts
- Expected: Minimap stays fixed, only visible grid region changes

**Root Cause:**
- Transform is meant for **player pan animation** (moving camera follow)
- Should NOT be used for **grid centering** (static layout)
- Two concerns mixed together

**Solution:**
- **Separate concerns:**
  1. **Pan animation**: Keep `--pan-x/--pan-y` but initialize to `0px` (no initial offset)
  2. **Viewport centering**: Use CSS Grid `place-content-center` to auto-center the grid
  3. **Visibility**: Use `opacity-0 pointer-events-none` for tiles outside viewport (no grid layout changes)

## New Architecture

### Container Strategy
```
1. Container: w-80 h-80 (320px × 320px) fixed size
2. Grid: Always 7×7 internally
3. Cell size: Computed inline style, depends on viewportSize
   - 5×5 mode: 320/5 = 64px per cell
   - 7×7 mode: 320/7 ≈ 45.7px per cell
   - 9×9 mode: 320/9 ≈ 35.6px per cell
4. Grid container alignment: place-content-center (center grid in container)
5. Pan animation: transform: translate(--pan-x, --pan-y) only during movement
```

### Key Changes Needed

1. **Cell Sizing**
   - Remove: `responsiveCellSize = "w-[calc(20rem/${viewportSize})]..."`
   - Add inline style in cell render: `style={{ width: cellSizePx, height: cellSizePx }}`

2. **Container Styling**
   - Remove: `--pan-x/--pan-y` initialization from container style
   - Remove: `place-content-center place-items-center` (not needed)
   - Keep: `w-80 h-80 overflow-hidden` (fixed size, clip overflow)
   - Keep: `map-pan-anim` class (will apply transform during animation)

3. **CSS Variables for Pan Animation**
   - Initialize `--pan-x: 0px` and `--pan-y: 0px` (no initial offset)
   - During animation: update variables dynamically
   - Pan distance calculation: `dx * cellSizePx` (correct, based on visible cell size)

4. **Viewport Visibility**
   - Keep `isViewportVisible()` function
   - Apply `opacity-0 pointer-events-none` to hidden tiles (no grid layout change)
   - Container automatically centers visible grid via CSS Grid

## Implementation Checklist

- [ ] Remove Tailwind dynamic `responsiveCellSize` variable
- [ ] Add inline `width/height` style to cell divs based on `cellSizePx`
- [ ] Remove `totalViewportOffsetPx` from container initial style
- [ ] Initialize CSS vars to `0px` (no offset)
- [ ] Keep pan animation logic (updates vars during moveStart)
- [ ] Verify container stays fixed when changing viewport size
- [ ] Test all three modes (5×5, 7×7, 9×9)
  - Cell size must scale correctly
  - Container must NOT shift
  - Visible grid must be centered

## Data Trace Example

**Scenario:** User toggles 5×5 → 7×7

1. **Before:** 
   - viewportSize = 5, cellSizePx = 64px
   - Container: 320×320, cells: 64×64
   - gridOffsetFromCenterPx = (3-2)*64 = 64px
   - totalViewportOffsetPx = -64px (transform shifts container left-up)

2. **After (wrong):**
   - viewportSize = 7, cellSizePx = 45.7px
   - Container: 320×320, cells: 45.7×45.7
   - gridOffsetFromCenterPx = (3-3)*45.7 = 0px
   - totalViewportOffsetPx = 0px (transform resets)
   - Result: Container shifts because transform changed

3. **After (correct):**
   - viewportSize = 7, cellSizePx = 45.7px
   - Container: 320×320, cells: 45.7×45.7
   - No transform offset applied to container
   - CSS Grid auto-centers 7×7 grid inside 320×320 container
   - Result: Container stays fixed, grid re-renders with new cell size
