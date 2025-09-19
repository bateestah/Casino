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
    currentIndex: 0,
    selectedNumber: 0,
  };

  const redNumbers = new Set([
    1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
  ]);

  const wheelNumbers = [
    0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10,
    5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
  ];

  const segmentAngle = 360 / wheelNumbers.length;
  const gradientStart = -90 - segmentAngle / 2;

  const rouletteBankEl = document.getElementById("roulette-bank");
  const rouletteBetInput = document.getElementById("roulette-bet");
  const rouletteWheel = document.getElementById("roulette-wheel");
  const rouletteHistory = document.getElementById("roulette-history");
  const spinButton = document.getElementById("roulette-spin");
  const rouletteResetButton = document.getElementById("roulette-reset");

  const numberField = document.getElementById("roulette-number-field");
  const colorField = document.getElementById("roulette-color-field");
  const parityField = document.getElementById("roulette-parity-field");

  const rouletteNumberSelect = document.getElementById("roulette-number");
  const rouletteColorSelect = document.getElementById("roulette-color");
  const rouletteParitySelect = document.getElementById("roulette-parity");
  const rouletteGrid = document.getElementById("roulette-grid");
  const rouletteBetTypeRadios = document.querySelectorAll(
    'input[name="roulette-bet-type"]'
  );

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

  const gridCells = new Map();

  const updateGridSelection = () => {
    gridCells.forEach((cell, key) => {
      const cellNumber = Number(key);
      cell.classList.toggle(
        "selected",
        cellNumber === rouletteState.selectedNumber
      );
    });
  };

  const getSelectedBetType = () => {
    const selected = document.querySelector(
      'input[name="roulette-bet-type"]:checked'
    );
    return selected ? selected.value : "number";
  };

  const refreshChipDisplay = () => {
    const betType = getSelectedBetType();
    const amount = parseInt(rouletteBetInput.value, 10);

    gridCells.forEach((cell, key) => {
      const chip = cell.querySelector(".chip");
      if (!chip) return;
      const cellNumber = Number(key);
      const showChip =
        betType === "number" &&
        cellNumber === rouletteState.selectedNumber &&
        !Number.isNaN(amount) &&
        amount > 0;

      cell.classList.toggle("has-chip", showChip);
      chip.textContent = showChip ? formatChips(amount) : "";
    });
  };

  const setSelectedNumber = (number, { updateSelect = true } = {}) => {
    const numericNumber = Number(number);
    if (!gridCells.has(numericNumber)) return;

    rouletteState.selectedNumber = numericNumber;
    updateGridSelection();

    if (updateSelect) {
      rouletteNumberSelect.value = numericNumber;
    }

    refreshChipDisplay();
  };

  const updateRouletteBank = () => {
    rouletteBankEl.textContent = formatChips(rouletteState.bank);
  };

  const updateRouletteBetFields = () => {
    const betType = getSelectedBetType();

    numberField.classList.toggle("hidden", betType !== "number");
    colorField.classList.toggle("hidden", betType !== "color");
    parityField.classList.toggle("hidden", betType !== "parity");

    if (rouletteGrid) {
      rouletteGrid.classList.toggle("disabled", betType !== "number");
    }

    refreshChipDisplay();
  };

  const highlightResultCell = (number) => {
    const cell = gridCells.get(number);
    if (!cell) return;
    cell.classList.add("hit");
    setTimeout(() => {
      cell.classList.remove("hit");
    }, 1600);
  };

  const buildRouletteWheel = () => {
    if (!rouletteWheel) return;

    const palette = {
      red: "rgba(255, 77, 103, 0.96)",
      black: "rgba(31, 40, 61, 0.96)",
      green: "rgba(22, 160, 133, 0.94)",
    };

    const gradientStops = wheelNumbers
      .map((number, index) => {
        const colorKey = getRouletteColor(number);
        const color = palette[colorKey];
        const start = gradientStart + index * segmentAngle;
        const end = start + segmentAngle;
        return `${color} ${start.toFixed(4)}deg ${end.toFixed(4)}deg`;
      })
      .join(", ");

    const radialOverlay =
      "radial-gradient(circle at 50% 45%, rgba(255,255,255,0.22), rgba(255,255,255,0) 62%)";
    rouletteWheel.style.background = `${radialOverlay}, conic-gradient(from ${gradientStart}deg, ${gradientStops})`;

    const existingRing = rouletteWheel.querySelector(".wheel-numbers");
    if (existingRing) {
      existingRing.remove();
    }

    const numberRing = document.createElement("div");
    numberRing.classList.add("wheel-numbers");

    const radius = 118;
    wheelNumbers.forEach((number, index) => {
      const numberEl = document.createElement("span");
      numberEl.classList.add("wheel-number", getRouletteColor(number));
      numberEl.textContent = number;
      const angle = gradientStart + index * segmentAngle + segmentAngle / 2;
      numberEl.style.transform = `rotate(${angle}deg) translateY(-${radius}px) rotate(${-angle}deg)`;
      numberRing.append(numberEl);
    });

    rouletteWheel.insertBefore(numberRing, rouletteWheel.firstChild);
  };

  const createGridCell = (number) => {
    if (!rouletteGrid) return null;

    const cell = document.createElement("button");
    cell.type = "button";
    cell.classList.add("grid-cell");

    if (number === 0) {
      cell.classList.add("zero");
    } else {
      cell.classList.add(getRouletteColor(number));
    }

    cell.dataset.number = number;

    const label = document.createElement("span");
    label.classList.add("number-label");
    label.textContent = number;

    const chip = document.createElement("span");
    chip.classList.add("chip");

    cell.append(label, chip);

    cell.addEventListener("click", () => {
      const numberRadio = Array.from(rouletteBetTypeRadios).find(
        (radio) => radio.value === "number"
      );

      if (numberRadio && !numberRadio.checked) {
        numberRadio.checked = true;
        updateRouletteBetFields();
      }

      setSelectedNumber(number);
    });

    rouletteGrid.append(cell);
    gridCells.set(number, cell);
    return cell;
  };

  const buildRouletteGrid = () => {
    if (!rouletteGrid) return;

    rouletteGrid.innerHTML = "";
    gridCells.clear();

    const zeroCell = createGridCell(0);
    if (zeroCell) {
      zeroCell.style.gridRow = "span 12";
    }

    for (let row = 0; row < 12; row += 1) {
      const base = row * 3;
      const rowNumbers = [base + 3, base + 2, base + 1];

      rowNumbers.forEach((value) => {
        if (value <= 36) {
          createGridCell(value);
        }
      });
    }
  };

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

  const spinRoulette = () => {
    const betAmount = parseInt(rouletteBetInput.value, 10);
    if (Number.isNaN(betAmount) || betAmount <= 0) {
      rouletteMessage.textContent = "Enter a valid bet amount.";
      return;
    }

    if (betAmount > rouletteState.bank) {
      rouletteMessage.textContent = "Insufficient chips for that bet.";
      return;
    }

    const betType = getSelectedBetType();

    let chosenValue;
    if (betType === "number") {
      chosenValue = rouletteState.selectedNumber;
    } else if (betType === "color") {
      chosenValue = rouletteColorSelect.value;
    } else {
      chosenValue = rouletteParitySelect.value;
    }

    rouletteState.bank -= betAmount;
    updateRouletteBank();

    const resultIndex = Math.floor(Math.random() * wheelNumbers.length);
    const resultNumber = wheelNumbers[resultIndex];
    const resultColor = getRouletteColor(resultNumber);
    const resultParity = getRouletteParity(resultNumber);

    let win = false;
    let payout = 0;

    if (betType === "number" && resultNumber === chosenValue) {
      win = true;
      payout = betAmount * 36;
    } else if (betType === "color" && resultColor === chosenValue) {
      win = true;
      payout = betAmount * 2;
    } else if (
      betType === "parity" &&
      resultParity !== "none" &&
      resultParity === chosenValue
    ) {
      win = true;
      payout = betAmount * 2;
    }

    const stepsForward =
      (resultIndex - rouletteState.currentIndex + wheelNumbers.length) %
      wheelNumbers.length;
    const extraSpins = Math.floor(Math.random() * 4) + 6;
    const rotationDelta = extraSpins * 360 + stepsForward * segmentAngle;

    rouletteState.rotation -= rotationDelta;
    rouletteState.currentIndex = resultIndex;

    rouletteWheel.style.setProperty("--rotation", `${rouletteState.rotation}deg`);
    spinButton.disabled = true;

    const spinDuration = 3200;
    setTimeout(() => {
      spinButton.disabled = false;
      highlightResultCell(resultNumber);
    }, spinDuration);

    if (win) {
      rouletteState.bank += payout;
      updateRouletteBank();
      const winnings = payout - betAmount;
      rouletteMessage.innerHTML = `<strong>The ball lands on ${resultNumber} (${resultColor.toUpperCase()})!</strong> You win ${formatChips(
        winnings
      )} chips.`;
      addHistoryItem(resultNumber, resultColor, true, winnings);
    } else {
      rouletteMessage.innerHTML = `<strong>The ball lands on ${resultNumber} (${resultColor.toUpperCase()})!</strong> You lose ${formatChips(
        betAmount
      )} chips.`;
      addHistoryItem(resultNumber, resultColor, false, betAmount);
    }

    if (rouletteState.bank <= 0) {
      rouletteMessage.innerHTML += " You're out of chips. Reset to keep playing.";
    }
  };

  const resetRoulette = () => {
    rouletteState.bank = 500;
    rouletteState.rotation = 0;
    rouletteState.currentIndex = 0;
    rouletteWheel.style.setProperty("--rotation", "0deg");
    rouletteHistory.innerHTML = "";
    updateRouletteBank();
    rouletteMessage.textContent = "Bank refilled. Place a bet to spin again.";
    setSelectedNumber(0);
  };

  rouletteBetTypeRadios.forEach((radio) =>
    radio.addEventListener("change", updateRouletteBetFields)
  );

  rouletteNumberSelect.addEventListener("change", (event) => {
    const value = parseInt(event.target.value, 10);
    if (!Number.isNaN(value)) {
      setSelectedNumber(value, { updateSelect: false });
    }
  });

  rouletteBetInput.addEventListener("input", refreshChipDisplay);

  buildRouletteWheel();
  buildRouletteGrid();
  setSelectedNumber(0);

  spinButton.addEventListener("click", spinRoulette);
  rouletteResetButton.addEventListener("click", resetRoulette);

  updateRouletteBetFields();
  updateRouletteBank();
  rouletteMessage.textContent = "Pick a bet and spin the wheel.";

  showPanel("start");
});
