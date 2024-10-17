export default (response) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(response.data.contents, 'application/xml');

  const parserError = doc.querySelector('parsererror');
  if (parserError) throw new Error('parsingError');

  const feed = {
    title: doc.querySelector('title').textContent,
    description: doc.querySelector('description').textContent,
    link: doc.querySelector('link').textContent,
  };

  const feedItems = doc.querySelectorAll('item');
  const posts = [...feedItems].map((item) => ({
    title: item.querySelector('title').textContent,
    description: item.querySelector('description').textContent,
    link: item.querySelector('link').textContent,
  }));

  return { feed, posts };
};
