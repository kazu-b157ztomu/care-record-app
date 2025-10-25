// データキー
const staffKey = 'staff';
const residentsKey = 'residents';
const recordsKey = 'records';
let currentResidentId = null;
let currentCategory = 'meal'; // 初期値

function setCategory(type) {
    currentCategory = type;
    filterRecords(type);
}

const typeLabels = {
    meal: '食事',
    water: '水分',
    vital: 'バイタル',
    case: 'ケース',
};

// 初期化
window.onload = () => {
    if (!localStorage.getItem(staffKey)) {
        localStorage.setItem(staffKey, JSON.stringify(['山田太郎', '佐藤花子', '鈴木一郎']));
    }
    renderResidents();
};

// データ取得・保存
function getStaff() {
    return JSON.parse(localStorage.getItem(staffKey) || '[]');
}
function getResidents() {
    return JSON.parse(localStorage.getItem(residentsKey) || '[]');
}
function getRecords() {
    return JSON.parse(localStorage.getItem(recordsKey) || '[]');
}
function saveStaff(data) {
    localStorage.setItem(staffKey, JSON.stringify(data));
}
function saveResidents(data) {
    localStorage.setItem(residentsKey, JSON.stringify(data));
}
function saveRecords(data) {
    localStorage.setItem(recordsKey, JSON.stringify(data));
}

// 利用者追加
function addResident() {
    const name = document.getElementById('name').value;
    const age = parseInt(document.getElementById('age').value);
    if (!name || isNaN(age)) return;
    const residents = getResidents();
    const id = Date.now().toString();
    residents.push({ id, name, age });
    saveResidents(residents);
    document.getElementById('name').value = '';
    document.getElementById('age').value = '';
    renderResidents();
}

// 職員追加
function addStaff() {
    const name = document.getElementById('new-staff').value;
    if (!name) return;
    const staff = getStaff();
    staff.push(name);
    saveStaff(staff);
    document.getElementById('new-staff').value = '';
}

// 利用者一覧表示
function renderResidents() {
    const list = document.getElementById('resident-list');
    list.innerHTML = '';
    getResidents().forEach(r => {
        const div = document.createElement('div');
        div.className = 'card';
        div.innerHTML = `<p>${r.name}（${r.age}歳）</p>
      <button onclick="openResident('${r.id}')">記録を見る・追加する</button>`;
        list.appendChild(div);
    });
}

// 利用者選択時の画面切り替え
function openResident(id) {
    currentResidentId = id;
    document.getElementById('record-section').style.display = 'block';
    document.getElementById('resident-list').style.display = 'none';
    const select = document.getElementById('resident-select');
    select.innerHTML = '';
    getResidents().forEach(r => {
        const opt = document.createElement('option');
        opt.value = r.id;
        opt.textContent = r.name;
        if (r.id === id) opt.selected = true;
        select.appendChild(opt);
    });
    filterRecords('meal'); // 初期表示は食事
}

document.getElementById('resident-select').addEventListener('change', function (e) {
    const selectedId = e.target.value;
    currentResidentId = selectedId;
    filterRecords(currentCategory);
});

// 戻るボタン
function goHome() {
    currentResidentId = null;
    document.getElementById('record-section').style.display = 'none';
    document.getElementById('resident-list').style.display = 'block';
}

// 新規追加フォームの開閉
function toggleForm() {
    const form = document.getElementById('record-form');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
    renderFormFields();
}

// 食事量選択肢のHTML生成（動的フォーム対応）
function renderMealSelect(id, selectedValue) {
    let html = `<select id="${id}">`;

    // 空欄の選択肢を追加
    const emptySelected = !selectedValue ? 'selected' : '';
    html += `<option value="" ${emptySelected}></option>`;

    // 1〜10の選択肢を追加
    for (let i = 1; i <= 10; i++) {
        const selected = i == selectedValue ? 'selected' : '';
        html += `<option value="${i}" ${selected}>${i}</option>`;
    }

    html += `</select>`;
    return html;
}


// 職員選択肢のHTML生成（動的フォーム対応）
function renderStaffSelect(id) {
    const staff = getStaff();
    let html = `<select id="${id}">`;
    staff.forEach(s => {
        html += `<option value="${s}">${s}</option>`;
    });
    html += `</select>`;
    return html;
}

// カテゴリ別記録表示
function filterRecords(type) {
    const records = getRecords().filter(r => r.resident_id === currentResidentId && r.type === type);
    const list = document.getElementById('record-list');
    list.innerHTML = '';

    records.forEach(r => {
        const card = document.createElement('div');
        card.className = 'card';
        card.id = `record-${r.id}`;

        const view = document.createElement('div');
        view.id = `view-${r.id}`;
        const typeLabel = typeLabels[r.type] ?? '記録';
        view.innerHTML = `
        <div class="record-row">
        <span class="record-meta">${typeLabel}｜${r.date}｜${r.staff ?? '不明'}</span>
        <span class="record-data">${renderRecordSummary(r)}</span>
        <span class="record-actions">
        <button onclick="enterEditMode('${r.id}')">編集</button>
        <button onclick="deleteRecord('${r.id}')">削除</button>
        </span>
        </div>
        `;
        const edit = document.createElement('div');
        edit.id = `edit-${r.id}`;
        edit.className = 'hidden';
        edit.innerHTML = `<div class="edit-form">${renderEditFields(r)}</div>` + `
        <button onclick="saveEditedRecord('${r.id}')">保存</button>
        <button onclick="cancelEdit('${r.id}')">キャンセル</button>
        `;

        card.appendChild(view);
        card.appendChild(edit);
        list.appendChild(card);
    });
}

// 表示用の内容生成
function renderRecordSummary(r) {
    if (r.type === 'meal') {
        return `朝:${r.morning} 昼:${r.noon} 夜:${r.night}`;
    } else if (r.type === 'water') {
        return `水分量:${r.amount}ml`;
    } else if (r.type === 'vital') {
        return `体温:${r.temperature}℃ 血圧:${r.blood_pressure} 脈拍:${r.pulse}`;
    } else if (r.type === 'case') {
        return `<p>${r.text}</p>`;
    }
    return '';
}

// 編集モードの入力欄生成
function renderEditFields(r) {
    if (r.type === 'meal') {
        return `
        <label>記録日</label><input type="date" id="edit-date-${r.id}" value="${r.date?.split(' ')[0] ?? ''}" />
        <label>朝食（1＝少ない、10＝多い）</label>${renderMealSelect(`edit-morning-${r.id}`, r.morning)}
        <label>昼食（1＝少ない、10＝多い）</label>${renderMealSelect(`edit-noon-${r.id}`, r.noon)}
        <label>夕食（1＝少ない、10＝多い）</label>${renderMealSelect(`edit-night-${r.id}`, r.night)}
        <label>記録者</label>${renderStaffSelect(`edit-staff-${r.id}`)}
        `;
    } else if (r.type === 'water') {
        return `
        <label>記録日</label><input type="date" id="edit-date-${r.id}" value="${r.date?.split(' ')[0] ?? ''}" />
        <label>水分量（ml）</label><input id="edit-amount-${r.id}" value="${r.amount ?? ''}" />
        <label>記録者</label>${renderStaffSelect(`edit-staff-${r.id}`)}
        `;
    } else if (r.type === 'vital') {
        return `
        <label>記録日</label><input type="date" id="edit-date-${r.id}" value="${r.date?.split(' ')[0] ?? ''}" />
        <label>記録時間</label><input type="text" id="edit-time-${r.id}" value="${r.date?.split(' ')[1] ?? ''}" />
        <label>体温</label><input id="edit-temp-${r.id}" value="${r.temperature ?? ''}" />
        <label>血圧</label><input id="edit-bp-${r.id}" value="${r.blood_pressure ?? ''}" />
        <label>脈拍</label><input id="edit-pulse-${r.id}" value="${r.pulse ?? ''}" />
        <label>記録者</label>${renderStaffSelect(`edit-staff-${r.id}`)}
        `;
    } else if (r.type === 'case') {
        return `
        <label>記録日</label><input type="date" id="edit-date-${r.id}" value="${r.date?.split(' ')[0] ?? ''}" />
        <label>記録時間</label><input type="text" id="edit-time-${r.id}" value="${r.date?.split(' ')[1] ?? ''}" />
        <label>記録内容</label><textarea id="edit-text-${r.id}">${r.text ?? ''}</textarea>
        <label>記録者</label>${renderStaffSelect(`edit-staff-${r.id}`)}
        `;
    }
    return '';
}

// 編集モード切り替え
function enterEditMode(id) {
    document.getElementById(`view-${id}`).classList.add('hidden');
    document.getElementById(`edit-${id}`).classList.remove('hidden');
}

function cancelEdit(id) {
    document.getElementById(`edit-${id}`).classList.add('hidden');
    document.getElementById(`view-${id}`).classList.remove('hidden');
}

//削除ボタン
function deleteRecord(id) {
    const confirmDelete = confirm('この記録を削除してもよろしいですか？');
    if (!confirmDelete) return;
    const records = getRecords();
    const updatedRecords = records.filter(r => r.id !== id);
    saveRecords(updatedRecords);
    filterRecords(currentCategory); // または filterRecords(type)
}
// 編集保存処理
function saveEditedRecord(id) {
    const records = getRecords();
    const index = records.findIndex(r => r.id === id);
    if (index === -1) return;

    const r = records[index];
    const dateInput = document.getElementById(`edit-date-${id}`).value;
    let date = dateInput;

    if (r.type === 'vital' || r.type === 'case') {
        const timeInput = document.getElementById(`edit-time-${id}`).value;
        date = `${dateInput} ${timeInput}`;
    }
    r.date = date;

    if (r.type === 'meal') {
        r.morning = document.getElementById(`edit-morning-${id}`).value;
        r.noon = document.getElementById(`edit-noon-${id}`).value;
        r.night = document.getElementById(`edit-night-${id}`).value;
        r.staff = document.getElementById(`edit-staff-${id}`).value;
    } else if (r.type === 'water') {
        r.amount = document.getElementById(`edit-amount-${id}`).value;
        r.staff = document.getElementById(`edit-staff-${id}`).value;
    } else if (r.type === 'vital') {
        r.temperature = document.getElementById(`edit-temp-${id}`).value;
        r.blood_pressure = document.getElementById(`edit-bp-${id}`).value;
        r.pulse = document.getElementById(`edit-pulse-${id}`).value;
        r.staff = document.getElementById(`edit-staff-${id}`).value;
    } else if (r.type === 'case') {
        r.text = document.getElementById(`edit-text-${id}`).value;
        r.staff = document.getElementById(`edit-staff-${id}`).value;
    }

    saveRecords(records);
    filterRecords(r.type);
}

// 新規記録フォームの内容生成
function renderFormFields() {
    const type = document.getElementById('record-type').value;
    const container = document.getElementById('form-fields');
    container.innerHTML = '';

    if (type === 'meal') {
        container.innerHTML = `
        <label for="record-date">記録日</label>
        <input type="date" id="record-date" />
        <label>朝食（1＝少ない、10＝多い）</label>${renderMealSelect('meal-morning')}
        <label>昼食（1＝少ない、10＝多い）</label>${renderMealSelect('meal-noon')}
        <label>夕食（1＝少ない、10＝多い）</label>${renderMealSelect('meal-night')}
        <label>記録者</label>${renderStaffSelect('meal-staff')}
        `;
    } else if (type === 'water') {
        container.innerHTML = `
        <label for="record-date">記録日</label>
        <input type="date" id="record-date" />
        <label>水分量（ml）</label><input id="water-amount" />
        <label>記録者</label>${renderStaffSelect('water-staff')}
        `;
    } else if (type === 'vital') {
        container.innerHTML = `
        <label for="record-date">記録日</label>
        <input type="date" id="record-date" />
        <label for="record-time">記録時間</label>
        <input type="text" id="record-time" placeholder="例：08:30 または 午前8時半" />
        <label>体温</label><input id="vital-temp" />
        <label>血圧</label><input id="vital-bp" />
        <label>脈拍</label><input id="vital-pulse" />
        <label>記録者</label>${renderStaffSelect('vital-staff')}
        `;
    } else if (type === 'case') {
        container.innerHTML = `
        <label for="record-date">記録日</label>
        <input type="date" id="record-date" />
        <label for="record-time">記録時間</label>
        <input type="text" id="record-time" placeholder="例：08:30 または 午前8時半" />
        <label>記録内容</label><textarea id="case-text"></textarea>
        <label>記録者</label>${renderStaffSelect('case-staff')}
        `;
    }
    const dateField = document.getElementById('record-date');
    if (dateField) {
        dateField.value = new Date().toISOString().split('T')[0];
    }
}

// 新規記録保存
function saveNewRecord() {
    const type = document.getElementById('record-type').value;
    const id = Date.now().toString();
    const resident_id = document.getElementById('resident-select').value;
    const dateInput = document.getElementById('record-date').value;
    let date = dateInput;
    if (type === 'vital' || type === 'case') {
        const timeInput = document.getElementById('record-time').value;
        date = `${dateInput} ${timeInput}`; // 日付＋時間
    }
    let record = { id, resident_id, date, type };
    record.date = date;


    if (type === 'meal') {
        record.morning = document.getElementById('meal-morning').value;
        record.noon = document.getElementById('meal-noon').value;
        record.night = document.getElementById('meal-night').value;
        record.staff = document.getElementById('meal-staff').value;
    } else if (type === 'water') {
        record.amount = document.getElementById('water-amount').value;
        record.staff = document.getElementById('water-staff').value;
    } else if (type === 'vital') {
        record.temperature = document.getElementById('vital-temp').value;
        record.blood_pressure = document.getElementById('vital-bp').value;
        record.pulse = document.getElementById('vital-pulse').value;
        record.staff = document.getElementById('vital-staff').value;
    } else if (type === 'case') {
        record.text = document.getElementById('case-text').value;
        record.staff = document.getElementById('case-staff').value;
    }

    const records = getRecords();
    records.push(record);
    saveRecords(records);

    document.getElementById('record-form').style.display = 'none';
    filterRecords(type);
}
