const cards = [
  { type: "truth", content: "Năm vừa rồi bạn vui chứ?" },
  { type: "truth", content: "Bạn có yêu bản thân không?" },
  { type: "truth", content: "Nếu bạn được đóng phim, bạn muốn đóng vai gì?" },
  { type: "truth", content: "Bạn đã có khoảng thời gian mất cảm hứng trong cuộc sống đúng không?" },
  { type: "truth", content: "Nếu phải đánh đổi để có được một thứ bạn rất muốn thì bạn có sẵn lòng không?" },
  { type: "truth", content: "Điều bạn thất vọng nhất về bản thân?" },
  { type: "truth", content: "Khoảnh khắc khó quên trong năm vừa rồi" },
  { type: "truth", content: "Bạn có cảm thấy mình bỏ lỡ điều gì trong năm vừa rồi không?" },
  { type: "truth", content: "Mong muốn trong năm mới của bạn là gì?" },
  { type: "truth", content: "Bạn tự tin nhất ở bản thân điểm nào?" },
  { type: "truth", content: "Điều độc hại nhất bạn từng làm trong đời là gì?" },
  { type: "truth", content: "Điều gì làm bạn phiền lòng nhất ở thời điểm hiện tại?" },
  { type: "truth", content: "Một điều bản thân cảm thấy tự hào nhất ở hiện tại?" },
  { type: "truth", content: "Bạn đã từng yêu sâu đậm một ai chưa?" },
  { type: "truth", content: "Ngành nghề lúc nhỏ bản thân mơ ước?" },
  { type: "truth", content: "Nếu bạn được trở về quá khứ bạn sẽ thay đổi gì?" },
  { type: "truth", content: "Nếu bạn biết thế giới kết thúc vào ngày mai, bạn sẽ làm gì?" },
  { type: "truth", content: "Bạn sẽ làm gì khi trúng số?" },
  { type: "truth", content: "Nếu cho bạn lựa chọn, bạn muốn có khả năng đọc suy nghĩ người khác không?" },
  { type: "truth", content: "Bạn có hay lấy những người xung quanh làm hình mẫu để phát triển bản thân không?" },
  { type: "truth", content: "Bạn hay kể những mệt mỏi trong cuộc sống với ba mẹ không?" },
  { type: "truth", content: "Bạn hay nói con yêu ba mẹ cho ba mẹ nghe không?" },
  { type: "truth", content: "Một điều ba mẹ làm cho bạn làm bạn chạnh lòng nhất?" },
  { type: "truth", content: "Thời gian xa gia đình lâu nhất của bạn?" },
  { type: "truth", content: "Cuộc sống xa gia đình có vất vả không?" },
  { type: "truth", content: "Bạn hay tự chất vấn bản thân liệu đã sống tốt hay chưa?" },
  { type: "truth", content: "Điều bạn mong muốn làm cho gia đình?" },
  { type: "dare", content: "Gọi cho một người bạn, giả vờ hôm nay là sinh nhật họ và hát chúc mừng sinh nhật" },
  { type: "dare", content: "Nói “ok mà” sau mỗi câu trả lời của bạn từ những lượt chơi tiếp theo" },
  { type: "dare", content: "Tạo một câu chuyện và kể cho mọi người nghe về đồ vật trong nhà (ví dụ: Dép và kệ dép)" },
  { type: "dare", content: "Chạy đến nói với những người xung quanh “Tôi tin vào kỳ lân”" },
  { type: "dare", content: "Rap 2 câu để giới thiệu về một người chơi khác đang có mặt" },
  { type: "dare", content: "Bắt chước một Youtuber khá nổi tiếng để người khác đoán được đó là ai" },
  { type: "dare", content: "Post một bài viết vô nghĩa lên mạng xã hội trong vòng 1 tiếng (ví dụ: “Hôm nay tôi buồn nhưng cũng vui lắm…”)" },
  { type: "truth", content: "Bạn đã bao giờ đi du lịch một mình chưa?" },
  { type: "truth", content: "Bạn đã bao giờ làm một điều điên rồ ở nơi công cộng chưa?" },
  { type: "truth", content: "Bạn đã từng theo dõi ai đó chưa?" },
  { type: "truth", content: "Điều trẻ con nhất mà bạn vẫn còn làm là gì?" },
  { type: "truth", content: "Bạn đã lẻ bóng trong bao lâu?" },
  { type: "truth", content: "Bạn đã từng bị lừa đảo khi mua hàng online chưa?" },
  { type: "truth", content: "Điều hối hận nhất bạn từng làm?" },
  { type: "truth", content: "Người nào có ảnh hưởng nhất với bạn?" },
  { type: "truth", content: "Cảm thấy bản thân giống loài động vật nào nhất? Tại sao?" },
  { type: "truth", content: "Nếu sống trong một thế giới khác trong một ngày, bạn sẽ làm gì?" },
  { type: "truth", content: "Bạn đã từng bỏ lỡ một ai vì không dám tỏ tình chưa?" },
  { type: "truth", content: "Lời nói dối khó chịu nhất bạn từng nghe?" },
  { type: "truth", content: "Lời nói dối vô lí nhất bạn từng bịa ra?" },
  { type: "truth", content: "Mức độ ưu tiên: tình yêu, sự nghiệp, gia đình" },
  { type: "truth", content: "Bạn sợ con gì nhất?" },
  { type: "truth", content: "Kể về một kỉ niệm bá đạo những năm cấp 3 của bạn" },
  { type: "truth", content: "Giấc mơ hài hước nhất bạn từng có là gì?" },
  { type: "truth", content: "Khoảng thời gian lâu nhất mà bạn không tắm?" },
  { type: "truth", content: "1kg giấy với 1kg gỗ, cái nào nặng hơn?" },
  { type: "truth", content: "Nước biển màu gì?" },
  { type: "truth", content: "Điều xấu hổ nhất bạn từng làm lúc còn nhỏ?" },
  { type: "truth", content: "Một kỉ niệm lúc nhỏ mà bạn vẫn còn nhớ" },
  { type: "truth", content: "Một kỉ niệm đáng nhớ với gia đình lúc bé" },
  { type: "truth", content: "Bạn đã từng yêu thầm một người hơn bản thân nhiều tuổi chưa?" },
  { type: "truth", content: "Bạn biết yêu năm mấy tuổi?" },
  { type: "truth", content: "Bạn đã từng say bí tỉ bao giờ chưa?" },
  { type: "truth", content: "Điều ngu ngốc bạn từng làm lúc say sỉn?" },
  { type: "truth", content: "Bạn trao nụ hôn đầu năm mấy tuổi?" },
  { type: "truth", content: "Bạn sẽ làm gì nếu trúng xổ số?" },
  { type: "truth", content: "Bạn sẽ không bao giờ làm ngành nghề gì?" },
  { type: "truth", content: "Nếu bị mắc kẹt trên đảo không người 5 ngày, bạn sẽ mang theo những gì?" }
];

function toggleGuide() {
  const guide = document.getElementById("guide-section");
  guide.style.display = guide.style.display === "none" ? "block" : "none";
}
// Đặt display mặc định để phù hợp mobile
window.onload = () => {
  document.getElementById("guide-section").style.display = "none";
}

let remainingCards = [...cards];

function getRandomCard() {
  if (remainingCards.length === 0) {
    remainingCards = [...cards];
  }
  const index = Math.floor(Math.random() * remainingCards.length);
  const card = remainingCards[index];
  remainingCards.splice(index, 1);
  return card;
}

const card = document.querySelector('.card');
const cardBack = document.querySelector('.card-back');
const flipSound = document.getElementById('flip-sound');
const clickSound = document.getElementById('click-sound');

document.querySelector('.btn-next').addEventListener('click', () => {
  clickSound.play();
  card.classList.remove('flip');
  card.classList.add('resetting');
  cardBack.textContent = "";
  void card.offsetWidth;

  setTimeout(() => {
    card.classList.remove('resetting');
    flipSound.play();
    const randomCard = getRandomCard();
    cardBack.textContent = randomCard.content;
    cardBack.className = 'card-back ' + randomCard.type;
    card.classList.add('flip');
  }, 50);
});

document.querySelector('.btn-do').addEventListener('click', () => {
  clickSound.play();
  cardBack.className = 'card-back truth';
});

document.querySelector('.btn-penalty').addEventListener('click', () => {
  clickSound.play();
  cardBack.className = 'card-back penalty';
});

card.addEventListener('transitionend', () => {
  if (!card.classList.contains('flip')) {
    cardBack.textContent = '';
  }
});






// ==== Quản lý câu hỏi ====
window.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById('toggle-manager');
  const manager = document.getElementById('question-manager');
  const questionList = document.getElementById('question-list');
  const addBtn = document.getElementById('add-question');
  const newQuestionInput = document.getElementById('new-question');
  const newTypeSelect = document.getElementById('new-type');

  if (!toggleBtn) return;

  toggleBtn.addEventListener('click', () => {
    manager.classList.toggle('hidden');
    renderQuestionList();
  });

  function renderQuestionList() {
    questionList.innerHTML = '';
    cards.forEach((q, index) => {
      const li = document.createElement('li');

      const input = document.createElement('input');
      input.type = 'text';
      input.value = q.content;
      input.className = 'editable';
      input.addEventListener('change', () => {
        cards[index].content = input.value.trim() || cards[index].content;
      });

      const select = document.createElement('select');
      ['truth','penalty'].forEach(t => {
        const opt = document.createElement('option');
        opt.value = t;
        opt.textContent = t;
        if (t == "truth") {
          opt.textContent = "Làm";
        }
        if (t == "penalty") {
          opt.textContent = "Phạt";
        }
        if(q.type === t) opt.selected = true;
        select.appendChild(opt);
      });
      select.addEventListener('change', () => {
        cards[index].type = select.value;
      });

      const delBtn = document.createElement('button');
      delBtn.textContent = 'Xóa';
      delBtn.className = 'btn-delete';
      delBtn.addEventListener('click', () => {
        if (cards.length > 10) {
          cards.splice(index, 1);
          remainingCards = [...cards];
          renderQuestionList();
        } else {
          alert('Tối thiểu 10 câu hỏi');
        }
      });

      li.appendChild(input);
      li.appendChild(select);
      li.appendChild(delBtn);
      questionList.appendChild(li);
    });
  }

  addBtn.addEventListener('click', () => {
    const text = newQuestionInput.value.trim();
    const type = newTypeSelect.value;
    if (!text) return alert('Vui lòng nhập câu hỏi');
    if (cards.length >= 100) return alert('Tối đa 100 câu hỏi');
    cards.push({ type: type, content: text });
    remainingCards = [...cards];
    newQuestionInput.value = '';
    renderQuestionList();
  });
});
