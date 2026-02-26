<div align="center">

# pi-github

[![License](https://img.shields.io/badge/license-MIT-111111?style=flat-square)](./LICENSE)
[![Pi extension](https://img.shields.io/badge/pi-extension-111111?style=flat-square)](https://pi.dev)
[![GitHub](https://img.shields.io/badge/github-maria--rcks%2Fpi--github-111111?style=flat-square&logo=github)](https://github.com/maria-rcks/pi-github)

GitHub extension package for [Pi](https://pi.dev) with thread formatting, issue/PR listing, image extraction, and PR diff inspection.
</div>

## Install

Use whichever source you prefer:

```bash
pi install npm:pi-github
# or
pi install git:github.com/maria-rcks/pi-github
# or
pi install /absolute/path/to/pi-github
```

## How it works

- This extension calls the GitHub CLI (`gh`) under the hood (`gh api ...`) to fetch issues, PRs, discussions, images, and diffs.
- `gh` must be installed and available in `PATH`.
- `gh` must be authenticated for the account you want to use (`gh auth login`).
- If you do not pass `owner`/`repo`, the tool tries to infer them from `git remote origin`.

## What this package does

- Formats issues, pull requests, and discussions into chronological markdown.
- Lists open issues and pull requests with pagination support.
- Extracts image references and downloads a selected image by ID.
- Lists PR changed files and fetches per-file diffs.

## Tool actions

Tool name: `github`

- `format` (default)
- `list_issues`
- `list_prs`
- `list_images`
- `download_image`
- `list_changes` (PR only)
- `get_change` (PR only)

Core params:

- `owner`, `repo` (optional if `git remote origin` points to GitHub)
- `id` (alias: `number`)
- `entity`: `issue | pr | discussion` (optional, auto-detected)

## Links

- Repository: https://github.com/maria-rcks/pi-github
- Issues: https://github.com/maria-rcks/pi-github/issues
