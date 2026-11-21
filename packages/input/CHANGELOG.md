# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [5.2.1](https://github.com/SBoudrias/Inquirer.js/compare/%40inquirer%2Finput%405.2.0...%40inquirer%2Finput%405.2.1) (2026-11-21)

### Bug Fixes

- **@inquirer/core:** count terminal rows after wrapping ([#2438](https://github.com/SBoudrias/Inquirer.js/issues/2438)) ([51a7e9e](https://github.com/SBoudrias/Inquirer.js/commit/51a7e9e4c5b8446fc9e62784b2ac348153fafc8e))
- **@inquirer/core:** reject pending prompts on terminal EOF ([#2428](https://github.com/SBoudrias/Inquirer.js/issues/2428)) ([de32bdf](https://github.com/SBoudrias/Inquirer.js/commit/de32bdf9e2aa403995f7a370ece27f4981b1242a))
- **@inquirer/input:** drop keys typed while validation is pending ([#2412](https://github.com/SBoudrias/Inquirer.js/issues/2412)) ([667fe1b](https://github.com/SBoudrias/Inquirer.js/commit/667fe1bed81d9a0cb20f62276f6e3542e6677d37))
- **@inquirer/input:** keep pattern validation repeatable ([#2419](https://github.com/SBoudrias/Inquirer.js/issues/2419)) ([cde8204](https://github.com/SBoudrias/Inquirer.js/commit/cde8204bab43fe9600cc92cb1cbecd7aced022b8))
- **@inquirer/testing:** emit each typed keypress once and deliver special keys to readline ([#2447](https://github.com/SBoudrias/Inquirer.js/issues/2447)) ([bd24091](https://github.com/SBoudrias/Inquirer.js/commit/bd24091e2a4b0d347d6ffefdc8d6ed0454b68a70))
- keep the readline line in sync with displayed prompt values ([#2448](https://github.com/SBoudrias/Inquirer.js/issues/2448)) ([ba08e1d](https://github.com/SBoudrias/Inquirer.js/commit/ba08e1d3f4631b928f25c30a03498790c67da221))

### Reverts

- restore Node.js 20 support until the next major ([#2449](https://github.com/SBoudrias/Inquirer.js/issues/2449)) ([6e24763](https://github.com/SBoudrias/Inquirer.js/commit/6e247637d13f019d5681c82d45f2ad81cd272815)), closes [#2370](https://github.com/SBoudrias/Inquirer.js/issues/2370) [#2164](https://github.com/SBoudrias/Inquirer.js/issues/2164) [#2370](https://github.com/SBoudrias/Inquirer.js/issues/2370) [#2431](https://github.com/SBoudrias/Inquirer.js/issues/2431)
