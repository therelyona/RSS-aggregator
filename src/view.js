const renderErrors = (elements, errors) => {
  const {
    feedback,
    input,
    form,
    submit,
  } = elements;

  feedback.textContent = errors.url;
  input.classList.add('is-invalid');
  feedback.classList.add('text-danger');
  submit.disabled = false;
  form.reset();
  input.focus();
};

const renderSuccess = (elements, i18n) => {
  const {
    feedback,
    input,
    form,
    submit,
  } = elements;

  input.classList.remove('is-invalid');
  feedback.classList.remove('text-danger');
  input.classList.add('is-valid');
  feedback.classList.add('text-success');
  feedback.textContent = i18n.t('success');
  submit.disabled = false;
  form.reset();
  input.focus();
};

const view = (state, elements, i18n) => (path, value) => {
  const { submit } = elements;
  switch (path) {
    case 'form.processState':
      if (value === 'filling') {
        submit.disabled = false;
      }
      if (value === 'sending') {
        submit.disabled = true;
      }
      if (value === 'finished') {
        renderSuccess(elements, i18n);
      }
      if (value === 'failed') {
        renderErrors(elements, state.errors);
      }
      break;
    default:
      break;
  }
};

export default view;
