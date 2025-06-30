const days = ['月', '火', '水', '木', '金', '土', '日'];
const periods = [1, 2, 3, 4, 5, 6];

const unitList = document.getElementById('unit-list');
const addUnitBtn = document.getElementById('add-unit-btn');
const generateBtn = document.getElementById('generate-btn');
const randomBtn = document.getElementById('random-btn');
const timetableSection = document.getElementById('timetable-section');
const timetableContainer = document.getElementById('timetable-container');
const saveBtn = document.getElementById('save-btn');
const unitCountsDiv = document.getElementById('unit-counts');

// 単位設定行を作成
function createUnitRow(unit={}) {
  const row = document.createElement('div');
  row.className = 'unit-row';

  // 単位名
  const unitNameLabel = document.createElement('label');
  unitNameLabel.className = 'unit-label';
  unitNameLabel.textContent = '単位名';
  const unitName = document.createElement('input');
  unitName.type = 'text';
  unitName.placeholder = '例：数学A';
  unitName.value = unit.unitName || '';
  unitNameLabel.append(unitName);

  // 曜日ブロック
  const daysBlock = document.createElement('div');
  daysBlock.className = 'unit-block';
  const daysTitle = document.createElement('div');
  daysTitle.className = 'block-title';
  daysTitle.textContent = '曜日';
  const daysDiv = document.createElement('div');
  daysDiv.className = 'days-checkbox';
  days.forEach((d) => {
    const label = document.createElement('label');
    label.className = 'checkbox-inline';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.value = d;
    if(unit.days && unit.days.includes(d)) cb.checked = true;
    label.append(cb, d);
    daysDiv.append(label);
  });
  daysBlock.append(daysTitle, daysDiv);

  // 時限ブロック
  const periodsBlock = document.createElement('div');
  periodsBlock.className = 'unit-block';
  const periodsTitle = document.createElement('div');
  periodsTitle.className = 'block-title';
  periodsTitle.textContent = '時限';
  const periodsDiv = document.createElement('div');
  periodsDiv.className = 'periods-checkbox';
  periods.forEach((p) => {
    const label = document.createElement('label');
    label.className = 'checkbox-inline';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.value = p;
    if(unit.periods && unit.periods.includes(p)) cb.checked = true;
    label.append(cb, `${p}限`);
    periodsDiv.append(label);
  });
  periodsBlock.append(periodsTitle, periodsDiv);

  // 削除ボタン
  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'remove-btn';
  removeBtn.textContent = '削除';
  removeBtn.onclick = () => { 
    row.remove(); 
    updateUnitCounts();
  };

  // まとまり
  const card = document.createElement('div');
  card.className = 'unit-card';
  card.append(unitNameLabel, daysBlock, periodsBlock, removeBtn);

  row.append(card);
  unitList.append(row);

  // 入力欄更新イベントでカウントを再計算
  row.querySelectorAll('input').forEach(inp => {
    inp.addEventListener('change', updateUnitCounts);
  });
}

addUnitBtn.addEventListener('click', () => createUnitRow());

// 初期値1つ
createUnitRow();

// 単位数カウント用
function getUnitsWithCounts() {
  const units = [];
  for(const row of unitList.children) {
    const unitName = row.querySelector('input[type="text"]');
    const daysDiv = row.querySelector('.days-checkbox');
    const periodsDiv = row.querySelector('.periods-checkbox');
    const checkedDays = Array.from(daysDiv.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
    const checkedPeriods = Array.from(periodsDiv.querySelectorAll('input[type="checkbox"]:checked')).map(cb => Number(cb.value));
    if(!unitName.value || checkedDays.length === 0 || checkedPeriods.length === 0) continue;
    units.push({
      unitName: unitName.value,
      days: checkedDays,
      periods: checkedPeriods,
      count: checkedDays.length * checkedPeriods.length
    });
  }
  return units;
}

// 単位ごとの合計時限数カウント表示
function updateUnitCounts() {
  const units = getUnitsWithCounts();
  if(units.length===0) {
    unitCountsDiv.textContent = "";
    return;
  }
  unitCountsDiv.innerHTML = "";
  units.forEach(u => {
    const span = document.createElement('div');
    span.textContent = `単位「${u.unitName}」: 1週間に${u.count}コマ`;
    unitCountsDiv.appendChild(span);
  });
}

// 入力のたびにカウント更新
updateUnitCounts();

// 通常の時間割生成
generateBtn.addEventListener('click', () => {
  const units = getUnitsWithCounts();
  if(units.length === 0) {
    alert('単位情報を1つ以上入力してください。');
    return;
  }
  let timetable = periods.map(_ => Array(days.length).fill(''));
  for(const unit of units) {
    for(const period of unit.periods) {
      const pIdx = periods.indexOf(period);
      for(const day of unit.days) {
        const dIdx = days.indexOf(day);
        if(timetable[pIdx][dIdx]) {
          timetable[pIdx][dIdx] += `, ${unit.unitName}`;
        } else {
          timetable[pIdx][dIdx] = unit.unitName;
        }
      }
    }
  }
  renderTimetable(timetable);
  timetableSection.style.display = '';
});

// ランダム配置ボタン（曜日や時限関係なく全コマからランダム配置）
randomBtn.addEventListener('click', () => {
  const units = getUnitsWithCounts();
  if(units.length === 0) {
    alert('単位情報を1つ以上入力してください。');
    return;
  }
  // 空の時間割（[period][day]）
  let timetable = periods.map(_ => Array(days.length).fill(''));
  // すべての時限(空きセル)リストを作成
  let slots = [];
  for(let p=0;p<periods.length;p++)
    for(let d=0;d<days.length;d++)
      slots.push({p,d});
  // 配置順をランダムにするためにシャッフル
  function shuffle(arr) {
    for(let i=arr.length-1;i>0;i--) {
      const j = Math.floor(Math.random()*(i+1));
      [arr[i],arr[j]] = [arr[j],arr[i]];
    }
    return arr;
  }
  slots = shuffle(slots);

  // 単位ごとの必要コマ数分だけランダム抽出
  let slotIndex = 0;
  for(const unit of units) {
    for(let c=0; c<unit.count; c++) {
      // 空きセルが足りない場合
      if(slotIndex >= slots.length) {
        alert(`空きコマが足りません。`);
        return;
      }
      let pos = slots[slotIndex++];
      if(timetable[pos.p][pos.d]) {
        timetable[pos.p][pos.d] += `, ${unit.unitName}`;
      } else {
        timetable[pos.p][pos.d] = unit.unitName;
      }
    }
  }
  renderTimetable(timetable);
  timetableSection.style.display = '';
});

function renderTimetable(timetable) {
  let html = '<table class="timetable-table"><thead><tr><th>＼</th>';
  for (let d = 0; d < days.length; d++) {
    html += `<th>${days[d]}</th>`;
  }
  html += '</tr></thead><tbody>';
  for (let p = 0; p < periods.length; p++) {
    html += `<tr><th>${periods[p]}限</th>`;
    for (let d = 0; d < days.length; d++) {
      html += `<td>${timetable[p][d] || ''}</td>`;
    }
    html += '</tr>';
  }
  html += '</tbody></table>';
  timetableContainer.innerHTML = html;
}

// 画像保存
saveBtn.addEventListener('click', () => {
  const table = timetableContainer.querySelector('table');
  if (!table) return;
  html2canvas(table, {backgroundColor: '#fff'}).then(canvas => {
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = 'timetable.png';
    a.click();
  });
});

// 入力時カウント更新
unitList.addEventListener('change', updateUnitCounts);