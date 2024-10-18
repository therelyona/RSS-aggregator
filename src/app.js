import axios from 'axios';
import { uniqueId } from 'lodash';
import * as yup from 'yup';
import onChange from 'on-change';
import i18next from 'i18next';
import resources from './locales/index.js';
import view from './view.js';
import parse from './parse.js';

const makeProxyURL = (link) => {
  const proxy = 'https://allorigins.hexlet.app/get';
  const url = new URL(proxy);

  url.searchParams.append('disableCache', 'true');
  url.searchParams.append('url', link);

  return url;
};

const getAxiosResponse = (link) => {
  const proxiedUrl = makeProxyURL(link);
  return axios.get(proxiedUrl);
};

const validate = (link, addLinks) => {
  const schema = yup.string()
    .trim()
    .required('required')
    .url('invalidUrl')
    .notOneOf(addLinks, 'duplicateUrl');

  return schema.validate(link);
};

const makeFeed = ({ title, description }, link) => ({
  title,
  description,
  id: uniqueId(),
  link,
});

const makePosts = (posts) => posts.map(({ title, description, link }) => ({
  title,
  description,
  id: uniqueId(),
  link,
}));

const fetchPostsFromFeeds = (feeds, state) => {
  const fetchPromises = feeds.map((feed) => getAxiosResponse(feed.link)
    .then((response) => parse(response))
    .then(({ items }) => {
      const newPosts = makePosts(items);
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

const updatePosts = (state) => {
  const timeOut = 5000;

  const update = () => {
    const { feeds } = state;

    fetchPostsFromFeeds(feeds, state)
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
      mixed: { notOneOf: 'duplicateUrl' },
      string: { url: 'invalidUrl' },
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
      },
      errors: {
        form: null,
        network: null,
      },
      addLinks: [],
      feeds: [],
      posts: [],
      readPosts: [],
      activePost: null,
    };

    const state = onChange(initialState, view(initialState, elements, i18n));

    updatePosts(state);

    elements.form.addEventListener('submit', (event) => {
      event.preventDefault();
      state.form.processState = 'sending';

      const formData = new FormData(event.target);
      const value = formData.get('url');
      const links = state.addLinks;

      validate(value, links, i18n)
        .then(() => getAxiosResponse(value))
        .then((response) => {
          const { title, description, items } = parse(response);
          const feed = makeFeed({ title, description }, value);
          const posts = makePosts(items);

          state.feeds.unshift(feed);
          state.posts = [...posts, ...state.posts];
          state.addLinks.push(value);

          state.form.isValid = true;
          state.form.processState = 'finished';
        })
        .catch((error) => {
          if (axios.isAxiosError(error)) {
            state.errors.network = 'networkError';
          } else {
            state.errors.form = error.message;
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
