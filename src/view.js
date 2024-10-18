const renderErrors = (elements, errors, i18n) => {
  const {
    feedback,
    input,
    form,
    submit,
  } = elements;

  if (errors.network) {
    feedback.textContent = i18n.t('errors.networkError');
  } else if (errors.form) {
    feedback.textContent = i18n.t(`errors.${errors.form}`);
  }

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

const renderProcessState = (value, elements, i18n, errors) => {
  const { submit } = elements;
  switch (value) {
    case 'filling':
      submit.disabled = false;
      break;
    case 'sending':
      submit.disabled = true;
      break;
    case 'finished':
      renderSuccess(elements, i18n);
      break;
    case 'failed':
      renderErrors(elements, errors, i18n);
      break;
    default:
      break;
  }
};

const renderPosts = (elements, state, i18n) => {
  const { posts } = elements;
  posts.innerHTML = '';

  const container = document.createElement('div');
  container.classList.add('card', 'border-0');

  const cardBody = document.createElement('div');
  cardBody.classList.add('card-body');

  const h2 = document.createElement('h2');
  h2.textContent = i18n.t('posts');
  h2.classList.add('card-title', 'h4');
  cardBody.append(h2);

  const ul = document.createElement('ul');
  ul.classList.add('list-group', 'border-0', 'rounded-0');
  container.append(cardBody, ul);

  state.posts.forEach((post) => {
    const li = document.createElement('li');
    li.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start', 'border-0', 'border-end-0');
    ul.append(li);

    const a = document.createElement('a');
    a.classList.add('fw-bold');
    a.setAttribute('href', post.link);
    a.setAttribute('data-id', post.id);
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener noreferrer');
    a.textContent = post.title;

    if (state.readPosts.some((readPost) => readPost.id === post.id)) {
      a.classList.remove('fw-bold');
      a.classList.add('fw-normal', 'text-muted');
    } else {
      a.classList.add('fw-bold');
    }

    const button = document.createElement('button');
    button.classList.add('btn', 'btn-outline-primary', 'btn-sm');
    button.setAttribute('type', 'button');
    button.setAttribute('data-id', post.id);
    button.setAttribute('data-bs-toggle', 'modal');
    button.setAttribute('data-bs-target', '#modal');
    button.textContent = i18n.t('postsButton');

    li.append(a, button);
  });

  posts.append(container);
};

const renderFeeds = (elements, state, i18n) => {
  const { feeds } = elements;
  feeds.innerHTML = '';

  const container = document.createElement('div');
  container.classList.add('card', 'border-0');

  const cardBody = document.createElement('div');
  cardBody.classList.add('card-body');

  const h2 = document.createElement('h2');
  h2.textContent = i18n.t('feeds');
  h2.classList.add('cars-title', 'h4');
  cardBody.append(h2);

  const ul = document.createElement('ul');
  ul.classList.add('list-group', 'border-0', 'rounded-0');
  container.append(cardBody, ul);

  state.feeds.forEach((feed) => {
    const li = document.createElement('li');
    li.classList.add('list-group-item', 'border-0', 'border-end-0');

    const h3 = document.createElement('h3');
    h3.classList.add('h6', 'm-0');
    h3.textContent = feed.title;

    const p = document.createElement('p');
    p.classList.add('m-0', 'small', 'text-black-50');
    p.textContent = feed.description;

    li.append(h3, p);
    ul.append(li);
  });

  feeds.append(container);
};

const renderReadPosts = (elements, posts) => {
  const { modalTitle, modalDescription, modalLink } = elements;
  posts.forEach((post) => {
    const {
      title,
      description,
      link,
      id,
    } = post;
    modalTitle.textContent = title;
    modalDescription.textContent = description;
    modalLink.setAttribute('href', link);

    const linkStyle = document.querySelector(`[data-id="${id}"]`);
    linkStyle.classList.remove('fw-bold');
    linkStyle.classList.add('fw-normal', 'text-muted');
  });
};

const view = (state, elements, i18n) => (path, value) => {
  switch (path) {
    case 'form.processState':
      renderProcessState(value, elements, i18n, state.errors);
      break;
    case 'posts':
      renderPosts(elements, state, i18n);
      break;
    case 'feeds':
      renderFeeds(elements, state, i18n);
      break;
    case 'readPosts':
      renderReadPosts(elements, value);
      break;
    default:
      break;
  }
};

export default view;
