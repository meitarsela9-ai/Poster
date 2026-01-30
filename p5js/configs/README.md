# Configuration Looping System

This folder contains JSON configuration files that control the poster animation parameters. The main animation (index.html) will automatically cycle through all configurations in a continuous loop.

## How It Works

1. **Artist exports configurations** from the interactive dashboard (`interactive.html`)
2. **Place JSON files** in this `configs/` folder
3. **Update the file list** in `src/sketch.js` (see below)
4. **Run the main animation** - it will automatically loop through all configurations

## Workflow

### Step 1: Export Configurations from Interactive Dashboard

1. Open `interactive.html` in your browser
2. Adjust parameters using the control panel
3. Click **"Export Settings"** button
4. A JSON file will download (e.g., `poster-settings-2026-01-30T12-00-00.json`)
5. Repeat this process to create 3-4 different variations

### Step 2: Add Configurations to Project

1. Rename your exported files to something meaningful:
   - `config-1.json` (e.g., "Calm Floating")
   - `config-2.json` (e.g., "Energetic Burst")
   - `config-3.json` (e.g., "Dense Constellation")
   - `config-4.json` (e.g., "Sparse Drift")

2. Place them in the `p5js/configs/` folder

### Step 3: Update Configuration List

Edit `p5js/src/sketch.js` and find the `CONFIG_FILES` array near the top:

```javascript
const CONFIG_FILES = [
  'configs/config-1.json',
  'configs/config-2.json',
  'configs/config-3.json',
  'configs/config-4.json'
];
```

Add or remove file paths as needed.

### Step 4: Run the Animation

Open `index.html` in your browser. The animation will:
- Start with the first configuration
- Play through the complete animation cycle (~138 seconds)
- Automatically switch to the next configuration
- Loop back to the first configuration after the last one completes

## Configuration File Structure

Each JSON file contains all adjustable parameters organized by phase:

```json
{
  "exportedAt": "2026-01-30T12:00:00.000Z",
  "version": "1.0",

  "timeline": {
    "breathInhale": 4.5,
    "breathHold": 3.0,
    "breathExhale": 4.5,
    "releaseGrow": 7.0,
    "ghostFade": 4.0,
    "tangentAppear": 12.0,
    "gradualFill": 30.0,
    "dotsGrow": 18.0,
    "blueTransformDuration": 0.5,
    "textEmergeDuration": 8.0,
    "strokeFadeDuration": 15.0,
    "largeDotStrokeFadeDuration": 20.0
  },

  "phase1": {
    "rectGrowScale": 1.2,
    "textGrowScale": 1.15
  },

  "phase2": {
    "tangentDotRadius": 3,
    "tangentThreshold": 0.15,
    "tangentSpacing": 25
  },

  "phase3": {
    "fillTarget": 0.45,
    "fillTargetSmall": 0.5,
    "fillDotRadius": 3,
    "fillSpacing2026": 25,
    "fillSpacingOther": 6
  },

  "phase4": {
    "dotGrow2026": 13,
    "dotGrowOther": 5,
    "strokeGrowMax": 3.5
  },

  "phase5": {
    "dispersionDuration": 5.0,
    "dispersionSpeed": 20.0
  },

  "phase6": {
    "blueDotPercentage": 0.7,
    "blueDotShrinkOther": 0.25
  },

  "phase7": {
    "baseSpeed": 0.12,
    "largeDotSpeed": 0.15,
    "floatDamping": 0.97,
    "attractionStrength": 0.03,
    "minDistanceFromPoint": 0.5,
    "gustStrength": 5.0,
    "gustFrequency": 0.4,
    "speedVariationMin": 0.7,
    "speedVariationMax": 1.3
  },

  "phase8": {
    "textSizeScale": 1.0
  },

  "phase10": {
    "snakeGridSize": 8,
    "snakeStepInterval": 0.15,
    "snakeDirectionChange": 0.15,
    "snakeEatingDistance": 12,
    "snakeCuttingDistance": 8
  }
}
```

## Tips for Creating Variations

### Dramatic Contrasts
Create variations with very different characteristics:
- **Slow & Calm**: Longer durations, gentle speeds, low frequencies
- **Fast & Energetic**: Shorter durations, high speeds, frequent gusts
- **Dense**: High fill targets, small spacing, more blue dots
- **Sparse**: Low fill targets, large spacing, fewer blue dots

### Key Parameters to Vary

**Movement Character:**
- `largeDotSpeed`, `baseSpeed` - Overall motion speed
- `gustStrength`, `gustFrequency` - How dynamic the movement feels
- `floatDamping` - Smoothness vs jitteriness

**Visual Density:**
- `fillTarget`, `fillTargetSmall` - How many dots appear
- `fillSpacing2026`, `fillSpacingOther` - Sampling density
- `blueDotPercentage` - Ratio of blue to white small dots

**Transformation Speed:**
- `dotsGrow` - How fast dots expand
- `blueTransformDuration` - Color transition speed
- `strokeFadeDuration` - How long strokes take to disappear

**Scale & Size:**
- `dotGrow2026`, `dotGrowOther` - Final bubble sizes
- `blueDotShrinkOther` - Size of tiny blue dots
- `textSizeScale` - Background text size

## Troubleshooting

**Animation doesn't loop:**
- Check that CONFIG_FILES paths are correct
- Open browser console (F12) to see error messages
- Verify JSON files are valid (use a JSON validator)

**Parameters don't seem to apply:**
- Ensure JSON structure matches exactly (check spelling)
- Some parameters only affect dots if they're regenerated
- Timeline changes only apply to new animation cycles

**Animation resets mid-cycle:**
- Check that `animationDuration` is calculated correctly
- Verify no errors in browser console

## Example Configurations

See `example-config.json` in this folder for a working template with default values.

## Technical Details

**Animation Duration Calculation:**
The animation duration is automatically calculated as:
```
animationDuration = TIMELINE.phase11Start + TIMELINE.largeDotStrokeFadeDuration
```

With defaults: 118.0s + 20.0s = 138.0s total

**Configuration Loading:**
Configurations are loaded in `preload()` and applied in sequence. When the animation time exceeds the duration, it automatically switches to the next config and resets.

**Fallback Behavior:**
If a configuration file fails to load or a parameter is missing, the system falls back to default values. Check the browser console for warnings.
