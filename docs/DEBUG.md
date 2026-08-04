# Debugging artifacts

`ui-restore` keeps intermediate files under `.ui-restore/` (gitignored) so you can audit every step.

## Layout

```text
.ui-restore/
  component-index.json    # from scan / restore
  bundle.json             # multi-page extraction result
  dsl/
    home.json
    profile.json
  autofix/
    home/
      round-0/
        current.png
        diff.png
        document.json
        preview.html
        summary.txt
      result.json
```

## Tips

1. **DSL first**: if Vue looks wrong, open `dsl/*.json` before editing `.vue` by hand.
2. **Shared extract**: check `bundle.json` → `sharedComponents` and page `componentRef`.
3. **AutoFix**: compare `round-0/current.png` vs reference; heatmap is `diff.png`.
4. Prefer fixing DSL and re-running generator / autofix over large manual SFC rewrites.
