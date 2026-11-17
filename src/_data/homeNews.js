// The four news cards on the home page: Radda's own newest update first (it has
// a page and usually a photo), then the newest items from partners and the press.
const news = require("./news.js");

const CARDS_ON_HOME = 4;

const ownUpdate = news.find((item) => item.type === "update");
const others = news.filter((item) => item !== ownUpdate);

module.exports = (ownUpdate ? [ownUpdate] : []).concat(others).slice(0, CARDS_ON_HOME);
