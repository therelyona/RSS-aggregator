import './styles.scss';
import 'bootstrap';
import * as yup from 'yup';
import onChange from 'on-change';

const renderErrors = (elements, errors) => {
  const { feedback, input, form } = elements;

  if (errors.url) {
    feedback.textContent = errors.url;
    input.classList.add('is-invalid');
    feedback.classList.add('text-danger');
    form.reset();
    input.focus();
  } else {
    input.classList.remove('is-invalid');
    feedback.classList.remove('text-danger');
    input.classList.add('is-valid');
    feedback.classList.add('text-success');
    feedback.textContent = 'RSS успешно загружен';
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

const view = (state, elements) => (path, value) => {
  switch (path) {
    case 'form.errors':
      renderErrors(elements, value);
      break;
    case 'process.processState':
      renderProcessState(elements, value);
      break;
    default:
      break;
  }
};

const validate = (link, links) => {
  const schema = yup.string()
    .url('Ссылка должна быть валидным URL')
    .required()
    .notOneOf(links, 'RSS уже существует');

  return schema.validate(link)
    .then(() => null)
    .catch((error) => ({ url: error.message }));
};

const app = () => {
  const elements = {
    form: document.querySelector('.rss-form'),
    input: document.querySelector('#url-input'),
    feedback: document.querySelector('.feedback'),
    submit: document.querySelector('.rss-form [type="submit"]'),
  };

  const initialState = {
    form: {
      processState: 'filling',
      errors: {},
    },
    feeds: [],
  };

  const state = onChange(initialState, view(initialState, elements));

  elements.form.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const link = formData.get('url').trim();
    const links = state.feeds.map((feed) => feed.url);

    validate(link, links)
      .then((errors) => {
        if (errors) {
          state.form.errors = errors;
          state.form.processState = 'failed';
          return;
        }
        state.form.errors = {};
        state.form.processState = 'sending';

        const newFeed = { url: link };
        state.feeds.push(newFeed);

        // После успешного добавления
        state.form.processState = 'finished';
      });
  });
};

app();
