## ISSUSE 15 : move git functionality into src/github modules

Refactored the GitHub/Git functionality by creating a new src/github/ folder and splitting the monolithic git.js into 4 modular files: auth.js (authentication checks), commands.js (individual git operations like init, add, commit, push), gitignore.js (.gitignore setup), and index.js (main orchestrator that exports everything). Updated the imports in src/index.js to point to the new ./github path and deleted the old git.js. The flow remains unchanged - initGit() works exactly the same way, but the code is now cleaner and more maintainable.


ISSUE 16 : Implement extended Git flow and help command
Enhanced the Fogoe CLI with a robust, state-driven Git flow and a comprehensive help system. Added the fogoe push <message> command, which validates the project's Git state via fogoe.config.json before performing a combined stage, commit, and push operation. Implemented fogoe init to orchestrate repository initialization and automatically toggle the configuration state to "git": true. Additionally, introduced a --help / -h flag that displays usage guidelines and examples for both global and npx execution paths. Updated the README.md to thoroughly document the new command suite and configuration logic.
