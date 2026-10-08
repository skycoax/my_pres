// Три варианта стиля. Цвета — шесть hex-цифр без «#».
// chart — порядок цветов для кольцевой диаграммы (проверен на различимость, в т.ч. при дальтонизме).
module.exports = {
  strawberry: {
    name: "Клубничное молоко",
    colors: {
      dk1: "5B3A3A", lt1: "FFFFFF", dk2: "8A6A6A", lt2: "FFEFF4",
      accent1: "D9467A", accent2: "2E9E7E", accent3: "D08A12",
      accent4: "4F86DB", accent5: "8E5FD0", accent6: "F7B8CB",
      hlink: "D9467A", folHlink: "8E5FD0",
    },
    pos: "2E9E7E", neg: "D9467A",
    chart: ["D9467A", "4F86DB", "2E9E7E", "8E5FD0", "D08A12"],
    art: "soft kawaii anime illustration in a 'strawberry milk' palette: pastel pink, cream white and soft cocoa brown, with tiny touches of mint; smooth cel shading, rounded soft-brown line art, rosy blush cheeks, small sparkles and hearts, gentle dreamy light",
  },
  matcha: {
    name: "Матча-латте",
    colors: {
      dk1: "45372F", lt1: "FFFFFF", dk2: "7A6A5E", lt2: "EEF5EA",
      accent1: "4E8F5C", accent2: "E0703F", accent3: "C99A1E",
      accent4: "3F7FB5", accent5: "A2577A", accent6: "BFD9B5",
      hlink: "4E8F5C", folHlink: "A2577A",
    },
    pos: "4E8F5C", neg: "E0703F",
    chart: ["4E8F5C", "E0703F", "3F7FB5", "C99A1E", "A2577A"],
    art: "cozy hand-painted gouache storybook illustration, warm 'matcha latte' palette: soft matcha green, peach, warm latte beige and cocoa; visible soft brush texture, cute chibi proportions, warm afternoon light, Studio-Ghibli-like coziness",
  },
  lavender: {
    name: "Лавандовый сон",
    colors: {
      dk1: "3D3760", lt1: "FFFFFF", dk2: "6E6890", lt2: "F1EEFF",
      accent1: "7A62DE", accent2: "2F9FC8", accent3: "D6A01E",
      accent4: "D9548E", accent5: "2FA383", accent6: "C9BFF7",
      hlink: "7A62DE", folHlink: "D9548E",
    },
    pos: "2FA383", neg: "D9548E",
    chart: ["7A62DE", "D6A01E", "2F9FC8", "D9548E", "2FA383"],
    art: "dreamy kawaii chibi illustration, 'lavender dream' palette: lavender, baby blue, butter yellow and soft pink; glossy sparkling big eyes, fluffy clouds and little stars, soft glow, polished pastel digital art",
  },
};
