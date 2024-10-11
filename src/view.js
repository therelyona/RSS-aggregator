const renderErrors = (elements, errors, i18nInstance) => {
  const { feedback, input, form } = elements;

  if (errors.url) {
    feedback.textContent = i18nInstance.t(errors.url);
    input.classList.add('is-invalid');
    feedback.classList.add('text-danger');
    form.reset();
    input.focus();
  } else {
    input.classList.remove('is-invalid');
    feedback.classList.remove('text-danger');
    input.classList.add('is-valid');
    feedback.classList.add('text-success');
    feedback.textContent = i18nInstance.t('success');
    form.reset();
    input.focus();
  }
};

const renderProcessState = (elements, process) => {
  const { submit, input } = elements;
  switch (process) {
    case 'filling':
      submit.disabled = false;
      input.disabled = false;
      break;
    case 'sending':
      submit.disabled = true;
      input.disabled = true;
      break;
    case 'finished':
      submit.disabled = false;
      input.disabled = true;
      break;
    case 'failed':
      submit.disabled = false;
      break;
    default:
      throw new Error(`Неизвестный процесс ${process}`);
  }
};

const view = (state, elements, i18nInstance) => (path, value) => {
  switch (path) {
    case 'form.errors':
      renderErrors(elements, value, i18nInstance);
      break;
    case 'process.processState':
      renderProcessState(elements, value);
      break;
    default:
      break;
  }
};

export default view;
