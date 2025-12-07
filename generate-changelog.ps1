$features = @()
$bugFixes = @()
$improvements = @()
$releaseDate = (Get-Date -Format "yyyy-MM-dd") # Current date for the release

# Retrieve commits since November 1, 2025
git log --pretty=format:"%ad|%s" --date=iso-strict --reverse --since="2025-11-01" | ForEach-Object {
    $line = $_
    $parts = $line -split '\|', 2 # Split only on the first '|'
    $date = $parts[0]
    $message = $parts[1]

    # Categorize based on Conventional Commits prefixes or inferred meaning
    if ($message -match "^feat(\(.*\))?:") {
        $features += "- " + ($message -replace "^feat(\(.*\))?: ", "").Trim()
    } elseif ($message -match "^fix(\(.*\))?:") {
        $bugFixes += "- " + ($message -replace "^fix(\(.*\))?: ", "").Trim()
    } elseif ($message -match "^chore(\(.*\))?:" -or $message -match "^refactor(\(.*\))?:" -or $message -match "^polish(\(.*\))?:" -or $message -match "^docs(\(.*\))?:" -or $message -match "^analysis(\(.*\))?:" -or $message -match "^test(\(.*\))?:") {
        # Extract message after prefix and trim
        $extractedMessage = $message -replace "^(chore|refactor|polish|docs|analysis|test)(\(.*\))?: ", ""
        $improvements += "- " + $extractedMessage.Trim()
    } else {
        # For other messages, attempt a general categorization or include as improvement
        # Filter out generic messages or known "noise" from previous commands
        if ($message -notlike "*error with the app*" -and $message -notlike "*Make the following changes*" -and $message -notlike "*Merge branch*" -and $message -notlike "*Merge pull request*" -and $message -notlike "*đã sửa*" -and $message -notlike "*tạm ổn*" -and $message -notlike "*Remove*") {
            $improvements += "- " + $message.Trim()
        }
    }
}

$changelogContent = "# Dreamland Engine Update Log 🚀

We're constantly working to make your adventures in Dreamland even more magical! Here's what's new in our latest update:

## Version 1.0.0 - $releaseDate ✨

"

if ($features.Count -gt 0) {
    $changelogContent += "### New Features! 🎉`n"
    $features | ForEach-Object { $changelogContent += "$_`n" }
    $changelogContent += "`n"
}

if ($bugFixes.Count -gt 0) {
    $changelogContent += "### Squashed Bugs! 🐞`n"
    $bugFixes | ForEach-Object { $changelogContent += "$_`n" }
    $changelogContent += "`n"
}

if ($improvements.Count -gt 0) {
    $changelogContent += "### Awesome Improvements! 🛠️`n"
    $improvements | ForEach-Object { $changelogContent += "$_`n" }
    $changelogContent += "`n"
}

$changelogContent
