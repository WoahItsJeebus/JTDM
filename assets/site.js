/* ============================================================
   site.js — shared helpers for all pages
   ============================================================ */

import {
	autoMarkActiveTab,
	initAppSettings,
	startOrbBackgroundFromSettings,
} from "https://woahitsjeebus.github.io/JUIL/assets/site.js"

// ── App init ───────────────────────────────────────────
export function initPage(tabName) {
	initAppSettings()
	startOrbBackgroundFromSettings({ spawnEveryMs: 1600, sizeMin: 340, sizeMax: 720 })
	autoMarkActiveTab(tabName)
}

// ── Version badge ──────────────────────────────────────
export function loadVersionBadge(elementId = "versionCode") {
	fetch("./assets/versions.json", { cache: "no-store" })
		.then(r => r.ok ? r.json() : Promise.reject())
		.then(d => { document.getElementById(elementId).textContent = `v${d.current || "?"}` })
		.catch(() => { document.getElementById(elementId).textContent = "v?" })
}

// ── Infinite grid drag logic ──────────────────────────
export function initGridDrag() {
	const surface   = document.getElementById("gridSurface")
	const glow      = document.getElementById("gridGlow")
	const origin    = document.getElementById("gridOrigin")
	const coordPill = document.getElementById("coordPill")

	if (!surface) return

	const CELL = 60
	let offsetX = 0, offsetY = 0
	let dragging = false
	let startX = 0, startY = 0
	let startOX = 0, startOY = 0
	let coordTimer = 0

	function applyTransform() {
		surface.style.transform = `translate(${offsetX}px, ${offsetY}px)`

		const cx = surface.offsetWidth  / 2 + offsetX
		const cy = surface.offsetHeight / 2 + offsetY
		if (glow)   { glow.style.left = `${cx}px`;   glow.style.top = `${cy}px` }
		if (origin) { origin.style.left = `${cx}px`; origin.style.top = `${cy}px` }
	}

	function showCoords() {
		if (!coordPill) return
		const gx = Math.round(-offsetX / CELL)
		const gy = Math.round(-offsetY / CELL)
		coordPill.textContent = `${gx}, ${gy}`
		coordPill.classList.add("visible")
		clearTimeout(coordTimer)
		coordTimer = setTimeout(() => coordPill.classList.remove("visible"), 1200)
	}

	function isInteractive(el) {
		return el && el.closest(".tabBtn, .versionBadge, a, button, input, select, textarea")
	}

	// Pointer events
	document.addEventListener("pointerdown", e => {
		if (e.button !== 0) return
		if (isInteractive(e.target)) return
		e.preventDefault()
		dragging = true
		startX = e.clientX; startY = e.clientY
		startOX = offsetX;  startOY = offsetY
		document.body.classList.add("dragging")
	})

	document.addEventListener("pointermove", e => {
		if (!dragging) return
		offsetX = startOX + (e.clientX - startX)
		offsetY = startOY + (e.clientY - startY)
		applyTransform()
		showCoords()
	})

	document.addEventListener("pointerup", () => {
		if (!dragging) return
		dragging = false
		document.body.classList.remove("dragging")
	})

	// Touch events
	let touchId = null
	document.addEventListener("touchstart", e => {
		if (touchId !== null) return
		if (isInteractive(e.target)) return
		const t = e.changedTouches[0]
		touchId = t.identifier
		startX = t.clientX; startY = t.clientY
		startOX = offsetX;  startOY = offsetY
		dragging = true
		document.body.classList.add("dragging")
	}, { passive: false })

	document.addEventListener("touchmove", e => {
		if (!dragging) return
		for (const t of e.changedTouches) {
			if (t.identifier !== touchId) continue
			e.preventDefault()
			offsetX = startOX + (t.clientX - startX)
			offsetY = startOY + (t.clientY - startY)
			applyTransform()
			showCoords()
		}
	}, { passive: false })

	document.addEventListener("touchend", e => {
		for (const t of e.changedTouches) {
			if (t.identifier !== touchId) continue
			dragging = false
			touchId = null
			document.body.classList.remove("dragging")
		}
	})

	applyTransform()
}