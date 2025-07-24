const cards = [
  { type: "truth", content: "Năm vừa rồi bạn vui chứ?" },
  { type: "truth", content: "Bạn có yêu bản thân không?" },
  { type: "truth", content: "Nếu bạn được đóng phim, bạn muốn đóng vai gì?" },
  { type: "dare", content: "Gọi cho một người bạn, giả vờ hôm nay là sinh nhật họ và hát chúc mừng sinh nhật" },
  { type: "dare", content: "Chạy đến nói với những người xung quanh “Tôi tin vào kỳ lân”" },
  { type: "truth", content: "Bạn đã từng yêu sâu đậm một ai chưa?" },
  { type: "truth", content: "Ngành nghề lúc nhỏ bản thân mơ ước?" },
  { type: "dare", content: "Bắt chước một Youtuber khá nổi tiếng để người khác đoán được đó là ai" },
  { type: "penalty", content: "Uống 1 ngụm bia hoặc nước" },
  { type: "penalty", content: "Nhảy lò cò 10 bước" }
];

const card = document.querySelector(".card");
const cardBack = document.querySelector(".card-back");
const nextBtn = document.querySelector(".btn-next");
const doBtn = document.querySelector(".btn-do");
const penaltyBtn = document.querySelector(".btn-penalty");

const flipSound = document.getElementById("flip-sound");
const clickSound = document.getElementById("click-sound");

function getRandomCard() {
  const randomIndex = Math.floor(Math.random() * cards.length);
  return cards[randomIndex];
}

function resetCard() {
  card.classList.remove("flip");
  cardBack.className = "card-back";
  cardBack.textContent = "";
}

nextBtn.addEventListener("click", () => {
  clickSound.play();
  resetCard();
  const pickedCard = getRandomCard();
  setTimeout(() => {
    cardBack.classList.add(pickedCard.type);
    cardBack.textContent = pickedCard.content;
    card.classList.add("flip");
    flipSound.play();
  }, 200);
});

doBtn.addEventListener("click", () => {
  clickSound.play();
  alert("Bạn chọn: LÀM thử thách!");
});

penaltyBtn.addEventListener("click", () => {
  clickSound.play();
  alert("Bạn chọn: CHỊU PHẠT!");
});
