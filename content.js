(function () {
  const playerDetailUrlRegEx = /https:\/\/www\.winamax\.fr\/poker\/challenges\/leaderboard_detail\.php\?user=.*&lb=[0-9]+&d=[0-9]+/;
  const leaderboardUrlRegEx = /https:\/\/www\.winamax\.fr\/les-challenges-winamax_sit-n-go_.*/;

  if (location.href.match(playerDetailUrlRegEx)) {
    onePlayerMain(document);
  } else if (location.href.match(leaderboardUrlRegEx)) {
    leaderboardMain(document);
  }
})();

/**
 * The main code executed in leaderboard page
 * @param {document} doc - the document of the leaderboard page
 */
function leaderboardMain(doc) {
  const wildCard = '{{__username__}}';
  const anonymousUserDetailUrl = getUserDetailUrl(doc, wildCard);
  const users = getUsers(doc);
  if (users.length > 0) {
    users.forEach((user, i) => {
      // TODO: remove this condition in order to execute all user details
      if (i < 5) {
        let userDetailUrl = anonymousUserDetailUrl.replace(
          wildCard,
          encodeURIComponent(user.name.replace(/\s/g, '+'))
        );
        getUserStats(userDetailUrl);
      }
    });
  }
}

/**
 * get user stats from his detail url
 * @param {string} userDetailUrl the user detail url
 */
function getUserStats(userDetailUrl) {
  httpGetAsync(userDetailUrl, computeUserEarnings);
}

/**
 *
 * @param {string} theUrl the ressource url
 * @param {(doc: Document) => { nbSngPlayed: number, totalWinnings: number, roi: number }} callback on success
 */
function httpGetAsync(theUrl, callback) {
  var xmlHttp = new XMLHttpRequest();
  xmlHttp.onreadystatechange = function () {
    if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
      const domParser = new DOMParser();
      const doc = domParser.parseFromString(xmlHttp.responseText, 'text/html');
      const { nbSngPlayed, totalWinnings, roi } = callback(doc);
      console.log({ nbSngPlayed, totalWinnings, roi });
    }
  };
  xmlHttp.open('GET', theUrl, true);
  xmlHttp.send(null);
}

/**
 * get the users names and HTMLElements
 * @param {document} doc the leaderboard page document
 */
function getUsers(doc) {
  const users = [];
  const leaderboardTBody = doc.getElementsByClassName('leaderb')[0].children[1].children;

  let i = 0;
  if (leaderboardTBody[i].children.length > 1) {
    while (leaderboardTBody[i].children[1].innerText && i < 100) {
      users.push({
        name: leaderboardTBody[i].children[1].innerText,
        element: leaderboardTBody[i].children[1],
      });
      i++;
    }
  }
  return users;
}

/**
 * get the user earnings detail url
 * @param {document} doc the doument of the leaderboard page
 * @param {string} wildCard the joker string to replace user name
 */
function getUserDetailUrl(doc, wildCard) {
  const LB_INPUT_INDEX_IN_MAIN_FORM = 1;
  const D_INPUT_INDEX_IN_MAIN_FORM = 2;
  const mainForm = doc.getElementById('detail');
  if (mainForm) {
    const lbValue = mainForm.children[LB_INPUT_INDEX_IN_MAIN_FORM].value;
    const dValue = mainForm.children[D_INPUT_INDEX_IN_MAIN_FORM].value;
    return `${mainForm.action}?user=${wildCard}&lb=${lbValue}&d=${dValue}`;
  } else {
    throw new Error('Main form undefined');
  }
}

/**
 * The main code executed in user page
 * @param {document} doc - the document of a user detail page
 */
function onePlayerMain(doc) {
  const { nbSngPlayed, totalWinnings, roi } = computeUserEarnings(doc);
  insertResults(doc, nbSngPlayed, totalWinnings, roi);
}

/**
 * Compute one user earnings
 * @param {document} doc - the document of a user detail page
 * @returns {object} { totalWinnings, roi, nbSngPlayed } - representing user statistics
 */
function computeUserEarnings(doc) {
  const leaderbDetails = doc.getElementsByClassName('leaderb details');
  let sngTbodies;
  if (leaderbDetails.length > 0 && leaderbDetails[0].childElementCount === 2) {
    sngTbodies = leaderbDetails[0].children[1].children;
  } else {
    throw new Error('Tableau de résultat introuvable');
  }

  let totalWinnings = 0;
  let totalBuyins = 0;
  const nbSngPlayed = sngTbodies.length;
  [...sngTbodies].forEach((sngTbody) => {
    const buyin = sngTbody.children[3].innerText;
    const fees = sngTbody.children[4].innerText;
    const winnings = sngTbody.children[6].innerText;
    totalWinnings =
      totalWinnings +
      parseFloat(winnings.replace(',', '.')) -
      parseFloat(buyin.replace(',', '.')) -
      parseFloat(fees.replace(',', '.'));
    totalBuyins =
      totalBuyins + parseFloat(buyin.replace(',', '.')) + parseFloat(fees.replace(',', '.'));
  });
  const roi = (100 * totalWinnings) / totalBuyins;
  return { nbSngPlayed, totalWinnings, roi };
}

/**
 * Insert the user results into the page (prepending the user name)
 * @param {document} doc - The user detail page document where the stats will be insered
 * @param {number} nbSngPlayed - number sng played
 * @param {number} totalWinnings - total winnings in euro
 * @param {number} roi - the return on investment
 */
function insertResults(doc, nbSngPlayed, totalWinnings, roi) {
  const h1s = doc.getElementsByTagName('h1');
  let userH1;
  if (h1s.length > 0) {
    userH1 = h1s[0];

    const el = doc.createElement('h3');
    el.classList.add('user-stats');
    el.classList.add(totalWinnings > 0 ? 'winning-player' : 'losing-player');
    el.innerHTML = `${getStatsInnerHtml(nbSngPlayed, totalWinnings, roi)}`;

    userH1.parentNode.prepend(el);
  } else {
    throw new Error('H1 inexistant');
  }
}

/**
 * get the user stats inner html
 * @param {number} nbSngPlayed - number sng played
 * @param {number} totalWinnings - total user winnings in euro
 * @param {number} roi - the user return on investment
 */
function getStatsInnerHtml(nbSngPlayed, totalWinnings, roi) {
  const winnings =
    totalWinnings > 0 ? `+${totalWinnings.toFixed(2)}` : `${totalWinnings.toFixed(2)}`;
  return `Stats: ${nbSngPlayed}sng, ${winnings}€ (ROI: ${roi.toFixed(2)}%)`;
}
