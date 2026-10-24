/* ============================================================
   汉语情感韵律感知实验 / Восприятие эмоциональной просодии
   jsPsych 7.3.4
   ============================================================ */

// ── 1. СТИМУЛЫ ───────────────────────────────────────────────

const SPEAKERS = [1, 2, 3, 4];
const EMOTIONS = [
  { code: "n", target: "neutral" },
  { code: "h", target: "happy"   },
  { code: "a", target: "angry"   },
  { code: "s", target: "sad"     },
];
const TONE_NAMES = {
  "11":"高薇","12":"高怡","13":"高晓","14":"高丽",
  "21":"胡薇","22":"胡怡","23":"胡晓","24":"胡丽",
  "31":"李薇","32":"李怡","33":"李晓","34":"李丽",
  "41":"赵薇","42":"赵怡","43":"赵晓","44":"赵丽",
};

// Все 256 стимулов
const ALL_STIMULI = [];
for (const spk of SPEAKERS) {
  for (const em of EMOTIONS) {
    for (const combo of Object.keys(TONE_NAMES)) {
      ALL_STIMULI.push({
        stimulus_id:    `${spk}_${em.code}_${combo}`,
        audio:          `https://raw.githubusercontent.com/poisonedfrog-alt/experiment/main/audio/${spk}_${em.code}_${combo}.wav`,
        speaker:        spk,
        emotion_code:   em.code,
        emotion_target: em.target,
        tone_combo:     combo,
        name:           TONE_NAMES[combo],
      });
    }
  }
}

// Практические стимулы — берутся из того же корпуса
const PRACTICE_IDS = ["1_n_11","2_h_24","3_a_33","4_s_42"];
const PRACTICE_STIMULI = PRACTICE_IDS.map(id =>
  ALL_STIMULI.find(s => s.stimulus_id === id)
);

// ── 2. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ───────────────────────────────

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function downloadCSV(rows, filename) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const csv = [keys.join(","),
    ...rows.map(r => keys.map(k => JSON.stringify(r[k] ?? "")).join(","))
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ── 3. ИНИЦИАЛИЗАЦИЯ jsPsych ──────────────────────────────────

const jsPsych = initJsPsych({
  on_finish: function() {
    // Данные анкеты
    const surveyData = jsPsych.data.get()
      .filter({ trial_type: "survey-html-form" })
      .values();
    const q = (surveyData.length > 0 && surveyData[0].response) ? surveyData[0].response : {};

    // Аудио-пробы
    const allData = jsPsych.data.get()
      .filter({ trial_type: "audio-button-response" })
      .values();

    const rows = allData.map(d => ({
      participant_id:  participantId,
      stim_version:    "original_loudness",
      stimulus_id:     d.stimulus_id,
      speaker:         d.speaker,
      emotion_code:    d.emotion_code,
      emotion_target:  d.emotion_target,
      tone_combo:      d.tone_combo,
      name:            d.name,
      is_practice:     d.is_practice,
      response:        d.response_label,
      rt:              d.rt,
      time_elapsed:    d.time_elapsed,
      age:             q.age             ?? "",
      gender:          q.gender          ?? "",
      L1:              q.L1              ?? "",
      L1_other:        q.L1_other        ?? "",
      email:           q.email           ?? "",
      contact_consent: q.contact_consent ?? "",
      HSK:             q.HSK             ?? "",
      years_CN:        q.years_CN        ?? "",
      onset_age:       q.onset_age       ?? "",
      music:           q.music           ?? "",
      immersion:       q.immersion       ?? "",
      exposure:        q.exposure        ?? "",
    }));

    downloadCSV(rows, `results_${participantId}.csv`);
  }
});

const participantId = "P_" + Date.now();
jsPsych.data.addProperties({ participant_id: participantId });

// ── 4. ПРЕДЗАГРУЗКА АУДИО ────────────────────────────────────

const preload = {
  type: jsPsychPreload,
  audio: ALL_STIMULI.map(s => s.audio),
  message: "<p>Загрузка аудиофайлов... / 正在加载音频文件...</p>",
  error_message: "<p>Ошибка загрузки. Проверьте папку audio/</p>",
};

// ── 5. ЭКРАНЫ ИНСТРУКЦИИ ─────────────────────────────────────

const welcome = {
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <div class="instruction-text">
      <h2 style="text-align:center">Добро пожаловать! / 欢迎参加实验！</h2>
      <p>Вы принимаете участие в исследовании восприятия эмоциональной просодии китайского языка.</p>
      <p>您正在参与一项关于汉语情感韵律感知的研究。</p>
      <hr>
      <p><b>Инструкция / 指导语：</b></p>
      <p>Вы услышите имя человека, произнесённое с определённой эмоцией.
         Ваша задача — определить, какую эмоцию выражает говорящий, и нажать соответствующую кнопку.</p>
      <p>您将听到一个用某种情感语气朗读的人名。请判断说话人所表达的情感，并点击相应按钮。</p>
      <p>Каждая запись воспроизводится <b>один раз</b>. / 每段录音只播放<b>一次</b>。</p>
      <p>Пожалуйста, используйте <b>наушники</b>. / 请使用<b>耳机</b>。</p>
    </div>`,
  choices: ["Продолжить / 继续"],
};

const practiceIntro = {
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <div class="instruction-text">
      <h3>Тренировочный блок / 练习阶段</h3>
      <p>Сначала вы выполните <b>4 тренировочных задания</b>, чтобы познакомиться с форматом эксперимента.</p>
      <p>首先，您将完成 <b>4 道练习题</b>，以熟悉实验流程。</p>
      <p>После каждого ответа вы увидите, правильно ли вы ответили.</p>
      <p>每次作答后，您将看到答案是否正确。</p>
    </div>`,
  choices: ["Начать тренировку / 开始练习"],
};

const practiceEnd = {
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <div class="instruction-text">
      <h3>Тренировка завершена! / 练习结束！</h3>
      <p>Теперь начнётся основной эксперимент. В нём <b>256 заданий</b>.</p>
      <p>现在开始正式实验，共 <b>256 道题</b>。</p>
      <p>Обратная связь больше не отображается.</p>
      <p>正式实验中将不再显示答案反馈。</p>
      <p>Пожалуйста, отвечайте без пауз — фиксируется время реакции.</p>
      <p>请连续作答，不要中途休息——系统将记录您的反应时间。</p>
    </div>`,
  choices: ["Начать эксперимент / 开始实验"],
};

// ── 6. ФУНКЦИЯ СОЗДАНИЯ АУДИО-ПРОБЫ ──────────────────────────

const EMOTION_LABELS = {
  neutral: { ru: "Нейтральная", zh: "中性" },
  happy:   { ru: "Радость",     zh: "高兴" },
  angry:   { ru: "Злость",      zh: "生气" },
  sad:     { ru: "Печаль",      zh: "悲伤" },
};
const BUTTON_ORDER = ["neutral","happy","angry","sad"];

const isi = {
  type: jsPsychHtmlButtonResponse,
  stimulus: "",
  choices: [],
  trial_duration: 500,
};

function makeAudioTrial(stim, isPractice, index, total) {
  const trial = {
    type: jsPsychAudioButtonResponse,
    stimulus: stim.audio,
    choices: BUTTON_ORDER.map(e =>
      `${EMOTION_LABELS[e].ru}<br>${EMOTION_LABELS[e].zh}`
    ),
    prompt: isPractice
      ? `<p class="trial-counter">Тренировка / 练习</p>`
      : `<p class="trial-counter">${index + 1} / ${total}</p>`,
    response_allowed_while_playing: false,
    trial_ends_after_audio: false,
    data: {
      stimulus_id:    stim.stimulus_id,
      speaker:        stim.speaker,
      emotion_code:   stim.emotion_code,
      emotion_target: stim.emotion_target,
      tone_combo:     stim.tone_combo,
      name:           stim.name,
      is_practice:    isPractice ? 1 : 0,
    },
    on_finish: function(data) {
      const chosen = BUTTON_ORDER[data.response];
      data.response_label = chosen;
      data.is_correct = (chosen === stim.emotion_target) ? 1 : 0;
    }
  };

  if (isPractice) {
    const feedback = {
      type: jsPsychHtmlButtonResponse,
      stimulus: function() {
        const last = jsPsych.data.get().last(1).values()[0];
        const target = EMOTION_LABELS[last.emotion_target];
        return last.is_correct
          ? `<p style="color:green;font-size:22px">✓ Правильно! / 正确！</p>`
          : `<p style="color:#c0392b;font-size:20px">✗ Правильный ответ: <b>${target.ru} / ${target.zh}</b></p>`;
      },
      choices: ["Далее / 下一题"],
      trial_duration: 2500,
      response_ends_trial: true,
    };
    return [trial, feedback, isi];
  }

  return [trial, isi];
}

// ── 7. СБОРКА ПРОБ ────────────────────────────────────────────

const practiceTrials = PRACTICE_STIMULI.flatMap(s =>
  makeAudioTrial(s, true, 0, 4)
);

const shuffledMain = shuffle(ALL_STIMULI);
const mainTrials = shuffledMain.flatMap((stim, i) =>
  makeAudioTrial(stim, false, i, 256)
);

// ── 8. АНКЕТА ─────────────────────────────────────────────────

const questionnaire = {
  type: jsPsychSurveyHtmlForm,
  preamble: `
    <div class="instruction-text">
      <h3>Анкета / 问卷</h3>
      <p>Эксперимент завершён. Пожалуйста, заполните короткую анкету.</p>
      <p>实验已完成。请填写以下简短问卷。</p>
    </div>`,
  html: `
    <div class="form-question">
      <label>1. Возраст / 年龄</label>
      <input type="number" name="age" min="16" max="80" required>
    </div>

    <div class="form-question">
      <label>2. Пол / 性别</label>
      <div class="radio-group">
        <label><input type="radio" name="gender" value="male" required> Мужской / 男</label>
        <label><input type="radio" name="gender" value="female"> Женский / 女</label>
        <label><input type="radio" name="gender" value="other"> Другое / 其他</label>
      </div>
    </div>

    <div class="form-question">
      <label>3. Родной язык / 母语</label>
      <select name="L1" id="q-L1" onchange="handleL1Change(this.value)" required>
        <option value="">— выберите / 请选择 —</option>
        <option value="Russian">Русский</option>
        <option value="Mandarin">普通话 (Путунхуа)</option>
        <option value="Other">Другое / 其他</option>
      </select>
    </div>

    <div class="form-question" id="q-L1-other-block" style="display:none">
      <label>3а. Укажите ваш родной язык / 请注明您的母语</label>
      <input type="text" name="L1_other" id="q-L1-other">
    </div>

    <div class="form-question">
      <label>4. Email (для возможного повторного контакта, добровольно / 自愿填写)</label>
      <input type="email" name="email">
    </div>

    <div class="form-question">
      <label>5. Вы согласны на повторный контакт? / 您是否同意在必要时接受后续联系？</label>
      <div class="radio-group">
        <label><input type="radio" name="contact_consent" value="yes"> Да / 是</label>
        <label><input type="radio" name="contact_consent" value="no"> Нет / 否</label>
      </div>
    </div>

    <div id="ru-block" style="display:none">

      <div class="form-question">
        <label>6. Уровень китайского языка / 汉语水平</label>
        <select name="HSK" id="q-HSK" onchange="handleHSKChange(this.value)">
          <option value="">— выберите / 请选择 —</option>
          <option value="none">Не изучаю / 不学习</option>
          <option value="HSK1">HSK 1</option>
          <option value="HSK2">HSK 2</option>
          <option value="HSK3">HSK 3</option>
          <option value="HSK4">HSK 4</option>
          <option value="HSK5">HSK 5</option>
          <option value="HSK6">HSK 6</option>
          <option value="HSK7-9">HSK 7-9</option>
        </select>
      </div>

      <div id="hsk-detail-block" style="display:none">
        <div class="form-question">
          <label>7. Сколько лет вы изучаете китайский? / 您学习汉语多少年了？</label>
          <input type="number" name="years_CN" min="0" max="30">
        </div>
        <div class="form-question">
          <label>8. С какого возраста начали изучать китайский? / 您从几岁开始学习汉语？</label>
          <input type="number" name="onset_age" min="3" max="60">
        </div>
      </div>

      <div class="form-question">
        <label>9. Опыт систематического музыкального обучения / 系统性音乐训练经历</label>
        <div class="radio-group">
          <label><input type="radio" name="music" value="yes_long"> Да, более 2 лет / 是，超过2年</label>
          <label><input type="radio" name="music" value="yes_short"> Да, менее 2 лет / 是，不足2年</label>
          <label><input type="radio" name="music" value="no"> Нет / 否</label>
        </div>
      </div>

      <div class="form-question">
        <label>10. Жили ли вы в китайскоязычной стране/регионе? / 您是否在中文环境中居住过？</label>
        <div class="radio-group">
          <label><input type="radio" name="immersion" value="no"> Нет / 否</label>
          <label><input type="radio" name="immersion" value="short"> Да, менее 3 месяцев / 是，不足3个月</label>
          <label><input type="radio" name="immersion" value="medium"> Да, 3–6 месяцев / 是，3–6个月</label>
          <label><input type="radio" name="immersion" value="long"> Да, 6 и более месяцев / 是，6个月及以上</label>
        </div>
      </div>

      <div class="form-question">
        <label>11. Как часто вы слышите китайскую речь в повседневной жизни? / 您在日常生活中听到汉语的频率？</label>
        <div class="radio-group">
          <label><input type="radio" name="exposure" value="never"> Почти никогда / 几乎从不</label>
          <label><input type="radio" name="exposure" value="sometimes"> Иногда (несколько раз в месяц) / 偶尔</label>
          <label><input type="radio" name="exposure" value="regularly"> Регулярно (несколько раз в неделю) / 经常</label>
          <label><input type="radio" name="exposure" value="daily"> Ежедневно / 每天</label>
        </div>
      </div>

    </div>
  `,
  button_label: "Завершить / 完成",
  on_load: function() {
    window.handleL1Change = function(val) {
      const ruBlock    = document.getElementById("ru-block");
      const otherBlock = document.getElementById("q-L1-other-block");
      const otherInput = document.getElementById("q-L1-other");
      otherBlock.style.display = (val === "Other") ? "block" : "none";
      otherInput.required = (val === "Other");
      ruBlock.style.display = (val === "Russian") ? "block" : "none";
      if (val !== "Russian") {
        document.getElementById("hsk-detail-block").style.display = "none";
      }
    };
    window.handleHSKChange = function(val) {
      document.getElementById("hsk-detail-block").style.display =
        (!val || val === "none") ? "none" : "block";
    };
  },
};

// ── 9. ФИНАЛЬНЫЙ ЭКРАН ───────────────────────────────────────

const goodbye = {
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <div class="instruction-text" style="text-align:center">
      <h2>Спасибо за участие! / 感谢您的参与！</h2>
      <p>Ваши данные сохранены. / 您的数据已保存。</p>
      <p>Файл с результатами был автоматически загружен на ваш компьютер.</p>
      <p style="color:#888;font-size:14px">Если загрузка не началась, обратитесь к исследователю.</p>
    </div>`,
  choices: ["Скачать результаты / 下载文件"],
  on_finish: function() {
    document.body.innerHTML = `<p style="text-align:center;margin-top:100px;font-size:18px">
      Вы можете закрыть эту вкладку. / 您可以关闭此页面。</p>`;
  }
};

// ── 10. ЗАПУСК ────────────────────────────────────────────────

jsPsych.run([
  preload,
  welcome,
  practiceIntro,
  ...practiceTrials,
  practiceEnd,
  ...mainTrials,
  questionnaire,
  goodbye,
]);
