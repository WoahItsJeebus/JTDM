/* ============================================================
   board.js — entries, sections & localStorage persistence
   ============================================================ */

const STORAGE_KEY = "jtdm-board-items"

// ── Persistence helpers ────────────────────────────────
function loadItems() {
	try {
		const raw = localStorage.getItem(STORAGE_KEY)
		return raw ? JSON.parse(raw) : []
	} catch { return [] }
}

function saveItems(items) {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

let _items = []
let _nextId = 1

function persist() { saveItems(_items) }

// ── DOM builders ───────────────────────────────────────
function createEntryEl(item, surface) {
	const el = document.createElement("div")
	el.className = "board-entry"
	el.dataset.id = item.id
	el.style.left = `${item.x}px`
	el.style.top  = `${item.y}px`

	el.innerHTML =
		`<button class="board-delete" title="Delete">&times;</button>` +
		`<input class="entry-title" value="" placeholder="Title" spellcheck="false">` +
		`<textarea class="entry-text" placeholder="Notes..." spellcheck="false"></textarea>`

	el.querySelector(".entry-title").value = item.title
	el.querySelector(".entry-text").value  = item.text

	// Editable fields → save on change
	el.querySelector(".entry-title").addEventListener("input", e => {
		item.title = e.target.value; persist()
	})
	el.querySelector(".entry-text").addEventListener("input", e => {
		item.text = e.target.value; persist()
	})

	// Delete
	el.querySelector(".board-delete").addEventListener("click", () => {
		_items = _items.filter(i => i.id !== item.id)
		el.remove()
		persist()
	})

	makeDraggable(el, item)
	surface.appendChild(el)
	return el
}

function createSectionEl(item, surface) {
	const el = document.createElement("div")
	el.className = "board-section"
	el.dataset.id = item.id
	el.style.left = `${item.x}px`
	el.style.top  = `${item.y}px`

	el.innerHTML =
		`<button class="board-delete" title="Delete">&times;</button>` +
		`<input class="section-title" value="" placeholder="Section" spellcheck="false">` +
		`<textarea class="section-text" placeholder="Description..." spellcheck="false"></textarea>`

	el.querySelector(".section-title").value = item.title
	el.querySelector(".section-text").value  = item.text

	el.querySelector(".section-title").addEventListener("input", e => {
		item.title = e.target.value; persist()
	})
	el.querySelector(".section-text").addEventListener("input", e => {
		item.text = e.target.value; persist()
	})

	el.querySelector(".board-delete").addEventListener("click", () => {
		_items = _items.filter(i => i.id !== item.id)
		el.remove()
		persist()
	})

	makeDraggable(el, item)
	surface.appendChild(el)
	return el
}

// ── Item dragging (on grid surface) ────────────────────
function makeDraggable(el, item) {
	let dragging = false
	let startX, startY, origLeft, origTop

	function isEditable(target) {
		return target.closest("input, textarea, .board-delete")
	}

	el.addEventListener("pointerdown", e => {
		if (e.button !== 0 || isEditable(e.target)) return
		e.preventDefault()
		e.stopPropagation()
		dragging = true
		el.classList.add("dragging")
		el.setPointerCapture(e.pointerId)
		startX = e.clientX; startY = e.clientY
		origLeft = item.x; origTop = item.y
	})

	el.addEventListener("pointermove", e => {
		if (!dragging) return
		item.x = origLeft + (e.clientX - startX)
		item.y = origTop  + (e.clientY - startY)
		el.style.left = `${item.x}px`
		el.style.top  = `${item.y}px`
	})

	el.addEventListener("pointerup", e => {
		if (!dragging) return
		dragging = false
		el.classList.remove("dragging")
		el.releasePointerCapture(e.pointerId)
		persist()
	})
}

// ── Public init ────────────────────────────────────────
export function initBoard(grid) {
	const surface = grid.surface
	const addBtn  = document.getElementById("addBtn")
	const wrap    = document.getElementById("addBtnWrap")

	// Toggle dropdown
	addBtn.addEventListener("click", e => {
		e.stopPropagation()
		wrap.classList.toggle("open")
	})

	// Close dropdown on outside click
	document.addEventListener("pointerdown", e => {
		if (!wrap.contains(e.target)) wrap.classList.remove("open")
	})

	// Dropdown actions
	const dropdown = document.getElementById("addDropdown")
	dropdown.addEventListener("click", e => {
		const action = e.target.dataset.action
		if (!action) return
		e.stopPropagation()
		wrap.classList.remove("open")

		// Place new item at viewport centre (translate to surface coords)
		const offset = grid.getOffset()
		const cx = (window.innerWidth  / 2) - offset.x - (surface.offsetWidth  / 2)
		const cy = (window.innerHeight / 2) - offset.y - (surface.offsetHeight / 2)

		// Round to nearest half-cell for a tidy default position
		const x = Math.round(cx / 30) * 30
		const y = Math.round(cy / 30) * 30

		const item = {
			id: _nextId++,
			type: action,     // "entry" | "section"
			x, y,
			title: "",
			text: "",
		}

		_items.push(item)
		persist()

		if (action === "entry")   createEntryEl(item, surface)
		if (action === "section") createSectionEl(item, surface)
	})

	// ── Restore saved items ────────────────────────────
	_items = loadItems()
	if (_items.length) _nextId = Math.max(..._items.map(i => i.id)) + 1

	// Sections first (lower z), then entries on top
	_items.filter(i => i.type === "section").forEach(i => createSectionEl(i, surface))
	_items.filter(i => i.type === "entry").forEach(i   => createEntryEl(i, surface))
}
