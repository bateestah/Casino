const formatChips = (value) => value.toLocaleString("en-US");

document.addEventListener("DOMContentLoaded", () => {
  const panels = {
    start: document.getElementById("start-screen"),
    blackjack: document.getElementById("blackjack"),
    roulette: document.getElementById("roulette"),
  };

  const blackjackMessage = document.getElementById("blackjack-message");
  const rouletteMessage = document.getElementById("roulette-message");

  const showPanel = (name) => {
    Object.entries(panels).forEach(([key, panel]) => {
      if (panel) {
        if (key === name) {
          panel.classList.add("visible");
          panel.classList.remove("hidden");
        } else {
          panel.classList.remove("visible");
          panel.classList.add("hidden");
        }
      }
    });

    if (name === "start") {
      blackjackMessage.textContent = "Press deal to start a round.";
      rouletteMessage.textContent = "Pick a bet and spin the wheel.";
    }
  };

  document.getElementById("play-blackjack").addEventListener("click", () =>
    showPanel("blackjack")
  );
  document.getElementById("play-roulette").addEventListener("click", () =>
    showPanel("roulette")
  );

  document.querySelectorAll(".back-button").forEach((button) => {
    button.addEventListener("click", () => showPanel("start"));
  });

  /* -------------------------- Blackjack Logic -------------------------- */
  const blackjackState = {
    bank: 500,
    bet: 50,
    deck: [],
    playerHand: [],
    dealerHand: [],
    isRoundActive: false,
  };

  const suits = [
    { symbol: "♠", color: "black" },
    { symbol: "♥", color: "red" },
    { symbol: "♦", color: "red" },
    { symbol: "♣", color: "black" },
  ];

  const ranks = [
    { rank: "A", value: 11 },
    { rank: "2", value: 2 },
    { rank: "3", value: 3 },
    { rank: "4", value: 4 },
    { rank: "5", value: 5 },
    { rank: "6", value: 6 },
    { rank: "7", value: 7 },
    { rank: "8", value: 8 },
    { rank: "9", value: 9 },
    { rank: "10", value: 10 },
    { rank: "J", value: 10 },
    { rank: "Q", value: 10 },
    { rank: "K", value: 10 },
  ];

  const blackjackBankEl = document.getElementById("blackjack-bank");
  const blackjackBetSelect = document.getElementById("blackjack-bet");
  const dealerCardsEl = document.getElementById("dealer-cards");
  const playerCardsEl = document.getElementById("player-cards");
  const dealerScoreEl = document.getElementById("dealer-score");
  const playerScoreEl = document.getElementById("player-score");
  const dealButton = document.getElementById("blackjack-deal");
  const hitButton = document.getElementById("blackjack-hit");
  const standButton = document.getElementById("blackjack-stand");
  const resetButton = document.getElementById("blackjack-reset");

  const buildDeck = () => {
    const deck = [];
    suits.forEach((suit) => {
      ranks.forEach((rank) => {
        deck.push({
          suit: suit.symbol,
          color: suit.color,
          rank: rank.rank,
          value: rank.value,
        });
      });
    });
    return deck;
  };

  const shuffleDeck = (deck) => {
    for (let i = deck.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  };

  const drawCard = () => {
    if (blackjackState.deck.length === 0) {
      blackjackState.deck = shuffleDeck(buildDeck());
    }
    return blackjackState.deck.pop();
  };

  const calculateHandValue = (hand) => {
    let total = 0;
    let aces = 0;
    hand.forEach((card) => {
      total += card.value;
      if (card.rank === "A") {
        aces += 1;
      }
    });
    while (total > 21 && aces > 0) {
      total -= 10;
      aces -= 1;
    }
    return total;
  };

  const createCardElement = (card, hidden = false) => {
    const cardEl = document.createElement("div");
    cardEl.classList.add("card");

    if (hidden) {
      cardEl.classList.add("back");
      return cardEl;
    }

    cardEl.classList.add(card.color);

    const top = document.createElement("span");
    top.classList.add("corner", "top");
    top.textContent = `${card.rank}${card.suit}`;

    const center = document.createElement("span");
    center.classList.add("center");
    center.textContent = card.suit;

    const bottom = document.createElement("span");
    bottom.classList.add("corner", "bottom");
    bottom.textContent = `${card.rank}${card.suit}`;

    cardEl.append(top, center, bottom);
    return cardEl;
  };

  const renderHand = (hand, container, hideHoleCard = false) => {
    container.innerHTML = "";
    hand.forEach((card, index) => {
      const isHoleCard = hideHoleCard && index === 1;
      container.append(createCardElement(card, isHoleCard));
    });
  };

  const updateScores = () => {
    const playerTotal = calculateHandValue(blackjackState.playerHand);
    playerScoreEl.textContent = `Score: ${playerTotal}`;

    if (blackjackState.dealerHand.length === 0) {
      dealerScoreEl.textContent = "Score: 0";
      return;
    }

    if (blackjackState.isRoundActive) {
      const visible = calculateHandValue([blackjackState.dealerHand[0]]);
      dealerScoreEl.textContent = `Score: ${visible}+`;
    } else {
      const dealerTotal = calculateHandValue(blackjackState.dealerHand);
      dealerScoreEl.textContent = `Score: ${dealerTotal}`;
    }
  };

  const updateBlackjackControls = () => {
    dealButton.disabled = blackjackState.isRoundActive || blackjackState.bank <= 0;
    hitButton.disabled = !blackjackState.isRoundActive;
    standButton.disabled = !blackjackState.isRoundActive;
  };

  const updateBlackjackUI = () => {
    const hideHoleCard = blackjackState.isRoundActive && blackjackState.dealerHand.length > 1;
    renderHand(blackjackState.playerHand, playerCardsEl, false);
    renderHand(blackjackState.dealerHand, dealerCardsEl, hideHoleCard);
    updateScores();
    blackjackBankEl.textContent = formatChips(blackjackState.bank);
    updateBlackjackControls();
  };

  const finishRound = (result, text) => {
    let payout = 0;
    switch (result) {
      case "blackjack":
        payout = Math.round(blackjackState.bet * 2.5);
        break;
      case "player":
        payout = blackjackState.bet * 2;
        break;
      case "push":
        payout = blackjackState.bet;
        break;
      default:
        payout = 0;
    }

    blackjackState.bank += payout;
    blackjackState.isRoundActive = false;

    updateBlackjackUI();

    const endText =
      text ||
      (result === "player"
        ? "You win the round!"
        : result === "blackjack"
        ? "Blackjack! Paid 3:2."
        : result === "push"
        ? "Push. Your bet is returned."
        : "Dealer wins this hand.");

    blackjackMessage.innerHTML = `<strong>${endText}</strong>`;

    if (blackjackState.bank <= 0) {
      blackjackMessage.innerHTML +=
        " You are out of chips. Hit Reset Chips to refill your stack.";
    }
  };

  const resetTable = () => {
    blackjackState.deck = [];
    blackjackState.playerHand = [];
    blackjackState.dealerHand = [];
    blackjackState.isRoundActive = false;
    updateBlackjackUI();
    blackjackMessage.textContent = "Press deal to start a round.";
  };

  const startRound = () => {
    if (blackjackState.isRoundActive) {
      return;
    }

    const selectedBet = parseInt(blackjackBetSelect.value, 10);
    if (Number.isNaN(selectedBet) || selectedBet <= 0) {
      blackjackMessage.textContent = "Please choose a valid bet amount.";
      return;
    }

    if (selectedBet > blackjackState.bank) {
      blackjackMessage.textContent = "Not enough chips for that bet.";
      return;
    }

    blackjackState.bet = selectedBet;
    blackjackState.bank -= selectedBet;
    blackjackState.deck = shuffleDeck(buildDeck());
    blackjackState.playerHand = [drawCard(), drawCard()];
    blackjackState.dealerHand = [drawCard(), drawCard()];
    blackjackState.isRoundActive = true;

    updateBlackjackUI();

    const playerTotal = calculateHandValue(blackjackState.playerHand);
    const dealerTotal = calculateHandValue(blackjackState.dealerHand);

    if (playerTotal === 21 && dealerTotal === 21) {
      finishRound("push", "Both you and the dealer hit blackjack! It's a push.");
      return;
    }

    if (playerTotal === 21) {
      finishRound("blackjack", "Blackjack! Enjoy the 3:2 payout.");
      return;
    }

    blackjackMessage.textContent = "Hit or stand to beat the dealer.";
  };

  const playerHit = () => {
    if (!blackjackState.isRoundActive) return;

    blackjackState.playerHand.push(drawCard());
    updateBlackjackUI();

    const total = calculateHandValue(blackjackState.playerHand);
    if (total > 21) {
      finishRound("dealer", "Bust! You went over 21.");
    } else if (total === 21) {
      blackjackMessage.textContent = "21! Standing might be wise.";
    } else {
      blackjackMessage.textContent = "Choose to hit again or stand.";
    }
  };

  const dealerPlay = () => {
    while (calculateHandValue(blackjackState.dealerHand) < 17) {
      blackjackState.dealerHand.push(drawCard());
    }
  };

  const playerStand = () => {
    if (!blackjackState.isRoundActive) return;

    dealerPlay();
    const playerTotal = calculateHandValue(blackjackState.playerHand);
    const dealerTotal = calculateHandValue(blackjackState.dealerHand);

    if (dealerTotal > 21) {
      finishRound("player", `Dealer busts with ${dealerTotal}. You win!`);
      return;
    }

    if (dealerTotal > playerTotal) {
      finishRound("dealer", `Dealer wins ${dealerTotal} to ${playerTotal}.`);
    } else if (dealerTotal < playerTotal) {
      finishRound("player", `You win ${playerTotal} to ${dealerTotal}!`);
    } else {
      finishRound("push", `Push at ${playerTotal}.`);
    }
  };

  const resetBank = () => {
    blackjackState.bank = 500;
    resetTable();
    blackjackMessage.textContent = "Stack refilled. Press deal to play another round.";
  };

  dealButton.addEventListener("click", startRound);
  hitButton.addEventListener("click", playerHit);
  standButton.addEventListener("click", playerStand);
  resetButton.addEventListener("click", resetBank);

  resetTable();

  /* -------------------------- Roulette Logic --------------------------- */
  const rouletteState = {
    bank: 500,
    rotation: 0,
    isSpinning: false,
  };

  const redNumbers = new Set([
    1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
  ]);

  const rouletteBankEl = document.getElementById("roulette-bank");
  const rouletteBetInput = document.getElementById("roulette-bet");
  const rouletteWheel = document.getElementById("roulette-wheel");
  const rouletteWheelNumbers = document.getElementById("roulette-wheel-numbers");
  const rouletteGridWrapper = document.getElementById("roulette-grid-wrapper");
  const rouletteGrid = document.getElementById("roulette-grid");
  const rouletteHistory = document.getElementById("roulette-history");
  const spinButton = document.getElementById("roulette-spin");
  const rouletteResetButton = document.getElementById("roulette-reset");

  const numberField = document.getElementById("roulette-number-field");
  const colorField = document.getElementById("roulette-color-field");
  const parityField = document.getElementById("roulette-parity-field");

  const rouletteNumberSelect = document.getElementById("roulette-number");
  const rouletteColorSelect = document.getElementById("roulette-color");
  const rouletteParitySelect = document.getElementById("roulette-parity");

  const placeholderOption = document.createElement("option");
  placeholderOption.value = "";
  placeholderOption.textContent = "Select a number";
  placeholderOption.disabled = true;
  placeholderOption.selected = true;
  rouletteNumberSelect.append(placeholderOption);

  for (let i = 0; i <= 36; i += 1) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = i;
    rouletteNumberSelect.append(option);
  }

  const getRouletteColor = (number) => {
    if (number === 0) return "green";
    return redNumbers.has(number) ? "red" : "black";
  };

  const getRouletteParity = (number) => {
    if (number === 0) return "none";
    return number % 2 === 0 ? "even" : "odd";
  };

  const wheelSequence = [
    0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10,
    5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
  ];
  const pocketCount = wheelSequence.length;
  const segmentAngle = 360 / pocketCount;
  const halfSegment = segmentAngle / 2;

  const numberIndexMap = new Map();
  const wheelNumberElements = new Map();
  const numberToCell = new Map();
  const insideBets = new Map();

  let lastWinningCell = null;
  let lastWinningLabel = null;
  let syncingSelect = false;
  let currentBetType = "number";
  const spinDuration = 2700;

  if (rouletteWheelNumbers) {
    rouletteWheelNumbers.innerHTML = "";
  }

  const gradientSegments = [];

  wheelSequence.forEach((number, index) => {
    numberIndexMap.set(number, index);
    const color = getRouletteColor(number);
    const colorValue =
      color === "green" ? "#0cae6b" : color === "red" ? "#c0392b" : "#202938";
    const start = (index * segmentAngle).toFixed(4);
    const end = ((index + 1) * segmentAngle).toFixed(4);
    gradientSegments.push(`${colorValue} ${start}deg ${end}deg`);

    if (rouletteWheelNumbers) {
      const label = document.createElement("span");
      label.classList.add("wheel-number", color);
      label.dataset.number = number;
      label.textContent = number;
      const centerAngle = -90 + index * segmentAngle;
      label.style.setProperty("--angle", `${centerAngle}deg`);
      rouletteWheelNumbers.append(label);
      wheelNumberElements.set(number, label);
    }
  });

  rouletteWheel.style.setProperty(
    "--wheel-gradient",
    gradientSegments.join(", ")
  );
  rouletteWheel.style.setProperty(
    "--wheel-start-angle",
    `${-90 - halfSegment}deg`
  );

  const updateRouletteBank = () => {
    rouletteBankEl.textContent = formatChips(rouletteState.bank);
  };

  const updateRouletteBetFields = () => {
    const selected = document.querySelector(
      'input[name="roulette-bet-type"]:checked'
    );
    const betType = selected ? selected.value : "number";

    numberField.classList.toggle("hidden", betType !== "number");
    if (rouletteGridWrapper) {
      rouletteGridWrapper.classList.toggle("hidden", betType !== "number");
    }
    colorField.classList.toggle("hidden", betType !== "color");
    parityField.classList.toggle("hidden", betType !== "parity");
  };

  const clearWinningHighlights = () => {
    if (lastWinningCell) {
      lastWinningCell.classList.remove("result");
      lastWinningCell = null;
    }
    if (lastWinningLabel) {
      lastWinningLabel.classList.remove("result");
      lastWinningLabel = null;
    }
  };

  const showWinningHighlights = (number) => {
    clearWinningHighlights();
    const label = wheelNumberElements.get(number);
    if (label) {
      label.classList.add("result");
      lastWinningLabel = label;
    }
    const cell = numberToCell.get(number);
    if (cell) {
      cell.classList.add("result");
      lastWinningCell = cell;
    }
  };

  const getInsideBetTotal = () => {
    let total = 0;
    insideBets.forEach((amount) => {
      total += amount;
    });
    return total;
  };

  const setWheelLabelActive = (number, isActive) => {
    const label = wheelNumberElements.get(number);
    if (!label) {
      return;
    }
    if (isActive) {
      label.classList.add("active");
    } else {
      label.classList.remove("active");
    }
  };

  const placeInsideBet = (number, amount, { fromSelect = false } = {}) => {
    const cell = numberToCell.get(number);
    if (!cell) {
      return false;
    }

    const previousAmount = insideBets.get(number) ?? 0;
    const newTotal = getInsideBetTotal() - previousAmount + amount;
    if (newTotal > rouletteState.bank) {
      rouletteMessage.textContent =
        "Insufficient chips to cover all inside bets.";
      return false;
    }

    insideBets.set(number, amount);
    cell.classList.add("active");
    cell.setAttribute("aria-pressed", "true");
    cell.setAttribute("data-chip", formatChips(amount));
    cell.dataset.betAmount = String(amount);
    setWheelLabelActive(number, true);

    if (!fromSelect && !syncingSelect) {
      syncingSelect = true;
      rouletteNumberSelect.value = String(number);
      syncingSelect = false;
    }

    return true;
  };

  const removeInsideBet = (number) => {
    const cell = numberToCell.get(number);
    if (cell) {
      cell.classList.remove("active");
      cell.setAttribute("aria-pressed", "false");
      cell.removeAttribute("data-chip");
      delete cell.dataset.betAmount;
    }
    setWheelLabelActive(number, false);
    insideBets.delete(number);

    if (!syncingSelect && rouletteNumberSelect.value === String(number)) {
      syncingSelect = true;
      rouletteNumberSelect.selectedIndex = 0;
      syncingSelect = false;
    }
  };

  const clearInsideBets = () => {
    const numbers = Array.from(insideBets.keys());
    numbers.forEach((number) => removeInsideBet(number));
    insideBets.clear();
    if (!syncingSelect) {
      syncingSelect = true;
      rouletteNumberSelect.selectedIndex = 0;
      syncingSelect = false;
    }
  };

  const toggleInsideBet = (number) => {
    if (rouletteState.isSpinning) {
      return;
    }

    const numberRadio = document.querySelector(
      'input[name="roulette-bet-type"][value="number"]'
    );
    if (numberRadio && !numberRadio.checked) {
      numberRadio.checked = true;
      updateRouletteBetFields();
    }
    currentBetType = "number";

    if (insideBets.has(number)) {
      removeInsideBet(number);
      rouletteMessage.textContent = `Removed chip from ${number}.`;
      return;
    }
    const amount = parseInt(rouletteBetInput.value, 10);
    if (Number.isNaN(amount) || amount <= 0) {
      rouletteMessage.textContent =
        "Enter a valid bet amount to place a chip.";
      return;
    }
    if (placeInsideBet(number, amount)) {
      rouletteMessage.textContent = `Placed ${formatChips(amount)} on ${number}.`;
    }
  };

  const createGridCell = (number) => {
    const cell = document.createElement("button");
    cell.type = "button";
    cell.classList.add("grid-cell");
    const color = getRouletteColor(number);
    cell.classList.add(color);
    cell.dataset.number = number;
    cell.textContent = number;
    cell.setAttribute("aria-pressed", "false");
    cell.setAttribute("aria-label", `Bet on ${number}`);
    if (number === 0) {
      cell.classList.add("zero");
      cell.style.gridRow = "span 12";
    }
    cell.addEventListener("click", () => toggleInsideBet(number));
    numberToCell.set(number, cell);
    return cell;
  };

  if (rouletteGrid) {
    rouletteGrid.innerHTML = "";
    const zeroCell = createGridCell(0);
    rouletteGrid.append(zeroCell);

    for (let row = 0; row < 12; row += 1) {
      const base = row * 3;
      const layoutNumbers = [base + 3, base + 2, base + 1];
      layoutNumbers.forEach((value) => {
        const cell = createGridCell(value);
        rouletteGrid.append(cell);
      });
    }
  }

  const addHistoryItem = (number, color, win, delta) => {
    const item = document.createElement("li");
    item.classList.add(win ? "win" : "loss");
    const colorLabel = color.charAt(0).toUpperCase() + color.slice(1);
    const deltaText = win
      ? `Won ${formatChips(delta)} chips`
      : `Lost ${formatChips(Math.abs(delta))} chips`;

    item.innerHTML = `
      <span class="number">${number} <small>${colorLabel}</small></span>
      <span class="payout">${deltaText}</span>
    `;

    rouletteHistory.prepend(item);
    const items = Array.from(rouletteHistory.children);
    if (items.length > 6) {
      items.slice(6).forEach((el) => el.remove());
    }
  };

  rouletteNumberSelect.addEventListener("change", (event) => {
    if (syncingSelect || rouletteState.isSpinning) {
      return;
    }
    const value = parseInt(event.target.value, 10);
    if (Number.isNaN(value)) {
      return;
    }
    const amount = parseInt(rouletteBetInput.value, 10);
    if (Number.isNaN(amount) || amount <= 0) {
      rouletteMessage.textContent = "Enter a valid bet amount to place a chip.";
      return;
    }
    const placed = placeInsideBet(value, amount, { fromSelect: true });
    if (placed) {
      const numberRadio = document.querySelector(
        'input[name="roulette-bet-type"][value="number"]'
      );
      if (numberRadio && !numberRadio.checked) {
        numberRadio.checked = true;
        updateRouletteBetFields();
      }
      currentBetType = "number";
      rouletteMessage.textContent = `Placed ${formatChips(amount)} on ${value}.`;
    }
  });

  const spinRoulette = () => {
    if (rouletteState.isSpinning) {
      return;
    }

    const betRadio = document.querySelector(
      'input[name="roulette-bet-type"]:checked'
    );
    const betType = betRadio ? betRadio.value : "number";
    currentBetType = betType;

    let totalBet = 0;
    let totalPayout = 0;
    let winnings = 0;
    let chosenValue;
    let numberBets = [];
    let usedInsideBets = false;

    if (betType === "number") {
      if (insideBets.size > 0) {
        numberBets = Array.from(insideBets.entries()).map(
          ([number, amount]) => ({ number, amount })
        );
        totalBet = numberBets.reduce((sum, bet) => sum + bet.amount, 0);
        usedInsideBets = true;
      } else {
        const betAmount = parseInt(rouletteBetInput.value, 10);
        if (Number.isNaN(betAmount) || betAmount <= 0) {
          rouletteMessage.textContent = "Enter a valid bet amount.";
          return;
        }
        const selectedNumber = parseInt(rouletteNumberSelect.value, 10);
        if (Number.isNaN(selectedNumber)) {
          rouletteMessage.textContent =
            "Place at least one chip or choose a number before spinning.";
          return;
        }
        numberBets = [{ number: selectedNumber, amount: betAmount }];
        totalBet = betAmount;
      }
    } else {
      const betAmount = parseInt(rouletteBetInput.value, 10);
      if (Number.isNaN(betAmount) || betAmount <= 0) {
        rouletteMessage.textContent = "Enter a valid bet amount.";
        return;
      }
      totalBet = betAmount;
      if (betType === "color") {
        chosenValue = rouletteColorSelect.value;
      } else {
        chosenValue = rouletteParitySelect.value;
      }
    }

    if (totalBet <= 0) {
      rouletteMessage.textContent = "Enter a valid bet amount.";
      return;
    }

    if (totalBet > rouletteState.bank) {
      rouletteMessage.textContent = "Insufficient chips for that bet.";
      return;
    }

    rouletteState.bank -= totalBet;
    updateRouletteBank();
    clearWinningHighlights();

    rouletteState.isSpinning = true;

    const resultNumber = Math.floor(Math.random() * pocketCount);
    const winningNumber = wheelSequence[resultNumber];
    const resultColor = getRouletteColor(winningNumber);
    const resultParity = getRouletteParity(winningNumber);

    const currentRotation = rouletteState.rotation;
    const currentNormalized = ((currentRotation % 360) + 360) % 360;
    const targetIndex = numberIndexMap.get(winningNumber) ?? 0;
    const targetNormalized =
      ((-targetIndex * segmentAngle) % 360 + 360) % 360;
    let deltaRotation = targetNormalized - currentNormalized;
    deltaRotation = ((deltaRotation % 360) + 360) % 360;
    if (deltaRotation < 1e-4) {
      deltaRotation += 360;
    }
    const extraSpins = 4 + Math.floor(Math.random() * 3);
    const finalRotation =
      currentRotation + deltaRotation + extraSpins * 360;
    rouletteState.rotation = finalRotation;
    rouletteWheel.style.setProperty(
      "--rotation",
      `${finalRotation.toFixed(3)}deg`
    );

    spinButton.disabled = true;
    rouletteMessage.textContent = "The wheel is spinning...";

    let win = false;

    if (betType === "number") {
      numberBets.forEach((bet) => {
        if (bet.number === winningNumber) {
          win = true;
          totalPayout += bet.amount * 36;
        }
      });
      if (win) {
        winnings = totalPayout - totalBet;
      }
    } else if (betType === "color" && resultColor === chosenValue) {
      win = true;
      totalPayout = totalBet * 2;
      winnings = totalBet;
    } else if (
      betType === "parity" &&
      resultParity !== "none" &&
      resultParity === chosenValue
    ) {
      win = true;
      totalPayout = totalBet * 2;
      winnings = totalBet;
    }

    const finalizeSpin = () => {
      if (win) {
        rouletteState.bank += totalPayout;
      }
      updateRouletteBank();
      showWinningHighlights(winningNumber);

      const resultText = `<strong>The ball lands on ${winningNumber} (${resultColor.toUpperCase()})!</strong>`;

      if (win) {
        rouletteMessage.innerHTML = `${resultText} You win ${formatChips(
          winnings
        )} chips.`;
        addHistoryItem(winningNumber, resultColor, true, winnings);
      } else {
        rouletteMessage.innerHTML = `${resultText} You lose ${formatChips(
          totalBet
        )} chips.`;
        addHistoryItem(winningNumber, resultColor, false, totalBet);
      }

      if (betType === "number" && usedInsideBets) {
        clearInsideBets();
      } else if (betType === "number" && !usedInsideBets) {
        syncingSelect = true;
        rouletteNumberSelect.selectedIndex = 0;
        syncingSelect = false;
      }

      if (rouletteState.bank <= 0) {
        rouletteMessage.innerHTML +=
          " You're out of chips. Reset to keep playing.";
      }

      rouletteState.isSpinning = false;
      spinButton.disabled = false;
    };

    setTimeout(finalizeSpin, spinDuration);
  };

  const resetRoulette = () => {
    rouletteState.bank = 500;
    rouletteState.rotation = 0;
    rouletteState.isSpinning = false;
    rouletteWheel.style.setProperty("--rotation", "0deg");
    rouletteHistory.innerHTML = "";
    clearInsideBets();
    clearWinningHighlights();
    updateRouletteBank();
    currentBetType = "number";
    const numberRadio = document.querySelector(
      'input[name="roulette-bet-type"][value="number"]'
    );
    if (numberRadio) {
      numberRadio.checked = true;
    }
    updateRouletteBetFields();
    rouletteMessage.textContent = "Bank refilled. Place chips to spin again.";
    spinButton.disabled = false;
  };

  document
    .querySelectorAll('input[name="roulette-bet-type"]')
    .forEach((radio) =>
      radio.addEventListener("change", (event) => {
        if (rouletteState.isSpinning) {
          event.preventDefault();
          const previous = document.querySelector(
            `input[name="roulette-bet-type"][value="${currentBetType}"]`
          );
          if (previous) {
            previous.checked = true;
          }
          updateRouletteBetFields();
          return;
        }
        currentBetType = event.target.value;
        updateRouletteBetFields();
        if (currentBetType !== "number") {
          clearInsideBets();
        }
      })
    );

  spinButton.addEventListener("click", spinRoulette);
  rouletteResetButton.addEventListener("click", resetRoulette);

  updateRouletteBetFields();
  updateRouletteBank();
  rouletteMessage.textContent = "Drop chips on the layout and spin the wheel.";

  showPanel("start");
});
