English | [简体中文](CONTRIBUTING_ZH.md)

# Contributing to Windy10v10AI

Thanks for taking the time to contribute!

## Players: use the feedback page

If you are a player and want to report a problem or suggest an idea, please use the feedback page: <https://windy10v10ai.com/feedback>. Choose "Report a problem" or "Suggest an idea", pick what it relates to, and describe it in your own words. Reporting from the launcher can attach game logs, which helps us find the cause faster.

You don't need to know anything about the code, and you don't need a GitHub account.

## Contributors: use GitHub when you plan to implement it

GitHub issues and pull requests are for code changes, made by the person who will write the code:

- **Small fixes**: typos, documentation, translations and obvious small bug fixes can go straight to a pull request.
- **Bug fixes and features you plan to implement yourself**: open an [issue](https://github.com/windy10v10ai/game/issues/new/choose) first. Explain the problem and how you would change the code, then wait for the maintainer to agree before you start. By default the maintainer implements features, so a feature pull request without prior agreement may be closed. This saves you from building something that doesn't fit the project.
- **Only an idea, or you are not going to write it**: use the [feedback page](https://windy10v10ai.com/feedback) instead. The maintainer reads it and decides.

Gameplay changes include new heroes, abilities, items and game modes, and any balance or numeric change.

## Before you open a pull request

1. Search the [existing issues](https://github.com/windy10v10ai/game/issues) first.
2. For a bug fix or feature you will implement, open an issue and wait for the maintainer to agree.
3. Small fixes don't need an issue. Say what you changed and why in the pull request.

## Communication

- Join [Discord](https://discord.com/invite/MfawtDpxks)
- Questions about developing the project: [GitHub Discussions](https://github.com/windy10v10ai/game/discussions)

## Contributing Code

There are two ways to contribute code:

- Ask windy to become a member of this project, create a branch in this repository, and submit a PR.
- [Fork this project and submit a PR](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request-from-a-fork)

Branch from the latest `develop`. Branch name rule:

- Work for an issue: `feature/{issue number}-{short-summary}`
- Small fixes without an issue: `fix/{short-summary}`, `docs/{short-summary}`, `chore/{short-summary}`

### Pull Requests

- Create the pull request from your branch to `develop` and fill in the template.
- Link the issue with `Fixes #{issue number}`.
- For interface changes, attach a screenshot.
- Say what you tested and what you did not. Unchecked items are fine, unverified claims are not.
- Before pushing, run `npm run lint`, `npm run test` and `npm run prettier-check`.

### Never commit secrets

Do not commit API keys, tokens, passwords or personal data, and do not paste them into issues or pull requests. If you find a security problem, contact the maintainer privately on Discord instead of opening a public issue.

## License of Contributions

This project is licensed under the **GNU GPL version 3** (with a Steam/Workshop
distribution exception — see [`LICENSE.EXCEPTIONS.md`](../LICENSE.EXCEPTIONS.md)).

By submitting a contribution (a pull request, patch, or any other code), you
agree that:

- Your contribution is licensed to the project and its users under the GPLv3, and
- You grant the project maintainer (windy) a **perpetual, irrevocable,
  non-exclusive right to relicense your contribution under any license**,
  including more permissive licenses such as MIT.

You confirm that you have the right to grant this (the contribution is your own
work, or you are otherwise authorized to submit it). This keeps future
relicensing possible without having to track down every contributor.
