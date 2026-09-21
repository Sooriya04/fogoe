const prompts = require("prompts");

const onCancel = () => {
  console.log("\nAborted.");
  process.exit(0);
};

async function input(message, initial = "", validate = null) {
  const { value } = await prompts({
    type: "text",
    name: "value",
    message,
    initial,
    validate: validate || (() => true)
  }, { onCancel });
  return value;
}

async function select(message, options) {
  const { value } = await prompts({
    type: "select",
    name: "value",
    message,
    choices: options.map((opt) => ({
      title: opt,
      value: opt,
      disabled: opt.includes("coming soon")
    }))
  }, { onCancel });
  return value;
}

module.exports = { input, select };
