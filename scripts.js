const screens = document.querySelectorAll('.screen');
const lobbyButton = document.querySelector('.lobby-btn');
const gameButtons = document.querySelectorAll('[data-game]');

function activateScreen(targetId) {
  screens.forEach((screen) => {
    screen.classList.toggle('active', screen.id === targetId);
  });

  if (targetId === 'start-screen') {
    lobbyButton.classList.add('hidden');
  } else {
    lobbyButton.classList.remove('hidden');
  }
}

gameButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const game = btn.dataset.game;
    activateScreen(`${game}-screen`);

    if (game === 'blackjack') {
      blackjack.resetRound();
    }
  });
});

lobbyButton.addEventListener('click', () => {
  activateScreen('start-screen');
});

activateScreen('start-screen');

// -----------------------------
// Blackjack Logic
// -----------------------------
const blackjack = (() => {
  const suits = ['♠', '♥', '♦', '♣'];
  const ranks = [
    { rank: 'A', value: 11 },
    { rank: '2', value: 2 },
    { rank: '3', value: 3 },
    { rank: '4', value: 4 },
    { rank: '5', value: 5 },
    { rank: '6', value: 6 },
    { rank: '7', value: 7 },
    { rank: '8', value: 8 },
    { rank: '9', value: 9 },
    { rank: '10', value: 10 },
    { rank: 'J', value: 10 },
    { rank: 'Q', value: 10 },
    { rank: 'K', value: 10 },
  ];

  const dealerHandEl = document.getElementById('dealer-hand');
  const playerHandEl = document.getElementById('player-hand');
  const dealerScoreEl = document.getElementById('dealer-score');
  const playerScoreEl = document.getElementById('player-score');
  const messageEl = document.getElementById('blackjack-message');
  const dealBtn = document.getElementById('blackjack-deal');
  const hitBtn = document.getElementById('blackjack-hit');
  const standBtn = document.getElementById('blackjack-stand');

  let deck = [];
  let dealerHand = [];
  let playerHand = [];
  let roundActive = false;
  let roundComplete = false;

  function buildDeck() {
    const freshDeck = [];

    suits.forEach((suit) => {
      ranks.forEach((rank) => {
        freshDeck.push({ suit, rank: rank.rank, value: rank.value });
      });
    });

    for (let i = freshDeck.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [freshDeck[i], freshDeck[j]] = [freshDeck[j], freshDeck[i]];
    }

    return freshDeck;
  }

  function drawCard() {
    if (!deck.length) {
      deck = buildDeck();
    }

    return deck.pop();
  }

  function calculateScore(hand) {
    let total = 0;
    let aces = 0;

    hand.forEach((card) => {
      total += card.value;
      if (card.rank === 'A') {
        aces += 1;
      }
    });

    while (total > 21 && aces > 0) {
      total -= 10;
      aces -= 1;
    }

    return total;
  }

  function renderHand(hand, container, hideHoleCard = false) {
    container.innerHTML = '';
    hand.forEach((card, index) => {
      const cardDiv = document.createElement('div');
      const shouldHide = hideHoleCard && index === 1;

      cardDiv.classList.add('card');

      if (shouldHide) {
        cardDiv.classList.add('back');
      } else {
        if (card.suit === '♥' || card.suit === '♦') {
          cardDiv.classList.add('red');
        }

        const valueSpan = document.createElement('span');
        valueSpan.className = 'value';
        valueSpan.textContent = card.rank;

        const suitSpan = document.createElement('span');
        suitSpan.className = 'suit';
        suitSpan.textContent = card.suit;

        cardDiv.appendChild(valueSpan);
        cardDiv.appendChild(suitSpan);
      }

      container.appendChild(cardDiv);
    });
  }

  function setMessage(message, status) {
    messageEl.textContent = message;
    messageEl.classList.remove('win', 'lose', 'push');
    if (status) {
      messageEl.classList.add(status);
    }
  }

  function updateUI(revealDealer = false) {
    renderHand(playerHand, playerHandEl);
    renderHand(dealerHand, dealerHandEl, !revealDealer && dealerHand.length > 1);

    const playerScore = calculateScore(playerHand);
    const dealerScore = calculateScore(dealerHand);

    playerScoreEl.textContent = `Score: ${playerScore}`;

    if (revealDealer || !roundActive || dealerHand.length <= 1) {
      dealerScoreEl.textContent = `Score: ${dealerScore}`;
    } else {
      const visibleScore = calculateScore([dealerHand[0]]);
      dealerScoreEl.textContent = `Score: ${visibleScore} + ?`;
    }
  }

  function endRound(message, status) {
    roundComplete = true;
    roundActive = false;
    updateUI(true);
    setMessage(message, status);
  }

  function dealerTurn() {
    while (calculateScore(dealerHand) < 17) {
      dealerHand.push(drawCard());
    }
  }

  function compareHands() {
    const playerScore = calculateScore(playerHand);
    const dealerScore = calculateScore(dealerHand);

    if (dealerScore > 21) {
      endRound('Dealer busts! You win the round.', 'win');
    } else if (playerScore > dealerScore) {
      endRound('You beat the dealer! Congratulations.', 'win');
    } else if (playerScore < dealerScore) {
      endRound('Dealer stands taller this time. You lose.', 'lose');
    } else {
      endRound('Push! It\'s a tie.', 'push');
    }
  }

  function dealInitialCards() {
    playerHand = [drawCard(), drawCard()];
    dealerHand = [drawCard(), drawCard()];
    updateUI(false);

    const playerScore = calculateScore(playerHand);
    const dealerScore = calculateScore(dealerHand);

    if (playerScore === 21 && dealerScore === 21) {
      endRound('Double blackjack! The round is a push.', 'push');
    } else if (playerScore === 21) {
      endRound('Blackjack! A natural 21 wins the round.', 'win');
    } else if (dealerScore === 21) {
      endRound('Dealer shows blackjack. Better luck next time.', 'lose');
    } else {
      setMessage('Make your move — hit or stand?', '');
    }
  }

  function onDeal() {
    roundActive = true;
    roundComplete = false;
    deck = buildDeck();
    setMessage('Good luck! Dealing a fresh round.', '');
    dealInitialCards();
  }

  function onHit() {
    if (!roundActive || roundComplete) return;

    playerHand.push(drawCard());
    updateUI(false);

    const playerScore = calculateScore(playerHand);

    if (playerScore > 21) {
      endRound('You bust! Dealer takes the round.', 'lose');
    }
  }

  function onStand() {
    if (!roundActive || roundComplete) return;

    dealerTurn();
    compareHands();
  }

  dealBtn.addEventListener('click', onDeal);
  hitBtn.addEventListener('click', onHit);
  standBtn.addEventListener('click', onStand);

  function resetRound() {
    roundActive = false;
    roundComplete = false;
    deck = buildDeck();
    dealerHand = [];
    playerHand = [];
    updateUI(false);
    setMessage('Tap "Deal New Round" to begin.', '');
  }

  resetRound();

  return {
    resetRound,
  };
})();

// -----------------------------
// Roulette Logic
// -----------------------------
const roulette = (() => {
  const redNumbers = new Set([
    1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
  ]);

  const balanceEl = document.getElementById('roulette-balance');
  const betAmountEl = document.getElementById('bet-amount');
  const betNumberEl = document.getElementById('bet-number');
  const messageEl = document.getElementById('roulette-message');
  const spinButton = document.getElementById('spin-wheel');
  const betButtons = document.querySelectorAll('.bet-option');
  const wheelNumberEl = document.getElementById('roulette-number');
  const wheelColorEl = document.getElementById('roulette-color');

  let selectedBet = null;
  let balance = 500;

  function setMessage(message, status) {
    messageEl.textContent = message;
    messageEl.classList.remove('win', 'lose', 'push');
    if (status) {
      messageEl.classList.add(status);
    }
  }

  function updateBalance() {
    balanceEl.textContent = balance;
  }

  function selectBet(type) {
    selectedBet = type;
    betButtons.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.bet === type);
    });

    if (type === 'number') {
      betNumberEl.focus();
    }
  }

  betButtons.forEach((btn) => {
    btn.addEventListener('click', () => selectBet(btn.dataset.bet));
  });

  function getColor(number) {
    if (number === 0) return 'green';
    return redNumbers.has(number) ? 'red' : 'black';
  }

  function formatColorLabel(color) {
    if (color === 'red') return 'Red';
    if (color === 'black') return 'Black';
    return 'Green';
  }

  function resolveSpin() {
    if (!selectedBet) {
      setMessage('Choose a bet type to get started.', '');
      return;
    }

    const betAmount = Number.parseInt(betAmountEl.value, 10);

    if (!Number.isFinite(betAmount) || betAmount <= 0) {
      setMessage('Enter a valid bet amount to play.', '');
      return;
    }

    if (betAmount > balance) {
      setMessage('Not enough credits for that wager.', 'lose');
      return;
    }

    let straightNumber = Number.parseInt(betNumberEl.value, 10);

    if (selectedBet === 'number') {
      if (!Number.isInteger(straightNumber) || straightNumber < 0 || straightNumber > 36) {
        setMessage('Choose a valid roulette number between 0 and 36.', '');
        return;
      }
    } else {
      straightNumber = null;
    }

    balance -= betAmount;
    updateBalance();

    const resultNumber = Math.floor(Math.random() * 37);
    const resultColor = getColor(resultNumber);

    let winnings = 0;
    let outcomeMessage = '';
    let status = 'lose';

    if (selectedBet === 'red' || selectedBet === 'black' || selectedBet === 'green') {
      if (selectedBet === resultColor) {
        const multiplier = selectedBet === 'green' ? 35 : 1;
        winnings = betAmount * multiplier;
        status = 'win';
        outcomeMessage = `You called ${formatColorLabel(resultColor)} and won ${
          winnings + betAmount
        } credits!`;
      } else {
        outcomeMessage = `The wheel landed on ${resultNumber} ${formatColorLabel(
          resultColor
        )}. Better luck next spin.`;
      }
    } else if (selectedBet === 'number') {
      if (resultNumber === straightNumber) {
        winnings = betAmount * 35;
        status = 'win';
        outcomeMessage = `Straight up hit! Number ${resultNumber} pays ${
          winnings + betAmount
        } credits.`;
      } else {
        outcomeMessage = `No match this time. The wheel shows ${resultNumber} ${formatColorLabel(
          resultColor
        )}.`;
      }
    }

    if (winnings > 0) {
      balance += betAmount + winnings;
    }

    updateBalance();

    wheelNumberEl.textContent = resultNumber;
    wheelColorEl.textContent = formatColorLabel(resultColor);
    wheelColorEl.className = resultColor;

    setMessage(outcomeMessage, status);
  }

  spinButton.addEventListener('click', resolveSpin);

  selectBet('red');
  updateBalance();

  return {
    selectBet,
  };
})();
