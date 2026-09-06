# Settings reference

Run **iroiro iro: Open Settings** or edit VS Code settings directly. Workspace values override user values. In operation, `iroiroIro.color` is workspace-only and `iroiroIro.presets` is user-only.

Invalid preferences use their defaults. Invalid preset entries are excluded. An invalid nonempty saved color prevents automatic replacement until you enter a valid color or reset.

## Setting catalog

| Key                               | Type    | Default                                              | Scope              | Accepted values and invalid behavior                                                                                                                      |
| --------------------------------- | ------- | ---------------------------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `iroiroIro.color`                 | String  | Empty string                                         | Workspace          | Three or six ASCII hex digits, with an optional `#`. Commands save lowercase six-digit form. An invalid nonempty value is an error.                       |
| `iroiroIro.autoColor.enabled`     | Boolean | `false`                                              | User and workspace | `true` or `false`. Other values use `false`.                                                                                                              |
| `iroiroIro.autoColor.source`      | String  | `presets`                                            | User and workspace | `presets` or `generated`. Other values use `presets`.                                                                                                     |
| `iroiroIro.preferDistinctColors`  | Boolean | `true`                                               | User and workspace | `true` or `false`. Other values use `true`.                                                                                                               |
| `iroiroIro.adjustmentStep`        | Integer | `5`                                                  | User and workspace | An integer from 1 through 10. Other values use `5`.                                                                                                       |
| `iroiroIro.coloredParts`          | Object  | See below                                            | User and workspace | Known part IDs with Boolean values. Unknown IDs cause a diagnostic. A missing or invalid member uses that part's default. A non-object uses all defaults. |
| `iroiroIro.adjustments`           | Object  | Activity bar `lighten`. Title and status bars `none` | User and workspace | `activityBar`, `titleBar`, and `statusBar` can be `none`, `lighten`, or `darken`. Invalid members use their defaults.                                     |
| `iroiroIro.presets`               | Array   | `[]`                                                 | User               | At most 1,000 objects with exactly `name` and `value`. Invalid or duplicate entries are excluded. Workspace values are ignored.                           |
| `iroiroIro.preview.enabled`       | Boolean | `true`                                               | User and workspace | `true` or `false`. Other values use `true`.                                                                                                               |
| `iroiroIro.statusBarItem.enabled` | Boolean | `true`                                               | User and workspace | `true` or `false`. Other values use `true`.                                                                                                               |

The `iroiroIro.coloredParts` defaults are:

```json
{
    "activityBar": true,
    "statusBar": true,
    "titleBar": true,
    "sashHover": true,
    "editorGroupBorder": false,
    "panelBorder": false,
    "sideBarBorder": false,
    "statusBarBorder": false,
    "titleBarBorder": false,
    "tabActiveBorder": false,
    "windowBorder": false
}
```

## Examples

Short and full hex values are accepted:

```json
{
    "iroiroIro.color": "#3a7"
}
```

Enable generated automatic colors:

```json
{
    "iroiroIro.autoColor.enabled": true,
    "iroiroIro.autoColor.source": "generated",
    "iroiroIro.preferDistinctColors": true
}
```

Select parts and bar shades:

```json
{
    "iroiroIro.coloredParts": {
        "activityBar": false,
        "statusBar": true,
        "editorGroupBorder": true
    },
    "iroiroIro.adjustments": {
        "activityBar": "darken",
        "titleBar": "none",
        "statusBar": "lighten"
    }
}
```

Add user presets:

```json
{
    "iroiroIro.presets": [
        { "name": "Build window", "value": "#2468ac" },
        { "name": "Review window", "value": "d95f02" }
    ]
}
```

Preset names contain 1 through 64 characters, contain no control characters, and must be unique after normalized case comparison.

## Workspace changes

Preview and completed operations update `workbench.colorCustomizations`. Completed choices also update `iroiroIro.color`. VS Code can show these changes in settings files and Git. Cancellation restores values rather than the original file layout.

Settings Sync can synchronize user preferences and presets. Workspace assignments travel with workspace files. Recovery data, Undo history, and local window records do not synchronize.
