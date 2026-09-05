# iroiro iro: Requirements

| Item | Value |
| --- | --- |
| Document ID | IRO-REQ-001 |
| Revision | 0.1 |
| Date | 2026-09-05 |
| Status | Draft for review |
| Product | iroiro iro (色々色) |
| Release | 1 |
| Companion | [Design](design.md) |

## 1. Purpose and conventions

This document defines the obligations for the first release of iroiro iro. The product is a VS Code extension for workspace colors.

Each requirement has one identifier and one obligation. The word `must` identifies that obligation. The rationale gives the basis for the requirement but adds no obligation.

All numbered requirements have release priority P1, which means necessary for Release 1. Their verification status is Open. This document defines checks but records no implementation test results.

Each source points to a stakeholder need or an engineering decision. The need table identifies the originating user decisions. The design contains the full decision register.

Catalogs P, S, and C, Profile T, and Matrix E form part of this specification. They define the sets and measurement conditions used by the requirements.

The prose uses ASD-STE100 Issue 9. The requirement structure uses the published INCOSE Guide to Writing Requirements V4 summary. The terminology register defines the software terms used in this document.

## 2. Stakeholder needs and sources

| Need | Need statement | Origin |
| --- | --- | --- |
| N-01 | The user wants a fast way to identify open workspaces by color. | U-01, U-04 |
| N-02 | The user wants the same saved color when a workspace opens again. | U-02, U-06 |
| N-03 | The user wants optional automatic assignment for an uncolored workspace. | U-03 |
| N-04 | The user wants common color presets and reusable named custom colors. | U-09 and the initial examples |
| N-05 | The user wants solid hex input, including short hex codes. | U-09, U-14 |
| N-06 | The user wants keyboard commands for color selection and shade adjustment. | U-11 |
| N-07 | The user wants a choice of colored window parts. | U-07, U-12 |
| N-08 | The user wants the extension in local and remote desktop workspaces. | U-05, U-08 |
| N-09 | The user wants a preference for different colors in other open workspaces. | U-10 |
| N-10 | The user wants a color preview that Escape can cancel. | U-14 |
| N-11 | The user wants recovery from extension appearance changes. | Derived from N-02, N-10 and design D-08 through D-10 |
| N-12 | The project wants clear, traceable, verifiable requirements. | U-13 |

U-01 through U-14 are the user decisions in [Design Section 2](design.md#2-scope-and-decisions). D-01 through D-12 are engineering decisions in that section.

## 3. Terminology register

### 3.1 Technical nouns

These terms use the computer science, mathematical, color, or specification contexts permitted by ASD-STE100. The definitions apply to the two project documents.

| Term | Definition |
| --- | --- |
| activation | Start of the extension instance in its host. |
| active entry | Preset on which the picker currently places keyboard focus. |
| appearance operation | One completed color change, part selection, Undo, or Reset. |
| automatic assignment | Initial color selection without a color picker. |
| baseline | Recorded settings values before the extension first owns their paths. |
| canonical hex | Lowercase solid color text in the form `#rrggbb`. |
| color key | VS Code identifier for one workbench color. |
| Command Center | Search control in the VS Code title bar. |
| Command Palette | VS Code control that lists available commands. |
| committed color | Primary color from a completed appearance operation. |
| configuration revision | One observed change to the effective extension settings. |
| coordination directory | Local extension storage directory that contains window records. |
| custom preset | User-added name and solid color value. |
| debounce interval | Delay that replaces pending input with the latest input. |
| extension API | Public interface through which an extension uses VS Code services. |
| external edit | Configuration change outside the current extension operation. |
| foreground | Text or icon color drawn on a background. |
| Git worktree | Separate working directory for a Git repository checkout. |
| heartbeat | Periodic update that keeps a window record current. |
| hex code | Base-16 representation of red, green, and blue channels. |
| HSL | Hue, saturation, and lightness color model. |
| Input Box | Native VS Code control for text input. |
| journal | Record that supports recovery from an interrupted operation. |
| JSON | JavaScript Object Notation data format. |
| no-op | Operation whose intended state equals the current state. |
| OKLab | Perceptual color space used for the color difference calculation. |
| owned pair | Foreground and background values that the extension calculates together. |
| owned path | Color setting path whose prior and written values the extension records. |
| part | Selectable window region from Catalog S. |
| participating window | Active extension instance with a valid, unexpired record in the same coordination directory. |
| percentile | Value at a stated position in an ordered set of measurements. |
| preset | Named solid color from Catalog P or the valid custom preset list. |
| preview | Temporary appearance that precedes a completed color choice. |
| primary color | Saved workspace color from which the extension calculates shades. |
| profile | VS Code collection of user settings and extension state. |
| rationale | Requirement attribute that gives the basis for an obligation. |
| Quick Pick | Native VS Code control for selection from a list. |
| readback | Configuration read that verifies an attempted write. |
| recovery | Restoration after an interrupted or failed appearance operation. |
| reservation | Short-lived window record for a proposed random color. |
| Restricted Mode | VS Code mode for a workspace that the user has not trusted. |
| RGB and sRGB | Red, green, and blue channels, and the standard RGB color space. |
| rollback | Conditional restoration of values from an operation snapshot. |
| sash | Draggable divider between VS Code regions. |
| schema | Definition of permitted data fields and their types. |
| Settings Sync | VS Code service for synchronization of user preferences. |
| SHA-256 | Hash function used to derive a workspace identifier. |
| snapshot | Recorded appearance state at an operation boundary. |
| surface registry | Fixed mapping from part IDs to supported color keys. |
| telemetry | Product usage or diagnostic data sent to an external service. |
| theme selector | Key that groups color overrides for named VS Code themes. |
| UI | User interface. |
| Unicode code point | One numbered Unicode character value. |
| URI | Uniform Resource Identifier. |
| valid color | Color value that obeys the solid hex grammar. |
| valid preset | Preset that obeys the value, name, and capacity rules. |
| valid record | Window record that obeys the schema, size, and expiry rules. |
| VSIX | Installable VS Code extension package. |
| window record | Local data that identifies a participating workspace and its color. |
| workspace | VS Code folder or workspace configuration with at least one folder. |
| workspace identity | Complete workspace URI, including its scheme and authority. |
| workspace settings | Configuration shared by windows that open the same workspace. |
| WSL | Windows Subsystem for Linux. |

API identifiers and official control names are technical nouns in their exact forms. Color names in Catalog P are technical nouns for specific color values.

### 3.2 Technical verbs

The documents use the following verbs only for the stated software or mathematical processes. General prose uses dictionary verbs when those verbs give the same meaning.

| Verbs | Applicable process |
| --- | --- |
| enter, press, type, click | Computer input. |
| save, store, load, delete, copy, clear | Data storage and user interface operations. |
| enable, disable, filter, sort, highlight | User interface and configuration operations. |
| validate, parse, normalize | Data validation and conversion to a defined form. |
| render, restore, commit, undo, reset | Workbench display and configuration transactions. |
| synchronize, update, debug | Computer system operations. |
| run, call, return, assign | Program execution and configuration value assignment. |
| convert, round, hash | Color mathematics and identifier calculation. |
| exclude | Set selection that removes specified members before use. |
| verify, trace | Comparison against a specification and requirement relationships. |

## 4. Reference catalogs

### 4.1 Catalog P: Built-in presets

The palette contains these 240 entries in this order. The chosen values are project data. A preset name always identifies the value in these tables.

| Name | Canonical hex | Name | Canonical hex |
| --- | --- | --- | --- |
| Red | `#ff0000` | Dark red | `#8b0000` |
| Light red | `#ff8080` | Orange | `#ffa500` |
| Dark orange | `#ff8c00` | Yellow | `#ffff00` |
| Gold | `#ffd700` | Green | `#008000` |
| Dark green | `#006400` | Light green | `#90ee90` |
| Teal | `#008080` | Cyan | `#00ffff` |
| Blue | `#0000ff` | Dark blue | `#00008b` |
| Light blue | `#add8e6` | Purple | `#800080` |
| Plum | `#dda0dd` | Pink | `#ffc0cb` |
| Brown | `#a52a2a` | Gray | `#808080` |
| Black | `#000000` | White | `#ffffff` |

The reading order is left to right, then top to bottom.

The following tables continue the stable order of Catalog P. The reading order in each table is left to right, then top to bottom.

#### Red presets

| Name | Canonical hex | Name | Canonical hex |
| --- | --- | --- | --- |
| Pale rose red | `#f6cad2` | Light rose red | `#ec8d9d` |
| Rose red | `#de3551` | Deep rose red | `#af1d35` |
| Dark rose red | `#761324` | Pale coral red | `#f8cec9` |
| Light coral red | `#f09589` | Coral red | `#e64c37` |
| Deep coral red | `#ba2a17` | Dark coral red | `#7f1d10` |
| Pale brick red | `#efcdc8` | Light brick red | `#dd9488` |
| Brick red | `#be4937` | Deep brick red | `#8e3729` |
| Dark brick red | `#63261d` | Pale cherry red | `#f8c4d1` |
| Light cherry red | `#ee7795` | Cherry red | `#da1b4b` |
| Deep cherry red | `#9f1436` | Dark cherry red | `#6d0d25` |
| Scarlet | `#f32116` | Dark scarlet | `#960f08` |

#### Orange presets

| Name | Canonical hex | Name | Canonical hex |
| --- | --- | --- | --- |
| Pale peach orange | `#fcdfca` | Light peach orange | `#f8b98c` |
| Peach orange | `#f39049` | Deep peach orange | `#dd640e` |
| Dark peach orange | `#904109` | Pale amber orange | `#fde8c4` |
| Light amber orange | `#f9cb7b` | Amber orange | `#f6a823` |
| Deep amber orange | `#ce8509` | Dark amber orange | `#895906` |
| Pale pumpkin orange | `#f9dbc3` | Light pumpkin orange | `#f1ac74` |
| Pumpkin orange | `#e87517` | Deep pumpkin orange | `#b05911` |
| Dark pumpkin orange | `#793d0c` | Pale rust orange | `#f3cebf` |
| Light rust orange | `#e49472` | Rust orange | `#c95726` |
| Deep rust orange | `#96411d` | Dark rust orange | `#672d14` |

#### Yellow presets

| Name | Canonical hex | Name | Canonical hex |
| --- | --- | --- | --- |
| Pale lemon yellow | `#fdface` | Light lemon yellow | `#faf389` |
| Lemon yellow | `#f6e828` | Dark lemon yellow | `#9d9307` |
| Pale butter yellow | `#fbf3d5` | Light butter yellow | `#f5e49e` |
| Butter yellow | `#efd25d` | Dark butter yellow | `#b09111` |
| Pale mustard yellow | `#f5e9c7` | Light mustard yellow | `#e8cd7d` |
| Mustard yellow | `#d0a525` | Dark mustard yellow | `#7e6416` |
| Pale honey yellow | `#fbebc6` | Light honey yellow | `#f5ce75` |
| Honey yellow | `#eeaf1b` | Dark honey yellow | `#936a0b` |
| Cream yellow | `#f6edc1` | Golden yellow | `#edac07` |

#### Green presets

| Name | Canonical hex | Name | Canonical hex |
| --- | --- | --- | --- |
| Pale mint green | `#d7f4e5` | Light mint green | `#a0e3c2` |
| Mint green | `#59cf94` | Deep mint green | `#2e9e66` |
| Dark mint green | `#1f6b45` | Pale grass green | `#d6f4cd` |
| Light grass green | `#9ae481` | Grass green | `#53ca2b` |
| Deep grass green | `#3c931f` | Dark grass green | `#286115` |
| Pale leaf green | `#cbf1ce` | Light leaf green | `#7edd86` |
| Leaf green | `#30b53b` | Deep leaf green | `#23852b` |
| Dark leaf green | `#18591d` | Pale olive green | `#e4ecca` |
| Light olive green | `#c1d586` | Olive green | `#8ba63a` |
| Deep olive green | `#65792a` | Dark olive green | `#46531d` |
| Pale forest green | `#c3efd0` | Light forest green | `#73d991` |
| Forest green | `#2b9c4d` | Deep forest green | `#207439` |
| Dark forest green | `#154c25` | Pale sea green | `#c8efe2` |
| Light sea green | `#81dabc` | Sea green | `#34b288` |
| Deep sea green | `#257e61` | Dark sea green | `#18533f` |

#### Teal presets

| Name | Canonical hex | Name | Canonical hex |
| --- | --- | --- | --- |
| Pale aqua | `#d0f6f6` | Light aqua | `#87e8e8` |
| Aqua | `#28d2d2` | Dark aqua | `#167474` |
| Pale turquoise | `#c8f3ef` | Light turquoise | `#7de3d9` |
| Turquoise | `#2ac6b6` | Dark turquoise | `#176d65` |
| Pale blue green | `#cbecf1` | Light blue green | `#7ed0dd` |
| Blue green | `#2fa0b1` | Dark blue green | `#1b5b65` |
| Pale ocean teal | `#c0eef1` | Light ocean teal | `#68d6de` |
| Ocean teal | `#259fa7` | Dark ocean teal | `#14575c` |
| Pale teal | `#b5eeee` | Dark teal | `#114a4a` |

#### Blue presets

| Name | Canonical hex | Name | Canonical hex |
| --- | --- | --- | --- |
| Pale sky blue | `#d1ebfa` | Light sky blue | `#8bcdf4` |
| Sky blue | `#3cabec` | Deep sky blue | `#127cba` |
| Dark sky blue | `#0c5179` | Pale powder blue | `#dbe8f5` |
| Light powder blue | `#b0cce8` | Powder blue | `#79a8d8` |
| Deep powder blue | `#3473b2` | Dark powder blue | `#214a73` |
| Pale cornflower blue | `#ccdbf5` | Light cornflower blue | `#87abe8` |
| Cornflower blue | `#477ddc` | Deep cornflower blue | `#2051a7` |
| Dark cornflower blue | `#14346b` | Pale royal blue | `#c5d1f7` |
| Light royal blue | `#708feb` | Royal blue | `#2050df` |
| Deep royal blue | `#1739a1` | Dark royal blue | `#0f2567` |
| Pale navy blue | `#c1c5f0` | Light navy blue | `#6a74dc` |
| Navy blue | `#2a35b2` | Deep navy blue | `#1d257c` |
| Dark navy blue | `#11164a` | Pale steel blue | `#ccddea` |
| Light steel blue | `#8bb1d0` | Steel blue | `#4780ae` |
| Deep steel blue | `#325a7b` | Dark steel blue | `#213a50` |

#### Purple presets

| Name | Canonical hex | Name | Canonical hex |
| --- | --- | --- | --- |
| Pale lavender purple | `#e5d7f4` | Light lavender purple | `#c2a0e3` |
| Lavender purple | `#9961d1` | Dark lavender purple | `#4f247b` |
| Pale violet purple | `#e7ccf5` | Light violet purple | `#c47ee7` |
| Violet purple | `#a031d8` | Dark violet purple | `#581778` |
| Pale grape purple | `#ebccf0` | Light grape purple | `#ce81da` |
| Grape purple | `#a134b2` | Dark grape purple | `#561c5f` |
| Pale orchid purple | `#f3cdf0` | Light orchid purple | `#e283da` |
| Orchid purple | `#d13dc5` | Dark orchid purple | `#781c70` |
| Pale plum purple | `#efd2e8` | Light plum purple | `#d78ec5` |
| Plum purple | `#b13e95` | Dark plum purple | `#622252` |
| Lilac | `#c6a6dd` | Indigo | `#4423a9` |
| Mauve | `#bd7fa8` | Eggplant purple | `#51244a` |

#### Pink presets

| Name | Canonical hex | Name | Canonical hex |
| --- | --- | --- | --- |
| Pale blush pink | `#f6dfe3` | Light blush pink | `#ecb6bf` |
| Blush pink | `#df8695` | Dark blush pink | `#a92d42` |
| Pale rose pink | `#f8d3e1` | Light rose pink | `#ef9ab9` |
| Rose pink | `#e4588b` | Dark rose pink | `#9e1a4a` |
| Pale salmon pink | `#f9d7d2` | Light salmon pink | `#f1a89d` |
| Salmon pink | `#e97967` | Dark salmon pink | `#ae2d19` |
| Pale berry pink | `#f6d0e3` | Light berry pink | `#e887b8` |
| Berry pink | `#d72d82` | Dark berry pink | `#7c184a` |
| Hot pink | `#f434a4` | Dusty pink | `#bd7f8f` |

#### Brown presets

| Name | Canonical hex | Name | Canonical hex |
| --- | --- | --- | --- |
| Pale tan brown | `#eadccc` | Light tan brown | `#d1b28f` |
| Tan brown | `#b88851` | Dark tan brown | `#694c2b` |
| Pale caramel brown | `#eed6bf` | Light caramel brown | `#dba876` |
| Caramel brown | `#bd7832` | Dark caramel brown | `#6d451d` |
| Pale chestnut brown | `#e7c8bb` | Light chestnut brown | `#cd8b70` |
| Chestnut brown | `#975235` | Dark chestnut brown | `#572f1e` |
| Pale coffee brown | `#dfc9b9` | Light coffee brown | `#bd8d6b` |
| Coffee brown | `#7b5437` | Dark coffee brown | `#432d1e` |

#### Neutral presets

| Name | Canonical hex | Name | Canonical hex |
| --- | --- | --- | --- |
| Warm white | `#fffaf0` | Cool white | `#f5fbff` |
| Ivory | `#fffff0` | Cream | `#fffdd0` |
| Pale beige | `#f5ead7` | Beige | `#e6d5b8` |
| Dark beige | `#b8a68a` | Sand | `#cdbb8b` |
| Taupe | `#8b7d6b` | Warm gray | `#91877d` |
| Light warm gray | `#c7beb5` | Dark warm gray | `#5c554f` |
| Cool gray | `#7f8793` | Light cool gray | `#c4cbd4` |
| Dark cool gray | `#4b525c` | Silver gray | `#b7bcc2` |
| Charcoal gray | `#36414a` | Slate gray | `#667788` |
| Blue gray | `#657b8f` | Brown gray | `#756a61` |
| Soft black | `#17191c` | Deep black | `#08090a` |

### 4.2 Catalog S: Colored parts

| Part ID | User label | Default |
| --- | --- | --- |
| `activityBar` | Activity bar | On |
| `statusBar` | Status bar | On |
| `titleBar` | Title bar | On |
| `sashHover` | Sash hover border | On |
| `editorGroupBorder` | Editor group border | Off |
| `panelBorder` | Panel border | Off |
| `sideBarBorder` | Side bar border | Off |
| `statusBarBorder` | Status bar border | Off |
| `titleBarBorder` | Title bar border | Off |
| `tabActiveBorder` | Active tab border | Off |
| `windowBorder` | Window border | Off |

Activity bar color includes its normal badge and its supported top or bottom position. Title bar color includes the related Command Center colors.

The default activity bar shade is one Lighten step above the primary color. The default title bar and status bar use the primary color. Other listed borders use the primary color.

### 4.3 Catalog C: Commands

Each user title has the category `iroiro iro` in the Command Palette. The command IDs stay stable after release.

| Command ID | User title | Result |
| --- | --- | --- |
| `iroiroIro.chooseColor` | Choose Color | Open the preset list. |
| `iroiroIro.enterHexColor` | Enter Hex Color | Open solid hex input. |
| `iroiroIro.randomColor` | Random Color | Select from generated candidates. |
| `iroiroIro.randomPreset` | Random Preset | Select from available preset values. |
| `iroiroIro.lighten` | Lighten | Increase primary HSL lightness. |
| `iroiroIro.darken` | Darken | Decrease primary HSL lightness. |
| `iroiroIro.savePreset` | Save Current Color | Add a named custom preset. |
| `iroiroIro.renamePreset` | Rename Preset | Change a custom preset name. |
| `iroiroIro.editPreset` | Edit Preset Color | Change a custom preset value. |
| `iroiroIro.deletePreset` | Delete Preset | Remove a custom preset. |
| `iroiroIro.chooseParts` | Choose Colored Parts | Select workspace parts from Catalog S. |
| `iroiroIro.undo` | Undo Color Change | Restore the previous history entry. |
| `iroiroIro.reset` | Reset Workspace Colors | Restore the baseline and suppress automatic assignment for this workspace. |
| `iroiroIro.enableAutoColor` | Enable Automatic Color | Enable assignment at the selected scope. |
| `iroiroIro.disableAutoColor` | Disable Automatic Color | Disable assignment at the selected scope. |
| `iroiroIro.openSettings` | Open Settings | Open the extension settings. |
| `iroiroIro.retryRecovery` | Retry Recovery | Retry a failed restoration. |

### 4.4 Profile T: Timing measurements

Profile T uses a desktop with at least four logical CPU cores, 8 GiB of memory, and an SSD. The test workspace contains at most 1,000 custom presets and 32 participating window records.

The host has no other user extension except the necessary remote extension. No debugger or profiler is active during timing measurements. The test records the exact operating system and VS Code versions.

Remote measurements use a round-trip delay of at most 100 ms and an established connection. Reconnection time is outside the measurement. A write failure is a separate failure case.

Each timing series contains 100 successful operations after five warm-up operations. The 95th percentile is the 95th value after ascending sort. Startup uses 20 fresh activations without warm-up and the largest measured value.

| Metric | Start | End | Limit |
| --- | --- | --- | --- |
| Picker request | Entry to the command handler | Call to show the populated native picker | 95th percentile at most 100 ms |
| Local color operation | Confirmed user input or random command entry | Successful settings readback | 95th percentile at most 500 ms |
| Remote color operation | Confirmed user input or random command entry | Successful settings readback | 95th percentile at most 2,000 ms |
| Local startup assignment | Entry to `activate` | Successful settings readback | Maximum 1,000 ms |
| Remote startup assignment | Entry to `activate` | Successful settings readback | Maximum 3,000 ms |
| Pure color calculation | Entry to the color calculation | Returned result | 95th percentile at most 10 ms |

Picker request time measures extension work, not the host's final display frame. Color operation time includes local coordination. Preview timing starts after its separate 100 ms debounce interval.

### 4.5 Matrix E: Environment verification

The minimum host version is VS Code 1.104.0. The second host version is the current stable version at release verification. The release record identifies the exact second version.

| Environment | Required coverage |
| --- | --- |
| Windows desktop | Single folder and multiple-folder workspace on the minimum and current stable hosts. |
| macOS desktop | Single folder and multiple-folder workspace on the minimum and current stable hosts. |
| Linux desktop | Single folder and multiple-folder workspace on the minimum and current stable hosts. |
| Remote SSH | Each desktop client with a Linux SSH workspace on the minimum and current stable hosts. |
| WSL | Windows client with a WSL 2 Linux workspace on the minimum and current stable hosts. |
| Dev Containers | Each desktop client with a Linux container workspace on the minimum and current stable hosts. |
| Untitled workspace | Two folders, color selection, save as a workspace file, and reopen on each desktop operating system. |
| Theme kinds | Light, dark, high contrast dark, and high contrast light on each desktop operating system. |
| Activity bar location | Side, top, and bottom positions that the applicable host supports. |
| Windows border | VS Code 1.104 or later with `window.border` set to `default` on a supported Windows host. |
| macOS and Linux borders | Custom title bar with active and inactive windows. |
| Native title bar | Correct limitation message and operation of other selected parts. |
| Restricted Mode | Manual color selection and optional automatic assignment without workspace code execution. |

Browser clients, empty windows, and VS Code forks are outside the environment matrix. Experimental Modern UI is outside visual support until its affected color tokens pass direct verification.

## 5. Verification methods

| Code | Method | Evidence |
| --- | --- | --- |
| I | Inspection | Configuration, package, document, or code examination. |
| A | Analysis | Calculation or comparison against defined reference data. |
| T | Test | Controlled inputs with recorded output and state. |
| D | Demonstration | Recorded user flow or visual result in the applicable host. |

Each row below contains a pass condition. The verification record identifies its test case, environment, result, date, and evidence location.

## 6. Product requirements

### 6.1 Platform and scope

| ID | Requirement | Source | Rationale | Verification and pass condition |
| --- | --- | --- | --- | --- |
| PLT-001 | The extension must operate in each desktop environment in Matrix E. | N-08, D-01 | Desktop coverage. | D: Each applicable flow passes on the minimum and current stable hosts. |
| PLT-002 | The extension must operate in each remote environment in Matrix E. | N-08, D-02 | Remote workspace coverage. | D: Color selection, persistence, preview cancellation, and Reset pass for each remote row. |
| PLT-003 | The extension must run in the local UI extension host. | N-08, D-02 | Local window coordination. | I, T: The manifest declares UI kind and each remote session reports a local UI host. |
| PLT-004 | The extension must reject workspace color operations when no folder workspace is open. | N-08, U-08 | Defined scope boundary. | T: An empty window receives a folder message and zero color writes. |
| PLT-005 | The extension must use one saved primary color for a workspace with multiple folders. | N-02, N-07 | One identity per workspace window. | T: Two folders use one workspace color without folder-level color writes. |
| PLT-006 | The extension must use the complete workspace URI as the workspace identity source. | N-02, N-09, D-07 | Separate folders and remote authorities. | T: Equal URIs have equal keys. Different schemes or authorities have different source strings. |
| PLT-007 | The extension must execute appearance operations in Restricted Mode. | N-08, D-02 | Appearance changes do not use workspace code. | D: Manual and enabled automatic operations pass without a trust prompt from this extension. |
| PLT-008 | The extension must keep one saved color across windows that use the same workspace settings. | N-02 | Stable project identity. | T: A saved change appears in a second window that reads the same settings. |

### 6.2 Hex input and primary color

| ID | Requirement | Source | Rationale | Verification and pass condition |
| --- | --- | --- | --- | --- |
| COL-001 | The extension must accept three-digit solid hex input. | N-05 | Short-code support. | T: `#aaa` becomes `#aaaaaa`. |
| COL-002 | The extension must accept six-digit solid hex input. | N-05 | Full RGB input. | T: `#123456` keeps its channel values. |
| COL-003 | The extension must accept solid hex input without a leading number sign. | N-05, D-03 | Short input flow. | T: `abc` and `aabbcc` become `#aabbcc`. |
| COL-004 | The extension must remove surrounding whitespace from hex input before validation. | N-05, D-03 | Reliable pasted input. | T: Spaces and line breaks around `#abc` give `#aabbcc`. |
| COL-005 | The extension must accept uppercase hex digits. | N-05 | Equivalent hex forms. | T: `#ABC` and `#AABBCC` give `#aabbcc`. |
| COL-006 | The extension must store each primary color as canonical hex. | N-02, N-05 | One persistent representation. | T: Each accepted input gives a lowercase `#rrggbb` value. |
| COL-007 | The extension must reject input outside the solid hex grammar. | N-05, U-14 | Defined input domain. | T: Empty text, `#abcd`, `#aabbccdd`, `#ggg`, names, and color functions cause zero new color writes. |
| COL-008 | The extension must show an inline explanation for invalid hex input. | N-05, N-06 | Correction in the input flow. | D: The Input Box stays open and identifies the three-digit and six-digit forms. |
| COL-009 | The extension must derive the selected part colors from one primary color. | N-01, U-04 | Consistent workspace identity. | A, T: The surface map uses only the primary value, its specified shades, and calculated foregrounds. |
| COL-010 | The extension must keep the selected primary color after a shade preference change. | N-02, N-07 | Preferences do not replace workspace identity. | T: A bar adjustment changes its rendered shade while the saved primary value stays equal. |
| COL-011 | The extension must keep the selected primary color after a theme change. | N-02 | Stable identity across themes. | T: Each theme transition keeps `iroiroIro.color` unchanged. |

### 6.3 Presets

| ID | Requirement | Source | Rationale | Verification and pass condition |
| --- | --- | --- | --- | --- |
| PRE-001 | The extension must include each built-in preset in Catalog P. | N-04, D-04 | Common color availability. | I, T: All 240 names and values match the catalog. |
| PRE-002 | The extension must show each preset with its name and canonical hex value. | N-04, N-06 | Selection without color recognition alone. | D: Each visible preset has the two text fields. |
| PRE-003 | The extension must let the user save the current primary color as a custom preset. | N-04 | Reuse of custom and random colors. | T: A named current value appears in the user preset list after restart. |
| PRE-004 | The extension must let the user rename a custom preset. | N-04, D-04 | Preset maintenance. | T: The new name replaces the selected name and keeps its color value unchanged. |
| PRE-005 | The extension must let the user replace a custom preset's hex value. | N-04, D-04 | Preset maintenance. | T: Valid replacement input changes only the selected custom value. |
| PRE-006 | The extension must let the user delete a custom preset. | N-04, D-04 | Preset maintenance. | T: Only the selected custom entry disappears. |
| PRE-007 | The extension must reject custom preset names outside the defined name rules. | N-04, D-04 | Unique, usable names. | T: Blank, control-character, duplicate, and 65-code-point names cause zero preset writes. |
| PRE-008 | The extension must keep built-in presets outside custom preset modification commands. | N-04, D-04 | Stable common palette. | T: Rename, Edit, and Delete offer only custom entries. |
| PRE-009 | The extension must store custom presets in user settings. | N-04, D-04 | Reuse across workspaces in the profile. | T: Two projects in one profile see the same saved custom entry. |
| PRE-010 | The extension must keep workspace assignments unchanged when a preset changes. | N-02, N-04 | Saved values stay stable. | T: Rename, Edit, and Delete leave existing workspace primary colors equal. |
| PRE-011 | The extension must accept up to 1,000 valid custom presets. | N-04, D-12 | Defined capacity. | T: Entry 1,000 succeeds. An attempted additional entry shows a capacity message without a write. |
| PRE-012 | The extension must exclude each invalid custom preset entry from selection. | N-04, D-04 | A bad entry does not invalidate good entries. | T: Mixed valid and invalid settings keep the valid entries with one diagnostic per revision. |

### 6.4 Commands and previews

| ID | Requirement | Source | Rationale | Verification and pass condition |
| --- | --- | --- | --- | --- |
| UX-001 | The extension must make each command in Catalog C available through the Command Palette. | N-06, D-03 | Command discovery. | I, D: Each catalog ID has its stated title and can be invoked from the palette. |
| UX-002 | The extension must show built-in and valid custom presets in one Choose Color list. | N-04, N-06 | One selection flow. | D: One picker contains Catalog P followed by custom entries in name order. |
| UX-003 | The extension must filter the preset list by name or canonical hex text. | N-04, N-06 | Fast lookup. | T: Queries `plum` and `dda0dd` find Plum. Search does not add a preset. |
| UX-004 | The extension must enable live preview by default. | N-10, U-14 | Approved preview behavior. | I, T: A clean configuration enables preview. |
| UX-005 | With preview enabled, the extension must preview a valid color after a 100 ms debounce interval. | N-10, D-03 | Useful previews with bounded writes. | T: A fixed clock gives no preview before 100 ms and queues the latest valid value at that boundary. |
| UX-006 | When Escape cancels a picker, the extension must restore the pre-picker appearance through the conditional restoration rules. | N-10, N-11 | Safe exploration. | T: Each unchanged owned value returns to its snapshot value after pending writes stop. |
| UX-007 | When a picker closes without acceptance, the extension must cancel its preview. | N-10, N-11 | Consistent dismissal behavior. | T: Focus loss and workspace closure use the cancellation path. |
| UX-008 | When the user accepts a valid color, the extension must save that color as the workspace primary color. | N-02, N-05 | Explicit selection persistence. | T: Enter completes the selected value and reopen restores that value. |
| UX-009 | During a preview, the extension must keep the saved primary color unchanged. | N-02, N-10 | A preview is temporary. | T: `iroiroIro.color` stays equal through each preview step. |
| UX-010 | The extension must exclude preview steps from Undo history. | N-10, N-11, D-09 | One Undo entry per accepted change. | T: Ten preview movements followed by acceptance give one history entry. |
| UX-011 | The extension must discard superseded preview requests before their settings writes start. | N-10, D-12 | Latest input has priority. | T: Rapid input leaves only the latest pending request after the active write. |
| UX-012 | The extension must prevent overlapping appearance writes in one extension instance. | N-10, N-11, D-08 | Predictable operation order. | T: Controlled concurrent commands give at most one active settings write. |
| UX-013 | With preview disabled, the extension must defer color writes until the user accepts a color. | N-10, D-03 | Explicit preview control. | T: Picker movement causes zero writes before Enter. |
| UX-014 | The extension must show the committed primary color as text in its enabled status bar item. | N-01, N-06, D-03 | Workspace identity without color recognition alone. | D: The item contains canonical hex and an available matching preset name. |
| UX-015 | The extension must let the user hide its status bar item. | N-06, D-03 | User control of the interface. | T: The disabled preference removes the item while palette commands stay available. |
| UX-016 | The extension must keep a color selection in one picker after command invocation. | N-01, N-06, D-03 | Bounded interaction count. | D: Choose Color uses one list acceptance. Enter Hex Color uses one input acceptance. |

### 6.5 Automatic assignment

| ID | Requirement | Source | Rationale | Verification and pass condition |
| --- | --- | --- | --- | --- |
| AUT-001 | The extension must disable automatic assignment by default. | N-03, U-03 | User opt-in. | T: A fresh installation writes no initial workspace color. |
| AUT-002 | The extension must let the user enable automatic assignment at user or workspace scope. | N-03 | Global default and project control. | T: The command writes only the scope that the user selects. |
| AUT-003 | The extension must let the user disable automatic assignment at user or workspace scope. | N-03 | Reversible opt-in. | T: The command writes only the selected scope and keeps a saved primary color. |
| AUT-004 | The extension must give the workspace automatic assignment preference priority over the user default. | N-03, D-10 | Per-workspace control. | T: Workspace `false` overrides user `true`. Workspace `true` overrides user `false`. |
| AUT-005 | For an eligible uncolored workspace, the extension must assign a color when automatic assignment is enabled. | N-03 | Startup convenience. | T: Startup and an enabling preference change each assign one color through the same eligibility rules. |
| AUT-006 | The extension must offer preset and generated sources for automatic assignment. | N-03, U-03 | The selected source is a user choice. | T: Each source value uses its stated candidate pool. |
| AUT-007 | The extension must use the preset source as the automatic assignment default. | N-03, D-04 | Predictable initial palette. | I, T: A clean enabled configuration selects from preset values. |
| AUT-008 | The extension must give a valid saved primary color priority over automatic assignment. | N-02, N-03 | Stable reopened projects. | T: Reopen uses the saved color without a random selection call. |
| AUT-009 | The extension must keep a nonempty invalid saved color unchanged until an explicit correction or Reset. | N-02, D-08 | Invalid data is not permission for replacement. | T: Startup reports the invalid value without automatic replacement. |
| AUT-010 | The extension must keep the committed color unchanged during window focus changes. | N-02 | Focus is not a new workspace. | T: Repeated focus changes give zero random selections. |
| AUT-011 | The extension must keep the committed color unchanged during remote reconnection. | N-02, N-08 | Reconnection is not a new assignment. | T: Disconnect and reconnect keep the stored primary value. |
| AUT-012 | The extension must complete automatic assignment without a color selection prompt. | N-03 | Unattended initial selection. | D: Enabled startup uses no picker or Input Box. |

### 6.6 Random colors

| ID | Requirement | Source | Rationale | Verification and pass condition |
| --- | --- | --- | --- | --- |
| RND-001 | Random Preset must select from the unique values of built-in and valid custom presets. | N-04, N-09 | Complete palette without duplicate weighting. | T: The candidate pool equals the deduplicated preset value set. |
| RND-002 | Random Color must select from generated solid color candidates. | N-01, N-09 | Random colors beyond the named palette. | T: A fixed random source gives valid canonical values from the specified HSL ranges. |
| RND-003 | A manual random command must exclude the current primary color when its pool contains a different value. | N-01, N-09 | A requested change gives a different value. | T: A pool with a current value and one alternative selects the alternative. |
| RND-004 | The extension must enable the color difference preference by default. | N-09, U-10 | Different workspace identities. | I, T: A clean configuration enables the preference. |
| RND-005 | With the difference preference enabled, random selection must prefer candidates at least 0.10 OKLab units from each participating color. | N-09, D-07 | Defined separation target. | T: A fixed candidate set selects only qualifying candidates when that set is nonempty. |
| RND-006 | Without a qualifying candidate, random selection must maximize the minimum distance from participating colors. | N-09, D-07 | Defined behavior when colors are crowded. | T: A fixed crowded palette selects a candidate with the largest minimum distance. |
| RND-007 | Random selection must ignore window records for the current workspace identity. | N-02, N-09 | One project keeps one identity. | T: Additional same-workspace records do not change the other-workspace comparison set. |
| RND-008 | Random selection must ignore invalid or expired window records. | N-09, D-07 | Reliable coordination input. | T: Malformed data and records aged 90 seconds or more do not affect selection. |
| RND-009 | When coordination fails, the extension must select from the available local candidates. | N-01, N-09, D-07 | Color changes stay available. | T: Read, write, and timeout failures return a candidate without waiting for peers. |
| RND-010 | The extension must limit coordination waits to 250 ms per random operation. | N-01, D-12 | Bounded command delay. | T: A fixed clock and stalled peers give at most 250 ms of coordination waits. |
| RND-011 | Random selection must keep colors saved by other workspaces unchanged. | N-02, N-09 | Difference preference does not override saved choices. | T: Crowded palettes and reservation conflicts cause zero writes to a different workspace. |

### 6.7 Shades and readability

| ID | Requirement | Source | Rationale | Verification and pass condition |
| --- | --- | --- | --- | --- |
| ADJ-001 | Lighten must increase primary HSL lightness by the configured step, up to 100 percent. | N-06, D-05 | Defined Lighten behavior. | A, T: Hue and saturation stay equal before conversion. Lightness uses `min(100, L + step)`. |
| ADJ-002 | Darken must decrease primary HSL lightness by the configured step, down to zero percent. | N-06, D-05 | Defined Darken behavior. | A, T: Hue and saturation stay equal before conversion. Lightness uses `max(0, L - step)`. |
| ADJ-003 | The extension must use five percentage points as the default adjustment step. | N-06, D-05 | Small default changes. | T: Lighten changes black to `#0d0d0d` at the default step. |
| ADJ-004 | The extension must accept integer adjustment steps from 1 through 10 percentage points. | N-06, D-05 | Bounded user adjustment. | T: Each integer is permitted. Zero, 11, fractions, and nonnumbers use the invalid preference path. |
| ADJ-005 | The extension must treat an unchanged canonical adjustment result as a no-op. | N-06, D-09 | No unnecessary settings or history changes. | T: Darken on black and Lighten on white give zero writes and zero history entries. |
| ADJ-006 | The extension must use the selected foreground with the larger black-or-white contrast ratio for each owned background. | N-01, D-06 | Defined foreground selection. | A: Reference luminance vectors select the expected foreground. Equal ratios select black. |
| ADJ-007 | Each owned text pair must have a contrast ratio of at least 4.5:1. | N-01, D-06 | Text readability on selected backgrounds. | A, T: Each built-in color and RGB boundary vector meets the ratio after rendering calculations. |
| ADJ-008 | The extension must keep global high contrast border settings unchanged. | N-01, D-11 | Theme accessibility indicators. | T: The write set excludes `contrastBorder` and `contrastActiveBorder` after high contrast theme changes. |

### 6.8 Colored parts

| ID | Requirement | Source | Rationale | Verification and pass condition |
| --- | --- | --- | --- | --- |
| SUR-001 | The extension must offer each part in Catalog S as an independent selection. | N-07 | Explicit surface control. | D: Each listed part can be selected or deselected without a different part selection. |
| SUR-002 | The extension must use the default part selections in Catalog S. | N-07, U-07 | Defined default colored parts. | T: A clean configuration selects exactly the four On entries. |
| SUR-003 | The extension must use the Catalog S default shades. | N-01, N-07, U-07 | Defined shade relationship. | T: The activity bar uses one lighter step. The title and status bars use the primary value. |
| SUR-004 | The extension must let the user select none, lighten, or darken for each bar adjustment. | N-07, D-05 | Shades without independent primary colors. | T: Each mode operates independently for activity, title, and status bars. |
| SUR-005 | When a part is deselected, the extension must conditionally restore that part's owned paths. | N-07, N-11, D-08 | Deselect releases the part. | T: Unchanged owned values return to their baselines. The writer removes these paths from its ownership record. |
| SUR-006 | The extension must limit its color writes to paths in the surface registry. | N-07, D-08 | Bounded effect on the interface. | I, T: Each prepared color path belongs to Design Section 10, including permitted theme selectors. |
| SUR-007 | The extension must keep the theme's debugger, error, warning, and remote indicator colors unchanged. | N-01, D-11 | State indicators keep their meaning. | T: The write set excludes the state keys identified in Design Section 10. |
| SUR-008 | The extension must keep the user's part preferences when the host cannot display a selected part color. | N-07, N-08 | Portable configuration. | T: Native title bars and hidden regions do not remove stored selections. |
| SUR-009 | The extension must explain each known host restriction in the affected part control. | N-07, N-08 | Understandable partial appearance. | D: Native title bar, border, and known Modern UI restrictions have specific descriptions. |
| SUR-010 | The extension must keep host layout settings unchanged during color operations. | N-07, D-08 | A color command does not change window layout. | T: Title bar style, window border mode, and experimental settings stay equal. |

### 6.9 Persistence and settings integrity

| ID | Requirement | Source | Rationale | Verification and pass condition |
| --- | --- | --- | --- | --- |
| DAT-001 | The extension must write primary colors at workspace scope. | N-02, U-06 | Project persistence without global color changes. | T: A single folder uses its settings file. A multiple-folder workspace uses its workspace configuration. |
| DAT-002 | The extension must keep global workbench color values unchanged during workspace appearance operations. | N-02, D-08 | Other projects keep their user defaults. | T: Global `workbench.colorCustomizations` stays equal before and after each appearance command. |
| DAT-003 | On reopen, the extension must restore the valid saved primary color when its owned settings have no external conflict. | N-02, N-11 | Stable appearance with protection for external edits. | D: Reopen restores the saved primary value and selected shades in each applicable Matrix E environment. |
| DAT-004 | Each prepared color update must keep unrelated entries from the latest workspace configuration read unchanged. | N-11, D-08 | Bounded settings changes. | T: Sentinel entries at the top level and in theme selectors stay equal in the prepared update. |
| DAT-005 | Before its first write to a path, the extension must record that path's prior presence and value. | N-11, D-08 | Correct restoration of missing and existing values. | T: Fault injection confirms a durable baseline before the first configuration write. |
| DAT-006 | The extension must keep the original path baseline across completed color changes. | N-11, D-08 | Reset returns to the initial appearance. | T: Three accepted colors keep the baseline from before the first change. |
| DAT-007 | The extension must restore an owned path only while its current value matches a recorded extension write. | N-11, D-08 | Later external values have priority. | T: A changed external value survives cancellation, Undo, Reset, and crash recovery. |
| DAT-008 | When an owned path was originally absent, restoration must remove its unchanged extension value. | N-11, D-08 | Restore absence, not an invented theme value. | T: The path becomes absent. Other paths stay equal. |
| DAT-009 | The extension must write selected color values into workspace overrides for existing theme selectors that contain the selected keys. | N-07, N-11, D-08 | Theme-specific values do not hide the selected workspace color. | T: User-only and workspace selectors receive selected key overrides at workspace scope. |
| DAT-010 | The extension must record each attempted write before it sends that write to VS Code. | N-11, D-08 | Recovery across a process interruption. | T: Termination after each write boundary leaves enough data to recognize the attempted values. |
| DAT-011 | The extension must verify intended settings values through readback before it reports operation success. | N-02, N-11, D-08 | No false success state. | T: Mismatched readback causes failure recovery and no success state. |
| DAT-012 | When an owned value changes externally, the extension must suspend automatic reapplication for its affected part. | N-11, D-08 | Prevent repeated replacement of a different writer's value. | T: External edits stop automatic writes for that part until an explicit color choice. |
| DAT-013 | The extension must use documented defaults for invalid scalar preferences. | N-01, D-04 | Predictable behavior after a bad settings edit. | T: Wrong types and out-of-range values use the default table with one diagnostic per revision. |
| DAT-014 | The extension must validate recovery data before it uses that data for a settings write. | N-11, D-08 | Recovery data cannot authorize arbitrary paths. | T: Unknown versions, paths, types, and oversized records cause zero recovery writes. |
| DAT-015 | The extension must report a workspace settings write failure with an applicable recovery action. | N-02, N-11 | The user can correct a failed operation. | D: Read-only, invalid JSON, and disconnected cases offer the actions in Design Section 11. |
| DAT-016 | The extension must ignore workspace-level custom preset settings. | N-04, D-04 | The custom preset list has user scope. | T: A workspace preset override does not replace or extend the user preset list. |

### 6.10 Undo, Reset, and recovery

| ID | Requirement | Source | Rationale | Verification and pass condition |
| --- | --- | --- | --- | --- |
| RES-001 | Undo Color Change must restore the previous completed appearance entry through conditional restoration. | N-11, D-09 | Recover the last user appearance operation. | T: Color, part, and Reset histories return to their previous stored states. |
| RES-002 | The extension must keep the 20 most recent appearance history entries in the current window session. | N-11, D-09 | Defined Undo depth. | T: After 21 changes, 20 entries stay in order and the oldest entry is unavailable. |
| RES-003 | The extension must clear Undo history after an external workspace appearance change. | N-11, D-09 | Undo does not cross an external edit. | T: An external color or effective appearance preference change clears the Undo entries. |
| RES-004 | Reset Workspace Colors must conditionally restore recorded baseline values for owned paths. | N-11, D-08 | Recover the pre-extension appearance where the baseline is known. | T: Original values and original absence return when the current values still match extension writes. |
| RES-005 | Reset Workspace Colors must remove the workspace primary color setting. | N-02, N-11, D-10 | The workspace returns to an uncolored assignment state. | T: `inspect().workspaceValue` for `iroiroIro.color` becomes undefined. |
| RES-006 | Reset Workspace Colors must disable automatic assignment at workspace scope. | N-03, N-11, D-10 | Reset survives the next startup. | T: Reopen after Reset does not select a different automatic color. |
| RES-007 | Reset Workspace Colors must keep the user's custom presets unchanged. | N-04, N-11 | Appearance recovery does not remove reusable colors. | T: The user preset array stays equal after Reset. |
| RES-008 | On activation, the extension must recover an incomplete appearance operation before automatic assignment. | N-03, N-11, D-08 | Startup does not build on an unfinished preview. | T: Each incomplete journal phase enters recovery before a random selection call. |
| RES-009 | After failed restoration, the extension must keep its recovery journal. | N-11, D-08 | A later attempt can complete recovery. | T: A write failure during restoration keeps the journal available after restart. |
| RES-010 | Retry Recovery must retry the saved conditional restoration. | N-11, D-08 | Explicit recovery after a corrected failure. | T: After the user restores file access, the pending recovery completes. |
| RES-011 | During its deactivate callback, the extension must request cancellation of an active preview. | N-10, N-11, D-08 | Decrease temporary settings after disable. | T: The callback invokes cancellation before disposal completes. |
| RES-012 | The user documentation must explain color removal before extension uninstall. | N-11, D-08 | Uninstall does not guarantee extension cleanup. | I: The instructions include Reset and the manual fallback for saved settings. |

### 6.11 Quality constraints

| ID | Requirement | Source | Rationale | Verification and pass condition |
| --- | --- | --- | --- | --- |
| QUA-001 | Each command flow in Catalog C must accept keyboard input for each user action. | N-06, D-03 | Keyboard access. | D: Each flow completes without mouse input. |
| QUA-002 | Each extension input control must have a descriptive text label. | N-06, D-03 | Screen reader access. | D: The screen reader announces the control purpose and the selected name or value. |
| QUA-003 | The extension must meet the picker request limit in Profile T. | N-01, D-12 | Fast command entry. | T: The recorded 95th percentile is at most 100 ms. |
| QUA-004 | The extension must meet the local color operation limit in Profile T. | N-01, D-12 | Fast local changes. | T: The recorded 95th percentile is at most 500 ms. |
| QUA-005 | The extension must meet the remote color operation limit in Profile T. | N-01, N-08, D-12 | Fast changes with remote settings. | T: The recorded 95th percentile is at most 2,000 ms. |
| QUA-006 | The extension must meet each startup assignment limit in Profile T. | N-01, N-03, D-12 | Bounded initial extension work. | T: The largest local result is at most 1,000 ms. The largest remote result is at most 3,000 ms. |
| QUA-007 | The color engine must meet the pure calculation limit in Profile T. | N-01, D-12 | Bounded calculation work. | T: The recorded 95th percentile is at most 10 ms for each color operation. |
| QUA-008 | The extension must complete local color operations without an outbound extension network request. | N-01, D-07 | Offline local use. | I, T: Network instrumentation records zero extension requests during the local command suite. |
| QUA-009 | The extension must keep product telemetry disabled. | N-01, D-07 | No external usage service is necessary. | I, T: The package has no telemetry sender and the command suite emits no telemetry. |
| QUA-010 | The extension must limit workspace data access to configuration and extension state. | N-08, D-02 | Source files are unnecessary for appearance. | I, T: Instrumented flows read no source file and start no workspace process. |
| QUA-011 | The extension must exclude workspace paths and custom preset names from default diagnostic logs. | N-08, D-07 | Limit unnecessary identifying data. | T: Failure fixtures containing sentinel paths and names give no matching log text. |
| QUA-012 | During idle operation, the extension must make zero recurring workspace configuration writes. | N-01, D-07 | No settings churn from coordination. | T: Ten idle minutes contain local record heartbeats but zero workspace writes. |
| QUA-013 | The release package must install as a VSIX on the minimum supported VS Code host. | N-08, D-01 | Installable extension delivery. | T: A clean minimum-version profile installs the VSIX and discovers the catalog commands. |
| QUA-014 | The release record must trace each requirement ID to a verification result. | N-12, U-13 | Reviewable evidence. | I: Each ID has a result, environment, date, and evidence location. |

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

| Preference | Default or permitted domain |
| --- | --- |
| Automatic assignment | Disabled |
| Automatic source | `presets`, with `generated` also permitted |
| Difference preference | Enabled |
| Adjustment step | 5, with integers 1 through 10 permitted |
| Colored parts | Catalog S |
| Bar adjustments | Activity bar `lighten`, title bar `none`, status bar `none` |
| Bar adjustment values | `none`, `lighten`, `darken` |
| Custom presets | Empty list |
| Live preview | Enabled |
| Status bar item | Enabled |

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

## 8. Traceability to the design

| Requirement group | Design sections |
| --- | --- |
| PLT | 2, 3, 10, 12 |
| COL | 4, 5, 9 |
| PRE | 4, 5 |
| UX | 4, 7, 11 |
| AUT | 5, 7 |
| RND | 3, 8, 9 |
| ADJ | 5, 9, 10 |
| SUR | 5, 6, 10 |
| DAT | 5, 6, 7, 11 |
| RES | 4, 6, 7, 11 |
| QUA | 3, 11, 12, 13 |

Each requirement row also traces directly to a stakeholder need. Engineering decision IDs identify chosen implementation constraints and derived limits. These limits stay reviewable with this draft.

## 9. Document review criteria

The review examines necessity, one-obligation structure, explicit conditions, consistent terms, feasibility, and verification criteria. It also examines the requirement set for missing behavior and conflicts.

An identifier stays stable after baseline approval. A changed requirement keeps its identifier when its purpose stays the same. A removed requirement keeps a recorded disposition in the revision history.

The implementation verification stays Open until actual evidence exists. Document checks cannot close an implementation requirement.

## 10. References

| Reference | Use |
| --- | --- |
| [ASD-STE100 Issue 9, January 2025](https://www.asd-ste100.org/assets/files/ASD-STE100_ISSUE9.pdf) | Controlled prose and terminology rules. |
| [INCOSE Guide to Writing Requirements V4 summary, June 2023](https://www.incose.org/docs/default-source/working-groups/requirements-wg/guidetowritingrequirements/incose_rwg_gtwr_v4_summary_sheet.pdf) | Requirement structure, attributes, and quality review. |
| [VS Code theme colors](https://code.visualstudio.com/api/references/theme-color) | Color control capabilities. |
| [VS Code 1.104 release notes](https://code.visualstudio.com/updates/v1_104#_window-border-color-support-on-windows) | Windows border support. |
| [VS Code settings](https://code.visualstudio.com/docs/configure/settings) | Scope and persistence model. |
| [W3C contrast criterion](https://www.w3.org/TR/WCAG22/#contrast-minimum) | Contrast calculation target for owned text pairs. |
