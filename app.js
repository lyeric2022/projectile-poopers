
let mapData = {
  minX: 1,
  maxX: 14,
  minY: 4,
  maxY: 12,
  blockedSpaces: {
    "7x4": true,
    "1x11": true,
    "12x10": true,
    "4x7": true,
    "5x7": true,
    "6x7": true,
    "8x6": true,
    "9x6": true,
    "10x6": true,
    "7x9": true,
    "8x9": true,
    "9x9": true,
  },
};

// Options for Player Colors... these are in the same order as our sprite sheet
const playerColors = ["blue", "red", "orange", "yellow", "green", "purple"];

//Misc Helpers
function randomFromArray(array) {
  return array[Math.floor(Math.random() * array.length)];
}
function getKeyString(x, y) {
  return `${x}x${y}`;
}

function createName() {
  const prefix = randomFromArray([
    "COOL",
    "SUPER",
    "HIP",
    "SMUG",
    "COOL",
    "SILKY",
    "GOOD",
    "SAFE",
    "DEAR",
    "DAMP",
    "WARM",
    "RICH",
    "LONG",
    "DARK",
    "SOFT",
    "BUFF",
    "DOPE",
  ]);
  const animal = randomFromArray([
    "BEAR",
    "DOG",
    "CAT",
    "FOX",
    "LAMB",
    "LION",
    "BOAR",
    "GOAT",
    "VOLE",
    "SEAL",
    "PUMA",
    "MULE",
    "BULL",
    "BIRD",
    "BUG",
  ]);
  return `${prefix} ${animal}`;
}

function isSolid(x, y) {

  const blockedNextSpace = mapData.blockedSpaces[getKeyString(x, y)];
  return (
    blockedNextSpace ||
    x >= mapData.maxX ||
    x < mapData.minX ||
    y >= mapData.maxY ||
    y < mapData.minY
  )
}

function getRandomSafeSpot() {
  //We don't look things up by key here, so just return an x/y
  return randomFromArray([
    { x: 1, y: 4 },
    { x: 2, y: 4 },
    { x: 1, y: 5 },
    { x: 2, y: 6 },
    { x: 2, y: 8 },
    { x: 2, y: 9 },
    { x: 4, y: 8 },
    { x: 5, y: 5 },
    { x: 5, y: 8 },
    { x: 5, y: 10 },
    { x: 5, y: 11 },
    { x: 11, y: 7 },
    { x: 12, y: 7 },
    { x: 13, y: 7 },
    { x: 13, y: 6 },
    { x: 13, y: 8 },
    { x: 7, y: 6 },
    { x: 7, y: 7 },
    { x: 7, y: 8 },
    { x: 8, y: 8 },
    { x: 10, y: 8 },
    { x: 8, y: 8 },
    { x: 11, y: 4 },
  ]);
}

var mySound;

(function () {

  let playerId;
  let playerRef;
  let players = {};
  let playerElements = {};
  let coins = {};
  let coinElements = {};

  let projectiles = {};
  let projectileElements = {};

  let myMusic = new Audio("assets/game_music.mp3");
  let myCoinSound = new Audio("assets/coin_sound.mp3");

  myMusic.volume = 0.1;
  myCoinSound.volume = 0.1;

  let musicIsPlaying = false;

  const gameContainer = document.querySelector(".game-container");
  const playerNameInput = document.querySelector("#player-name");
  const playerColorButton = document.querySelector("#player-color");
  const playerRestartButton = document.querySelector("#restart-game");


  //////
  function shootProjectile(originalSpriteX, originalSpriteY, direction, projectileDMG) {
    let { x, y } = getRandomSafeSpot();

    if (typeof originalSpriteX !== "undefined" && typeof originalSpriteY !== "undefined") {
      x = originalSpriteX;
      y = originalSpriteY;

      if (direction === "left") {
        x -= 2;
      }
      else if (direction === "right") {
        x += 2;
      }
      else if (direction === "up") {
        y += 2;
      }
      else if (direction === "down") {
        y -= 2;
      }
    }

    const projectileRef = firebase.database().ref(`projectiles/${getKeyString(x, y)}`);
    projectileRef.set({
      x,
      y,
      direction, // Set the direction in the Firebase database
      dmg: projectileDMG,
      color: players[playerId].color,
      owner: playerId,
    })

    const key = getKeyString(x, y);

    const projectileRefTimeout = 500;
    setTimeout(() => {
      firebase.database().ref(`projectiles/${key}`).remove();
    }, projectileRefTimeout);
  }
  ///////

  function placeCoin() {
    const { x, y } = getRandomSafeSpot();
    const coinRef = firebase.database().ref(`coins/${getKeyString(x, y)}`);
    coinRef.set({
      x,
      y,
    })

    const coinTimeouts = [2000, 3000, 4000, 5000];
    setTimeout(() => {
      placeCoin();
    }, randomFromArray(coinTimeouts));
  }

  function attemptGrabCoin(x, y) {
    const key = getKeyString(x, y);
    if (coins[key]) {
      // Remove this key from data, then uptick Player's coin count
      firebase.database().ref(`coins/${key}`).remove();
      myCoinSound.play();
      playerRef.update({
        coins: players[playerId].coins + 1,
      })

      if (checkPlayerWinViaCoins()) {
        playerRef.update({
          health: 20,
        })
      }
    }
  }

  function checkPlayerWinViaCoins() {
    if (players[playerId].coins >= 100) {
      return true;
    }
    else return false;
  }

  function playerAndProjectileCollision(x, y) {


    const key = getKeyString(x, y);
    if (projectiles[key]) {
      console.log(firebase.database().ref(`projectiles/${key}/owner`));

      const dmg_value = projectiles[key].dmg;

      // Remove this key from data, then uptick Player's coin count
      firebase.database().ref(`projectiles/${key}`).remove();

      playerRef.update({
        health: players[playerId].health - dmg_value,
      });
    }
  }

  function handleArrowPress(xChange = 0, yChange = 0) {

    if (typeof players[playerId] !== 'undefined') {
      const newX = players[playerId].x + xChange;
      const newY = players[playerId].y + yChange;
      if (!isSolid(newX, newY)) {
        // move to the next space
        if (xChange === 1) {
          players[playerId].direction = "right";
          players[playerId].projectileDirection = "left";
        } else if (xChange === -1) {
          players[playerId].direction = "left";
          players[playerId].projectileDirection = "right";
        } else if (yChange === -1) {
          players[playerId].direction = "down";
          players[playerId].projectileDirection = "up";
        } else if (yChange === 1) {
          players[playerId].direction = "up";
          players[playerId].projectileDirection = "down";
        }

        shootProjectile(players[playerId].x, players[playerId].y, players[playerId].projectileDirection, players[playerId].projectileDMG);

        if (typeof players[playerId] !== 'undefined') {
          players[playerId].x = newX;
          players[playerId].y = newY;
          playerRef.set(players[playerId]);
        }
        
        attemptGrabCoin(newX, newY);
      }
    }


  }

  function initGame() {

    new KeyPressListener("ArrowUp", () => handleArrowPress(0, -1));
    new KeyPressListener("ArrowDown", () => handleArrowPress(0, 1));
    new KeyPressListener("ArrowLeft", () => handleArrowPress(-1, 0));
    new KeyPressListener("ArrowRight", () => handleArrowPress(1, 0));

    new KeyPressListener("KeyW", () => handleArrowPress(0, -1));
    new KeyPressListener("KeyS", () => handleArrowPress(0, 1));
    new KeyPressListener("KeyA", () => handleArrowPress(-1, 0));
    new KeyPressListener("KeyD", () => handleArrowPress(1, 0));

    const toggleDeviceButton = document.querySelector("#toggle-device");
    const gameContainer = document.querySelector(".game-container");
    const gameButtons = document.querySelector(".move-buttons");

    const toggleMusicButton = document.querySelector("#toggle-music");

    toggleDeviceButton.addEventListener("click", () => {
      toggleDeviceButton.classList.toggle("clicked");

      if (gameContainer.style.display === "none") {
        gameContainer.style.display = "block";
        gameButtons.style.display = "none";
        toggleDeviceButton.textContent = "Console: OFF";
      } else {
        gameContainer.style.display = "none";
        gameButtons.style.display = "flex";
        toggleDeviceButton.textContent = "Console: ON";
      }
    });

    toggleMusicButton.addEventListener("click", () => {
      toggleMusicButton.classList.toggle("clicked");

      if (musicIsPlaying === false) {
        musicIsPlaying = true;
        myMusic.play();
        toggleMusicButton.textContent = "Music: ON";
      } else {
        musicIsPlaying = false;
        myMusic.pause();
        toggleMusicButton.textContent = "Music: OFF";
      }
    });


    // Add event listener for button-up
    const buttonUp = document.querySelector("#button-up");
    buttonUp.addEventListener("click", () => {
      handleArrowPress(0, -1);
    });

    // Add event listener for button-left
    const buttonLeft = document.querySelector("#button-left");
    buttonLeft.addEventListener("click", () => {
      handleArrowPress(-1, 0);
    });

    // Add event listener for button-down
    const buttonDown = document.querySelector("#button-down");
    buttonDown.addEventListener("click", () => {
      handleArrowPress(0, 1);
    });

    // Add event listener for button-right
    const buttonRight = document.querySelector("#button-right");
    buttonRight.addEventListener("click", () => {
      handleArrowPress(1, 0);
    });

    const allPlayersRef = firebase.database().ref(`players`);
    const allCoinsRef = firebase.database().ref(`coins`);
    const allProjectilesRef = firebase.database().ref(`projectiles`);

    allPlayersRef.on("value", (snapshot) => {
      // Fires whenever a change occurs
      players = snapshot.val() || {};
      Object.keys(players).forEach((key) => {
        const characterState = players[key];
        let el = playerElements[key];

        // Update the player's health
        el.querySelector(".Character_health").innerText = characterState.health;

        // Now update the DOM
        el.querySelector(".Character_health").innerText = characterState.health;
        el.querySelector(".Character_name").innerText = characterState.name;
        el.querySelector(".Character_coins").innerText = characterState.coins;

        el.setAttribute("data-color", characterState.color);
        el.setAttribute("data-direction", characterState.direction);
        const left = 16 * characterState.x + "px";
        const top = 16 * characterState.y - 4 + "px";
        el.style.transform = `translate3d(${left}, ${top}, 0)`;
      })
    })

    allPlayersRef.on("child_added", (snapshot) => {
      // Fires whenever a new node is added the tree
      const addedPlayer = snapshot.val();
      const characterElement = document.createElement("div");
      characterElement.classList.add("Character", "grid-cell");
      if (addedPlayer.id === playerId) {
        characterElement.classList.add("you");
      }
      characterElement.innerHTML = (`
        <div class="Character_shadow grid-cell"></div>
        <div class="Character_sprite grid-cell"></div>

        <div class="Poop_projectile_sprite grid-cell"></div>

        <div class="Character_name-container">
        <span class="Character_health">5</span>
          <span class="Character_name"></span>
          <span class="Character_coins">0</span>
        </div>
        <div class="Character_you-arrow"></div>
      `);
      playerElements[addedPlayer.id] = characterElement;

      // Fill in some initial state
      characterElement.querySelector(".Character_name").innerText = addedPlayer.name;
      characterElement.querySelector(".Character_coins").innerText = addedPlayer.coins;
      characterElement.querySelector(".Character_health").innerText = addedPlayer.health;
      characterElement.setAttribute("data-color", addedPlayer.color);
      characterElement.setAttribute("data-direction", addedPlayer.direction);

      const left = 16 * addedPlayer.x + "px";
      const top = 16 * addedPlayer.y - 4 + "px";
      characterElement.style.transform = `translate3d(${left}, ${top}, 0)`;
      gameContainer.appendChild(characterElement);
    })


    // Remove character DOM element after they leave
    allPlayersRef.on("child_removed", (snapshot) => {
      const removedKey = snapshot.val().id;
      gameContainer.removeChild(playerElements[removedKey]);
      delete playerElements[removedKey];
    })

    // New - not in the video!
    // This block will remove coins from local state when Firebase `coins` value updates
    allCoinsRef.on("value", (snapshot) => {
      coins = snapshot.val() || {};
    });
    //

    allCoinsRef.on("child_added", (snapshot) => {
      const coin = snapshot.val();
      const key = getKeyString(coin.x, coin.y);
      coins[key] = true;

      // Create the DOM Element
      const coinElement = document.createElement("div");
      coinElement.classList.add("Coin", "grid-cell");
      coinElement.innerHTML = `
            <div class="Coin_shadow grid-cell"></div>
            <div class="Coin_sprite grid-cell"></div>
          `;

      // Position the Element
      const left = 16 * coin.x + "px";
      const top = 16 * coin.y - 4 + "px";
      coinElement.style.transform = `translate3d(${left}, ${top}, 0)`;

      // Keep a reference for removal later and add to DOM
      coinElements[key] = coinElement;
      gameContainer.appendChild(coinElement);
    })
    allCoinsRef.on("child_removed", (snapshot) => {
      const { x, y } = snapshot.val();
      const keyToRemove = getKeyString(x, y);
      gameContainer.removeChild(coinElements[keyToRemove]);
      delete coinElements[keyToRemove];
    })


    //////////

    // This block will remove projectiles from local state when Firebase `coins` value updates
    allProjectilesRef.on("value", (snapshot) => {
      projectiles = snapshot.val() || {};

      const currentPlayer = players[playerId];
      if (typeof currentPlayer !== "undefined") {
        playerAndProjectileCollision(currentPlayer.x, currentPlayer.y);
        if (currentPlayer.health <= 0) {
          playerRef.remove();
          // Unhide the "restart-game" button
          const restartButton = document.getElementById("restart-game");
          restartButton.style.display = "block";
        }
      }
    });
    //

    allProjectilesRef.on("child_added", (snapshot) => {
      const projectile = snapshot.val();
      const key = getKeyString(projectile.x, projectile.y, projectile.direction, projectile.color);
      projectiles[key] = true;

      // Create the DOM Element
      const projectileElement = document.createElement("div");
      projectileElement.classList.add("Projectile", "grid-cell");
      projectileElement.innerHTML = `
            <div class="Projectile_sprite grid-cell"></div>
          `;

      // Set the direction attribute in CSS
      projectileElement.setAttribute("data-direction", projectile.direction);
      projectileElement.setAttribute("data-color", projectile.color);


      // Position the Element
      const left = 16 * projectile.x + "px";
      const top = 16 * projectile.y - 4 + "px";
      projectileElement.style.transform = `translate3d(${left}, ${top}, 0)`;

      // Keep a reference for removal later and add to DOM
      projectileElements[key] = projectileElement;
      gameContainer.appendChild(projectileElement);
    })
    allProjectilesRef.on("child_removed", (snapshot) => {
      const { x, y } = snapshot.val();
      const keyToRemove = getKeyString(x, y);
      gameContainer.removeChild(projectileElements[keyToRemove]);
      delete projectileElements[keyToRemove];
    })

    //////////

    // Updates player name with text input
    playerNameInput.addEventListener("change", (e) => {
      if (typeof players[playerId] !== 'undefined') {
        const newName = e.target.value || createName();
        playerNameInput.value = newName;
        playerRef.update({
          name: newName
        })
      }
    })

    // Update player color on button click
    playerColorButton.addEventListener("click", () => {
      if (typeof players[playerId] !== 'undefined') {
        const mySkinIndex = playerColors.indexOf(players[playerId].color);
        const nextColor = playerColors[mySkinIndex + 1] || playerColors[0];
        playerRef.update({
          color: nextColor
        })
      }
    })

    playerRestartButton.addEventListener("click", () => {
      location.reload();
    });

    // Place my first coin
    placeCoin();


    // shootProjectile();

  }

  firebase.auth().onAuthStateChanged((user) => {
    console.log(user);

    if (user) {
      // You're logged in!
      playerId = user.uid;
      playerRef = firebase.database().ref(`players/${playerId}`);

      const name = createName();
      playerNameInput.value = name;

      const { x, y } = getRandomSafeSpot();


      playerRef.set({
        id: playerId,
        name,
        direction: "right",
        projectileDirection: "",
        projectileDMG: 1,
        color: randomFromArray(playerColors),
        x,
        y,
        coins: 0,
        health: 10,
      })

      // Remove me from Firebase when I diconnect
      playerRef.onDisconnect().remove();

      // Begin the game now that we are signed in
      initGame();

    } else {
      // You're logged out.
    }
  })

  firebase.auth().signInAnonymously().catch((error) => {
    var errorCode = error.code;
    var errorMessage = error.message;
    // ...
    console.log(errorCode, errorMessage);
  });


})();
