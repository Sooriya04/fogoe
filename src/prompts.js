let clackModule = null;

async function getClack() {
  if (!clackModule) {
    clackModule = await import('@clack/prompts');
  }
  return clackModule;
}

function handleCancel(value, p) {
  if (p.isCancel(value)) {
    p.cancel('Operation cancelled.');
    process.exit(0);
  }
  return value;
}

async function intro(title) {
  const p = await getClack();
  p.intro(title);
}

async function outro(message) {
  const p = await getClack();
  p.outro(message);
}

async function cancel(message = 'Operation cancelled.') {
  const p = await getClack();
  p.cancel(message);
}

async function input(message, initial = '', validate = null) {
  const p = await getClack();
  const val = await p.text({
    message,
    placeholder: initial,
    defaultValue: initial,
    initialValue: initial,
    validate: (val) => {
      if (!validate) return;
      const res = validate(val);
      if (typeof res === 'string') return res;
      if (res instanceof Error) return res.message;
      return;
    },
  });
  return handleCancel(val, p);
}

async function select(message, options, initialValue) {
  const p = await getClack();
  const formattedOptions = options.map((opt) => {
    if (typeof opt === 'string') {
      return {
        value: opt,
        label: opt,
        hint: opt.includes('coming soon') ? 'coming soon' : undefined,
      };
    }
    return opt;
  });

  const val = await p.select({
    message,
    options: formattedOptions,
    initialValue: initialValue || formattedOptions[0]?.value,
  });
  return handleCancel(val, p);
}

async function confirm(message, initialValue = true) {
  const p = await getClack();
  const val = await p.confirm({
    message,
    initialValue,
  });
  return handleCancel(val, p);
}

async function spinner() {
  const p = await getClack();
  return p.spinner();
}

async function note(message, title) {
  const p = await getClack();
  p.note(message, title);
}

module.exports = {
  intro,
  outro,
  cancel,
  input,
  select,
  confirm,
  spinner,
  note,
  getClack,
};
