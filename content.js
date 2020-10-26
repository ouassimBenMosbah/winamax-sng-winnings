const leaderbDetails = document.getElementsByClassName('leaderb details');
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

const h1s = document.getElementsByTagName('h1');
let userH1;
if (h1s.length > 0) {
  userH1 = h1s[0];

  const el = document.createElement('h3');
  el.classList.add('user-stats');
  el.classList.add(totalWinnings > 0 ? 'winning-player' : 'losing-player');
  el.innerHTML = `${getStatsInnerHtml(nbSngPlayed, totalWinnings, roi)}`;

  userH1.parentNode.prepend(el);
} else {
  throw new Error('H1 inexistant');
}

function getStatsInnerHtml(nbSngPlayed, totalWinnings, roi) {
  const winnings =
    totalWinnings > 0 ? `+${totalWinnings.toFixed(2)}` : `${totalWinnings.toFixed(2)}`;
  return `Stats: ${nbSngPlayed}sng, ${winnings}€ (ROI: ${roi.toFixed(2)}%)`;
}

function insertAfter(referenceNode, newNode) {
  referenceNode.nextElementSibling.insertBefore(newNode, referenceNode.nextSibling);
}
