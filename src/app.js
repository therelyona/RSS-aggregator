import axios from 'axios';
import { uniqueId } from 'lodash';
import * as yup from 'yup';
import onChange from 'on-change';
import i18next from 'i18next';
import resources from './locales/index.js';
import view from './view.js';
import parse from './parse.js';

const getAxiosResponse = (link) => {
  const url = `https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(link)}`;
  return axios.get(url);
};

const makeFeed = (feed, value) => {
  const { title, description } = feed;
  const id = uniqueId();
  const link = value;
  return {
    title,
    description,
    id,
    link,
  };
};

const makePost = (posts) => {
  const newPosts = posts.map((item) => {
    const { title, description, link } = item;
    const id = uniqueId();
    return {
      title,
      description,
      id,
      link,
    };
  });
  return newPosts;
};

const validate = (link, addLinks, i18n) => {
  const schema = yup.string()
    .trim()
    .required(i18n.t('errors.required'))
    .url(i18n.t('errors.invalidUrl'))
    .notOneOf(addLinks, i18n.t('errors.duplicateUrl'))
    .validate(link);

  return schema;
};

const app = () => {
  const i18n = i18next.createInstance();
  i18n.init({
    lng: 'ru',
    debug: false,
    resources,
  }).then(() => {
    yup.setLocale({
      mixed: {
        notOneOf: i18n.t('errors.duplicateUrl'),
      },
      string: {
        url: i18n.t('errors.invalidUrl'),
      },
    });

    const elements = {
      form: document.querySelector('.rss-form'),
      input: document.querySelector('#url-input'),
      feedback: document.querySelector('.feedback'),
      submit: document.querySelector('.rss-form [type="submit"]'),
      feeds: document.querySelector('.feeds'),
      posts: document.querySelector('.posts'),
    };

    const initialState = {
      form: {
        processState: 'filling',
        isValid: true,
        addLinks: [],
      },
      errors: {},
      feeds: [],
      posts: [],
    };

    const state = onChange(initialState, view(initialState, elements, i18n));

    elements.form.addEventListener('submit', (event) => {
      event.preventDefault();
      state.form.processState = 'sending';
      const formData = new FormData(event.target);
      const value = formData.get('url');
      const links = state.form.addLinks;

      validate(value, links, i18n)
        .then(() => getAxiosResponse(value))
        .then((response) => parse(response, i18n))
        .then((parseResponse) => {
          const feed = makeFeed(parseResponse.feed, value);
          const posts = makePost(parseResponse.posts);

          state.feeds.unshift(feed);
          state.posts = [...posts, ...state.posts];
          state.form.addLinks.push(value);

          state.form.isValid = true;
          state.form.processState = 'finished';
        })
        .catch((error) => {
          if (axios.isAxiosError(error)) {
            state.errors = i18n.t('errors.networkError');
          } else {
            state.errors = error.message;
          }
          state.form.isValid = false;
          state.form.processState = 'failed';
        })
        .finally(() => {
          state.form.processState = 'filling';
        });
    });
  });
};

export default app;
