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

const validate = (link, addLinks, i18n) => {
  const schema = yup.string()
    .trim()
    .required(i18n.t('errors.required'))
    .url(i18n.t('errors.invalidUrl'))
    .notOneOf(addLinks, i18n.t('errors.duplicateUrl'));

  return schema.validate(link);
};

const makeFeed = (feed, value) => ({
  title: feed.title,
  description: feed.description,
  id: uniqueId(),
  link: value,
});

const makePost = (posts) => posts.map(({ title, description, link }) => ({
  title,
  description,
  id: uniqueId(),
  link,
}));

const fetchPostsFromFeeds = (feeds, state, i18n) => {
  const fetchPromises = feeds.map((feed) => getAxiosResponse(feed.link)
    .then((response) => parse(response, i18n))
    .then((parsedData) => {
      const newPosts = makePost(parsedData.posts);
      const uniqueNewPosts = newPosts.filter(
        (newPost) => !state.posts.some((post) => post.link === newPost.link),
      );

      if (uniqueNewPosts.length > 0) {
        state.posts.unshift(...uniqueNewPosts);
      }
    })
    .catch((error) => {
      throw new Error(error.message);
    }));

  return Promise.all(fetchPromises);
};

const updatePosts = (state, i18n) => {
  const timeOut = 5000;

  const update = () => {
    const { feeds } = state;

    fetchPostsFromFeeds(feeds, state, i18n)
      .finally(() => {
        setTimeout(update, timeOut);
      });
  };

  update();
};

const app = () => {
  const defaultLang = 'ru';
  const i18n = i18next.createInstance();
  i18n.init({
    lng: defaultLang,
    debug: false,
    resources,
  }).then(() => {
    yup.setLocale({
      mixed: { notOneOf: i18n.t('errors.duplicateUrl') },
      string: { url: i18n.t('errors.invalidUrl') },
    });

    const elements = {
      form: document.querySelector('.rss-form'),
      input: document.querySelector('#url-input'),
      feedback: document.querySelector('.feedback'),
      submit: document.querySelector('.rss-form [type="submit"]'),
      feeds: document.querySelector('.feeds'),
      posts: document.querySelector('.posts'),
      modalTitle: document.querySelector('.modal-title'),
      modalDescription: document.querySelector('.modal-body'),
      modalLink: document.querySelector('.full-article'),
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
      readPosts: [],
      activePost: null,
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
          updatePosts(state, i18n);
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

    elements.posts.addEventListener('click', (e) => {
      const idPost = e.target.dataset.id;
      const selectPost = state.posts.find((post) => idPost === post.id);
      state.activePost = selectPost;
      state.readPosts.push(selectPost);
    });
  });
};

export default app;
