# Changelog

All notable changes to Regenboog Rekenen. Every release is a git tag `vX.Y.Z` that publishes the image `ghcr.io/jorann/rekenen:X.Y.Z`.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and versions follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [1.2.0] - 2026-10-16

### Added

- A dashboard for you, in Dutch, as a separate service on port 3001 that reads the same database. It shows how much Nomi practised, how often she gets sums right the first time, and how fast she is, per day or week and compared with the period before.
- In the dashboard, a grid of all times-table sums that shows which ones are slow or often wrong, plus and min split by going over a ten, her most common wrong answers, and every session with every answer she gave.
- Her character, coins, purchases and wish in the dashboard, with a form to give her coins (or take some back) with a note. She sees a gift as a surprise in the app.
- The dashboard asks for the password in `DASHBOARD_PASSWORD` and can only add coin gifts; everything else is read-only. It is optional: set `COMPOSE_PROFILES=dashboard` and the password in `.env` to run it. Without them nothing changes on the server.

## [1.1.0] - 2026-10-16

### Added

- Nomi earns a coin for every sum she solves, including the sums she already did. During the game each coin flies into her purse, and the end of every round and game shows how many she earned.
- A new home screen with her own character, her coins and her wish, and three buttons: Rekenen, Aankleden and Mijn plekje.
- Aankleden: she makes her character (skin, eyes, freckles, eight hairstyles, hair colours) and can try on and buy clothes, dresses, shoes, hats, glasses, wings, things to hold and pets. She picks the colour of most clothes herself. Buying always asks first.
- Mijn plekje: she saves for a piece of land, then a tent, a wooden house, a cottage or a castle, and a garden with flowers, trees, a swing, a pond, a trampoline and more that she arranges by dragging.
- For something she can't afford yet she can tap "Dit wil ik!". The home screen and the end of a game show how far she is.
- You can give her coins as a present with one line of SQL (see the README). She sees a gift message with your note.
- Her coins and everything she bought are kept on the server, so nothing is lost if the iPad clears its storage. Buying also works without Wi-Fi.
- Every release gets a page under Releases on GitHub, with that version's changelog as its notes.

### Changed

- The app opens on the new home screen; the settings screen has a home button to go back. With `ASK_NAME` on, the name is asked on its own screen first.
- The license now names Joran as the copyright holder, and a NOTICE file carries that credit along with any copy of the code.

## [1.0.0] - 2026-10-15

First release.

### Added

- Practice addition and subtraction up to 100 (never a negative answer) and the times tables 1 to 10. +, − and × can be mixed.
- Start screen to choose the kind of sums, the number range for + and − (20, 50 or 100), which times tables, the sums per round and the number of rounds.
- Large on-screen number pad for the iPad. A wrong answer shows right away and she can try again as often as she needs.
- A short celebration after every round (rainbow ride, balloons or spinning star) and a big finale after the last round.
- Sound effects with a mute button, and a question before stopping a game halfway.
- Every session, sum and answer is saved to Postgres, with how long each sum took. Time while the iPad is locked doesn't count.
- Results wait on the iPad until the server is reachable, so a Wi-Fi drop loses nothing.
- The player is always Nomi. The name field can be turned back on with `ASK_NAME` in `client/src/config.ts`.
- A Docker image is published to GitHub for every version tag, with a production compose file to run it on a server.

[Unreleased]: https://github.com/Jorann/rekenen/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/Jorann/rekenen/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/Jorann/rekenen/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/Jorann/rekenen/releases/tag/v1.0.0
