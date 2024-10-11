import './styles.scss';
import 'bootstrap';
import * as yup from 'yup';
import onChange from 'on-change';
import i18next from 'i18next';
import resources from './locales/index.js';
import view from './view.js';

const validate = (link, links, i18nInstance) => {
  const schema = yup.string()
    .url(i18nInstance.t('notURL'))
    .required()
    .notOneOf(links, i18nInstance.t('duplicateUrl'));

  return schema.validate(link)
    .then(() => null)
    .catch((error) => ({ url: error.message }));
};

const app = () => {
  const i18nInstance = i18next.createInstance();
  i18nInstance
    .init({
      lng: 'ru',
      debug: false,
      resources,
    });

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

  const state = onChange(initialState, view(initialState, elements, i18nInstance));

  elements.form.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const link = formData.get('url').trim();
    const links = state.feeds.map((feed) => feed.url);

    validate(link, links, i18nInstance)
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

export default app;
