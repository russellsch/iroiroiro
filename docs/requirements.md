# iroiro iro: Requirements

Revision 0.5. [Design](design.md) records implementation decisions.

## 1. Purpose and conventions

These requirements define the first release of iroiro iro.
Each stable ID has one `must` obligation, a source, rationale, verification method, and pass condition.
Rationales add no obligations. All requirements have Release 1 priority.

The catalogs and contracts below are normative. Results belong in the [release record](releases/0.1.0.md).
Use ASD-STE100 prose and the INCOSE requirement structure. Sources refer to the need and decision registers.

## 2. Stakeholder needs and sources

| Need | Need statement                                                                                          | Origin                                               |
| ---- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| N-01 | The user wants a fast way to identify open workspaces by color.                                         | U-01, U-04                                           |
| N-02 | The user wants the same saved color when a workspace opens again.                                       | U-02, U-06                                           |
| N-03 | The user wants optional automatic assignment for an uncolored workspace.                                | U-03                                                 |
| N-04 | The user wants more than 200 built-in colors with clear English names and reusable named custom colors. | U-09, U-15                                           |
| N-05 | The user wants solid hex input, including short hex codes.                                              | U-09, U-14                                           |
| N-06 | The user wants keyboard commands for color selection and shade adjustment.                              | U-11                                                 |
| N-07 | The user wants a choice of colored window parts.                                                        | U-07, U-12                                           |
| N-08 | The user wants the extension in local and remote desktop workspaces.                                    | U-05, U-08                                           |
| N-09 | The user wants a preference for different colors in other open workspaces.                              | U-10                                                 |
| N-10 | The user wants a color preview that Escape can cancel.                                                  | U-14                                                 |
| N-11 | The user wants recovery from extension appearance changes.                                              | Derived from N-02, N-10 and design D-08 through D-10 |
| N-12 | The project wants clear, traceable, verifiable requirements.                                            | U-13                                                 |
| N-13 | The user wants local color use without third-party runtime packages or additional installed tools.      | U-16                                                 |
| N-14 | The user wants a small, reviewed, locked set of build tools.                                            | U-17, U-21, U-22                                     |
| N-15 | The user wants GitHub VSIX installation and a documented source build path.                             | U-18                                                 |
| N-16 | The user wants implementation documents for installation, use, recovery, and maintenance.               | U-13, U-19, U-23                                     |
| N-17 | The user wants checked TypeScript code and consistent source formatting.                                | U-20, U-21, U-22                                     |

U-01 through U-23 are the user decisions in [Design Section 2](design.md#2-scope-and-decisions). D-01 through D-19 are engineering decisions in that section.

## 3. Terminology register

Standard software terms and API identifiers keep their usual meanings. These definitions distinguish project-specific concepts.

| Term                   | Meaning                                                                                                      |
| ---------------------- | ------------------------------------------------------------------------------------------------------------ |
| appearance operation   | Completed color change, part selection, Undo, or Reset.                                                      |
| baseline               | Workspace value or absence recorded before first ownership.                                                  |
| canonical hex          | Lowercase solid color in `#rrggbb` form.                                                                     |
| configuration revision | One observed change to effective extension settings.                                                         |
| external edit          | Configuration change outside the active extension operation.                                                 |
| journal                | Stored snapshots and attempted writes used for recovery.                                                     |
| owned pair             | Foreground and background calculated together.                                                               |
| owned path             | Registered color key, optionally beneath an existing theme selector, with recorded prior and written values. |
| part                   | Selectable window region from Catalog S.                                                                     |
| participating window   | Instance with a valid unexpired record in the same coordination directory.                                   |
| preview                | Temporary appearance before a color choice completes.                                                        |
| primary color          | Saved workspace color used to calculate shades.                                                              |
| readback               | Configuration read used to verify an attempted write.                                                        |
| workspace identity     | Complete workspace URI, including its scheme and authority.                                                  |
| VSIX                   | VS Code extension package.                                                                                   |

## 4. Reference catalogs

### 4.1 Catalog P: Built-in presets

[`BUILTIN_PRESETS`](../src/domain/presets.ts) is the canonical catalog of 240 built-in names and values.
Names use understandable English. Names and canonical hex values are distinct within this catalog.
It includes Red, Dark red, Light red, Green, and Plum.
Choose Color displays the full catalog. Documentation refers to this source instead of copying the list.

### 4.2 Catalog S: Colored parts

| Part ID             | User label          | Default |
| ------------------- | ------------------- | ------- |
| `activityBar`       | Activity bar        | On      |
| `statusBar`         | Status bar          | On      |
| `titleBar`          | Title bar           | On      |
| `sashHover`         | Sash hover border   | On      |
| `editorGroupBorder` | Editor group border | Off     |
| `panelBorder`       | Panel border        | Off     |
| `sideBarBorder`     | Side bar border     | Off     |
| `statusBarBorder`   | Status bar border   | Off     |
| `titleBarBorder`    | Title bar border    | Off     |
| `tabActiveBorder`   | Active tab border   | Off     |
| `windowBorder`      | Window border       | Off     |

Activity bar color includes its normal badge and its supported top or bottom position. Title bar color includes the related Command Center colors.

The default activity bar shade is one Lighten step above the primary color. The default title bar and status bar use the primary color. Other listed borders use the primary color.

### 4.3 Catalog C: Commands

Each user title has the category `iroiro iro` in the Command Palette. The command IDs stay stable after release.

| Command ID                   | User title              | Result                                                                     |
| ---------------------------- | ----------------------- | -------------------------------------------------------------------------- |
| `iroiroIro.chooseColor`      | Choose Color            | Open the preset list.                                                      |
| `iroiroIro.enterHexColor`    | Enter Hex Color         | Open solid hex input.                                                      |
| `iroiroIro.randomColor`      | Random Color            | Select from generated candidates.                                          |
| `iroiroIro.randomPreset`     | Random Preset           | Select from available preset values.                                       |
| `iroiroIro.lighten`          | Lighten                 | Increase primary HSL lightness.                                            |
| `iroiroIro.darken`           | Darken                  | Decrease primary HSL lightness.                                            |
| `iroiroIro.savePreset`       | Save Current Color      | Add a named custom preset.                                                 |
| `iroiroIro.renamePreset`     | Rename Preset           | Change a custom preset name.                                               |
| `iroiroIro.editPreset`       | Edit Preset Color       | Change a custom preset value.                                              |
| `iroiroIro.deletePreset`     | Delete Preset           | Remove a custom preset.                                                    |
| `iroiroIro.chooseParts`      | Choose Colored Parts    | Select workspace parts from Catalog S.                                     |
| `iroiroIro.undo`             | Undo Color Change       | Restore the previous history entry.                                        |
| `iroiroIro.reset`            | Reset Workspace Colors  | Restore the baseline and suppress automatic assignment for this workspace. |
| `iroiroIro.enableAutoColor`  | Enable Automatic Color  | Enable assignment at the selected scope.                                   |
| `iroiroIro.disableAutoColor` | Disable Automatic Color | Disable assignment at the selected scope.                                  |
| `iroiroIro.openSettings`     | Open Settings           | Open the extension settings.                                               |
| `iroiroIro.retryRecovery`    | Retry Recovery          | Retry a failed restoration.                                                |

### 4.4 Profile T: Timing measurements

Profile T uses a desktop with at least four logical CPU cores, 8 GiB of memory, and an SSD. The test workspace contains at most 1,000 custom presets and 32 participating window records.

The host has no other user extension except the necessary remote extension. No debugger or profiler is active during timing measurements. The test records the exact operating system and VS Code versions.

Remote measurements use a round-trip delay of at most 100 ms and an established connection. Reconnection time is outside the measurement. A write failure is a separate failure case.

Each timing series contains 100 successful operations after five warm-up operations. The 95th percentile is the 95th value after ascending sort. Startup uses 20 fresh activations without warm-up and the largest measured value.

| Metric                    | Start                                        | End                                      | Limit                            |
| ------------------------- | -------------------------------------------- | ---------------------------------------- | -------------------------------- |
| Picker request            | Entry to the command handler                 | Call to show the populated native picker | 95th percentile at most 100 ms   |
| Local color operation     | Confirmed user input or random command entry | Successful settings readback             | 95th percentile at most 500 ms   |
| Remote color operation    | Confirmed user input or random command entry | Successful settings readback             | 95th percentile at most 2,000 ms |
| Local startup assignment  | Entry to `activate`                          | Successful settings readback             | Maximum 1,000 ms                 |
| Remote startup assignment | Entry to `activate`                          | Successful settings readback             | Maximum 3,000 ms                 |
| Pure color calculation    | Entry to the color calculation               | Returned result                          | 95th percentile at most 10 ms    |

Picker request time measures extension work, not the host's final display frame. Color operation time includes local coordination. Preview timing starts after its separate 100 ms debounce interval.

### 4.5 Matrix E: Environment verification

The minimum host version is VS Code 1.104.0. The second host version is the current stable version at release verification. The release record identifies the exact second version.

| Environment             | Required coverage                                                                                    |
| ----------------------- | ---------------------------------------------------------------------------------------------------- |
| Windows desktop         | Single folder and multiple-folder workspace on the minimum and current stable hosts.                 |
| macOS desktop           | Single folder and multiple-folder workspace on the minimum and current stable hosts.                 |
| Linux desktop           | Single folder and multiple-folder workspace on the minimum and current stable hosts.                 |
| Remote SSH              | Each desktop client with a Linux SSH workspace on the minimum and current stable hosts.              |
| WSL                     | Windows client with a WSL 2 Linux workspace on the minimum and current stable hosts.                 |
| Dev Containers          | Each desktop client with a Linux container workspace on the minimum and current stable hosts.        |
| Untitled workspace      | Two folders, color selection, save as a workspace file, and reopen on each desktop operating system. |
| Theme kinds             | Light, dark, high contrast dark, and high contrast light on each desktop operating system.           |
| Activity bar location   | Side, top, and bottom positions that the applicable host supports.                                   |
| Windows border          | VS Code 1.104 or later with `window.border` set to `default` on a supported Windows host.            |
| macOS and Linux borders | Custom title bar with active and inactive windows.                                                   |
| Native title bar        | Correct limitation message and operation of other selected parts.                                    |
| Restricted Mode         | Manual color selection and optional automatic assignment without workspace code execution.           |

Browser clients, empty windows, and VS Code forks are outside the environment matrix. Experimental Modern UI is outside visual support until its affected color tokens pass direct verification.

### 4.6 Catalog D: Implementation documents

Keep each reference in one place. Guides link to source or configuration files when readers need the complete data.

| Document                | Path                                     | Required content                                                                                                                            | Package |
| ----------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| Readme                  | `README.md`                              | Purpose, supported hosts, VSIX-first installation, quick start, and guide links.                                                            | Yes     |
| Installation            | `docs/install.md`                        | Release and source paths, verification, offline use, remote placement, updates, and removal.                                                | Yes     |
| User guide              | `docs/user-guide.md`                     | All commands, preview, persistence, presets, automatic and random colors, parts, Undo, and Reset.                                           | Yes     |
| Settings                | `docs/settings.md`                       | Keys, types, defaults, scopes, accepted values, invalid-input behavior, and valid JSON examples.                                            | Yes     |
| Troubleshooting         | `docs/troubleshooting.md`                | Host limits, configuration and recovery failures, installation, logs, issue reports, and manual removal.                                    | Yes     |
| Contributor guide       | `CONTRIBUTING.md`                        | Prerequisites, source commands, tests, dependency review, packaging, and release checks.                                                    | No      |
| Code quality            | `docs/code-quality.md`                   | Configuration links, coding boundaries, quality commands, and rule exceptions.                                                              | No      |
| Changelog               | `CHANGELOG.md`                           | Dated user-visible changes and compatibility limits.                                                                                        | Yes     |
| Build tools             | `docs/build-tools.md`                    | Approved tool policy, dependency review steps, and unresolved concerns.                                                                     | No      |
| Release record          | `docs/releases/<version>.md`             | Candidate or release status, evidence references, requirement results, and remaining checks. A linked CSV can hold the requirement results. | No      |
| Design and requirements | `docs/design.md`, `docs/requirements.md` | Behavior, decisions, interfaces, and stable testable obligations.                                                                           | No      |

Packaged instructions use complete text and local assets. Images need text alternatives.
Identify planned behavior and user-supplied command values.
Exact tool versions and dependency metadata stay in the manifest and lockfile. Generated test results record their own environment and artifact identity.

## 5. Verification methods

| Code | Method        | Evidence                                                    |
| ---- | ------------- | ----------------------------------------------------------- |
| I    | Inspection    | Configuration, package, document, or code examination.      |
| A    | Analysis      | Calculation or comparison against defined reference data.   |
| T    | Test          | Controlled inputs with recorded output and state.           |
| D    | Demonstration | Recorded user flow or visual result in the applicable host. |

Each row below contains a pass condition. The verification record identifies its test case, environment, result, date, and evidence location.

## 6. Product requirements

### 6.1 Platform and scope

| ID      | Requirement                                                                                  | Source           | Rationale                                     | Verification and pass condition                                                                |
| ------- | -------------------------------------------------------------------------------------------- | ---------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| PLT-001 | The extension must operate in each desktop environment in Matrix E.                          | N-08, D-01       | Desktop coverage.                             | D: Each applicable flow passes on the minimum and current stable hosts.                        |
| PLT-002 | The extension must operate in each remote environment in Matrix E.                           | N-08, D-02       | Remote workspace coverage.                    | D: Color selection, persistence, preview cancellation, and Reset pass for each remote row.     |
| PLT-003 | The extension must run in the local UI extension host.                                       | N-08, D-02       | Local window coordination.                    | I, T: The manifest declares UI kind and each remote session reports a local UI host.           |
| PLT-004 | The extension must reject workspace color operations when no folder workspace is open.       | N-08, U-08       | Defined scope boundary.                       | T: An empty window receives a folder message and zero color writes.                            |
| PLT-005 | The extension must use one saved primary color for a workspace with multiple folders.        | N-02, N-07       | One identity per workspace window.            | T: Two folders use one workspace color without folder-level color writes.                      |
| PLT-006 | The extension must use the complete workspace URI as the workspace identity source.          | N-02, N-09, D-07 | Separate folders and remote authorities.      | T: Equal URIs have equal keys. Different schemes or authorities have different source strings. |
| PLT-007 | The extension must execute appearance operations in Restricted Mode.                         | N-08, D-02       | Appearance changes do not use workspace code. | D: Manual and enabled automatic operations pass without a trust prompt from this extension.    |
| PLT-008 | The extension must keep one saved color across windows that use the same workspace settings. | N-02             | Stable project identity.                      | T: A saved change appears in a second window that reads the same settings.                     |

### 6.2 Hex input and primary color

| ID      | Requirement                                                                         | Source     | Rationale                                      | Verification and pass condition                                                                      |
| ------- | ----------------------------------------------------------------------------------- | ---------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| COL-001 | The extension must accept three-digit solid hex input.                              | N-05       | Short-code support.                            | T: `#aaa` becomes `#aaaaaa`.                                                                         |
| COL-002 | The extension must accept six-digit solid hex input.                                | N-05       | Full RGB input.                                | T: `#123456` keeps its channel values.                                                               |
| COL-003 | The extension must accept solid hex input without a leading number sign.            | N-05, D-03 | Short input flow.                              | T: `abc` and `aabbcc` become `#aabbcc`.                                                              |
| COL-004 | The extension must remove surrounding whitespace from hex input before validation.  | N-05, D-03 | Reliable pasted input.                         | T: Spaces and line breaks around `#abc` give `#aabbcc`.                                              |
| COL-005 | The extension must accept uppercase hex digits.                                     | N-05       | Equivalent hex forms.                          | T: `#ABC` and `#AABBCC` give `#aabbcc`.                                                              |
| COL-006 | The extension must store each primary color as canonical hex.                       | N-02, N-05 | One persistent representation.                 | T: Each accepted input gives a lowercase `#rrggbb` value.                                            |
| COL-007 | The extension must reject input outside the solid hex grammar.                      | N-05, U-14 | Defined input domain.                          | T: Empty text, `#abcd`, `#aabbccdd`, `#ggg`, names, and color functions cause zero new color writes. |
| COL-008 | The extension must show an inline explanation for invalid hex input.                | N-05, N-06 | Correction in the input flow.                  | D: The Input Box stays open and identifies the three-digit and six-digit forms.                      |
| COL-009 | The extension must derive the selected part colors from one primary color.          | N-01, U-04 | Consistent workspace identity.                 | A, T: The surface map uses only the primary value, its specified shades, and calculated foregrounds. |
| COL-010 | The extension must keep the selected primary color after a shade preference change. | N-02, N-07 | Preferences do not replace workspace identity. | T: A bar adjustment changes its rendered shade while the saved primary value stays equal.            |
| COL-011 | The extension must keep the selected primary color after a theme change.            | N-02       | Stable identity across themes.                 | T: Each theme transition keeps `iroiroIro.color` unchanged.                                          |

### 6.3 Presets

| ID      | Requirement                                                                           | Source     | Rationale                                     | Verification and pass condition                                                                  |
| ------- | ------------------------------------------------------------------------------------- | ---------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| PRE-001 | The extension must include each built-in preset in Catalog P.                         | N-04, D-04 | Common color availability.                    | I, T: All 240 names and values match the catalog.                                                |
| PRE-002 | The extension must show each preset with its name and canonical hex value.            | N-04, N-06 | Selection without color recognition alone.    | D: Each visible preset has the two text fields.                                                  |
| PRE-003 | The extension must let the user save the current primary color as a custom preset.    | N-04       | Reuse of custom and random colors.            | T: A named current value appears in the user preset list after restart.                          |
| PRE-004 | The extension must let the user rename a custom preset.                               | N-04, D-04 | Preset maintenance.                           | T: The new name replaces the selected name and keeps its color value unchanged.                  |
| PRE-005 | The extension must let the user replace a custom preset's hex value.                  | N-04, D-04 | Preset maintenance.                           | T: Valid replacement input changes only the selected custom value.                               |
| PRE-006 | The extension must let the user delete a custom preset.                               | N-04, D-04 | Preset maintenance.                           | T: Only the selected custom entry disappears.                                                    |
| PRE-007 | The extension must reject custom preset names outside the defined name rules.         | N-04, D-04 | Unique, usable names.                         | T: Blank, control-character, duplicate, and 65-code-point names cause zero preset writes.        |
| PRE-008 | The extension must keep built-in presets outside custom preset modification commands. | N-04, D-04 | Stable common palette.                        | T: Rename, Edit, and Delete offer only custom entries.                                           |
| PRE-009 | The extension must store custom presets in user settings.                             | N-04, D-04 | Reuse across workspaces in the profile.       | T: Two projects in one profile see the same saved custom entry.                                  |
| PRE-010 | The extension must keep workspace assignments unchanged when a preset changes.        | N-02, N-04 | Saved values stay stable.                     | T: Rename, Edit, and Delete leave existing workspace primary colors equal.                       |
| PRE-011 | The extension must accept up to 1,000 valid custom presets.                           | N-04, D-12 | Defined capacity.                             | T: Entry 1,000 succeeds. An attempted additional entry shows a capacity message without a write. |
| PRE-012 | The extension must exclude each invalid custom preset entry from selection.           | N-04, D-04 | A bad entry does not invalidate good entries. | T: Mixed valid and invalid settings keep the valid entries with one diagnostic per revision.     |

### 6.4 Commands and previews

| ID     | Requirement                                                                                                                   | Source           | Rationale                                           | Verification and pass condition                                                                     |
| ------ | ----------------------------------------------------------------------------------------------------------------------------- | ---------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| UX-001 | The extension must make each command in Catalog C available through the Command Palette.                                      | N-06, D-03       | Command discovery.                                  | I, D: Each catalog ID has its stated title and can be invoked from the palette.                     |
| UX-002 | The extension must show built-in and valid custom presets in one Choose Color list.                                           | N-04, N-06       | One selection flow.                                 | D: One picker contains Catalog P followed by custom entries in name order.                          |
| UX-003 | The extension must filter the preset list by name or canonical hex text.                                                      | N-04, N-06       | Fast lookup.                                        | T: Queries `plum` and `dda0dd` find Plum. Search does not add a preset.                             |
| UX-004 | The extension must enable live preview by default.                                                                            | N-10, U-14       | Approved preview behavior.                          | I, T: A clean configuration enables preview.                                                        |
| UX-005 | With preview enabled, the extension must preview a valid color after a 100 ms debounce interval.                              | N-10, D-03       | Useful previews with bounded writes.                | T: A fixed clock gives no preview before 100 ms and queues the latest valid value at that boundary. |
| UX-006 | When Escape cancels a picker, the extension must restore the pre-picker appearance through the conditional restoration rules. | N-10, N-11       | Safe exploration.                                   | T: Each unchanged owned value returns to its snapshot value after pending writes stop.              |
| UX-007 | When a picker closes without acceptance, the extension must cancel its preview.                                               | N-10, N-11       | Consistent dismissal behavior.                      | T: Focus loss and workspace closure use the cancellation path.                                      |
| UX-008 | When the user accepts a valid color, the extension must save that color as the workspace primary color.                       | N-02, N-05       | Explicit selection persistence.                     | T: Enter completes the selected value and reopen restores that value.                               |
| UX-009 | During a preview, the extension must keep the saved primary color unchanged.                                                  | N-02, N-10       | A preview is temporary.                             | T: `iroiroIro.color` stays equal through each preview step.                                         |
| UX-010 | The extension must exclude preview steps from Undo history.                                                                   | N-10, N-11, D-09 | One Undo entry per accepted change.                 | T: Ten preview movements followed by acceptance give one history entry.                             |
| UX-011 | The extension must discard superseded preview requests before their settings writes start.                                    | N-10, D-12       | Latest input has priority.                          | T: Rapid input leaves only the latest pending request after the active write.                       |
| UX-012 | The extension must prevent overlapping appearance writes in one extension instance.                                           | N-10, N-11, D-08 | Predictable operation order.                        | T: Controlled concurrent commands give at most one active settings write.                           |
| UX-013 | With preview disabled, the extension must defer color writes until the user accepts a color.                                  | N-10, D-03       | Explicit preview control.                           | T: Picker movement causes zero writes before Enter.                                                 |
| UX-014 | The extension must show the committed primary color as text in its enabled status bar item.                                   | N-01, N-06, D-03 | Workspace identity without color recognition alone. | D: The item contains canonical hex and an available matching preset name.                           |
| UX-015 | The extension must let the user hide its status bar item.                                                                     | N-06, D-03       | User control of the interface.                      | T: The disabled preference removes the item while palette commands stay available.                  |
| UX-016 | The extension must keep a color selection in one picker after command invocation.                                             | N-01, N-06, D-03 | Bounded interaction count.                          | D: Choose Color uses one list acceptance. Enter Hex Color uses one input acceptance.                |

### 6.5 Automatic assignment

| ID      | Requirement                                                                                                  | Source     | Rationale                                       | Verification and pass condition                                                                        |
| ------- | ------------------------------------------------------------------------------------------------------------ | ---------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| AUT-001 | The extension must disable automatic assignment by default.                                                  | N-03, U-03 | User opt-in.                                    | T: A fresh installation writes no initial workspace color.                                             |
| AUT-002 | The extension must let the user enable automatic assignment at user or workspace scope.                      | N-03       | Global default and project control.             | T: The command writes only the scope that the user selects.                                            |
| AUT-003 | The extension must let the user disable automatic assignment at user or workspace scope.                     | N-03       | Reversible opt-in.                              | T: The command writes only the selected scope and keeps a saved primary color.                         |
| AUT-004 | The extension must give the workspace automatic assignment preference priority over the user default.        | N-03, D-10 | Per-workspace control.                          | T: Workspace `false` overrides user `true`. Workspace `true` overrides user `false`.                   |
| AUT-005 | For an eligible uncolored workspace, the extension must assign a color when automatic assignment is enabled. | N-03       | Startup convenience.                            | T: Startup and an enabling preference change each assign one color through the same eligibility rules. |
| AUT-006 | The extension must offer preset and generated sources for automatic assignment.                              | N-03, U-03 | The selected source is a user choice.           | T: Each source value uses its stated candidate pool.                                                   |
| AUT-007 | The extension must use the preset source as the automatic assignment default.                                | N-03, D-04 | Predictable initial palette.                    | I, T: A clean enabled configuration selects from preset values.                                        |
| AUT-008 | The extension must give a valid saved primary color priority over automatic assignment.                      | N-02, N-03 | Stable reopened projects.                       | T: Reopen uses the saved color without a random selection call.                                        |
| AUT-009 | The extension must keep a nonempty invalid saved color unchanged until an explicit correction or Reset.      | N-02, D-08 | Invalid data is not permission for replacement. | T: Startup reports the invalid value without automatic replacement.                                    |
| AUT-010 | The extension must keep the committed color unchanged during window focus changes.                           | N-02       | Focus is not a new workspace.                   | T: Repeated focus changes give zero random selections.                                                 |
| AUT-011 | The extension must keep the committed color unchanged during remote reconnection.                            | N-02, N-08 | Reconnection is not a new assignment.           | T: Disconnect and reconnect keep the stored primary value.                                             |
| AUT-012 | The extension must complete automatic assignment without a color selection prompt.                           | N-03       | Unattended initial selection.                   | D: Enabled startup uses no picker or Input Box.                                                        |

### 6.6 Random colors

| ID      | Requirement                                                                                                                              | Source           | Rationale                                              | Verification and pass condition                                                           |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| RND-001 | Random Preset must select from the unique values of built-in and valid custom presets.                                                   | N-04, N-09       | Complete palette without duplicate weighting.          | T: The candidate pool equals the deduplicated preset value set.                           |
| RND-002 | Random Color must select from generated solid color candidates.                                                                          | N-01, N-09       | Random colors beyond the named palette.                | T: A fixed random source gives valid canonical values from the specified HSL ranges.      |
| RND-003 | A manual random command must exclude the current primary color when its pool contains a different value.                                 | N-01, N-09       | A requested change gives a different value.            | T: A pool with a current value and one alternative selects the alternative.               |
| RND-004 | The extension must enable the color difference preference by default.                                                                    | N-09, U-10       | Different workspace identities.                        | I, T: A clean configuration enables the preference.                                       |
| RND-005 | With the difference preference enabled, random selection must prefer candidates at least 0.10 OKLab units from each participating color. | N-09, D-07       | Defined separation target.                             | T: A fixed candidate set selects only qualifying candidates when that set is nonempty.    |
| RND-006 | Without a qualifying candidate, random selection must maximize the minimum distance from participating colors.                           | N-09, D-07       | Defined behavior when colors are crowded.              | T: A fixed crowded palette selects a candidate with the largest minimum distance.         |
| RND-007 | Random selection must ignore window records for the current workspace identity.                                                          | N-02, N-09       | One project keeps one identity.                        | T: Additional same-workspace records do not change the other-workspace comparison set.    |
| RND-008 | Random selection must ignore invalid or expired window records.                                                                          | N-09, D-07       | Reliable coordination input.                           | T: Malformed data and records aged 90 seconds or more do not affect selection.            |
| RND-009 | When coordination fails, the extension must select from the available local candidates.                                                  | N-01, N-09, D-07 | Color changes stay available.                          | T: Read, write, and timeout failures return a candidate without waiting for peers.        |
| RND-010 | The extension must limit coordination waits to 250 ms per random operation.                                                              | N-01, D-12       | Bounded command delay.                                 | T: A fixed clock and stalled peers give at most 250 ms of coordination waits.             |
| RND-011 | Random selection must keep colors saved by other workspaces unchanged.                                                                   | N-02, N-09       | Difference preference does not override saved choices. | T: Crowded palettes and reservation conflicts cause zero writes to a different workspace. |

### 6.7 Shades and readability

| ID      | Requirement                                                                                                             | Source     | Rationale                                   | Verification and pass condition                                                                          |
| ------- | ----------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| ADJ-001 | Lighten must increase primary HSL lightness by the configured step, up to 100 percent.                                  | N-06, D-05 | Defined Lighten behavior.                   | A, T: Hue and saturation stay equal before conversion. Lightness uses `min(100, L + step)`.              |
| ADJ-002 | Darken must decrease primary HSL lightness by the configured step, down to zero percent.                                | N-06, D-05 | Defined Darken behavior.                    | A, T: Hue and saturation stay equal before conversion. Lightness uses `max(0, L - step)`.                |
| ADJ-003 | The extension must use five percentage points as the default adjustment step.                                           | N-06, D-05 | Small default changes.                      | T: Lighten changes black to `#0d0d0d` at the default step.                                               |
| ADJ-004 | The extension must accept integer adjustment steps from 1 through 10 percentage points.                                 | N-06, D-05 | Bounded user adjustment.                    | T: Each integer is permitted. Zero, 11, fractions, and nonnumbers use the invalid preference path.       |
| ADJ-005 | The extension must treat an unchanged canonical adjustment result as a no-op.                                           | N-06, D-09 | No unnecessary settings or history changes. | T: Darken on black and Lighten on white give zero writes and zero history entries.                       |
| ADJ-006 | The extension must use the selected foreground with the larger black-or-white contrast ratio for each owned background. | N-01, D-06 | Defined foreground selection.               | A: Reference luminance vectors select the expected foreground. Equal ratios select black.                |
| ADJ-007 | Each owned text pair must have a contrast ratio of at least 4.5:1.                                                      | N-01, D-06 | Text readability on selected backgrounds.   | A, T: Each built-in color and RGB boundary vector meets the ratio after rendering calculations.          |
| ADJ-008 | The extension must keep global high contrast border settings unchanged.                                                 | N-01, D-11 | Theme accessibility indicators.             | T: The write set excludes `contrastBorder` and `contrastActiveBorder` after high contrast theme changes. |

### 6.8 Colored parts

| ID      | Requirement                                                                                             | Source           | Rationale                                      | Verification and pass condition                                                                                |
| ------- | ------------------------------------------------------------------------------------------------------- | ---------------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| SUR-001 | The extension must offer each part in Catalog S as an independent selection.                            | N-07             | Explicit surface control.                      | D: Each listed part can be selected or deselected without a different part selection.                          |
| SUR-002 | The extension must use the default part selections in Catalog S.                                        | N-07, U-07       | Defined default colored parts.                 | T: A clean configuration selects exactly the four On entries.                                                  |
| SUR-003 | The extension must use the Catalog S default shades.                                                    | N-01, N-07, U-07 | Defined shade relationship.                    | T: The activity bar uses one lighter step. The title and status bars use the primary value.                    |
| SUR-004 | The extension must let the user select none, lighten, or darken for each bar adjustment.                | N-07, D-05       | Shades without independent primary colors.     | T: Each mode operates independently for activity, title, and status bars.                                      |
| SUR-005 | When a part is deselected, the extension must conditionally restore that part's owned paths.            | N-07, N-11, D-08 | Deselect releases the part.                    | T: Unchanged owned values return to their baselines. The writer removes these paths from its ownership record. |
| SUR-006 | The extension must limit its color writes to paths in the surface registry.                             | N-07, D-08       | Bounded effect on the interface.               | I, T: Each prepared color path belongs to Design Section 10, including permitted theme selectors.              |
| SUR-007 | The extension must keep the theme's debugger, error, warning, and remote indicator colors unchanged.    | N-01, D-11       | State indicators keep their meaning.           | T: The write set excludes the state keys identified in Design Section 10.                                      |
| SUR-008 | The extension must keep the user's part preferences when the host cannot display a selected part color. | N-07, N-08       | Portable configuration.                        | T: Native title bars and hidden regions do not remove stored selections.                                       |
| SUR-009 | The extension must explain each known host restriction in the affected part control.                    | N-07, N-08       | Understandable partial appearance.             | D: Native title bar, border, and known Modern UI restrictions have specific descriptions.                      |
| SUR-010 | The extension must keep host layout settings unchanged during color operations.                         | N-07, D-08       | A color command does not change window layout. | T: Title bar style, window border mode, and experimental settings stay equal.                                  |

### 6.9 Persistence and settings integrity

| ID      | Requirement                                                                                                                          | Source           | Rationale                                                       | Verification and pass condition                                                                          |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------ | ---------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| DAT-001 | The extension must write primary colors at workspace scope.                                                                          | N-02, U-06       | Project persistence without global color changes.               | T: A single folder uses its settings file. A multiple-folder workspace uses its workspace configuration. |
| DAT-002 | The extension must keep global workbench color values unchanged during workspace appearance operations.                              | N-02, D-08       | Other projects keep their user defaults.                        | T: Global `workbench.colorCustomizations` stays equal before and after each appearance command.          |
| DAT-003 | On reopen, the extension must restore the valid saved primary color when its owned settings have no external conflict.               | N-02, N-11       | Stable appearance with protection for external edits.           | D: Reopen restores the saved primary value and selected shades in each applicable Matrix E environment.  |
| DAT-004 | Each prepared color update must keep unrelated entries from the latest workspace configuration read unchanged.                       | N-11, D-08       | Bounded settings changes.                                       | T: Sentinel entries at the top level and in theme selectors stay equal in the prepared update.           |
| DAT-005 | Before its first write to a path, the extension must record that path's prior presence and value.                                    | N-11, D-08       | Correct restoration of missing and existing values.             | T: Fault injection confirms a durable baseline before the first configuration write.                     |
| DAT-006 | The extension must keep the original path baseline across completed color changes.                                                   | N-11, D-08       | Reset returns to the initial appearance.                        | T: Three accepted colors keep the baseline from before the first change.                                 |
| DAT-007 | The extension must restore an owned path only while its current value matches a recorded extension write.                            | N-11, D-08       | Later external values have priority.                            | T: A changed external value survives cancellation, Undo, Reset, and crash recovery.                      |
| DAT-008 | When an owned path was originally absent, restoration must remove its unchanged extension value.                                     | N-11, D-08       | Restore absence, not an invented theme value.                   | T: The path becomes absent. Other paths stay equal.                                                      |
| DAT-009 | The extension must write selected color values into workspace overrides for existing theme selectors that contain the selected keys. | N-07, N-11, D-08 | Theme-specific values do not hide the selected workspace color. | T: User-only and workspace selectors receive selected key overrides at workspace scope.                  |
| DAT-010 | The extension must record each attempted write before it sends that write to VS Code.                                                | N-11, D-08       | Recovery across a process interruption.                         | T: Termination after each write boundary leaves enough data to recognize the attempted values.           |
| DAT-011 | The extension must verify intended settings values through readback before it reports operation success.                             | N-02, N-11, D-08 | No false success state.                                         | T: Mismatched readback causes failure recovery and no success state.                                     |
| DAT-012 | When an owned value changes externally, the extension must suspend automatic reapplication for its affected part.                    | N-11, D-08       | Prevent repeated replacement of a different writer's value.     | T: External edits stop automatic writes for that part until an explicit color choice.                    |
| DAT-013 | The extension must use documented defaults for invalid scalar preferences.                                                           | N-01, D-04       | Predictable behavior after a bad settings edit.                 | T: Wrong types and out-of-range values use the default table with one diagnostic per revision.           |
| DAT-014 | The extension must validate recovery data before it uses that data for a settings write.                                             | N-11, D-08       | Recovery data cannot authorize arbitrary paths.                 | T: Unknown versions, paths, types, and oversized records cause zero recovery writes.                     |
| DAT-015 | The extension must report a workspace settings write failure with an applicable recovery action.                                     | N-02, N-11       | The user can correct a failed operation.                        | D: Read-only, invalid JSON, and disconnected cases offer the actions in Design Section 11.               |
| DAT-016 | The extension must ignore workspace-level custom preset settings.                                                                    | N-04, D-04       | The custom preset list has user scope.                          | T: A workspace preset override does not replace or extend the user preset list.                          |

### 6.10 Undo, Reset, and recovery

| ID      | Requirement                                                                                               | Source           | Rationale                                                         | Verification and pass condition                                                                      |
| ------- | --------------------------------------------------------------------------------------------------------- | ---------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| RES-001 | Undo Color Change must restore the previous completed appearance entry through conditional restoration.   | N-11, D-09       | Recover the last user appearance operation.                       | T: Color, part, and Reset histories return to their previous stored states.                          |
| RES-002 | The extension must keep the 20 most recent appearance history entries in the current window session.      | N-11, D-09       | Defined Undo depth.                                               | T: After 21 changes, 20 entries stay in order and the oldest entry is unavailable.                   |
| RES-003 | The extension must clear Undo history after an external workspace appearance change.                      | N-11, D-09       | Undo does not cross an external edit.                             | T: An external color or effective appearance preference change clears the Undo entries.              |
| RES-004 | Reset Workspace Colors must conditionally restore recorded baseline values for owned paths.               | N-11, D-08       | Recover the pre-extension appearance where the baseline is known. | T: Original values and original absence return when the current values still match extension writes. |
| RES-005 | Reset Workspace Colors must remove the workspace primary color setting.                                   | N-02, N-11, D-10 | The workspace returns to an uncolored assignment state.           | T: `inspect().workspaceValue` for `iroiroIro.color` becomes undefined.                               |
| RES-006 | Reset Workspace Colors must disable automatic assignment at workspace scope.                              | N-03, N-11, D-10 | Reset survives the next startup.                                  | T: Reopen after Reset does not select a different automatic color.                                   |
| RES-007 | Reset Workspace Colors must keep the user's custom presets unchanged.                                     | N-04, N-11       | Appearance recovery does not remove reusable colors.              | T: The user preset array stays equal after Reset.                                                    |
| RES-008 | On activation, the extension must recover an incomplete appearance operation before automatic assignment. | N-03, N-11, D-08 | Startup does not build on an unfinished preview.                  | T: Each incomplete journal phase enters recovery before a random selection call.                     |
| RES-009 | After failed restoration, the extension must keep its recovery journal.                                   | N-11, D-08       | A later attempt can complete recovery.                            | T: A write failure during restoration keeps the journal available after restart.                     |
| RES-010 | Retry Recovery must retry the saved conditional restoration.                                              | N-11, D-08       | Explicit recovery after a corrected failure.                      | T: After the user restores file access, the pending recovery completes.                              |
| RES-011 | During its deactivate callback, the extension must request cancellation of an active preview.             | N-10, N-11, D-08 | Decrease temporary settings after disable.                        | T: The callback invokes cancellation before disposal completes.                                      |
| RES-012 | The user documentation must explain color removal before extension uninstall.                             | N-11, D-08       | Uninstall does not guarantee extension cleanup.                   | I: The instructions include Reset and the manual fallback for saved settings.                        |

### 6.11 Quality constraints

| ID      | Requirement                                                                                       | Source           | Rationale                                    | Verification and pass condition                                                                 |
| ------- | ------------------------------------------------------------------------------------------------- | ---------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| QUA-001 | Each command flow in Catalog C must accept keyboard input for each user action.                   | N-06, D-03       | Keyboard access.                             | D: Each flow completes without mouse input.                                                     |
| QUA-002 | Each extension input control must have a descriptive text label.                                  | N-06, D-03       | Screen reader access.                        | D: The screen reader announces the control purpose and the selected name or value.              |
| QUA-003 | The extension must meet the picker request limit in Profile T.                                    | N-01, D-12       | Fast command entry.                          | T: The recorded 95th percentile is at most 100 ms.                                              |
| QUA-004 | The extension must meet the local color operation limit in Profile T.                             | N-01, D-12       | Fast local changes.                          | T: The recorded 95th percentile is at most 500 ms.                                              |
| QUA-005 | The extension must meet the remote color operation limit in Profile T.                            | N-01, N-08, D-12 | Fast changes with remote settings.           | T: The recorded 95th percentile is at most 2,000 ms.                                            |
| QUA-006 | The extension must meet each startup assignment limit in Profile T.                               | N-01, N-03, D-12 | Bounded initial extension work.              | T: The largest local result is at most 1,000 ms. The largest remote result is at most 3,000 ms. |
| QUA-007 | The color engine must meet the pure calculation limit in Profile T.                               | N-01, D-12       | Bounded calculation work.                    | T: The recorded 95th percentile is at most 10 ms for each color operation.                      |
| QUA-008 | The extension must complete local color operations without an outbound extension network request. | N-01, D-07       | Offline local use.                           | I, T: Network instrumentation records zero extension requests during the local command suite.   |
| QUA-009 | The extension must keep product telemetry disabled.                                               | N-01, D-07       | No external usage service is necessary.      | I, T: The package has no telemetry sender and the command suite emits no telemetry.             |
| QUA-010 | The extension must limit workspace data access to configuration and extension state.              | N-08, D-02       | Source files are unnecessary for appearance. | I, T: Instrumented flows read no source file and start no workspace process.                    |
| QUA-011 | The extension must exclude workspace paths and custom preset names from default diagnostic logs.  | N-08, D-07       | Limit unnecessary identifying data.          | T: Failure fixtures containing sentinel paths and names give no matching log text.              |
| QUA-012 | During idle operation, the extension must make zero recurring workspace configuration writes.     | N-01, D-07       | No settings churn from coordination.         | T: Ten idle minutes contain local record heartbeats but zero workspace writes.                  |
| QUA-013 | The release package must install as a VSIX on the minimum supported VS Code host.                 | N-08, D-01       | Installable extension delivery.              | T: A clean minimum-version profile installs the VSIX and discovers the catalog commands.        |
| QUA-014 | The release record must trace each requirement ID to a verification result.                       | N-12, U-13       | Reviewable evidence.                         | I: Each ID has a result, environment, date, and evidence location.                              |

### 6.12 Dependencies

| ID      | Requirement                                                                                          | Source                 | Rationale                                                       | Verification and pass condition                                                                                                                             |
| ------- | ---------------------------------------------------------------------------------------------------- | ---------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DEP-001 | The installed extension must contain no third-party runtime package.                                 | N-13, U-16             | Small runtime dependency scope.                                 | I: The manifest, import graph, and package contain no external, combined, or copied third-party runtime package.                                            |
| DEP-002 | Local color operations must use only programs supplied by VS Code and its host operating system.     | N-13, U-16             | No separate runtime or command-line tool.                       | D: The command suite passes in a profile without additional Node.js, npm, Git, or build-tool installations.                                                 |
| DEP-003 | The extension must declare no required companion extension.                                          | N-13, U-16             | Independent local installation.                                 | I, D: The manifest has no `extensionDependencies` or `extensionPack` entries. Local use passes with no other user extension enabled.                        |
| DEP-004 | Project development dependencies must use only the approved direct tools in Contract B.              | N-14, U-17, U-21, U-22 | Explicit tool scope.                                            | I, T: The manifest and dependency check reject an additional direct package.                                                                                |
| DEP-005 | The lockfile must record the full build-tool dependency tree at exact versions.                      | N-14, U-17             | Review includes indirect packages.                              | I, T: Each selected direct, transitive, and optional package has its resolved version, source, and integrity value.                                         |
| DEP-006 | The documented dependency installation must disable package lifecycle scripts.                       | N-14, D-14             | Installation does not automatically execute dependency scripts. | I, T: Setup uses `npm ci --ignore-scripts`. An installation trace contains zero package lifecycle script executions.                                        |
| DEP-007 | The VSIX must contain all project code, preset data, and assets required for local color operations. | N-13, U-16             | Complete offline package.                                       | I, T: Required runtime resources resolve in the package or host APIs. Offline command checks have no missing resource.                                      |
| DEP-008 | Each build-tool dependency change must have a recorded review of the resulting dependency tree.      | N-14, U-17             | Review survives tool updates.                                   | I: The change reviews the lockfile diff, advisories, and installation scripts before package code executes. Decisions and unresolved concerns are recorded. |

### 6.13 Build and package creation

| ID      | Requirement                                                                                                 | Source                 | Rationale                                                      | Verification and pass condition                                                                                                  |
| ------- | ----------------------------------------------------------------------------------------------------------- | ---------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| BLD-001 | The repository must supply each command in Contract B.                                                      | N-14, N-15, D-14       | A defined source workflow.                                     | I, T: Each command has its specified result and exit behavior from a clean source checkout.                                      |
| BLD-002 | Source compilation and packaging must use only the prerequisites in Contract B.                             | N-14, N-15, D-14       | No undocumented global tool.                                   | T: The source flow passes on Windows, macOS, and Linux without a globally installed compiler, packager, or test framework.       |
| BLD-003 | TypeScript compilation must use the compiler constraints in Contracts B and Q.                              | N-14, N-17, D-13, D-17 | Checked source with no runtime helper package.                 | I, T: Compiler configuration matches the contracts. A type error prevents new JavaScript output.                                 |
| BLD-004 | A failed package prerequisite check must prevent creation of a new candidate VSIX.                          | N-12, N-15, N-17, D-14 | Failed checks cannot supply a release candidate.               | T: A failed type, lint, format, unit-test, document, or build check gives a nonzero result and no new VSIX.                      |
| BLD-005 | The package command must include only the release files in Contract B.                                      | N-13, N-15, D-14       | Bounded package contents.                                      | I, T: Archive entries match the file list. Development dependencies, tests, caches, and source-control data are absent.          |
| BLD-006 | Each offline build command in Contract B must complete with network access disabled after dependency setup. | N-13, N-14, D-14       | Local build independence.                                      | T: The listed commands pass with locked tools installed and network access disabled.                                             |
| BLD-007 | The integration test command must use the supplied VS Code executable in a separate test profile.           | N-08, N-12, D-13       | Reproducible host selection without personal settings changes. | T: The runner records the selected version and uses temporary profile and workspace paths. A failed test gives a nonzero result. |
| BLD-008 | The document check command must identify the reference mismatches defined in Contract B.                    | N-12, N-16, D-15       | Documentation matches the implemented interface.               | T: A wrong command ID, setting default, invalid preset, invalid JSON, or broken internal link gives a nonzero result.            |

### 6.14 GitHub delivery and installation

| ID      | Requirement                                                                              | Source           | Rationale                                        | Verification and pass condition                                                                                                         |
| ------- | ---------------------------------------------------------------------------------------- | ---------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| DEL-001 | The release workflow must attach the tested VSIX to each published GitHub Release.       | N-15, U-18       | Primary installation source.                     | I, T: Publishing a release or pre-release runs the package gates and attaches the matching VSIX only after they pass.                   |
| DEL-002 | The same release VSIX must install in each desktop environment in Matrix E.              | N-08, N-15, U-18 | One user download for supported desktops.        | D: The same asset hash passes installation and command discovery on the minimum and current stable hosts.                               |
| DEL-003 | A downloaded release VSIX must install without network access or additional build tools. | N-13, N-15, U-18 | Simple offline installation.                     | D: Graphical installation succeeds on a clean host without additional Node.js, npm, or Git installations while the network is disabled. |
| DEL-004 | The documented source path must give an installable VSIX from its stated release tag.    | N-15, U-18       | Supported secondary installation path.           | D: A clean checkout follows the guide and produces a package with the same extension ID and version as that release.                    |
| DEL-005 | Each release must use the version relationships in Contract B.                           | N-15, D-14       | Source and package identification.               | I, T: The tag, manifest, filename, changelog, and release record identify the same version.                                             |
| DEL-006 | Each GitHub Release must supply a SHA-256 checksum for its VSIX asset.                   | N-15, D-14       | Exact artifact comparison.                       | T: The `SHA256SUMS` entry equals the downloaded asset's calculated SHA-256 value.                                                       |
| DEL-007 | Installing a newer release must keep saved extension settings unchanged.                 | N-02, N-15, U-18 | Updates keep workspace identity and preferences. | T: An upgrade fixture keeps the saved primary color, user presets, selected parts, and automatic assignment settings after activation.  |
| DEL-008 | The extension ID must stay unchanged between releases.                                   | N-02, N-15, D-14 | VSIX updates target the existing extension.      | I, T: Package fixtures from successive versions keep the same manifest publisher and name.                                              |

### 6.15 Implementation documentation

| ID      | Requirement                                                                        | Source                 | Rationale                                          | Verification and pass condition                                                                                                   |
| ------- | ---------------------------------------------------------------------------------- | ---------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| DOC-001 | The repository README must satisfy its Catalog D entry.                            | N-15, N-16, U-19       | Clear project entry point.                         | I, D: The README presents GitHub VSIX installation first and supplies the required quick start and working guide links.           |
| DOC-002 | The installation guide must satisfy its Catalog D entry.                           | N-15, N-16, U-19       | Verified installation and update instructions.     | I, D: The two installation paths and the update procedure complete using the guide on the supported desktop hosts.                |
| DOC-003 | The user guide must satisfy its Catalog D entry.                                   | N-16, U-19             | Complete instructions for the command set.         | I, D: All 17 commands and required behavior topics have usable instructions and the stated results.                               |
| DOC-004 | The settings reference must satisfy its Catalog D entry.                           | N-16, U-19             | Predictable configuration.                         | I, T: Each manifest setting matches its documented type, default, scope, domain, and invalid-input behavior.                      |
| DOC-005 | The troubleshooting guide must satisfy its Catalog D entry.                        | N-11, N-16, U-19       | Recovery from known failure conditions.            | I, D: Each catalog condition has a symptom, an applicable action, and a result or remaining limitation.                           |
| DOC-006 | The contributor guide must satisfy its Catalog D entry.                            | N-14, N-16, U-19       | Usable maintenance instructions.                   | I, D: A clean source checkout completes setup, checks, tests, and packaging using the contributor guide.                          |
| DOC-007 | The changelog must satisfy its Catalog D entry.                                    | N-15, N-16, U-19       | Visible release changes.                           | I: The delivered version has a dated entry with the required change and compatibility information.                                |
| DOC-008 | The build-tool guide must satisfy its Catalog D entry.                             | N-14, N-16, U-17, U-23 | Inspectable dependency decisions.                  | I: The guide identifies approved tools and the dependency review procedure without duplicating manifest or lockfile data.         |
| DOC-009 | Each release record must satisfy its Catalog D entry.                              | N-12, N-15, N-16, U-19 | Release evidence at a stable source path.          | I: The record links candidate or release identity, generated evidence, requirement results, and remaining checks.                 |
| DOC-010 | The design and requirements must satisfy their Catalog D entry.                    | N-12, N-16, U-19       | Specifications stay current during implementation. | I: Release interfaces and decisions match the specifications. Pending differences keep this requirement Open.                     |
| DOC-011 | Each implementation change must update the documentation affected by that change.  | N-16, U-19             | Documentation is part of feature delivery.         | I: The same change contains the applicable document updates or a recorded explanation that no document is affected.               |
| DOC-012 | Project prose documents must follow the writing rules in Section 9.                | N-12, N-16, U-13       | Consistent controlled English.                     | I: Prose review covers ASD-STE100 sentence rules, approved words, technical terms, and procedural steps.                          |
| DOC-013 | Each requirement change must keep the requirement structure in Section 1.          | N-12, U-13             | Stable INCOSE requirement attributes.              | I: Each changed obligation has a stable ID, source, rationale, verification method, and measurable pass condition.                |
| DOC-014 | Each runnable documentation example must pass its documented validation procedure. | N-16, D-15             | Copyable instructions.                             | T: JSON examples pass the applicable schema. Command examples give the stated result from the stated prerequisites.               |
| DOC-015 | Each internal documentation link must resolve in its delivered copy.               | N-16, D-15             | Usable navigation.                                 | T: Repository and packaged document checks find each relative target and anchor in the applicable delivered files.                |
| DOC-016 | The VSIX must include the documents marked Yes in Catalog D.                       | N-15, N-16, D-15       | User instructions travel with the package.         | I, D: Archive inspection finds each required guide. Its instruction text remains readable without remote content.                 |
| DOC-017 | The code quality guide must satisfy its Catalog D entry.                           | N-16, N-17, U-20       | Usable contributor practices.                      | I, D: The guide explains Contract Q practices and quality commands, links their configuration, and records applicable exceptions. |

### 6.16 TypeScript code quality

| ID      | Requirement                                                                                      | Source           | Rationale                                             | Verification and pass condition                                                                                                        |
| ------- | ------------------------------------------------------------------------------------------------ | ---------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| COD-001 | The lint command must check the authored source files defined in Contract Q.                     | N-17, U-21       | Scripts and tests receive applicable checks.          | I, T: Runtime, test, script, and configuration samples receive the expected rules. No authored source directory is silently excluded.  |
| COD-002 | TypeScript lint checks must use the type information and rules in Contract Q.                    | N-17, U-21, D-18 | Checks include data flow and asynchronous behavior.   | I, T: Effective configuration matches the contract. Unhandled promises and assignments from `any` to domain types receive diagnostics. |
| COD-003 | The lint command must return a nonzero result for each lint error or warning.                    | N-17, D-18       | Accepted changes have zero warnings.                  | T: Error and warning samples each make `npm run lint` unsuccessful. Clean source gives zero.                                           |
| COD-004 | The lint verification command must keep source and documentation files unchanged.                | N-17, D-19       | Verification has no correction side effect.           | T: File comparisons before and after successful and failed checks show no source or document change.                                   |
| COD-005 | The format check command must compare authored files with the formatting rules in Contract Q.    | N-17, U-22       | One source layout configuration.                      | I, T: Effective Prettier options match the contract for each included file type.                                                       |
| COD-006 | The format check command must return a nonzero result for each formatting difference.            | N-17, U-22       | Enforced source consistency.                          | T: A formatting difference makes `npm run format:check` unsuccessful. Correctly formatted files give zero.                             |
| COD-007 | The format check command must keep source and documentation files unchanged.                     | N-17, D-19       | Corrections use an explicit command.                  | T: File comparisons show no change after `npm run format:check` reports a difference.                                                  |
| COD-008 | External data must pass runtime validation before conversion to an internal domain type.         | N-17, D-17       | Type assertions do not validate stored or user data.  | I, T: Settings and record inputs use the defined guards. Invalid shapes and values cannot reach a typed operation as valid data.       |
| COD-009 | Each exported function must have explicit input and output types.                                | N-17, D-17       | Stable module contracts.                              | I, T: Lint reports missing boundary types. Types declared through an interface or function type satisfy this requirement.              |
| COD-010 | Each switch over an internal state union must include a case for each declared member.           | N-17, D-17       | New states cannot silently use an unrelated branch.   | T: Adding a union member without its case causes a compiler or lint failure.                                                           |
| COD-011 | Shared catalog and captured snapshot types must use readonly properties and arrays.              | N-17, D-17       | Callers cannot accidentally change shared input data. | I, T: Mutation through these types causes a compiler diagnostic. Mutable working state uses a separate object.                         |
| COD-012 | Each managed resource must use the cleanup rules in Contract Q.                                  | N-17, D-17       | Operations do not leave active listeners or timers.   | I, T: Completion, cancellation, failure, and normal deactivation release applicable resources. Repeated cleanup causes no new failure. |
| COD-013 | Pure color modules must obey the import boundaries in Contract Q.                                | N-17, D-17       | Color calculations stay independently testable.       | I, T: The import check rejects a direct or transitive path from a pure color module to a prohibited component.                         |
| COD-014 | Each diagnostic suppression must obey the exception policy in Contract Q.                        | N-17, D-18       | Exceptions have a bounded purpose.                    | I, T: Missing reasons, blanket disables, prohibited directives, and unused suppressions cause a check failure.                         |
| COD-015 | Each reproducible defect correction must include a check that demonstrates the original failure. | N-12, N-17, U-20 | Corrected behavior has regression evidence.           | T, D: The check fails against the incorrect behavior and passes after correction. Visual defects use a recorded repeatable procedure.  |

## 7. Contract details

### 7.1 Eligibility

An eligible workspace contains at least one folder and has writable workspace settings. For automatic assignment, the assignment setting must be enabled. The primary color must be absent or empty.

A valid saved color has higher priority than random selection. A nonempty invalid saved value must receive an explicit correction or Reset. A workspace in failed recovery stays ineligible for new automatic writes until recovery succeeds.

### 7.2 Preset validation

A custom preset has a `name` string and a `value` string. The value uses the solid hex grammar and is stored as canonical hex.

The name contains 1 through 64 Unicode code points after surrounding whitespace removal. It contains no Unicode control character. Display text uses NFC normalization.

Name comparison uses NFKC normalization followed by Unicode lowercase conversion. A name equal to a built-in or existing custom name is invalid after this conversion.

Manual JSON input keeps the first valid occurrence of each name. It keeps at most the first 1,000 valid custom entries. Later invalid, duplicate, or excess entries give one diagnostic per configuration revision.

### 7.3 Preference defaults

This table defines defaults for clean and invalid scalar configurations. The design defines their VS Code schema and scope.

| Preference            | Default or permitted domain                                 |
| --------------------- | ----------------------------------------------------------- |
| Automatic assignment  | Disabled                                                    |
| Automatic source      | `presets`, with `generated` also permitted                  |
| Difference preference | Enabled                                                     |
| Adjustment step       | 5, with integers 1 through 10 permitted                     |
| Colored parts         | Catalog S                                                   |
| Bar adjustments       | Activity bar `lighten`, title bar `none`, status bar `none` |
| Bar adjustment values | `none`, `lighten`, `darken`                                 |
| Custom presets        | Empty list                                                  |
| Live preview          | Enabled                                                     |
| Status bar item       | Enabled                                                     |

### 7.4 Random selection contract

Generated selection uses 64 HSL candidates. Hue is an integer from 0 through 359. Saturation is an integer from 45 through 85 percent. Lightness is an integer from 25 through 70 percent.

Each draw is uniform in its integer range. Distance uses the Euclidean metric in OKLab after sRGB conversion. The preferred minimum distance is 0.10.

For each candidate, the minimum distance uses all valid other-workspace records in the current snapshot. No participating color makes all candidates equally preferred. Equal rankings use a uniform random choice.

The coordination snapshot contains at most 256 records from the same local directory. Each file is at most 4 KiB. Instance ID order selects records when more records exist.

Committed records use a 30-second heartbeat and a 90-second expiry. Reservations expire after 10 seconds. The selector performs at most three reservation attempts in the 250 ms wait budget.

The difference preference is not a guarantee of unique or perceptually distinct windows. Manual choices and saved assignments have priority. Expired records, concurrent operations, and different coordination directories can cause duplicate colors.

### 7.5 Conditional restoration

The extension records each owned path's prior presence, prior value, and written values. An unchanged owned value still equals a value from the active operation record.

Restoration changes only unchanged owned values. A prior missing value restores absence. A known prior value restores that value. A later external value stays in place.

Without a local baseline, a matching generated override has unknown prior history. Reset can remove that override. It cannot reconstruct an unknown earlier value from a different installation.

The configuration API does not have atomic updates across independent writers. Preservation checks apply to the latest observed configuration and verified readback. They do not guarantee serializable updates between unrelated extensions.

### 7.6 History boundaries

Color choices, shade commands, Choose Colored Parts, and Reset add appearance history entries. Preview steps, no-op results, preset edits, and global preference changes do not.

Undo history lasts for the current window session. An external change to effective workspace appearance clears the history. A Reset entry contains the previous workspace automatic assignment override, including its absence.

### 7.7 Contract B: Build and delivery

#### Approved tools

Only these direct development packages and their reviewed, locked dependencies are permitted:

| Package                  | Purpose                                                               |
| ------------------------ | --------------------------------------------------------------------- |
| `typescript`             | Type checking and compilation.                                        |
| `@types/vscode`          | Types for the minimum supported VS Code API.                          |
| `@types/node`            | Types for the Node.js APIs available in the supported extension host. |
| `@vscode/vsce`           | VSIX package creation.                                                |
| `eslint`                 | Source lint checks.                                                   |
| `@eslint/js`             | ESLint recommended JavaScript rules.                                  |
| `typescript-eslint`      | TypeScript parser, rules, and type information for ESLint.            |
| `prettier`               | Source and document formatting.                                       |
| `eslint-config-prettier` | Disable ESLint rules that conflict with Prettier.                     |

Runtime dependency fields are absent or empty. Compiled and copied source must also exclude third-party runtime packages.
Direct development versions are exact in `package.json`. `package-lock.json` owns resolved versions, sources, and integrity values.
Review the lockfile diff, advisories, and installation scripts before executing a changed dependency tree.
Record decisions and unresolved concerns with the change. Do not copy package inventories or lockfile hashes into Markdown.
A new direct package requires an explicit user decision.

#### Source prerequisites and commands

Use Git for source acquisition, supported Node.js LTS and npm for builds, and a supplied VS Code executable for integration.
The contributor guide identifies the supported runtime series and host-specific examples. VSIX users need no build tools.

| Command from the repository root                   | Required result                                                                                                                                            | Offline after setup     |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| `npm ci --ignore-scripts`                          | Install the committed dependency tree without lifecycle scripts. Stop on a manifest and lockfile mismatch.                                                 | No                      |
| `npm run check`                                    | Check types without emission, lint, formatting, manifest data, imports, approved dependencies, and catalog agreement. Keep source and documents unchanged. | Yes                     |
| `npm run lint`                                     | Run ESLint with the Contract Q rules and `--max-warnings 0`. Keep source and documents unchanged.                                                          | Yes                     |
| `npm run lint:fix`                                 | Apply ESLint automatic corrections to the same source scope. Report unresolved findings through a nonzero exit code.                                       | Yes                     |
| `npm run format:check`                             | Run Prettier with `--check` and the project configuration. Keep source and documents unchanged.                                                            | Yes                     |
| `npm run format`                                   | Apply Prettier with `--write` to the defined authored files.                                                                                               | Yes                     |
| `npm test`                                         | Compile test inputs and run the unit suite with Node.js built-in tests and assertions. Report failures through a nonzero exit code.                        | Yes                     |
| `npm run docs:check`                               | Check internal links, configuration examples, command IDs, setting metadata, and the canonical preset catalog.                                             | Yes                     |
| `npm run build`                                    | Remove stale output and compile project runtime modules with the specified compiler constraints.                                                           | Yes                     |
| `npm run test:integration -- --vscode-path <path>` | Start the supplied VS Code executable with the project test runner, temporary workspaces, and a separate test profile.                                     | Yes, for local fixtures |
| `npm run package`                                  | Run type, lint, format, unit-test, document, and build checks. Create the candidate VSIX with the local packager and inspect its contents.                 | Yes                     |

Commands use local tools, return nonzero on failure, and do not fetch missing packages implicitly.
Quality checks keep authored files unchanged. Only the explicit correction commands change them.
TypeScript emits CommonJS project modules. Tests and scripts use Node.js built-ins and approved tools.
Package gates run explicitly, so disabled lifecycle hooks cannot bypass them. Packaging does not publish.

#### Release contents and identity

The manifest file list limits the VSIX to runtime output, required metadata, assets, license, and Catalog D package documents.
The installed extension details use the packaged README, changelog, command and settings contributions, and `iroiro-icon-256.png` icon.
VSCE uses `--no-dependencies`. Archive checks exclude dependencies, TypeScript, tests, scripts, caches, source control, and local configuration.

The extension ID is `russellsch.iroiro-iro`. The manifest owns publisher, name, repository, license, and version.
A release uses tag `v<version>`, asset `iroiro-iro-<version>.vsix`, and record `docs/releases/<version>.md`.
`SHA256SUMS` contains the tested asset checksum. Generated evidence identifies its source, environment, and artifact.
The release summary links this evidence instead of copying build metadata. ZIP timestamps can differ between builds.

Publishing a GitHub release or pre-release starts the release workflow. It builds the release commit, rejects a tag that differs from `v<version>`, and uploads only after `npm run package` passes.
It attaches the VSIX and `SHA256SUMS`, downloads both, and verifies the checksum against the build output. Draft releases do not start this workflow. Release immutability is outside this upload flow.

GitHub Release VSIX installation is primary. A source-tag build is secondary and uses the same extension ID and version.
Both paths use VS Code's graphical or CLI installation. Updates use newer release VSIX files and preserve saved settings.
The extension neither checks for nor downloads updates. Published asset checks are separate from local package creation.

### 7.8 Contract Q: TypeScript quality

#### Compiler configuration

Runtime and test TypeScript share these constraints in `tsconfig.base.json`:

| Compiler option                    | Value   |
| ---------------------------------- | ------- |
| `strict`                           | `true`  |
| `noUncheckedIndexedAccess`         | `true`  |
| `exactOptionalPropertyTypes`       | `true`  |
| `useUnknownInCatchVariables`       | `true`  |
| `noImplicitOverride`               | `true`  |
| `noFallthroughCasesInSwitch`       | `true`  |
| `noImplicitReturns`                | `true`  |
| `noUnusedLocals`                   | `true`  |
| `noUnusedParameters`               | `true`  |
| `forceConsistentCasingInFileNames` | `true`  |
| `noUncheckedSideEffectImports`     | `true`  |
| `skipLibCheck`                     | `false` |
| `noEmitOnError`                    | `true`  |
| `importHelpers`                    | `false` |

The check command covers all authored TypeScript with `--noEmit`. Runtime output is CommonJS compatible with the minimum host.
Build output excludes tests. Type-only imports use `import type`.

#### ESLint configuration

`eslint.config.mjs` uses flat configuration, ESLint recommended rules, and `typescript-eslint` recommended type-checked rules.
TypeScript uses `parserOptions.projectService: true`. JavaScript receives applicable JavaScript rules.
Runtime code, tests, scripts, and configuration files are included. Only dependencies and generated output may be excluded.

The following rules use error severity. TypeScript rules have the `@typescript-eslint/` prefix.

| Rule or group                                                                                                 | Required configuration                                                                                        |
| ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `no-explicit-any`                                                                                             | Reject explicit `any`.                                                                                        |
| `no-unsafe-assignment`, `no-unsafe-argument`, `no-unsafe-call`, `no-unsafe-member-access`, `no-unsafe-return` | Reject unsafe use of values typed as `any`.                                                                   |
| `no-non-null-assertion`, `no-unnecessary-type-assertion`                                                      | Reject unchecked non-null assertions and redundant assertions.                                                |
| `no-floating-promises`                                                                                        | Use `checkThenables: true`, `ignoreVoid: false`, and `ignoreIIFE: false`. No blanket safe-promise exemptions. |
| `no-misused-promises`                                                                                         | Check conditionals, spreads, and void-return callbacks. Keep `checksVoidReturn: true`.                        |
| `await-thenable`                                                                                              | Reject `await` on a value that is not thenable.                                                               |
| `use-unknown-in-catch-callback-variable`                                                                      | Use `unknown` for values passed to promise rejection callbacks.                                               |
| `explicit-module-boundary-types`                                                                              | Check exported function input and output types.                                                               |
| `consistent-type-imports`                                                                                     | Prefer type imports for type-only dependencies.                                                               |
| `switch-exhaustiveness-check`                                                                                 | Keep `considerDefaultExhaustiveForUnions: false`. A default branch does not replace missing union cases.      |
| `ban-ts-comment`                                                                                              | Apply the suppression policy below.                                                                           |
| Core `eqeqeq`                                                                                                 | Use strict equality through the `always` option.                                                              |
| Core `curly`                                                                                                  | Use braces through the `all` option.                                                                          |
| Core `no-var`, `prefer-const`, `no-debugger`                                                                  | Use block-scoped bindings and remove debugger statements.                                                     |
| Core `no-console`                                                                                             | Apply to runtime modules. Runtime diagnostics use the project's diagnostic adapter.                           |

The compiler owns unused TypeScript variable and parameter checks. JavaScript retains its unused-variable rules.
Lint uses `--max-warnings 0` and rejects unused suppressions or inline configuration. Verification does not use `--fix`.
`eslint-config-prettier` disables conflicting layout rules. Prettier runs separately.

#### Formatter configuration

`.prettierrc.json` is the single formatting reference. `.prettierignore` excludes dependencies and generated files, not authored files needing correction.
Formatting covers authored TypeScript, JavaScript, JSON, Markdown, and YAML.
Verification uses `--check`. Explicit correction uses `--write`. Editor plugins are optional.

#### Coding boundaries and resource cleanup

Validate external settings, parsed JSON, storage records, and untyped callbacks as `unknown` before conversion to domain types.
Checks cover shape, own properties, allowed fields, ranges, and catalog membership. Assertions do not replace validation.
Exported functions have explicit contracts. State unions require exhaustive cases. Shared catalogs and captured snapshots use readonly types and isolated copies.

Await promises and thenables, return them to an accountable caller, or attach a terminal rejection handler.
A `void` expression is insufficient. Terminal handlers report failures without throwing.
Resource owners release subscriptions, timers, controls, and handles after completion, failure, cancellation, or deactivation. Repeated cleanup is safe.

Pure color modules import only project types, immutable data, and pure modules.
Their import graph excludes host APIs, storage, coordination, and UI components. Tests supply random sources and clocks.
Names describe domain purpose. Comments explain non-obvious behavior, units, rounding, ownership, and cancellation.

#### Exceptions and verification

`@ts-ignore` and `@ts-nocheck` are prohibited. Intentional negative type tests may use `@ts-expect-error` with a checked error and a reason of at least 10 characters.
A lint suppression names one rule and one statement. Its adjacent comment explains the reason and supporting check or API constraint.
Record exceptions in the code quality guide. Blanket disables and unused suppressions fail checks.
Project-wide rule changes update the design and configuration. Exceptions do not authorize packages or removal of runtime validation.

Verification checks effective configuration, representative failures, package gates, and corrected defects.

## 8. Traceability to the design

| Requirement group | Design sections |
| ----------------- | --------------- |
| PLT               | 2, 3, 10, 12    |
| COL               | 4, 5, 9         |
| PRE               | 4, 5            |
| UX                | 4, 7, 11        |
| AUT               | 5, 7            |
| RND               | 3, 8, 9         |
| ADJ               | 5, 9, 10        |
| SUR               | 5, 6, 10        |
| DAT               | 5, 6, 7, 11     |
| RES               | 4, 6, 7, 11     |
| QUA               | 3, 11, 12, 13   |
| DEP               | 12, 13          |
| BLD               | 13              |
| DEL               | 2, 13           |
| DOC               | 13, 15          |
| COD               | 3, 6, 7, 13     |

Each requirement row also traces directly to a stakeholder need. Engineering decision IDs identify chosen implementation constraints and derived limits. These limits stay reviewable with this draft.

## 9. Document review criteria

Project prose follows ASD-STE100 Issue 9. Descriptive sentences contain at most 25 words. Procedural sentences contain at most 20 words. Each procedural step gives one instruction unless actions must occur at the same time.

Keep prose brief and active. Review approved vocabulary, permitted technical terms, and consistent names. API identifiers, file paths, code, and project color names keep their necessary technical forms. Instructional images have text alternatives and supplement complete text steps.

The review examines necessity, one-obligation structure, explicit conditions, consistent terms, feasibility, and verification criteria. It also examines the requirement set for missing behavior and conflicts.

An identifier stays stable after baseline approval. A changed requirement keeps its identifier when its purpose stays the same. A removed requirement keeps a recorded disposition in the revision history.

The implementation verification stays Open until actual evidence exists. Document checks cannot close an implementation requirement.

## 10. References

| Reference                                                                                                                                                                                               | Use                                                               |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| [ASD-STE100 Issue 9, January 2025](https://www.asd-ste100.org/assets/files/ASD-STE100_ISSUE9.pdf)                                                                                                       | Controlled prose and terminology rules.                           |
| [INCOSE Guide to Writing Requirements V4 summary, June 2023](https://www.incose.org/docs/default-source/working-groups/requirements-wg/guidetowritingrequirements/incose_rwg_gtwr_v4_summary_sheet.pdf) | Requirement structure, attributes, and quality review.            |
| [VS Code theme colors](https://code.visualstudio.com/api/references/theme-color)                                                                                                                        | Color control capabilities.                                       |
| [VS Code 1.104 release notes](https://code.visualstudio.com/updates/v1_104#_window-border-color-support-on-windows)                                                                                     | Windows border support.                                           |
| [VS Code settings](https://code.visualstudio.com/docs/configure/settings)                                                                                                                               | Scope and persistence model.                                      |
| [W3C contrast criterion](https://www.w3.org/TR/WCAG22/#contrast-minimum)                                                                                                                                | Contrast calculation target for owned text pairs.                 |
| [VS Code VSIX installation](https://code.visualstudio.com/docs/configure/extensions/extension-marketplace#install-from-a-vsix)                                                                          | Graphical and CLI installation, and default VSIX update behavior. |
| [VS Code package publication](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)                                                                                           | VSIX packaging and delivery outside the Marketplace.              |
| [GitHub release links](https://docs.github.com/en/repositories/releasing-projects-on-github/linking-to-releases)                                                                                        | Links to release pages and release assets.                        |
| [npm clean installation](https://docs.npmjs.com/cli/v11/commands/npm-ci/)                                                                                                                               | Lockfile-based setup and disabled lifecycle scripts.              |
| [Node.js test runner](https://nodejs.org/api/test.html)                                                                                                                                                 | Built-in test execution.                                          |
| [VS Code integration testing](https://code.visualstudio.com/api/working-with-extensions/testing-extension)                                                                                              | Project test runners and supplied VS Code executables.            |
| [TypeScript compiler options](https://www.typescriptlang.org/tsconfig/)                                                                                                                                 | Strict checking and additional compiler checks.                   |
| [TypeScript-aware linting](https://typescript-eslint.io/getting-started/typed-linting/)                                                                                                                 | Type information and project configuration.                       |
| [TypeScript ESLint configurations](https://typescript-eslint.io/users/configs/)                                                                                                                         | Shared recommended rule sets.                                     |
| [Promise checks](https://typescript-eslint.io/rules/no-floating-promises/)                                                                                                                              | Unhandled promises and thenables.                                 |
| [Promise callback checks](https://typescript-eslint.io/rules/no-misused-promises/)                                                                                                                      | Asynchronous work in synchronous callbacks.                       |
| [State switch checks](https://typescript-eslint.io/rules/switch-exhaustiveness-check/)                                                                                                                  | Exhaustive handling of union members.                             |
| [ESLint CLI](https://eslint.org/docs/latest/use/command-line-interface)                                                                                                                                 | Warning limits and explicit correction commands.                  |
| [Prettier integration](https://prettier.io/docs/integrating-with-linters)                                                                                                                               | Shared use with ESLint.                                           |
| [Prettier options](https://prettier.io/docs/options)                                                                                                                                                    | Project formatting values.                                        |
| [Prettier CLI](https://prettier.io/docs/cli)                                                                                                                                                            | Separate verification and correction modes.                       |
