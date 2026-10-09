# Кото-кафе «Мурчалка» — каваи-презентация бизнес-плана

| Файл | Что это |
|---|---|
| `Мурчалка_презентация.pptx` | Презентация на 7 слайдов (PowerPoint, можно редактировать) |
| `Мурчалка_презентация.pdf` | Та же презентация в PDF — выглядит одинаково на любом компьютере |
| `Мурчалка_текст_выступления.docx` | Текст к каждому слайду, шпаргалка цифр, расчёты, ответы на вопросы |

**Шрифт.** В презентации используется шрифт Nunito. Если на компьютере его нет, установите файлы
из папки `fonts/` (двойной клик → «Установить»), иначе PowerPoint заменит его на стандартный.

## Как пересобрать

```bash
npm install
node src/numbers.js      # все расчёты: капитал, расходы, безубыточность, окупаемость
node src/build_pptx.js   # презентация
node src/build_docx.js   # Word с текстом
```

Картинки лежат в `assets/` (прозрачные PNG). Новые можно сгенерировать через OpenRouter:
`OPENROUTER_API_KEY=... NODE_USE_ENV_PROXY=1 node src/generate_image.js out.png "prompt"`,
затем вырезать фон: `python3 src/process_images.py sticker in.jpg assets/name.png`.
Ключ в репозитории не хранится.

## Видео: перенос движения (как Higgsfield Motion Transfer)

`src/generate_video.js` берёт движение, камеру и тайминг из видео-референса и подставляет своих людей
через Seedance 2.5 на OpenRouter. Нужны Node 20+ и ffmpeg. 28 сек в 480p — примерно $1.7 за попытку.

```bash
OPENROUTER_API_KEY=... NODE_USE_ENV_PROXY=1 node src/generate_video.js \
  --video reference.mp4 --main main.jpg --crowd crowd.jpg --out result.mp4
```

`--dry-run` показывает запрос и цену, ничего не отправляя. Если модель не примет 28 сек за раз — `--parts 2`.
Если не примет видео в base64 — залей подготовленный референс на хостинг и передай `--video-url`.
Другие опции: `--resolution 720p`, `--aspect 21:9`, `--seed 42`, `--prompt-file prompt.txt`.
