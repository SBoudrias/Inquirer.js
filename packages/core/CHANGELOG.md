# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [12.1.1](https://github.com/SBoudrias/Inquirer.js/compare/%40inquirer%2Fcore%4012.1.0...%40inquirer%2Fcore%4012.1.1) (2026-11-21)

### Bug Fixes

- **@inquirer/core:** count terminal rows after wrapping ([#2438](https://github.com/SBoudrias/Inquirer.js/issues/2438)) ([51a7e9e](https://github.com/SBoudrias/Inquirer.js/commit/51a7e9e4c5b8446fc9e62784b2ac348153fafc8e))
- **@inquirer/core:** paint state set by effects during a render flush ([#2445](https://github.com/SBoudrias/Inquirer.js/issues/2445)) ([c683e1f](https://github.com/SBoudrias/Inquirer.js/commit/c683e1f0ade4c150960d601ba37b391eb23a0584))
- **@inquirer/core:** reject pending prompts on terminal EOF ([#2428](https://github.com/SBoudrias/Inquirer.js/issues/2428)) ([de32bdf](https://github.com/SBoudrias/Inquirer.js/commit/de32bdf9e2aa403995f7a370ece27f4981b1242a))
- **@inquirer/testing:** emit each typed keypress once and deliver special keys to readline ([#2447](https://github.com/SBoudrias/Inquirer.js/issues/2447)) ([bd24091](https://github.com/SBoudrias/Inquirer.js/commit/bd24091e2a4b0d347d6ffefdc8d6ed0454b68a70))
- strict confirm keyword precedence and plain-decimal number parsing ([#2435](https://github.com/SBoudrias/Inquirer.js/issues/2435)) ([7fc5c8a](https://github.com/SBoudrias/Inquirer.js/commit/7fc5c8a38db0774e7d461c9f67202de9807389d3))

### Reverts

- restore Node.js 20 support until the next major ([#2449](https://github.com/SBoudrias/Inquirer.js/issues/2449)) ([6e24763](https://github.com/SBoudrias/Inquirer.js/commit/6e247637d13f019d5681c82d45f2ad81cd272815)), closes [#2370](https://github.com/SBoudrias/Inquirer.js/issues/2370) [#2164](https://github.com/SBoudrias/Inquirer.js/issues/2164) [#2370](https://github.com/SBoudrias/Inquirer.js/issues/2370) [#2431](https://github.com/SBoudrias/Inquirer.js/issues/2431)
