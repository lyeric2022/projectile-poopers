// let playerId;

// firebase.auth().onAuthStateChanged((user) => {

//     if (user) {
//         // You're logged in!
//         playerId = user.uid;
//     }
// })();

// (function () {

//     function exchangeCoinsForHP() {
//         const playerRef = firebase.database().ref(`players/${playerId}`);
//         playerRef.once("value", (snapshot) => {
//             const player = snapshot.val();
//             if (player.coins >= 5) {
//                 playerRef.update({
//                     coins: player.coins - 5,
//                     health: player.health + 1
//                 });
//             } else {
//                 console.log("Not enough coins!");
//             }
//         });
//     }

//     const shopButton = document.querySelector("#buy-hp");
//     shopButton.addEventListener("click", exchangeCoinsForHP);
// })();


// // (function () {

// //     firebase.auth().onAuthStateChanged((user) => {
// //     });

// //     if (user) {

// //         const playerId = user.uid;

// //         function exchangeCoinsForHP() {
// //             const playerRef = firebase.database().ref(`players/${playerId}`);
// //             playerRef.once("value", (snapshot) => {
// //                 const player = snapshot.val();
// //                 if (player.coins >= 5) {
// //                     playerRef.update({
// //                         coins: player.coins - 5,
// //                         health: player.health + 1
// //                     });
// //                 } else {
// //                     console.log("Not enough coins!");
// //                 }
// //             });
// //         }

// //         const shopButton = document.querySelector("#shop-button");
// //         shopButton.addEventListener("click", exchangeCoinsForHP);
// //     }
// // })();

