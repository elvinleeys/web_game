const STAGES = 5;                         // 총 스테이지 수
const MONSTER_EVERY_BY_STAGE = [5, 5, 4, 4, 3]; // 몬스터는 N틱(0.1초)마다 한 칸 이동 (작을수록 빠름)
const COLS = 19, ROWS = 13, CELL = 36;    // 미로 크기는 홀수여야 한다
const terminalsFor = stage => stage + 2;  // 스테이지당 풀어야 할 문제 수
const timeFor = n => 60 + 15 * n;         // 제한 시간(초)

// [분류, 질문, 코드, 정답들, 힌트]. 정답은 소문자·공백·따옴표·꺾쇠·세미콜론을 제거한 뒤 비교
const RAW = [
  ['HTML', '링크를 만드는 태그 이름은?', '<__ href="https://example.com">클릭</__>', ['a'], 'anchor의 첫 글자'],
  ['HTML', '가장 큰 제목을 만드는 태그 이름은?', '<__>안녕하세요</__>', ['h1'], 'heading 1'],
  ['HTML', '이미지를 넣는 태그 이름은?', '<__ src="cat.png">', ['img'], 'image 줄임말'],
  ['HTML', '문단을 만드는 태그 이름은?', '<__>첫 번째 문단</__>', ['p'], 'paragraph의 첫 글자'],
  ['HTML', '순서 없는 목록(점 목록) 태그 이름은?', '<__>\n  <li>사과</li>\n</__>', ['ul'], 'unordered list'],
  ['HTML', '순서 있는 목록(번호 목록) 태그 이름은?', '<__>\n  <li>사과</li>\n</__>', ['ol'], 'ordered list'],
  ['HTML', '줄바꿈 태그 이름은?', '안녕<__>하세요', ['br'], 'break'],
  ['HTML', '가로 구분선 태그 이름은?', '<__>', ['hr'], 'horizontal rule'],
  ['HTML', '글자를 입력받는 태그 이름은?', '<__ type="text">', ['input'], '입력 = ?'],
  ['HTML', '클릭 버튼 태그 이름은?', '<__>누르기</__>', ['button'], '영어로 버튼'],
  ['HTML', '표에서 행(줄)을 만드는 태그 이름은?', '<table>\n  <__>\n    <td>1</td>\n  </__>\n</table>', ['tr'], 'table row'],
  ['HTML', '이미지를 못 불러올 때 보여줄 글자를 지정하는 속성은?', '<img src="a.png" ___="고양이">', ['alt'], 'alternative text'],
  ['HTML', '링크의 이동 주소를 지정하는 속성은?', '<a ___="https://example.com">이동</a>', ['href'], 'hypertext reference'],
  ['HTML', 'CSS 파일을 연결하는 태그 이름은?', '<__ rel="stylesheet" href="style.css">', ['link'], '연결하다'],
  ['HTML', 'JavaScript 파일을 연결하는 태그 이름은?', '<__ src="game.js"></__>', ['script'], '스크립트'],
  ['HTML', 'HTML5 문서 선언의 빈칸은?', '<!DOCTYPE ___>', ['html'], '문서 종류'],
  ['HTML', '영역을 묶는 대표적인 블록 요소 태그 이름은?', '<__>\n  <p>내용</p>\n</__>', ['div'], 'division'],
  ['HTML', '탭에 표시되는 문서 제목 태그 이름은?', '<head>\n  <__>내 페이지</__>\n</head>', ['title'], '제목 = ?'],
  ['HTML', '글자 일부를 묶는 대표적인 인라인 요소 태그 이름은?', '<p>안녕 <__>세상</__></p>', ['span'], '영어로 범위, 폭'],
  ['HTML', '중요한 글자를 강조(굵게)하는 태그 이름은? (하나만)', '<__>중요</__>', ['strong', 'b'], 'b 또는 strong'],

  ['CSS', '글자 색을 바꾸는 CSS 속성은?', 'p {\n  ____: red;\n}', ['color'], 'background-color 말고요'],
  ['CSS', 'id가 door인 요소를 고르는 선택자는?', '____ {\n  display: none;\n}', ['#door'], 'id는 #, class는 .'],
  ['CSS', 'class가 box인 요소를 고르는 선택자는?', '____ {\n  color: red;\n}', ['.box'], 'class는 점(.)'],
  ['CSS', '배경색을 바꾸는 CSS 속성은?', 'div {\n  ____: blue;\n}', ['background-color', 'background'], 'background-...'],
  ['CSS', '글자 크기를 정하는 CSS 속성은?', 'p {\n  ____: 20px;\n}', ['font-size'], 'font-...'],
  ['CSS', '요소 바깥 여백을 만드는 속성은?', 'div {\n  ____: 10px;\n}', ['margin'], 'padding은 안쪽'],
  ['CSS', '요소 안쪽 여백을 만드는 속성은?', 'div {\n  ____: 10px;\n}', ['padding'], 'margin은 바깥쪽'],
  ['CSS', '테두리를 만드는 속성은?', 'div {\n  ____: 1px solid black;\n}', ['border'], '경계'],
  ['CSS', '글자를 가운데 정렬하는 빈칸은?', 'p {\n  text-____: center;\n}', ['align'], '정렬'],
  ['CSS', '요소를 숨기는 display 값은?', 'div {\n  display: ____;\n}', ['none'], '없음'],
  ['CSS', '플렉스 박스를 쓰는 display 값은?', 'div {\n  display: ____;\n}', ['flex'], 'flexible box'],
  ['CSS', 'flex에서 가로 가운데 정렬하는 justify-content 값은?', 'div {\n  display: flex;\n  justify-content: ____;\n}', ['center'], '중앙'],
  ['CSS', '모서리를 둥글게 하는 속성은?', 'div {\n  ____: 10px;\n}', ['border-radius'], 'border-...'],
  ['CSS', '마우스를 올렸을 때의 가상 클래스는?', 'a:____ {\n  color: red;\n}', ['hover'], '맴돌다'],
  ['CSS', '스크롤해도 화면에 고정되는 position 값은?', 'div {\n  position: ____;\n}', ['fixed'], '고정'],
  ['CSS', '요소의 너비를 정하는 속성은?', 'img {\n  ____: 200px;\n}', ['width'], '높이는 height'],
  ['CSS', '글자를 굵게 하는 font-weight 값은?', 'p {\n  font-weight: ____;\n}', ['bold'], '굵은'],
  ['CSS', '요소가 겹칠 때 쌓이는 순서를 정하는 속성은?', 'div {\n  ____: 10;\n}', ['z-index'], 'z축'],
  ['CSS', '투명도를 정하는 속성은?', 'div {\n  ____: 0.5;\n}', ['opacity'], '불투명도'],
  ['CSS', '모든 요소를 선택하는 선택자 기호는?', '____ {\n  margin: 0;\n}', ['*'], '별표'],
  ['CSS', '그림자를 주는 속성은?', 'div {\n  ____: 2px 2px 5px gray;\n}', ['box-shadow'], 'box-...'],
  ['CSS', '링크의 밑줄을 없애는 text-decoration 값은?', 'a {\n  text-decoration: ____;\n}', ['none'], '없음'],

  ['JS', '콘솔에 출력되는 값은?', 'console.log(2 + "3");', ['23'], '문자열과 더하면?'],
  ['JS', '콘솔에 출력되는 값은?', 'let n = 0;\nfor (let i = 1; i <= 3; i++) {\n  n += i;\n}\nconsole.log(n);', ['6'], '1 + 2 + 3'],
  ['JS', '콘솔에 출력되는 값은?', 'console.log(typeof 42);', ['number'], '타입 이름'],
  ['JS', '콘솔에 출력되는 값은?', 'console.log(10 % 3);', ['1'], '나머지'],
  ['JS', '콘솔에 출력되는 값은?', 'console.log([1, 2, 3].length);', ['3'], '배열 길이'],
  ['JS', '콘솔에 출력되는 값은? (소문자로 입력해도 됩니다)', 'console.log("abc".toUpperCase());', ['abc'], '대문자로 변환'],
  ['JS', '콘솔에 출력되는 값은?', 'console.log(3 > 2);', ['true'], '참/거짓'],
  ['JS', '콘솔에 출력되는 값은?', 'console.log("5" - 2);', ['3'], '빼기는 숫자로 변환'],
  ['JS', '콘솔에 출력되는 값은?', 'let a = [1, 2];\na.push(3);\nconsole.log(a.length);', ['3'], 'push는 끝에 추가'],
  ['JS', '콘솔에 출력되는 값은?', 'console.log("hello"[1]);', ['e'], '인덱스는 0부터'],
  ['JS', '콘솔에 출력되는 값은?', 'console.log(typeof "5");', ['string'], '따옴표 안은?'],
  ['JS', '콘솔에 출력되는 값은?', 'console.log(1 + 2 * 3);', ['7'], '곱셈 먼저'],
  ['JS', '콘솔에 출력되는 값은?', 'let a = 5;\na++;\nconsole.log(a);', ['6'], '1 증가'],
  ['JS', '콘솔에 출력되는 값은?', 'console.log([1, 2, 3].map(x => x * 2)[2]);', ['6'], '[2, 4, 6]의 마지막'],
  ['JS', '콘솔에 출력되는 값은?', 'console.log("a" + 1 + 2);', ['a12'], '왼쪽부터 문자열 연결'],
  ['JS', '콘솔에 출력되는 값은?', 'console.log(5 == "5");', ['true'], '== 는 타입 변환'],
  ['JS', '콘솔에 출력되는 값은?', 'console.log(5 === "5");', ['false'], '=== 는 타입까지 비교'],
  ['JS', '값을 다시 대입할 수 없는 변수 선언 키워드는?', '___ PI = 3.14;', ['const'], 'constant'],
  ['JS', '콘솔에 출력되는 값은?', 'console.log(Math.max(1, 9, 4));', ['9'], '최댓값'],
  ['JS', '콘솔에 출력되는 값은?', 'console.log("a,b,c".split(",").length);', ['3'], '쉼표로 나누면 몇 조각?'],
  ['JS', '함수를 선언하는 키워드는?', '___ add(a, b) {\n  return a + b;\n}', ['function'], '기능'],
  ['JS', '콘솔에 출력되는 값은?', 'console.log(!true);', ['false'], '부정'],
  ['JS', '콘솔에 출력되는 값은? (유명한 JS 버그)', 'console.log(typeof null);', ['object'], '역사적 이유로...'],
  ['JS', '콘솔에 출력되는 값은?', 'console.log(0.5 + 0.5);', ['1'], '소수 덧셈'],
  ['JS', '콘솔에 출력되는 값은?', 'let s = 0;\nfor (let i = 0; i < 4; i++) {\n  s += 2;\n}\nconsole.log(s);', ['8'], '2를 4번'],
  ['JS', '콘솔에 출력되는 값은?', 'console.log(Math.floor(7 / 2));', ['3'], '내림'],
];
const ALL = RAW.map(([cat, q, code, answers, hint]) => ({ title: `${cat} 문제`, q, code, answers, hint }));

const $ = id => document.getElementById(id);
const norm = s => s.toLowerCase().replace(/[\s<>"'`;]/g, '');
const shuffle = a => a.sort(() => Math.random() - 0.5);
const canvas = $('map'), ctx = canvas.getContext('2d');
canvas.width = COLS * CELL; canvas.height = ROWS * CELL;

// 랜덤 미로 생성: DFS로 길을 파고, 벽을 몇 군데 더 뚫어 순환 구간(몬스터를 피할 길)을 만든다
// 표시: #벽  S시작  E출구(시작에서 가장 먼 곳)  M몬스터  1~9 코드 단말기
function buildMap(terminals) {
  const m = Array.from({ length: ROWS }, () => Array(COLS).fill('#'));
  const carve = (x, y) => {
    m[y][x] = '.';
    for (const [dx, dy] of shuffle([[2, 0], [-2, 0], [0, 2], [0, -2]])) {
      const nx = x + dx, ny = y + dy;
      if (nx > 0 && ny > 0 && nx < COLS - 1 && ny < ROWS - 1 && m[ny][nx] === '#') { m[y + dy / 2][x + dx / 2] = '.'; carve(nx, ny); }
    }
  };
  carve(1, 1);
  for (let k = 0; k < 14; k++) {
    const x = 1 + Math.floor(Math.random() * (COLS - 2)), y = 1 + Math.floor(Math.random() * (ROWS - 2));
    if (m[y][x] === '#' && ((m[y][x - 1] === '.' && m[y][x + 1] === '.') || (m[y - 1][x] === '.' && m[y + 1][x] === '.'))) m[y][x] = '.';
  }
  const dist = Array.from({ length: ROWS }, () => Array(COLS).fill(-1));
  dist[1][1] = 0;
  const q = [[1, 1]], cells = [];
  while (q.length) {
    const [x, y] = q.shift();
    cells.push([x, y]);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      if (m[y + dy][x + dx] !== '#' && dist[y + dy][x + dx] < 0) { dist[y + dy][x + dx] = dist[y][x] + 1; q.push([x + dx, y + dy]); }
    }
  }
  const [ex, ey] = cells[cells.length - 1];
  const pool = shuffle(cells.filter(([x, y]) => (x !== 1 || y !== 1) && (x !== ex || y !== ey)));
  const mi = Math.max(0, pool.findIndex(([x, y]) => dist[y][x] >= 12));
  const [mx, my] = pool.splice(mi, 1)[0];
  m[1][1] = 'S'; m[ey][ex] = 'E'; m[my][mx] = 'M';
  pool.filter(([x, y]) => dist[y][x] >= 3).slice(0, terminals).forEach(([x, y], i) => { m[y][x] = String(i + 1); });
  return m;
}

let MAP, player, monster, solved, list, deck, time, tick, over, cur, msg, stage;
const find = ch => {
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (MAP[y][x] === ch) return { x, y };
};
const wall = (x, y) => MAP[y]?.[x] === '#' || MAP[y]?.[x] === undefined;
const isTerminal = c => c >= '1' && c <= '9';

function newGame() { deck = shuffle([...ALL]); stage = 1; newStage(); }

function newStage() {
  const n = terminalsFor(stage);
  list = deck.splice(0, n); // 같은 판에서는 문제가 겹치지 않는다
  MAP = buildMap(n);
  player = find('S'); monster = find('M');
  solved = new Set(); time = timeFor(n); tick = 0; over = false;
  msg = '';
  draw();
}

// BFS로 플레이어 방향 첫 걸음 계산
function chase() {
  const prev = new Map([[monster.y * COLS + monster.x, null]]);
  const q = [monster];
  while (q.length) {
    const c = q.shift();
    if (c.x === player.x && c.y === player.y) {
      let n = c;
      while (prev.get(n.y * COLS + n.x) && prev.get(n.y * COLS + n.x) !== monster) n = prev.get(n.y * COLS + n.x);
      return n;
    }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const n = { x: c.x + dx, y: c.y + dy }, nk = n.y * COLS + n.x;
      if (!wall(n.x, n.y) && !prev.has(nk)) { prev.set(nk, c); q.push(n); }
    }
  }
  return monster;
}

function end(text) { over = true; msg = text + ' (R키: 처음부터 다시)'; $('puzzle').close(); draw(); }

function loop() {
  if (over) return; // 문제를 푸는 동안에도 시간·몬스터는 계속 움직인다
  tick++;
  if (tick % 10 === 0) time--;
  if (tick % MONSTER_EVERY_BY_STAGE[Math.min(stage, STAGES) - 1] === 0) monster = chase();
  if (time <= 0) return end('⏰ 시간 초과!');
  if (monster.x === player.x && monster.y === player.y) return end('👹 몬스터에게 잡혔다!');
  draw();
}

function move(dx, dy) {
  if (over || $('puzzle').open) return;
  const x = player.x + dx, y = player.y + dy;
  if (wall(x, y)) return;
  player = { x, y };
  const c = MAP[y][x];
  if (monster.x === x && monster.y === y) return end('👹 몬스터에게 잡혔다!');
  if (isTerminal(c) && !solved.has(+c - 1)) openPuzzle(+c - 1);
  if (c === 'E') {
    if (solved.size < list.length) msg = `🔒 출구가 잠겨 있다. 단말기 ${list.length - solved.size}개를 더 풀어야 한다.`;
    else if (stage < STAGES) { stage++; newStage(); msg = `🎉 스테이지 ${stage - 1} 클리어!`; draw(); return; }
    else return end('🏆 모든 스테이지 탈출 성공!');
  } else msg = '';
  draw();
}

function draw() {
  $('status').textContent = msg || `스테이지 ${stage}/${STAGES} · ⏱ ${time}초 · 🔓 ${solved.size}/${list.length}`;
  ctx.fillStyle = '#222'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.font = `${CELL - 8}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const put = (e, p) => ctx.fillText(e, p.x * CELL + CELL / 2, p.y * CELL + CELL / 2 + 2);
  MAP.forEach((row, y) => row.forEach((c, x) => {
    if (c === '#') { ctx.fillStyle = '#556'; ctx.fillRect(x * CELL, y * CELL, CELL, CELL); }
    else if (c === 'E') put('🚪', { x, y });
    else if (isTerminal(c)) put(solved.has(+c - 1) ? '✅' : '🖥️', { x, y });
  }));
  put('🏃', player);
  put('👹', monster);
}

function openPuzzle(i) {
  cur = i;
  const p = list[i];
  $('title').textContent = p.title;
  $('question').textContent = p.q;
  $('code').textContent = p.code; // textContent라서 태그가 그대로 보임
  $('answer').value = '';
  $('msg').textContent = '';
  $('puzzle').showModal();
  $('answer').focus();
}

function submit() {
  if (list[cur].answers.map(norm).includes(norm($('answer').value))) {
    solved.add(cur);
    $('puzzle').close();
    draw();
  } else $('msg').textContent = '❌ 틀렸습니다. 다시 시도해 보세요.';
}

// 한글 IME가 켜져 있어도 영문으로 입력되도록: 두벌식 자모를 원래 누른 영문 키로 되돌린다
const J = (jamo, keys) => Object.fromEntries([...jamo].map((c, i) => [c, keys.split(' ')[i]]));
const KEY = {
  ...J('ㄱㄲㄳㄴㄵㄶㄷㄸㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅃㅄㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ', 'r R rt s sw sg e E f fr fa fq ft fx fv fg a q Q qt t T d w W c z x v g'),
  ...J('ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ', 'k o i O j p u P h hk ho hl y n nj np nl b m ml l'),
};
const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ', VOW = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ';
const JONG = ['', ...'ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ'];
const toEng = s => [...s].map(ch => {
  const n = ch.charCodeAt(0) - 0xAC00;
  if (n >= 0 && n < 11172) return KEY[CHO[Math.floor(n / 588)]] + KEY[VOW[Math.floor(n % 588 / 28)]] + (KEY[JONG[n % 28]] || '');
  return KEY[ch] ?? ch;
}).join('');
// expected: keydown에서 직접 넣은 값. IME가 같은 키를 또 넣으면(중복 입력) 이 값으로 되돌린다
let expected = null;
$('answer').addEventListener('input', e => {
  if (expected !== null) e.target.value = expected;
  else if (/[ㄱ-ㅣ가-힣]/.test(e.target.value)) e.target.value = toEng(e.target.value);
});
$('answer').addEventListener('keyup', () => { expected = null; });

// 화면 키패드: 키보드/IME 상태와 상관없이 영문·숫자·기호를 입력할 수 있다
[...'1234567890abcdefghijklmnopqrstuvwxyz#.<>/"-*', '⌫'].forEach(k => {
  const b = document.createElement('button');
  b.type = 'button'; b.textContent = k;
  b.onmousedown = e => e.preventDefault(); // 입력창 포커스 유지
  b.onclick = () => { $('answer').value = k === '⌫' ? $('answer').value.slice(0, -1) : $('answer').value + k; };
  $('keys').append(b);
});

$('submit').onclick = submit;
// 물리 키(e.code) 기준으로 직접 입력: 한/영 상태와 상관없이 영문·숫자·기호가 모두 입력된다
const SYM = { Minus: '-_', Equal: '=+', BracketLeft: '[{', BracketRight: ']}', Semicolon: ';:', Quote: `'"`, Comma: ',<', Period: '.>', Slash: '/?', Backslash: '\\|', Backquote: '`~', Space: '  ' };
const SHIFT_DIGIT = ')!@#$%^&*(';
$('answer').onkeydown = e => {
  if (e.key === 'Enter') return submit();
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  let ch;
  if (/^Key[A-Z]$/.test(e.code)) ch = e.shiftKey ? e.code[3] : e.code[3].toLowerCase();
  else if (/^Digit\d$/.test(e.code)) ch = e.shiftKey ? SHIFT_DIGIT[e.code[5]] : e.code[5];
  else if (SYM[e.code]) ch = SYM[e.code][+e.shiftKey];
  if (!ch) return; // Backspace, 방향키 등은 기본 동작 사용
  e.preventDefault();
  e.target.setRangeText(ch, e.target.selectionStart, e.target.selectionEnd, 'end');
  expected = e.target.value;
};
$('hint').onclick = () => { $('msg').textContent = '💡 ' + list[cur].hint; };
$('close').onclick = () => $('puzzle').close();

const DIRS = { arrowup: [0, -1], w: [0, -1], arrowdown: [0, 1], s: [0, 1], arrowleft: [-1, 0], a: [-1, 0], arrowright: [1, 0], d: [1, 0] };
document.addEventListener('keydown', e => {
  if ($('puzzle').open) return;
  const k = e.key.toLowerCase();
  if (k === 'r') return newGame();
  if (DIRS[k]) { e.preventDefault(); move(...DIRS[k]); }
});

newGame();
setInterval(loop, 100);
