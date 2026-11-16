// Values worked out for every page: its language, its text, and the relative
// paths back to the language root ("up") and the site root ("root").
const langOf = (data) => data.lang || (data.entry && data.entry.lang) || null;

module.exports = {
  lng: (data) => langOf(data),
  t: (data) => {
    const lang = langOf(data);
    return lang ? data.i18n[lang.code] : null;
  },
  up: (data) => (data.depth ? "../" : ""),
  root: (data) => {
    const lang = langOf(data);
    return (data.depth ? "../" : "") + (lang && lang.dir ? "../" : "");
  },
  otherLang: (data) => {
    const lang = langOf(data);
    return lang ? data.langs.find((item) => item.code !== lang.code) : null;
  }
};
